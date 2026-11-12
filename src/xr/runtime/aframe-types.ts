import type * as THREE from "three";

// Types only: all runtime Three.js constructors come from AFRAME.THREE (super-three).
export interface AFrameEntity extends HTMLElement {
  object3D: THREE.Object3D;
  sceneEl: AFrameScene;
  components: Record<
    string,
    {
      yawObject?: THREE.Object3D;
      pitchObject?: THREE.Object3D;
      velocity?: THREE.Vector3;
      keys?: Record<string, boolean>;
    }
  >;
  setAttribute(name: string, value: string | number | boolean | Record<string, unknown>): void;
  setAttribute(name: string, property: string, value: unknown): void;
  setObject3D(name: string, object: THREE.Object3D): void;
  removeObject3D(name: string): void;
  emit(name: string, detail?: unknown, bubbles?: boolean): void;
  pause(): void;
  play(): void;
  addState(name: string): void;
  removeState(name: string): void;
  is(name: string): boolean;
}

export interface AFrameScene extends AFrameEntity {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  hasLoaded: boolean;
  renderStarted: boolean;
  xrSession?: XRSession;
  resize(): void;
  enterVR(useAR?: boolean, useOfferSession?: boolean): Promise<void>;
  exitVR(): Promise<void>;
}

export interface AFrameRuntime {
  THREE: typeof THREE;
  components: Record<string, unknown>;
  registerComponent(name: string, definition: Record<string, unknown>): unknown;
}
