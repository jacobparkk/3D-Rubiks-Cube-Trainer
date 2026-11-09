import {Cube,type Move} from './cube.ts';
import {recognize,type Phase} from './cfop.ts';
export type Frame={cube:Cube;move:Move|null;progress:number};
export type Split={phase:Phase;atMs:number;durationMs:number};
const phases:Phase[]=['Cross','F2L','OLL','PLL','Solved'];
/** Active-playback clock. Deliberately separate from a human solve stopwatch. */
export class Playback {
  #cube=new Cube();#moves:Move[]=[];#initial=new Cube();#index=0;#progressMs=0;#elapsed=0;#duration=300;#running=false;#step=false;#splits:Split[]=[];#milestone=0;
  constructor(privateFrame:(frame:Frame)=>void=()=>{}){this.onFrame=privateFrame;}
  onFrame:(frame:Frame)=>void;
  get cube(){return this.#cube.clone();} get index(){return this.#index;} get length(){return this.#moves.length;}
  get running(){return this.#running;} get elapsed(){return this.#elapsed;} get splits(){return this.#splits.map(s=>({...s}));}
  get duration(){return this.#duration;}
  set duration(ms:number){if(!Number.isFinite(ms)||ms<16)throw new Error('Duration must be at least 16ms');const ratio=this.#progressMs/this.#duration;this.#duration=ms;this.#progressMs=ratio*ms;}
  load(cube:Cube,moves:readonly Move[]){this.#initial=cube.clone();this.#moves=moves.map(m=>({...m,layers:[...m.layers]}));this.seek(0);}
  play(){this.#step=false;this.#running=this.#index<this.#moves.length;}
  pause(){this.#running=false;}
  step(){if(this.#running)return;this.#step=true;this.#running=this.#index<this.#moves.length;}
  #record(){const stage=phases.indexOf(recognize(this.#cube.facelets).phase);while(this.#milestone<stage){const last=this.#splits.at(-1)?.atMs??0;this.#splits.push({phase:phases[this.#milestone++],atMs:this.#elapsed,durationMs:this.#elapsed-last});}}
  #emit(){this.onFrame({cube:this.#cube.clone(),move:this.#moves[this.#index]??null,progress:this.#progressMs/this.#duration});}
  tick(deltaMs:number){
    if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error('Invalid clock delta');
    while(this.#running&&deltaMs>0){
      const consumed=Math.min(deltaMs,this.#duration-this.#progressMs);this.#progressMs+=consumed;this.#elapsed+=consumed;deltaMs-=consumed;
      if(this.#progressMs>=this.#duration){this.#cube.move(this.#moves[this.#index++]);this.#progressMs=0;this.#record();if(this.#step||this.#index===this.#moves.length)this.#running=false;}
    }
    this.#emit();
  }
  /** Seeking starts a fresh timing pass and reconstructs deterministic nominal splits. */
  seek(index:number){
    if(!Number.isInteger(index)||index<0||index>this.#moves.length)throw new Error('Invalid playhead');
    this.#running=false;this.#step=false;this.#cube=this.#initial.clone();this.#index=0;this.#progressMs=0;this.#elapsed=0;this.#splits=[];this.#milestone=0;this.#record();
    while(this.#index<index){this.#cube.move(this.#moves[this.#index++]);this.#elapsed+=this.#duration;this.#record();}this.#emit();
  }
}
