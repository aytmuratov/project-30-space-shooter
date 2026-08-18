const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width = 500, H = canvas.height = 700;
const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

let player, bullets, enemies, enemyBullets, particles, powerups, stars, keys, score, lives, wave, gameState, frameCount, shootTimer, playerPower;

function init() {
    score = 0; lives = 3; wave = 1; frameCount = 0; shootTimer = 0; playerPower = 0;
    player = { x: W/2, y: H - 80, w: 40, h: 40 };
    bullets = []; enemies = []; enemyBullets = []; particles = []; powerups = [];
    stars = Array.from({length: 80}, () => ({ x: Math.random()*W, y: Math.random()*H, s: Math.random()*2+0.5, sp: Math.random()*2+1 }));
    keys = {};
    gameState = 'play';
    startScreen.style.display = 'none';
    updateHUD();
    spawnWave();
}

function spawnWave() {
    const count = Math.min(5 + wave * 2, 20);
    for (let i = 0; i < count; i++) {
        const type = Math.random() < 0.2 && wave > 1 ? 'fast' : (Math.random() < 0.15 && wave > 2 ? 'boss' : 'normal');
        const e = {
            x: 50 + Math.random() * (W - 100),
            y: -40 - Math.random() * 200,
            w: type === 'boss' ? 60 : 35, h: type === 'boss' ? 50 : 30,
            hp: type === 'boss' ? 8 : (type === 'fast' ? 1 : 2),
            speed: type === 'boss' ? 1 : (type === 'fast' ? 3 : 1.5),
            type, dir: Math.random() < 0.5 ? 1 : -1, shootTimer: 0, color: type === 'boss' ? '#ef4444' : (type === 'fast' ? '#f97316' : '#a855f7')
        };
        enemies.push(e);
    }
    waveEl.textContent = 'Wave: ' + wave;
}

function spawnParticles(x, y, color, count, spread) {
    for (let i = 0; i < count; i++)
        particles.push({ x, y, vx: (Math.random()-0.5)*(spread||6), vy: (Math.random()-0.5)*(spread||6), life: 25 + Math.random()*15, color, size: Math.random()*4+2 });
}

function shoot() {
    bullets.push({ x: player.x, y: player.y - 20, w: 4, h: 12, speed: 8 });
    if (playerPower >= 2) {
        bullets.push({ x: player.x - 12, y: player.y - 15, w: 4, h: 12, speed: 8 });
        bullets.push({ x: player.x + 12, y: player.y - 15, w: 4, h: 12, speed: 8 });
    }
}

function update() {
    if (gameState !== 'play') return;
    frameCount++;

    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(20, player.x - 5);
    if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(W - 20, player.x + 5);
    if (keys['ArrowUp'] || keys['KeyW']) player.y = Math.max(40, player.y - 5);
    if (keys['ArrowDown'] || keys['KeyS']) player.y = Math.min(H - 40, player.y + 5);

    // Shooting
    shootTimer--;
    if (keys['Space'] && shootTimer <= 0) {
        shoot();
        shootTimer = playerPower >= 1 ? 8 : 12;
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < -10) { bullets.splice(i, 1); continue; }
        for (let j = enemies.length - 1; j >= 0; j--) {
            const b = bullets[i], e = enemies[j];
            if (b && b.x > e.x - e.w/2 && b.x < e.x + e.w/2 && b.y > e.y - e.h/2 && b.y < e.y + e.h/2) {
                e.hp--;
                spawnParticles(b.x, b.y, '#fbbf24', 4, 3);
                bullets.splice(i, 1);
                if (e.hp <= 0) {
                    spawnParticles(e.x, e.y, e.color, 15);
                    score += e.type === 'boss' ? 100 : (e.type === 'fast' ? 30 : 20);
                    if (Math.random() < 0.12) {
                        const types = ['spread', 'speed', 'life'];
                        powerups.push({ x: e.x, y: e.y, type: types[Math.floor(Math.random()*types.length)], w: 20, h: 20 });
                    }
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy movement and shooting
    for (const e of enemies) {
        e.x += e.speed * e.dir;
        if (e.x < e.w || e.x > W - e.w) e.dir *= -1;
        e.y += e.speed * 0.3;
        e.shootTimer++;
        if (e.shootTimer > 80 - wave * 5 && e.y > 0) {
            e.shootTimer = 0;
            enemyBullets.push({ x: e.x, y: e.y + e.h/2, speed: 4 });
        }
        // Collision with player
        if (e.x - e.w/2 < player.x + player.w/2 && e.x + e.w/2 > player.x - player.w/2 &&
            e.y - e.h/2 < player.y + player.h/2 && e.y + e.h/2 > player.y - player.h/2) {
            spawnParticles(e.x, e.y, e.color, 20);
            enemies.splice(enemies.indexOf(e), 1);
            loseLife();
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.y += b.speed;
        if (b.y > H + 10) { enemyBullets.splice(i, 1); continue; }
        if (b.x > player.x - player.w/2 && b.x < player.x + player.w/2 &&
            b.y > player.y - player.h/2 && b.y < player.y + player.h/2) {
            enemyBullets.splice(i, 1);
            loseLife();
        }
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pw = powerups[i];
        pw.y += 2;
        if (pw.y > H + 20) { powerups.splice(i, 1); continue; }
        if (pw.x > player.x - 25 && pw.x < player.x + 25 && pw.y > player.y - 25 && pw.y < player.y + 25) {
            if (pw.type === 'spread') playerPower = Math.min(2, playerPower + 1);
            if (pw.type === 'speed') playerPower = Math.min(2, playerPower + 1);
            if (pw.type === 'life' && lives < 5) lives++;
            spawnParticles(pw.x, pw.y, '#22c55e', 10);
            powerups.splice(i, 1);
            updateHUD();
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Stars
    for (const s of stars) {
        s.y += s.sp;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    // Wave complete
    if (enemies.length === 0) {
        wave++;
        setTimeout(spawnWave, 1000);
    }

    updateHUD();
}

function loseLife() {
    lives--;
    spawnParticles(player.x, player.y, '#3b82f6', 20);
    updateHUD();
    if (lives <= 0) {
        gameState = 'gameover';
        startScreen.querySelector('h1').textContent = 'Game Over';
        startScreen.querySelector('p').textContent = `Wave ${wave} | Score: ${score}`;
        startScreen.style.display = 'flex';
    }
}

function updateHUD() {
    scoreEl.textContent = 'Score: ' + score;
    livesEl.textContent = 'Lives: ' + '♥'.repeat(Math.max(0, lives));
}

function draw() {
    // Starfield
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.s * 0.2})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    if (gameState !== 'play') return;

    // Powerup indicators
    for (const pw of powerups) {
        ctx.fillStyle = pw.type === 'life' ? '#ef4444' : '#22c55e';
        ctx.beginPath();
        ctx.arc(pw.x, pw.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pw.type === 'life' ? '♥' : '★', pw.x, pw.y + 4);
    }

    // Enemy bullets
    ctx.fillStyle = '#ef4444';
    for (const b of enemyBullets) {
        ctx.fillRect(b.x - 2, b.y, 4, 10);
    }

    // Bullets
    for (const b of bullets) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(251,191,36,0.3)';
        ctx.fillRect(b.x - b.w, b.y, b.w * 2, b.h);
    }

    // Enemies
    for (const e of enemies) {
        ctx.fillStyle = e.color;
        if (e.type === 'boss') {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - e.h/2);
            ctx.lineTo(e.x + e.w/2, e.y + e.h/2);
            ctx.lineTo(e.x - e.w/2, e.y + e.h/2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.x - 5, e.y, 4, 6);
            ctx.fillRect(e.x + 1, e.y, 4, 6);
        } else {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + e.h/2);
            ctx.lineTo(e.x + e.w/2, e.y - e.h/2);
            ctx.lineTo(e.x + e.w/4, e.y - e.h/3);
            ctx.lineTo(e.x - e.w/4, e.y - e.h/3);
            ctx.lineTo(e.x - e.w/2, e.y - e.h/2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.x - 4, e.y - 3, 3, 3);
            ctx.fillRect(e.x + 1, e.y - 3, 3, 3);
        }
    }

    // Player ship
    const p = player;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - p.h/2);
    ctx.lineTo(p.x + p.w/2, p.y + p.h/2);
    ctx.lineTo(p.x + p.w/4, p.y + p.h/3);
    ctx.lineTo(p.x - p.w/4, p.y + p.h/3);
    ctx.lineTo(p.x - p.w/2, p.y + p.h/2);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Thrusters
    ctx.fillStyle = '#f97316';
    const flicker = Math.random() * 8 + 5;
    ctx.fillRect(p.x - 8, p.y + p.h/3, 5, flicker);
    ctx.fillRect(p.x + 3, p.y + p.h/3, 5, flicker);

    // Power indicator
    if (playerPower > 0) {
        ctx.fillStyle = 'rgba(34,197,94,0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const pt of particles) {
        ctx.globalAlpha = pt.life / 40;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => { keys[e.code] = true; e.preventDefault(); });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
startBtn.addEventListener('click', init);

gameLoop();
