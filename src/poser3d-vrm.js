import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { solveTwoBoneGeometry } from './ik-math.js';
import { POSE_PRESETS, POSE_SCHEMA_VERSION } from './pose-presets.js';

const modal=document.getElementById('poseModal');
const canvas=document.getElementById('poseCanvas');
const viewport=document.getElementById('viewport3d');
const status=document.getElementById('poseStatus');
let renderer,scene,camera,vrm,model,modelHeight=1.7,groundY=0,raf,opened=false,loading=null;
let avatarCenter=new THREE.Vector3(),lastFrame=performance.now();
let frameCount=0,fpsWindow=performance.now(),qualityLabel='Calidad alta';
let yaw=.35,pitch=.04,distance=4.5,orbitDrag=null,ikDrag=null,currentPreset='neutral',skeletonHelper=null;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),dragPlane=new THREE.Plane(),planeHit=new THREE.Vector3();
const targets={},chains={},baseRotations=new Map(),clothMaterials=[];
const rigSide={left:1,right:-1};
const targetBases={},footLocks={leftFoot:false,rightFoot:false};
let activeBody={},activePoles={arms:-.18,legs:.30},bodyAdjustments={hipsY:0,spineX:0,chestX:0,headY:0},poseTween=0;
const lowPower=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;

function setStatus(message,type='loading'){
  status.className='pose-status'+(type==='ready'?' ready':type==='error'?' error':'');
  status.querySelector('b').textContent=message;
}
function setupScene(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1:2));renderer.shadowMap.enabled=!lowPower;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  qualityLabel=lowPower?'Calidad eficiente':'Calidad alta';document.getElementById('qualityState').textContent=qualityLabel;
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
  document.getElementById('rigState').innerHTML=`<i></i> VRM ${vrm.meta?.metaVersion||'compatible'} · IK anatómico`;
  model=vrm.scene;scene.add(model);model.traverse(object=>{if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(material=>{if(material.color&&!material.userData.originalColor)material.userData.originalColor=material.color.clone();if(material.name.includes('_CLOTH')&&!clothMaterials.includes(material))clothMaterials.push(material)})});
  const box=new THREE.Box3().setFromObject(model);modelHeight=box.max.y-box.min.y;groundY=box.min.y;model.position.y-=groundY;groundY=0;avatarCenter=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  buildRig();createTargets();skeletonHelper=new THREE.SkeletonHelper(model);skeletonHelper.visible=false;skeletonHelper.name='studio-skeleton';scene.add(skeletonHelper);applyPreset('neutral');applyOutline();resize();setStatus('', 'ready');
}
function bone(name){return vrm.humanoid.getNormalizedBoneNode(name)}
function buildRig(){
  chains.leftHand=['leftUpperArm','leftLowerArm','leftHand'].map(bone);
  chains.rightHand=['rightUpperArm','rightLowerArm','rightHand'].map(bone);
  chains.leftFoot=['leftUpperLeg','leftLowerLeg','leftFoot'].map(bone);
  chains.rightFoot=['rightUpperLeg','rightLowerLeg','rightFoot'].map(bone);
  const missing=Object.entries(chains).flatMap(([chain,nodes])=>nodes.map((node,index)=>node?null:`${chain}:${index}`).filter(Boolean));
  if(missing.length)throw new Error(`El avatar no incluye todos los huesos humanoides requeridos (${missing.join(', ')}).`);
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
  const labels={leftHand:'Mano izquierda',rightHand:'Mano derecha',leftFoot:'Pie izquierdo',rightFoot:'Pie derecho'};
  for(const name of Object.keys(chains)){const sphere=new THREE.Mesh(new THREE.SphereGeometry(modelHeight*.025,20,14),name.includes('Hand')?handMat:footMat);sphere.name='ik-'+name;sphere.userData.label=labels[name];sphere.renderOrder=50;const ring=new THREE.Mesh(new THREE.TorusGeometry(modelHeight*.038,modelHeight*.006,8,24),sphere.material);ring.rotation.x=Math.PI/2;sphere.add(ring);targets[name]=sphere;scene.add(sphere)}
}
function resetBones(){baseRotations.forEach((q,node)=>node.quaternion.copy(q));model.updateMatrixWorld(true)}
function presetPoint(values,side){return new THREE.Vector3(avatarCenter.x+rigSide[side]*values[0]*modelHeight,groundY+values[1]*modelHeight,avatarCenter.z+values[2]*modelHeight)}
function effectiveBody(){const body=structuredClone(activeBody);for(const name of ['hips','spine','chest','head'])if(!body[name])body[name]=[0,0,0];body.hips[1]+=bodyAdjustments.hipsY;body.spine[0]+=bodyAdjustments.spineX;body.chest[0]+=bodyAdjustments.chestX;body.head[1]+=bodyAdjustments.headY;return body}
function applyBodyPose(body={}){Object.entries(body).forEach(([name,rotation])=>{const node=bone(name);const base=node&&baseRotations.get(node);if(node&&base)node.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation,'XYZ')))})}
function captureTargetBases(){Object.entries(targets).forEach(([name,target])=>targetBases[name]=target.position.clone())}
function applyPreset(name){
  currentPreset=name;const p=POSE_PRESETS[name];if(!p||!vrm)return;activeBody=structuredClone(p.body);activePoles={...p.poles};bodyAdjustments={hipsY:0,spineX:0,chestX:0,headY:0};
  targets.leftHand.position.copy(presetPoint(p.targets.lh,'left'));targets.rightHand.position.copy(presetPoint(p.targets.rh,'right'));targets.leftFoot.position.copy(presetPoint(p.targets.lf,'left'));targets.rightFoot.position.copy(presetPoint(p.targets.rf,'right'));captureTargetBases();
  document.querySelectorAll('#posePresets button').forEach(button=>button.classList.toggle('active',button.dataset.preset===name));resetIKSliders();solveAll();
}
function transitionPreset(name){
  const p=POSE_PRESETS[name];if(!p||!vrm)return;const token=++poseTween,start=performance.now(),duration=240;
  const fromTargets=Object.fromEntries(Object.entries(targets).map(([key,target])=>[key,target.position.clone()]));
  const toTargets={leftHand:presetPoint(p.targets.lh,'left'),rightHand:presetPoint(p.targets.rh,'right'),leftFoot:presetPoint(p.targets.lf,'left'),rightFoot:presetPoint(p.targets.rf,'right')};
  const fromBody=effectiveBody(),toBody=structuredClone(p.body);activePoles={...p.poles};bodyAdjustments={hipsY:0,spineX:0,chestX:0,headY:0};currentPreset=name;resetIKSliders();document.querySelectorAll('#posePresets button').forEach(button=>button.classList.toggle('active',button.dataset.preset===name));
  const step=now=>{if(token!==poseTween)return;const raw=Math.min(1,(now-start)/duration),t=1-(1-raw)**3;for(const key of Object.keys(targets))targets[key].position.lerpVectors(fromTargets[key],toTargets[key],t);activeBody={};for(const boneName of new Set([...Object.keys(fromBody),...Object.keys(toBody)])){const a=fromBody[boneName]||[0,0,0],b=toBody[boneName]||[0,0,0];activeBody[boneName]=a.map((value,index)=>THREE.MathUtils.lerp(value,b[index],t))}solveAll();if(raw<1)requestAnimationFrame(step);else captureTargetBases()};requestAnimationFrame(step);
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
  const slider=+(document.getElementById(isHand?(side==='left'?'poleLeftElbow':'poleRightElbow'):(side==='left'?'poleLeftKnee':'poleRightKnee'))?.value||0);
  const poleDepth=(isHand?activePoles.arms:activePoles.legs)+slider/100*.35;
  const pole=presetPoint([isHand?.43:.14,isHand?.50:.28,poleDepth],side);
  const axis=target.clone().sub(root).normalize();const offset=pole.sub(root);
  const projected=offset.addScaledVector(axis,-offset.dot(axis));
  if(projected.lengthSq()<1e-8)projected.set(rigSide[side],0,isHand?-1:1);
  return projected.normalize();
}
function solveChain(name,nodes,target){
  if(nodes.some(node=>!node))return;
  const [root,middle,end]=nodes;model.updateMatrixWorld(true);
  const rootPos=root.getWorldPosition(new THREE.Vector3()),middlePos=middle.getWorldPosition(new THREE.Vector3()),endPos=end.getWorldPosition(new THREE.Vector3());
  const upperLength=rootPos.distanceTo(middlePos),lowerLength=middlePos.distanceTo(endPos);const isHand=name.endsWith('Hand');
  const toTarget=target.clone().sub(rootPos);const geometry=solveTwoBoneGeometry(upperLength,lowerLength,toTarget.length(),isHand?{minAngle:12,maxAngle:165}:{minAngle:8,maxAngle:175});
  const {distance,along,bend}=geometry,direction=toTarget.lengthSq()>1e-8?toTarget.normalize():new THREE.Vector3(0,-1,0);
  const desiredMiddle=rootPos.clone().addScaledVector(direction,along).addScaledVector(poleFor(name,rootPos,target),bend);
  rotateBoneToward(root,middlePos.clone().sub(rootPos),desiredMiddle.clone().sub(rootPos));model.updateMatrixWorld(true);
  const updatedMiddle=middle.getWorldPosition(new THREE.Vector3()),updatedEnd=end.getWorldPosition(new THREE.Vector3());
  const reachableTarget=rootPos.clone().addScaledVector(direction,distance);
  rotateBoneToward(middle,updatedEnd.sub(updatedMiddle),reachableTarget.sub(updatedMiddle));model.updateMatrixWorld(true);
}
function solveAll(){resetBones();applyBodyPose(effectiveBody());model.updateMatrixWorld(true);Object.entries(chains).forEach(([name,nodes])=>solveChain(name,nodes,targets[name].position));vrm?.update(0);render()}
function resetIKSliders(){document.querySelectorAll('[data-pose-adjust]').forEach(input=>input.value=0)}
function markCustom(){poseTween++;currentPreset='personalizada';document.querySelectorAll('#posePresets button').forEach(b=>b.classList.remove('active'))}
function sliderMove(id,value){const map={ikLeftHandY:['leftHand','y'],ikRightHandY:['rightHand','y'],ikLeftFootZ:['leftFoot','z'],ikRightFootZ:['rightFoot','z']};const [name,axis]=map[id];if(footLocks[name])return;targets[name].position.copy(targetBases[name]);targets[name].position[axis]+=value/100*modelHeight*.28;markCustom();solveAll()}
function mirrorPose(){const pairs=[['leftHand','rightHand'],['leftFoot','rightFoot']];for(const [left,right]of pairs){const lp=targets[left].position.clone(),rp=targets[right].position.clone();targets[left].position.set(avatarCenter.x-(rp.x-avatarCenter.x),rp.y,rp.z);targets[right].position.set(avatarCenter.x-(lp.x-avatarCenter.x),lp.y,lp.z)}activeBody=structuredClone(activeBody);for(const rotation of Object.values(activeBody)){rotation[1]*=-1;rotation[2]*=-1}captureTargetBases();markCustom();solveAll()}
function copyLeftToRight(){for(const [left,right]of [['leftHand','rightHand'],['leftFoot','rightFoot']]){const source=targets[left].position;targets[right].position.set(avatarCenter.x-(source.x-avatarCenter.x),source.y,source.z)}captureTargetBases();markCustom();solveAll()}
function applyOutfit(name){clothMaterials.forEach(material=>{if(!material.color)return;if(name==='original')material.color.copy(material.userData.originalColor);else material.color.set(name==='amber'?0xe1a72b:0x202126);material.needsUpdate=true});document.querySelectorAll('#wardrobe button').forEach(b=>b.classList.toggle('active',b.dataset.outfit===name));render()}
function applyOutline(){if(!model)return;const enabled=document.getElementById('outlineToggle').checked;model.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if('outlineWidthFactor'in material){material.outlineWidthFactor=enabled?0.004:0;material.needsUpdate=true}})});render()}
function cameraUpdate(){const targetY=modelHeight*.52;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance+targetY,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,targetY,0);render()}
function render(){if(renderer&&scene&&camera){const now=performance.now();vrm?.update(Math.min((now-lastFrame)/1000,.05));lastFrame=now;renderer.render(scene,camera);frameCount++;if(now-fpsWindow>=1000){const fps=Math.round(frameCount*1000/(now-fpsWindow));document.getElementById('qualityState').textContent=`${qualityLabel} · ${fps} FPS`;frameCount=0;fpsWindow=now}}}
function animate(){raf=requestAnimationFrame(animate);if(opened)render()}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();cameraUpdate()}
async function init(){if(renderer&&vrm)return;setupScene();resize();loading=loadAvatar();await loading;animate()}
function pointerCoords(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)}
function close(){modal.hidden=true;document.body.style.overflow='';opened=false}

window.addEventListener('pose3d:open',async()=>{opened=true;setStatus('Cargando estudio VRM…');try{await init();setStatus('','ready');setTimeout(resize,30)}catch(error){opened=false;setStatus('No fue posible cargar el avatar VRM. Puedes cerrar esta ventana y continuar con el editor.','error');console.error(error)}});
window.addEventListener('pose3d:close',()=>{opened=false});
document.querySelectorAll('#posePresets button').forEach(button=>button.onclick=()=>transitionPreset(button.dataset.preset));
['ikLeftHandY','ikRightHandY','ikLeftFootZ','ikRightFootZ'].forEach(id=>{document.getElementById(id).oninput=event=>sliderMove(id,+event.target.value)});
['poleLeftElbow','poleRightElbow','poleLeftKnee','poleRightKnee'].forEach(id=>{document.getElementById(id).oninput=()=>{markCustom();solveAll()}});
const bodyInputs={bodyHips:'hipsY',bodySpine:'spineX',bodyChest:'chestX',bodyHead:'headY'};Object.entries(bodyInputs).forEach(([id,key])=>{document.getElementById(id).oninput=event=>{bodyAdjustments[key]=+event.target.value/100*.55;markCustom();solveAll()}});
document.getElementById('mirrorPose').onclick=mirrorPose;document.getElementById('copyPoseSide').onclick=copyLeftToRight;
document.getElementById('resetArms').onclick=()=>{for(const name of ['leftHand','rightHand'])targets[name].position.copy(targetBases[name]);for(const id of ['ikLeftHandY','ikRightHandY','poleLeftElbow','poleRightElbow'])document.getElementById(id).value=0;markCustom();solveAll()};
document.getElementById('resetLegs').onclick=()=>{for(const name of ['leftFoot','rightFoot'])targets[name].position.copy(targetBases[name]);for(const id of ['ikLeftFootZ','ikRightFootZ','poleLeftKnee','poleRightKnee'])document.getElementById(id).value=0;markCustom();solveAll()};
document.getElementById('lockLeftFoot').onchange=event=>footLocks.leftFoot=event.target.checked;document.getElementById('lockRightFoot').onchange=event=>footLocks.rightFoot=event.target.checked;
document.querySelectorAll('#wardrobe button').forEach(button=>button.onclick=()=>applyOutfit(button.dataset.outfit));
document.querySelectorAll('[data-camera]').forEach(button=>button.onclick=()=>{yaw=button.dataset.camera==='front'?0:button.dataset.camera==='profile'?Math.PI/2:.58;pitch=.04;cameraUpdate()});
document.getElementById('outlineToggle').onchange=applyOutline;
document.getElementById('skeletonToggle').onchange=event=>{if(skeletonHelper)skeletonHelper.visible=event.target.checked;render()};
document.getElementById('resetPose3d').onclick=()=>{yaw=.35;pitch=.04;distance=Math.max(3.5,modelHeight*2.55);applyOutfit('original');applyPreset('neutral');cameraUpdate()};
canvas.addEventListener('pointerdown',event=>{if(!vrm)return;pointerCoords(event);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(Object.values(targets),false)[0];if(hit&&!footLocks[hit.object.name.replace('ik-','')]){ikDrag=hit.object;document.getElementById('jointFocus').textContent=`Editando ${ikDrag.userData.label} · movimiento anatómico limitado`;dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),ikDrag.position)}else orbitDrag={x:event.clientX,y:event.clientY,yaw,pitch};canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{if(ikDrag){pointerCoords(event);raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(dragPlane,planeHit)){ikDrag.position.copy(planeHit);if(ikDrag.name.includes('Foot'))ikDrag.position.y=Math.max(groundY+modelHeight*.02,ikDrag.position.y);markCustom();solveAll()}return}if(!orbitDrag)return;yaw=orbitDrag.yaw-(event.clientX-orbitDrag.x)*.008;pitch=Math.max(-.45,Math.min(.55,orbitDrag.pitch+(event.clientY-orbitDrag.y)*.006));cameraUpdate()});
canvas.addEventListener('pointerup',()=>{ikDrag=null;orbitDrag=null;document.getElementById('jointFocus').textContent='Mueve los cuatro nodos luminosos. Los límites protegen codos y rodillas.'});canvas.addEventListener('pointercancel',()=>{ikDrag=null;orbitDrag=null});canvas.addEventListener('wheel',event=>{event.preventDefault();distance=Math.max(modelHeight*1.65,Math.min(modelHeight*4.5,distance+event.deltaY*.006));cameraUpdate()},{passive:false});
document.getElementById('applyPose3d').onclick=()=>{if(!renderer||!vrm)return;const hidden=[];scene.traverse(object=>{if(object.name.startsWith('ik-')||object.name.startsWith('studio-')){hidden.push([object,object.visible]);object.visible=false}});render();const image=canvas.toDataURL('image/png');hidden.forEach(([object,visible])=>object.visible=visible);render();window.dispatchEvent(new CustomEvent('pose3d:apply',{detail:{image,name:currentPreset,poseSchemaVersion:POSE_SCHEMA_VERSION}}));close()};
window.addEventListener('resize',resize);
