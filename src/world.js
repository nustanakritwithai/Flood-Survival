import * as pc from "playcanvas";

function material(color,opts={}){
  const m=new pc.StandardMaterial();
  m.diffuse=new pc.Color(color[0],color[1],color[2]);
  m.metalness=opts.metalness??0;m.gloss=opts.gloss??.25;
  if(opts.emissive){m.emissive=new pc.Color(...opts.emissive);m.emissiveIntensity=opts.emissiveIntensity??1;}
  if(opts.opacity!==undefined&&opts.opacity<1){m.opacity=opts.opacity;m.blendType=pc.BLEND_NORMAL;m.depthWrite=opts.depthWrite??false;}
  m.update();return m;
}
function primitive(app,type,name,scale,position,mat,euler=[0,0,0]){
  const e=new pc.Entity(name);e.addComponent("render",{type});e.setLocalScale(...scale);e.setPosition(...position);e.setEulerAngles(...euler);
  if(e.render?.meshInstances?.[0])e.render.meshInstances[0].material=mat;app.root.addChild(e);return e;
}
export class FloodWorld{
  constructor(canvas){
    this.canvas=canvas;this.zoom=7.2;this.rainFx=.14;this.rainDrops=[];
    this.app=new pc.Application(canvas,{graphicsDeviceOptions:{antialias:true,alpha:false,powerPreference:"high-performance"}});
    this.app.start();this.app.scene.ambientLight=new pc.Color(.19,.28,.34);this.app.scene.exposure=1.15;
    this.m={ground:material([.12,.18,.19]),road:material([.10,.13,.15]),line:material([.65,.60,.39]),canal:material([.04,.24,.31],{gloss:.72}),water:material([.05,.39,.55],{gloss:.9,opacity:.58}),wall:material([.64,.55,.43]),wall2:material([.49,.39,.31]),roof:material([.34,.13,.14]),bed:material([.43,.28,.18]),mattress:material([.78,.77,.70]),skin:material([.58,.32,.24]),shirt:material([.05,.16,.21]),concrete:material([.34,.38,.40]),tree:material([.10,.28,.20]),trunk:material([.27,.18,.12]),lamp:material([.72,.42,.14],{emissive:[1,.43,.12],emissiveIntensity:1.6})};
    this.makeCamera();this.makeLights();this.buildScene();this.makeRain();this.resize();
    this.app.on("update",dt=>this.update(dt));window.addEventListener("resize",()=>this.resize());
  }
  makeCamera(){this.camera=new pc.Entity("Isometric Camera");this.camera.addComponent("camera",{clearColor:new pc.Color(.035,.10,.14),projection:pc.PROJECTION_ORTHOGRAPHIC,orthoHeight:this.zoom,nearClip:.1,farClip:100});this.app.root.addChild(this.camera);this.resetView();}
  makeLights(){const sun=new pc.Entity("Cool Moon");sun.addComponent("light",{type:"directional",color:new pc.Color(.68,.82,1),intensity:2.2,castShadows:true});sun.setEulerAngles(47,-35,0);this.app.root.addChild(sun);const warm=new pc.Entity("Warm House Light");warm.addComponent("light",{type:"omni",color:new pc.Color(1,.53,.20),intensity:8,range:5});warm.setPosition(-1.6,1.6,.4);this.app.root.addChild(warm);}
  resetView(){this.camera.setPosition(7.2,7.8,8.7);this.camera.lookAt(0,.65,0);if(this.camera.camera)this.camera.camera.orthoHeight=this.zoom;}
  setZoom(delta){this.zoom=pc.math.clamp(this.zoom+delta,4.8,10);this.camera.camera.orthoHeight=this.zoom;}
  buildScene(){
    primitive(this.app,"box","Ground",[9.6,.16,7.4],[0,-.13,0],this.m.ground);primitive(this.app,"box","Road",[9.3,.04,1.55],[0,-.02,1.65],this.m.road);
    for(let x=-3.8;x<=3.8;x+=1.45)primitive(this.app,"box","Road marking",[.72,.015,.05],[x,.015,1.65],this.m.line);
    primitive(this.app,"box","Canal bed",[9.5,.05,1.35],[0,-.02,-2.65],this.m.road);this.canal=primitive(this.app,"box","Canal water",[9.5,.20,1.32],[0,.12,-2.65],this.m.canal);
    this.water=primitive(this.app,"box","Flood water",[9.55,.16,7.25],[0,.08,0],this.m.water);
    this.house(-.9,.25,true);this.house(-3.2,-.15,false);this.house(3.15,.10,false);this.bridge();this.trees();this.poles();
  }
  house(x,z,hero){
    primitive(this.app,"box","House floor",[2.45,.16,1.9],[x,.03,z],this.m.wall2);primitive(this.app,"box","Back wall",[2.45,1.75,.12],[x,.92,z-.91],this.m.wall);primitive(this.app,"box","Side wall",[.12,1.75,1.9],[x-1.17,.92,z],this.m.wall);primitive(this.app,"box","Upper floor",[2.45,.14,1.9],[x,1.80,z],this.m.wall2);primitive(this.app,"box","Upper room",[2.45,1.20,1.9],[x,2.47,z],this.m.wall);primitive(this.app,"box","Roof",[2.0,.34,2.0],[x,3.28,z],this.m.roof,[0,45,0]);
    if(hero){primitive(this.app,"box","Bed frame",[1.05,.28,.72],[x+.23,.30,z-.18],this.m.bed);primitive(this.app,"box","Mattress",[.98,.20,.67],[x+.23,.52,z-.18],this.m.mattress);primitive(this.app,"cylinder","Character body",[.17,.48,.17],[x+.10,.91,z-.18],this.m.shirt);primitive(this.app,"sphere","Character head",[.23,.23,.23],[x+.10,1.25,z-.18],this.m.skin);primitive(this.app,"box","Bedside table",[.35,.44,.34],[x-.62,.30,z-.35],this.m.bed);primitive(this.app,"sphere","Warm lamp",[.14,.14,.14],[x-.62,.64,z-.35],this.m.lamp);}
  }
  bridge(){primitive(this.app,"box","Bridge deck",[2.25,.20,1.55],[2.1,.66,-2.65],this.m.concrete);primitive(this.app,"box","Bridge p1",[.18,1.10,.22],[1.35,.15,-2.65],this.m.concrete);primitive(this.app,"box","Bridge p2",[.18,1.10,.22],[2.85,.15,-2.65],this.m.concrete);}
  trees(){[[-3.7,-1.45],[3.55,-1.45],[.45,-1.60]].forEach(([x,z])=>{primitive(this.app,"cylinder","Tree trunk",[.13,.85,.13],[x,.42,z],this.m.trunk);primitive(this.app,"sphere","Tree crown",[.72,.72,.72],[x,1.12,z],this.m.tree);});}
  poles(){[-4.1,4.1].forEach(x=>primitive(this.app,"cylinder","Utility pole",[.07,2.6,.07],[x,1.25,1.48],this.m.concrete));}
  makeRain(){const rm=material([.60,.79,.94],{emissive:[.12,.20,.28],emissiveIntensity:.35,opacity:.68});for(let i=0;i<72;i++){const d=primitive(this.app,"box","Rain drop",[.018,.18,.018],[(Math.random()-.5)*9.5,Math.random()*7+.7,(Math.random()-.5)*6.6],rm,[0,0,-10]);d.enabled=false;d._speed=4+Math.random()*3;this.rainDrops.push(d);}}
  setState(e){this.rainFx=e.rainFx;this.water.setPosition(0,.05+e.water*.93,0);this.water.setLocalScale(9.55,.12+e.water*.15,7.25);this.canal.setPosition(0,.12+e.water*.22,-2.65);const count=Math.round(this.rainDrops.length*e.rainFx);this.rainDrops.forEach((d,i)=>d.enabled=i<count);const dark=.05+e.rainFx*.04;this.camera.camera.clearColor=new pc.Color(dark,.10-e.rainFx*.025,.14-e.rainFx*.02);}
  update(dt){for(const d of this.rainDrops){if(!d.enabled)continue;const p=d.getPosition().clone();p.y-=d._speed*dt*(.7+this.rainFx*.9);p.x-=dt*.35;if(p.y<-.1){p.y=7+Math.random();p.x=(Math.random()-.5)*9.5;p.z=(Math.random()-.5)*6.6;}d.setPosition(p);}}
  resize(){const p=this.canvas.parentElement;this.app.resizeCanvas(Math.max(320,p.clientWidth),Math.max(420,p.clientHeight));}
}