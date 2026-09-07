export const DOCUMENT_SCHEMA_VERSION=3;
export const uid=(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
export const deepClone=value=>structuredClone(value);

export function createPage(index=0){
  return{id:uid('page'),name:`Página ${String(index+1).padStart(2,'0')}`,layout:'cinematic',background:'city',backgroundAssetId:null,backgroundOpacity:1,backgroundBlur:0,backgroundMonochrome:false,backgroundTransform:{scale:100,x:0,y:0},thumbnail:null,panelSettings:{gutter:20,border:6,slant:0,bleed:false},toneSettings:{density:8,scale:100,angle:0},elements:index?[]:[
    {id:uid('char'),type:'character',name:'Akira',x:315,y:400,w:285,h:430,scale:1,rotation:0,flip:false,pose:'neutral',expression:'neutral',visible:true,locked:false,panelId:1},
    {id:uid('bubble'),type:'bubble',name:'Diálogo',x:155,y:145,w:240,h:112,scale:1,rotation:-2,flip:false,text:'Esta ciudad guarda\nun secreto…',fontSize:23,visible:true,locked:false,panelId:0},
    {id:uid('caption'),type:'caption',name:'Narración',x:420,y:660,w:260,h:62,scale:1,rotation:0,flip:false,text:'CAPÍTULO 01 · LA SEÑAL',fontSize:19,visible:true,locked:false,panelId:2}
  ]};
}

export function normalizePage(page,index=0){
  const base=createPage(index),normalized={...base,...deepClone(page),id:page?.id||uid('page'),thumbnail:page?.thumbnail||null,panelSettings:{...base.panelSettings,...page?.panelSettings},toneSettings:{...base.toneSettings,...page?.toneSettings},backgroundTransform:{...base.backgroundTransform,...page?.backgroundTransform}};
  normalized.elements=(page?.elements||[]).map(element=>({...element,id:element.id||uid(element.type||'element'),visible:element.visible!==false,locked:!!element.locked,panelId:Number.isInteger(element.panelId)?element.panelId:null,fontFamily:element.fontFamily||'Arial',textAlign:element.textAlign||'center',lineHeight:element.lineHeight||1.08,letterSpacing:element.letterSpacing||0,bubblePadding:element.bubblePadding||12,tailSide:element.tailSide||'right'}));
  return normalized;
}

export function createProject(name='Mi manga',firstPage=createPage(0)){
  const now=new Date().toISOString();return{schemaVersion:DOCUMENT_SCHEMA_VERSION,id:uid('project'),name,createdAt:now,updatedAt:now,activePageId:firstPage.id,activeVrmAssetId:null,assets:[],pages:[normalizePage(firstPage,0)]};
}

export function migrateProject(input){
  if(input?.schemaVersion>=2&&Array.isArray(input.pages))return{...deepClone(input),schemaVersion:DOCUMENT_SCHEMA_VERSION,assets:input.assets||[],activeVrmAssetId:input.activeVrmAssetId||null,pages:input.pages.map(normalizePage)};
  if(input?.layout&&Array.isArray(input.elements))return createProject('Proyecto recuperado',normalizePage(input,0));
  return createProject();
}

export class CommandHistory{
  constructor(limit=60){this.limit=limit;this.undoStack=[];this.redoStack=[]}
  push(command){if(command.before===command.after)return;this.undoStack.push(command);if(this.undoStack.length>this.limit)this.undoStack.shift();this.redoStack=[]}
  undo(current){const command=this.undoStack.pop();if(!command)return current;this.redoStack.push(command);return JSON.parse(command.before)}
  redo(current){const command=this.redoStack.pop();if(!command)return current;this.undoStack.push(command);return JSON.parse(command.after)}
  clear(){this.undoStack=[];this.redoStack=[]}
}
