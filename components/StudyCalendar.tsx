import React, { useState, useEffect } from 'react';
import { RetroButton, THEME, play8BitSound, getThemeColors } from './RetroUtils';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface StudyCalendarProps {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  studyLog: Record<string, number>;
  themeMode: 'mario' | 'minimalist';
}

export default function StudyCalendar({ dailyGoal, setDailyGoal, studyLog, themeMode }: StudyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado local para permitir edição livre (inclusive apagar o número)
  const [localInput, setLocalInput] = useState(dailyGoal.toString());

  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  // Sincroniza o input local quando a meta muda externamente (ex: botões + e -)
  useEffect(() => {
    setLocalInput(dailyGoal.toString());
  }, [dailyGoal]);

  // Navegação de Mês
  const changeMonth = (offset: number) => {
    play8BitSound('jump');
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const adjustGoal = (amount: number) => {
    play8BitSound('coin');
    const newGoal = Math.max(15, dailyGoal + amount); // Mínimo de 15 minutos
    setDailyGoal(newGoal);
    // O useEffect atualizará o localInput
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val); // Permite que o campo fique vazio ou incompleto visualmente

    const num = parseInt(val);
    if (!isNaN(num) && num >= 0) {
        setDailyGoal(num); // Atualiza o estado global apenas se for número válido
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  // Array com dias vazios para preencher o início da grid + dias reais
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const getDateKey = (day: number) => {
     const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
     const offset = d.getTimezoneOffset();
     const localDate = new Date(d.getTime() - (offset*60*1000));
     return localDate.toISOString().split('T')[0];
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-4xl animate-in fade-in zoom-in duration-300">
      
      {/* Moldura Principal estilo SMW Box */}
      <div 
        className="w-full p-1 relative"
        style={{
          backgroundColor: colors.ui.background,
          border: `4px solid ${isMinimalist ? '#FFF' : '#000'}`,
          boxShadow: isMinimalist ? '8px 8px 0px #FFF' : '8px 8px 0px rgba(0,0,0,0.5)',
        }}
      >
        {/* Cabeçalho do Calendário */}
        <div className="border-b-4 p-4 flex justify-between items-center relative z-0" 
             style={{ 
                 backgroundColor: colors.yellow.main, 
                 borderColor: isMinimalist ? '#FFF' : '#000',
                 color: isMinimalist ? '#FFF' : (themeMode === 'mario' ? '#000' : '#FFF') // Mario header text is black, others white for contrast
             }}>
            <RetroButton onClick={() => changeMonth(-1)} colorType="yellow" size="icon" className="w-10 h-10" themeMode={themeMode}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6H14V8H12V10H10V14H12V16H14V18H16V6Z" />
                </svg>
            </RetroButton>

            <div className="flex flex-col items-center">
                <h2 
                    className="text-xl md:text-2xl text-center mb-1"
                    style={{ 
                        fontFamily: THEME.font,
                        textShadow: isMinimalist ? 'none' : (themeMode === 'mario' ? '2px 2px 0 #FFF' : '2px 2px 0 #000'),
                        color: colors.yellow.text
                    }}
                >
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h2>
            </div>

            <RetroButton onClick={() => changeMonth(1)} colorType="yellow" size="icon" className="w-10 h-10" themeMode={themeMode}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 6H10V8H12V10H14V14H12V16H10V18H8V6Z" />
                </svg>
            </RetroButton>
        </div>

        {/* --- ÁREA DE META DIÁRIA (HUD STYLE - VERSÃO MENOR) --- */}
        <div className="relative z-10 -mt-3 mb-2 flex justify-center">
            <div 
                className="p-2 flex flex-col items-center gap-1"
                style={{
                    backgroundColor: colors.blue.main,
                    border: isMinimalist ? '3px solid #FFF' : '3px solid #fff',
                    outline: isMinimalist ? '3px solid #000' : '3px solid #000',
                    borderRadius: '4px',
                    width: 'auto',
                    minWidth: '220px',
                    maxWidth: '300px',
                    boxShadow: isMinimalist ? '4px 4px 0px #FFF' : '4px 4px 0px rgba(0,0,0,0.4)'
                }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-widest drop-shadow-md" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF' }}>
                        ★ DAILY XP ★
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full justify-center">
                    {/* Botão Menos */}
                    <button 
                        onClick={() => adjustGoal(-15)}
                        className="w-6 h-6 border-2 text-white hover:bg-opacity-80 active:translate-y-1 flex items-center justify-center text-xs"
                        style={{ 
                            fontFamily: THEME.font, 
                            backgroundColor: isMinimalist ? '#000' : colors.red.light,
                            borderColor: isMinimalist ? '#FFF' : '#000',
                            color: isMinimalist ? '#FFF' : '#FFF',
                            boxShadow: isMinimalist ? 'none' : '1px 1px 0 #000'
                        }}
                    >
                        -
                    </button>

                    {/* Mostrador de Pontuação (Counter) */}
                    <div className="px-2 py-1 flex items-center gap-1 min-w-[100px] justify-center" 
                         style={{ 
                             backgroundColor: isMinimalist ? '#000' : '#000',
                             border: `2px solid ${isMinimalist ? '#FFF' : '#555'}`,
                             boxShadow: isMinimalist ? 'none' : 'inset 0 0 5px #000'
                         }}>
                        <input 
                            type="text"
                            inputMode="numeric"
                            value={localInput}
                            onChange={handleInputChange}
                            className="bg-transparent text-center text-lg w-12 focus:outline-none font-bold"
                            style={{ 
                                fontFamily: THEME.font,
                                color: isMinimalist ? '#FFF' : (themeMode === 'mario' ? colors.yellow.main : '#FFF'),
                                textShadow: isMinimalist ? 'none' : '1px 1px 0 #000'
                            }}
                        />
                        <span className="text-[8px] mt-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#888' }}>MIN</span>
                    </div>

                    {/* Botão Mais */}
                    <button 
                        onClick={() => adjustGoal(15)}
                        className="w-6 h-6 border-2 text-white hover:bg-opacity-80 active:translate-y-1 flex items-center justify-center text-xs"
                        style={{ 
                            fontFamily: THEME.font, 
                            backgroundColor: isMinimalist ? '#000' : colors.green.light,
                            borderColor: isMinimalist ? '#FFF' : '#000',
                            color: isMinimalist ? '#FFF' : '#FFF',
                            boxShadow: isMinimalist ? 'none' : '1px 1px 0 #000'
                        }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>

        {/* Corpo do Calendário */}
        <div className="p-4 pt-4" style={{ backgroundColor: isMinimalist ? '#000' : '#FFF' }}>
            
            {/* Cabeçalho Dias da Semana */}
            <div className="grid grid-cols-7 mb-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                    <div 
                        key={day} 
                        className="text-center text-[10px] md:text-xs py-2 border-2 border-transparent"
                        style={{ 
                            fontFamily: THEME.font, 
                            backgroundColor: isMinimalist ? '#000' : '#000',
                            color: isMinimalist ? '#FFF' : (themeMode === 'mario' ? colors.yellow.main : '#FFF'),
                            borderColor: isMinimalist ? '#FFF' : 'transparent'
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2">
                {totalSlots.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="aspect-square" />;
                    
                    const isCurrentDay = isToday(day);
                    const dateKey = getDateKey(day);
                    const studiedMinutes = studyLog[dateKey] || 0;
                    const percentage = Math.min(100, (studiedMinutes / dailyGoal) * 100);
                    const isGoalMet = studiedMinutes >= dailyGoal;

                    let bgColor = '#E0E0E0'; // Cinza (padrão)
                    if (isMinimalist) {
                        bgColor = '#000'; // Black default
                    } else {
                        if (isGoalMet) bgColor = colors.yellow.light; 
                        else if (isCurrentDay) bgColor = colors.blue.light;
                    }
                    
                    // Minimalist Border logic
                    const borderColor = isMinimalist ? '#FFF' : '#000';
                    
                    return (
                        <div 
                            key={day}
                            className={`
                                aspect-square flex flex-col items-center justify-between p-1 relative group cursor-pointer transition-transform hover:scale-105
                                border-2
                            `}
                            style={{ 
                                backgroundColor: bgColor,
                                borderColor: borderColor,
                                boxShadow: isCurrentDay ? (isMinimalist ? '0 0 0 2px white inset' : '0 0 0 2px black inset') : (isMinimalist ? 'none' : '4px 4px 0px rgba(0,0,0,0.2)')
                            }}
                            title={`${studiedMinutes} / ${dailyGoal} min`}
                        >
                            {/* Número do Dia */}
                            <span 
                                className={`text-sm md:text-lg ${isCurrentDay ? 'font-bold' : ''}`}
                                style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}
                            >
                                {day}
                            </span>

                            {/* Indicador de Sucesso (Estrela Super Mario) */}
                            {isGoalMet && (
                                <div className="absolute top-0.5 right-0.5 animate-bounce">
                                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
                                        {isMinimalist ? (
                                            // Star outline for minimalist
                                            <path d="M8 1 L9 6 L14 6 L10 9 L11 14 L8 11 L5 14 L6 9 L2 6 L7 6 Z" fill="none" stroke="#FFF" strokeWidth="1" />
                                        ) : (
                                            <g>
                                                <path d="M8 1 L9 6 L14 6 L10 9 L11 14 L8 11 L5 14 L6 9 L2 6 L7 6 Z" fill="#000" />
                                                <path d="M8 2 L8.8 5.8 L13 5.8 L9.5 8.5 L10.3 12.8 L8 10.5 L5.7 12.8 L6.5 8.5 L3 5.8 L7.2 5.8 Z" fill="#FFD700" />
                                                <circle cx="7" cy="4" r="0.8" fill="#FFFFFF" opacity="0.8" />
                                                <circle cx="9.5" cy="7.5" r="0.5" fill="#FFFFFF" opacity="0.6" />
                                            </g>
                                        )}
                                    </svg>
                                </div>
                            )}

                            {/* Barra de Progresso (XP Bar) */}
                            <div className="w-full h-2 md:h-3 border relative" style={{ borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#ccc' }}>
                                <div 
                                    className="h-full transition-all duration-500"
                                    style={{ 
                                        width: `${percentage}%`, 
                                        backgroundColor: isMinimalist 
                                            ? (isGoalMet ? '#FFF' : '#FFF') 
                                            : (isGoalMet ? colors.green.main : colors.blue.main),
                                    }}
                                />
                            </div>
                            
                            {/* Texto Minutos (Opcional, só se couber ou hover) */}
                            <div className="text-[6px] md:text-[8px] truncate w-full text-center font-bold" 
                                 style={{ fontFamily: 'monospace', color: isMinimalist ? '#FFF' : '#666' }}>
                                {studiedMinutes}m
                            </div>

                            {/* Marcador de "Hoje" */}
                            {isCurrentDay && (
                                <div 
                                    className="absolute -top-2 -right-2 text-[8px] px-1 border animate-bounce z-10"
                                    style={{ 
                                        fontFamily: THEME.font, 
                                        backgroundColor: isMinimalist ? '#000' : colors.red.main,
                                        color: isMinimalist ? '#FFF' : '#FFF',
                                        borderColor: isMinimalist ? '#FFF' : '#000'
                                    }}
                                >
                                    TODAY
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
}