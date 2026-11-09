/** URFDLB, row-major, viewed directly at each face. +X right,+Y up,+Z front. */
export type Vec = readonly [number, number, number];
export type Axis = 0 | 1 | 2;
export type Move = Readonly<{axis: Axis; layers: readonly number[]; turns: number; token: string}>;
export const FACES = 'URFDLB';
export const normals: Vec[] = [[0,1,0],[1,0,0],[0,0,1],[0,-1,0],[-1,0,0],[0,0,-1]];
export const geometry = Array.from({length:54}, (_,i) => {
  const f=Math.floor(i/9), r=Math.floor(i%9/3), c=i%3;
  const positions: Vec[] = [[c-1,1,r-1],[1,1-r,1-c],[c-1,1-r,1],[c-1,-1,1-r],[-1,1-r,c-1],[1-c,1-r,-1]];
  return {p:positions[f], n:normals[f]};
});
const key=(p:Vec,n:Vec)=>[...p,...n].join(',');
const lookup=new Map(geometry.map((g,i)=>[key(g.p,g.n),i]));
export function rotate(v:Vec, axis:Axis, turns:number):Vec {
  let [x,y,z]=v;
  for(let i=0;i<((turns%4)+4)%4;i++) {
    if(axis===0) [y,z]=[-z,y];
    if(axis===1) [x,z]=[z,-x];
    if(axis===2) [x,y]=[-y,x];
  }
  return [x,y,z];
}
const specs:Record<string,[Axis,number[],number]>={
  U:[1,[1],-1],D:[1,[-1],1],R:[0,[1],-1],L:[0,[-1],1],F:[2,[1],-1],B:[2,[-1],1],
  M:[0,[0],1],E:[1,[0],1],S:[2,[0],-1],x:[0,[-1,0,1],-1],y:[1,[-1,0,1],-1],z:[2,[-1,0,1],-1],
  Rw:[0,[0,1],-1],Lw:[0,[-1,0],1],Uw:[1,[0,1],-1],Dw:[1,[-1,0],1],Fw:[2,[0,1],-1],Bw:[2,[-1,0],1]
};
export function parse(algorithm:string):Move[] {
  if(!algorithm.trim()) return [];
  return algorithm.trim().split(/\s+/).map(token=>{
    const match=/^([URFDLB]w?|[MESxyz])([2']?)$/.exec(token);
    if(!match) throw new Error(`Invalid move: ${token}. Separate moves with spaces.`);
    const [axis,layers,sign]=specs[match[1]];
    return Object.freeze({axis,layers:Object.freeze([...layers]),turns:sign*(match[2]==='2'?2:match[2]==="'"?-1:1),token});
  });
}
export const inverse=(moves:readonly Move[])=>[...moves].reverse().map(m=>({...m,turns:-m.turns,token:m.token.endsWith('2')?m.token:m.token.endsWith("'")?m.token.slice(0,-1):`${m.token}'`}));
export function permutation(move:Move):Uint8Array {
  if(![0,1,2].includes(move.axis)||!Number.isInteger(move.turns)||!move.layers.length||move.layers.some(l=>![-1,0,1].includes(l))) throw new Error('Invalid slice');
  return Uint8Array.from(geometry.map(g=>{
    const selected=move.layers.includes(g.p[move.axis]);
    return lookup.get(selected?key(rotate(g.p,move.axis,move.turns),rotate(g.n,move.axis,move.turns)):key(g.p,g.n))!;
  }));
}
export function apply(facelets:Uint8Array,move:Move):Uint8Array {
  const next=new Uint8Array(54), p=permutation(move);
  for(let i=0;i<54;i++) next[p[i]]=facelets[i];
  return next;
}
export const solved=()=>Uint8Array.from({length:54},(_,i)=>Math.floor(i/9));
export const cornerIndices=[[8,9,20],[6,18,38],[0,36,47],[2,45,11],[29,26,15],[27,44,24],[33,53,42],[35,17,51]];
export const edgeIndices=[[5,10],[7,19],[3,37],[1,46],[32,16],[28,25],[30,43],[34,52],[23,12],[21,41],[50,39],[48,14]];
const cornerColors=cornerIndices.map(a=>a.map(i=>Math.floor(i/9)));
const edgeColors=edgeIndices.map(a=>a.map(i=>Math.floor(i/9)));
export type Cubies={cp:number[];co:number[];ep:number[];eo:number[]};
export function normalize(f:Uint8Array):Uint8Array {
  const centers=[4,13,22,31,40,49].map(i=>f[i]);
  return Uint8Array.from(f,c=>centers.indexOf(c));
}
export function decode(facelets:Uint8Array):Cubies {
  const f=normalize(facelets), cp:number[]=[],co:number[]=[],ep:number[]=[],eo:number[]=[];
  cornerIndices.forEach((indices,i)=>{
    const colors=indices.map(j=>f[j]);
    const o=colors.findIndex(c=>c===0||c===3);
    const p=cornerColors.findIndex(c=>c.every((v,k)=>v===colors[(k+o)%3]));
    if(o<0||p<0) throw new Error('Invalid corner'); cp[i]=p;co[i]=o;
  });
  edgeIndices.forEach((indices,i)=>{
    const colors=indices.map(j=>f[j]);
    let p=edgeColors.findIndex(c=>c[0]===colors[0]&&c[1]===colors[1]),o=0;
    if(p<0){p=edgeColors.findIndex(c=>c[1]===colors[0]&&c[0]===colors[1]);o=1;}
    if(p<0) throw new Error('Invalid edge'); ep[i]=p;eo[i]=o;
  });
  return {cp,co,ep,eo};
}
export function encode({cp,co,ep,eo}:Cubies):Uint8Array {
  const f=solved();
  cornerIndices.forEach((indices,i)=>indices.forEach((_,k)=>f[indices[(k+co[i])%3]]=cornerColors[cp[i]][k]));
  edgeIndices.forEach((indices,i)=>indices.forEach((_,k)=>f[indices[(k+eo[i])%2]]=edgeColors[ep[i]][k]));
  return f;
}
const parity=(p:number[])=>p.reduce((sum,v,i)=>sum+p.slice(i+1).filter(w=>v>w).length,0)%2;
export function validate(f:Uint8Array):void {
  if(f.length!==54||[...f].some(v=>v>5)||Array.from({length:6},(_,c)=>[...f].filter(v=>v===c).length).some(n=>n!==9)) throw new Error('Expected nine stickers of each of six colors');
  // Centers must form a proper rotation, never a reflection or an arbitrary permutation.
  const centerVectors=[4,13,22,31,40,49].map(i=>normals[f[i]]);
  const [u,r,front,d,l,b]=centerVectors;
  const neg=(a:Vec,c:Vec)=>a.every((v,i)=>v===-c[i]);
  const cross:Vec=[r[1]*u[2]-r[2]*u[1],r[2]*u[0]-r[0]*u[2],r[0]*u[1]-r[1]*u[0]];
  if(!neg(u,d)||!neg(r,l)||!neg(front,b)||!cross.every((v,i)=>v===front[i])) throw new Error('Invalid center frame');
  const {cp,co,ep,eo}=decode(f);
  if(new Set(cp).size!==8||new Set(ep).size!==12) throw new Error('Duplicate piece');
  if(co.reduce((a,b)=>a+b,0)%3||eo.reduce((a,b)=>a+b,0)%2||parity(cp)!==parity(ep)) throw new Error('Unreachable cube state');
}
export class Cube {
  #facelets: Uint8Array<ArrayBufferLike> = solved();
  constructor(facelets?:Uint8Array){if(facelets){validate(facelets);this.#facelets=facelets.slice();}}
  get facelets(){return this.#facelets.slice();}
  move(move:Move){this.#facelets=apply(this.#facelets,move);}
  algorithm(moves:readonly Move[]){moves.forEach(m=>this.move(m));return this;}
  clone(){return new Cube(this.#facelets);}
}
