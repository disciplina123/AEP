import React, { useEffect, useRef } from 'react';

export default function CustomTerrainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Tamanho do pixel
    const PIXEL_SIZE = 4;

    // Altura onde começa o terreno (aumentado para cobrir mais área)
    const GROUND_Y = canvas.height - 150; // Aumentado de 70 para 150

    // Número de camadas de terra (do preto até o marrom claro)
    const DIRT_LAYERS = Math.floor((canvas.height - GROUND_Y) / PIXEL_SIZE);

    // Paleta de degradê da terra - do preto ao marrom claro
    const dirtGradient = [
      '#000000', // Preto
      '#0a0604',
      '#140c08',
      '#1e120c',
      '#281810',
      '#321e14',
      '#3c2418',
      '#462a1c',
      '#503020',
      '#5a3624',
      '#643c28',
      '#6e422c',
      '#784830',
      '#824e34',
      '#8c5438',
      '#965a3c',
      '#a06040',
      '#aa6644', // Marrom claro predominante
      '#b46c48',
      '#be724c',
    ];

    // Cores da grama - DEGRADÊ MAIS ESCURO
    const GRASS_LIGHT = '#50d050';    // Verde claro (topo com contorno preto)
    const GRASS_MID_LIGHT = '#30b030'; // Verde intermediário claro
    const GRASS_MID_DARK = '#208020';  // Verde intermediário escuro
    const GRASS_DARK = '#104010';      // Verde muito escuro (base)
    const BLACK = '#000000';           // Preto para contornos

    // Calcular número de colunas
    const numColumns = Math.ceil(canvas.width / PIXEL_SIZE);

    // Helper para desenhar pixel
    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    };

    // Função para pegar cor do degradê com variação
    const getDirtColor = (layer: number, totalLayers: number): string => {
      // INVERTIDO: layer 0 = topo (marrom claro), layer final = fundo (preto)
      // Calcular índice base no degradê (invertido)
      const progress = 1 - (layer / totalLayers); // Invertido
      const baseIndex = Math.floor(progress * (dirtGradient.length - 1));
      
      // Adicionar variação aleatória
      let colorIndex = baseIndex;
      
      // Chance de ter pixels de outras cores
      const rand = Math.random();
      
      if (layer < totalLayers * 0.3) {
        // Camadas SUPERIORES (predomina marrom claro, mas pode ter escuro)
        if (rand < 0.75) {
          // 75% mantém tons claros
          colorIndex = Math.min(dirtGradient.length - 1, baseIndex + Math.floor(Math.random() * 3 - 1));
        } else {
          // 25% pode ter pixels mais escuros
          colorIndex = Math.max(0, baseIndex - Math.floor(Math.random() * 5));
        }
      } else if (layer > totalLayers * 0.7) {
        // Camadas PROFUNDAS (predomina preto, mas pode ter marrom)
        if (rand < 0.85) {
          // 85% mantém tons escuros
          colorIndex = Math.max(0, baseIndex + Math.floor(Math.random() * 3 - 1));
        } else {
          // 15% pode ter pixels mais claros
          colorIndex = Math.min(dirtGradient.length - 1, baseIndex + Math.floor(Math.random() * 5));
        }
      } else {
        // Camadas médias (transição)
        colorIndex = baseIndex + Math.floor(Math.random() * 5 - 2);
      }
      
      // Garantir que o índice está dentro dos limites
      colorIndex = Math.max(0, Math.min(dirtGradient.length - 1, colorIndex));
      
      return dirtGradient[colorIndex];
    };

    // Configuração da grama em camadas horizontais uniformes
    const GRASS_HEIGHT = 4 * PIXEL_SIZE; // 4 camadas de altura (última tem variação)
    
    // Gerar padrão de variação de altura (estilo Terraria)
    // Padrão que se repete a cada 8 pixels com variação suave
    const heightPattern = [0, 0, 1, 1, 1, 0, 0, -1]; // Variação de -1, 0, +1 pixel
    const grassHeightMap: number[] = [];
    
    for (let i = 0; i < numColumns; i++) {
      const patternIndex = i % heightPattern.length;
      grassHeightMap.push(heightPattern[patternIndex]);
    }

    // Função principal de desenho
    const render = () => {
      // Limpar canvas com cor de céu (azul claro similar ao Mario)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#5090FF');
      gradient.addColorStop(1, '#90C0FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenhar camadas de terra com degradê - começando após as camadas de integração
      for (let layer = 0; layer < DIRT_LAYERS; layer++) {
        for (let col = 0; col < numColumns; col++) {
          const x = col * PIXEL_SIZE;
          const heightOffset = grassHeightMap[col];
          
          // Terra começa 2 pixels após o GROUND_Y (após as camadas de integração)
          const y = GROUND_Y + heightOffset * PIXEL_SIZE + 2 * PIXEL_SIZE + layer * PIXEL_SIZE;
          
          // Só desenhar se estiver dentro do canvas
          if (y < canvas.height) {
            const color = getDirtColor(layer, DIRT_LAYERS);
            drawPixel(x, y, color);
          }
        }
      }
      
      // Preencher qualquer espaço restante até o final da tela com a cor mais escura
      const maxDirtY = GROUND_Y + Math.max(...grassHeightMap) * PIXEL_SIZE + 2 * PIXEL_SIZE + DIRT_LAYERS * PIXEL_SIZE;
      if (maxDirtY < canvas.height) {
        ctx.fillStyle = dirtGradient[0]; // Preto
        ctx.fillRect(0, maxDirtY, canvas.width, canvas.height - maxDirtY);
      }

      // Desenhar grama em camadas horizontais com variação de altura (estilo Terraria)
      // Cada coluna pode ter altura diferente
      
      for (let col = 0; col < numColumns; col++) {
        const x = col * PIXEL_SIZE;
        const heightOffset = grassHeightMap[col];
        
        // Calcular Y base para esta coluna (com variação)
        const columnBaseY = GROUND_Y + heightOffset * PIXEL_SIZE;
        
        // LINHA PRETA (Contorno) - acima da camada clara
        drawPixel(x, columnBaseY - 5 * PIXEL_SIZE, BLACK);
        
        // CAMADA 4 (Topo) - Verde mais claro
        drawPixel(x, columnBaseY - 4 * PIXEL_SIZE, GRASS_LIGHT);
        
        // CAMADA 3 - Verde intermediário claro
        drawPixel(x, columnBaseY - 3 * PIXEL_SIZE, GRASS_MID_LIGHT);
        
        // CAMADA 2 - Verde intermediário escuro
        drawPixel(x, columnBaseY - 2 * PIXEL_SIZE, GRASS_MID_DARK);
        
        // CAMADA 1 (Base com variação) - Verde escuro
        // Esta camada só aparece quando heightOffset >= 0
        // Isso cria a variação natural, evitando pixels isolados
        if (heightOffset >= 0) {
          drawPixel(x, columnBaseY - PIXEL_SIZE, GRASS_DARK);
        }
        
        // INTEGRAÇÃO COM A TERRA: Misturar verde escuro com marrom nas primeiras camadas da terra
        // Camada 0 (onde começa a terra) - Mix verde escuro + marrom claro
        const mixColor1 = '#4a3a1a'; // Verde escuro + marrom
        drawPixel(x, columnBaseY, mixColor1);
        
        // Camada 1 da terra - Mix verde + marrom (mais marrom)
        const mixColor2 = '#5a4424'; // Mais marrom
        drawPixel(x, columnBaseY + PIXEL_SIZE, mixColor2);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
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