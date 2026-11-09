import {recognize,type Phase} from './cfop.ts';
import type {Split} from './playback.ts';
const phases:Phase[]=['Cross','F2L','OLL','PLL','Solved'];
/** Wall-clock solve timing. Call observe only after committed moves. */
export class SolveTimer {
  #started:number|null=null;#lastNow=0;#finished:number|null=null;#milestone=0;#splits:Split[]=[];
  get splits(){return this.#splits.map(s=>({...s}));}
  start(facelets:Uint8Array,now:number){
    if(!Number.isFinite(now))throw new Error('Invalid timestamp');
    this.#started=now;this.#lastNow=now;this.#finished=null;this.#milestone=0;this.#splits=[];this.observe(facelets,now);
  }
  elapsed(now:number){if(this.#started===null)return 0;this.#check(now);return (this.#finished??now)-this.#started;}
  #check(now:number){if(!Number.isFinite(now)||now<this.#lastNow)throw new Error('Clock must be monotonic');this.#lastNow=now;}
  observe(facelets:Uint8Array,now:number){
    if(this.#started===null||this.#finished!==null)return;
    this.#check(now);const stage=phases.indexOf(recognize(facelets).phase),elapsed=now-this.#started;
    while(this.#milestone<stage){const previous=this.#splits.at(-1)?.atMs??0;this.#splits.push({phase:phases[this.#milestone++],atMs:elapsed,durationMs:elapsed-previous});}
    if(stage===4)this.#finished=now;
  }
}
