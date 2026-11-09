import {apply,decode,normalize,geometry,parse,Cube,inverse,type Cubies} from './cube.ts';
export type Phase='Cross'|'F2L'|'OLL'|'PLL'|'Solved';
const U=parse('U')[0], Y=parse('y')[0];
const top=geometry.map((g,i)=>g.p[1]===1?i:-1).filter(i=>i>=0);
export function ollKey(f:Uint8Array):string {
  let state=normalize(f);const keys:string[]=[];
  for(let u=0;u<4;u++){keys.push(top.map(i=>state[i]===0?'1':'0').join(''));state=apply(state,U);}
  return keys.sort()[0];
}
const permutationKey=(c:Cubies)=>c.cp.slice(0,4).join('')+':'+c.ep.slice(0,4).join('');
/** Quotient by U setup and rotation of the side-color reference frame (AUF). */
export function pllKey(f:Uint8Array):string {
  let frame=normalize(f);const keys:string[]=[];
  for(let y=0;y<4;y++){
    let state=frame;
    for(let u=0;u<4;u++){keys.push(permutationKey(decode(state)));state=apply(state,U);}
    frame=normalize(apply(frame,Y));
  }
  return keys.sort()[0];
}
function locations(f:Uint8Array,colors:number[]) {
  const groups=new Map<string,number[]>();
  geometry.forEach((g,i)=>{const k=g.p.join(',');groups.set(k,[...(groups.get(k)??[]),i]);});
  return [...groups.values()].find(ids=>ids.length===colors.length&&colors.every(c=>ids.some(i=>f[i]===c)))!;
}
export function recognize(input:Uint8Array){
  const f=normalize(input),c=decode(f);
  const cross=[4,5,6,7].every(i=>c.ep[i]===i&&c.eo[i]===0);
  const slots=[{name:'FR',corner:4,edge:8,colors:[1,2]},{name:'FL',corner:5,edge:9,colors:[2,4]},{name:'BL',corner:6,edge:10,colors:[4,5]},{name:'BR',corner:7,edge:11,colors:[5,1]}].map(s=>{
    const corner=locations(f,[3,...s.colors]),edge=locations(f,s.colors);
    const paired=s.colors.every(color=>{
      const a=geometry[corner.find(i=>f[i]===color)!].n,b=geometry[edge.find(i=>f[i]===color)!].n;
      return a.every((v,i)=>v===b[i]);
    })&&geometry[corner[0]].p.reduce((n,v,i)=>n+Math.abs(v-geometry[edge[0]].p[i]),0)===1;
    return {...s,cornerPosition:geometry[corner[0]].p,edgePosition:geometry[edge[0]].p,paired,solved:c.cp[s.corner]===s.corner&&c.co[s.corner]===0&&c.ep[s.edge]===s.edge&&c.eo[s.edge]===0};
  });
  const f2l=cross&&slots.every(s=>s.solved);
  const oriented=f2l&&Array.from(f.slice(0,9)).every(v=>v===0);
  const solved=Array.from(f).every((v,i)=>v===Math.floor(i/9));
  const phase:Phase=!cross?'Cross':!f2l?'F2L':!oriented?'OLL':!solved?'PLL':'Solved';
  const orientedEdges=[1,3,5,7].filter(i=>f[i]===0);
  const shape=orientedEdges.length===0?'dot':orientedEdges.length===4?'cross':orientedEdges.length===2?(orientedEdges[0]+orientedEdges[1]===8?'line':'L'):'invalid';
  return {phase,cross,f2l,oriented,solved,slots,oll:f2l?{key:ollKey(f),edgeShape:shape,orientedCorners:[0,2,6,8].filter(i=>f[i]===0).length}:null,pll:oriented?{key:pllKey(f),corners:c.cp.slice(0,4),edges:c.ep.slice(0,4)}:null};
}
export const catalog=[
  {id:'sune',stage:'OLL',name:'Sune',algorithm:"R U R' U R U2 R'"},
  {id:'antisune',stage:'OLL',name:'Anti-Sune',algorithm:"R U2 R' U' R U' R'"},
  {id:'edge-line',stage:'OLL',name:'Edge orientation · line',algorithm:"F R U R' U' F'"},
  {id:'t-perm',stage:'PLL',name:'T permutation',algorithm:"R U R' U' R' F R2 U' R' U' R U R' F'"},
  {id:'ua-perm',stage:'PLL',name:'Ua permutation',algorithm:"R U' R U R U R U' R' U' R2"},
  {id:'ub-perm',stage:'PLL',name:'Ub permutation',algorithm:"R2 U R U R' U' R' U' R' U R'"},
] as const;
export function caseState(id:string):Uint8Array {
  const entry=catalog.find(c=>c.id===id);if(!entry)throw new Error('Unknown case');
  return new Cube().algorithm(inverse(parse(entry.algorithm))).facelets;
}
/** Returns executable setup/algorithm/AUF only after simulation verifies its stage postcondition. */
export function matchAlgorithms(f:Uint8Array){
  const state=recognize(f);if(state.phase!=='OLL'&&state.phase!=='PLL')return [];
  return catalog.filter(c=>c.stage===state.phase).flatMap(entry=>{
    const fixture=caseState(entry.id);
    if((entry.stage==='OLL'?ollKey(f)!==ollKey(fixture):pllKey(f)!==pllKey(fixture)))return [];
    const results: {name:string;algorithm:string;setup:number;auf:number;rotation:number}[]=[];
    for(let rotation=0;rotation<4;rotation++)for(let setup=0;setup<4;setup++)for(let auf=0;auf<(entry.stage==='PLL'?4:1);auf++){
      const algorithm=[...Array(rotation).fill('y'),...Array(setup).fill('U'),entry.algorithm,...Array(auf).fill('U'),...Array(rotation).fill("y'")].join(' ');
      const after=recognize(new Cube(f).algorithm(parse(algorithm)).facelets);
      if(entry.stage==='OLL'?after.oriented:after.solved)results.push({name:entry.name,algorithm,setup,auf,rotation});
    }
    return results;
  });
}
