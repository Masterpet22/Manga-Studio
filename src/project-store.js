const DB_NAME='manga-studio';const DB_VERSION=1;const STORE='projects';
function openDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function transaction(db,mode,operation){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),request=operation(store);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close()})}
export async function listProjects(){const db=await openDatabase();return transaction(db,'readonly',store=>store.getAll())}
export async function getProject(id){const db=await openDatabase();return transaction(db,'readonly',store=>store.get(id))}
export async function putProject(project){const db=await openDatabase();return transaction(db,'readwrite',store=>store.put(project))}
export async function removeProject(id){const db=await openDatabase();return transaction(db,'readwrite',store=>store.delete(id))}
