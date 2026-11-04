(() => {
  const $ = id => document.getElementById(id);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bc9e8);
  scene.fog = new THREE.Fog(0x9bc9e8, 35, 95);
  const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 180);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('game').appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x617b55, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-18, 30, 15); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-45; sun.shadow.camera.right=45; sun.shadow.camera.top=45; sun.shadow.camera.bottom=-45;
  scene.add(sun);

  const mat = (color, roughness=.9) => new THREE.MeshStandardMaterial({color,roughness});
  const materials = {
    grass:mat(0x79b86a), road:mat(0x555d61), line:mat(0xf3e8b4), sidewalk:mat(0xc9c9b7),
    wall:mat(0xf0d8b2), roof:mat(0x9e5140), glass:mat(0x77bfd3,.35), wood:mat(0x805538),
    leaf:mat(0x3f874b), trunk:mat(0x765038), white:mat(0xffffff), worker:mat(0xe9a43b)
  };
  const box = (w,h,d,material,x,y,z,shadow=true) => {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z); mesh.castShadow=shadow; mesh.receiveShadow=true; scene.add(mesh); return mesh;
  };
  const ground=box(100,.2,100,materials.grass,0,-.12,0,false);
  // Roads and sidewalks create a walkable little town.
  box(100,.08,8,materials.road,0,0,0,false);
  box(8,.08,100,materials.road,0,.005,0,false);
  for(let x=-46;x<=46;x+=5) box(2,.012,.12,materials.line,x,.055,0,false);
  for(let z=-46;z<=46;z+=5) box(.12,.012,2,materials.line,0,.06,z,false);
  box(100,.12,1.4,materials.sidewalk,0,.03,4.8,false);
  box(100,.12,1.4,materials.sidewalk,0,.03,-4.8,false);
  box(1.4,.12,100,materials.sidewalk,4.8,.03,0,false);
  box(1.4,.12,100,materials.sidewalk,-4.8,.03,0,false);

  // Decorative trees and lamp posts.
  function tree(x,z){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,1.6,7),materials.trunk); trunk.position.set(x,.8,z); trunk.castShadow=true;scene.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(1.05,9,7),materials.leaf);crown.position.set(x,2,z);crown.castShadow=true;scene.add(crown);
  }
  for(const [x,z] of [[-17,-16],[-23,15],[18,-17],[23,16],[-32,8],[33,-9],[-16,30],[17,31]]) tree(x,z);

  const plots=[];
  function createHouse(x,z,scale=1,paint=0xe9d7ba){
    const group=new THREE.Group(); scene.add(group);group.position.set(x,0,z);group.scale.setScalar(scale);
    const wallMat=mat(paint), roofMat=mat(0x9e5140), doorMat=mat(0x68452f), glassMat=mat(0x80c7d8,.3);
    const base=new THREE.Mesh(new THREE.BoxGeometry(5,2.6,4),wallMat);base.position.y=1.3;base.castShadow=true;base.receiveShadow=true;group.add(base);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(3.8,1.8,4),roofMat);roof.position.set(0,3.5,0);roof.rotation.y=Math.PI/4;roof.castShadow=true;group.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(.85,1.65,.12),doorMat);door.position.set(0,.83,2.06);group.add(door);
    for(const wx of [-1.55,1.55]){const win=new THREE.Mesh(new THREE.BoxGeometry(.9,.8,.1),glassMat);win.position.set(wx,1.55,2.07);group.add(win)}
    return group;
  }
  createHouse(-17,-17,.9,0xe6d2ac);
  createHouse(18,17,1.0,0xd6e3dc);
  createHouse(18,-17,.8,0xe7c7b9);

  // Buildable plots around the neighborhood.
  const plotPositions=[[-17,17],[17,-32],[-32,-17],[32,17],[-32,32],[32,-32]];
  const plotMat=mat(0x9aaf72), borderMat=mat(0xf5f0d5), markerMat=mat(0xffd45c);
  plotPositions.forEach((p,i)=>{
    const pad=box(9,.16,8,plotMat,p[0],.05,p[1],false);
    const border=box(9.3,.18,.18,borderMat,p[0],.16,p[1]-4,false);
    box(9.3,.18,.18,borderMat,p[0],.16,p[1]+4,false);
    box(.18,.18,8,borderMat,p[0]-4.55,.16,p[1],false);
    box(.18,.18,8,borderMat,p[0]+4.55,.16,p[1],false);
    const marker=box(.75,.45,.75,markerMat,p[0],.35,p[1],false);
    plots.push({id:i,x:p[0],z:p[1],mesh:pad,marker,building:null,project:null,crew:0});
  });

  // Simple player avatar.
  const player=new THREE.Group();scene.add(player);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.85,4,8),mat(0x326baf));body.position.y=1.0;body.castShadow=true;player.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,12,10),mat(0xf0c39d));head.position.y=1.72;head.castShadow=true;player.add(head);
  const nose=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.18),mat(0xf0c39d));nose.position.set(0,1.7,.27);player.add(nose);
  player.position.set(0,0,11);

  const keys={};let yaw=0,pitch=-.12, cash=2500, nearby=null, selectedType=null;
  const BUILDINGS=[
    {id:'cottage',name:'Cozy cottage',emoji:'🏡',cost:700,time:18,color:0xe9d6b4},
    {id:'shop',name:'Corner shop',emoji:'🏪',cost:1100,time:25,color:0xd9e5d9},
    {id:'office',name:'Office building',emoji:'🏢',cost:1800,time:35,color:0xb9cbd9},
    {id:'cafe',name:'Town café',emoji:'☕',cost:1300,time:28,color:0xe8c7a8}
  ];
  const crewPeople=[];
  function updateCash(){$('cash').textContent=cash.toLocaleString()}
  function toast(t){$('toast').textContent=t}
  function makeCrew(plot){
    for(let i=0;i<3;i++){
      const worker=new THREE.Group();
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.42,.65,.3),materials.worker);torso.position.y=.95;worker.add(torso);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.19,8,7),mat(0xe6b18b));head.position.y=1.42;worker.add(head);
      worker.position.set(plot.x+(i-1)*1.2,0,plot.z+2.4);scene.add(worker);
      crewPeople.push({mesh:worker,plot,phase:i*2});
    }
    plot.crew=3;
  }
  function buildingModel(plot,type){
    const def=BUILDINGS.find(b=>b.id===type);
    const g=new THREE.Group();scene.add(g);g.position.set(plot.x,0,plot.z);
    const w=type==='office'?5.5:4.8, d=type==='office'?4.8:4.2, h=type==='office'?5.5:2.8;
    const walls=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(def.color));walls.position.y=h/2;walls.castShadow=true;walls.receiveShadow=true;g.add(walls);
    if(type==='office'){
      for(let floor=0;floor<3;floor++)for(let side=-1;side<=1;side+=2){
        const win=new THREE.Mesh(new THREE.BoxGeometry(1,.75,.08),materials.glass);win.position.set(side*1.35,1.1+floor*1.5,d/2+.05);g.add(win);
      }
      const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.25,d+.2),mat(0x4b5c69));roof.position.y=h+.12;g.add(roof);
    }else{
      const roof=new THREE.Mesh(new THREE.ConeGeometry(4.1,1.6,4),mat(type==='shop'?0x3c7c70:0x9e5140));roof.position.y=h+.8;roof.rotation.y=Math.PI/4;g.add(roof);
      const door=new THREE.Mesh(new THREE.BoxGeometry(.8,1.7,.12),materials.wood);door.position.set(0,.85,d/2+.07);g.add(door);
      for(const side of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(.9,.75,.1),materials.glass);win.position.set(side*1.35,1.55,d/2+.07);g.add(win)}
    }
    return g;
  }

  function openPlot(plot){
    nearby=plot;$('panelTitle').textContent=plot.project?'Construction site':'Build on this plot';
    $('panelDescription').textContent=plot.building?'This building is complete! You can explore your growing town.':plot.project?'Your crew is working hard. Come back when construction is finished.':'Choose a building, then hire a construction crew.';
    $('buildingChoices').innerHTML='';
    BUILDINGS.forEach(def=>{
      const b=document.createElement('button');b.className='choice'+(selectedType===def.id?' selected':'');
      b.innerHTML=`<span class="emoji">${def.emoji}</span><strong>${def.name}</strong><small>$${def.cost.toLocaleString()} · ${def.time}s build</small>`;
      b.disabled=!!plot.project||!!plot.building;
      b.onclick=()=>{selectedType=def.id;openPlot(plot)};
      $('buildingChoices').appendChild(b);
    });
    $('hireBtn').disabled=!!plot.project||!!plot.building||!selectedType;
    $('hireBtn').textContent=plot.project?'Crew is working':plot.building?'Already built':'Hire crew · $300';
    $('panelStatus').textContent=plot.project?`Construction: ${Math.max(0,Math.ceil(plot.project.ends-performance.now()/1000))} seconds remaining.`:plot.building?'Project completed!':selectedType?'Selected: '+BUILDINGS.find(b=>b.id===selectedType).name:'Select a building first.';
    $('buildPanel').hidden=false;
  }
  $('closePanel').onclick=()=>$('buildPanel').hidden=true;
  $('hireBtn').onclick=()=>{
    const plot=nearby,def=BUILDINGS.find(b=>b.id===selectedType);
    if(!plot||!def||plot.project||plot.building)return;
    if(cash<300+def.cost){$('panelStatus').textContent='Not enough money. You need the building cost plus $300 for the crew.';return}
    cash-=300+def.cost;updateCash();makeCrew(plot);
    plot.project={type:def.id,ends:performance.now()/1000+def.time,duration:def.time};
    toast('Construction started! Your crew is on the job.');
    openPlot(plot);
  };
  $('useBtn').onclick=()=>{if(nearby)openPlot(nearby)};
  function updateNearby(){
    let closest=null,dist=999;
    for(const p of plots){const d=Math.hypot(player.position.x-p.x,player.position.z-p.z);if(d<7&&d<dist){closest=p;dist=d}}
    nearby=closest;$('useBtn').disabled=!closest||!$('buildPanel').hidden;
    if(closest&&$('buildPanel').hidden)toast(closest.building?'Completed building! Press E / USE to inspect.':closest.project?'Crew is building here! Press E / USE to check progress.':'Empty building plot nearby! Press E / USE to build.');
  }
  function updateProjects(){
    for(const p of plots)if(p.project){
      const remaining=p.project.ends-performance.now()/1000;
      if(remaining<=0){
        p.building=buildingModel(p,p.project.type);p.project=null;
        p.marker.visible=false;
        toast('🎉 Construction complete! Your new building is ready.');
        if(nearby===p&&!$('buildPanel').hidden)openPlot(p);
      }else if(nearby===p&&!$('buildPanel').hidden){
        $('panelStatus').textContent=`Construction in progress · ${Math.ceil(remaining)} seconds remaining · ${p.crew} workers hired.`;
      }
    }
  }

  function movePlayer(dt){
    const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
    const strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
    const len=Math.hypot(forward,strafe);
    if(len>.05){
      const f=forward/Math.max(1,len),s=strafe/Math.max(1,len);
      const dx=(Math.sin(yaw)*f+Math.cos(yaw)*s)*7*dt;
      const dz=(Math.cos(yaw)*f-Math.sin(yaw)*s)*7*dt;
      player.position.x=Math.max(-46,Math.min(46,player.position.x+dx));
      player.position.z=Math.max(-46,Math.min(46,player.position.z+dz));
      player.rotation.y=Math.atan2(dx,dz);
    }
    player.position.y=0;
  }
  function updateCamera(){
    const target=new THREE.Vector3(player.position.x,player.position.y+1.45,player.position.z);
    camera.position.set(target.x-Math.sin(yaw)*7, target.y+3.1, target.z-Math.cos(yaw)*7);
    camera.lookAt(target.x+Math.sin(yaw)*3, target.y+pitch*5, target.z+Math.cos(yaw)*3);
  }
  window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&nearby&&$('buildPanel').hidden)openPlot(nearby);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()});
  window.addEventListener('keyup',e=>keys[e.code]=false);
  let pointerLocked=false;
  renderer.domElement.addEventListener('click',()=>{if(matchMedia('(pointer:fine)').matches&&!pointerLocked&&$('buildPanel').hidden)renderer.domElement.requestPointerLock?.()});
  document.addEventListener('pointerlockchange',()=>pointerLocked=document.pointerLockElement===renderer.domElement);
  document.addEventListener('mousemove',e=>{if(pointerLocked){yaw-=e.movementX*.0025;pitch=Math.max(-.5,Math.min(.3,pitch-e.movementY*.0015))}});
  // Mobile thumb stick.
  const joy={x:0,y:0};let stickOn=false,stickId=null;
  const area=$('stickArea'),stick=$('stick');
  function stickMove(e){const r=area.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=38,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}joy.x=dx/max;joy.y=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}
  area.addEventListener('pointerdown',e=>{stickOn=true;stickId=e.pointerId;area.setPointerCapture(e.pointerId);stickMove(e)});
  area.addEventListener('pointermove',e=>{if(stickOn&&e.pointerId===stickId)stickMove(e)});
  function endStick(){stickOn=false;joy.x=0;joy.y=0;stick.style.transform='translate(0,0)'}
  area.addEventListener('pointerup',endStick);area.addEventListener('pointercancel',endStick);
  // Drag the open right-hand screen to look around on touch devices.
  let lookId=null,lastX=0,lastY=0;
  renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.42){lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY}});
  renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId===lookId){yaw-=(e.clientX-lastX)*.006;pitch=Math.max(-.5,Math.min(.3,pitch-(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY}});
  const endLook=e=>{if(e.pointerId===lookId)lookId=null};renderer.domElement.addEventListener('pointerup',endLook);renderer.domElement.addEventListener('pointercancel',endLook);

  let previous=performance.now();
  function animate(now){
    requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.05);previous=now;
    movePlayer(dt);updateCamera();updateNearby();updateProjects();
    crewPeople.forEach(c=>{c.mesh.position.x=c.plot.x+Math.sin(now/700+c.phase)*.45+(c.phase-2)*.25;c.mesh.position.z=c.plot.z+2.35+Math.cos(now/800+c.phase)*.35;c.mesh.rotation.y=Math.sin(now/900+c.phase)*.5});
    renderer.render(scene,camera);
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
  updateCash();updateCamera();requestAnimationFrame(animate);
})();