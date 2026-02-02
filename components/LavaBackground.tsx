import React, { useEffect, useRef } from 'react';

export default function LavaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redimensionamento
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Partículas de brasa
    const embers: {x: number, y: number, size: number, speedY: number, opacity: number}[] = [];
    const MAX_EMBERS = 80;

    for (let i = 0; i < MAX_EMBERS; i++) {
        embers.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 4 + 2,
            speedY: Math.random() * 1.5 + 0.5,
            opacity: Math.random()
        });
    }

    // Bolhas de lava
    const bubbles: {x: number, y: number, r: number, speed: number, offset: number}[] = [];
    for(let i=0; i<10; i++) {
        bubbles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 50,
            r: Math.random() * 15 + 5,
            speed: Math.random() * 0.5 + 0.2,
            offset: Math.random() * 100
        });
    }

    // Correntes penduradas
    const chains: {x: number, length: number}[] = [];
    const numChains = Math.floor(canvas.width / 200) + 1;
    for(let i=0; i<numChains; i++) {
        chains.push({
            x: 50 + i * 200 + Math.random() * 100,
            length: 100 + Math.random() * 200
        });
    }

    // Camadas de Lava (ondas)
    let time = 0;

    const drawLavaWaves = () => {
       const lavaBaseHeight = canvas.height * 0.85;
       const amplitude = 15;
       const frequency = 0.008;

       // Lava de fundo (escura)
       ctx.fillStyle = '#800000';
       ctx.beginPath();
       ctx.moveTo(0, canvas.height);
       for(let x=0; x<=canvas.width; x+=20) {
           const y = lavaBaseHeight + Math.sin(x * frequency + time * 0.03) * amplitude;
           ctx.lineTo(x, y);
       }
       ctx.lineTo(canvas.width, canvas.height);
       ctx.lineTo(0, canvas.height);
       ctx.fill();

       // Camada intermediária
       ctx.fillStyle = '#CC2200';
       ctx.beginPath();
       ctx.moveTo(0, canvas.height);
       for(let x=0; x<=canvas.width; x+=20) {
           const y = lavaBaseHeight + 20 + Math.sin(x * frequency + time * 0.05 + 2) * amplitude;
           ctx.lineTo(x, y);
       }
       ctx.lineTo(canvas.width, canvas.height);
       ctx.lineTo(0, canvas.height);
       ctx.fill();

       // Lava de frente (brilhante)
       ctx.fillStyle = '#FF4500';
       ctx.beginPath();
       ctx.moveTo(0, canvas.height);
       for(let x=0; x<=canvas.width; x+=20) {
           const y = lavaBaseHeight + 40 + Math.sin(x * frequency * 1.5 + time * 0.07 + 4) * (amplitude * 0.8);
           ctx.lineTo(x, y);
       }
       ctx.lineTo(canvas.width, canvas.height);
       ctx.lineTo(0, canvas.height);
       ctx.fill();

       // Desenhar bolhas na lava
       bubbles.forEach(b => {
           b.y -= b.speed;
           if(b.y < lavaBaseHeight + 20) {
               b.y = canvas.height + 20;
               b.x = Math.random() * canvas.width;
           }
           const bubbleY = b.y + Math.sin(time * 0.1 + b.offset) * 5;
           
           ctx.fillStyle = '#FFA500'; // Orange center
           ctx.beginPath();
           ctx.arc(b.x, bubbleY, b.r, 0, Math.PI*2);
           ctx.fill();
           
           ctx.strokeStyle = '#8B0000';
           ctx.lineWidth = 2;
           ctx.beginPath();
           ctx.arc(b.x, bubbleY, b.r, 0, Math.PI*2);
           ctx.stroke();
       });
    };

    const drawBridge = () => {
        const bridgeY = canvas.height * 0.6;
        const bridgeHeight = 20;
        
        ctx.fillStyle = '#301010'; // Dark wood/brick
        
        // Desenhar segmentos da ponte
        const segmentWidth = 40;
        const numSegments = Math.ceil(canvas.width / segmentWidth);
        
        for(let i=0; i<numSegments; i++) {
            const x = i * segmentWidth;
            // Bridge slightly curves or is straight
            ctx.fillRect(x, bridgeY, segmentWidth - 2, bridgeHeight);
            
            // Rivets
            ctx.fillStyle = '#502020';
            ctx.fillRect(x + 5, bridgeY + 5, 5, 5);
            ctx.fillRect(x + segmentWidth - 12, bridgeY + 5, 5, 5);
            ctx.fillStyle = '#301010';
        }
    };

    const drawEmbers = () => {
        embers.forEach(ember => {
            ember.y -= ember.speedY;
            ember.x += Math.sin(time * 0.02 + ember.y * 0.01) * 0.5;

            if (ember.y < -10) {
                ember.y = canvas.height + 10;
                ember.x = Math.random() * canvas.width;
                ember.opacity = 1;
            }

            if (ember.y < canvas.height * 0.4) {
                ember.opacity -= 0.01;
            }
            if (ember.opacity < 0) ember.opacity = 0;

            ctx.fillStyle = `rgba(255, 200, 0, ${ember.opacity})`;
            ctx.fillRect(ember.x, ember.y, ember.size, ember.size);
            
            ctx.strokeStyle = `rgba(255, 0, 0, ${ember.opacity * 0.8})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(ember.x, ember.y, ember.size, ember.size);
        });
    };

    const drawBackground = () => {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#100000'); 
        gradient.addColorStop(0.6, '#300000'); 
        gradient.addColorStop(1, '#600000'); 
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawChains = () => {
        ctx.fillStyle = '#222'; // Chain dark color
        chains.forEach(chain => {
            const linkSize = 12;
            const numLinks = Math.floor(chain.length / linkSize);
            for(let i=0; i<numLinks; i++) {
                const y = i * linkSize * 0.8;
                // Swing effect
                const swing = Math.sin(time * 0.01 + chain.x) * (i * 0.5);
                
                // Draw Oval Link
                ctx.beginPath();
                ctx.ellipse(chain.x + swing, y, 6, 10, 0, 0, Math.PI*2);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#111';
                ctx.stroke();
                
                // Highlight
                ctx.beginPath();
                ctx.arc(chain.x + swing - 2, y - 4, 1, 0, Math.PI*2);
                ctx.fillStyle = '#555';
                ctx.fill();
            }
        });
    };

    const drawCastleColumns = () => {
        // Colunas ao fundo
        const colWidth = 120;
        
        const drawColumn = (x: number) => {
            ctx.fillStyle = '#1a0505'; 
            ctx.fillRect(x, 0, colWidth, canvas.height);
            
            // Stone Blocks Texture
            ctx.fillStyle = '#2a0a0a';
            const brickH = 40;
            for(let y=0; y<canvas.height; y+=brickH) {
                // Offset even rows
                const offset = (y/brickH) % 2 === 0 ? 0 : 20;
                ctx.fillRect(x + 5 + offset, y + 2, colWidth - 30, brickH - 4);
                
                // Highlight top
                ctx.fillStyle = '#3a1a1a';
                ctx.fillRect(x + 5 + offset, y + 2, colWidth - 30, 2);
                ctx.fillStyle = '#2a0a0a';
            }
        };

        drawColumn(0);
        drawColumn(canvas.width - colWidth);
    };

    let animationId: number;
    const animate = () => {
        time++;
        drawBackground();
        drawChains();
        drawCastleColumns(); 
        drawBridge();
        drawLavaWaves();
        drawEmbers();
        animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}