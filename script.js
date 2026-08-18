const canvas=document.getElementById('gameCanvas');const ctx=canvas.getContext('2d');
let ship,bullets,enemies,particles,score,lives,wave,gameRunning,animFrame,stars=[];

for(let i=0;i<100;i++)stars.push({x:Math.random()*480,y:Math.random()*600,s:Math.random()*2+0.5,sp:Math.random()+0.5});

function startGame(){
    ship={x:220,y:540,w:30,h:30};
    bullets=[];enemies=[];particles=[];score=0;lives=3;wave=1;gameRunning=true;
    updateUI();spawnEnemies();cancelAnimationFrame(animFrame);gameLoop();
}

function spawnEnemies(){
    for(let r=0;r<3;r++)for(let c=0;c<6;c++){
        enemies.push({x:60+c*65,y:40+r*40,w:30,h:20,hp:wave>3?2:1,color:['#e74c3c','#6c5ce7','#00b894'][r%3],vx:1,vy:0});
    }
}

let shootTimer=0;
function gameLoop(){
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{s.y+=s.sp;if(s.y>600){s.y=0;s.x=Math.random()*480}ctx.fillStyle=`rgba(255,255,255,${s.s/3})`;ctx.fillRect(s.x,s.y,s.s,s.s)});

    if(keys['ArrowLeft']&&ship.x>0)ship.x-=6;
    if(keys['ArrowRight']&&ship.x<canvas.width-ship.w)ship.x+=6;
    shootTimer++;
    if(keys[' ']&&shootTimer>10){bullets.push({x:ship.x+ship.w/2-2,y:ship.y,w:4,h:10,vy:-8});shootTimer=0}

    bullets.forEach(b=>{b.y+=b.vy});
    bullets=bullets.filter(b=>b.y>-10);

    enemies.forEach(e=>{
        e.x+=e.vx;
        if(e.x>canvas.width-e.w||e.x<0)e.vx*=-1;
        e.y+=0.02;
        bullets.forEach(b=>{
            if(b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
                e.hp--;b.y=-100;
                if(e.hp<=0){
                    score+=10;updateUI();
                    for(let i=0;i<8;i++)particles.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,life:20,color:e.color});
                    e.y=9999;
                }
            }
        });
        if(e.y+e.h>ship.y&&e.x<ship.x+ship.w&&e.x+e.w>ship.x){
            lives--;updateUI();e.y=9999;
            if(lives<=0){gameRunning=false;cancelAnimationFrame(animFrame);alert('Game Over! Score: '+score)}
        }
    });
    enemies=enemies.filter(e=>e.y<canvas.height+20);

    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--});
    particles=particles.filter(p=>p.life>0);

    if(enemies.length===0){wave++;updateUI();spawnEnemies()}

    particles.forEach(p=>{ctx.globalAlpha=p.life/20;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4)});
    ctx.globalAlpha=1;
    enemies.forEach(e=>{ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(e.x+e.w/2,e.y);ctx.lineTo(e.x,e.y+e.h);ctx.lineTo(e.x+e.w,e.y+e.h);ctx.fill()});
    bullets.forEach(b=>{ctx.fillStyle='#f1c40f';ctx.fillRect(b.x,b.y,b.w,b.h)});
    ctx.fillStyle='#00b894';ctx.beginPath();ctx.moveTo(ship.x+ship.w/2,ship.y);ctx.lineTo(ship.x,ship.y+ship.h);ctx.lineTo(ship.x+ship.w,ship.y+ship.h);ctx.fill();

    if(gameRunning)animFrame=requestAnimationFrame(gameLoop);
}

function updateUI(){document.getElementById('score').textContent=score;document.getElementById('lives').textContent=lives;document.getElementById('wave').textContent=wave}

let keys={};
document.addEventListener('keydown',(e)=>{keys[e.key]=true;if(e.key===' ')e.preventDefault()});
document.addEventListener('keyup',(e)=>{keys[e.key]=false});

startGame();
