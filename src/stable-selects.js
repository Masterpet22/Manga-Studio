const enhanced=new Map();

function accessibleName(select){
  if(select.getAttribute('aria-label'))return select.getAttribute('aria-label');
  if(select.id){const label=document.querySelector(`label[for="${CSS.escape(select.id)}"]`);if(label)return label.textContent.trim()}
  const wrapping=select.closest('label');
  if(wrapping)return[...wrapping.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent.trim()).filter(Boolean).join(' ');
  return select.name||'Seleccionar opción';
}

function closeEntry(entry){entry.menu.hidden=true;entry.trigger.setAttribute('aria-expanded','false')}
function closeOthers(except){for(const entry of enhanced.values())if(entry!==except)closeEntry(entry)}

function rebuild(entry){
  const{select,trigger,menu}=entry,options=[...select.options];
  trigger.textContent=select.selectedOptions[0]?.textContent||options[0]?.textContent||'Seleccionar';
  trigger.disabled=select.disabled;
  menu.replaceChildren(...options.map(option=>{
    const button=document.createElement('button');button.type='button';button.className='stable-select-option';button.textContent=option.textContent;button.dataset.value=option.value;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.value===select.value));button.disabled=option.disabled;
    button.onclick=event=>{event.stopPropagation();select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));rebuild(entry);closeEntry(entry);trigger.focus()};
    return button
  }))
}

function enhance(select){
  if(enhanced.has(select)||select.multiple)return;
  const root=document.createElement('div'),trigger=document.createElement('button'),menu=document.createElement('div'),name=accessibleName(select);
  root.className='stable-select';trigger.type='button';trigger.className='stable-select-trigger';trigger.id=`${select.id||'select'}Stable`;trigger.setAttribute('aria-label',name);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');menu.className='stable-select-menu';menu.hidden=true;menu.setAttribute('role','listbox');menu.setAttribute('aria-label',name);
  root.append(trigger,menu);select.insertAdjacentElement('afterend',root);select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const entry={select,root,trigger,menu};enhanced.set(select,entry);rebuild(entry);
  trigger.onclick=event=>{event.stopPropagation();const opening=menu.hidden;closeOthers(entry);rebuild(entry);menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));if(opening){menu.classList.toggle('open-up',root.getBoundingClientRect().bottom+Math.min(230,menu.scrollHeight)+12>innerHeight);menu.querySelector('[aria-selected="true"]')?.focus()}};
  trigger.onkeydown=event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const options=[...select.options].filter(option=>!option.disabled);if(!options.length)return;const current=Math.max(0,options.findIndex(option=>option.value===select.value)),next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?Math.min(options.length-1,current+1):Math.max(0,current-1);select.value=options[next].value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));rebuild(entry)};
  select.addEventListener('change',()=>rebuild(entry));new MutationObserver(()=>rebuild(entry)).observe(select,{childList:true,subtree:true,attributes:true});
}

export function enhanceStableSelects(root=document){root.querySelectorAll('select').forEach(enhance);refreshStableSelects()}
export function refreshStableSelects(){for(const entry of enhanced.values())rebuild(entry)}

document.addEventListener('click',()=>closeOthers());
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeOthers()});
