import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

const modal=document.getElementById('poseModal');
const canvas=document.getElementById('poseCanvas');
const viewport=document.getElementById('viewport3d');
const status=document.getElementById('poseStatus');
let renderer,scene,camera,vrm,model,modelHeight=1.7,groundY=0,raf,opened=false,loading=null;
let avatarCenter=new THREE.Vector3(),lastFrame=performance.now();
let yaw=.35,pitch=.04,distance=4.5,orbitDrag=null,ikDrag=null,currentPreset='neutral';
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),dragPlane=new THREE.Plane(),planeHit=new THREE.Vector3();
const targets={},chains={},baseRotations=new Map(),clothMaterials=[];
const rigSide={left:1,right:-1};

const presetMap={
  neutral:{lh:[.29,.46,.03],rh:[.29,.46,.03],lf:[.09,.035,.07],rf:[.09,.035,.07],body:{}},
  hero:{lh:[.34,.50,.02],rh:[.21,.73,.10],lf:[.11,.035,.02],rf:[.13,.045,.14],body:{hips:[0,.12,-.04],spine:[-.04,-.08,.05],chest:[-.05,-.08,.05],head:[.03,.05,-.02]}},
  action:{lh:[.28,.66,.30],rh:[.18,.57,.40],lf:[.16,.05,.16],rf:[.17,.08,-.10],body:{hips:[-.12,.26,-.10],spine:[-.12,-.18,.10],chest:[-.10,-.12,.08],head:[.05,-.10,-.04]}},
  run:{lh:[.24,.60,-.28],rh:[.23,.64,.32],lf:[.14,.08,.32],rf:[.13,.22,-.24],body:{hips:[.20,-.12,.08],spine:[.20,.15,-.08],chest:[.12,.08,-.04],head:[-.08,-.05,.02]}},
  guard:{lh:[.21,.65,.30],rh:[.21,.68,.34],lf:[.16,.045,.18],rf:[.17,.065,-.08],body:{hips:[-.08,.02,.04],spine:[-.10,0,.02],chest:[-.08,0,.02],head:[.03,0,0]}},
  wave:{lh:[.34,.48,.01],rh:[.24,.88,.04],lf:[.10,.035,.05],rf:[.12,.045,.09],body:{hips:[0,-.10,.03],spine:[0,-.10,.04],chest:[0,-.08,.05],head:[0,.12,-.04]}}
};

function setStatus(message,type='loading'){
  status.className='pose-status'+(type==='ready'?' ready':type==='error'?' error':'');
  status.querySelector('b').textContent=message;
}
function setupScene(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  scene=new THREE.Scene();scene.background=null;camera=new THREE.PerspectiveCamera(30,1,.05,50);
  scene.add(new THREE.HemisphereLight(0xffffff,0x25283a,2.4));
  const key=new THREE.DirectionalLight(0xffe1a1,3.1);key.position.set(3,5,4);key.castShadow=true;scene.add(key);
  const rim=new THREE.DirectionalLight(0x729bff,2);rim.position.set(-4,3,-3);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.35,64),new THREE.MeshStandardMaterial({color:0x242421,roughness:1,transparent:true,opacity:.8}));floor.name='studio-floor';floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(4,20,0x6b5b34,0x343432);grid.name='studio-grid';scene.add(grid);
}
async function loadAvatar(){
  const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
  const gltf=await new Promise((resolve,reject)=>loader.load('models/akira.vrm',resolve,event=>{if(event.total)setStatus(`Cargando avatar VRM · ${Math.round(event.loaded/event.total*100)}%`)},reject));
  vrm=gltf.userData.vrm;if(!vrm)throw new Error('El archivo no contiene un avatar VRM válido.');
  model=vrm.scene;scene.add(model);model.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(material=>{if(material.color&&!material.userData.originalColor)material.userData.originalColor=material.color.clone();if(material.name.includes('_CLOTH')&&!clothMaterials.includes(material))clothMaterials.push(material)})});
  const box=new THREE.Box3().setFromObject(model);modelHeight=box.max.y-box.min.y;groundY=box.min.y;model.position.y-=groundY;groundY=0;avatarCenter=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  buildRig();createTargets();applyPreset('neutral');applyOutline();resize();setStatus('', 'ready');
}
function bone(name){return vrm.humanoid.getNormalizedBoneNode(name)}
function buildRig(){
  chains.leftHand=['leftUpperArm','leftLowerArm','leftHand'].map(bone);
  chains.rightHand=['rightUpperArm','rightLowerArm','rightHand'].map(bone);
  chains.leftFoot=['leftUpperLeg','leftLowerLeg','leftFoot'].map(bone);
  chains.rightFoot=['rightUpperLeg','rightLowerLeg','rightFoot'].map(bone);
  Object.values(chains).flat().forEach(node=>{if(node&&!baseRotations.has(node))baseRotations.set(node,node.quaternion.clone())});
  ['hips','spine','chest','upperChest','neck','head'].map(bone).filter(Boolean).forEach(node=>{if(!baseRotations.has(node))baseRotations.set(node,node.quaternion.clone())});
  model.updateMatrixWorld(true);
  const left=bone('leftHand')?.getWorldPosition(new THREE.Vector3());
  const right=bone('rightHand')?.getWorldPosition(new THREE.Vector3());
  if(left&&right){rigSide.left=Math.sign(left.x-avatarCenter.x)||1;rigSide.right=Math.sign(right.x-avatarCenter.x)||-rigSide.left}
}
function createTargets(){
  const handMat=new THREE.MeshBasicMaterial({color:0xf3b61f,depthTest:false,transparent:true,opacity:.95});
  const footMat=new THREE.MeshBasicMaterial({color:0x6f9fec,depthTest:false,transparent:true,opacity:.95});
  for(const name of Object.keys(chains)){const sphere=new THREE.Mesh(new THREE.SphereGeometry(modelHeight*.025,20,14),name.includes('Hand')?handMat:footMat);sphere.name='ik-'+name;sphere.renderOrder=50;const ring=new THREE.Mesh(new THREE.TorusGeometry(modelHeight*.038,modelHeight*.006,8,24),sphere.material);ring.rotation.x=Math.PI/2;sphere.add(ring);targets[name]=sphere;scene.add(sphere)}
}
function resetBones(){baseRotations.forEach((q,node)=>node.quaternion.copy(q));model.updateMatrixWorld(true)}
function presetPoint(values,side){return new THREE.Vector3(avatarCenter.x+rigSide[side]*values[0]*modelHeight,groundY+values[1]*modelHeight,avatarCenter.z+values[2]*modelHeight)}
function applyBodyPose(body={}){Object.entries(body).forEach(([name,rotation])=>{const node=bone(name);const base=node&&baseRotations.get(node);if(node&&base)node.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation,'XYZ')))})}
function applyPreset(name){
  currentPreset=name;const p=presetMap[name];if(!p||!vrm)return;resetBones();
  applyBodyPose(p.body);model.updateMatrixWorld(true);
  targets.leftHand.position.copy(presetPoint(p.lh,'left'));targets.rightHand.position.copy(presetPoint(p.rh,'right'));targets.leftFoot.position.copy(presetPoint(p.lf,'left'));targets.rightFoot.position.copy(presetPoint(p.rf,'right'));
  document.querySelectorAll('#posePresets button').forEach(button=>button.classList.toggle('active',button.dataset.preset===name));resetIKSliders();solveAll();
}
function rotateBoneToward(node,currentDirection,desiredDirection){
  if(currentDirection.lengthSq()<1e-8||desiredDirection.lengthSq()<1e-8)return;
  const delta=new THREE.Quaternion().setFromUnitVectors(currentDirection.normalize(),desiredDirection.normalize());
  const desiredWorld=delta.multiply(node.getWorldQuaternion(new THREE.Quaternion()));
  const parentInverse=node.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  node.quaternion.copy(parentInverse.multiply(desiredWorld)).normalize();
}
function poleFor(name,root,target){
  const side=name.startsWith('left')?'left':'right';const isHand=name.endsWith('Hand');
  const pole=presetPoint([isHand?.43:.14,isHand?.50:.28,isHand?-.18:.30],side);
  const axis=target.clone().sub(root).normalize();const offset=pole.sub(root);
  const projected=offset.addScaledVector(axis,-offset.dot(axis));
  if(projected.lengthSq()<1e-8)projected.set(rigSide[side],0,isHand?-1:1);
  return projected.normalize();
}
function solveChain(name,nodes,target){
  if(nodes.some(node=>!node))return;
  const [root,middle,end]=nodes;model.updateMatrixWorld(true);
  const rootPos=root.getWorldPosition(new THREE.Vector3()),middlePos=middle.getWorldPosition(new THREE.Vector3()),endPos=end.getWorldPosition(new THREE.Vector3());
  const upperLength=rootPos.distanceTo(middlePos),lowerLength=middlePos.distanceTo(endPos);
  const toTarget=target.clone().sub(rootPos);const minReach=Math.abs(upperLength-lowerLength)+1e-4,maxReach=upperLength+lowerLength-1e-4;
  const distance=THREE.MathUtils.clamp(toTarget.length(),minReach,maxReach),direction=toTarget.normalize();
  const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance);
  const bend=Math.sqrt(Math.max(upperLength*upperLength-along*along,0));
  const desiredMiddle=rootPos.clone().addScaledVector(direction,along).addScaledVector(poleFor(name,rootPos,target),bend);
  rotateBoneToward(root,middlePos.clone().sub(rootPos),desiredMiddle.clone().sub(rootPos));model.updateMatrixWorld(true);
  const updatedMiddle=middle.getWorldPosition(new THREE.Vector3()),updatedEnd=end.getWorldPosition(new THREE.Vector3());
  const reachableTarget=rootPos.clone().addScaledVector(direction,distance);
  rotateBoneToward(middle,updatedEnd.sub(updatedMiddle),reachableTarget.sub(updatedMiddle));model.updateMatrixWorld(true);
}
function solveAll(){Object.entries(chains).forEach(([name,nodes])=>solveChain(name,nodes,targets[name].position));vrm?.update(0);render()}
function resetIKSliders(){['ikLeftHandY','ikRightHandY','ikLeftFootZ','ikRightFootZ'].forEach(id=>document.getElementById(id).value=0)}
function sliderMove(id,value){const amount=value/100*modelHeight*.22;if(id==='ikLeftHandY')targets.leftHand.position.y+=amount;if(id==='ikRightHandY')targets.rightHand.position.y+=amount;if(id==='ikLeftFootZ')targets.leftFoot.position.z+=amount;if(id==='ikRightFootZ')targets.rightFoot.position.z+=amount;currentPreset='personalizada';document.querySelectorAll('#posePresets button').forEach(b=>b.classList.remove('active'));solveAll()}
function applyOutfit(name){clothMaterials.forEach(material=>{if(!material.color)return;if(name==='original')material.color.copy(material.userData.originalColor);else material.color.set(name==='amber'?0xe1a72b:0x202126);material.needsUpdate=true});document.querySelectorAll('#wardrobe button').forEach(b=>b.classList.toggle('active',b.dataset.outfit===name));render()}
function applyOutline(){if(!model)return;const enabled=document.getElementById('outlineToggle').checked;model.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if('outlineWidthFactor'in material){material.outlineWidthFactor=enabled?0.004:0;material.needsUpdate=true}})});render()}
function cameraUpdate(){const targetY=modelHeight*.52;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance+targetY,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,targetY,0);render()}
function render(){if(renderer&&scene&&camera){const now=performance.now();vrm?.update(Math.min((now-lastFrame)/1000,.05));lastFrame=now;renderer.render(scene,camera)}}
function animate(){raf=requestAnimationFrame(animate);if(opened)render()}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();cameraUpdate()}
async function init(){if(renderer&&vrm)return;setupScene();resize();loading=loadAvatar();await loading;animate()}
function pointerCoords(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)}
function close(){modal.hidden=true;document.body.style.overflow='';opened=false}

window.addEventListener('pose3d:open',async()=>{opened=true;setStatus('Cargando estudio VRM…');try{await init();setStatus('','ready');setTimeout(resize,30)}catch(error){opened=false;setStatus('No fue posible cargar el avatar VRM. Puedes cerrar esta ventana y continuar con el editor.','error');console.error(error)}});
window.addEventListener('pose3d:close',()=>{opened=false});
document.querySelectorAll('#posePresets button').forEach(button=>button.onclick=()=>applyPreset(button.dataset.preset));
const sliderBases={};['ikLeftHandY','ikRightHandY','ikLeftFootZ','ikRightFootZ'].forEach(id=>{const input=document.getElementById(id);input.onpointerdown=()=>{sliderBases[id]=+input.value};input.oninput=()=>{const delta=+input.value-(sliderBases[id]??0);sliderBases[id]=+input.value;sliderMove(id,delta)}});
document.querySelectorAll('#wardrobe button').forEach(button=>button.onclick=()=>applyOutfit(button.dataset.outfit));
document.querySelectorAll('[data-camera]').forEach(button=>button.onclick=()=>{yaw=button.dataset.camera==='front'?0:button.dataset.camera==='profile'?Math.PI/2:.58;pitch=.04;cameraUpdate()});
document.getElementById('outlineToggle').onchange=applyOutline;
document.getElementById('resetPose3d').onclick=()=>{yaw=.35;pitch=.04;distance=Math.max(3.5,modelHeight*2.55);applyOutfit('original');applyPreset('neutral');cameraUpdate()};
canvas.addEventListener('pointerdown',event=>{if(!vrm)return;pointerCoords(event);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(Object.values(targets),false)[0];if(hit){ikDrag=hit.object;dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),ikDrag.position)}else orbitDrag={x:event.clientX,y:event.clientY,yaw,pitch};canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(ikDrag){pointerCoords(event);raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(dragPlane,planeHit)){ikDrag.position.copy(planeHit);currentPreset='personalizada';document.querySelectorAll('#posePresets button').forEach(b=>b.classList.remove('active'));solveAll()}return}if(!orbitDrag)return;yaw=orbitDrag.yaw-(event.clientX-orbitDrag.x)*.008;pitch=Math.max(-.45,Math.min(.55,orbitDrag.pitch+(event.clientY-orbitDrag.y)*.006));cameraUpdate()});
canvas.addEventListener('pointerup',()=>{ikDrag=null;orbitDrag=null});canvas.addEventListener('pointercancel',()=>{ikDrag=null;orbitDrag=null});canvas.addEventListener('wheel',event=>{event.preventDefault();distance=Math.max(modelHeight*1.65,Math.min(modelHeight*4.5,distance+event.deltaY*.006));cameraUpdate()},{passive:false});
document.getElementById('applyPose3d').onclick=()=>{if(!renderer||!vrm)return;const hidden=[];scene.traverse(object=>{if(object.name.startsWith('ik-')||object.name.startsWith('studio-')){hidden.push([object,object.visible]);object.visible=false}});render();const image=canvas.toDataURL('image/png');hidden.forEach(([object,visible])=>object.visible=visible);render();window.dispatchEvent(new CustomEvent('pose3d:apply',{detail:{image,name:currentPreset}}));close()};
window.addEventListener('resize',resize);
