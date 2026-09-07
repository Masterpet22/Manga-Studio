import{writeFile}from'node:fs/promises';

const port=Number(process.argv[2]||9444),url=process.argv[3]||'http://localhost:4173/',width=Number(process.argv[4]||390),height=Number(process.argv[5]||844),screenshot=process.argv[6];
const pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());
const target=pages.find(page=>page.type==='page');
if(!target)throw new Error('No browser page found');
const socket=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),errors=[],networkResources=[];let sequence=0;
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);if(message.method==='Network.responseReceived')networkResources.push(message.params.response.url.split('/').pop());if(message.id&&pending.has(message.id)){const{resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}};
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=600});
await call('Page.navigate',{url});await new Promise(resolve=>setTimeout(resolve,2500));
const expression=`(()=>{const controls=[...document.querySelectorAll('button,a,input,select,textarea,[tabindex]')].filter(node=>node.getClientRects().length);const name=node=>(node.getAttribute('aria-label')||node.getAttribute('title')||document.querySelector('label[for="'+node.id+'"]')?.textContent||node.closest('label')?.textContent||node.textContent||'').trim();return{title:document.title,badge:document.querySelector('.badge')?.textContent.trim(),ready:document.querySelector('#performanceState')?.textContent.trim(),viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,onboarding:!document.querySelector('#onboardingModal')?.hidden,canvas:document.querySelector('#mangaCanvas')?.getBoundingClientRect().toJSON(),unlabeled:controls.filter(node=>!name(node)&&node.type!=='file').map(node=>node.id||node.tagName),resources:performance.getEntriesByType('resource').map(entry=>entry.name.split('/').pop()),characterLoaded:document.querySelector('#characterCard img')?.complete}})()`;
const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
if(screenshot){const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(screenshot,Buffer.from(shot.data,'base64'))}
console.log(JSON.stringify({...result.result.value,networkResources:[...new Set(networkResources)],errors},null,2));socket.close();
