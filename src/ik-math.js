export function clamp(value,min,max){return Math.max(min,Math.min(max,value))}

export function distanceForJointAngle(upperLength,lowerLength,angle){
  return Math.sqrt(Math.max(0,upperLength**2+lowerLength**2-2*upperLength*lowerLength*Math.cos(angle)))
}

export function solveTwoBoneGeometry(upperLength,lowerLength,targetDistance,{minAngle=8,maxAngle=172}={}){
  if(!(upperLength>0)||!(lowerLength>0))throw new RangeError('Bone lengths must be positive');
  const minRadians=minAngle*Math.PI/180,maxRadians=maxAngle*Math.PI/180;
  const minReach=Math.max(Math.abs(upperLength-lowerLength)+1e-4,distanceForJointAngle(upperLength,lowerLength,minRadians));
  const maxReach=Math.min(upperLength+lowerLength-1e-4,distanceForJointAngle(upperLength,lowerLength,maxRadians));
  const distance=clamp(Number.isFinite(targetDistance)?targetDistance:maxReach,minReach,maxReach);
  const along=(upperLength**2-lowerLength**2+distance**2)/(2*distance);
  const bend=Math.sqrt(Math.max(upperLength**2-along**2,0));
  const cosine=clamp((upperLength**2+lowerLength**2-distance**2)/(2*upperLength*lowerLength),-1,1);
  return{distance,along,bend,jointAngle:Math.acos(cosine)*180/Math.PI,minReach,maxReach};
}
