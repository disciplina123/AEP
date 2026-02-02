import React, { useEffect, useRef } from 'react';

export default function UnderwaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Fator de escala para o visual "Pixelado/Retro"
    // Renderizamos em resolução baixa e o CSS estica
    const PIXEL_SCALE = 4;

    const resizeCanvas = () => {
      canvas.width = Math.ceil(window.innerWidth / PIXEL_SCALE);
      canvas.height = Math.ceil(window.innerHeight / PIXEL_SCALE);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- CORES (Paleta NES/SNES Underwater) ---
    const C = {
      water: '#2038EC',       // Azul padrão Mario
      waterDark: '#0000BC',   // Azul escuro (não usado no fundo simples, mas bom ter)
      sand: '#FFA044',        // Laranja areia
      sandDark: '#C84C0C',    // Sombra areia
      coral: '#FF5050',       // Coral vermelho
      coralHighlight: '#FF8080',
      coralDark: '#B01010',
      green: '#008000',       // Alga
      greenLight: '#00E800',
      white: '#FFFFFF',
      fishRed: '#F83800',
      fishWhite: '#F8F8F8',
      blooper: '#FFFFFF',
      black: '#000000'
    };

    // --- SPRITES (Bitmaps 0/1) ---
    
    // Cheep Cheep (Peixe) - 14x12
    const fishSprite = [
        "00000111100000",
        "00011111111000",
        "00111111111100",
        "01111111111110",
        "11111100111111", // Linha dos olhos (buraco 00 será branco)
        "11111100111111", 
        "11111111111111",
        "11111111111111",
        "01111111111110",
        "00111111111100",
        "00011100111000", // Nadadeiras
        "00001000010000"
    ];

    // Blooper (Lula) - 12x14
    const blooperSprite = [
        "000011110000",
        "001111111100",
        "011111111110",
        "111111111111",
        "111111111111",
        "110011110011", // Olhos (buraco 00 será preto)
        "110011110011",
        "111111111111",
        "111111111111",
        "011111111110",
        "011001100110",
        "010001100010",
        "010000000010",
        "100000000001"
    ];

    // --- ENTIDADES ---
    
    // Peixes
    const fishes: { x: number; y: number; speed: number; type: 'red' | 'green' }[] = [];
    const w = Math.ceil(window.innerWidth / PIXEL_SCALE);
    for(let i=0; i<6; i++) {
        fishes.push({
            x: Math.random() * w,
            y: 20 + Math.random() * (window.innerHeight/PIXEL_SCALE - 60),
            speed: 0.3 + Math.random() * 0.4,
            type: Math.random() > 0.5 ? 'red' : 'green'
        });
    }

    // Bloopers (Lulas)
    const bloopers: { x: number; y: number; startY: number; timer: number }[] = [];
    for(let i=0; i<3; i++) {
        bloopers.push({
            x: Math.random() * w,
            y: 0, // Calculado no loop
            startY: 20 + Math.random() * (window.innerHeight/PIXEL_SCALE - 80),
            timer: Math.random() * 100
        });
    }

    // Bolhas
    const bubbles: { x: number; y: number; speed: number }[] = [];
    for(let i=0; i<15; i++) {
        bubbles.push({
            x: Math.random() * w,
            y: Math.random() * (window.innerHeight/PIXEL_SCALE),
            speed: 0.1 + Math.random() * 0.3
        });
    }

    // --- FUNÇÕES DE DESENHO ---

    const drawPixelRect = (x: number, y: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    const drawSprite = (sprite: string[], offsetX: number, offsetY: number, color: string, scale: number = 1, flip: boolean = false) => {
        for(let y = 0; y < sprite.length; y++) {
            const row = sprite[y];
            for(let x = 0; x < row.length; x++) {
                const drawX = flip ? (row.length - 1 - x) : x;
                const char = row[x];
                if (char === '1') {
                    ctx.fillStyle = color;
                    ctx.fillRect(Math.floor(offsetX + drawX * scale), Math.floor(offsetY + y * scale), scale, scale);
                }
            }
        }
        
        // Detalhes manuais (Olhos)
        if (sprite === fishSprite) {
             const eyeX = flip ? 3 : 6; 
             // Branco do olho
             drawPixelRect(offsetX + eyeX*scale, offsetY + 4*scale, 2*scale, 2*scale, C.white);
             // Pupila
             drawPixelRect(offsetX + (eyeX+1)*scale, offsetY + 4*scale, 1*scale, 2*scale, C.black); 
             // Asa (detalhe branco)
             const wingX = flip ? 8 : 4;
             drawPixelRect(offsetX + wingX*scale, offsetY + 10*scale, 3*scale, 1*scale, C.white);
        }
        
        if (sprite === blooperSprite) {
            // Olhos pretos
            drawPixelRect(offsetX + 2*scale, offsetY + 5*scale, 2*scale, 2*scale, C.black);
            drawPixelRect(offsetX + 8*scale, offsetY + 5*scale, 2*scale, 2*scale, C.black);
        }
    };

    // Coral / Tubo Vegetal
    const drawCoral = (x: number, y: number, height: number) => {
        // Corpo
        drawPixelRect(x, y - height, 12, height, C.green);
        // Highlight
        drawPixelRect(x + 2, y - height, 2, height, C.greenLight);
        drawPixelRect(x + 6, y - height, 2, height, C.greenLight);
        // Sombra Borda
        drawPixelRect(x + 10, y - height, 2, height, C.black);
        drawPixelRect(x, y - height, 2, height, C.black); // Borda esq opcional
        
        // Topo (Cabeça do Coral)
        drawPixelRect(x - 2, y - height, 16, 4, C.green);
        drawPixelRect(x, y - height + 1, 12, 1, C.greenLight);
    };

    const drawFloor = (w: number, h: number) => {
        // Areia Base
        drawPixelRect(0, h - 20, w, 20, C.sand);
        
        // Textura superior (linha mais escura)
        drawPixelRect(0, h - 20, w, 2, C.sandDark);
        
        // Pedras/Detalhes na areia
        for(let x=0; x<w; x+=32) {
            if (x % 64 === 0) {
                drawPixelRect(x + 10, h - 12, 4, 4, C.sandDark);
            } else {
                drawPixelRect(x + 5, h - 8, 2, 2, C.sandDark);
            }
        }
    };

    let time = 0;

    const animate = () => {
        time++;
        const w = canvas.width;
        const h = canvas.height;

        // 1. Fundo Sólido Azul
        ctx.fillStyle = C.water;
        ctx.fillRect(0, 0, w, h);

        // 2. Chão
        drawFloor(w, h);

        // 3. Corais (Camada de Fundo)
        drawCoral(40, h - 20, 30);
        drawCoral(w - 60, h - 20, 50);
        drawCoral(w * 0.4, h - 20, 20);

        // 4. Peixes (Cheep Cheep)
        fishes.forEach(fish => {
            fish.x -= fish.speed;
            if(fish.x < -20) fish.x = w + 20;
            
            // Movimento simples "nadando" (senóide suave)
            const swimY = Math.sin(time * 0.1 + fish.x * 0.1) * 2;
            
            drawSprite(
                fishSprite, 
                fish.x, 
                fish.y + swimY, 
                fish.type === 'red' ? C.fishRed : C.greenLight, 
                1, 
                false // false = facing left (padrão do movimento x-)
            ); 
        });

        // 5. Bloopers (Movimento vertical "bloop")
        bloopers.forEach(b => {
            b.timer++;
            // Ciclo de nado da lula: Impulso rápido pra cima, queda lenta
            const cycle = b.timer % 90;
            let dy = 0;
            
            if (cycle < 20) {
                // Impulso (sobe)
                dy = - (cycle * 0.8); 
            } else {
                // Flutua/Cai (desce devagar)
                dy = -16 + (cycle - 20) * 0.3;
            }
            
            drawSprite(blooperSprite, b.x, b.startY + dy, C.blooper, 1, false);
        });

        // 6. Bolhas (Quadrados simples subindo)
        bubbles.forEach(b => {
            b.y -= b.speed;
            if(b.y < -5) {
                b.y = h;
                b.x = Math.random() * w;
            }
            
            // Oscilação lateral
            const bx = b.x + Math.sin(time * 0.05 + b.y * 0.1) * 2;
            
            // Desenhar bolha (quadrado branco vazado ou sólido pequeno)
            ctx.fillStyle = C.white;
            ctx.fillRect(Math.floor(bx), Math.floor(b.y), 2, 2);
        });

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
          backgroundColor: '#2038EC' // Fallback color
      }}
    />
  );
}