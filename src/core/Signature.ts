export class SignatureAnimation {
    private svg: SVGSVGElement;
    private glowPaths: SVGPathElement[] = [];
    private corePaths: SVGPathElement[] = [];
    private container: HTMLDivElement;
    private backdrop: HTMLDivElement;
    private onComplete?: () => void;

    constructor(onComplete?: () => void) {
        this.onComplete = onComplete;

        // Full-screen overlay container (hidden until triggered)
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; inset: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center;
            pointer-events: none; opacity: 0;
            transition: opacity 0.6s ease;
        `;

        // Dark backdrop for contrast
        this.backdrop = document.createElement('div');
        this.backdrop.style.cssText = `
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%);
        `;
        this.container.appendChild(this.backdrop);

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', '0 0 400 300');
        this.svg.style.position = 'relative';
        this.svg.style.width = 'min(500px, 70vw)';
        this.svg.style.height = 'auto';
        this.svg.style.overflow = 'visible';

        // Traced from the Canva reference signature
        const pathData = [
            // 1. Main diagonal stroke from lower-left up to the right
            'M 60 240 Q 100 170, 160 100 Q 180 70, 200 50',
            // 2. First vertical stroke (left of initials)
            'M 195 45 L 210 150',
            // 3. Second vertical stroke (right of initials)
            'M 230 35 L 245 145',
            // 4. Horizontal cross-bar
            'M 185 85 L 280 70',
            // 5. Large sweeping loop from top-right, down and around
            'M 275 65 Q 350 60, 370 100 Q 390 160, 320 210 Q 250 260, 150 260 Q 60 260, 30 220 Q 10 190, 30 165 Q 50 140, 90 155 Q 110 165, 100 185',
        ];

        for (const d of pathData) {
            // Outer glow layer (colored, wider, blurred)
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            glow.setAttribute('d', d);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', '#ff14ab');
            glow.setAttribute('stroke-width', '8');
            glow.setAttribute('stroke-linecap', 'round');
            glow.setAttribute('stroke-linejoin', 'round');
            glow.style.filter = `
                drop-shadow(0 0 8px rgba(255, 20, 171, 0.9))
                drop-shadow(0 0 20px rgba(255, 20, 171, 0.6))
                drop-shadow(0 0 40px rgba(255, 20, 171, 0.3))
            `;
            this.svg.appendChild(glow);
            this.glowPaths.push(glow);

            // Core layer (white-hot center, thin)
            const core = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            core.setAttribute('d', d);
            core.setAttribute('fill', 'none');
            core.setAttribute('stroke', '#fff0f8');
            core.setAttribute('stroke-width', '2.5');
            core.setAttribute('stroke-linecap', 'round');
            core.setAttribute('stroke-linejoin', 'round');
            this.svg.appendChild(core);
            this.corePaths.push(core);
        }

        this.container.appendChild(this.svg);
        document.body.appendChild(this.container);

        // Hide all paths initially via dash offset
        const allPaths = [...this.glowPaths, ...this.corePaths];
        for (const p of allPaths) {
            const len = p.getTotalLength();
            p.style.strokeDasharray = `${len}`;
            p.style.strokeDashoffset = `${len}`;
        }
    }

    play() {
        this.container.style.opacity = '1';

        const durations = [0.8, 0.4, 0.4, 0.35, 1.5]; // seconds per segment
        let delay = 400; // ms before first stroke

        for (let i = 0; i < this.glowPaths.length; i++) {
            const glow = this.glowPaths[i];
            const core = this.corePaths[i];
            const dur = durations[i] ?? 0.5;

            setTimeout(() => {
                const transition = `stroke-dashoffset ${dur}s ease-in-out`;
                glow.style.transition = transition;
                core.style.transition = transition;
                glow.style.strokeDashoffset = '0';
                core.style.strokeDashoffset = '0';
            }, delay);

            delay += dur * 1000 + 80;
        }

        // After signature is fully drawn, hold briefly then fade out
        setTimeout(() => {
            this.container.style.transition = 'opacity 1s ease';
            this.container.style.opacity = '0';

            setTimeout(() => {
                this.onComplete?.();
            }, 1000);
        }, delay + 800);
    }
}
