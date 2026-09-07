export const MAX_IMAGE_BYTES=8*1024*1024;
export const MAX_VRM_BYTES=25*1024*1024;
const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/svg+xml']);
export function validateAssetFile(file,kind='image'){
  if(!file?.name||!Number.isFinite(file.size))return{ok:false,error:'Archivo inválido'};
  if(kind==='vrm'){
    if(!file.name.toLowerCase().endsWith('.vrm'))return{ok:false,error:'Selecciona un archivo .vrm'};
    if(file.size>MAX_VRM_BYTES)return{ok:false,error:'El VRM supera el límite de 25 MB'};
    return{ok:true};
  }
  if(!IMAGE_TYPES.has(file.type))return{ok:false,error:'Formato no permitido. Usa PNG, JPEG, WebP o SVG'};
  if(file.size>MAX_IMAGE_BYTES)return{ok:false,error:'La imagen supera el límite de 8 MB'};
  return{ok:true};
}
export function svgLooksSafe(text){return!/<\s*(script|foreignObject|iframe|object|embed)\b/i.test(text)&&!/(on\w+\s*=|javascript:|data:text\/html|<!doctype|<!entity|@import|url\s*\(\s*['\"]?https?:|(?:href|xlink:href)\s*=\s*['\"]\s*https?:)/i.test(text)}
