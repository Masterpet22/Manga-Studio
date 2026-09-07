export const PREFERENCES_KEY='manga-studio-preferences-v1';
export const DEFAULT_PREFERENCES=Object.freeze({theme:'dark',density:'comfortable',motion:'system',quality:'auto',units:'px',autosaveDelay:1000,assetsOpen:true,inspectorOpen:true,workspaceView:'canvas'});
const choices={theme:['dark','light','system'],density:['comfortable','compact'],motion:['system','reduced','full'],quality:['auto','efficient','high'],units:['px','mm'],workspaceView:['assets','canvas','inspector']};

export function normalizePreferences(input={}){const result={...DEFAULT_PREFERENCES};for(const[key,allowed]of Object.entries(choices))if(allowed.includes(input[key]))result[key]=input[key];const delay=Number(input.autosaveDelay);if([350,1000,3000].includes(delay))result.autosaveDelay=delay;if(typeof input.assetsOpen==='boolean')result.assetsOpen=input.assetsOpen;if(typeof input.inspectorOpen==='boolean')result.inspectorOpen=input.inspectorOpen;return result}
export function resolvedTheme(preferences,prefersDark=true){return preferences.theme==='system'?(prefersDark?'dark':'light'):preferences.theme}
