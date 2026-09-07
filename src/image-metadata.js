const PNG_SIGNATURE=[137,80,78,71,13,10,26,10];
const crcTable=Uint32Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
function concat(chunks){const total=chunks.reduce((sum,chunk)=>sum+chunk.length,0),result=new Uint8Array(total);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length}return result}
function isPng(bytes){return PNG_SIGNATURE.every((value,index)=>bytes[index]===value)}

function addPngDensity(bytes,dpi){if(bytes.length<33||!isPng(bytes))return bytes;const pixelsPerMeter=Math.round(dpi/0.0254),chunk=new Uint8Array(21),dataView=new DataView(chunk.buffer);dataView.setUint32(0,9);chunk.set([112,72,89,115],4);dataView.setUint32(8,pixelsPerMeter);dataView.setUint32(12,pixelsPerMeter);chunk[16]=1;dataView.setUint32(17,crc32(chunk.subarray(4,17)));return concat([bytes.subarray(0,33),chunk,bytes.subarray(33)])}
function addJpegDensity(bytes,dpi){if(bytes[0]!==0xff||bytes[1]!==0xd8)return bytes;const result=bytes.slice();let offset=2;while(offset+4<result.length&&result[offset]===0xff){const marker=result[offset+1],length=(result[offset+2]<<8)|result[offset+3];if(marker===0xe0&&length>=16&&String.fromCharCode(...result.subarray(offset+4,offset+9))==='JFIF\0'){const density=Math.max(1,Math.min(65535,Math.round(dpi)));result[offset+11]=1;result[offset+12]=density>>8;result[offset+13]=density&255;result[offset+14]=density>>8;result[offset+15]=density&255;return result}if(marker===0xda||length<2)break;offset+=2+length}return result}

export function applyDpiMetadata(input,mime,dpi){const bytes=input instanceof Uint8Array?input:new Uint8Array(input);if(mime==='image/png')return addPngDensity(bytes,dpi);if(mime==='image/jpeg')return addJpegDensity(bytes,dpi);return bytes}
