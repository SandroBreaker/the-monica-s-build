
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Utility Classes ---

class SoundManager {
    private ctx: AudioContext | null = null;
    public enabled = true;

    private initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
        if (!this.enabled) return;
        this.initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    jump() { this.playTone(400, 'sine', 0.3); }
    attack() { this.playTone(150, 'sawtooth', 0.1, 0.05); }
    coin() { this.playTone(1200, 'square', 0.1, 0.05); this.playTone(1800, 'square', 0.2, 0.05); }
    hit() { this.playTone(100, 'sawtooth', 0.3, 0.2); }
    enemyDeath() { this.playTone(200, 'square', 0.1); }
}

export type InputKeys = { left: boolean, right: boolean, up: boolean, attack: boolean };

class InputHandler {
    public keys: InputKeys = { left: false, right: false, up: false, attack: false };

    constructor() {
        window.addEventListener('keydown', e => this.handleKey(e, true));
        window.addEventListener('keyup', e => this.handleKey(e, false));
    }

    private handleKey(e: KeyboardEvent, isDown: boolean) {
        if (e.repeat) return;
        const code = e.code;
        if (code === 'ArrowLeft' || code === 'KeyA') this.keys.left = isDown;
        if (code === 'ArrowRight' || code === 'KeyD') this.keys.right = isDown;
        if (code === 'ArrowUp' || code === 'Space') this.keys.up = isDown;
        if (code === 'KeyZ' || code === 'KeyK') this.keys.attack = isDown;
    }

    public cleanup() {
        window.removeEventListener('keydown', e => this.handleKey(e, true));
        window.removeEventListener('keyup', e => this.handleKey(e, false));
    }
}

// --- Entities ---

abstract class Entity {
    public markedForDeletion = false;
    public vx = 0;
    public vy = 0;

    constructor(public x: number, public y: number, public w: number, public h: number) {}
    
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }

    checkCollision(other: {x: number, y: number, w: number, h: number}) {
        return (this.x < other.x + other.w && this.x + this.w > other.x &&
                this.y < other.y + other.h && this.y + this.h > other.y);
    }

    abstract draw(ctx: CanvasRenderingContext2D, camX: number): void;
}

class Particle extends Entity {
    public life = 1.0;
    constructor(x: number, y: number, private color: string) {
        super(x, y, Math.random() * 4 + 2, Math.random() * 4 + 2);
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x - camX, this.y, this.w, this.h);
        ctx.globalAlpha = 1.0;
    }
}

class Collectible extends Entity {
    private bobOffset = Math.random() * Math.PI * 2;
    constructor(x: number, y: number) {
        super(x, y, 30, 30);
    }
    update() { this.bobOffset += 0.1; }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const y = this.y + Math.sin(this.bobOffset) * 5;
        const x = this.x - camX;
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath(); ctx.arc(x + 15, y + 15, 12, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#EF5350';
        ctx.beginPath(); ctx.arc(x + 15, y + 15, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillRect(x+12, y+10, 2, 2); ctx.fillRect(x+18, y+14, 2, 2);
    }
}

class Enemy extends Entity {
    private startX: number;
    private dir = 1;
    constructor(x: number, y: number, public type: 'cebolinha' | 'cascao') {
        super(x, y, 40, 50);
        this.startX = x;
    }
    update(map: any[]) {
        this.x += 2 * this.dir;
        if (this.x > this.startX + 150) this.dir = -1;
        if (this.x < this.startX - 150) this.dir = 1;
        this.vy += 0.8;
        this.y += this.vy;
        for (let tile of map) {
            // Inimigos colidem com tudo normalmente
            if (this.checkCollision(tile)) {
                if (this.y + this.h - this.vy <= tile.y) {
                    this.y = tile.y - this.h;
                    this.vy = 0;
                } else if (tile.type === 'ground') { 
                    this.dir *= -1; 
                }
            }
        }
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;
        ctx.fillStyle = this.type === 'cebolinha' ? '#4CAF50' : '#FFEB3B';
        ctx.fillRect(x + 5, y + 20, 30, 30);
        ctx.fillStyle = '#FFE0BD';
        ctx.beginPath(); ctx.arc(x + 20, y + 15, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        if (this.type === 'cebolinha') {
            ctx.beginPath(); ctx.moveTo(x+20, y); ctx.lineTo(x+20, y-10); ctx.stroke();
        }
    }
}

class Player extends Entity {
    public grounded = false;
    public facingRight = true;
    public isAttacking = false;
    public attackTimer = 0;
    public invulnerable = 0;
    public lives = 3;

    constructor(x: number, y: number) {
        super(x, y, 40, 60);
    }

    update(input: InputHandler, map: any[], enemies: Enemy[], audio: SoundManager) {
        const prevY = this.y;
        
        // Movimento Horizontal
        if (input.keys.left) { this.vx = -8.5; this.facingRight = false; }
        else if (input.keys.right) { this.vx = 8.5; this.facingRight = true; }
        else { this.vx *= 0.8; }

        this.x += this.vx;
        this.handleMapCollision(map, 'x', prevY);
        
        // Gravidade e Pulo
        this.vy += 0.85; 
        this.y += this.vy;
        this.grounded = false;
        this.handleMapCollision(map, 'y', prevY);

        // Pulo aumentado para alcançar platforms altas (Row 6)
        if (input.keys.up && this.grounded) {
            this.vy = -23;
            audio.jump();
        }

        // Pulo Variável
        if (!input.keys.up && this.vy < -8) {
            this.vy = -8;
        }

        if (input.keys.attack && !this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 20;
            audio.attack();
        }

        if (this.isAttacking) {
            this.attackTimer--;
            const reach = 70;
            const hitX = this.facingRight ? this.x + this.w : this.x - reach;
            const hitBox = { x: hitX, y: this.y, w: reach, h: this.h };
            enemies.forEach(e => {
                if (e.checkCollision(hitBox)) {
                    e.markedForDeletion = true;
                    audio.enemyDeath();
                }
            });
            if (this.attackTimer <= 0) this.isAttacking = false;
        }

        if (this.invulnerable > 0) this.invulnerable--;
    }

    private handleMapCollision(map: any[], axis: 'x' | 'y', prevY: number) {
        for (let tile of map) {
            if (this.checkCollision(tile)) {
                if (axis === 'x') {
                    // Mônica só colide horizontalmente com blocos de terra (ground)
                    if (tile.type === 'ground') {
                        if (this.vx > 0) this.x = tile.x - this.w;
                        else if (this.vx < 0) this.x = tile.x + tile.w;
                        this.vx = 0;
                    }
                } else {
                    if (this.vy > 0) { // Caindo
                        // Lógica de One-way Platform: só colide se estivesse acima do topo no frame anterior
                        if (tile.type === 'plat') {
                            if (prevY + this.h <= tile.y + 5) {
                                this.y = tile.y - this.h;
                                this.grounded = true;
                                this.vy = 0;
                            }
                        } else {
                            // Chão normal colide sempre por cima
                            this.y = tile.y - this.h;
                            this.grounded = true;
                            this.vy = 0;
                        }
                    } else if (this.vy < 0) { // Subindo
                        // Colide apenas com o teto se for chão (ground). 
                        // Ignora plataformas (=) permitindo pular através delas.
                        if (tile.type === 'ground') {
                            this.y = tile.y + tile.h;
                            this.vy = 0;
                        }
                    }
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;
        const x = this.x - camX;
        const y = this.y;
        
        // Desenho estilizado da Mônica
        ctx.fillStyle = '#E30022';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 20); ctx.lineTo(x + 35, y + 20);
        ctx.lineTo(x + 40, y + 60); ctx.lineTo(x, y + 60);
        ctx.fill();
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#FFE0BD';
        ctx.beginPath(); ctx.arc(x + 20, y + 15, 15, 0, Math.PI * 2); ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(x + 20, y + 12, 16, Math.PI, 0); ctx.fill();

        ctx.fillStyle = 'white'; ctx.fillRect(x + 18, y + 18, 4, 3);
    }
}

// --- Main Engine ---

export class Game2DEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private audio = new SoundManager();
    public input = new InputHandler();
    private player: Player | null = null;
    private entities: Entity[] = [];
    private particles: Particle[] = [];
    private map: any[] = [];
    private camX = 0;
    private levelWidth = 0;
    private animationId = 0;
    private flagX = 0;

    // Novo design de nível:
    // - As plataformas estão em Row 7 e Row 5.
    // - Row 7 é facilmente alcançável do chão.
    // - Row 5 é acessível pulando da Row 7.
    // - Buracos agora são limpos, sem plataformas baixas obstruindo o pulo vertical.
    private levelData = [
        "                                                                                                    ",
        "                                                                                                    ",
        "                                                                                                    ",
        "                                                         M      M                                   ",
        "                                                        ==========                                  ",
        "                                                                                                    ",
        "    M      M              M      M                                             M      M             ",
        "   ==========            ==========                                           ==========            ",
        "                                           M      M                                                 ",
        "                                          ==========                                                ",
        "          C                                                       C                               F ",
        "#################        ############################        #################    ##################"
    ];

    public onScoreUpdate: (score: number) => void;
    public onLivesUpdate: (lives: number) => void;
    public onWin: () => void;
    public onGameOver: () => void;
    public score = 0;

    constructor(
        canvas: HTMLCanvasElement,
        callbacks: { 
            onScore: (s: number) => void, 
            onLives: (l: number) => void, 
            onWin: () => void, 
            onGameOver: () => void 
        }
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.onScoreUpdate = callbacks.onScore;
        this.onLivesUpdate = callbacks.onLives;
        this.onWin = callbacks.onWin;
        this.onGameOver = callbacks.onGameOver;

        this.initLevel();
        this.loop = this.loop.bind(this);
        this.animationId = requestAnimationFrame(this.loop);
    }

    private initLevel() {
        const tileSize = 60;
        this.levelData.forEach((row, rowIndex) => {
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const char = row[colIndex];
                const x = colIndex * tileSize;
                const y = rowIndex * tileSize;
                if (char === '#') this.map.push({x, y, w: tileSize, h: tileSize, type: 'ground'});
                if (char === '=') this.map.push({x, y, w: tileSize, h: 20, type: 'plat'});
                if (char === 'P' || (rowIndex === 10 && colIndex === 2)) this.player = new Player(x, y);
                if (char === 'C') this.entities.push(new Enemy(x, y, 'cebolinha'));
                if (char === 'M') this.entities.push(new Collectible(x, y + 15));
                if (char === 'F') this.flagX = x;
            }
        });
        if (!this.player) this.player = new Player(120, 500);
        this.levelWidth = this.levelData[0].length * tileSize;
        this.onLivesUpdate(this.player.lives);
    }

    private update() {
        if (!this.player) return;

        this.player.update(this.input, this.map, this.entities.filter(e => e instanceof Enemy) as Enemy[], this.audio);
        
        this.entities.forEach(ent => {
            if (ent instanceof Enemy) {
                ent.update(this.map);
                if (!ent.markedForDeletion && this.player!.checkCollision(ent)) {
                    if (this.player!.vy > 0 && this.player!.y + this.player!.h - 10 < ent.y + ent.h/2) {
                        ent.markedForDeletion = true;
                        this.player!.vy = -15; 
                        this.score += 100;
                        this.onScoreUpdate(this.score);
                    } else if (this.player!.invulnerable <= 0) {
                        this.handleHit();
                    }
                }
            } else if (ent instanceof Collectible) {
                ent.update();
                if (this.player!.checkCollision(ent)) {
                    ent.markedForDeletion = true;
                    this.score += 50;
                    this.onScoreUpdate(this.score);
                    this.audio.coin();
                    for(let i=0; i<5; i++) this.particles.push(new Particle(ent.cx, ent.cy, '#4CAF50'));
                }
            }
        });

        this.entities = this.entities.filter(e => !e.markedForDeletion);
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        const targetCamX = this.player.x - this.canvas.width / 2;
        this.camX += (targetCamX - this.camX) * 0.1;
        this.camX = Math.max(0, Math.min(this.camX, this.levelWidth - this.canvas.width));

        if (this.player.x > this.flagX) this.onWin();
        if (this.player.y > 1000) this.handleHit();
    }

    private handleHit() {
        if (!this.player) return;
        this.player.lives--;
        this.onLivesUpdate(this.player.lives);
        this.audio.hit();
        if (this.player.lives <= 0) this.onGameOver();
        else {
            this.player.x = 120; this.player.y = 400;
            this.player.vy = 0;
            this.player.invulnerable = 90;
        }
    }

    private draw() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.map.forEach(tile => {
            this.ctx.fillStyle = tile.type === 'ground' ? '#5D4037' : '#8D6E63';
            this.ctx.fillRect(tile.x - this.camX, tile.y, tile.w, tile.h);
            if (tile.type === 'ground') {
                this.ctx.fillStyle = '#43A047';
                this.ctx.fillRect(tile.x - this.camX, tile.y, tile.w, 10);
            }
        });

        this.entities.forEach(ent => ent.draw(this.ctx, this.camX));
        this.player?.draw(this.ctx, this.camX);
        this.particles.forEach(p => p.draw(this.ctx, this.camX));

        if (this.flagX) {
            const fx = this.flagX - this.camX;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(fx, 150, 6, 500);
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            // Adicionando 'this.' ausente antes das chamadas de ctx
            this.ctx.moveTo(fx, 150); this.ctx.lineTo(fx + 60, 180); this.ctx.lineTo(fx, 210);
            this.ctx.fill();
        }
    }

    private loop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.loop);
    }

    public cleanup() {
        cancelAnimationFrame(this.animationId);
        this.input.cleanup();
    }
}
