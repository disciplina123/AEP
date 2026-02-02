import React, { useState, useEffect } from 'react';
import { RetroButton, THEME, play8BitSound, getThemeColors } from './RetroUtils';
import { Subject } from './StudyMaterials';

const DEFAULT_TIME = 25 * 60; // 25 minutos

interface PixelTimerProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  onStudyUpdate: (minutes: number) => void;
  themeMode: 'mario' | 'minimalist';
}

export default function PixelTimer({ subjects, setSubjects, onStudyUpdate, themeMode }: PixelTimerProps) {
  // Estados do Timer
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [initialTime, setInitialTime] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Novo estado de pausa
  const [isBreakMode, setIsBreakMode] = useState(false);
  
  // Estados de Missão e Modais
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [currentMissionName, setCurrentMissionName] = useState<string>('NO MISSION');
  
  // Controle de Modais
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showBreakMenu, setShowBreakMenu] = useState(false);

  // Stats e Conclusão
  const [isMissionCompleted, setIsMissionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: '', correct: '' });

  // Armazena o tempo decorrido da sessão atual para registrar
  const [lastSessionTime, setLastSessionTime] = useState(0);

  // Estado local para controle de expansão no modal
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<number[]>([]);

  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Tempo acabou
      handleStop();
      play8BitSound('alarm');
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Formata MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (amount: number) => {
    if (isActive || isPaused) return;
    const newTime = Math.max(60, initialTime + amount);
    setInitialTime(newTime);
    setTimeLeft(newTime);
  };

  // --- LÓGICA DE START / PAUSE / RESUME ---
  const handleMainButtonClick = () => {
    if (isPaused) {
        handleResume();
    } else if (isActive) {
        handlePause();
    } else {
        // Se está parado, abre modal de seleção
        play8BitSound('open');
        setShowSelectModal(true);
    }
  };

  const handlePause = () => {
      setIsActive(false);
      setIsPaused(true);
      play8BitSound('pause'); // Som de pausa
  };

  const handleResume = () => {
      setIsActive(true);
      setIsPaused(false);
      play8BitSound('jump'); // Som de retomar
  };

  const confirmStart = () => {
    if (!selectedQuestId) {
        play8BitSound('stomp');
        alert("SELECT A QUEST FIRST!");
        return;
    }

    // Busca os detalhes da missão selecionada
    let name = "UNKNOWN MISSION";
    let found = false;

    for (const sub of subjects) {
        for (const book of sub.books) {
            for (const chap of book.chapters) {
                const quest = chap.quests.find(q => q.id === selectedQuestId);
                if (quest) {
                    name = `${sub.title}: ${quest.text}`; 
                    found = true;
                    break;
                }
            }
            if(found) break;
        }
        if(found) break;
    }
    
    setCurrentMissionName(name);
    setIsBreakMode(false);
    setIsPaused(false);
    
    // Inicia
    play8BitSound('powerup');
    setShowSelectModal(false);
    setIsActive(true);
  };

  const toggleSubject = (id: number) => {
    play8BitSound('jump');
    setExpandedSubjectIds(prev => 
      prev.includes(id) 
        ? prev.filter(subjectId => subjectId !== id) 
        : [...prev, id]
    );
  };

  // --- LÓGICA DE STOP (FINALIZAR SESSÃO) ---
  const handleStop = () => {
      setIsActive(false);
      setIsPaused(false);

      // Calcular tempo estudado (em segundos)
      const elapsedSeconds = initialTime - timeLeft;
      
      // Se não for modo descanso e tiver passado pelo menos 1 minuto (para evitar clicks acidentais)
      if (!isBreakMode && elapsedSeconds > 5) {
          const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
          onStudyUpdate(elapsedMinutes);
          setLastSessionTime(elapsedMinutes);
      } else {
          setLastSessionTime(0);
      }
      
      // Se estava em modo descanso, apenas reseta
      if (isBreakMode) {
          play8BitSound('pipe');
          setIsBreakMode(false);
          setInitialTime(DEFAULT_TIME);
          setTimeLeft(DEFAULT_TIME);
          setCurrentMissionName('NO MISSION');
          return;
      }

      play8BitSound('pipe');
      setShowResultModal(true);
  };

  // --- LÓGICA DE FINALIZAR TAREFA E ABRIR MENU DE DESCANSO ---
  const submitResults = () => {
      // Se marcou como completo, atualiza o StudyMaterials
      if (isMissionCompleted && selectedQuestId) {
          setSubjects(prev => prev.map(sub => ({
              ...sub,
              books: sub.books.map(book => ({
                  ...book,
                  chapters: book.chapters.map(chap => ({
                      ...chap,
                      quests: chap.quests.map(quest => 
                          quest.id === selectedQuestId ? { ...quest, completed: true } : quest
                      )
                  }))
              }))
          })));
      }
      
      play8BitSound('1up'); // Som de vida extra ao completar
      setShowResultModal(false);
      setIsMissionCompleted(false); // Reset Checkbox
      setSessionStats({ total: '', correct: '' }); // Reset Stats
      setSelectedQuestId(null); // Reseta a missão
      setCurrentMissionName('NO MISSION');
      
      // Abre o menu de descanso
      setShowBreakMenu(true);
  };

  // --- LÓGICA DE INICIAR DESCANSO ---
  const startBreak = (minutes: number) => {
      const breakTime = minutes * 60;
      setInitialTime(breakTime);
      setTimeLeft(breakTime);
      setIsBreakMode(true);
      setIsPaused(false);
      setCurrentMissionName("RECOVER ENERGY");
      setShowBreakMenu(false);
      setIsActive(true);
      play8BitSound('powerup');
  };

  // --- PULAR DESCANSO ---
  const skipBreak = () => {
      setInitialTime(DEFAULT_TIME);
      setTimeLeft(DEFAULT_TIME);
      setIsBreakMode(false);
      setIsPaused(false);
      setShowBreakMenu(false);
      play8BitSound('jump');
  };

  const resetTimer = () => {
    if (isActive || isPaused) return;
    play8BitSound('break');
    setTimeLeft(initialTime);
  };

  // --- VISUAL ---
  const progressPercentage = Math.max(0, (timeLeft / initialTime) * 100);

  // Cores da Barra de Energia (Vibrantes conforme arquivo original, ou Branco no Minimalista)
  let barColor = isMinimalist ? '#FFFFFF' : '#FFDE00'; // Amarelo Neon ou Branco
  if (!isMinimalist) {
      if (isBreakMode) barColor = '#40FF40'; // Verde Neon
      else if (progressPercentage < 15) barColor = '#FF3030'; // Vermelho Neon
  }
  
  const hasQuests = subjects.some(s => s.books.some(b => b.chapters.some(c => c.quests.length > 0)));

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl animate-in fade-in zoom-in duration-300 relative">
      
      {/* --- MODAL DE SELEÇÃO DE MISSÃO --- */}
      {showSelectModal && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-1 w-full max-w-2xl animate-in zoom-in duration-200 pointer-events-auto"
             style={{ 
                 backgroundColor: colors.ui.background, 
                 border: `4px solid ${isMinimalist ? '#FFF' : '#000'}`, 
                 boxShadow: isMinimalist ? '8px 8px 0px #FFF' : '8px 8px 0px rgba(0,0,0,0.5)' 
             }}>
            <div className="flex flex-col gap-4 p-4 max-h-[80vh]">
                <h3 className="text-center text-lg mb-2" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>
                    SELECT YOUR QUEST
                </h3>
                
                <div className="border-4 p-2 overflow-y-auto custom-scrollbar flex-1 min-h-[300px]"
                     style={{ 
                         borderColor: isMinimalist ? '#FFF' : '#000',
                         backgroundColor: isMinimalist ? '#000' : '#fff'
                     }}>
                    {!hasQuests && (
                        <div className="text-center mt-10 text-xs" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#6b7280' }}>
                            NO QUESTS AVAILABLE.<br/>GO TO MATERIALS TO ADD TASKS.
                        </div>
                    )}

                    {subjects.map(subject => {
                        const subjectHasQuests = subject.books.some(b => b.chapters.some(c => c.quests.length > 0));
                        if (!subjectHasQuests) return null;

                        const isExpanded = expandedSubjectIds.includes(subject.id);

                        return (
                            <div key={subject.id} className="mb-4">
                                <div 
                                    onClick={() => toggleSubject(subject.id)}
                                    className="cursor-pointer flex items-center select-none transition-colors p-2" 
                                    style={{ 
                                        fontFamily: THEME.font, 
                                        backgroundColor: isMinimalist ? (isExpanded ? '#333' : '#000') : (isExpanded ? '#FFFFCE' : '#F0F0F0'), 
                                        borderBottom: `2px solid ${isMinimalist ? '#FFF' : '#000'}`,
                                        color: isMinimalist ? '#FFF' : '#000'
                                    }}
                                >
                                    <span className="mr-2 text-[10px]">{isExpanded ? '▼' : '▶'}</span>
                                    <span className="text-xs font-bold">{subject.title}</span>
                                </div>
                                
                                {isExpanded && (
                                    <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-150 p-2">
                                        {subject.books.flatMap(book => 
                                            book.chapters.flatMap(chapter => 
                                                chapter.quests.map(quest => (
                                                    <div 
                                                        key={quest.id}
                                                        onClick={() => {
                                                            play8BitSound('click');
                                                            setSelectedQuestId(quest.id);
                                                        }}
                                                        className={`
                                                            group cursor-pointer p-2 flex items-center gap-3 transition-all border-2
                                                            ${selectedQuestId === quest.id 
                                                                ? (isMinimalist ? 'bg-white border-white translate-x-2 text-black' : 'bg-[#E09040] border-black translate-x-2 text-white') 
                                                                : 'bg-transparent border-transparent hover:border-gray-200'
                                                            }
                                                        `}
                                                        style={ isMinimalist && selectedQuestId !== quest.id ? { color: '#FFF' } : {} }
                                                    >
                                                        <div className={`
                                                            w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center
                                                            ${selectedQuestId === quest.id ? (isMinimalist ? 'border-black' : 'border-white') : (isMinimalist ? 'border-white' : 'border-black')}
                                                            ${quest.completed ? (isMinimalist ? 'bg-black' : 'bg-[#00D020]') : (isMinimalist ? 'bg-transparent' : 'bg-white')}
                                                        `}>
                                                            {quest.completed && <div className={`w-2 h-2 ${isMinimalist ? 'bg-white' : 'bg-white'}`} />}
                                                        </div>

                                                        <div className="flex-1 flex flex-col">
                                                            <span 
                                                                className={`text-xs leading-tight ${quest.completed ? 'line-through opacity-70' : ''}`}
                                                                style={{ fontFamily: THEME.font }}
                                                            >
                                                                {quest.text}
                                                            </span>
                                                        </div>

                                                        <div className={`
                                                            text-[8px] text-right uppercase
                                                            ${selectedQuestId === quest.id ? (isMinimalist ? 'text-black' : 'text-white') : 'text-gray-500'}
                                                        `} style={{ fontFamily: THEME.font }}>
                                                            {chapter.title}
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-4 mt-2">
                    <RetroButton onClick={() => setShowSelectModal(false)} colorType="red" size="md" title="Cancel" sound="pipe" themeMode={themeMode}>
                        CANCEL
                    </RetroButton>
                    <RetroButton onClick={confirmStart} colorType="green" size="md" title="Start Quest" sound="coin" themeMode={themeMode}>
                        GO!
                    </RetroButton>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE RESULTADOS --- */}
      {showResultModal && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 border-4 border-black p-1 w-full max-w-lg animate-in slide-in-from-top duration-300 pointer-events-auto"
             style={{ backgroundColor: colors.ui.background, boxShadow: '8px 8px 0px rgba(0,0,0,0.5)', borderColor: isMinimalist ? '#FFF' : '#000' }}>
            <div className="p-6 flex flex-col gap-6 items-center">
                <h3 
                    className="text-center text-3xl mb-2 tracking-wide whitespace-nowrap" 
                    style={{ 
                        fontFamily: THEME.font, 
                        color: isMinimalist ? '#FFF' : '#FFD700', 
                        textShadow: isMinimalist ? 'none' : '3px 3px 0 #000',
                        WebkitTextStroke: isMinimalist ? '0px' : '1.5px #000'
                    }}
                >
                    COURSE CLEAR!
                </h3>

                {lastSessionTime > 0 && (
                     <div className="text-center border-2 border-black p-2 w-full" style={{ backgroundColor: isMinimalist ? '#000' : '#5c94fc', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                        <p className="text-xs text-white" style={{ fontFamily: THEME.font, textShadow: isMinimalist ? 'none' : '1px 1px 0 #000' }}>
                            SESSION TIME: {lastSessionTime} MIN ADDED!
                        </p>
                     </div>
                )}
                
                <div className="flex gap-4 w-full px-4 border-b-2 border-black/10 pb-4">
                    <div className="flex-1">
                        <label className="block text-[10px] mb-1 text-center" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#6b7280' }}>QUESTIONS DONE</label>
                        <input 
                            type="number" 
                            value={sessionStats.total}
                            onChange={(e) => setSessionStats({...sessionStats, total: e.target.value})}
                            placeholder="0"
                            className="w-full p-2 border-2 text-center font-bold focus:outline-none transition-colors text-xl placeholder-gray-400"
                            style={{ 
                                fontFamily: THEME.font,
                                backgroundColor: isMinimalist ? '#000' : '#FFF',
                                color: isMinimalist ? '#FFF' : '#000',
                                borderColor: isMinimalist ? '#FFF' : '#000'
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] mb-1 text-center" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#6b7280' }}>CORRECT</label>
                        <input 
                            type="number" 
                            value={sessionStats.correct}
                            onChange={(e) => setSessionStats({...sessionStats, correct: e.target.value})}
                            placeholder="0"
                            className="w-full p-2 border-2 text-center font-bold focus:outline-none transition-colors text-xl placeholder-gray-400"
                            style={{ 
                                fontFamily: THEME.font,
                                backgroundColor: isMinimalist ? '#000' : '#FFF',
                                color: isMinimalist ? '#FFF' : '#000',
                                borderColor: isMinimalist ? '#FFF' : '#000'
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <p 
                        className="text-center text-sm leading-relaxed" 
                        style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}
                    >
                        DID YOU COMPLETE THE TASK?
                    </p>
                    
                    <div 
                        onClick={() => {
                            play8BitSound('click');
                            setIsMissionCompleted(!isMissionCompleted);
                        }}
                        className="flex items-center gap-4 cursor-pointer group hover:scale-105 transition-transform"
                    >
                        <div className={`
                            w-10 h-10 border-4 border-black flex items-center justify-center transition-all bg-white shadow-[4px_4px_0_rgba(0,0,0,0.2)]
                            ${isMissionCompleted ? (isMinimalist ? 'bg-black' : 'bg-[#00D020]') : ''}
                        `}
                        style={{ borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#fff', boxShadow: isMinimalist ? '4px 4px 0 #FFF' : undefined }}
                        >
                            {isMissionCompleted && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 17L19 8" stroke={isMinimalist ? '#FFF' : '#000'} strokeWidth="4" strokeLinecap="square" style={{ shapeRendering: 'crispEdges' }}/>
                                </svg>
                            )}
                        </div>
                        
                        <span 
                            className="text-xl select-none" 
                            style={{ 
                                fontFamily: THEME.font, 
                                color: isMissionCompleted ? (isMinimalist ? '#FFF' : '#00D020') : '#888',
                                textShadow: isMinimalist ? 'none' : '2px 2px 0 #000'
                            }}
                        >
                            YES!
                        </span>
                    </div>
                </div>

                <div className="mt-2 w-full">
                    <RetroButton onClick={submitResults} colorType="blue" size="lg" title="Finish" sound="coin" className="w-full" themeMode={themeMode}>
                        FINISH
                    </RetroButton>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE OPÇÕES DE DESCANSO --- */}
      {showBreakMenu && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 border-4 border-black p-1 w-full max-w-3xl animate-in zoom-in duration-200 pointer-events-auto"
             style={{ backgroundColor: colors.ui.background, boxShadow: '8px 8px 0px rgba(0,0,0,0.5)', borderColor: isMinimalist ? '#FFF' : '#000' }}>
             <div className="border-4 border-white p-8 flex flex-col gap-8 items-center justify-center min-h-[500px]"
                  style={{ backgroundColor: isMinimalist ? '#000' : '#5c94fc', borderColor: isMinimalist ? '#FFF' : '#FFF' }}>
                 <h3 
                    className="text-center text-4xl mb-4 text-white" 
                    style={{ 
                        fontFamily: THEME.font,
                        textShadow: isMinimalist ? 'none' : '4px 4px 0 #000'
                    }}
                >
                    TAKE A BREAK?
                </h3>

                <div className="flex gap-8 w-full justify-center">
                    <RetroButton onClick={() => startBreak(5)} colorType="green" size="lg" className="flex-1 text-2xl py-6 h-24" title="5 Min Break" themeMode={themeMode}>
                        5 MIN
                    </RetroButton>
                    <RetroButton onClick={() => startBreak(10)} colorType="green" size="lg" className="flex-1 text-2xl py-6 h-24" title="10 Min Break" themeMode={themeMode}>
                        10 MIN
                    </RetroButton>
                </div>

                <div className="w-full mt-6">
                     <RetroButton onClick={skipBreak} colorType="gray" size="lg" className="w-full py-4 text-xl h-16" title="Skip Break" themeMode={themeMode}>
                        SKIP & RESTART
                    </RetroButton>
                </div>
             </div>
        </div>
      )}


      {/* --- TIMER UI PRINCIPAL --- */}
      <div className="flex flex-col items-center w-full mb-10">
        
        {/* Nome da Missão Atual */}
        {(isActive || isPaused) && (
            <div className={`mb-4 px-4 py-2 rounded-full border-2 border-white/20 backdrop-blur-md ${isBreakMode ? (isMinimalist ? 'bg-black border-white' : 'bg-green-900/50') : (isMinimalist ? 'bg-black border-white' : 'bg-black/50')}`}>
                <span className={`text-xs tracking-widest ${isBreakMode ? (isMinimalist ? 'text-white' : 'text-green-300') : 'text-white'}`} style={{ fontFamily: THEME.font }}>
                    {isBreakMode ? '>>> REST MODE <<<' : `MISSION: ${currentMissionName}`}
                </span>
            </div>
        )}

        {/* Timer Text - Cores Vibrantes/Neon conforme arquivo original, ou Branco no Minimalista */}
        <div className="mb-6 relative group">
            <div 
              className={`text-center leading-none select-none drop-shadow-lg transition-colors duration-300
                ${timeLeft === 0 ? 'animate-pulse text-red-500' : ''}
                ${isPaused ? 'animate-pulse' : ''}
              `}
              style={{ 
                fontFamily: THEME.font, 
                fontSize: '4.5rem',
                WebkitTextStroke: isMinimalist ? '0px' : '3px #000',
                textShadow: isMinimalist ? 'none' : '6px 6px 0px rgba(0,0,0,0.7)',
                color: isMinimalist 
                    ? '#FFFFFF' 
                    : (timeLeft === 0 ? '#FF3030' : isBreakMode ? '#40FF40' : (isPaused ? '#FFFF00' : '#FFF'))
              }}
            >
              {formatTime(timeLeft)}
            </div>
        </div>

        {/* Energy Bar */}
        <div 
            className="relative w-full max-w-md h-12 box-border transition-transform hover:scale-105"
            style={{
                backgroundColor: '#101010',
                border: '4px solid #000',
                boxShadow: isMinimalist ? '8px 8px 0px #FFF' : '8px 8px 0px rgba(0,0,0,0.6)',
                outline: '4px solid #404040',
                borderColor: isMinimalist ? '#FFF' : '#000'
            }}
        >
            {!isMinimalist && (
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #202020 10px, #202020 20px)' }} 
                />
            )}

            <div 
                style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    backgroundImage: isMinimalist ? 'none' : `
                        linear-gradient(
                          45deg, 
                          rgba(255, 255, 255, 0.4) 25%, 
                          transparent 25%, 
                          transparent 50%, 
                          rgba(255, 255, 255, 0.4) 50%, 
                          rgba(255, 255, 255, 0.4) 75%, 
                          transparent 75%, 
                          transparent
                        )
                    `,
                    backgroundSize: '30px 30px',
                    transition: 'width 1s linear, background-color 0.5s ease',
                    borderRight: isMinimalist ? 'none' : '4px solid #000',
                    position: 'relative',
                    overflow: 'hidden',
                    filter: isPaused ? 'grayscale(0.7)' : 'none'
                }}
            >
                {!isMinimalist && <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-60" />}
            </div>
        </div>

        {/* Status Text - Cores Vibrantes ou Branco */}
        <div 
            className={`mt-4 text-sm tracking-widest ${!isActive && !isPaused ? 'animate-pulse' : ''}`}
            style={{ 
                fontFamily: THEME.font, 
                color: isMinimalist ? '#FFF' : (timeLeft === 0 ? '#FF3030' : isBreakMode ? '#40FF40' : (isPaused ? '#FFFF00' : '#fff')),
                textShadow: isMinimalist ? 'none' : '2px 2px 0px #000'
            }}
        >
            {
                timeLeft === 0 ? '!!! TIME OVER !!!' : 
                isPaused ? '>>> PAUSED <<<' :
                isActive ? (isBreakMode ? 'RECHARGING...' : '>>> STUDYING >>>') : 
                'PRESS START'
            }
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 items-center w-full">
        
        {/* Botão Principal: START / PAUSE / RESUME */}
        <RetroButton 
            onClick={handleMainButtonClick} 
            colorType={isPaused ? 'green' : isActive ? 'orange' : 'green'} 
            size="lg"
            sound={isActive ? 'pipe' : 'open'}
            themeMode={themeMode}
        >
            {isPaused ? 'RESUME' : isActive ? 'PAUSE' : 'START'}
        </RetroButton>
        
        {/* Botão Secundário: FINISH (Aparece apenas se Pausado ou Ativo - para encerrar) */}
        {(isPaused || isActive) && (
             <RetroButton 
                onClick={handleStop} 
                colorType="red" 
                size="md"
                sound="pipe"
                className="mt-2 text-xs"
                themeMode={themeMode}
            >
                FINISH SESSION
            </RetroButton>
        )}

        {/* Controles de ajuste de tempo (só aparecem se NÃO estiver rodando NEM pausado) */}
        {!isActive && !isPaused && (
            <div className="flex gap-6 items-center mt-2 animate-in fade-in duration-300">
            <RetroButton onClick={() => adjustTime(-60)} colorType="orange" size="icon" title="-1 Min" themeMode={themeMode}>
                -
            </RetroButton>

            <RetroButton onClick={resetTimer} colorType="blue" size="sm" title="Reset" sound="pipe" themeMode={themeMode}>
                RST
            </RetroButton>

            <RetroButton onClick={() => adjustTime(60)} colorType="orange" size="icon" title="+1 Min" themeMode={themeMode}>
                +
            </RetroButton>
            </div>
        )}
      </div>
    </div>
  );
}