import React, { useEffect, useRef } from 'react';

export default function MinimalistBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Função de redimensionamento
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Objetos flutuantes (geométricos simples)
    const shapes: {x: number, y: number, size: number, speedX: number, speedY: number, type: number}[] = [];
    for(let i=0; i<12; i++) {
        shapes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20 + Math.random() * 40,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            type: Math.floor(Math.random() * 3)
        });
    }

    let time = 0;

    const drawGrid = () => {
        ctx.strokeStyle = '#333'; 
        ctx.lineWidth = 1;
        const gridSize = 50;
        
        // Grid Movement effect (Vaporwave style but minimal)
        const offsetY = (time * 0.5) % gridSize;

        // Grade Vertical
        for(let x=0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Grade Horizontal (Moving down)
        for(let y=offsetY; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    };

    const drawShapes = () => {
        ctx.strokeStyle = '#FFFFFF'; // White outlines
        ctx.fillStyle = '#000000';   // Black fills
        ctx.lineWidth = 2;

        shapes.forEach(shape => {
            shape.x += shape.speedX;
            shape.y += shape.speedY;

            if(shape.x < 0 || shape.x > canvas.width) shape.speedX *= -1;
            if(shape.y < 0 || shape.y > canvas.height) shape.speedY *= -1;

            ctx.beginPath();
            if (shape.type === 0) { // Square
                ctx.rect(shape.x, shape.y, shape.size, shape.size);
            } else if (shape.type === 1) { // Circle
                ctx.arc(shape.x, shape.y, shape.size/2, 0, Math.PI*2);
            } else { // Triangle
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x + shape.size, shape.y + shape.size);
                ctx.lineTo(shape.x - shape.size, shape.y + shape.size);
                ctx.closePath();
            }
            ctx.fill();
            ctx.stroke();
        });
    };

    const drawScanlines = () => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 2);
        }
    };

    let animationId: number;
    const animate = () => {
        time++;
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        drawShapes();
        drawScanlines();

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