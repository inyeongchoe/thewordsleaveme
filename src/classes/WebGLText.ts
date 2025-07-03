
import { Text } from "troika-three-text";
import Commons from "./Commons";
import * as THREE from "three";

interface Props {
  scene: THREE.Scene;
  element: HTMLElement;
}

export default class WebGLText {
  commons: Commons;

  scene: THREE.Scene;
  element: HTMLElement;

  computedStyle: CSSStyleDeclaration;
  font!: string; // Path to our .ttf font file.
  bounds!: DOMRect;
  color!: THREE.Color;
  material!: THREE.ShaderMaterial;
  mesh!: Text;

  // We assign the correct font bard on our element's font weight from here
  weightToFontMap: Record<string, string> = {
    "400": "./Relationship of mélodrame.ttf"
  };
  
  private y: number = 0; // Scroll-adjusted bounds.top
  
  private isVisible: boolean = false;

  constructor({ scene, element }: Props) {
    this.commons = Commons.getInstance();

    this.scene = scene;
    this.element = element;

    this.computedStyle = window.getComputedStyle(this.element); // Saving initial computed style.
  }


private createFont() {
    this.font =
      this.weightToFontMap[this.computedStyle.fontWeight] ||
      "Relationship of mélodrame.ttf";
}


private createColor() {
    this.color = new THREE.Color(this.computedStyle.color);
}

private createMesh() {
  this.mesh = new Text();

  this.mesh.text = this.element.innerText; // Copying HTML content over to the mesh
  this.mesh.font = this.font;

  // Anchor the text to the left-center (instead of center-center)
  this.mesh.anchorX = "center";
  this.mesh.anchorY = "middle";

  this.mesh.color = this.color;

  this.scene.add(this.mesh);
}

private createBounds() {
  this.bounds = this.element.getBoundingClientRect();
  this.y = this.bounds.top + this.commons.lenis.actualScroll;
}

 constructor({ scene, element }: Props) {
    this.commons = Commons.getInstance();
    this.scene = scene;
    this.element = element;
    this.computedStyle = window.getComputedStyle(this.element);

    this.createFont();
    this.createColor();
    this.createMesh();
    this.createBounds();


    // 1) 초기 스타일값 설정 & 텍스트 숨기기 & troika 동기화
    this.setStaticValues();
    this.mesh.sync();
    this.element.style.color = "transparent";
  }

  private setStaticValues() {
    const { fontSize, letterSpacing, lineHeight, whiteSpace, textAlign } = this.computedStyle;

    const fs = parseFloat(fontSize);
    this.mesh.fontSize      = fs;
    this.mesh.textAlign     = textAlign as any;
    this.mesh.letterSpacing = parseFloat(letterSpacing) / fs;
    this.mesh.lineHeight    = parseFloat(lineHeight)    / fs;
    this.mesh.maxWidth      = this.bounds.width;
    this.mesh.whiteSpace    = whiteSpace as any;
  }

  /** 2) 매 프레임 스크롤·DOM 변화에 맞춰 위치만 업데이트 */
update() {
  this.mesh.position.y =
    -this.y +
    this.commons.lenis.animatedScroll +
    this.commons.sizes.screen.height / 2 -
    this.bounds.height / 2;

  this.mesh.position.x =
    this.bounds.left - this.commons.sizes.screen.width / 2;
}

onResize() {
  this.computedStyle = window.getComputedStyle(this.element);
  this.createBounds();
  this.setStaticValues();
}

