import type {Axis,Vec} from './cube.ts';
export type Quat=readonly [number,number,number,number];
/** Axis-angle on the signed path, including deterministic 180-degree turns. */
export function sliceQuaternion(axis:Axis,turns:number,progress:number):Quat {
  const t=Math.max(0,Math.min(1,progress));const eased=t*t*(3-2*t);
  const half=turns*Math.PI/4*eased;
  const q:[number,number,number,number]=[0,0,0,Math.cos(half)];q[axis]=Math.sin(half);return q;
}
export function transform(v:Vec,q:Quat):Vec {
  const [x,y,z,w]=q;const uv:Vec=[y*v[2]-z*v[1],z*v[0]-x*v[2],x*v[1]-y*v[0]];
  const uuv:Vec=[y*uv[2]-z*uv[1],z*uv[0]-x*uv[2],x*uv[1]-y*uv[0]];
  return [v[0]+2*(w*uv[0]+uuv[0]),v[1]+2*(w*uv[1]+uuv[1]),v[2]+2*(w*uv[2]+uuv[2])];
}
