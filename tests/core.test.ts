import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cube,parse,inverse,apply,solved,permutation,validate,decode,encode,geometry,rotate,normalize} from '../src/cube.ts';
import {recognize,ollKey,pllKey,catalog,caseState,matchAlgorithms} from '../src/cfop.ts';
import {sliceQuaternion,transform} from '../src/quaternion.ts';
import {Playback} from '../src/playback.ts';
const tokens='U D R L F B M E S x y z Uw Dw Rw Lw Fw Bw'.split(' ');
for(const token of tokens)test(`${token}: bijection, order four, inverse, legal state and quaternion endpoint`,()=>{
  const move=parse(token)[0],p=permutation(move);assert.equal(new Set(p).size,54);
  const cube=new Cube();for(let i=0;i<4;i++){cube.move(move);validate(cube.facelets);}assert.deepEqual(cube.facelets,solved());
  cube.algorithm([move,...inverse([move])]);assert.deepEqual(cube.facelets,solved());
  for(const suffix of ['',"'",'2']){const m=parse(token+suffix)[0],q=sliceQuaternion(m.axis,m.turns,1);
    for(const g of geometry){const actual=transform(g.p,q),expected=rotate(g.p,m.axis,m.turns);actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-12));}
  }
});
test('R convention moves F right column onto U right column',()=>{const f=new Cube().algorithm(parse('R')).facelets;[2,5,8].forEach(i=>assert.equal(f[i],2));[20,23,26].forEach(i=>assert.equal(f[i],3));});
test('six sexy moves return identity',()=>assert.deepEqual(new Cube().algorithm(parse(Array(6).fill("R U R' U'").join(' '))).facelets,solved()));
test('random legal move chains round trip without mutation leaks',()=>{
  let seed=42;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed;};
  const moves=Array.from({length:1500},()=>parse(tokens[rand()%tokens.length]+['',"'",'2'][rand()%3])[0]);
  const cube=new Cube();for(const move of moves){cube.move(move);validate(cube.facelets);assert.deepEqual(encode(decode(cube.facelets)),normalize(cube.facelets));}
  const exported=cube.facelets;exported.fill(255);validate(cube.facelets);cube.algorithm(inverse(moves));assert.deepEqual(cube.facelets,solved());
});
test('reject illegal imports: flipped edge, twisted corner, odd swap, bad centers/counts',()=>{
  const flip=solved();[flip[5],flip[10]]=[flip[10],flip[5]];assert.throws(()=>new Cube(flip),/Unreachable/);
  const twist=solved();[twist[8],twist[9],twist[20]]=[twist[9],twist[20],twist[8]];assert.throws(()=>new Cube(twist),/Unreachable/);
  const c=decode(solved());[c.ep[0],c.ep[1]]=[c.ep[1],c.ep[0]];assert.throws(()=>new Cube(encode(c)),/Unreachable/);
  const reflection=solved();[reflection[13],reflection[40]]=[reflection[40],reflection[13]];assert.throws(()=>new Cube(reflection),/center/);
  assert.throws(()=>new Cube(new Uint8Array(54)));assert.throws(()=>parse('R nonsense'));assert.throws(()=>parse('(R U)2'));
});
test('cross checks side alignment; F2L slots report actual pieces',()=>{
  assert.equal(recognize(solved()).phase,'Solved');
  const d=new Cube().algorithm(parse('D')).facelets;assert.equal(recognize(d).cross,false);
  const r=recognize(new Cube().algorithm(parse("R U R'")).facelets);assert.equal(r.cross,true);assert.equal(r.phase,'F2L');assert.equal(r.slots.filter(s=>s.solved).length,3);
  for(const slot of recognize(solved()).slots){assert.equal(slot.paired,true);assert.equal(slot.solved,true);}
});
test('OLL enumeration covers 216 orientations and 58 U-orbits including solved',()=>{
  const keys=new Set<string>();let states=0;
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)for(let mask=0;mask<8;mask++){
    const cubies=decode(solved());cubies.co.splice(0,4,a,b,c,(6-a-b-c)%3);
    const edges=[mask&1,(mask>>1)&1,(mask>>2)&1];cubies.eo.splice(0,4,...edges,edges.reduce((a,b)=>a+b,0)%2);
    const f=encode(cubies);validate(f);keys.add(ollKey(f));states++;assert.equal(recognize(f).f2l,true);
    assert.equal(ollKey(f),ollKey(apply(f,parse('U')[0])));
  }
  assert.equal(states,216);assert.equal(keys.size,58);
});
const perms=(a:number[]):number[][]=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[v,...p])):[[]];
const parity=(p:number[])=>p.reduce((s,v,i)=>s+p.slice(i+1).filter(w=>v>w).length,0)%2;
test('PLL enumeration covers 288 permutations and 22 classes including AUF/solved',()=>{
  const keys=new Set<string>();let states=0;
  for(const cp of perms([0,1,2,3]))for(const ep of perms([0,1,2,3])){if(parity(cp)!==parity(ep))continue;
    const c=decode(solved());c.cp.splice(0,4,...cp);c.ep.splice(0,4,...ep);const f=encode(c);validate(f);states++;keys.add(pllKey(f));
    assert.equal(recognize(f).oriented,true);assert.equal(pllKey(f),pllKey(apply(f,parse('U')[0])));
    assert.equal(pllKey(f),pllKey(apply(f,parse('y')[0])));
  }
  assert.equal(states,288);assert.equal(keys.size,22);
});
for(const entry of catalog)test(`catalog ${entry.id}: preserves F2L and verifies recommendations for all AUFs`,()=>{
  let f=caseState(entry.id);assert.equal(recognize(f).phase,entry.stage);
  for(let setup=0;setup<4;setup++){
    assert.equal(recognize(f).f2l,true);const matches=matchAlgorithms(f);assert.ok(matches.length>0);
    for(const match of matches){const after=recognize(new Cube(f).algorithm(parse(match.algorithm)).facelets);assert.equal(entry.stage==='OLL'?after.oriented:after.solved,true);}
    f=apply(f,parse('U')[0]);
  }
});
test('playback commits atomically, pauses, steps, seeks and rejects bad inputs',()=>{
  const p=new Playback();p.load(new Cube(),parse('R U'));p.play();p.tick(150);assert.deepEqual(p.cube.facelets,solved());p.pause();p.tick(1000);assert.equal(p.elapsed,150);
  p.step();p.tick(1000);assert.equal(p.index,1);assert.equal(p.running,false);assert.equal(p.elapsed,300);
  p.play();p.tick(300);assert.equal(p.index,2);assert.deepEqual(p.cube.facelets,new Cube().algorithm(parse('R U')).facelets);
  p.seek(0);assert.deepEqual(p.cube.facelets,solved());p.seek(1);assert.deepEqual(p.cube.facelets,new Cube().algorithm(parse('R')).facelets);
  assert.throws(()=>p.seek(3));assert.throws(()=>p.tick(-1));assert.throws(()=>{p.duration=0;});
});
test('playback timing is independent of frame partition and speed change preserves progress',()=>{
  const initial=new Cube(caseState('t-perm')),moves=parse(catalog.find(c=>c.id==='t-perm')!.algorithm);
  const a=new Playback(),b=new Playback();a.load(initial,moves);b.load(initial,moves);a.play();b.play();a.tick(moves.length*300);for(let i=0;i<moves.length*30;i++)b.tick(10);
  assert.deepEqual(a.cube.facelets,b.cube.facelets);assert.deepEqual(a.splits,b.splits);assert.equal(a.splits.at(-1)?.phase,'PLL');assert.equal(a.splits.at(-1)?.atMs,moves.length*300);
  assert.equal(a.splits.filter(s=>s.atMs===0).length,3);
  b.seek(0);b.play();b.tick(150);b.duration=600;b.tick(299);assert.equal(b.index,0);b.tick(1);assert.equal(b.index,1);
});
test('seeking while mid-turn resets animation and reconstructs committed state',()=>{const p=new Playback();p.load(new Cube(),parse('R U F'));p.play();p.tick(450);p.seek(2);assert.equal(p.running,false);assert.equal(p.elapsed,600);assert.deepEqual(p.cube.facelets,new Cube().algorithm(parse('R U')).facelets);});

test('named matches include rotated side frames with executable setup',()=>{
  for(const entry of catalog){let f=caseState(entry.id);for(let i=0;i<4;i++){const matches=matchAlgorithms(f);assert.ok(matches.length,`${entry.id}, rotation ${i}`);const after=recognize(new Cube(f).algorithm(parse(matches[0].algorithm)).facelets);assert.equal(entry.stage==='OLL'?after.oriented:after.solved,true);f=apply(f,parse('y')[0]);}}
});
