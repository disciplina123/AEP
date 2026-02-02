import React, { useState } from 'react';
import { RetroButton, THEME, play8BitSound, getThemeColors } from './RetroUtils';
import { Subject } from './StudyMaterials';

interface SettingsProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  studyLog: Record<string, number>;
  setStudyLog: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  dailyGoal: number;
  setDailyGoal: React.Dispatch<React.SetStateAction<number>>;
  autoTimeMode: boolean;
  setAutoTimeMode: React.Dispatch<React.SetStateAction<boolean>>;
  themeMode: 'mario' | 'minimalist';
  setThemeMode: React.Dispatch<React.SetStateAction<'mario' | 'minimalist'>>;
}

export default function Settings({ 
  subjects, 
  setSubjects, 
  studyLog, 
  setStudyLog,
  dailyGoal,
  setDailyGoal,
  autoTimeMode,
  setAutoTimeMode,
  themeMode,
  setThemeMode
}: SettingsProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');

  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  // Função para exportar todos os dados
  const handleExport = () => {
    try {
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        subjects,
        studyLog,
        dailyGoal,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `super-mario-study-backup-${new Date().toLocaleDateString('en-CA')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      play8BitSound('coin');
      setMessage('✅ Backup exportado!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      play8BitSound('hurt');
      setMessage('❌ Erro ao exportar');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  // Função para importar dados
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validação básica
        if (!data.subjects || !data.studyLog || data.dailyGoal === undefined) {
          throw new Error('Formato inválido');
        }

        // Importar dados
        setSubjects(data.subjects);
        setStudyLog(data.studyLog);
        setDailyGoal(data.dailyGoal);

        // Salvar no localStorage
        localStorage.setItem('subjects', JSON.stringify(data.subjects));
        localStorage.setItem('studyLog', JSON.stringify(data.studyLog));
        localStorage.setItem('dailyGoal', data.dailyGoal.toString());

        play8BitSound('powerup');
        setMessage('✅ Backup importado!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        play8BitSound('hurt');
        setMessage('❌ Arquivo inválido');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Função para criar backup no localStorage
  const handleBackupToStorage = () => {
    try {
      const backupKey = `backup-${new Date().toISOString()}`;
      const data = {
        subjects,
        studyLog,
        dailyGoal,
      };
      
      localStorage.setItem(backupKey, JSON.stringify(data));
      
      play8BitSound('coin');
      setMessage('✅ Backup salvo!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      play8BitSound('hurt');
      setMessage('❌ Erro ao salvar');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  // Função para resetar todos os dados
  const handleReset = () => {
    if (!confirm('⚠️ Resetar todos os dados?')) {
      return;
    }

    try {
      setSubjects([]);
      setStudyLog({});
      setDailyGoal(60);

      localStorage.removeItem('subjects');
      localStorage.removeItem('studyLog');
      localStorage.removeItem('dailyGoal');

      play8BitSound('hurt');
      setMessage('🗑️ Dados resetados');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      play8BitSound('hurt');
      setMessage('❌ Erro ao resetar');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  // Estilos comuns para containers internos
  const containerStyle = {
    backgroundColor: isMinimalist ? '#000' : '#fff',
    borderColor: isMinimalist ? '#fff' : (isMinimalist ? '#fff' : '#000'),
    color: isMinimalist ? '#fff' : '#000'
  };

  // Estilo para itens de lista/linhas
  const itemStyle = (defaultBg: string, borderCol: string) => ({
    backgroundColor: isMinimalist ? '#000' : defaultBg,
    borderColor: isMinimalist ? '#fff' : borderCol,
    color: isMinimalist ? '#fff' : '#000',
    border: isMinimalist ? '2px solid #fff' : undefined
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border-4 border-black rounded-lg shadow-2xl overflow-hidden"
           style={{ backgroundColor: colors.ui.background, boxShadow: isMinimalist ? '8px 8px 0 #fff' : '8px 8px 0 rgba(0,0,0,0.5)', borderColor: isMinimalist ? '#fff' : '#000' }}>
        
        {/* Header */}
        <div className="border-b-4 border-black p-4 text-center relative"
             style={{ backgroundColor: colors.yellow.main, borderColor: isMinimalist ? '#fff' : '#000' }}>
          <h2 className="text-xl font-bold drop-shadow-md tracking-wider"
              style={{ fontFamily: THEME.font, color: colors.yellow.text, textShadow: isMinimalist ? 'none' : '2px 2px 0 white' }}>
            SETTINGS
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Notificações */}
          {showSuccess && (
            <div className="bg-green-500 border-4 border-green-700 text-white p-3 rounded-lg text-center text-sm animate-bounce"
                 style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : undefined, borderColor: isMinimalist ? '#fff' : undefined, color: isMinimalist ? '#fff' : undefined }}>
              {message}
            </div>
          )}
          {showError && (
            <div className="bg-red-500 border-4 border-red-700 text-white p-3 rounded-lg text-center text-sm animate-bounce"
                 style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : undefined, borderColor: isMinimalist ? '#fff' : undefined, color: isMinimalist ? '#fff' : undefined }}>
              {message}
            </div>
          )}

          {/* Seção de Backup */}
          <div className="border-4 border-black rounded-lg p-4 space-y-3" style={containerStyle}>
            <h3 className="text-sm font-bold mb-3 pb-2 border-b-2"
                style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#fff' : '#e5e7eb', color: isMinimalist ? '#fff' : '#1f2937' }}>
              BACKUP
            </h3>

            <div className="space-y-2">
              {/* Exportar */}
              <div className="flex items-center justify-between gap-3 p-2 border-2 rounded" style={itemStyle('#e6ffe6', '#86efac')}>
                <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#1f2937' }}>
                  EXPORT
                </span>
                <RetroButton onClick={handleExport} colorType="green" size="small" sound="coin" themeMode={themeMode}>
                  EXPORT
                </RetroButton>
              </div>

              {/* Importar */}
              <div className="flex items-center justify-between gap-3 p-2 border-2 rounded" style={itemStyle('#e6f2ff', '#93c5fd')}>
                <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#1f2937' }}>
                  IMPORT
                </span>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <RetroButton as="span" colorType="blue" size="small" sound="open" themeMode={themeMode}>
                    IMPORT
                  </RetroButton>
                </label>
              </div>

              {/* Backup Local */}
              <div className="flex items-center justify-between gap-3 p-2 border-2 rounded" style={itemStyle('#fffde6', '#fde047')}>
                <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#1f2937' }}>
                  QUICK SAVE
                </span>
                <RetroButton onClick={handleBackupToStorage} colorType="yellow" size="small" sound="coin" themeMode={themeMode}>
                  SAVE
                </RetroButton>
              </div>
            </div>
          </div>

          {/* Seção de Customização */}
          <div className="border-4 border-black rounded-lg p-4 space-y-3" style={containerStyle}>
            <h3 className="text-sm font-bold mb-3 pb-2 border-b-2"
                style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#fff' : '#e5e7eb', color: isMinimalist ? '#fff' : '#1f2937' }}>
              CUSTOMIZE
            </h3>

            <div className="space-y-2">
              {/* Modo de Horário Automático - Toggle */}
              <div 
                onClick={() => {
                  play8BitSound('click');
                  setAutoTimeMode(prev => !prev);
                }}
                className="flex items-center justify-between gap-3 p-2 border-2 rounded cursor-pointer transition-colors select-none"
                style={itemStyle('#e6f2ff', '#93c5fd')}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#1f2937' }}>
                    AUTO TIME MODE
                  </span>
                  <span className="text-[8px]" style={{ fontFamily: THEME.font, color: isMinimalist ? '#ccc' : '#4b5563' }}>
                    {autoTimeMode ? 'Background changes by time of day' : 'Background uses default palette'}
                  </span>
                </div>
                <div className={`px-3 py-1 text-[10px] font-bold rounded border-2 transition-colors ${autoTimeMode ? (isMinimalist ? 'bg-white text-black border-white' : 'bg-green-500 text-white border-green-700') : (isMinimalist ? 'bg-black text-white border-white' : 'bg-gray-400 text-white border-gray-600')}`}
                     style={{ fontFamily: THEME.font }}>
                  {autoTimeMode ? 'ON' : 'OFF'}
                </div>
              </div>

              {/* TEMA - Toggle */}
              <div className="flex flex-col gap-3 p-2 border-2 rounded" style={itemStyle('#f3e6ff', '#d8b4fe')}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#1f2937' }}>
                    WORLD THEME
                  </span>
                  <span className="text-[8px]" style={{ fontFamily: THEME.font, color: isMinimalist ? '#ccc' : '#4b5563' }}>
                    Select your map style
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => { play8BitSound('click'); setThemeMode('mario'); }}
                        className={`px-2 py-1 text-[8px] font-bold border-2 ${themeMode === 'mario' ? 'bg-yellow-400 border-black' : 'bg-gray-200 border-gray-400 text-gray-500'}`}
                        style={{ fontFamily: THEME.font }}>
                        MARIO
                    </button>
                    <button 
                        onClick={() => { play8BitSound('click'); setThemeMode('minimalist'); }}
                        className={`px-2 py-1 text-[8px] font-bold border-2 ${themeMode === 'minimalist' ? 'bg-white text-black border-white' : 'bg-gray-200 border-gray-400 text-gray-500'}`}
                        style={{ fontFamily: THEME.font }}>
                        MINI
                    </button>
                </div>
              </div>

            </div>
          </div>

          {/* Seção de Perigo */}
          <div className="bg-red-100 border-4 border-red-500 rounded-lg p-4 space-y-3" style={itemStyle(isMinimalist ? '#000' : '#fee2e2', isMinimalist ? '#fff' : '#ef4444')}>
            <h3 className="text-sm font-bold mb-3 pb-2 border-b-2"
                style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#991b1b', borderColor: isMinimalist ? '#fff' : '#f87171' }}>
              DANGER
            </h3>

            <div className="flex items-center justify-between gap-3 p-2 border-2 rounded" style={itemStyle(isMinimalist ? '#000' : '#fef2f2', isMinimalist ? '#fff' : '#fca5a5')}>
              <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#fff' : '#991b1b' }}>
                RESET ALL
              </span>
              <RetroButton onClick={handleReset} colorType="red" size="small" sound="hurt" themeMode={themeMode}>
                RESET
              </RetroButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}