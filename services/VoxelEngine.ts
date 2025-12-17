/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData } from '../types';
import { CONFIG, COLORS } from '../utils/voxelConstants';

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private rebuildStartTime: number = 0;
  private maxRebuildDelay: number = 0;
  private manualProgress: number = 0; // 0.0 to 1.0
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

    // Init Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);
    // Reduced fog for clearer cartoon look
    this.scene.fog = new THREE.Fog(CONFIG.BG_COLOR, 80, 200);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Slightly zoomed out start position
    this.camera.position.set(30, 30, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 5, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    // Floor - Green grass look for Turma da Monica vibe
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x7CFC00, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.FLOOR_Y;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[]) {
    // Clear existing
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      if (Array.isArray(this.instanceMesh.material)) {
          this.instanceMesh.material.forEach(m => m.dispose());
      } else {
          this.instanceMesh.material.dispose();
      }
    }

    this.voxels = data.map((v, i) => {
        const c = new THREE.Color(v.color);
        // Remove random noise for cleaner "cartoon" look
        // c.offsetHSL(0, 0, (Math.random() * 0.1) - 0.05); 
        return {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    });

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05);
    // Add black outline effect using a second mesh is expensive, so we stick to StandardMaterial but less rough
    const material = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.0 });
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instanceMesh.castShadow = true;
    this.instanceMesh.receiveShadow = true;
    this.scene.add(this.instanceMesh);

    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    this.voxels.forEach((v, i) => {
        this.dummy.position.set(v.x, v.y, v.z);
        this.dummy.rotation.set(v.rx, v.ry, v.rz);
        this.dummy.updateMatrix();
        this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);
        this.instanceMesh!.setColorAt(i, v.color);
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
    this.instanceMesh.instanceColor!.needsUpdate = true;
  }

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    this.voxels.forEach(v => {
        v.vx = (Math.random() - 0.5) * 1.2;
        v.vy = Math.random() * 0.8;
        v.vz = (Math.random() - 0.5) * 1.2;
        v.rvx = (Math.random() - 0.5) * 0.3;
        v.rvy = (Math.random() - 0.5) * 0.3;
        v.rvz = (Math.random() - 0.5) * 0.3;
    });
  }

  private getColorDist(c1: THREE.Color, hex2: number): number {
    const c2 = new THREE.Color(hex2);
    const r = (c1.r - c2.r) * 0.3;
    const g = (c1.g - c2.g) * 0.59;
    const b = (c1.b - c2.b) * 0.11;
    return Math.sqrt(r * r + g * g + b * b);
  }

  public rebuild(targetModel: VoxelData[], manual: boolean = false) {
    if (this.state === AppState.REBUILDING || this.state === AppState.MANUAL_REBUILDING) return;

    const available = this.voxels.map((v, i) => ({ index: i, color: v.color, taken: false }));
    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);

    // Simple greedy matching for colors
    targetModel.forEach(target => {
        let bestDist = 9999;
        let bestIdx = -1;

        for (let i = 0; i < available.length; i++) {
            if (available[i].taken) continue;

            const d = this.getColorDist(available[i].color, target.color);
            const isLeafOrWood = (available[i].color.g > 0.4) || (available[i].color.r < 0.25 && available[i].color.b < 0.25);
            const targetIsGreen = target.color === COLORS.GREEN || target.color === COLORS.WOOD;
            const penalty = (isLeafOrWood && !targetIsGreen) ? 100 : 0;

            if (d + penalty < bestDist) {
                bestDist = d + penalty;
                bestIdx = i;
                if (d < 0.01) break; 
            }
        }

        if (bestIdx !== -1) {
            available[bestIdx].taken = true;
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
            mappings[available[bestIdx].index] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 800
            };
        }
    });

    // Calculate max delay for progress normalization
    let maxD = 0;
    for (let i = 0; i < this.voxels.length; i++) {
        if (!mappings[i]) {
            mappings[i] = {
                x: this.voxels[i].x, y: this.voxels[i].y, z: this.voxels[i].z,
                isRubble: true, delay: 0
            };
        } else {
             if (mappings[i].delay > maxD) maxD = mappings[i].delay;
        }
    }
    this.maxRebuildDelay = maxD;

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.manualProgress = 0;
    
    this.state = manual ? AppState.MANUAL_REBUILDING : AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  public setManualProgress(progress: number) {
      // progress 0 to 100
      this.manualProgress = Math.min(1, Math.max(0, progress / 100));
  }

  private updatePhysics() {
    if (this.state === AppState.DISMANTLING) {
        this.voxels.forEach(v => {
            v.vy -= 0.035; // Stronger Gravity
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

            // Floor bounce
            if (v.y < CONFIG.FLOOR_Y + 0.5) {
                v.y = CONFIG.FLOOR_Y + 0.5;
                v.vy *= -0.55; v.vx *= 0.8; v.vz *= 0.8;
                v.rvx *= 0.8; v.rvy *= 0.8; v.rvz *= 0.8;
            }
        });
    } else if (this.state === AppState.REBUILDING || this.state === AppState.MANUAL_REBUILDING) {
        
        // Time calculation depends on mode
        let effectiveTime = 0;
        
        if (this.state === AppState.REBUILDING) {
            effectiveTime = Date.now() - this.rebuildStartTime;
        } else {
            // In manual mode, time is mapped from 0 to (maxDelay + 1000ms flight time)
            const totalSequenceTime = this.maxRebuildDelay + 1500; 
            effectiveTime = this.manualProgress * totalSequenceTime;
        }

        let allDone = true;

        this.voxels.forEach((v, i) => {
            const t = this.rebuildTargets[i];
            if (t.isRubble) return;

            // If the "time cursor" hasn't reached this block's delay, it stays on ground
            if (effectiveTime < t.delay) {
                allDone = false;
                return;
            }

            const speed = 0.15;
            v.x += (t.x - v.x) * speed;
            v.y += (t.y - v.y) * speed;
            v.z += (t.z - v.z) * speed;
            // Rotate back to zero
            v.rx += (0 - v.rx) * speed;
            v.ry += (0 - v.ry) * speed;
            v.rz += (0 - v.rz) * speed;

            // Check if reached
            if ((t.x - v.x) ** 2 + (t.y - v.y) ** 2 + (t.z - v.z) ** 2 > 0.01) {
                allDone = false;
            } else {
                // Snap to grid
                v.x = t.x; v.y = t.y; v.z = t.z;
                v.rx = 0; v.ry = 0; v.rz = 0;
            }
        });

        // Only finish state in Auto mode, or if Manual reaches 100% (handled by UI mostly, but here for safety)
        if (allDone && this.state === AppState.REBUILDING) {
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
        }
        
        // Manual finish check is usually done by UI resetting state, but visual snap ensures clean look
        if (this.state === AppState.MANUAL_REBUILDING && this.manualProgress >= 1) {
            this.state = AppState.STABLE;
             this.onStateChange(this.state);
        }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    
    // Always draw to ensure manual progress updates render immediately
    this.draw();
    
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
  }
  
  public setAutoRotate(enabled: boolean) {
    if (this.controls) {
        this.controls.autoRotate = enabled;
    }
  }

  public getJsonData(): string {
      const data = this.voxels.map((v, i) => ({
          id: i,
          x: +v.x.toFixed(2),
          y: +v.y.toFixed(2),
          z: +v.z.toFixed(2),
          c: '#' + v.color.getHexString()
      }));
      return JSON.stringify(data, null, 2);
  }
  
  public getUniqueColors(): string[] {
    const colors = new Set<string>();
    this.voxels.forEach(v => {
        colors.add('#' + v.color.getHexString());
    });
    return Array.from(colors);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}