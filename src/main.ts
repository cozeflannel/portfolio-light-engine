import './style.css'
import { LightScene } from './core/Scene'
import { SignatureAnimation } from './core/Signature'

// Initialize the WebGL scene
new LightScene();

// Signature plays on click, then transitions to projects
const signature = new SignatureAnimation(() => {
    // TODO: navigate to projects page
    console.log('Signature complete — ready to load projects');
});

// Use a flag on window to survive HMR and prevent double-play
if (!(window as any).__signatureListenerAdded) {
    (window as any).__signatureListenerAdded = true;
    (window as any).__signaturePlayed = false;

    document.addEventListener('click', () => {
        if ((window as any).__signaturePlayed) return;
        (window as any).__signaturePlayed = true;
        signature.play();
    });
}
