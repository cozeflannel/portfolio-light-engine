import './style.css'
import { LightScene } from './core/Scene'
import { SignatureAnimation } from './core/Signature'

// 1. Initialize the 3D scene
new LightScene();

// 2. Create the "Enter" button overlay
const enterBtn = document.createElement('button');
enterBtn.innerText = "ENTER PORTFOLIO";
enterBtn.style.cssText = `
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 40px;
    font-family: 'RetroFamous', sans-serif;
    font-size: 20px;
    color: white;
    background: transparent;
    border: 2px solid white;
    cursor: pointer;
    z-index: 50; 
    transition: all 0.3s ease;
`;

enterBtn.onmouseover = () => {
    enterBtn.style.background = 'white';
    enterBtn.style.color = '#0a0a0a';
    enterBtn.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
};
enterBtn.onmouseout = () => {
    enterBtn.style.background = 'transparent';
    enterBtn.style.color = 'white';
    enterBtn.style.boxShadow = 'none';
};
document.body.appendChild(enterBtn);


// 3. Setup the 3D Bevel Signature Animation
const signature = new SignatureAnimation(() => {
    console.log('Signature complete — ready to load projects');
});

// 4. Attach the listener ONLY to the button
if (!(window as any).__signatureListenerAdded) {
    (window as any).__signatureListenerAdded = true;
    (window as any).__signaturePlayed = false;

    enterBtn.addEventListener('click', () => {
        if ((window as any).__signaturePlayed) return;
        (window as any).__signaturePlayed = true;

        enterBtn.style.opacity = '0';
        setTimeout(() => enterBtn.remove(), 300);

        signature.play();
    });
}