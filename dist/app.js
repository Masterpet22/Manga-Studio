const canvas=document.getElementById('mangaCanvas');
const ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;
const characterImage=new Image(); characterImage.src='akira.png';
const spriteCache=new Map();
let zoom=.82, selectedId='char-1', drag=null, history=[], future=[], toastTimer;
const defaults=()=>({layout:'cinematic',background:'city',elements:[
  {id:'char-1',type:'character',name:'Akira',x:315,y:400,w:285,h:430,scale:1,rotation:0,flip:false,pose:'neutral',expression:'neutral'},
  {id:'bubble-1',type:'bubble',name:'Diálogo',x:155,y:145,w:240,h:112,scale:1,rotation:-2,flip:false,text:'Esta ciudad guarda\nun secreto…',fontSize:23},
  {id:'caption-1',type:'caption',name:'Narración',x:420,y:660,w:260,h:62,scale:1,rotation:0,flip:false,text:'CAPÍTULO 01 · LA SEÑAL',fontSize:19}
]});
let state=loadState()||defaults();

function loadState(){try{return JSON.parse(localStorage.getItem('manga-studio-state'))}catch{return null}}
function snapshot(){history.push(JSON.stringify(state));if(history.length>30)history.shift();future=[]}
function save(){localStorage.setItem('manga-studio-state',JSON.stringify(state));const el=document.getElementById('saveState');el.textContent='Guardado ✓';setTimeout(()=>el.textContent='Guardado local',900)}
function commit(){save();render();updateInspector()}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function roundedRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function panels(){if(state.layout==='two')return [{x:25,y:25,w:550,h:360},{x:25,y:405,w:550,h:370}];if(state.layout==='four')return [{x:25,y:25,w:265,h:365},{x:310,y:25,w:265,h:365},{x:25,y:410,w:265,h:365},{x:310,y:410,w:265,h:365}];return [{x:25,y:25,w:550,h:315},{x:25,y:360,w:260,h:415},{x:305,y:360,w:270,h:415}]}
function drawBackground(panel,index){ctx.save();ctx.beginPath();ctx.rect(panel.x,panel.y,panel.w,panel.h);ctx.clip();const bg=state.background;
  if(bg==='city'){let g=ctx.createLinearGradient(0,panel.y,0,panel.y+panel.h);g.addColorStop(0,index?'#d6d3ca':'#40434b');g.addColorStop(1,index?'#8b8d91':'#9b8760');ctx.fillStyle=g;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.fillStyle='#202126';for(let x=panel.x-10;x<panel.x+panel.w;x+=48){const bh=70+(x*13%130);ctx.fillRect(x,panel.y+panel.h-bh,38,bh);ctx.fillStyle='#e1b64a';for(let wy=panel.y+panel.h-bh+14;wy<panel.y+panel.h-12;wy+=22){ctx.fillRect(x+7,wy,7,6);ctx.fillRect(x+22,wy,7,6)}ctx.fillStyle='#202126'}
  }else if(bg==='dots'){ctx.fillStyle='#eee';ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.fillStyle='#777';for(let y=panel.y;y<panel.y+panel.h;y+=8)for(let x=panel.x+(y%16?4:0);x<panel.x+panel.w;x+=8){ctx.beginPath();ctx.arc(x,y,1.7,0,Math.PI*2);ctx.fill()}
  }else if(bg==='speed'){ctx.fillStyle='#efeee9';ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.strokeStyle='#555';ctx.lineWidth=1;for(let i=0;i<50;i++){ctx.beginPath();ctx.moveTo(panel.x-20,panel.y+(i*37)%panel.h);ctx.lineTo(panel.x+panel.w+30,panel.y+(i*37)%panel.h-80);ctx.stroke()}
  }else if(bg==='burst'){ctx.fillStyle='#eee';ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.translate(panel.x+panel.w/2,panel.y+panel.h/2);for(let i=0;i<36;i++){ctx.rotate(Math.PI/18);ctx.beginPath();ctx.moveTo(35,-2);ctx.lineTo(Math.max(panel.w,panel.h),-7);ctx.lineTo(Math.max(panel.w,panel.h),7);ctx.closePath();ctx.fillStyle=i%3===0?'#777':'#d3d1ca';ctx.fill()}
  }else{ctx.fillStyle='#faf9f4';ctx.fillRect(panel.x,panel.y,panel.w,panel.h)}ctx.restore();ctx.strokeStyle='#111';ctx.lineWidth=6;ctx.strokeRect(panel.x,panel.y,panel.w,panel.h)}
function imageFor(el){if(!el.sprite)return characterImage;if(!spriteCache.has(el.id)){const image=new Image();image.onload=render;image.src=el.sprite;spriteCache.set(el.id,image)}return spriteCache.get(el.id)}
function drawCharacter(el){ctx.save();ctx.translate(el.x,el.y);ctx.rotate(el.rotation*Math.PI/180);ctx.scale((el.flip?-1:1)*el.scale,el.scale);let extra=el.pose==='hero'?1.08:el.pose==='action'?.92:1;ctx.scale(extra,1);if(el.expression==='angry')ctx.filter='contrast(1.22) saturate(.8)';if(el.expression==='happy')ctx.filter='saturate(1.25) brightness(1.06)';if(el.expression==='surprised')ctx.filter='brightness(1.13) contrast(1.08)';const image=imageFor(el);if(image.complete)ctx.drawImage(image,-el.w/2,-el.h/2,el.w,el.h);ctx.restore()}
function wrapText(text,maxWidth,font){ctx.font=font;const lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(' ')){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}lines.push(line)}return lines}
function drawTextElement(el){ctx.save();ctx.translate(el.x,el.y);ctx.rotate(el.rotation*Math.PI/180);ctx.scale((el.flip?-1:1)*el.scale,el.scale);const w=el.w,h=el.h;
  if(el.type==='bubble'||el.type==='thought'){ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=4;if(el.type==='thought'){ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(w*.2,h*.52,10,0,Math.PI*2);ctx.arc(w*.27,h*.68,5,0,Math.PI*2);ctx.fill();ctx.stroke()}else{ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(w*.2,h*.38);ctx.lineTo(w*.36,h*.72);ctx.lineTo(w*.04,h*.45);ctx.fill();ctx.stroke()}}
  if(el.type==='shout'){ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?Math.min(w,h)*.37:Math.min(w,h)*.55;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke()}
  if(el.type==='caption'){ctx.fillStyle='#111';ctx.fillRect(-w/2,-h/2,w,h)}
  const isFx=el.type==='fx';ctx.fillStyle=el.type==='caption'?'#fff':isFx?'#f3b61f':'#111';ctx.strokeStyle=isFx?'#111':'transparent';ctx.lineWidth=isFx?7:0;ctx.textAlign='center';ctx.textBaseline='middle';const size=el.fontSize||24;ctx.font=`${isFx?'900 italic':'800'} ${size}px Arial`;const lines=wrapText(el.text,w-24,ctx.font);lines.forEach((line,i)=>{const y=(i-(lines.length-1)/2)*size*1.08;if(isFx)ctx.strokeText(line,0,y);ctx.fillText(line,0,y)});ctx.restore()}
function bounds(el){return{x:el.x-el.w*el.scale/2,y:el.y-el.h*el.scale/2,w:el.w*el.scale,h:el.h*el.scale}}
function render(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);panels().forEach(drawBackground);for(const el of state.elements){if(el.type==='character'&&characterImage.complete)drawCharacter(el);else if(el.type!=='character')drawTextElement(el)}const el=current();if(el){const b=bounds(el);ctx.save();ctx.strokeStyle='#f3b61f';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.setLineDash([]);ctx.fillStyle='#f3b61f';for(const [x,y] of [[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]])ctx.fillRect(x-5,y-5,10,10);ctx.restore()}}
function current(){return state.elements.find(e=>e.id===selectedId)}
function addElement(type){snapshot();const id=type+'-'+Date.now();let el;if(type==='character')el={id,type,name:'Akira',x:300,y:420,w:260,h:410,scale:.82,rotation:0,flip:false,pose:'neutral',expression:'neutral'};else{const meta={bubble:['Diálogo','¿Qué está pasando?',230,110,23],shout:['Grito','¡DETENTE!',220,150,29],thought:['Pensamiento','Tengo un mal presentimiento…',235,125,21],caption:['Narración','MIENTRAS TANTO…',250,62,19],fx:['Efecto','¡BAM!',210,100,46]}[type];el={id,type,name:meta[0],text:meta[1],x:300,y:210,w:meta[2],h:meta[3],fontSize:meta[4],scale:1,rotation:0,flip:false}}state.elements.push(el);selectedId=id;commit();showToast(metaOr(type))}
function metaOr(type){return type==='character'?'Personaje añadido':'Elemento añadido'}
function updateInspector(){const el=current();document.getElementById('selectionName').textContent=el?el.name:'Página';document.getElementById('characterControls').hidden=!el||el.type!=='character';document.getElementById('textControls').hidden=!el||el.type==='character';if(!el)return;document.getElementById('scaleRange').value=Math.round(el.scale*100);document.getElementById('rotateRange').value=el.rotation||0;if(el.type==='character'){document.getElementById('expressionSelect').value=el.expression;document.querySelectorAll('#poseControl button').forEach(b=>b.classList.toggle('active',b.dataset.pose===el.pose))}else{document.getElementById('textInput').value=el.text;document.getElementById('fontSize').value=el.fontSize;document.getElementById('fontSizeOut').value=el.fontSize}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{const p=canvasPoint(e);const hit=[...state.elements].reverse().find(el=>{const b=bounds(el);return p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h});if(hit){selectedId=hit.id;snapshot();drag={dx:p.x-hit.x,dy:p.y-hit.y};canvas.setPointerCapture(e.pointerId);render();updateInspector()}else{selectedId=null;render();updateInspector()}});
canvas.addEventListener('pointermove',e=>{if(!drag||!current())return;const p=canvasPoint(e);current().x=Math.max(0,Math.min(W,p.x-drag.dx));current().y=Math.max(0,Math.min(H,p.y-drag.dy));render()});
canvas.addEventListener('pointerup',()=>{if(drag){drag=null;save()}});
canvas.addEventListener('wheel',e=>{const el=current();if(!el)return;e.preventDefault();snapshot();el.scale=Math.max(.3,Math.min(1.8,el.scale+(e.deltaY<0?.05:-.05)));commit()},{passive:false});
document.querySelectorAll('.asset-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.asset-tab,.asset-content').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active')});
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addElement(b.dataset.add));document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{snapshot();state.background=b.dataset.bg;document.getElementById('backgroundSelect').value=state.background;commit()});
document.getElementById('characterCard').onclick=document.getElementById('addCharacter').onclick=()=>addElement('character');
document.getElementById('backgroundSelect').onchange=e=>{snapshot();state.background=e.target.value;commit()};
document.querySelectorAll('.layout-option').forEach(b=>b.onclick=()=>{snapshot();state.layout=b.dataset.layout;document.querySelectorAll('.layout-option').forEach(x=>x.classList.toggle('active',x===b));commit()});
document.querySelectorAll('#poseControl button').forEach(b=>b.onclick=()=>{if(!current())return;snapshot();current().pose=b.dataset.pose;commit()});
document.getElementById('expressionSelect').onchange=e=>{if(!current())return;snapshot();current().expression=e.target.value;commit()};
const poseModal=document.getElementById('poseModal');
function closePoseModal(){poseModal.hidden=true;document.body.style.overflow='';window.dispatchEvent(new CustomEvent('pose3d:close'))}
document.getElementById('openPose3d').onclick=()=>{if(!current()||current().type!=='character')return;poseModal.hidden=false;document.body.style.overflow='hidden';window.dispatchEvent(new CustomEvent('pose3d:open'))};
document.getElementById('closePose3d').onclick=closePoseModal;
poseModal.addEventListener('click',e=>{if(e.target===poseModal)closePoseModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!poseModal.hidden)closePoseModal()});
window.addEventListener('pose3d:apply',e=>{let el=current();if(!el||el.type!=='character'){addElement('character');el=current()}snapshot();el.sprite=e.detail.image;el.pose=e.detail.name||'neutral';el.expression='neutral';el.w=300;el.h=460;spriteCache.delete(el.id);commit();showToast('Pose 3D aplicada')});
document.getElementById('scaleRange').oninput=e=>{if(!current())return;current().scale=e.target.value/100;render()};document.getElementById('scaleRange').onchange=()=>save();
document.getElementById('rotateRange').oninput=e=>{if(!current())return;current().rotation=+e.target.value;render()};document.getElementById('rotateRange').onchange=()=>save();
document.getElementById('textInput').oninput=e=>{if(!current())return;current().text=e.target.value;render();save()};
document.getElementById('fontSize').oninput=e=>{if(!current())return;current().fontSize=+e.target.value;document.getElementById('fontSizeOut').value=e.target.value;render()};
document.getElementById('flipBtn').onclick=()=>{if(!current())return;snapshot();current().flip=!current().flip;commit()};
function removeSelected(){if(!current())return;snapshot();state.elements=state.elements.filter(e=>e.id!==selectedId);selectedId=null;commit();showToast('Elemento eliminado')}
document.getElementById('deleteBtn').onclick=removeSelected;document.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&!['TEXTAREA','INPUT'].includes(document.activeElement.tagName))removeSelected()});
document.getElementById('undoBtn').onclick=()=>{if(!history.length)return;future.push(JSON.stringify(state));state=JSON.parse(history.pop());selectedId=null;commit()};
document.getElementById('redoBtn').onclick=()=>{if(!future.length)return;history.push(JSON.stringify(state));state=JSON.parse(future.pop());selectedId=null;save();render();updateInspector()};
document.getElementById('newBtn').onclick=()=>{if(!confirm('¿Crear una página nueva? La página actual se reemplazará.'))return;snapshot();state=defaults();selectedId='char-1';commit();showToast('Página nueva creada')};
function setZoom(v){zoom=Math.max(.48,Math.min(1.05,v));canvas.style.width=(600*zoom)+'px';canvas.style.height=(800*zoom)+'px';document.getElementById('zoomLabel').textContent=Math.round(zoom*100)+'%'}
document.getElementById('zoomIn').onclick=()=>setZoom(zoom+.08);document.getElementById('zoomOut').onclick=()=>setZoom(zoom-.08);document.getElementById('fitBtn').onclick=()=>setZoom(window.innerWidth<520?.54:.82);
document.getElementById('exportBtn').onclick=()=>{const old=selectedId;selectedId=null;render();const a=document.createElement('a');a.download='manga-pagina-01.png';a.href=canvas.toDataURL('image/png');a.click();selectedId=old;render();showToast('PNG descargado')};
characterImage.onload=render;window.addEventListener('resize',()=>{if(window.innerWidth<520&&zoom>.6)setZoom(.54)});document.querySelector(`[data-layout="${state.layout}"]`)?.classList.add('active');document.getElementById('backgroundSelect').value=state.background;setZoom(window.innerWidth<520?.54:.82);updateInspector();render();
