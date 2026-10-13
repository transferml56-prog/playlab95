/* PlayLab 95 v0.5: fixed WebGL stadium + projected 2D sprite actors. */
(function () {
  'use strict';
  window.createPlay3D = function (canvas, labelCanvas) {
    const gl = canvas.getContext('webgl', { alpha:false, antialias:true, preserveDrawingBuffer:false }) ||
               canvas.getContext('experimental-webgl', { alpha:false, antialias:true });
    if (!gl) return null;
    const vs = `attribute vec3 aPosition; attribute vec3 aNormal;
      uniform mat4 uViewProj; uniform mat4 uModel;
      varying float vLight; varying float vDepth;
      void main(){ vec4 world=uModel*vec4(aPosition,1.0); gl_Position=uViewProj*world;
        vec3 n=normalize(mat3(uModel)*aNormal);
        vLight=0.50+0.48*max(0.0,dot(n,normalize(vec3(-0.5,0.95,0.65))));
        vDepth=clamp((-world.z-15.0)/180.0,0.0,1.0); }`;
    const fs = `precision mediump float; uniform vec3 uColor; varying float vLight; varying float vDepth;
      void main(){ vec3 lit=uColor*vLight; gl_FragColor=vec4(mix(lit,vec3(0.15,0.28,0.27),vDepth*0.15),1.0); }`;
    function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    let program;
    try{ program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D shader link failed'); }
    catch(e){ console.warn('PlayLab 3D unavailable:',e);return null; }
    gl.useProgram(program);
    const locations={pos:gl.getAttribLocation(program,'aPosition'),norm:gl.getAttribLocation(program,'aNormal'),vp:gl.getUniformLocation(program,'uViewProj'),model:gl.getUniformLocation(program,'uModel'),color:gl.getUniformLocation(program,'uColor')};
    function mesh(v){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);return {buffer,count:v.length/6};}
    function box(){const verts=[];const faces=[[[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],[[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],[[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],[[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],[[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],[[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]];for(const [n,a,b,c,d] of faces)for(const p of [a,b,c,a,c,d])verts.push(...p,...n);return mesh(verts);}
    function sphere(){const v=[],rings=8,sides=12;const point=(t,p)=>[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=point(Math.PI*i/rings,2*Math.PI*j/sides),b=point(Math.PI*(i+1)/rings,2*Math.PI*j/sides),c=point(Math.PI*(i+1)/rings,2*Math.PI*(j+1)/sides),d=point(Math.PI*i/rings,2*Math.PI*(j+1)/sides);for(const p of [a,b,c,a,c,d])v.push(...p,...p);}return mesh(v);}
    const cube=box(), orb=sphere();
    function matMul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v;}return o;}
    const sub=(a,b)=>a.map((x,i)=>x-b[i]); const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const unit=a=>{const len=Math.hypot(...a)||1;return a.map(n=>n/len);};
    function lookAt(eye,target){const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
    function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
    const view=lookAt([0,28,45],[0,0,-12]);
    let viewProj, viewportWidth=0, viewportHeight=0;
    function resize(){const bounds=canvas.getBoundingClientRect();if(!bounds.width)return;const scale=Math.min(window.devicePixelRatio||1,1.7);const w=Math.max(2,Math.floor(bounds.width*scale)),h=Math.max(2,Math.floor(bounds.height*scale));if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;labelCanvas.width=w;labelCanvas.height=h;}viewportWidth=w;viewportHeight=h;gl.viewport(0,0,w,h);viewProj=matMul(perspective(58*Math.PI/180,w/h,0.5,270),view);gl.uniformMatrix4fv(locations.vp,false,viewProj);}
    function model(tx,ty,tz,sx,sy,sz,turn){const c=Math.cos(turn),s=Math.sin(turn);return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,tx,ty,tz,1]);}
    function draw(m,x,y,z,sx,sy,sz,color,turn=0){gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.enableVertexAttribArray(locations.pos);gl.vertexAttribPointer(locations.pos,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(locations.norm);gl.vertexAttribPointer(locations.norm,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(locations.model,false,model(x,y,z,sx,sy,sz,turn));gl.uniform3fv(locations.color,color);gl.drawArrays(gl.TRIANGLES,0,m.count);}
    const col={blue:[.10,.42,.72],lightBlue:[.33,.73,.98],red:[.68,.13,.17],lightRed:[.94,.32,.28],white:[.88,.94,.95],silver:[.63,.74,.81],skin:[.72,.47,.31],shoe:[.13,.17,.22],line:[.90,.94,.82],gold:[.96,.67,.23],first:[.29,.72,.85],dark:[.015,.10,.075],brown:[.47,.24,.09],stripe:[.19,.52,.37]};
    const worldX=y=>(y-345)*.115,worldZ=x=>(488-x)*.115;
    function field(){draw(cube,0,-.31,-9,34,.26,70,[.105,.34,.225]);
      for(let z=-72;z<=56;z+=9.2){const k=Math.round((z+72)/9.2);draw(cube,0,-.045,z,32.15,.019,4.6,k%2?[.135,.40,.27]:[.12,.37,.245]);}
      for(let z=-78;z<59;z+=9.2){draw(cube,0,.012,z,32.2,.022,.10,col.line);for(const x of [-14.2,14.2])draw(cube,x,.016,z,.39,.026,.08,col.line);}
      for(const x of [-32.3,32.3])draw(cube,x,.04,-10,.14,.030,139,col.line);
      draw(cube,0,.06,0,32.2,.035,.19,col.gold);
      draw(cube,0,.061,-22.4,32.2,.03,.12,col.first);
      // Sideline pads and a simple stadium boundary for spatial depth.
      for(const x of [-38.5,38.5]){draw(cube,x,-.20,-13,3.4,.40,145,[.075,.16,.21]);for(let i=0;i<5;i++)draw(cube,x+(x<0?-i*.8:i*.8),i*.64-1,-13,.45,.23,145,[.12+i*.022,.17+i*.022,.20+i*.025]);}
    }
    function person(p,t){const x=worldX(p.y),z=worldZ(p.x),a=-(p.angle||0),off=p.team==='offense',jersey=off?col.blue:col.red,helmet=off?col.lightBlue:col.lightRed,trim=off?col.silver:[.95,.72,.69];
      const active=t>0.1&&!p.blocked,step=active?Math.sin(t*15+(p.phase||0))*.27:0;
      draw(orb,x,.04,z,.78,.038,.58,col.dark);
      // Legs, cleats, and torso are separate 3D meshes, with running strides.
      for(let side of [-1,1]){const sx=x+side*.24;draw(cube,sx,.55,z+side*step,.17,.55,.24,col.white,a);draw(cube,sx,.18,z+side*step*1.7-.14,.20,.16,.39,col.shoe,a);draw(cube,sx,.92,z,.23,.25,.28,jersey,a);}
      draw(cube,x,1.32,z,.55,.50,.42,jersey,a);draw(cube,x,1.63,z,.76,.22,.43,helmet,a);
      for(let side of [-1,1]){draw(cube,x+side*.66,1.26+side*step*.24,z-.13,.17,.45,.20,trim,a);draw(orb,x+side*.67,1.01+side*step*.24,z-.23,.13,.14,.13,col.skin);}
      draw(cube,x,1.80,z-.03,.23,.16,.26,col.skin,a);
      draw(orb,x,2.02,z-.17,.34,.32,.36,helmet);
      draw(cube,x,2.03,z-.52,.29,.15,.10,col.silver,a);
      draw(cube,x,1.90,z-.49,.27,.07,.10,col.silver,a);
      draw(cube,x,2.33,z-.19,.075,.025,.35,col.white,a);
      // Numerals on the jersey front, visible in the simulation from camera.
      return {p,x,z};
    }
    function worldToScreen(x,y,z){const v=[x,y,z,1],c=new Array(4).fill(0);for(let r=0;r<4;r++)for(let k=0;k<4;k++)c[r]+=viewProj[k*4+r]*v[k];if(c[3]<=0)return null;return {x:(c[0]/c[3]*.5+.5)*viewportWidth,y:(.5-c[1]/c[3]*.5)*viewportHeight};}
    function drawLabels(entries,state,result,t,pass){const h=labelCanvas.getContext('2d');h.clearRect(0,0,viewportWidth,viewportHeight);if(window.PlayLabSprites)window.PlayLabSprites.draw(h,entries,state,t,pass,worldToScreen);const q=Math.min(window.devicePixelRatio||1,1.7);for(const {p,x,z} of entries){const at=worldToScreen(x,3.48,z);if(!at)continue;const size=viewportWidth<700?11*q:10*q;h.font=`900 ${size}px system-ui`;h.textAlign='center';h.lineWidth=2.8*q;h.strokeStyle='#0d2025e8';h.strokeText(p.id==='NICKEL'?'NB':p.id,at.x,at.y);h.fillStyle=p.team==='offense'?'#bcdef7':'#ffb1a3';h.fillText(p.id==='NICKEL'?'NB':p.id,at.x,at.y);}
      if(state==='ended'){const title=result||'PLAY COMPLETE';h.fillStyle='#071520db';h.fillRect(viewportWidth*.27,viewportHeight*.43,viewportWidth*.46,viewportHeight*.13);h.fillStyle='#f9d783';h.font=`900 ${Math.max(18,viewportWidth*.025)}px system-ui`;h.textAlign='center';h.fillText(title,viewportWidth/2,viewportHeight*.515);}
    }
    function render(players,pass,t,state,result){resize();if(!viewportWidth)return;
      gl.clearColor(.055,.115,.12,1);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(locations.vp,false,viewProj);
      field();
      // Depth buffer ensures actual 3D players occlude each other realistically.
      const drawn=players.map(p=>({p,x:worldX(p.y),z:worldZ(p.x)}));
      const qb=players.find(p=>p.id==='QB');
      if(pass&&!pass.done){const fraction=Math.max(0,Math.min(1,pass.t/pass.travel));const xx=pass.from.x+(pass.to.x-pass.from.x)*fraction, yy=pass.from.y+(pass.to.y-pass.from.y)*fraction;draw(orb,worldX(yy),2.7+5*Math.sin(Math.PI*fraction),worldZ(xx),.18,.12,.28,col.brown,t*8);}else if(qb&&!pass){draw(orb,worldX(qb.y)-.30,1.26,worldZ(qb.x)-.40,.17,.12,.26,col.brown,.4);}
      drawLabels(drawn,state,result,t,pass);
    }
    return {render,resize};
  };
})();