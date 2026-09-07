import test from 'node:test';
import assert from 'node:assert/strict';
import{distanceForJointAngle,solveTwoBoneGeometry}from'../src/ik-math.js';

test('limits unreachable targets without producing invalid values',()=>{
  const result=solveTwoBoneGeometry(.4,.35,10,{minAngle:10,maxAngle:170});
  assert.ok(Number.isFinite(result.along));assert.ok(Number.isFinite(result.bend));
  assert.equal(result.distance,result.maxReach);assert.ok(result.jointAngle<=170.0001);
});

test('prevents elbows and knees from folding beyond the minimum angle',()=>{
  const result=solveTwoBoneGeometry(.4,.35,0,{minAngle:12,maxAngle:165});
  assert.equal(result.distance,result.minReach);assert.ok(result.jointAngle>=11.9999);
});

test('is symmetric for equal limbs',()=>{
  const result=solveTwoBoneGeometry(.5,.5,.6);
  assert.ok(Math.abs(result.along-.3)<1e-9);assert.ok(result.bend>0);
});

test('distance follows the law of cosines',()=>{
  assert.ok(Math.abs(distanceForJointAngle(1,1,Math.PI/3)-1)<1e-9);
});
