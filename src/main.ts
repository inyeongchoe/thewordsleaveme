import * as THREE from 'three';
import Lenis from '@studio-freight/lenis';

class App {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private lenis = new Lenis({ smooth: true });
  private particles!: THREE.Points;
  private origPositions!: Float32Array;
  private mouse = new THREE.Vector2(-9999, -9999);
  private hoverRadius = 55;

  private audio: HTMLAudioElement;
  private isPlaying = false;
  private bgFill: HTMLDivElement;

  constructor() {
    // Create background fill overlay
    this.bgFill = document.createElement('div');
    Object.assign(this.bgFill.style, {
      position: 'fixed', top: '0', left: '0',
      width: '0%', height: '100vh',
      backgroundColor: '#ff2d00',
      pointerEvents: 'none', zIndex: '-1'
    });
    document.body.insertBefore(this.bgFill, document.body.firstChild);

    // Setup WebGL renderer
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '0'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, true);
    this.renderer.outputEncoding = THREE.sRGBEncoding;


    // Setup orthographic camera
    const { innerWidth: w, innerHeight: h } = window;
    this.camera = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, 0.1, 1000);
    this.camera.position.z = 10;

    // Input events
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchstart', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', () => this.mouse.set(-9999, -9999));
    window.addEventListener('resize', this.onResize.bind(this));
    document.body.style.overflow = 'auto';

    // Audio setup
    this.audio = new Audio('/sounds/boomerang.mp3');
    this.audio.load();
    this.audio.addEventListener('ended', () => this.resetAudio());

    // Play/Pause button
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    if (playBtn) {
      playBtn.addEventListener('click', this.toggleAudio.bind(this));
      playBtn.textContent = 'Play';
    }

    // Initialize mic and wait for fonts to load before drawing
    this.initMic();
    Promise.all([
      document.fonts.load(`10px "Timeless"`),
      document.fonts.load(`10px "Relationship of mélodrame"`)
    ]).then(() => {
      this.createParticleText();
      requestAnimationFrame(this.animate.bind(this));
    });
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(
      touch.clientX - r.left - r.width / 2,
      -(touch.clientY - r.top - r.height / 2)
    );
  }

  private async initMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const delayNode = audioCtx.createDelay();
      delayNode.delayTime.value = 0.4;
      const feedbackGain = audioCtx.createGain();
      feedbackGain.gain.value = 0.6;
      source.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(audioCtx.destination);
    } catch (e) {
      console.warn('Mic init failed', e);
    }
  }

  private toggleAudio() {
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    if (!this.isPlaying) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        playBtn.textContent = 'Pause';
        this.startBgFill();
      }).catch(e => console.error('🔈 오디오 재생 실패:', e));
    } else {
      this.audio.pause();
      this.isPlaying = false;
      playBtn.textContent = 'Play';
      this.pauseBgFill();
    }
  }

  private startBgFill() {
    const duration = this.audio.duration || 0;
    this.bgFill.style.transition = `width ${duration}s linear`;
    this.bgFill.getBoundingClientRect();
    this.bgFill.style.width = '100%';
  }

  private pauseBgFill() {
    const percent = (this.audio.currentTime / (this.audio.duration || 1)) * 100;
    this.bgFill.style.transition = 'none';
    this.bgFill.style.width = `${percent}%`;
  }

  private resetAudio() {
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    this.isPlaying = false;
    if (playBtn) playBtn.textContent = 'Play';
    this.bgFill.style.transition = 'none';
    this.bgFill.style.width = '0%';
  }

  private createParticleText() {
    const text = `The words
    leave me and are reflected
    into my ears into your ears
                The words
            leave me and are reflected
          into my ears into your ears`;
    const vw = window.innerWidth;
    const fontSize = vw < 768 ? vw * 0.3 : vw * 0.1;
    const fontFamily = 'Timeless';
    const color = '#ff5733';

    const off = document.createElement('canvas');
    const ctx = off.getContext('2d')!;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    const lines = text.split('\n');
    const widths = lines.map(l => ctx.measureText(l).width);
    const textW = Math.ceil(Math.max(...widths));
    const textH = Math.ceil(fontSize * lines.length);
    off.width = textW;
    off.height = textH;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, 0, i * fontSize));

    const img = ctx.getImageData(0, 0, textW, textH).data;
    const pos: number[] = [];
    const step = 1;
    for (let y = 0; y < textH; y += step) {
      for (let x = 0; x < textW; x += step) {
        if (img[(y * textW + x) * 4 + 3] > 128) {
          pos.push(x - textW / 2, -(y - textH / 2), 0);
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    const arr = new Float32Array(pos);
    this.origPositions = arr.slice();
    geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));

    const mat = new THREE.PointsMaterial({ size: 1, color });
    this.particles = new THREE.Points(geom, mat);

    this.scene.clear();
    this.scene.add(this.particles);

    this.particles.position.y = 0;
  }

  private onMouseMove(e: MouseEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.set(
      e.clientX - r.left - r.width / 2,
      -(e.clientY - r.top - r.height / 2)
    );
  }

  private animate(time: number) {
    this.lenis.raf(time);
    const attr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const inner = this.hoverRadius;
    const outer = inner + 80;
    const ss = (e0: number, e1: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };

    const translateY = this.particles.position.y;

    for (let i = 0; i < attr.count; i++) {
      const idx = i * 3;
      const ox = this.origPositions[idx];
      const oy = this.origPositions[idx + 1];
      const worldX = ox;
      const worldY = oy + translateY;
      const dx = worldX - this.mouse.x;
      const dy = worldY - this.mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < inner) {
        attr.array[idx] = ox;
        attr.array[idx + 1] = oy;
      } else if (d < outer) {
        const m = ss(inner, outer, d);
        const sc = (Math.random() - 0.5) * 12 * m;
        attr.array[idx] = ox + sc;
        attr.array[idx + 1] = oy + sc;
      } else {
        const scAll = (Math.random() - 0.5) * 10;
        attr.array[idx] = ox + scAll;
        attr.array[idx + 1] = oy + scAll;
      }
    }
    attr.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));

  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, true);
    const c = this.renderer.domElement;
    c.style.width = '100vw';
    c.style.height = '100vh';
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.createParticleText();
  }
}

export default App;
new App();

