import './style.css';
import {Cube,parse,inverse} from './cube.ts';
import {catalog,caseState,recognize,matchAlgorithms} from './cfop.ts';
import {Playback} from './playback.ts';
import {CubeView} from './view.ts';
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<header><a class="brand" href="./"><span class="mark">▦</span> CUBE / LAB</a><span class="tag">CFOP TRAINING STUDIO</span></header>
<main><section class="stage"><div class="eyebrow">UNDERSTAND EVERY TURN</div><h1>See the solve.<br><span>Build the intuition.</span></h1><div id="viewport" aria-label="Interactive 3D Rubik's cube"></div><div class="viewhint">Drag to orbit <span>•</span> Scroll to zoom <span>•</span> White on top, yellow cross</div><div class="phasebar" id="phases"></div></section>
<aside><div class="sectionhead"><span>01 / ALGORITHM LAB</span><span class="live">● EXACT STATE</span></div><h2>One move at a time.</h2><label for="case">Practice case</label><select id="case">${catalog.map(c=>`<option value="${c.id}">${c.stage} · ${c.name}</option>`).join('')}</select><p class="hint">Loads the inverse algorithm as a practice state.</p><label for="algorithm">Move sequence</label><textarea id="algorithm" rows="3" spellcheck="false"></textarea><div class="row"><button id="load">Prepare case</button><button id="scramble" class="secondary">Scramble</button><button id="reset" class="secondary">Reset</button></div><p id="error" role="alert"></p>
<div class="transport"><button id="back" class="secondary" aria-label="Previous move">←</button><button id="play">Play</button><button id="step" class="secondary">Step →</button><span id="counter">0 / 0</span></div><label for="speed">Turn duration <span id="speedvalue">300 ms</span></label><input id="speed" type="range" min="80" max="1000" value="300" step="10"><div id="sequence" class="sequence"></div>
<div class="sectionhead divider"><span>02 / STATE INSPECTOR</span><span id="phase"></span></div><div id="slots" class="slots"></div><p id="recognition"></p><p id="suggestion" class="hint"></p><details><summary>Canonical case signature</summary><code id="signature"></code></details>
<div class="sectionhead divider"><span>03 / PHASE SPLITS</span><span id="elapsed">0.00 s</span></div><div id="splits"></div><p class="hint">Active playback time; pauses excluded. Seeking rebuilds timing. A human solve stopwatch should be a separate session clock.</p></aside></main><footer>Exact permutations. Quaternion motion. <span>Architecture-first prototype · 6 teaching algorithms</span></footer>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let view:CubeView|null=null;
try{view=new CubeView(el('viewport'));}catch{el('viewport').innerHTML='<p class="fallback">WebGL is unavailable. The state engine and playback controls still work.</p>';}
let lastState='',sequence:string[]=[];
const playback=new Playback(frame=>{
  view?.frame(frame);el('counter').textContent=`${playback.index} / ${playback.length}`;el('play').textContent=playback.running?'Pause':'Play';
  el('elapsed').textContent=`${(playback.elapsed/1000).toFixed(2)} s`;
  el('sequence').querySelectorAll('span').forEach((node,i)=>node.classList.toggle('current',i===playback.index));
  const f=frame.cube.facelets,key=Array.from(f).join('');if(key!==lastState){lastState=key;const state=recognize(f);
    el('phase').textContent=state.phase;el('phases').innerHTML=['Cross','F2L','OLL','PLL'].map(p=>`<span class="${p===state.phase?'active':''}">${p}</span>`).join('');
    el('slots').innerHTML=state.slots.map(s=>`<div class="${s.solved?'done':''}"><b>${s.name}</b><span>${s.solved?'Solved':s.paired?'Paired':'Separate'}</span></div>`).join('');
    el('recognition').textContent=state.solved?'Cube solved. Every piece is home.':state.oll?`OLL edges: ${state.oll.edgeShape} · ${state.oll.orientedCorners}/4 corners oriented`:'Complete the yellow cross and four F2L slots to unlock OLL recognition.';
    if(state.phase==='PLL')el('recognition').textContent=`PLL corners: ${state.pll!.corners.join(' → ')} · edges: ${state.pll!.edges.join(' → ')}`;
    el('signature').textContent=state.pll?.key??state.oll?.key??'Not in a last-layer stage';
    const matches=matchAlgorithms(f);el('suggestion').textContent=matches[0]?`${matches[0].name}: ${matches[0].algorithm}`:state.solved?'Select a case to continue.':'A signature can be recognized without a named algorithm in the starter catalog.';
  }
  el('splits').innerHTML=playback.splits.map(s=>`<div><span>${s.phase}</span><b>${(s.durationMs/1000).toFixed(2)} s</b></div>`).join('');
});
function load(cube:Cube,algorithm:string){const moves=parse(algorithm);sequence=moves.map(m=>m.token);el('sequence').replaceChildren(...sequence.map(token=>{const span=document.createElement('span');span.textContent=token;return span;}));playback.load(cube,moves);el('error').textContent='';}
function prepare(){try{const algorithm=el<HTMLTextAreaElement>('algorithm').value;const moves=parse(algorithm);load(new Cube().algorithm(inverse(moves)),algorithm);}catch(e){el('error').textContent=(e as Error).message;}}
function choose(){const entry=catalog.find(c=>c.id===el<HTMLSelectElement>('case').value)!;el<HTMLTextAreaElement>('algorithm').value=entry.algorithm;load(new Cube(caseState(entry.id)),entry.algorithm);}
el('case').addEventListener('change',choose);el('load').onclick=prepare;el('play').onclick=()=>playback.running?playback.pause():playback.play();el('step').onclick=()=>playback.step();el('back').onclick=()=>playback.seek(Math.max(0,playback.index-1));el('reset').onclick=()=>playback.seek(0);
el('speed').oninput=()=>{playback.duration=Number(el<HTMLInputElement>('speed').value);el('speedvalue').textContent=`${playback.duration} ms`;};
el('scramble').onclick=()=>{
  const moves:string[]=[];let last=-1;
  for(let i=0;i<22;i++){const random=new Uint32Array(2);let face:number;do{crypto.getRandomValues(random);face=random[0]%6;}while(Math.floor(face/2)===last);last=Math.floor(face/2);moves.push(['U','D','R','L','F','B'][face]+['',"'",'2'][random[1]%3]);}
  // Training scramble, not an official uniform random-state scramble.
  const solution=inverse(parse(moves.join(' '))).map(m=>m.token).join(' ');el<HTMLTextAreaElement>('algorithm').value=solution;load(new Cube().algorithm(parse(moves.join(' '))),solution);
};
let previous=performance.now();function animate(now:number){const dt=now-previous;previous=now;playback.tick(dt);view?.render();requestAnimationFrame(animate);}document.addEventListener('visibilitychange',()=>{if(document.hidden)playback.pause();previous=performance.now();});choose();requestAnimationFrame(animate);
