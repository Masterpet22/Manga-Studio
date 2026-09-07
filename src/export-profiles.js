export const EXPORT_PROFILES={
  web:{label:'Web · 600 × 800',width:600,height:800,dpi:96},
  a4:{label:'A4 · 300 DPI',width:2480,height:3508,dpi:300},
  b5:{label:'B5 manga · 300 DPI',width:2079,height:2953,dpi:300}
};

export function resolveExportSize({profile='web',scale=1,width,height}={}){
  const base=EXPORT_PROFILES[profile]||EXPORT_PROFILES.web;
  const factor=Math.max(.25,Math.min(4,Number(scale)||1));
  const custom=profile==='custom';
  const resolvedWidth=Math.round(custom?Number(width):base.width*factor);
  const resolvedHeight=Math.round(custom?Number(height):base.height*factor);
  if(!Number.isFinite(resolvedWidth)||!Number.isFinite(resolvedHeight)||resolvedWidth<64||resolvedHeight<64)throw new RangeError('Las dimensiones mínimas son 64 × 64 px');
  if(resolvedWidth>12000||resolvedHeight>12000||resolvedWidth*resolvedHeight>80_000_000)throw new RangeError('La exportación supera el límite seguro de 80 megapíxeles');
  return{width:resolvedWidth,height:resolvedHeight,dpi:custom?Math.max(72,Math.min(600,Number(arguments[0]?.dpi)||300)):base.dpi};
}

export function safeFilename(value='manga'){return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'manga'}

export function mimeForFormat(format){return format==='jpeg'?'image/jpeg':format==='webp'?'image/webp':'image/png'}
