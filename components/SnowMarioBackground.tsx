import React, { useEffect, useRef } from 'react';

// PALETA DE CORES REFINADA
const C = {
  // Céu
  skyTop: '#4068D0',      
  skyBottom: '#90C0F0',   
  
  // Corpos Celestes
  sunInner: '#FFFFE0',
  sunOuter: '#FFFF80',
  moon: '#F0F0F0',

  // Nuvens
  cloudWhite: '#FFFFFF',
  cloudShadow: '#A0C0E0', 

  // Montanha Central (Hero)
  mtnSnowSun: '#FFFFFF',
  mtnSnowShade: '#80A8D0',  
  mtnRockSun: '#7090B0',    
  mtnRockShade: '#405070',  

  // Montanhas Fundo
  bgMtn: '#6080B0',
  bgMtnSnow: '#A0C8F0',

  // Floresta
  treeBack: '#2A4050',      // Azul acinzentado escuro
  treeFront: '#0F1A20',     // Quase preto, levemente azulado
  treeHighlight: '#1E3038', // Highlight sutil

  // Chão
  grassLight: '#80C030',    
  grassDark: '#307010',     
  dirt: '#403020',          
  dirtDither: '#302010'     
};

export default function SnowMarioBackground({ autoTimeMode }: { autoTimeMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // PIXEL_SIZE 3 mantém o visual crocante
    const PIXEL_SIZE = 3;

    const draw = () => {
        const w = Math.ceil(window.innerWidth / PIXEL_SIZE);
        const h = Math.ceil(window.innerHeight / PIXEL_SIZE);
        
        canvas.width = w;
        canvas.height = h;

        // Horário Simulado
        const now = new Date();
        const hours = autoTimeMode ? now.getHours() + now.getMinutes()/60 : 12;
        const isNight = hours < 6 || hours > 18;

        // --- 1. CÉU ---
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        if (isNight) {
            gradient.addColorStop(0, '#050510');
            gradient.addColorStop(1, '#202040');
        } else {
            gradient.addColorStop(0, C.skyTop);
            gradient.addColorStop(1, C.skyBottom);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // --- 1.5 CORPO CELESTE ---
        const drawCelestial = () => {
            const cx = w * 0.85;
            const cy = h * 0.15;
            if (isNight) {
                const r = 12;
                ctx.fillStyle = C.moon;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = gradient; 
                ctx.beginPath(); ctx.arc(cx - 6, cy - 2, r, 0, Math.PI * 2); ctx.fill();
            } else {
                const r = 14;
                ctx.fillStyle = C.sunOuter;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = C.sunInner;
                ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI*2); ctx.fill();
            }
        };
        drawCelestial();

        // --- NOISE ---
        const noise = (x: number) => Math.sin(x * 12.9898) * 43758.5453 - Math.floor(Math.sin(x * 12.9898) * 43758.5453);
        const smoothNoise = (x: number) => {
            const i = Math.floor(x);
            const f = x - i;
            const t = f * f * (3 - 2 * f);
            return noise(i) * (1 - t) + noise(i + 1) * t;
        };

        // --- 2. NUVENS ---
        const drawCloudBlob = (cx: number, cy: number, w: number, h: number) => {
            ctx.globalAlpha = isNight ? 0.6 : 1.0;
            ctx.fillStyle = C.cloudWhite;
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx - w*0.4, cy - h*0.2, w*0.6, h*0.8, 0, 0, Math.PI*2);
            ctx.ellipse(cx + w*0.3, cy - h*0.3, w*0.5, h*0.7, 0, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = isNight ? '#102030' : C.cloudShadow;
            const shadowH = h * 0.3;
            for(let x = cx - w; x < cx + w; x++) {
                if (Math.pow((x-cx)/w, 2) + Math.pow((cy + h*0.5 - cy)/h, 2) <= 1) {
                     ctx.fillRect(x, cy + h - shadowH * 1.5, 1, shadowH);
                }
            }
            ctx.globalAlpha = 1.0;
        };
        drawCloudBlob(w * 0.30, h * 0.12, 38, 14); 
        drawCloudBlob(w * 0.75, h * 0.20, 25, 10);  
        drawCloudBlob(w * 0.05, h * 0.25, 15, 6);

        // --- 3. MONTANHAS FUNDO ---
        const drawBackMtn = () => {
            const base = h * 0.70;
            ctx.fillStyle = isNight ? '#203050' : C.bgMtn;
            for(let x=0; x<w; x++) {
                let y = h;
                if(x < w*0.45) {
                    const peak = Math.max(0, Math.sin(x*0.025)*60);
                    y = base - peak + smoothNoise(x*0.15)*8;
                } else if(x > w*0.65) {
                    const peak = Math.max(0, Math.sin((x-w*0.3)*0.03)*70);
                    y = base - peak + smoothNoise(x*0.15)*8 + 15;
                }
                if(y < h) {
                    ctx.fillRect(x, y, 1, h-y);
                    const snowLimit = base - 30;
                    if(y < snowLimit) {
                        ctx.fillStyle = isNight ? '#506080' : C.bgMtnSnow;
                        const dither = (x % 2 === 0) ? 2 : 0;
                        ctx.fillRect(x, y, 1, (snowLimit - y) * 0.8 + dither);
                        ctx.fillStyle = isNight ? '#203050' : C.bgMtn;
                    }
                }
            }
        };
        drawBackMtn();

        // --- 4. MONTANHA HEROICA ---
        const drawHeroMtn = () => {
            const cx = w * 0.52;
            const cy = h * 0.80;
            const height = h * 0.65; 
            const width = w * 0.42;

            for(let x = 0; x < w; x++) {
                const dx = (x - cx) / width;
                if(Math.abs(dx) > 1.1) continue;
                const shape = dx < 0 ? Math.pow(1+dx, 1.4) : Math.pow(1-dx, 2.0);
                const jagged = smoothNoise(x*0.3)*3 + smoothNoise(x*0.05)*12;
                const yMtn = cy - (shape * height) + jagged;

                if(yMtn < h) {
                    const yRel = (yMtn - (cy - height)) / height;
                    const ridgeOffset = -(yRel * yRel * width * 0.45); 
                    const ridgeX = cx + ridgeOffset + (smoothNoise(yMtn*0.25)*8);
                    const isSun = x > ridgeX;
                    const snowNoise = smoothNoise(x*0.12) * 25;
                    const snowThreshold = yMtn + 20 + snowNoise + (dx < 0 ? 40 : 10) * Math.abs(dx);

                    for(let y = Math.floor(yMtn); y < h; y++) {
                        let color;
                        const dither = (x + y) % 2 === 0;
                        if(y < snowThreshold) {
                            if (isSun) color = isNight ? '#E0E0E0' : C.mtnSnowSun;
                            else {
                                color = isNight ? '#506080' : C.mtnSnowShade;
                                if (x > ridgeX - 4 && dither) color = isNight ? '#E0E0E0' : C.mtnSnowSun;
                            }
                        } else {
                            if (isSun) {
                                color = isNight ? '#405060' : C.mtnRockSun;
                                if (noise(x*y*0.2) > 0.6) color = isNight ? '#304050' : C.mtnRockShade;
                            } else {
                                color = isNight ? '#203040' : C.mtnRockShade;
                                if (dither && noise(x*y*0.5) > 0.3) color = isNight ? '#152535' : '#384860'; 
                            }
                        }
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        };
        drawHeroMtn();

        // --- 5. FLORESTA DETALHADA (SEM NEVE NOS GALHOS) ---
        const drawPine = (px: number, py: number, h: number, color: string, highlight?: string) => {
            // Tronco Escuro (Base)
            ctx.fillStyle = '#080c10'; 
            ctx.fillRect(px, py - h, 1, h);

            // Definição de Camadas (Tiers)
            // Árvores maiores têm mais camadas e são mais largas
            const tiers = Math.max(3, Math.floor(h / 7));
            const tierHeight = h / tiers;
            const maxSpread = h * 0.35; // Largura máxima na base

            for (let i = 0; i < tiers; i++) {
                // Progresso: 0 (topo) -> 1 (base)
                const progress = i / tiers;
                
                // Largura desta camada específica
                // Camadas de baixo são mais largas
                const tierWidth = 1 + (progress * maxSpread);
                
                // Posições verticais
                const tierTopY = (py - h) + (i * tierHeight * 0.85); // 0.85 faz sobreposição
                const tierBottomY = tierTopY + tierHeight * 1.4;

                // Desenhar a camada (Tier)
                for (let y = Math.floor(tierTopY); y < tierBottomY; y++) {
                    // Progresso dentro da camada (0 -> 1)
                    const tierProgress = (y - tierTopY) / (tierBottomY - tierTopY);
                    
                    // Largura atual neste pixel Y (forma cônica)
                    let currentW = Math.max(0, Math.floor(tierProgress * tierWidth));
                    
                    // Adicionar irregularidade nas bordas (Noise)
                    const jag = (noise(px + y*2) > 0.4 ? 1 : 0);
                    currentW = Math.max(0, currentW - jag);

                    if (currentW === 0 && y > tierTopY + 2) continue;

                    // 1. Cor Base (Foliage)
                    ctx.fillStyle = color;
                    ctx.fillRect(px - currentW, y, currentW * 2 + 1, 1);

                    // 2. Textura Interna (Sombra/Volume)
                    // Padrão xadrez para dar textura de folhas
                    if ((px + y) % 2 === 0 && currentW > 1) {
                        ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Escurecer levemente
                        ctx.fillRect(px - currentW + 1, y, currentW * 2 - 1, 1);
                    }

                    // 3. Highlight Lateral (Sol)
                    if (highlight && !isNight && currentW > 1) {
                        ctx.fillStyle = highlight;
                        // Linha fina no lado direito
                        ctx.fillRect(px + 1, y, 1, 1);
                    }
                }
            }
        };

        const drawForest = () => {
            const base = h * 0.88; 
            
            // Camada Fundo (Azulada e densa)
            const countBack = Math.floor(w / 3);
            for(let i=0; i<countBack; i++) {
                const x = (i*3) + noise(i)*10;
                const th = 20 + Math.abs(noise(i*12))*25; // 20-45px
                // Árvores do fundo têm menos detalhe (sem highlight)
                drawPine(x, base - 6, th, isNight ? '#1A2A35' : C.treeBack);
            }

            // Camada Frente (Escura, alta e detalhada)
            const countFront = Math.floor(w / 6); // Menos árvores na frente para ver as de trás
            for(let i=0; i<countFront; i++) {
                const x = (i*6) + noise(i+50)*15;
                const th = 40 + Math.abs(noise(i*4))*40; // 40-80px (Grandes!)
                
                drawPine(
                    x, 
                    base, 
                    th, 
                    isNight ? '#05080A' : C.treeFront, 
                    C.treeHighlight
                );
            }
        };
        drawForest();

        // --- 6. CHÃO (PADRÃO ZIG-ZAG) ---
        const drawGround = () => {
            const startY = h * 0.88;
            
            ctx.fillStyle = isNight ? '#201810' : C.dirt;
            ctx.fillRect(0, startY, w, h-startY);
            
            ctx.fillStyle = isNight ? '#151008' : C.dirtDither;
            for(let y=Math.floor(startY); y<h; y+=2) {
                for(let x=(y%4); x<w; x+=4) ctx.fillRect(x,y,1,1);
            }

            const grassColorLight = isNight ? '#406020' : C.grassLight;
            const grassColorDark = isNight ? '#183808' : C.grassDark;
            
            for(let x=0; x<w; x++) {
                const wave = Math.floor(Math.sin(x*0.04)*2);
                const gy = startY - 2 + wave;

                const pat = x % 4;
                let offset = 0;
                if(pat === 0) offset = 2;
                if(pat === 1) offset = 1;
                if(pat === 2) offset = 0;
                if(pat === 3) offset = 1;

                const top = gy + offset;

                ctx.fillStyle = grassColorLight;
                ctx.fillRect(x, top, 1, 2); 

                ctx.fillStyle = grassColorDark;
                ctx.fillRect(x, top + 2, 1, (startY - top) + 4);
            }
        };
        drawGround();
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [autoTimeMode]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
          width: '100vw', 
          height: '100vh', 
          imageRendering: 'pixelated',
          display: 'block' 
      }} 
    />
  );
}
