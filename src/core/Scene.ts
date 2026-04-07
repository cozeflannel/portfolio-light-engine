import * as THREE from 'three';
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';

export class LightScene {
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private material: THREE.ShaderMaterial;
    private mouse: THREE.Vector2;

    constructor() {
        this.scene = new THREE.Scene();
        this.mouse = new THREE.Vector2(0.5, 0.5);

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Generate the text texture
        const textTexture = this.createTextTexture('LUCAS');

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_mouse: { value: new THREE.Vector2() },
                u_textTexture: { value: textTexture } // Pass the texture to the shader
            }
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);

        this.addEventListeners();
        this.animate();
    }

    private createTextTexture(text: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        // High res for crisp text
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 1. SET THE STYLE (We'll use standard sans-serif for reliability) ---
        ctx.font = '900 220px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // --- 2. THE BIG FIX: Use solid filled text, not hollow strokes ---
        // Solid shapes are much more controllable in WebGL than thin outlines.
        ctx.fillStyle = 'white'; // Base light source color

        // --- 3. THE BIG FIX: Use extremely tight blur/halo values ---
        ctx.shadowColor = 'white';

        // We lowered these dramatically (Previously 120 and 60).
        // A lower number creates a tighter, sharper neon look.

        // Layer 1: Tight outer halo (Prev: 120)
        ctx.shadowBlur = 50;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Layer 2: Tight inner bloom (Prev: 60)
        ctx.shadowBlur = 20;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Layer 3: Solid, crisp letter itself
        ctx.shadowBlur = 0;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    private addEventListeners() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = window.innerHeight - e.clientY;
            this.material.uniforms.u_mouse.value.set(this.mouse.x, this.mouse.y);
        });
    }

    private animate = () => {
        requestAnimationFrame(this.animate);
        this.material.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }
}