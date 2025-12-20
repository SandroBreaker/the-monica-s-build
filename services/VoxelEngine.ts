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
  private isAutoRotate: boolean = true;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999); // Off-screen default

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
    this.scene.fog = new THREE.Fog(CONFIG.BG_COLOR, 80, 200);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    // Optimized initial camera position
    this.camera.position.set(30, 10, 30); 

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 2.0;
    this.controls.maxPolarAngle = Math.PI / 1.5;
    // Target centered on body (approx y=-4) rather than 0,0,0
    this.controls.target.set(0, -4, 0); 

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);
    
    // Backlight for rim effect
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-20, 20, -20);
    this.scene.add(backLight);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = CONFIG.FLOOR_Y - 0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid Helper
    const grid = new THREE.GridHelper(200, 100, 0xffffff, 0xffffff);
    grid.position.y = CONFIG.FLOOR_Y - 0.51;
    (grid.material as THREE.Material).opacity = 0.1;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  updateMouse(x: number, y: number) {
      // x and y are normalized device coordinates (-1 to +1)
      this.mouse.set(x, y);
  }

  loadInitialModel(data: VoxelData[]) {
    // Clean up existing
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.dispose();
    }

    this.voxels = data.map((d, i) => ({
      id: i,
      x: d.x, y: d.y, z: d.z,
      color: new THREE.Color(d.color),
      vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0,
      rvx: 0, rvy: 0, rvz: 0,
      isCollected: false
    }));

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1 });
    
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instanceMesh.castShadow = true;
    this.instanceMesh.receiveShadow = true;
    this.scene.add(this.instanceMesh);

    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  dismantle() {
    if (this.state !== AppState.STABLE) return;
    
    this.voxels.forEach(v => {
      // Random explosive velocity
      const force = 0.5 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      v.vx = Math.cos(angle) * force * 5;
      v.vy = 5 + Math.random() * 10;
      v.vz = Math.sin(angle) * force * 5;
      
      v.rvx = (Math.random() - 0.5) * 0.5;
      v.rvy = (Math.random() - 0.5) * 0.5;
      v.rvz = (Math.random() - 0.5) * 0.5;
      
      v.isCollected = false;
    });

    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);
  }

  startCollectionGame(targetModel: VoxelData[]) {
      if (this.state !== AppState.DISMANTLING) return;
      
      // Setup targets exactly like rebuild, but don't move them yet
      this.prepareRebuildTargets(targetModel);
      
      // CRITICAL: Disable OrbitControls so camera doesn't swing wildly
      this.controls.enabled = false;

      // Adjust Camera Position for Game Mode (Zoom Out and Look Down)
      // Provide a wide field of view to see debris scattered on floor
      const gameCamPos = new THREE.Vector3(50, 45, 50);
      this.camera.position.copy(gameCamPos);
      this.camera.lookAt(0, CONFIG.FLOOR_Y, 0);
      
      this.state = AppState.COLLECTING;
      this.onStateChange(this.state);
      this.onCountChange(0); // Count collected items
  }

  // Helper to re-enable controls externally or internally
  setControlsEnabled(enabled: boolean) {
      this.controls.enabled = enabled;
  }

  // Shared logic to prepare targets and voxel array resizing
  private prepareRebuildTargets(targetModel: VoxelData[]) {
      const currentCount = this.voxels.length;
      const targetCount = targetModel.length;

      if (targetCount > currentCount) {
        for (let i = currentCount; i < targetCount; i++) {
             this.voxels.push({
                 id: i,
                 x: (Math.random() - 0.5) * 20,
                 y: CONFIG.FLOOR_Y + 1,
                 z: (Math.random() - 0.5) * 20,
                 color: new THREE.Color(targetModel[i].color),
                 vx: 0, vy: 0, vz: 0,
                 rx: 0, ry: 0, rz: 0,
                 rvx: 0, rvy: 0, rvz: 0,
                 isCollected: false
             });
        }
        
        if (this.instanceMesh) {
            this.scene.remove(this.instanceMesh);
            this.instanceMesh.dispose();
        }
        const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE, CONFIG.VOXEL_SIZE);
        const material = new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1 });
        this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
        this.instanceMesh.castShadow = true;
        this.instanceMesh.receiveShadow = true;
        this.scene.add(this.instanceMesh);
    }

    this.rebuildTargets = targetModel.map((t, i) => {
        this.voxels[i].color.setHex(t.color);
        return {
            x: t.x,
            y: t.y,
            z: t.z,
            delay: 0, // No delay for magnet
            isRubble: false
        };
    });
    
    // Extras become rubble
    for(let i = targetCount; i < this.voxels.length; i++) {
        this.rebuildTargets[i] = {
             x: this.voxels[i].x,
             y: CONFIG.FLOOR_Y - 5, 
             z: this.voxels[i].z,
             delay: 0,
             isRubble: true
        };
        // Automatically 'collect' rubble so it disappears
        this.voxels[i].isCollected = true; 
        this.voxels[i].collectionTime = performance.now();
    }
  }

  rebuild(targetModel: VoxelData[], manualMode: boolean = false) {
    if (this.state === AppState.REBUILDING) return;
    
    this.prepareRebuildTargets(targetModel);

    // Calculate animation delays for automatic mode
    this.rebuildTargets.forEach((t, i) => {
        const v = this.voxels[i];
        const dx = t.x - v.x;
        const dy = t.y - v.y;
        const dz = t.z - v.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        t.delay = Math.random() * 1000 + (dist * 20);
    });

    this.onCountChange(targetModel.length);
    this.rebuildStartTime = performance.now();
    this.maxRebuildDelay = Math.max(...this.rebuildTargets.map(t => t.delay || 0));
    
    this.state = manualMode ? AppState.MANUAL_REBUILDING : AppState.REBUILDING;
    this.manualProgress = 0;
    this.onStateChange(this.state);
  }

  setManualProgress(val: number) {
      this.manualProgress = Math.max(0, Math.min(100, val)) / 100;
      if (this.manualProgress >= 1) {
          setTimeout(() => {
              this.state = AppState.STABLE;
              this.onStateChange(this.state);
          }, 500);
      }
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }

  setAutoRotate(enabled: boolean) {
      this.isAutoRotate = enabled;
      if (this.controls) this.controls.autoRotate = enabled;
  }

  getJsonData(): string {
      const exportData = this.voxels.slice(0, this.rebuildTargets.length || this.voxels.length).map(v => ({
          x: Math.round(v.x),
          y: Math.round(v.y),
          z: Math.round(v.z),
          color: '#' + v.color.getHexString()
      }));
      return JSON.stringify(exportData, null, 2);
  }
  
  getUniqueColors(): string[] {
      const colors = new Set<string>();
      this.voxels.forEach(v => colors.add('#' + v.color.getHexString()));
      return Array.from(colors);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    const time = performance.now();

    if (this.state === AppState.DISMANTLING) {
      this.updatePhysics();
    } else if (this.state === AppState.REBUILDING) {
      this.updateRebuild(time);
    } else if (this.state === AppState.MANUAL_REBUILDING) {
      this.updateManualRebuild();
    } else if (this.state === AppState.COLLECTING) {
      this.updateCollectionGame(time);
    }

    this.controls.update();
    this.render();
  }

  private updateCollectionGame(time: number) {
      // 1. Raycast from mouse
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const ray = this.raycaster.ray;
      
      let collectedThisFrame = 0;
      let totalCollected = 0;
      const targetCount = this.rebuildTargets.filter(t => !t.isRubble).length;

      // 2. Check collisions
      this.voxels.forEach((v, i) => {
          if (i >= this.rebuildTargets.length) return;
          const target = this.rebuildTargets[i];
          if (target.isRubble) {
              return;
          }

          if (v.isCollected) {
              totalCollected++;
              // ANIMATION: Fade Out Logic (Movement part)
              // Instead of moving to target, we just let it float up and spin
              const elapsed = time - (v.collectionTime || 0);
              if (elapsed < 500) {
                  v.y += 0.2; // Float up
                  v.rx += 0.2; // Spin
                  v.ry += 0.2;
              }
          } else {
              // Physics continues for uncollected
              this.applyPhysicsToVoxel(v);
              
              // Check Distance to Ray
              // Vector from ray origin to voxel
              const vToP = new THREE.Vector3(v.x, v.y, v.z).sub(ray.origin);
              // Project onto ray direction
              const projection = vToP.dot(ray.direction);
              
              // Only collect if in front of camera
              if (projection > 0) {
                  const closestPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(projection));
                  const dist = closestPoint.distanceTo(new THREE.Vector3(v.x, v.y, v.z));
                  
                  // Collection Radius
                  if (dist < 3.0) {
                      v.isCollected = true;
                      v.collectionTime = time;
                      // Pop effect
                      v.vy += 2; 
                      collectedThisFrame++;
                  }
              }
          }
      });
      
      if (collectedThisFrame > 0) {
          this.onCountChange(totalCollected + collectedThisFrame);
      } else {
           this.onCountChange(totalCollected);
      }

      // Win Condition
      if (totalCollected >= targetCount) {
          this.state = AppState.STABLE;
          this.onStateChange(this.state);
          this.controls.enabled = true; // RE-ENABLE CONTROLS

          // Restore Camera to a nice viewing angle
          const targetCamPos = new THREE.Vector3(30, 10, 30);
          this.camera.position.lerp(targetCamPos, 1); // Instant snap for now, or animate if preferred
          this.camera.lookAt(0, -4, 0);
          
          // Snap final positions (Magic Reappearance)
           this.voxels.forEach((v, i) => {
             if (i < this.rebuildTargets.length && !this.rebuildTargets[i].isRubble) {
                 v.x = this.rebuildTargets[i].x;
                 v.y = this.rebuildTargets[i].y;
                 v.z = this.rebuildTargets[i].z;
                 v.rx = 0; v.ry = 0; v.rz = 0;
             }
           });
      }
  }

  private updatePhysics() {
    let allStable = true;
    this.voxels.forEach(v => {
       if (this.applyPhysicsToVoxel(v)) allStable = false;
    });
  }

  // Returns true if moving
  private applyPhysicsToVoxel(v: SimulationVoxel): boolean {
      const floorY = CONFIG.FLOOR_Y + (CONFIG.VOXEL_SIZE/2);
      let moving = false;

      if (v.y > floorY + 0.1 || Math.abs(v.vy) > 0.1) {
        moving = true;
        v.vy -= 0.5; // Gravity
        
        v.x += v.vx * 0.1;
        v.y += v.vy * 0.1;
        v.z += v.vz * 0.1;

        // Rotation
        v.rx += v.rvx;
        v.ry += v.rvy;
        v.rz += v.rvz;

        // Floor collision
        if (v.y < floorY) {
          v.y = floorY;
          v.vy *= -0.5; // Bounce
          v.vx *= 0.8; // Friction
          v.vz *= 0.8;
          v.rvx *= 0.8;
          v.rvy *= 0.8;
          v.rvz *= 0.8;
        }
      }
      return moving;
  }

  private updateRebuild(time: number) {
    let completeCount = 0;
    const activeVoxels = this.rebuildTargets.length;
    
    this.voxels.forEach((v, i) => {
        if (i >= activeVoxels) return; // Ignore extras
        
        const target = this.rebuildTargets[i];
        if (target.isRubble) return; // Rubble stays

        const elapsed = time - this.rebuildStartTime - target.delay;
        
        if (elapsed > 0) {
            const t = Math.min(1, elapsed / 800);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - t, 3);
            
            v.x = v.x + (target.x - v.x) * (ease * 0.1);
            v.y = v.y + (target.y - v.y) * (ease * 0.1);
            v.z = v.z + (target.z - v.z) * (ease * 0.1);
            
            // Align rotation
            v.rx = v.rx * (1 - ease);
            v.ry = v.ry * (1 - ease);
            v.rz = v.rz * (1 - ease);

            if (t >= 1) completeCount++;
        }
    });

    if (completeCount >= activeVoxels && activeVoxels > 0) {
        this.state = AppState.STABLE;
        this.onStateChange(this.state);
        // Snap to grid
        this.voxels.forEach((v, i) => {
             if (i < activeVoxels && !this.rebuildTargets[i].isRubble) {
                 v.x = this.rebuildTargets[i].x;
                 v.y = this.rebuildTargets[i].y;
                 v.z = this.rebuildTargets[i].z;
                 v.rx = 0; v.ry = 0; v.rz = 0;
             }
        });
    }
  }

  private updateManualRebuild() {
      const activeVoxels = this.rebuildTargets.length;
      
      this.voxels.forEach((v, i) => {
          if (i >= activeVoxels) return;
          const target = this.rebuildTargets[i];
          if (target.isRubble) return;

          // Interpolate based on manualProgress (0 to 1)
          const stagger = (i % 100) / 100;
          
          let t = (this.manualProgress - (stagger * 0.3)) / 0.7;
          t = Math.max(0, Math.min(1, t));
          const ease = 1 - Math.pow(1 - t, 3);

          if (t > 0) {
              v.x = v.x + (target.x - v.x) * (ease * 0.2);
              v.y = v.y + (target.y - v.y) * (ease * 0.2);
              v.z = v.z + (target.z - v.z) * (ease * 0.2);
              v.rx = v.rx * (1 - ease);
              v.ry = v.ry * (1 - ease);
              v.rz = v.rz * (1 - ease);
          }
      });
  }

  private render() {
    if (this.instanceMesh) {
      for (let i = 0; i < this.voxels.length; i++) {
        const v = this.voxels[i];
        
        // Default scale
        let scale = 1;

        // Handle Scale Logic
        if (this.state === AppState.COLLECTING && v.isCollected) {
             const elapsed = performance.now() - (v.collectionTime || 0);
             const duration = 400; // 400ms fade out
             if (elapsed < duration) {
                 scale = 1 - (elapsed / duration);
                 scale = Math.max(0, scale); // Clamp
             } else {
                 scale = 0;
             }
        }
        
        // Hide if extra rubble
        if (i >= this.rebuildTargets.length && this.rebuildTargets.length > 0 && this.rebuildTargets[i].isRubble) {
            scale = 0;
        }

        if (scale > 0) {
            this.dummy.position.set(v.x, v.y, v.z);
            this.dummy.rotation.set(v.rx, v.ry, v.rz);
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();
            this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
            this.instanceMesh.setColorAt(i, v.color);
        } else {
             // Move extremely far away to hide effectively if scale 0 causes issues (though scale 0 usually works)
             this.dummy.scale.set(0,0,0);
             this.dummy.updateMatrix();
             this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
        }
      }
      this.instanceMesh.instanceMatrix.needsUpdate = true;
      if (this.instanceMesh.instanceColor) this.instanceMesh.instanceColor.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }
}