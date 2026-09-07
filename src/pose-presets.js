export const POSE_SCHEMA_VERSION=1;

export const POSE_PRESETS={
  neutral:{label:'Neutral',targets:{lh:[.29,.46,.03],rh:[.29,.46,.03],lf:[.09,.035,.07],rf:[.09,.035,.07]},body:{},poles:{arms:-.18,legs:.30}},
  hero:{label:'Heroica',targets:{lh:[.34,.50,.02],rh:[.21,.73,.10],lf:[.11,.035,.02],rf:[.13,.045,.14]},body:{hips:[0,.12,-.04],spine:[-.04,-.08,.05],chest:[-.05,-.08,.05],head:[.03,.05,-.02]},poles:{arms:-.12,legs:.28}},
  action:{label:'Acción',targets:{lh:[.28,.66,.30],rh:[.18,.57,.40],lf:[.16,.05,.16],rf:[.17,.08,-.10]},body:{hips:[-.12,.26,-.10],spine:[-.12,-.18,.10],chest:[-.10,-.12,.08],head:[.05,-.10,-.04]},poles:{arms:-.25,legs:.34}},
  run:{label:'Corriendo',targets:{lh:[.24,.60,-.28],rh:[.23,.64,.32],lf:[.14,.08,.32],rf:[.13,.22,-.24]},body:{hips:[.20,-.12,.08],spine:[.20,.15,-.08],chest:[.12,.08,-.04],head:[-.08,-.05,.02]},poles:{arms:-.22,legs:.38}},
  guard:{label:'Defensa',targets:{lh:[.21,.65,.30],rh:[.21,.68,.34],lf:[.16,.045,.18],rf:[.17,.065,-.08]},body:{hips:[-.08,.02,.04],spine:[-.10,0,.02],chest:[-.08,0,.02],head:[.03,0,0]},poles:{arms:-.28,legs:.34}},
  wave:{label:'Saludo',targets:{lh:[.34,.48,.01],rh:[.24,.88,.04],lf:[.10,.035,.05],rf:[.12,.045,.09]},body:{hips:[0,-.10,.03],spine:[0,-.10,.04],chest:[0,-.08,.05],head:[0,.12,-.04]},poles:{arms:-.20,legs:.30}},
  walk:{label:'Caminando',targets:{lh:[.25,.55,.18],rh:[.25,.55,-.16],lf:[.12,.06,-.12],rf:[.13,.10,.24]},body:{hips:[.08,.05,-.05],spine:[.07,-.06,.04],chest:[.04,-.04,.02],head:[-.03,.02,0]},poles:{arms:-.18,legs:.34}},
  jump:{label:'Salto',targets:{lh:[.32,.78,.18],rh:[.32,.78,.18],lf:[.18,.24,.04],rf:[.18,.22,-.02]},body:{hips:[-.18,0,0],spine:[-.12,0,0],chest:[-.10,0,0],head:[.05,0,0]},poles:{arms:-.18,legs:.42}},
  fall:{label:'Caída',targets:{lh:[.40,.68,.14],rh:[.33,.48,-.22],lf:[.20,.16,.22],rf:[.18,.28,-.18]},body:{hips:[.28,.22,.16],spine:[.20,-.18,.10],chest:[.14,-.12,.08],head:[-.12,-.12,-.08]},poles:{arms:-.22,legs:.40}},
  sit:{label:'Sentada',targets:{lh:[.25,.40,.28],rh:[.25,.40,.28],lf:[.17,.035,.34],rf:[.17,.035,.34]},body:{hips:[-.08,0,0],spine:[.08,0,0],chest:[.05,0,0],head:[-.04,0,0]},poles:{arms:-.12,legs:.48}},
  crouch:{label:'Agachada',targets:{lh:[.25,.28,.30],rh:[.25,.28,.30],lf:[.18,.035,.16],rf:[.18,.035,.16]},body:{hips:[.30,0,0],spine:[.20,0,0],chest:[.12,0,0],head:[-.18,0,0]},poles:{arms:-.14,legs:.50}},
  talk:{label:'Conversación',targets:{lh:[.23,.55,.26],rh:[.36,.58,.14],lf:[.10,.035,.06],rf:[.13,.045,.10]},body:{hips:[0,-.08,.03],spine:[0,.10,-.03],chest:[0,.08,-.02],head:[0,-.14,.03]},poles:{arms:-.22,legs:.30}}
};

export function serializePose(name,preset){return{schemaVersion:POSE_SCHEMA_VERSION,name,...structuredClone(preset)}}
