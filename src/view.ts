import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {geometry,type Vec} from './cube.ts';
import {sliceQuaternion} from './quaternion.ts';
import type {Frame} from './playback.ts';
const colors=[0xf3f2e9,0xef5350,0x4ad6a0,0xffd34d,0xff973c,0x629cff];
export class CubeView {
  renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.1,100);
  controls:OrbitControls;items:{mesh:THREE.Mesh;p:Vec;position:THREE.Vector3;base:THREE.Quaternion;sticker:number|null}[]=[];
  observer:ResizeObserver;
  constructor(host:HTMLElement){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(this.renderer.domElement);
    this.camera.position.set(6,5,7);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minDistance=6;this.controls.maxDistance=16;
    this.scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,8,6);this.scene.add(light);
    const bodyGeometry=new THREE.BoxGeometry(.96,.96,.96),bodyMaterial=new THREE.MeshStandardMaterial({color:0x151e2b,roughness:.4});
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
      if(x===0&&y===0&&z===0)continue;const mesh=new THREE.Mesh(bodyGeometry,bodyMaterial);const p:Vec=[x,y,z];const position=new THREE.Vector3(...p).multiplyScalar(1.01);this.scene.add(mesh);this.items.push({mesh,p,position,base:new THREE.Quaternion(),sticker:null});
    }
    const stickerGeometry=new THREE.PlaneGeometry(.82,.82);
    geometry.forEach((g,i)=>{
      const mesh=new THREE.Mesh(stickerGeometry,new THREE.MeshStandardMaterial({color:colors[Math.floor(i/9)],roughness:.34}));
      const base=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...g.n));
      const position=new THREE.Vector3(...g.p).multiplyScalar(1.01).addScaledVector(new THREE.Vector3(...g.n),.486);
      this.scene.add(mesh);this.items.push({mesh,p:g.p,position,base,sticker:i});
    });
    const resize=()=>{const {width,height}=host.getBoundingClientRect();this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);};
    this.observer=new ResizeObserver(resize);this.observer.observe(host);resize();
  }
  frame({cube,move,progress}:Frame){
    const f=cube.facelets,q=new THREE.Quaternion(...(move?sliceQuaternion(move.axis,move.turns,progress):[0,0,0,1] as const));
    for(const item of this.items){
      item.mesh.position.copy(item.position);item.mesh.quaternion.copy(item.base);
      if(move?.layers.includes(item.p[move.axis])){item.mesh.position.applyQuaternion(q);item.mesh.quaternion.premultiply(q);}
      if(item.sticker!==null)(item.mesh.material as THREE.MeshStandardMaterial).color.setHex(colors[f[item.sticker]]);
    }
  }
  render(){this.controls.update();this.renderer.render(this.scene,this.camera);}
  dispose(){this.observer.disconnect();this.controls.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();for(const {mesh} of this.items){geometries.add(mesh.geometry);if(!Array.isArray(mesh.material))materials.add(mesh.material);}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.renderer.dispose();}
}
