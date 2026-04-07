varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_textTexture;

#define STEPS 30

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float calculateShadow(vec2 uv, vec2 lightPos) {
    vec2 dir = lightPos - uv;
    vec2 stepDir = dir / float(STEPS);
    float density = 0.0;
    vec2 p = uv;
    for (int i = 0; i < STEPS; i++) {
        p += stepDir;
        float mask = texture2D(u_textTexture, p).r;
        if (mask > 0.5) { density += 1.0; }
    }
    return clamp(1.0 - (density / 12.0), 0.0, 1.0);
}

vec3 drawRealisticLight(vec2 uv, vec2 lightPos, vec3 color, float intensity, float aspect) {
    float dist = length((uv - lightPos) * vec2(aspect, 1.0));
    float attenuation = intensity / (dist * dist + 0.15); 
    float shadow = calculateShadow(uv, lightPos);
    return color * attenuation * shadow;
}

vec3 drawCinematicNeon(vec2 uv, vec2 centerPos, vec3 color, float lineLength, float aspect, float textMask) {
    vec2 p = uv - centerPos;
    p.x *= aspect;
    float d = length(vec2(max(abs(p.x) - lineLength, 0.0), p.y));
    
    float ambientGlow = 0.012 / (d + 0.12); 
    float intenseGlow = 0.003 / (d * d + 0.008); 
    
    float shadow = calculateShadow(uv, centerPos);
    vec3 lightCast = color * (ambientGlow + intenseGlow) * shadow;
    
    float core = smoothstep(0.008, 0.002, d) * (1.0 - step(0.1, textMask));
    vec3 glassTube = vec3(1.0) * core;
    
    return lightCast + glassTube;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = vUv;
    vec2 mouse = u_mouse / u_resolution.xy;

    vec4 texColor = texture2D(u_textTexture, uv);
    float mask = texColor.r; 

    // --- 1. CLEAN MATTE DARK ROOM ---
    float vignette = 1.0 - length(uv - 0.5);
    vec3 finalColor = vec3(0.015) * smoothstep(0.0, 1.0, vignette);

    // --- 2. LIGHT SOURCES ---
    
    // STATIC BARS (Reduced length to ~0.2)
    finalColor += drawCinematicNeon(uv, vec2(0.15, 0.8), vec3(0.0, 0.5, 1.0), 0.2, aspect, mask);  // Top Left Blue
    finalColor += drawCinematicNeon(uv, vec2(0.85, 0.15), vec3(1.0, 0.2, 0.0), 0.2, aspect, mask); // Bottom Right Red
    finalColor += drawCinematicNeon(uv, vec2(0.1, 0.25), vec3(0.5, 1.0, 0.0), 0.15, aspect, mask); // Mid Left Lime
    finalColor += drawCinematicNeon(uv, vec2(0.9, 0.75), vec3(1.0, 0.0, 0.8), 0.15, aspect, mask); // Mid Right Pink

    // MOVING BARS (Wrapped from -2.0 to 2.0 for smooth off-screen transition)
    float t1 = fract(u_time * 0.03) * 4.0 - 2.0; 
    finalColor += drawCinematicNeon(uv, vec2(t1, 0.9), vec3(0.8, 1.0, 0.0), 0.22, aspect, mask); 

    float t2 = fract(u_time * -0.04 + 0.5) * 4.0 - 2.0; 
    finalColor += drawCinematicNeon(uv, vec2(t2, 0.1), vec3(1.0, 0.1, 0.2), 0.22, aspect, mask); 

    float t3 = fract(u_time * 0.025 + 0.2) * 4.0 - 2.0;
    finalColor += drawCinematicNeon(uv, vec2(t3, 0.55), vec3(0.0, 0.8, 1.0), 0.18, aspect, mask);

    float t4 = fract(u_time * -0.035 + 0.8) * 4.0 - 2.0;
    finalColor += drawCinematicNeon(uv, vec2(t4, 0.4), vec3(0.6, 0.0, 1.0), 0.2, aspect, mask);
    
    // Subtle Cursor Light
    finalColor += drawRealisticLight(uv, mouse, vec3(0.8, 0.7, 0.5), 0.015, aspect); 
    
    // ACES Tone Mapping
    finalColor = (finalColor * (2.51 * finalColor + 0.03)) / (finalColor * (2.43 * finalColor + 0.59) + 0.14);
    
    // --- 3. FRONT PORTFOLIO TEXT ---
    if (mask > 0.01) {
        vec3 colorYellow = vec3(1.0, 0.8, 0.0);
        vec3 colorBlueBase = vec3(0.0, 0.4, 1.0);
        vec3 colorBlueWhite = vec3(0.8, 0.95, 1.0);
        
        vec3 textGradientX = mix(colorYellow, colorBlueBase, uv.x);
        vec3 textGradient = mix(textGradientX, colorBlueWhite, uv.y);
        
        vec3 neonGlow = textGradient * mask * 1.2; 
        float coreMask = smoothstep(0.9, 1.0, mask);
        vec3 neonCore = vec3(1.0) * coreMask * 0.6; 

        finalColor += neonGlow + neonCore; 
    }

    finalColor += (hash(uv + u_time) - 0.5) * 0.002;

    gl_FragColor = vec4(finalColor, 1.0);
}