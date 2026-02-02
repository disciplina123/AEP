import React, { useEffect, useRef, useState } from 'react';

// Função para interpolar entre duas cores
function lerpColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Função para obter cores interpoladas baseadas no horário
function getColorsByTime(hour: number, minute: number) {
  // Converter para minutos totais desde meia-noite
  const totalMinutes = hour * 60 + minute;
  
  // Definir pontos-chave do dia (em minutos)
  // AJUSTADO: Ciclo movido mais cedo para garantir que 19:00 já seja noite/anoitecer
  const earlyMorning = 4 * 60;        // 4:00
  const dawn = 5 * 60 + 30;           // 5:30
  const sunrise = 6 * 60 + 30;        // 6:30
  const midMorning = 9 * 60;          // 9:00
  const noon = 12 * 60;               // 12:00
  const afternoon = 15 * 60;          // 15:00
  const lateAfternoon = 16 * 60 + 30; // 16:30 (Começa a alaranjar levemente)
  const sunset = 17 * 60 + 45;        // 17:45 (Pôr do sol - Laranja forte)
  const dusk = 18 * 60 + 30;          // 18:30 (Crepúsculo - Roxo/Azul escuro)
  const evening = 19 * 60 + 15;       // 19:15 (Noite inicial - Bem escuro)
  const night = 20 * 60;              // 20:00 (Noite profunda)
  
  // Paletas base originais (Balanced/Classic)
  const palettes = {
    deepNight: {
      sky: '#050520',
      skyGradient: '#101035',
      cloud: '#303050',
      cloudShadow: '#202040',
      ground: '#3E2412',
      groundDark: '#221100',
      groundLight: '#5A3520',
      bush: '#052205',
      bushDark: '#001100',
      bushHighlight: '#0A330A',
      bushOutline: '#000000',
      pipeLight: '#1A4005',
      pipeMid: '#0F2A02',
      pipeDark: '#051100',
      pipeOutline: '#000000'
    },
    earlyMorning: {
      sky: '#1A1A50',
      skyGradient: '#2A2A70',
      cloud: '#404060',
      cloudShadow: '#303050',
      ground: '#4E2D16',
      groundDark: '#301808',
      groundLight: '#6B3E22',
      bush: '#0A330A',
      bushDark: '#052205',
      bushHighlight: '#144414',
      bushOutline: '#001100',
      pipeLight: '#26550A',
      pipeMid: '#183805',
      pipeDark: '#0C1C02',
      pipeOutline: '#051100'
    },
    dawn: {
      sky: '#503570',
      skyGradient: '#705090',
      cloud: '#9080B0',
      cloudShadow: '#605080',
      ground: '#6E4020',
      groundDark: '#4A2810',
      groundLight: '#8E5530',
      bush: '#104410',
      bushDark: '#083308',
      bushHighlight: '#206620',
      bushOutline: '#051A05',
      pipeLight: '#386610',
      pipeMid: '#264408',
      pipeDark: '#142204',
      pipeOutline: '#0A1A05'
    },
    sunrise: {
      sky: '#FF8844',
      skyGradient: '#FFBB66',
      cloud: '#FFDDAA',
      cloudShadow: '#DDAA88',
      ground: '#B06030',
      groundDark: '#703818',
      groundLight: '#D08040',
      bush: '#308820',
      bushDark: '#185510',
      bushHighlight: '#50AA40',
      bushOutline: '#103308',
      pipeLight: '#60A020',
      pipeMid: '#407010',
      pipeDark: '#203808',
      pipeOutline: '#102005'
    },
    midMorning: {
      sky: '#5090FF',
      skyGradient: '#90C0FF',
      cloud: '#FFFFFF',
      cloudShadow: '#D0E0FF',
      ground: '#E09040', 
      groundDark: '#905020',
      groundLight: '#FFB060',
      bush: '#20B020', 
      bushDark: '#007000',
      bushHighlight: '#60E060',
      bushOutline: '#004000',
      pipeLight: '#70C018',
      pipeMid: '#009800',
      pipeDark: '#005800',
      pipeOutline: '#002800'
    },
    noon: {
      sky: '#4080FF', // Classic Mario Sky Blue
      skyGradient: '#80B0FF',
      cloud: '#FFFFFF',
      cloudShadow: '#C0D8FF',
      ground: '#E8A050', // Classic Peach/Orange
      groundDark: '#A06020',
      groundLight: '#FFC070',
      bush: '#20B020', // Classic Green
      bushDark: '#008010',
      bushHighlight: '#70F070',
      bushOutline: '#005005',
      pipeLight: '#80D010',
      pipeMid: '#00A800',
      pipeDark: '#006000',
      pipeOutline: '#003000'
    },
    afternoon: {
      sky: '#5090FF',
      skyGradient: '#90C0FF',
      cloud: '#FFFFFF',
      cloudShadow: '#D0E0FF',
      ground: '#E09040',
      groundDark: '#905020',
      groundLight: '#FFB060',
      bush: '#20B020',
      bushDark: '#007000',
      bushHighlight: '#60E060',
      bushOutline: '#004000',
      pipeLight: '#70C018',
      pipeMid: '#009800',
      pipeDark: '#005800',
      pipeOutline: '#002800'
    },
    lateAfternoon: {
      sky: '#FFC060',
      skyGradient: '#FFE090',
      cloud: '#FFF0D0',
      cloudShadow: '#EED0A0',
      ground: '#D88038',
      groundDark: '#884820',
      groundLight: '#F0A058',
      bush: '#409020',
      bushDark: '#206010',
      bushHighlight: '#70B040',
      bushOutline: '#103008',
      pipeLight: '#68B018',
      pipeMid: '#408008',
      pipeDark: '#204004',
      pipeOutline: '#102002'
    },
    sunset: {
      sky: '#FF6030',
      skyGradient: '#FF9060',
      cloud: '#FFC0A0',
      cloudShadow: '#CC8060',
      ground: '#B05020',
      groundDark: '#703010',
      groundLight: '#D07040',
      bush: '#306010',
      bushDark: '#183808',
      bushHighlight: '#508030',
      bushOutline: '#102005',
      pipeLight: '#508010',
      pipeMid: '#305008',
      pipeDark: '#182804',
      pipeOutline: '#0C1402'
    },
    dusk: {
      sky: '#402060',
      skyGradient: '#604080',
      cloud: '#806090',
      cloudShadow: '#504070',
      ground: '#603820',
      groundDark: '#382010',
      groundLight: '#805030',
      bush: '#184018',
      bushDark: '#0C200C',
      bushHighlight: '#286028',
      bushOutline: '#061006',
      pipeLight: '#285010',
      pipeMid: '#183008',
      pipeDark: '#0C1804',
      pipeOutline: '#050A02'
    },
    evening: {
      sky: '#201040',
      skyGradient: '#302060',
      cloud: '#504070',
      cloudShadow: '#302050',
      ground: '#482818',
      groundDark: '#28140C',
      groundLight: '#603820',
      bush: '#103010',
      bushDark: '#081808',
      bushHighlight: '#204020',
      bushOutline: '#040C04',
      pipeLight: '#20400C',
      pipeMid: '#102006',
      pipeDark: '#081003',
      pipeOutline: '#020501'
    },
    night: {
      sky: '#0A0A28',
      skyGradient: '#151540',
      cloud: '#282848',
      cloudShadow: '#181830',
      ground: '#382010',
      groundDark: '#201008',
      groundLight: '#503018',
      bush: '#082008',
      bushDark: '#041004',
      bushHighlight: '#103010',
      bushOutline: '#020502',
      pipeLight: '#143008',
      pipeMid: '#0C1C04',
      pipeDark: '#060E02',
      pipeOutline: '#000000'
    }
  };
  
  // Interpolar entre paletas baseado no horário
  let factor = 0;
  let palette1 = palettes.deepNight;
  let palette2 = palettes.deepNight;
  
  if (totalMinutes < earlyMorning) {
    // Noite profunda (0:00 - 4:00)
    palette1 = palettes.deepNight;
    palette2 = palettes.deepNight;
    factor = 0;
  } else if (totalMinutes < dawn) {
    // Primeiras luzes (4:00 - 5:30)
    palette1 = palettes.deepNight;
    palette2 = palettes.earlyMorning;
    factor = (totalMinutes - earlyMorning) / (dawn - earlyMorning);
  } else if (totalMinutes < sunrise) {
    // Amanhecer (5:30 - 6:30)
    palette1 = palettes.dawn;
    palette2 = palettes.sunrise;
    factor = (totalMinutes - dawn) / (sunrise - dawn);
  } else if (totalMinutes < midMorning) {
    // Manhã (6:30 - 9:00)
    palette1 = palettes.sunrise;
    palette2 = palettes.midMorning;
    factor = (totalMinutes - sunrise) / (midMorning - sunrise);
  } else if (totalMinutes < noon) {
    // Manhã avançada (9:00 - 12:00)
    palette1 = palettes.midMorning;
    palette2 = palettes.noon;
    factor = (totalMinutes - midMorning) / (noon - midMorning);
  } else if (totalMinutes < afternoon) {
    // Meio-dia para tarde (12:00 - 15:00)
    palette1 = palettes.noon;
    palette2 = palettes.afternoon;
    factor = (totalMinutes - noon) / (afternoon - noon);
  } else if (totalMinutes < lateAfternoon) {
    // Tarde (15:00 - 16:30)
    palette1 = palettes.afternoon;
    palette2 = palettes.lateAfternoon;
    factor = (totalMinutes - afternoon) / (lateAfternoon - afternoon);
  } else if (totalMinutes < sunset) {
    // Final da tarde (16:30 - 17:45)
    palette1 = palettes.lateAfternoon;
    palette2 = palettes.sunset;
    factor = (totalMinutes - lateAfternoon) / (sunset - lateAfternoon);
  } else if (totalMinutes < dusk) {
    // Pôr do sol (17:45 - 18:30)
    palette1 = palettes.sunset;
    palette2 = palettes.dusk;
    factor = (totalMinutes - sunset) / (dusk - sunset);
  } else if (totalMinutes < evening) {
    // Crepúsculo (18:30 - 19:15)
    palette1 = palettes.dusk;
    palette2 = palettes.evening;
    factor = (totalMinutes - dusk) / (evening - dusk);
  } else if (totalMinutes < night) {
    // Início da noite (19:15 - 20:00)
    palette1 = palettes.evening;
    palette2 = palettes.night;
    factor = (totalMinutes - evening) / (night - evening);
  } else {
    // Noite para noite profunda (20:00 - 0:00)
    palette1 = palettes.night;
    palette2 = palettes.deepNight;
    factor = (totalMinutes - night) / ((24 * 60) - night);
  }
  
  // Interpolar todas as cores
  const interpolatedColors: Record<string, string> = {};
  for (const key in palette1) {
    // @ts-ignore
    interpolatedColors[key] = lerpColor(
      // @ts-ignore
      palette1[key],
      // @ts-ignore
      palette2[key],
      factor
    );
  }
  
  return interpolatedColors;
}

interface SuperMarioBackgroundProps {
  autoTimeMode: boolean;
}

export default function SuperMarioBackground({ autoTimeMode }: SuperMarioBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentColors, setCurrentColors] = useState(() => {
    if (!autoTimeMode) {
      return getColorsByTime(12, 0); // Paleta padrão: meio-dia
    }
    const now = new Date();
    return getColorsByTime(now.getHours(), now.getMinutes());
  });

  // Atualizar cores baseado no modo (auto ou padrão)
  useEffect(() => {
    const updateColors = () => {
      if (!autoTimeMode) {
        // Auto Time Mode desativado: usar paleta padrão (meio-dia)
        setCurrentColors(getColorsByTime(12, 0));
        return;
      }
      // Modo normal: usar horário real
      const now = new Date();
      const newColors = getColorsByTime(now.getHours(), now.getMinutes());
      setCurrentColors(newColors as any);
    };

    updateColors();
    
    // Atualizar a cada minuto apenas no modo normal com autoTimeMode ativo
    if (autoTimeMode) {
      const interval = setInterval(() => {
        updateColors();
      }, 60000); // A cada 60 segundos
      return () => clearInterval(interval);
    }
  }, [autoTimeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configurar tamanho do canvas
    canvas.width = 800;
    canvas.height = 600;

    const colors = currentColors as any;

    // 1. Céu Vibrante
    function drawSky() {
      if (!ctx || !canvas) return;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.sky);
      gradient.addColorStop(1, colors.skyGradient);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Função auxiliar para pixels nítidos
    function drawRect(x: number, y: number, w: number, h: number, color: string) {
      if (!ctx) return;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
    }

    // Função para calcular opacidade das estrelas baseada no horário
    function getStarOpacity(hour: number, minute: number): number {
      const totalMinutes = hour * 60 + minute;
      
      // Estrelas começam a aparecer às 18:30 e desaparecem às 5:00
      const sunsetStart = 18 * 60 + 30; // 18:30 (Crepúsculo)
      const starsFullyVisible = 19 * 60 + 30; // 19:30 - Estrelas totalmente visíveis
      const starsFadeStart = 4 * 60 + 30; // 4:30 - Começam a desaparecer
      const sunriseEnd = 6 * 60; // 6:00 - Estrelas invisíveis
      
      if (totalMinutes >= starsFullyVisible || totalMinutes < starsFadeStart) {
        // Noite profunda - estrelas totalmente visíveis
        return 1.0;
      } else if (totalMinutes >= sunsetStart && totalMinutes < starsFullyVisible) {
        // Aparecendo gradualmente (18:30 - 19:30)
        return (totalMinutes - sunsetStart) / (starsFullyVisible - sunsetStart);
      } else if (totalMinutes >= starsFadeStart && totalMinutes < sunriseEnd) {
        // Desaparecendo gradualmente (4:30 - 6:00)
        return 1.0 - ((totalMinutes - starsFadeStart) / (sunriseEnd - starsFadeStart));
      }
      
      // Dia - sem estrelas
      return 0;
    }

    // 2.5 Estrelas (aparecem gradualmente à noite)
    function drawStars(opacity: number, frameCount: number) {
      if (opacity <= 0) return;
      if (!ctx) return;
      
      // Posições fixas das estrelas (sempre as mesmas)
      const starPositions = [
        { x: 50, y: 30, size: 2 },
        { x: 120, y: 80, size: 3 },
        { x: 200, y: 50, size: 2 },
        { x: 280, y: 100, size: 2 },
        { x: 350, y: 40, size: 3 },
        { x: 420, y: 90, size: 2 },
        { x: 490, y: 60, size: 2 },
        { x: 560, y: 120, size: 3 },
        { x: 630, y: 70, size: 2 },
        { x: 700, y: 45, size: 2 },
        { x: 100, y: 140, size: 2 },
        { x: 180, y: 160, size: 2 },
        { x: 260, y: 130, size: 3 },
        { x: 340, y: 170, size: 2 },
        { x: 450, y: 150, size: 2 },
        { x: 530, y: 180, size: 2 },
        { x: 610, y: 140, size: 3 },
        { x: 690, y: 160, size: 2 },
        { x: 750, y: 100, size: 2 },
        { x: 80, y: 200, size: 2 },
        { x: 160, y: 220, size: 2 },
        { x: 240, y: 210, size: 2 },
        { x: 320, y: 240, size: 3 },
        { x: 400, y: 230, size: 2 },
        { x: 480, y: 250, size: 2 },
        { x: 580, y: 220, size: 2 },
        { x: 660, y: 240, size: 2 },
        { x: 740, y: 200, size: 3 }
      ];

      // Calcular opacidade para cada estrela
      starPositions.forEach((star, index) => {
        // Cada estrela tem um delay diferente para aparecer gradualmente
        const delay = index * 0.02; // 2% de delay entre cada estrela
        const starOpacity = Math.max(0, Math.min(1, (opacity - delay) / (1 - delay)));
        
        if (starOpacity > 0) {
          // Calcular brilho (piscada sutil)
          const twinkle = Math.sin(frameCount * 0.02 + index) * 0.3 + 0.7;
          const finalOpacity = starOpacity * twinkle;
          
          // Cor da estrela com opacidade
          const alpha = Math.round(finalOpacity * 255).toString(16).padStart(2, '0');
          const starColor = `#FFFFFF${alpha}`;
          
          ctx.fillStyle = starColor;
          
          // Desenhar estrela em formato de cruz pixelada
          const { x, y, size } = star;
          
          // Centro
          drawRect(x, y, size, size, starColor);
          
          // Braços da estrela
          if (size >= 3) {
            // Braços maiores para estrelas grandes
            drawRect(x - size, y, size, size, starColor);
            drawRect(x + size, y, size, size, starColor);
            drawRect(x, y - size, size, size, starColor);
            drawRect(x, y + size, size, size, starColor);
          } else {
            // Braços menores
            drawRect(x - size, y, size, size, starColor);
            drawRect(x + size, y, size, size, starColor);
            drawRect(x, y - size, size, size, starColor);
            drawRect(x, y + size, size, size, starColor);
          }
        }
      });
    }

    // 2. Nuvens Detalhadas com Sombra
    function drawCloud(xBase: number, yBase: number, scale: number) {
      const pixelSize = 8 * scale;
      
      // Matriz de nuvem mais arredondada
      const cloudPattern = [
        [0,0,0,1,1,1,1,0,0,0],
        [0,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,0,0,0,0,0,0] // Sombra extra na base
      ];

      cloudPattern.forEach((row, i) => {
        row.forEach((pixel, j) => {
          if (pixel) {
            const px = xBase + j * pixelSize;
            const py = yBase + i * pixelSize;
            
            // Lógica de sombreamento simples: base e direita são sombra
            const isBottom = i === cloudPattern.length - 1 || (i < cloudPattern.length - 1 && !cloudPattern[i+1][j]);
            const isRight = j === row.length - 1 || !row[j+1];
            
            if (isBottom || isRight) {
              drawRect(px, py, pixelSize, pixelSize, colors.cloudShadow);
              // Pequeno brilho interno
              if(isBottom) drawRect(px + 2, py, pixelSize - 4, 4, colors.cloud);
            } else {
              drawRect(px, py, pixelSize, pixelSize, colors.cloud);
            }
          }
        });
      });
    }

    // 3. Arbustos (Substituindo as colinas)
    function drawBush(xBase: number, yBase: number) {
        const pixelSize = 4;
        
        // Padrão do arbusto (similar à nuvem, mas achatado na base)
        const bushPattern = [
          [0,0,0,0,1,1,1,1,0,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,0],
          [1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1],
          [0,1,1,1,1,1,1,1,1,1,1,0]
        ];
  
        // Ajustar yBase para que o arbusto "sente" na linha (subindo a altura do padrão)
        const startY = yBase - (bushPattern.length * pixelSize);
  
        bushPattern.forEach((row, i) => {
          row.forEach((pixel, j) => {
            if (pixel) {
              const px = xBase + j * pixelSize;
              const py = startY + i * pixelSize;
              
              // Bordas
              const isTop = i === 0 || !bushPattern[i-1][j];
              const isBottom = i === bushPattern.length - 1 || !bushPattern[i+1][j];
              const isLeft = j === 0 || !row[j-1];
              const isRight = j === row.length - 1 || !row[j+1];

              if (isTop || isLeft || isRight || isBottom) {
                 drawRect(px, py, pixelSize, pixelSize, colors.bushOutline);
              } else {
                 // Interior
                 drawRect(px, py, pixelSize, pixelSize, colors.bush);
                 
                 // Highlight (canto superior esquerdo interno)
                 if (i < 3 && j < 5 && j > 1) {
                    drawRect(px, py, pixelSize, pixelSize, colors.bushHighlight);
                 }

                 // Sombra (canto inferior direito interno)
                 if (i > 3 && j > 6) {
                    drawRect(px, py, pixelSize, pixelSize, colors.bushDark);
                 }
                 
                 // Detalhes de "fruta" ou textura (pontos aleatórios estilizados)
                 if ((i === 3 && j === 3) || (i === 4 && j === 8)) {
                    drawRect(px, py, pixelSize, pixelSize, colors.bushHighlight); 
                 }
              }
            }
          });
        });
      }

    // 4. Chão Estilo SMW (Blocos diagonais)
    function drawGround() {
      if (!ctx || !canvas) return;
      // Reduzindo a altura do chão em ~30% (de 110 para 70)
      const groundY = canvas.height - 70;
      
      // Cor de fundo do buraco
      drawRect(0, groundY, canvas.width, canvas.height - groundY, colors.groundDark);

      // Tamanho do bloco
      const blockSize = 32;

      for (let y = groundY; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
           // Desenhar um bloco
           // Base
           drawRect(x, y, blockSize, blockSize, colors.ground);
           
           // Highlight (canto superior esquerdo)
           drawRect(x, y, blockSize, 4, colors.groundLight);
           drawRect(x, y, 4, blockSize, colors.groundLight);
           
           // Shadow (canto inferior direito)
           drawRect(x + blockSize - 4, y, 4, blockSize, colors.groundDark);
           drawRect(x, y + blockSize - 4, blockSize, 4, colors.groundDark);

           // Detalhes internos (pontos)
           drawRect(x + 20, y + 10, 4, 4, colors.groundDark);
           drawRect(x + 8, y + 20, 4, 4, colors.groundDark);
        }
      }

      // Faixa de grama no topo do chão
      const grassHeight = 16;
      const grassY = groundY - grassHeight;
      
      // Fundo preto da grama
      drawRect(0, grassY + 4, canvas.width, grassHeight - 4, '#000'); 
      
      // Padrão de grama vibrante
      for (let x = 0; x < canvas.width; x += 16) {
        drawRect(x, grassY, 16, 12, colors.bush); // Base verde
        drawRect(x + 2, grassY + 2, 12, 6, colors.bushHighlight); // Highlight
        drawRect(x + 12, grassY + 4, 4, 12, colors.bushDark); // Sombra lateral
      }
    }

    // 5. Tubo (Pipe)
    function drawPipe(x: number, groundLevelY: number, height: number) {
      if (!ctx) return;
      
      const width = 64;          // Largura total da cabeça (Reduzido)
      const capHeight = 28;      // Altura da cabeça (Reduzido)
      const bodyWidth = 56;      // Largura do corpo (Reduzido)
      
      const pipeX = x;
      const pipeY = groundLevelY - height; // Topo do tubo
      
      // -- Corpo do Tubo --
      const bodyX = pipeX + (width - bodyWidth) / 2;
      const bodyY = pipeY + capHeight;
      const bodyH = height - capHeight; // Vai até o chão

      // Contorno Corpo
      drawRect(bodyX, bodyY, bodyWidth, bodyH, colors.pipeOutline);
      
      // Preenchimento Corpo (Gradient Simulado)
      const bInX = bodyX + 4;
      const bInW = bodyWidth - 8;
      
      drawRect(bInX, bodyY, bInW, bodyH, colors.pipeMid); // Base
      drawRect(bInX + 4, bodyY, 8, bodyH, colors.pipeLight); // Highlight Forte
      drawRect(bInX + 16, bodyY, 4, bodyH, colors.pipeLight); // Highlight Fraco
      drawRect(bInX + bInW - 12, bodyY, 8, bodyH, colors.pipeDark); // Sombra
      drawRect(bInX + bInW - 4, bodyY, 4, bodyH, colors.pipeOutline); // Sombra Borda
      
      // -- Cabeça do Tubo (Cap) --
      // Contorno Cap
      drawRect(pipeX, pipeY, width, capHeight, colors.pipeOutline);
      
      // Preenchimento Cap
      const cInX = pipeX + 4;
      const cInY = pipeY + 4;
      const cInW = width - 8;
      const cInH = capHeight - 8;
      
      drawRect(cInX, cInY, cInW, cInH, colors.pipeMid);
      drawRect(cInX + 4, cInY, 8, cInH, colors.pipeLight); // Highlight Forte
      drawRect(cInX + 16, cInY, 4, cInH, colors.pipeLight); // Highlight Fraco
      drawRect(cInX + cInW - 12, cInY, 8, cInH, colors.pipeDark); // Sombra
      drawRect(cInX + cInW - 4, cInY, 4, cInH, colors.pipeOutline); // Sombra Borda
      
      // Detalhe extra abaixo da borda do cap (sombra projetada no corpo)
      drawRect(bodyX + 4, bodyY, bodyWidth - 8, 4, colors.pipeDark);
    }

    // Estado da animação
    let frame = 0;
    let animationId: number;
    
    function render() {
      drawSky();
      
      // Calcular opacidade das estrelas baseada no horário
      let starOpacity = 0;
      if (!autoTimeMode) {
        starOpacity = 0; // Modo padrão (meio-dia): sem estrelas
      } else {
        const now = new Date();
        starOpacity = getStarOpacity(now.getHours(), now.getMinutes());
      }
      
      // Desenhar estrelas (antes das nuvens para ficarem ao fundo)
      drawStars(starOpacity, frame);
      
      // Nuvens com efeito parallax
      const cloudSpeed = 0.5;
      const w = canvas.width + 200;
      
      const cx1 = ((frame * cloudSpeed) % w) - 100;
      const cx2 = ((frame * cloudSpeed * 0.8 + 300) % w) - 100;
      const cx3 = ((frame * cloudSpeed * 1.2 + 600) % w) - 100;

      drawCloud(cx1, 50, 1.2); // Reduzido de 1.5
      drawCloud(cx2, 20, 1.0); // Mantido
      drawCloud(cx3, 80, 1.5); // Reduzido de 2.0
      
      // Posição Y da superfície da grama (Onde os objetos "sentam")
      // groundY (height-70) - grassHeight (16) = height - 86
      const surfaceY = canvas.height - 86;

      // Arbustos (Camada de fundo, mas na frente das colinas se existissem)
      drawBush(100, surfaceY);
      drawBush(350, surfaceY);
      drawBush(550, surfaceY);
      
      // Chão
      drawGround();

      // Tubo (Sobre o chão, no final)
      drawPipe(700, surfaceY, 60); 
    }

    function animate() {
      frame++;
      render();
      animationId = requestAnimationFrame(animate);
    }
    
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentColors, autoTimeMode]);

  return (
    <div style={{
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: currentColors.sky,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'background 2s ease-in-out',
      position: 'relative'
    }}>
      <canvas 
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          imageRendering: 'pixelated'
        }}
      />
      
    </div>
  );
}