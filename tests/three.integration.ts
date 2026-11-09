import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {parse,geometry,rotate} from '../src/cube.ts';
import {sliceQuaternion,transform} from '../src/quaternion.ts';
test('Three.js quaternion vector motion agrees with exact integer endpoints for every slice',()=>{
  for(const token of 'U D R L F B M E S x y z Uw Dw Rw Lw Fw Bw'.split(' '))for(const suffix of ['',"'",'2']){
    const move=parse(token+suffix)[0];const q=new Quaternion(...sliceQuaternion(move.axis,move.turns,1));
    for(const g of geometry){const actual=new Vector3(...g.p).applyQuaternion(q).toArray();const expected=rotate(g.p,move.axis,move.turns);actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-12));}
  }
});
test('Three.js world premultiplication rotates sticker normals correctly throughout a turn',()=>{
  const move=parse('R')[0];
  for(const progress of [0,.1,.5,.9,1]){const values=sliceQuaternion(move.axis,move.turns,progress),q=new Quaternion(...values);
    for(const g of geometry){const base=new Quaternion().setFromUnitVectors(new Vector3(0,0,1),new Vector3(...g.n));const normal=new Vector3(0,0,1).applyQuaternion(base.premultiply(q)).toArray();const expected=transform(g.n,values);normal.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-12));}
  }
});
