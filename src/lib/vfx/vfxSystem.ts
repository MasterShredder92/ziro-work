/**
 * VFX System for ZiroWork
 * Creates interactive "Code Flare", "Electricity", and "Robot" animations
 * Inspired by Duke Nukem's arcade aesthetic
 */

export interface VFXParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'code-flare' | 'electricity' | 'spark' | 'robot-eye';
  color: string;
  size: number;
}

export class VFXSystem {
  private particles: VFXParticle[] = [];
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(canvasElement?: HTMLCanvasElement) {
    if (canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
    }
  }

  /**
   * Trigger a "Code Flare" explosion at a position
   * Green/purple neon bursts with jagged lines
   */
  triggerCodeFlare(x: number, y: number, color: string = '#c4f036') {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        id: `flare-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        type: 'code-flare',
        color,
        size: 3 + Math.random() * 2,
      });
    }
  }

  /**
   * Trigger an "Electricity" arc between two points
   * Purple/blue jagged lines that fade
   */
  triggerElectricity(x1: number, y1: number, x2: number, y2: number) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const segments = Math.ceil(distance / 10);
    const color = Math.random() > 0.5 ? '#a855f7' : '#7c3aed';

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
      const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
      this.particles.push({
        id: `elec-${Date.now()}-${i}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1,
        maxLife: 0.6,
        type: 'electricity',
        color,
        size: 1.5 + Math.random() * 1,
      });
    }
  }

  /**
   * Trigger a "Spark" burst (smaller, faster)
   * Used for button clicks and interactions
   */
  triggerSparks(x: number, y: number, count: number = 8, color: string = '#c4f036') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        id: `spark-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4,
        type: 'spark',
        color,
        size: 1 + Math.random() * 1.5,
      });
    }
  }

  /**
   * Trigger a "Robot Eye" blink at a position
   * Glowing circle that appears and fades
   */
  triggerRobotEye(x: number, y: number, color: string = '#a855f7') {
    this.particles.push({
      id: `eye-${Date.now()}`,
      x,
      y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 0.8,
      type: 'robot-eye',
      color,
      size: 8 + Math.random() * 4,
    });
  }

  /**
   * Update and render all particles
   */
  update(deltaTime: number = 0.016) {
    this.particles = this.particles.filter(p => {
      p.life -= deltaTime / p.maxLife;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      return p.life > 0;
    });
  }

  /**
   * Render particles to canvas
   */
  render() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;

      switch (p.type) {
        case 'code-flare':
          this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
        case 'electricity':
          this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
        case 'spark':
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case 'robot-eye':
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          break;
      }
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Start animation loop
   */
  start() {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }
}

/**
 * Global VFX instance for the app
 */
let globalVFX: VFXSystem | null = null;

export function initGlobalVFX(canvas: HTMLCanvasElement): VFXSystem {
  globalVFX = new VFXSystem(canvas);
  globalVFX.start();
  return globalVFX;
}

export function getGlobalVFX(): VFXSystem | null {
  return globalVFX;
}
