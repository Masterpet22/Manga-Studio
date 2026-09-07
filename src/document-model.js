export const DOCUMENT_SCHEMA_VERSION=2;
export const uid=(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
export const deepClone=value=>structuredClone(value);

export function createPage(index=0){
  return{id:uid('page'),name:`Página ${String(index+1).padStart(2,'0')}`,layout:'cinematic',background:'city',thumbnail:null,elements:index?[]:[
    {id:uid('char'),type:'character',name:'Akira',x:315,y:400,w:285,h:430,scale:1,rotation:0,flip:false,pose:'neutral',expression:'neutral',visible:true,locked:false,panelId:1},
    {id:uid('bubble'),type:'bubble',name:'Diálogo',x:155,y:145,w:240,h:112,scale:1,rotation:-2,flip:false,text:'Esta ciudad guarda\nun secreto…',fontSize:23,visible:true,locked:false,panelId:0},
    {id:uid('caption'),type:'caption',name:'Narración',x:420,y:660,w:260,h:62,scale:1,rotation:0,flip:false,text:'CAPÍTULO 01 · LA SEÑAL',fontSize:19,visible:true,locked:false,panelId:2}
  ]};
}

export function normalizePage(page,index=0){
  const normalized={...createPage(index),...deepClone(page),id:page?.id||uid('page'),thumbnail:page?.thumbnail||null};
  normalized.elements=(page?.elements||[]).map(element=>({...element,id:element.id||uid(element.type||'element'),visible:element.visible!==false,locked:!!element.locked,panelId:Number.isInteger(element.panelId)?element.panelId:null}));
  return normalized;
}

export function createProject(name='Mi manga',firstPage=createPage(0)){
  const now=new Date().toISOString();return{schemaVersion:DOCUMENT_SCHEMA_VERSION,id:uid('project'),name,createdAt:now,updatedAt:now,activePageId:firstPage.id,pages:[normalizePage(firstPage,0)]};
}

export function migrateProject(input){
  if(input?.schemaVersion===DOCUMENT_SCHEMA_VERSION&&Array.isArray(input.pages))return{...deepClone(input),pages:input.pages.map(normalizePage)};
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
