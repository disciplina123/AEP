import React, { useState, useEffect } from 'react';
import SuperMarioBackground from './components/SuperMarioBackground';
import MinimalistBackground from './components/MinimalistBackground';
import PixelTimer from './components/PixelTimer';
import StudyMaterials, { Subject } from './components/StudyMaterials';
import StudyCalendar from './components/StudyCalendar';
import StudyStatus from './components/StudyStatus';
import Agenda from './components/Agenda';
import MusicPlayer from './components/MusicPlayer';
import Settings from './components/Settings';
import { RetroButton } from './components/RetroUtils';

type ViewType = 'timer' | 'materials' | 'calendar' | 'agenda' | 'status' | 'settings';
export type ThemeMode = 'mario' | 'minimalist';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('timer');
  // Estado elevado para ser compartilhado entre Materials e Timer
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('subjects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  // --- AUTO TIME MODE ---
  const [autoTimeMode, setAutoTimeMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoTimeMode');
    return saved !== null ? saved === 'true' : false; // default OFF
  });

  // --- THEME MODE ---
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved === 'minimalist') ? 'minimalist' : 'mario';
  });

  useEffect(() => {
    localStorage.setItem('autoTimeMode', autoTimeMode.toString());
  }, [autoTimeMode]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // --- NOVA FUNCIONALIDADE: META DE ESTUDO ---
  const [dailyGoal, setDailyGoal] = useState<number>(60); // Meta padrão: 60 minutos
  const [studyLog, setStudyLog] = useState<Record<string, number>>({}); // Formato: "YYYY-MM-DD": minutos

  // Carregar dados salvos
  useEffect(() => {
    const savedLog = localStorage.getItem('studyLog');
    const savedGoal = localStorage.getItem('dailyGoal');
    if (savedLog) setStudyLog(JSON.parse(savedLog));
    if (savedGoal) setDailyGoal(Number(savedGoal));
  }, []);

  // Salvar dados quando mudam
  useEffect(() => {
    localStorage.setItem('studyLog', JSON.stringify(studyLog));
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [studyLog, dailyGoal]);

  // Função chamada pelo Timer ao finalizar uma sessão
  const handleStudyUpdate = (minutes: number) => {
    const today = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD consistente
    setStudyLog(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + minutes
    }));
  };

  const getBackgroundComponent = () => {
    switch(themeMode) {
      case 'minimalist': return <MinimalistBackground />;
      default: return <SuperMarioBackground autoTimeMode={autoTimeMode} />;
    }
  };

  const getSideMenuColors = () => {
      switch(themeMode) {
          case 'minimalist': return 'bg-black border-white';
          default: return 'bg-black/40 border-black/20';
      }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Camada de Fundo (Canvas) */}
      <div className="absolute inset-0 z-0">
        {getBackgroundComponent()}
      </div>

      {/* Camada de UI Principal - Centralizada */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto transform translate-y-[-20px] w-full max-w-6xl flex justify-center">
          {currentView === 'timer' && (
             <PixelTimer 
                subjects={subjects} 
                setSubjects={setSubjects} 
                onStudyUpdate={handleStudyUpdate}
                themeMode={themeMode}
             />
          )}
          {currentView === 'materials' && (
             <StudyMaterials 
                subjects={subjects} 
                setSubjects={setSubjects}
                themeMode={themeMode}
             />
          )}
          {currentView === 'calendar' && (
             <StudyCalendar 
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                studyLog={studyLog}
                themeMode={themeMode}
             />
          )}
          {currentView === 'agenda' && (
             <Agenda 
                themeMode={themeMode}
             />
          )}
          {currentView === 'status' && (
             <StudyStatus 
                subjects={subjects}
                studyLog={studyLog}
                themeMode={themeMode}
             />
          )}
          {currentView === 'settings' && (
             <Settings 
                subjects={subjects}
                setSubjects={setSubjects}
                studyLog={studyLog}
                setStudyLog={setStudyLog}
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                autoTimeMode={autoTimeMode}
                setAutoTimeMode={setAutoTimeMode}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
             />
          )}
        </div>
      </div>

      {/* Camada Lateral (Navegação) */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-4 pointer-events-auto">
         
         <div className={`p-3 rounded-lg backdrop-blur-sm border-2 ${getSideMenuColors()}`}>
            <div className="flex flex-col gap-6">
                <RetroButton 
                    onClick={() => setCurrentView('timer')} 
                    colorType={currentView === 'timer' ? 'vibrantRed' : 'gray'} 
                    size="icon" 
                    title="Timer"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Relógio Pixelado */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 2H14V5H10V2ZM5 7H19V21H5V7ZM7 9H17V19H7V9ZM11 10H13V13H15V15H11V10Z" />
                    </svg>
                </RetroButton>

                <RetroButton 
                    onClick={() => setCurrentView('materials')} 
                    colorType={currentView === 'materials' ? 'blue' : 'gray'} 
                    size="icon" 
                    title="Study Materials"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Livro Pixelado */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 5H11V21H3V5ZM5 7H9V19H5V7ZM13 5H21V21H13V5ZM15 7H19V19H15V7Z" />
                    </svg>
                </RetroButton>

                <RetroButton 
                    onClick={() => setCurrentView('calendar')} 
                    colorType={currentView === 'calendar' ? 'green' : 'gray'} 
                    size="icon" 
                    title="Calendar"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Calendário Pixelado */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5 4H19V20H5V4ZM7 2V5H9V2H7ZM15 2V5H17V2H15ZM7 8H17V18H7V8ZM9 10H11V12H9V10ZM13 10H15V12H13V10ZM9 14H11V16H9V14ZM13 14H15V16H13V14Z" />
                    </svg>
                </RetroButton>

                {/* BOTÃO AGENDA */}
                <RetroButton 
                    onClick={() => setCurrentView('agenda')} 
                    colorType={currentView === 'agenda' ? 'orange' : 'gray'} 
                    size="icon" 
                    title="Agenda"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Clipboard/Lista */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8 2H16V4H8V2ZM6 6H18V20H6V6ZM8 8H16V10H8V8ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z" />
                    </svg>
                </RetroButton>

                <RetroButton 
                    onClick={() => setCurrentView('status')} 
                    colorType={currentView === 'status' ? 'yellow' : 'gray'} 
                    size="icon" 
                    title="Status"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Estatísticas Pixelado */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 20H21V22H3V20ZM5 14H9V19H5V14ZM11 10H15V19H11V10ZM17 6H21V19H17V6Z" />
                    </svg>
                </RetroButton>

                <RetroButton 
                    onClick={() => setCurrentView('settings')} 
                    colorType={currentView === 'settings' ? 'purple' : 'gray'} 
                    size="icon" 
                    title="Settings"
                    sound="open"
                    themeMode={themeMode}
                >
                    {/* Ícone de Engrenagem Pixelado */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 2H14V6H10V2ZM14 6H18V10H14V6ZM18 10H22V14H18V10ZM18 14H14V18H18V14ZM14 18H10V22H14V18ZM10 18H6V14H10V18ZM6 14H2V10H6V14ZM6 10H10V6H6V10ZM10 10H14V14H10V10Z" />
                    </svg>
                </RetroButton>
            </div>
         </div>

      </div>

      {/* Music Player */}
      <div>
        <MusicPlayer themeMode={themeMode} />
      </div>
    </div>
  );
}