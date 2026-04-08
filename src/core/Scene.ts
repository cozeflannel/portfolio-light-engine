import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export class LightScene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private cubeGroup: THREE.Group;
    private controls: OrbitControls;
    private sphere: THREE.Mesh;

    private mirror: Reflector;
    private textMesh: THREE.Mesh;
    private flashlight: THREE.PointLight;
    private mouse: THREE.Vector2;

    private composer: EffectComposer;
    private bloomPass: UnrealBloomPass;

    private targetScroll: number = 0;
    private currentScroll: number = 0;

    constructor() {
        this.scene = new THREE.Scene();
        this.mouse = new THREE.Vector2(0, 0);

        const backgroundColor = 0x000000;
        this.scene.background = new THREE.Color(backgroundColor);
        this.scene.fog = new THREE.FogExp2(backgroundColor, 0.025);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 4, 12);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.body.appendChild(this.renderer.domElement);

        const renderScene = new RenderPass(this.scene, this.camera);
        /*this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.5, 0.0);
        this.bloomPass.strength = 1.5;*/
        // Parameters: (resolution, strength, radius, THRESHOLD)
        // Threshold changed to 0.2 so the dark background doesn't blur into the light
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.5, 0.2);
        this.bloomPass.strength = 0.8; // Cut the glare strength in half
        this.bloomPass.radius = 0.8;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 35;

        // --- 1. THE 3x3x3 CUBES ---
        this.cubeGroup = new THREE.Group();
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0x001133,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.8,
        });

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const spacing = 1.0;

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const smallBox = new THREE.Mesh(boxGeo, boxMaterial);
                    const basePos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
                    smallBox.position.copy(basePos);
                    smallBox.userData.basePosition = basePos;
                    smallBox.castShadow = true;
                    this.cubeGroup.add(smallBox);
                }
            }
        }
        this.cubeGroup.position.y = 1.5;
        this.scene.add(this.cubeGroup);

        // --- 2. THE DIFFUSE MIRROR FLOOR (NEW) ---
        const floorGeo = new THREE.PlaneGeometry(200, 200);

        // A: The blurred reflector base
        this.mirror = new Reflector(floorGeo, {
            clipBias: 0.003,
            // DRASTICALLY LOWER RESOLUTION to create a natural, smooth blur
            textureWidth: window.innerWidth * 0.15,
            textureHeight: window.innerHeight * 0.15,
            color: 0x333333
        });
        this.mirror.rotation.x = -Math.PI / 2;
        this.mirror.position.y = -1.5;
        this.scene.add(this.mirror);

        // B: The physical "Frosted Glass" Overlay
        const diffuseMat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            roughness: 0.9,     // Highly rough
            metalness: 0.2,
            transparent: true,
            opacity: 0.65       // Lets 35% of the blurred mirror shine through!
        });
        const diffuseFloor = new THREE.Mesh(floorGeo, diffuseMat);
        diffuseFloor.rotation.x = -Math.PI / 2;
        diffuseFloor.position.y = -1.495; // Placed millimeters above the mirror
        diffuseFloor.receiveShadow = true; // Catches the crisp shadows
        this.scene.add(diffuseFloor);

        // The Neon Grid
        const gridHelper = new THREE.GridHelper(100, 50, 0xff00ab, 0x111111);
        gridHelper.position.y = -1.490; // Slightly above the diffuse floor
        this.scene.add(gridHelper);

        // --- 3. THE RISING BACKGROUND TEXT ("LUCAS") ---
        const textTexture = this.createTextTexture('LUCAS');
        const textMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: textTexture,
            transparent: true,
            roughness: 0.5,
            metalness: 0.5
        });

        const textGeo = new THREE.PlaneGeometry(30, 15);
        this.textMesh = new THREE.Mesh(textGeo, textMat);
        this.scene.add(this.textMesh);

        // --- 4. THE SUN (SPHERE) ---
        const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0xff00ab,
            emissive: 0xff00ab,
            /*emissiveIntensity: 2.5,*/
            emissiveIntensity: 1.2,
            roughness: 0.1,
            metalness: 0.1,
        });
        this.sphere = new THREE.Mesh(sphereGeo, sphereMat);
        this.scene.add(this.sphere);

        // --- 5. LIGHTING & MOUSE FLASHLIGHT ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(ambientLight);

        const fillLight = new THREE.PointLight(0x00d4ff, 150, 100);
        fillLight.position.set(-5, 2, -5);
        this.scene.add(fillLight);

        /*this.flashlight = new THREE.PointLight(0xffffff, 400, 30);
        this.scene.add(this.flashlight);*/
        // Lowered intensity to 50, but increased the spread distance to 50
        this.flashlight = new THREE.PointLight(0xffffff, 50, 50);
        this.flashlight = new THREE.PointLight(0xffffff, 0, 30); // Starts invisible
        this.scene.add(this.flashlight);

        this.addEventListeners();
        this.animate();
    }

    private createTextTexture(text: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '900 350px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'white';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 20;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    private addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);

            // Keep the blurred ratio on resize
            this.mirror.getRenderTarget().setSize(
                window.innerWidth * 0.15,
                window.innerHeight * 0.15
            );
        });

        window.addEventListener('wheel', (event) => {
            this.targetScroll += event.deltaY * 0.001;
            this.targetScroll = Math.max(0, Math.min(1, this.targetScroll));
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    private animate = () => {
        requestAnimationFrame(this.animate);

        this.currentScroll += (this.targetScroll - this.currentScroll) * 0.05;

        const cyanAtmosphere = new THREE.Color(0x000a14);
        const pinkAtmosphere = new THREE.Color(0x1a0011);
        const currentColor = cyanAtmosphere.clone().lerp(pinkAtmosphere, this.currentScroll);

        if (this.scene.fog) {
            this.scene.fog.color.copy(currentColor);
        }

        /*this.bloomPass.radius = 0.6 + (this.currentScroll * 0.5);*/
        this.bloomPass.radius = 0.3 + (this.currentScroll * 0.2);

        // --- CUBES ---
        if (this.cubeGroup) {
            this.cubeGroup.rotation.y += 0.003;
            this.cubeGroup.rotation.x += 0.001;

            const expansion = 1.0 + (1.0 - this.currentScroll) * 3.5;
            const cubeSize = 0.4 + (this.currentScroll * 0.6);

            this.cubeGroup.children.forEach((child) => {
                const basePos = child.userData.basePosition;
                if (basePos) {
                    child.position.copy(basePos).multiplyScalar(expansion);
                    child.scale.set(cubeSize, cubeSize, cubeSize);
                    child.rotation.set(0, 0, 0);
                }
            });
            this.cubeGroup.rotation.set(0, 0, 0);
        }

        // --- RISING SUN ---
        if (this.sphere) {
            const startX = -12.0;
            const startY = -4.0;
            const startZ = -15.0;
            const startScale = 0.5;

            const endX = 12.0;
            const endY = 8.0;
            const endZ = -15.0;
            const endScale = 2.5;

            this.sphere.position.x = startX + (endX - startX) * this.currentScroll;
            this.sphere.position.y = startY + (endY - startY) * this.currentScroll;
            this.sphere.position.z = startZ + (endZ - startZ) * this.currentScroll;

            const currentScale = startScale + (endScale - startScale) * this.currentScroll;
            this.sphere.scale.set(currentScale, currentScale, currentScale);
        }

        // --- RISING BACKGROUND TEXT ---
        if (this.textMesh) {
            const startTextY = -5.0;
            const startTextZ = -25.0;

            const endTextY = 7.0;
            const endTextZ = -10.0;

            this.textMesh.position.y = startTextY + (endTextY - startTextY) * this.currentScroll;
            this.textMesh.position.z = startTextZ + (endTextZ - startTextZ) * this.currentScroll;

            const textScale = 0.2 + (this.currentScroll * 0.8);
            this.textMesh.scale.set(textScale, textScale, textScale);
        }

        // --- FLASHLIGHT ---
        if (this.flashlight) {
            const targetLightX = this.mouse.x * 20;
            const targetLightY = this.mouse.y * 10 + 5;

            this.flashlight.position.x += (targetLightX - this.flashlight.position.x) * 0.1;
            this.flashlight.position.y += (targetLightY - this.flashlight.position.y) * 0.1;
            this.flashlight.position.z = this.textMesh.position.z + 3;
        }

        this.controls.update();
        this.composer.render();
    }
}