import {
  Scene,
  WebGLRenderer,
  OrthographicCamera,
  Clock
} from 'three';
import Lenis from 'lenis';

export interface Screen {
  width: number;
  height: number;
  aspect: number;
}

export interface Sizes {
  screen: Screen;
  pixelRatio: number;
}

/**
 * Singleton for shared Three.js resources:
 * - Scene
 * - Camera
 * - Renderer
 * - Lenis scroll
 * - Clock & timing
 */
export default class Commons {
  private static instance: Commons;

  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly lenis: Lenis;

  private clock: THREE.Clock;
  public elapsedTime: number = 0;

  public sizes: Sizes;

  /**
   * Private constructor to enforce singleton
   */
  private constructor() {
    // Initialize sizes based on current viewport
    this.sizes = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        aspect: window.innerWidth / window.innerHeight,
      },
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };

    // Core Three.js objects
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    // Setup Lenis scroll (auto RAF)
    this.lenis = new Lenis({ autoRaf: true, duration: 1.2 });

    // Camera
     const { width, height } = this.sizes.screen;
    this.camera = new OrthographicCamera(
      // left, right
      -width  / 2, width  / 2,
      // top, bottom
       height / 2, -height / 2,
      // near, far
      0.1, 1000
    );
    this.camera.position.z = 1;       // z를 너무 멀리 두면 보이지 않으니 1~10 사이로
    this.camera.updateProjectionMatrix();

    // Renderer uses existing canvas#webgl-canvas in DOM
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(
      this.sizes.screen.width,
      this.sizes.screen.height
    );

  const { width, height } = this.sizes.screen;
this.camera.left   = -width  / 2;
this.camera.right  =  width  / 2;
this.camera.top    =  height / 2;
this.camera.bottom = -height / 2;
this.camera.updateProjectionMatrix();

  /**
   * Accessor for the singleton instance
   */
  public static getInstance(): Commons {
    if (!Commons.instance) {
      Commons.instance = new Commons();
    }
    return Commons.instance;
  }

  /**
   * Must be called each frame to update clock & scroll state
   */
  public update(): void {
    this.elapsedTime = this.clock.getElapsedTime();
    // Lenis autoRaf = true handles scroll internally
  }

  /**
   * Updates renderer size, camera aspect, and pixel ratio
   * Call on window resize
   */
  public onResize(): void {
    // Update stored dimensions
    this.sizes.screen.width = window.innerWidth;
    this.sizes.screen.height = window.innerHeight;
    this.sizes.screen.aspect =
      window.innerWidth / window.innerHeight;
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Update renderer
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(
      this.sizes.screen.width,
      this.sizes.screen.height
    );

    // Update camera
    this.camera.aspect = this.sizes.screen.aspect;
    this.camera.updateProjectionMatrix();
  }
}