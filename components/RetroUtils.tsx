import React, { useState } from 'react';

// --- PALETAS DE CORES ---

// 1. Super Mario World (Original/Classic)
const MARIO_COLORS = {
  ui: {
    background: '#FFFFCE', // Original Message Box Cream
    border: '#000000',
    shadow: 'rgba(0,0,0,0.5)',
    text: '#000000',
  },
  red: { main: '#E63939', light: '#FF6666', dark: '#AA0000', text: '#FFFFFF' },
  vibrantRed: { main: '#FF4444', light: '#FF8888', dark: '#CC0000', text: '#FFFFFF' },
  blue: { main: '#4080FF', light: '#70A0FF', dark: '#0040B0', text: '#FFFFFF' },
  yellow: { main: '#F8D878', light: '#FFF090', dark: '#B89830', text: '#000000' }, // Cabeçalhos padrão
  green: { main: '#20D040', light: '#60FF80', dark: '#008020', text: '#FFFFFF' },
  purple: { main: '#9940FF', light: '#C080FF', dark: '#6000B0', text: '#FFFFFF' },
  gray: { main: '#A0A0A0', light: '#D0D0D0', dark: '#606060', text: '#FFFFFF' },
  white: { main: '#FFFFFF', light: '#FFFFFF', dark: '#E0E0E0', text: '#000000' },
  black: { main: '#202020', light: '#404040', dark: '#000000', text: '#FFFFFF' },
  orange: { main: '#FF9020', light: '#FFC050', dark: '#CC6000', text: '#FFFFFF' }
};

// 2. Minimalist Mode
const MINIMALIST_COLORS = {
  ui: {
    background: '#000000',
    border: '#FFFFFF',
    shadow: '4px 4px 0px #FFFFFF',
    text: '#FFFFFF',
  },
  red: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  vibrantRed: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  blue: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  yellow: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  green: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  purple: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  gray: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  white: { main: '#FFFFFF', light: '#FFFFFF', dark: '#FFFFFF', text: '#000000' },
  black: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' },
  orange: { main: '#000000', light: '#000000', dark: '#000000', text: '#FFFFFF' }
};


export const THEME = {
  font: '"Press Start 2P", cursive',
  fonts: {
    pixel: '"Press Start 2P", cursive',
  },
  shadow: '4px 4px 0px rgba(0,0,0,0.5)',
  shadowHover: '2px 2px 0px rgba(0,0,0,0.5)',
  shadowActive: '0px 0px 0px rgba(0,0,0,0.0)',
  // Default fallback (Mario)
  colors: MARIO_COLORS 
};

// Helper to get colors based on theme mode
export const getThemeColors = (mode: 'mario' | 'minimalist') => {
  if (mode === 'minimalist') return MINIMALIST_COLORS;
  return MARIO_COLORS;
};

// --- ESTADO GLOBAL DE MUTE ---
let isGlobalMuted = false;

export const toggleGlobalMute = () => {
  isGlobalMuted = !isGlobalMuted;
  return isGlobalMuted;
};

export const getMuteState = () => isGlobalMuted;

// --- SISTEMA DE ÁUDIO 8-BIT ---
export const play8BitSound = (type: 'hover' | 'coin' | 'pipe' | 'alarm' | 'click' | 'open' | 'add' | 'jump' | 'powerup' | '1up' | 'pause' | 'stomp' | 'fireball' | 'break' | 'hurt') => {
  if (isGlobalMuted) return;

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'hover') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } 
  else if (type === 'click') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
  else if (type === 'jump') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
  else if (type === 'powerup') {
    const freqs = [1046.5, 1174.7, 1318.5, 1568, 2093, 2349.3, 2637, 3136];
    freqs.forEach((freq, i) => {
      const time = now + (i * 0.08);
      const oscN = ctx.createOscillator();
      const gainN = ctx.createGain();
      oscN.type = 'square';
      oscN.connect(gainN);
      gainN.connect(ctx.destination);
      oscN.frequency.setValueAtTime(freq, time);
      gainN.gain.setValueAtTime(0.08, time);
      gainN.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
      oscN.start(time);
      oscN.stop(time + 0.1);
    });
    return; 
  }
  else if (type === '1up') {
    const melody = [659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51];
    melody.forEach((freq, i) => {
      const time = now + (i * 0.12);
      const oscN = ctx.createOscillator();
      const gainN = ctx.createGain();
      oscN.type = 'square';
      oscN.connect(gainN);
      gainN.connect(ctx.destination);
      oscN.frequency.setValueAtTime(freq, time);
      gainN.gain.setValueAtTime(0.1, time);
      gainN.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
      oscN.start(time);
      oscN.stop(time + 0.15);
    });
    return;
  }
  else if (type === 'pause') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(587.33, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
  else if (type === 'stomp') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
  else if (type === 'fireball') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  else if (type === 'break') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
  else if (type === 'open') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now); 
    osc.frequency.linearRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
  else if (type === 'add') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now); 
    osc.frequency.linearRampToValueAtTime(660, now + 0.15); 
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
  else if (type === 'coin') {
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(784, now); 
    osc.frequency.setValueAtTime(988, now + 0.08); 
    osc.frequency.setValueAtTime(1175, now + 0.16); 
    gain.gain.setValueAtTime(0.08, now); 
    gain.gain.setValueAtTime(0.08, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } 
  else if (type === 'pipe') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
  else if (type === 'alarm') {
    osc.type = 'square';
    [880, 1174, 1760, 880, 1174, 1760].forEach((freq, i) => {
        const time = now + (i * 0.15);
        const oscN = ctx.createOscillator();
        const gainN = ctx.createGain();
        oscN.type = 'square';
        oscN.connect(gainN);
        gainN.connect(ctx.destination);
        oscN.frequency.setValueAtTime(freq, time);
        gainN.gain.setValueAtTime(0.1, time);
        gainN.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        oscN.start(time);
        oscN.stop(time + 0.12);
    });
  }
  else if (type === 'hurt') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(523, now); 
    osc.frequency.exponentialRampToValueAtTime(196, now + 0.3); 
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

// --- COMPONENTE DE BOTÃO RETRO ---
interface RetroButtonProps {
  onClick?: (e: any) => void;
  colorType?: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'gray' | 'white' | 'black' | 'orange' | 'vibrantRed';
  size?: 'sm' | 'small' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
  title?: string;
  sound?: string;
  className?: string;
  as?: any;
  themeMode?: 'mario' | 'minimalist'; 
}

export const RetroButton = ({ 
  onClick, 
  colorType = 'yellow', 
  size = 'md', 
  children, 
  title, 
  sound = 'click', 
  className = '', 
  as = 'button',
  themeMode = 'mario'
}: RetroButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsActive(false);
  };

  const handleMouseDown = () => {
    setIsActive(true);
  };

  const handleMouseUp = () => {
    setIsActive(false);
  };

  const handleClick = (e: any) => {
      play8BitSound(sound as any);
      if(onClick) onClick(e);
  }

  // Get colors based on current theme mode
  const currentPalette = getThemeColors(themeMode);
  // @ts-ignore
  const selectedColor = currentPalette[colorType];
  const c = (selectedColor && 'main' in selectedColor) ? selectedColor : currentPalette.yellow;

  const dims = size === 'sm' ? 'w-20 h-10 text-[10px]' 
             : size === 'small' ? 'px-4 py-2 text-[10px]'
             : size === 'md' ? 'w-32 h-14 text-xs' 
             : size === 'lg' ? 'w-60 h-16 text-xl' 
             : size === 'icon' ? 'w-14 h-14 text-2xl'
             : 'w-32 h-14 text-xs';

  const currentShadow = isActive 
    ? THEME.shadowActive 
    : isHovered 
      ? THEME.shadowHover 
      : themeMode === 'minimalist' ? '4px 4px 0 #FFFFFF' : THEME.shadow; // White shadow in minimalist

  const Component = as;

  // Invert colors for hover state in minimalist mode to show interaction
  const isMinimalist = themeMode === 'minimalist';
  const bgColor = isMinimalist && isHovered ? '#FFFFFF' : c.main;
  const textColor = isMinimalist && isHovered ? '#000000' : c.text;
  const borderColor = isMinimalist ? '#FFFFFF' : '#000';

  return (
    <Component
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      title={title}
      className={`
        relative group transition-all duration-100 ease-out
        hover:-translate-y-1 active:translate-y-1
        flex items-center justify-center
        cursor-pointer
        ${dims}
        ${className}
      `}
      style={{
        fontFamily: THEME.font,
        border: `4px solid ${borderColor}`,
        backgroundColor: bgColor,
        // Linear gradient for 3D button effect (simplified for minimalist)
        backgroundImage: isMinimalist 
          ? 'none' 
          : `linear-gradient(to bottom, ${c.light} 0%, ${c.main} 40%, ${c.main} 100%)`,
        boxShadow: currentShadow,
        color: textColor,
        textShadow: isMinimalist || colorType === 'yellow' ? 'none' : '2px 2px 0px #000',
      }}
    >
      {!isMinimalist && (
        <>
          <div className="absolute inset-0 pointer-events-none border-t-4 border-l-4 border-white opacity-40" />
          <div className="absolute inset-0 pointer-events-none border-b-4 border-r-4 border-black opacity-20" />
        </>
      )}
      <span className="relative z-10 filter drop-shadow-md text-center leading-tight uppercase tracking-wider">{children}</span>
    </Component>
  );
};