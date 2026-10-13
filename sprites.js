/* PlayLab 95 v0.6: original, event-driven football animation sprites.
   No third-party or copyrighted game art is embedded. */
(function () {
  'use strict';
  const CACHE = new Map();
  const BASE_W = 84, BASE_H = 120;
  const palette = {
    offense: { jersey: '#2679ad', shadow: '#16466f', light: '#68c8ee', helmet: '#81d6fb', helmetDark: '#23648b', pants: '#d9e1e8', trim: '#e8f4fc', sock: '#f6f9ff' },
    defense: { jersey: '#b53b3d', shadow: '#6c2029', light: '#f37f77', helmet: '#eb6c63', helmetDark: '#913139', pants: '#ded9d6', trim: '#ffcfb7', sock: '#fff2e6' }
  };
  function fillEllipse(g,x,y,rx,ry,color) {g.fillStyle=color;g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);g.fill();}
  function stroke(g,x1,y1,x2,y2,w,color) {g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
  function polygon(g,points,fill,outline='#162433') {g.beginPath();g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))g.lineTo(p[0],p[1]);g.closePath();g.fillStyle=fill;g.fill();if(outline){g.lineWidth=2;g.strokeStyle=outline;g.stroke();}}
  function head(g,side,back,p) {
    const front = side === 'front';
    fillEllipse(g,42,23,16,16,'#162537');
    fillEllipse(g,41,21,15.4,15.2,p.helmetDark);
    fillEllipse(g,39,18,13.5,13.2,p.helmet);
    fillEllipse(g,36.5,13,7.6,3.1,'#ffffff63');
    if(front){
      polygon(g,[[29,23],[55,23],[52,35],[32,35]],'#a66e4a');
      stroke(g,27,25,57,25,3.5,'#e9f2f6');
      stroke(g,30,32,55,32,2.4,'#d5dfe8');
      stroke(g,33,23,33,34,2,'#ebf5fc');stroke(g,51,23,51,34,2,'#ebf5fc');
    }else if(side==='side'){
      fillEllipse(g,51,27,8,9,'#936348');
      polygon(g,[[51,22],[63,24],[61,29],[54,31]],'#e5edf2');
      stroke(g,54,24,62,24,2,'#d9e8ec');stroke(g,53,30,63,30,2,'#d9e8ec');
    }else{
      stroke(g,41,7,41,21,3.6,'#f5f8fc');
      polygon(g,[[31,27],[50,27],[46,32],[34,32]],p.helmetDark,null);
    }
  }
  // Lightweight sprite creation is performed once per team, role, direction, state and frame.
  function createSprite(team,kind,direction,action,frame,number) {
    const c=document.createElement('canvas');c.width=BASE_W;c.height=BASE_H;
    const g=c.getContext('2d');
    const p=palette[team];
    const phase=(frame%6)*Math.PI/3;
    const isRun=action==='run' || action==='dropback';
    const isCadence=action==='cadence';
    const isSnap=action==='snap';
    const isReach=action==='reach';
    const isSecure=action==='secure';
    const isDive=action==='dive';
    const isBlock=action==='block';
    const isCrouch=action==='crouch'||action==='down';
    const isPass=action==='pass';
    const isCatch=action==='catch';
    const isHit=action==='tackle'||isDive;
    const isReady=action==='ready' || action==='set'||isCadence;
    const depth=direction;
    const front=(depth===3 || depth===4 || depth===5);
    const back=(depth===0 || depth===1 || depth===7);
    const side=(depth===2 || depth===6);
    const drawnSide=side?'side':front?'front':'back';
    const bounce=isRun?Math.abs(Math.sin(phase))*4:isReady?Math.sin(phase)*2.8:0;
    const stride=isRun?Math.sin(phase)*14:isReady?Math.sin(phase)*1.3:0;
    const armSwing=isRun?Math.sin(phase)*13:0;
    const squat=isCrouch?12+Math.sin(phase)*2.9:isBlock?8:isHit?11:isSnap?9:isReady?3.5+Math.sin(phase)*1.5:0;
    const tilt=isBlock?-7:isPass?3:isHit?18:isSnap?-9:isCrouch?-12:isReady?Math.sin(phase)*2.8:0;
    const bodyY=bounce+squat;
    const footLeft=106+(isCrouch?-4:0), footRight=106+(isCrouch?-4:0);
    g.save();g.translate(42,58+bodyY);g.rotate(tilt*Math.PI/180);g.translate(-42,-58-bodyY);
    // Lower body. Dark outlines and separate knee joints maintain definition at small sizes.
    const hipY=72+bodyY,waistY=64+bodyY;
    const legs=[
      {sx:35, kneeX:33+stride*.65,kneeY:88+bodyY-stride*.10,footX:29+stride,footY:footLeft+bodyY-Math.max(0,stride)*.52},
      {sx:49, kneeX:52-stride*.65,kneeY:88+bodyY+stride*.10,footX:55-stride,footY:footRight+bodyY-Math.max(0,-stride)*.52}
    ];
    for(const l of legs){
      stroke(g,l.sx,hipY,l.kneeX,l.kneeY,13,'#182737');stroke(g,l.sx,hipY,l.kneeX,l.kneeY,9,p.pants);
      stroke(g,l.kneeX,l.kneeY,l.footX,l.footY,10,'#152638');stroke(g,l.kneeX,l.kneeY,l.footX,l.footY,7,p.sock);
      fillEllipse(g,l.footX+1,l.footY+1,8,3.7,'#172532');
      stroke(g,l.kneeX+1,l.kneeY+6,l.footX+1,l.footY-4,1.7,'#9bb4ba');
    }
    polygon(g,[[28,62+bodyY],[56,62+bodyY],[55,76+bodyY],[30,76+bodyY]],p.pants);
    polygon(g,[[31,64+bodyY],[53,64+bodyY],[52,70+bodyY],[31,70+bodyY]],p.shadow,null);
    // Back arm, partly hidden by the shoulder pads.
    const shoulderY=42+bodyY, elbowY=60+bodyY,handY=77+bodyY;
    let lArm=armSwing,rArm=-armSwing;
    if(isBlock){lArm=-8+Math.sin(phase)*2;rArm=8-Math.sin(phase)*2;}
    if(isPass){lArm=frame>=2?12:0;rArm=frame>=2?-32:-12;}
    if(isCatch||isReach){lArm=-18;rArm=18;}
    if(isCadence){lArm=24+Math.sin(phase)*12;rArm=-10+Math.cos(phase)*11;}
    if(isSnap){lArm=-18;rArm=16;}
    if(isSecure){lArm=19;rArm=-16;}
    if(isHit){lArm=27;rArm=-27;}
    if(isCrouch){lArm=-3;rArm=3;}
    const arms=[{s:27,bend:20-lArm*.44,end:22-lArm*.55,raise:isPass&&frame>=2?0:0},
                {s:57,bend:64-rArm*.44,end:64-rArm*.55,raise:isPass?(frame>=2?-38:frame===1?-18:0):0}];
    const a0=arms[0];
    const reaching=isCatch||isReach;
    const reachFraction=reaching?Math.min(1,(frame+1)/4):0;
    const leftElY=reaching?60-31*reachFraction:isSecure?54+bodyY:elbowY-lArm*.43;
    const leftHandY=reaching?77-68*reachFraction:isSecure?57+bodyY:handY-lArm*.6;
    const leftElX=reaching?23:isSecure?27:a0.bend;
    const leftHandX=reaching?32:isSecure?39:a0.end;
    stroke(g,a0.s,shoulderY+3,leftElX,leftElY,14,'#162737');
    stroke(g,a0.s,shoulderY+3,leftElX,leftElY,10,p.jersey);
    stroke(g,leftElX,leftElY,leftHandX,leftHandY,10,'#152331');
    stroke(g,leftElX,leftElY,leftHandX,leftHandY,7,p.trim);
    fillEllipse(g,leftHandX,leftHandY,4.3,5,'#ad794f');
    // Shaped shoulder pads with the tapered jersey body.
    polygon(g,[[31,37+bodyY],[52,37+bodyY],[60,47+bodyY],[53,69+bodyY],[30,69+bodyY],[24,46+bodyY]],p.shadow);
    polygon(g,[[29,38+bodyY],[53,38+bodyY],[57,47+bodyY],[51,66+bodyY],[31,66+bodyY],[27,47+bodyY]],p.jersey,null);
    polygon(g,[[24,40+bodyY],[34,38+bodyY],[35,51+bodyY],[23,51+bodyY]],p.light);
    polygon(g,[[50,38+bodyY],[59,41+bodyY],[60,51+bodyY],[49,51+bodyY]],p.light);
    stroke(g,29,50+bodyY,55,50+bodyY,1.5,p.shadow);
    // Player number remains distinguishable at larger sizes.
    g.save();g.fillStyle=front?'#ffffff':'#eaf9ff';g.strokeStyle=p.shadow;
    g.font='bold 19px Arial Narrow,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';
    g.lineWidth=2.0;const label=String(number||'00');
    g.strokeText(label,42,56+bodyY);g.fillText(label,42,56+bodyY);g.restore();
    const a1=arms[1];
    const elbow1=reaching?61:isSecure?58:isPass?a1.bend+4:a1.bend;
    const elY1=reaching?60-31*reachFraction:isSecure?54+bodyY:isPass?elbowY+a1.raise*.48:elbowY-rArm*.43;
    const rightHandX=reaching?52:isSecure?46:a1.end;
    const handY1=reaching?77-68*reachFraction:isSecure?56+bodyY:isPass?handY+a1.raise:handY-rArm*.6;
    stroke(g,a1.s,shoulderY+3,elbow1,elY1,14,'#172837');
    stroke(g,a1.s,shoulderY+3,elbow1,elY1,10,p.jersey);
    stroke(g,elbow1,elY1,rightHandX,handY1,10,'#142333');
    stroke(g,elbow1,elY1,rightHandX,handY1,7,p.trim);
    fillEllipse(g,rightHandX,handY1,4.7,5.0,'#ad794f');
    if(isPass&&frame<3){fillEllipse(g,a1.end+3,handY1-5,5,7,'#864b22');stroke(g,a1.end+1,handY1-7,a1.end+5,handY1-7,1.8,'#f4f2e4');}
    if(isSecure){fillEllipse(g,42,55+bodyY,8,5,'#89502b');stroke(g,39,54+bodyY,45,54+bodyY,1.8,'#ffeed5');}
    if(isCadence&&frame===2){stroke(g,39,45+bodyY,52,45+bodyY,3,'#edc8a6');}
    // Neck and helmet, with a face-mask for front/side silhouettes.
    polygon(g,[[36,32+bodyY],[49,32+bodyY],[50,41+bodyY],[35,41+bodyY]],'#a76b49',null);
    g.save();g.translate(0,bodyY);head(g,drawnSide,back,p);g.restore();
    if(kind==='lineman'&&isCrouch){
      // Low center of gravity, hands near the turf.
      stroke(g,23,70+bodyY,21,97+bodyY,5,'#a87551');
    }
    g.restore();
    return c;
  }
  function directionIndex(angle) {
    // Editor heading 0 goes away from the fixed camera; PI comes toward it.
    const a=((Number.isFinite(angle)?angle:0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
    return Math.round(a/(Math.PI/4))%8;
  }
  function actionFor(p,state,t,pass) {
    if(state==='presnap'){
      if(p.id==='QB')return t<.9?'cadence':t<2?'set':'cadence';
      if(['C','LT','LG','RG','RT','DT1','DT2','DE1','DE2'].includes(p.id))return 'crouch';
      return 'ready';
    }
    if(p.anim&&t<p.animUntil)return p.anim;
    if(p.down)return 'down';
    if(p.id==='QB'){
      if(!pass&&t>2.36)return 'pass';
      return p.moving?'dropback':'set';
    }
    if(p.blocked)return 'block';
    if(['C','LT','LG','RG','RT'].includes(p.id))return 'block';
    if(p.moving)return 'run';
    return pass?.done&&pass.target===p.id?'secure':'ready';
  }
  const frameRates={run:10,dropback:10,block:7,pass:11,catch:10,reach:8,tackle:10,fall:10,snap:10,cadence:3,crouch:2.5,ready:2.5,set:3,secure:2};
  const frameCounts={run:6,dropback:6,block:4,pass:5,catch:6,reach:5,tackle:6,fall:7,snap:4,cadence:4,crouch:4,ready:4,set:4,secure:2,down:1};
  function draw(ctx,entries,state,time,pass,project) {
    const arranged=[];
    for(const item of entries){
      const foot=project(item.x,.07,item.z);
      const top=project(item.x,3.15,item.z);
      if(!foot||!top)continue;
      const height=Math.min(155,Math.max(16,(foot.y-top.y)*1.18));
      const width=height*.68;
      arranged.push({item,foot,height,width});
    }
    arranged.sort((a,b)=>a.foot.y-b.foot.y);
    for(const {item,foot,height,width} of arranged) {
      const p=item.p, team=p.team==='offense'?'offense':'defense';
      const kind=['LT','LG','C','RG','RT'].includes(p.id)?'lineman':p.id==='QB'?'qb':'skill';
      const action=actionFor(p,state,time,pass);
      const fps=frameRates[action]||3;
      const frames=frameCounts[action]||4;
      const eventActive=p.anim===action&&time<p.animUntil;
      const animationTime=eventActive?Math.max(0,time-p.animAt):time+(p.phase||0)*.19;
      const frame=eventActive?Math.min(frames-1,Math.floor(animationTime*fps)):Math.floor(animationTime*fps)%frames;
      const facing=directionIndex(p.angle);
      const key=[team,kind,facing,action,frame,p.num].join(':');
      let image=CACHE.get(key);
      if(!image){image=createSprite(team,kind,facing,action,frame,p.num);CACHE.set(key,image);}
      ctx.save();
      ctx.fillStyle='#081f19a0';ctx.beginPath();ctx.ellipse(foot.x+1,foot.y+1,width*.37,height*.073,-.14,0,Math.PI*2);ctx.fill();
      if(action==='fall'||action==='down'){
        const progressed=action==='down'?1:Math.min(1,(frame+1)/7);
        ctx.translate(foot.x,foot.y);
        ctx.rotate(-Math.PI*.44*progressed);
        ctx.drawImage(image,-width/2,-height,width,height);
      }else{
        ctx.drawImage(image,foot.x-width/2,foot.y-height,width,height);
      }
      ctx.restore();
    }
    // Throw arc uses the same fixed camera projection as the on-field figures.
    if(pass&&!pass.done){
      const fraction=Math.max(0,Math.min(1,pass.t/pass.travel));
      const xx=pass.from.x+(pass.to.x-pass.from.x)*fraction;
      const yy=pass.from.y+(pass.to.y-pass.from.y)*fraction;
      const shot=project((yy-345)*.115,2.8+5*Math.sin(Math.PI*fraction),(488-xx)*.115);
      if(shot){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(time*12);
        fillEllipse(ctx,0,0,7,4,'#8d4b25');stroke(ctx,-2,-1,2,1,1.2,'#fffbeb');ctx.restore();}
    }
    if(CACHE.size>1700)CACHE.clear();
  }
  window.PlayLabSprites={draw,actionFor};
})();

