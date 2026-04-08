export class SignatureAnimation {
    private svg: SVGSVGElement;
    private glowPaths: SVGPathElement[] = [];
    private corePaths: SVGPathElement[] = [];
    private container: HTMLDivElement;
    private backdrop: HTMLDivElement;
    private onComplete?: () => void;

    constructor(onComplete?: () => void) {
        this.onComplete = onComplete;

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; inset: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center;
            pointer-events: none; opacity: 0;
            transition: opacity 0.6s ease;
        `;

        this.backdrop = document.createElement('div');
        this.backdrop.style.cssText = `
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%);
        `;
        this.container.appendChild(this.backdrop);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // UPDATED: Changed viewBox to match your Illustrator canvas size
        this.svg.setAttribute('viewBox', '0 0 1920 1080');
        this.svg.style.position = 'relative';
        // You can tweak this width if the signature appears too big or small on your screen
        this.svg.style.width = 'min(800px, 90vw)';
        this.svg.style.height = 'auto';
        this.svg.style.overflow = 'visible';

        // 3D GLASS FILTER
        this.svg.innerHTML = `
            <defs>
                <filter id="neon-3d-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
                    <feSpecularLighting in="SourceAlpha" surfaceScale="2" specularConstant="1.5" specularExponent="20" lighting-color="#ffffff" result="specular">
                        <fePointLight x="150" y="-50" z="200" />
                    </feSpecularLighting>
                    <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut" />
                    <feMerge>
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="specularCut" />
                    </feMerge>
                </filter>
            </defs>
        `;

        // UPDATED: Your custom signature paths!
        const pathData = [
            'M529.54,630.73c107.66,20.35,121.9-126.23,128.12-209.85,176.69,95.07,50.29,401.64-145.89,339.29,310.8-148.21,641.55-250.17,946.76-414.35', // Stroke 1
            'M968.28,453.79c0,88.82,0,177.63,0,266.45', // Stroke 2
            'M884.07,499.73c0,84.99,0,169.98,0,254.96'  // Stroke 3
        ];

        for (const d of pathData) {
            // The Outer Neon Glow
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            glow.setAttribute('d', d);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', '#00d4ff'); // Cyan glow (matches the 3D cubes!)
            glow.setAttribute('stroke-width', '15'); // Slightly thicker for the larger canvas
            glow.setAttribute('stroke-linecap', 'round');
            glow.setAttribute('stroke-linejoin', 'round');
            glow.style.filter = 'url(#neon-3d-glow)';
            this.svg.appendChild(glow);
            this.glowPaths.push(glow);

            // The Inner Hot Core
            const core = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            core.setAttribute('d', d);
            core.setAttribute('fill', 'none');
            core.setAttribute('stroke', '#ffffff');
            core.setAttribute('stroke-width', '5'); // Thicker core
            core.setAttribute('stroke-linecap', 'round');
            core.setAttribute('stroke-linejoin', 'round');
            core.style.opacity = '0.9';
            this.svg.appendChild(core);
            this.corePaths.push(core);
        }

        this.container.appendChild(this.svg);
        document.body.appendChild(this.container);

        const allPaths = [...this.glowPaths, ...this.corePaths];
        for (const p of allPaths) {
            const len = p.getTotalLength();
            p.style.strokeDasharray = `${len}`;
            p.style.strokeDashoffset = `${len}`;
        }
    }

    play() {
        this.container.style.opacity = '1';

        // UPDATED: Timings tailored for your 3 strokes. 
        // 1st stroke is very long, so it gets 1.2 seconds. The other two are short, so 0.4 seconds.
        const durations = [1.2, 0.4, 0.4];
        let delay = 200;

        for (let i = 0; i < this.glowPaths.length; i++) {
            const glow = this.glowPaths[i];
            const core = this.corePaths[i];
            const dur = durations[i] ?? 0.5;

            setTimeout(() => {
                const transition = `stroke-dashoffset ${dur}s cubic-bezier(0.4, 0, 0.2, 1)`;
                glow.style.transition = transition;
                core.style.transition = transition;
                glow.style.strokeDashoffset = '0';
                core.style.strokeDashoffset = '0';
            }, delay);

            delay += dur * 1000 + 50;
        }

        setTimeout(() => {
            this.container.style.transition = 'opacity 1s ease';
            this.container.style.opacity = '0';

            setTimeout(() => {
                this.onComplete?.();
            }, 1000);
        }, delay + 1200);
    }
}