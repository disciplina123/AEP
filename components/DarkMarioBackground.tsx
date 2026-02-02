import React, { useEffect, useRef } from 'react';

export default function DarkMarioBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // PIXEL_SCALE: 3 para um visual SNES nítido
    const PIXEL_SCALE = 3;

    const resizeCanvas = () => {
      canvas.width = Math.ceil(window.innerWidth / PIXEL_SCALE);
      canvas.height = Math.ceil(window.innerHeight / PIXEL_SCALE);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- PALETA DE CORES (LUIGI'S MANSION ESTÁTICA) ---
    const C = {
      skyTop: '#0d0221',    // Roxo quase preto
      skyBottom: '#261447', // Roxo profundo
      
      moon: '#fdfdc4',      // Amarelo pálido
      moonGlow: '#5d2c75',  // Halo Roxo (Estático)

      mansionDark: '#05010a', 
      mansionWall: '#191226', 
      mansionHighlight: '#2e2240', 
      roof: '#020103',

      windowLit: '#ffaa00', // Luz quente fixa
      windowDim: '#3a2010', // Janela apagada
      
      groundBack: '#0a0814',
      groundFront: '#05040a',
      
      fog1: '#2e4857', 
      fog2: '#41666b', 
      
      ghostOuter: '#a6fcdb', // Verde Ectoplasma
      ghostInner: '#ffffff',
      
      fence: '#020103', 
    };

    // --- SPRITES (PIXEL ART) ---

    // Boo (Fantasma) - 14x12
    const booSprite = [
        "00000111100000",
        "00011111111000",
        "00111111111100",
        "01111111111110",
        "11111111111111",
        "11111111111111", 
        "11111111111111",
        "11111111111111",
        "11111111111110",
        "01111111111110",
        "00111101111000", 
        "00011000110000"
    ];

    // Morcego (Bat) - 7x5 (Asas Abertas fixas)
    const batSprite = [
        "1000001",
        "1100011",
        "0110110",
        "0011100",
        "0001000"
    ];

    // Lápide Cruz
    const graveCross = [
        "00011000",
        "00111100",
        "01111110",
        "00011000",
        "00011000",
        "00011000",
        "01111110",
        "11111111"
    ];

    // Lápide Redonda
    const graveRound = [
        "00111100",
        "01111110",
        "11111111",
        "11100111",
        "11111111",
        "11111111",
        "11111111",
        "11111111"
    ];

    // Árvore Morta
    const treeSprite = [
        "000010001000",
        "000111011100",
        "001111111110",
        "011011111010",
        "110001110001",
        "000001110000",
        "000001110000",
        "000001110000",
        "000001110000",
        "000011111000",
        "000111111100"
    ];

    // --- ENTIDADES (Posições Fixas para não mover) ---
    // Usamos coordenadas relativas (%) para se adaptar ao resize, mas calculamos no render

    // --- HELPER FUNCTIONS ---

    // Função pseudo-aleatória determinística baseada em coordenadas (para texturas fixas)
    const noise = (x: number, y: number) => {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    };

    const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    const drawSprite = (sprite: string[], x: number, y: number, color: string, scale: number = 1, flip: boolean = false) => {
        ctx.fillStyle = color;
        for(let r = 0; r < sprite.length; r++) {
            const row = sprite[r];
            for(let c = 0; c < row.length; c++) {
                if (row[c] === '1') {
                    const drawX = flip ? (row.length - 1 - c) : c;
                    ctx.fillRect(
                        Math.floor(x + drawX * scale), 
                        Math.floor(y + r * scale), 
                        scale, scale
                    );
                }
            }
        }
    };

    const drawMansion = (w: number, h: number) => {
        const mx = Math.floor(w / 2);
        const my = h - 45; // Base no topo da colina
        
        const wallColor = C.mansionWall;
        const roofColor = C.roof;

        // Estrutura Principal
        drawRect(mx - 30, my - 60, 60, 60, wallColor); // Corpo Central
        drawRect(mx - 50, my - 40, 20, 40, wallColor); // Asa Esq
        drawRect(mx + 30, my - 40, 20, 40, wallColor); // Asa Dir

        // Textura de Tijolos (Determinística)
        ctx.fillStyle = C.mansionHighlight;
        for(let bx = mx - 50; bx < mx + 50; bx += 4) {
            for(let by = my - 80; by < my; by += 4) {
                // Desenha tijolo se noise for alto e estiver dentro da área da mansão
                if (noise(bx, by) > 0.8) {
                    // Check bounds simples
                    if (by > my - 60 && bx > mx - 30 && bx < mx + 30) drawRect(bx, by, 2, 1, C.mansionHighlight);
                    else if (by > my - 40 && bx > mx - 50 && bx < mx + 50) drawRect(bx, by, 2, 1, C.mansionHighlight);
                }
            }
        }

        // Telhados
        const drawRoof = (x: number, y: number, width: number) => {
            for(let i=0; i<10; i++) {
                const rw = width + 4 - i*2;
                if(rw > 0) drawRect(x - rw/2, y - i, rw, 1, roofColor);
            }
            // Ponta
            drawRect(x-1, y-12, 2, 4, roofColor);
        };

        drawRoof(mx, my - 60, 64);      // Central
        drawRoof(mx - 40, my - 40, 24); // Esq
        drawRoof(mx + 40, my - 40, 24); // Dir

        // Torre Alta (Esquerda)
        drawRect(mx - 45, my - 70, 10, 30, wallColor);
        drawRoof(mx - 40, my - 70, 14);

        // Varanda Central
        drawRect(mx - 15, my - 25, 30, 2, roofColor); // Base varanda
        drawRect(mx - 15, my - 28, 2, 3, roofColor);  // Grade esq
        drawRect(mx + 13, my - 28, 2, 3, roofColor);  // Grade dir
        for(let i=0; i<5; i++) drawRect(mx - 10 + i*6, my - 28, 1, 3, roofColor); // Grades

        // Janelas (Estados fixos baseados na posição)
        const drawWindow = (x: number, y: number, w: number, h: number, arch: boolean = false) => {
            // Determina se está acesa baseado na posição (sempre o mesmo resultado)
            const isLit = noise(x, y) > 0.4;
            const winColor = isLit ? C.windowLit : C.windowDim;

            // Luz
            drawRect(x, y, w, h, winColor);
            // Moldura Cruz
            ctx.fillStyle = roofColor;
            ctx.fillRect(x + w/2 - 1, y, 2, h);
            ctx.fillRect(x, y + h/3, w, 2);
            if (arch) {
                drawRect(x, y-2, w, 2, roofColor); // Arco topo
            }
        };

        drawWindow(mx - 8, my - 50, 16, 18, true); // Janela Central Grande
        drawWindow(mx - 44, my - 30, 8, 12);       // Asa Esq
        drawWindow(mx + 36, my - 30, 8, 12);       // Asa Dir
        drawWindow(mx - 43, my - 60, 6, 8);        // Torre Alta
        
        // Porta
        drawRect(mx - 10, my - 15, 20, 15, '#0e0804');
    };

    const drawFence = (w: number, h: number) => {
        const fenceY = h - 10;
        ctx.fillStyle = C.fence;
        
        // Desenha uma cerca de ferro repetida
        for(let x = 0; x < w; x += 12) {
            drawRect(x, fenceY - 15, 2, 15, C.fence);
            drawRect(x - 1, fenceY - 17, 4, 2, C.fence);
            drawRect(x, fenceY - 19, 2, 2, C.fence);

            if (x < w - 12) {
                drawRect(x, fenceY - 5, 12, 2, C.fence);
                drawRect(x, fenceY - 12, 12, 2, C.fence);
            }
        }
        
        drawRect(20, h - 30, 15, 30, '#1a1a20');
        drawRect(w - 35, h - 30, 15, 30, '#1a1a20');
        drawRect(22, h - 34, 11, 4, '#101015');
        drawRect(w - 33, h - 34, 11, 4, '#101015');
    };

    // Função de desenho principal (chamada no resize e no loop)
    const render = () => {
        const w = canvas.width;
        const h = canvas.height;

        // 1. CÉU (Estático)
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, C.skyTop);
        grad.addColorStop(1, C.skyBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. LUA (Estática)
        const moonX = w * 0.85;
        const moonY = h * 0.15;
        // Glow (Sem pulsação)
        ctx.fillStyle = C.moonGlow;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(moonX, moonY, 30, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
        // Lua
        ctx.fillStyle = C.moon;
        ctx.beginPath(); ctx.arc(moonX, moonY, 20, 0, Math.PI*2); ctx.fill();

        // 3. CENÁRIO (Colina)
        ctx.fillStyle = C.groundBack;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h - 30);
        ctx.bezierCurveTo(w/3, h-60, 2*w/3, h-60, w, h-30);
        ctx.lineTo(w, h);
        ctx.fill();

        // Árvores e Lápides (Camada de trás)
        drawSprite(treeSprite, 15, h - 50, '#020103', 2);
        drawSprite(treeSprite, w - 40, h - 55, '#020103', 2, true);
        
        drawSprite(graveCross, 50, h - 35, '#202030', 1.5);
        drawSprite(graveRound, w - 80, h - 38, '#202030', 1.5);

        // Mansão
        drawMansion(w, h);

        // 4. NEBLINA (Estática - sem offset de tempo)
        const fogY = h - 30;
        const drawFog = (yOff: number, color: string) => {
             ctx.fillStyle = color;
             ctx.globalAlpha = 0.3;
             for(let x=0; x<w; x+=4) {
                 // Noise estático baseado em x
                 const hFog = 10 + Math.sin(x*0.03)*5 + Math.sin(x*0.1)*2;
                 drawRect(x, fogY + yOff - hFog, 4, hFog + 10, color);
             }
             ctx.globalAlpha = 1.0;
        };
        drawFog(0, C.fog1);
        drawFog(5, C.fog2);

        // 5. MORCEGOS (Estáticos em posições fixas)
        // Posicionados com base em % da largura para responder ao resize
        const batPositions = [
            { x: w * 0.2, y: h * 0.2 },
            { x: w * 0.6, y: h * 0.3 },
            { x: w * 0.8, y: h * 0.15 }
        ];

        batPositions.forEach(bat => {
            // Desenhar sprite fixo
            drawSprite(batSprite, bat.x, bat.y, '#000', 1);
        });

        // 6. FANTASMAS (Boos - Estáticos)
        const booPositions = [
            { x: w * 0.15, y: h * 0.6, facingRight: true },
            { x: w * 0.85, y: h * 0.5, facingRight: false },
            { x: w * 0.3, y: h * 0.4, facingRight: true },
            { x: w * 0.7, y: h * 0.7, facingRight: false }
        ];

        booPositions.forEach((boo, i) => {
            const x = boo.x;
            const y = boo.y;
            const scale = 1.2;
            
            // Glow
            ctx.globalAlpha = 0.4;
            drawSprite(booSprite, x-1, y, C.ghostOuter, scale, !boo.facingRight);
            drawSprite(booSprite, x+1, y, C.ghostOuter, scale, !boo.facingRight);
            ctx.globalAlpha = 1.0;

            // Corpo
            drawSprite(booSprite, x, y, C.ghostInner, scale, !boo.facingRight);
            
            // Rosto Estático (Sorriso)
            const eyeX = boo.facingRight ? x + 9 * scale : x + 3 * scale;
            const mouthX = boo.facingRight ? x + 9 * scale : x + 4 * scale;
            
            ctx.fillStyle = '#000';
            // Olhos
            drawRect(eyeX, y + 4 * scale, 2 * scale, 3 * scale, '#000');
            drawRect(eyeX + 5 * scale, y + 4 * scale, 2 * scale, 3 * scale, '#000');
            
            // Sorriso malicioso fixo
            drawRect(mouthX, y + 10 * scale, 6 * scale, 1 * scale, '#000');
            drawRect(mouthX - 1 * scale, y + 9 * scale, 1 * scale, 1 * scale, '#000');
            drawRect(mouthX + 6 * scale, y + 9 * scale, 1 * scale, 1 * scale, '#000');
        });

        // 7. PORTÃO / FOREGROUND
        drawFence(w, h);

        // 8. PARTÍCULAS (Espíritos Estáticos)
        // Apenas alguns pontos verdes parados para ambiência
        ctx.fillStyle = C.ghostOuter;
        ctx.globalAlpha = 0.3;
        for(let i=0; i<15; i++) {
            const px = (i * 137) % w; // Distribuição pseudo-aleatória
            const py = h - 20 - (i * 43) % 150;
            drawRect(px, py, 2, 2, C.ghostOuter);
        }
        ctx.globalAlpha = 1.0;

        // 9. VINHETA
        const gradVignette = ctx.createRadialGradient(w/2, h/2, h*0.5, w/2, h/2, h);
        gradVignette.addColorStop(0, 'transparent');
        gradVignette.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gradVignette;
        ctx.fillRect(0, 0, w, h);
    };

    // Loop de animação (mantido apenas para garantir renderização contínua se houver glitches de resize, mas tudo é estático)
    const animate = () => {
        render();
        requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
          imageRendering: 'pixelated',
          backgroundColor: '#0d0221' 
      }}
    />
  );
}