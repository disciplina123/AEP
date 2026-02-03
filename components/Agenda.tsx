import React, { useState, useEffect } from 'react';
import { RetroButton, THEME, play8BitSound, getThemeColors } from './RetroUtils';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface AgendaItem {
  id: string; // Changed to string for better UUIDs
  task: string;
  completed: boolean;
}

interface TaskFolder {
    id: string;
    title: string;
    type: 'fixed' | 'normal'; // 'fixed' = Daily Routine (don't delete on complete), 'normal' = To-Do
    tasks: AgendaItem[];
}

interface BookItem {
  id: string;
  title: string;
  author: string;
  description?: string;
  completed?: boolean;
}

interface MangaItem {
  id: string;
  title: string;
  chapter: string; 
}

interface EventItem {
  id: string;
  title: string;
  date: string; 
}

interface ExamScores {
    linguagens: string;
    humanas: string;
    natureza: string;
    matematica: string;
}

interface ExamEntry {
    id: string;
    text?: string; 
    year?: number; 
    scores?: ExamScores;
}

interface ExamFolder {
    id: string;
    title: string;
    entries: ExamEntry[];
    isOpen: boolean; 
}

type ViewMode = 'menu' | 'tasks' | 'library' | 'exams' | 'manga' | 'events';

interface AgendaProps {
  themeMode: 'mario' | 'minimalist';
}

export default function Agenda({ themeMode }: AgendaProps) {
  // --- STATE: VIEW MODE ---
  const [viewMode, setViewMode] = useState<ViewMode>('menu');

  // --- STATE: TASKS (Refactored to Folders) ---
  const [taskFolders, setTaskFolders] = useState<TaskFolder[]>(() => {
    const savedFolders = localStorage.getItem('taskFolders');
    if (savedFolders) {
        return JSON.parse(savedFolders);
    }
    
    // Migration: Check for old single-list items
    const oldItems = localStorage.getItem('agendaItems');
    const migratedTasks = oldItems ? JSON.parse(oldItems) : [];
    const sanitizedTasks = migratedTasks.map((t: any) => ({...t, id: String(t.id)}));

    return [
        { id: 'daily-routine', title: 'DAILY ROUTINE', type: 'fixed', tasks: [] },
        { id: 'general-todo', title: 'GENERAL TASKS', type: 'normal', tasks: sanitizedTasks }
    ];
  });
  
  const [activeTaskFolderId, setActiveTaskFolderId] = useState<string | null>(null);
  const [newTaskFolderInput, setNewTaskFolderInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');

  // --- STATE: ROUTINE HISTORY (STREAK) ---
  const [routineHistory, setRoutineHistory] = useState<string[]>(() => {
      const saved = localStorage.getItem('routineHistory');
      return saved ? JSON.parse(saved) : [];
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- STATE: LIBRARY ---
  const [bookQuery, setBookQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BookItem[]>([]);
  const [savedBooks, setSavedBooks] = useState<BookItem[]>(() => {
      const saved = localStorage.getItem('savedBooks');
      return saved ? JSON.parse(saved) : [];
  });

  // --- STATE: MANGA ---
  const [mangaItems, setMangaItems] = useState<MangaItem[]>(() => {
      const saved = localStorage.getItem('mangaItems');
      return saved ? JSON.parse(saved) : [];
  });
  const [newMangaTitle, setNewMangaTitle] = useState('');
  const [newMangaChapter, setNewMangaChapter] = useState('');

  // --- STATE: EVENTS (DEADLINES) ---
  const [eventItems, setEventItems] = useState<EventItem[]>(() => {
      const saved = localStorage.getItem('eventItems');
      return saved ? JSON.parse(saved) : [];
  });
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  // --- STATE: EXAMS ---
  const [examFolders, setExamFolders] = useState<ExamFolder[]>(() => {
      const saved = localStorage.getItem('examFolders');
      if (saved) return JSON.parse(saved);
      return [
          { id: 'enem-def', title: 'ENEM', entries: [], isOpen: false }
      ];
  });
  const [newFolderInput, setNewFolderInput] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Input genérico
  const [newEntryInput, setNewEntryInput] = useState<{[key: string]: string}>({});
  
  // Input específico ENEM
  const [enemInput, setEnemInput] = useState({
      year: '',
      linguagens: '',
      humanas: '',
      natureza: '',
      matematica: ''
  });

  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('taskFolders', JSON.stringify(taskFolders));
  }, [taskFolders]);

  useEffect(() => {
    localStorage.setItem('routineHistory', JSON.stringify(routineHistory));
  }, [routineHistory]);

  useEffect(() => {
    localStorage.setItem('savedBooks', JSON.stringify(savedBooks));
  }, [savedBooks]);

  useEffect(() => {
    localStorage.setItem('mangaItems', JSON.stringify(mangaItems));
  }, [mangaItems]);

  useEffect(() => {
    localStorage.setItem('eventItems', JSON.stringify(eventItems));
  }, [eventItems]);

  useEffect(() => {
    localStorage.setItem('examFolders', JSON.stringify(examFolders));
  }, [examFolders]);

  // --- HELPER: Identify active folder ---
  const activeFolder = activeFolderId ? examFolders.find(f => f.id === activeFolderId) : null;
  const isEnemFolder = activeFolder ? (activeFolder.id === 'enem-def' || activeFolder.title.toUpperCase().includes('ENEM')) : false;
  
  const activeTaskFolder = activeTaskFolderId ? taskFolders.find(f => f.id === activeTaskFolderId) : null;

  // --- HELPER: Date Calculations ---
  const getDaysLeft = (dateStr: string) => {
      const target = new Date(dateStr);
      const today = new Date();
      target.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  };

  // --- HELPER: Streak Calculation ---
  const calculateStreak = () => {
      if (routineHistory.length === 0) return 0;
      
      const sortedDates = [...routineHistory].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const today = new Date().toLocaleDateString('en-CA');
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toLocaleDateString('en-CA');

      let streak = 0;
      let currentCheck = new Date();
      
      // Se hoje foi feito, começa de hoje. Se não, começa de ontem.
      if (sortedDates.includes(today)) {
          // Streak includes today
      } else if (sortedDates.includes(yesterday)) {
          // Streak includes yesterday, today pending
          currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
          // Streak broken
          return 0;
      }

      // Conta para trás
      while (true) {
          const dateStr = currentCheck.toLocaleDateString('en-CA');
          if (sortedDates.includes(dateStr)) {
              streak++;
              currentCheck.setDate(currentCheck.getDate() - 1);
          } else {
              break;
          }
      }
      return streak;
  };

  const streakCount = calculateStreak();

  // --- HANDLERS: VIEW NAVIGATION ---
  const switchView = (mode: ViewMode) => {
      play8BitSound(mode === 'menu' ? 'pipe' : 'open');
      setViewMode(mode);
      if (mode === 'menu') {
          setActiveFolderId(null);
          setActiveTaskFolderId(null);
          setShowHistoryModal(false);
      }
  };

  // --- HANDLERS: TASKS (FOLDERS) ---
  const addTaskFolder = () => {
      if (!newTaskFolderInput.trim()) return;
      const newFolder: TaskFolder = {
          id: Date.now().toString(),
          title: newTaskFolderInput,
          type: 'normal',
          tasks: []
      };
      setTaskFolders(prev => [...prev, newFolder]);
      setNewTaskFolderInput('');
      play8BitSound('powerup');
  };

  const deleteTaskFolder = (id: string) => {
      setTaskFolders(prev => prev.filter(f => f.id !== id));
      play8BitSound('break');
  };

  const openTaskFolder = (id: string) => {
      setActiveTaskFolderId(id);
      play8BitSound('open');
  };

  const closeTaskFolder = () => {
      setActiveTaskFolderId(null);
      play8BitSound('pipe');
  };

  // --- HANDLERS: TASKS (ITEMS) ---
  const addTaskItem = () => {
    if (!newTaskInput.trim() || !activeTaskFolderId) return;
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      task: newTaskInput,
      completed: false
    };
    
    // Se adicionar tarefa nova na rotina, pode quebrar a conclusão de hoje
    setTaskFolders(prev => prev.map(f => {
        if (f.id === activeTaskFolderId) {
            const newTasks = [...f.tasks, newItem];
            // Se for rotina e tinha completado hoje, remove do histórico pois agora tem mais uma
            if (f.type === 'fixed') {
                const today = new Date().toLocaleDateString('en-CA');
                if (routineHistory.includes(today)) {
                    setRoutineHistory(h => h.filter(d => d !== today));
                }
            }
            return { ...f, tasks: newTasks };
        }
        return f;
    }));

    setNewTaskInput('');
    play8BitSound('coin');
  };

  const toggleTaskItem = (taskId: string) => {
    let playedSound = false;

    setTaskFolders(prev => prev.map(f => {
        if (f.id === activeTaskFolderId) {
            const updatedTasks = f.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
            
            // Lógica Especial para Rotina Diária
            if (f.type === 'fixed') {
                const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
                const today = new Date().toLocaleDateString('en-CA');
                
                if (allCompleted) {
                    if (!routineHistory.includes(today)) {
                        setRoutineHistory(h => [...h, today]);
                        play8BitSound('1up'); // Som especial de vitória do dia
                        playedSound = true;
                    }
                } else {
                    if (routineHistory.includes(today)) {
                        setRoutineHistory(h => h.filter(d => d !== today));
                    }
                }
            }

            return { ...f, tasks: updatedTasks };
        }
        return f;
    }));

    if (!playedSound) play8BitSound('click');
  };

  const deleteTaskItem = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setTaskFolders(prev => prev.map(f => {
        if (f.id === activeTaskFolderId) {
            const updatedTasks = f.tasks.filter(t => t.id !== taskId);
            
            // Se deletar tarefa, pode ser que as restantes estejam todas completas
            if (f.type === 'fixed' && updatedTasks.length > 0) {
                const allCompleted = updatedTasks.every(t => t.completed);
                const today = new Date().toLocaleDateString('en-CA');
                if (allCompleted && !routineHistory.includes(today)) {
                    setRoutineHistory(h => [...h, today]);
                    play8BitSound('1up');
                }
            }
            
            return { ...f, tasks: updatedTasks };
        }
        return f;
    }));
    play8BitSound('break');
  };

  const resetDailyTasks = () => {
      if (!activeTaskFolderId) return;
      setTaskFolders(prev => prev.map(f => 
          f.id === activeTaskFolderId 
          ? { ...f, tasks: f.tasks.map(t => ({ ...t, completed: false })) } 
          : f
      ));
      // Reset day não apaga histórico, só desmarca tarefas para o dia seguinte
      play8BitSound('powerup');
  };

  // --- HANDLERS: LIBRARY ---
  const handleSearchBooks = async () => {
      if (!bookQuery.trim()) return;
      setIsSearching(true);
      play8BitSound('fireball');
      setSearchResults([]);

      try {
        let apiKey = '';
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
                // @ts-ignore
                apiKey = process.env.API_KEY;
            }
        } catch (e) {
            console.warn("Error reading env", e);
        }

        if (!apiKey) throw new Error("API Key not found.");

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `List 4 real books matching: "${bookQuery}". Return JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            author: { type: Type.STRING },
                            description: { type: Type.STRING, description: "Max 10 words summary" }
                        },
                        required: ["title", "author", "description"]
                    }
                }
            }
        });

        const text = response.text;
        if (text) {
            const results = JSON.parse(text);
            const booksWithIds = results.map((b: any) => ({ ...b, id: Date.now() + Math.random().toString() }));
            setSearchResults(booksWithIds);
            play8BitSound('coin');
        } else {
            throw new Error("Empty response");
        }
      } catch (error) {
          console.error("Search failed", error);
          setSearchResults([
              { id: 'err', title: 'ERROR', author: 'System', description: 'Could not fetch books.' },
              { id: 'man', title: bookQuery, author: 'Manual Entry', description: 'Save this as custom book.' }
          ]);
          play8BitSound('hurt');
      } finally {
          setIsSearching(false);
      }
  };

  const saveBook = (book: BookItem) => {
      if (savedBooks.some(b => b.title === book.title)) {
          play8BitSound('stomp');
          return; 
      }
      setSavedBooks(prev => [...prev, { ...book, completed: false }]);
      play8BitSound('1up');
  };

  const deleteBook = (id: string) => {
      setSavedBooks(prev => prev.filter(b => b.id !== id));
      play8BitSound('break');
  };

  const toggleBookCompletion = (id: string) => {
      setSavedBooks(prev => prev.map(book => book.id === id ? { ...book, completed: !book.completed } : book));
      play8BitSound('click');
  };

  // --- HANDLERS: MANGA ---
  const addManga = () => {
      if (!newMangaTitle.trim()) return;
      const chapter = newMangaChapter.trim() || '1';
      
      const newManga: MangaItem = {
          id: Date.now().toString(),
          title: newMangaTitle,
          chapter: chapter
      };

      setMangaItems(prev => [...prev, newManga]);
      setNewMangaTitle('');
      setNewMangaChapter('');
      play8BitSound('powerup');
  };

  const deleteManga = (id: string) => {
      setMangaItems(prev => prev.filter(m => m.id !== id));
      play8BitSound('break');
  };

  const updateMangaChapter = (id: string, delta: number) => {
      setMangaItems(prev => prev.map(m => {
          if (m.id === id) {
              const num = parseFloat(m.chapter);
              if (!isNaN(num)) {
                  let newVal = num + delta;
                  if (newVal < 0) newVal = 0;
                  const displayVal = Number.isInteger(newVal) ? newVal.toString() : newVal.toFixed(1);
                  return { ...m, chapter: displayVal };
              }
          }
          return m;
      }));
      play8BitSound('coin');
  };
  
  const handleMangaChapterEdit = (id: string, newVal: string) => {
      setMangaItems(prev => prev.map(m =>
          m.id === id ? { ...m, chapter: newVal } : m
      ));
  };

  // --- HANDLERS: EVENTS ---
  const addEvent = () => {
      if (!newEventTitle.trim() || !newEventDate) {
          play8BitSound('stomp');
          return;
      }
      
      const newEvent: EventItem = {
          id: Date.now().toString(),
          title: newEventTitle,
          date: newEventDate
      };

      setEventItems(prev => [...prev, newEvent].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewEventTitle('');
      setNewEventDate('');
      play8BitSound('powerup');
  };

  const deleteEvent = (id: string) => {
      setEventItems(prev => prev.filter(e => e.id !== id));
      play8BitSound('break');
  };

  // --- HANDLERS: EXAMS ---
  const addExamFolder = () => {
      if (!newFolderInput.trim()) return;
      setExamFolders(prev => [...prev, {
          id: Date.now().toString(),
          title: newFolderInput,
          entries: [],
          isOpen: true
      }]);
      setNewFolderInput('');
      play8BitSound('powerup');
  };

  const deleteExamFolder = (id: string) => {
      setExamFolders(prev => prev.filter(f => f.id !== id));
      play8BitSound('break');
  };

  const openFolder = (id: string) => {
      setActiveFolderId(id);
      play8BitSound('open');
  };

  const closeFolder = () => {
      setActiveFolderId(null);
      play8BitSound('pipe');
  };

  // Adicionar entrada GENÉRICA
  const addExamEntry = (folderId: string) => {
      const text = newEntryInput[folderId];
      if (!text?.trim()) return;
      
      setExamFolders(prev => prev.map(f => 
          f.id === folderId 
          ? { ...f, entries: [...f.entries, { id: Date.now().toString(), text }] }
          : f
      ));
      
      setNewEntryInput(prev => ({ ...prev, [folderId]: '' }));
      play8BitSound('coin');
  };

  // Adicionar entrada ESPECÍFICA ENEM
  const addEnemEntry = () => {
      if (!activeFolderId) return;
      if (!enemInput.year) {
          play8BitSound('stomp');
          return;
      }

      const yearNum = parseInt(enemInput.year);
      if (isNaN(yearNum)) {
          play8BitSound('stomp');
          return;
      }

      const newEntry: ExamEntry = {
          id: Date.now().toString(),
          year: yearNum,
          scores: {
              linguagens: enemInput.linguagens || '0',
              humanas: enemInput.humanas || '0',
              natureza: enemInput.natureza || '0',
              matematica: enemInput.matematica || '0'
          }
      };

      setExamFolders(prev => prev.map(f => {
          if (f.id === activeFolderId) {
              const updatedEntries = [...f.entries, newEntry];
              updatedEntries.sort((a, b) => (b.year || 0) - (a.year || 0));
              return { ...f, entries: updatedEntries };
          }
          return f;
      }));

      setEnemInput({
          year: '',
          linguagens: '',
          humanas: '',
          natureza: '',
          matematica: ''
      });
      play8BitSound('powerup');
  };

  const deleteExamEntry = (folderId: string, entryId: string) => {
      setExamFolders(prev => prev.map(f => 
          f.id === folderId 
          ? { ...f, entries: f.entries.filter(e => e.id !== entryId) }
          : f
      ));
      play8BitSound('stomp');
  };

  // Styles
  const boardColor = isMinimalist ? '#000' : '#F0F0F0';
  const headerColor = isMinimalist ? '#000' : colors.blue.main;
  const showSearchResults = bookQuery.trim().length > 0;

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300 relative">
      <div className="w-full max-w-3xl">
        
        {/* Container Principal */}
        <div className="relative border-4 rounded-lg overflow-hidden flex flex-col"
             style={{ 
                 backgroundColor: colors.ui.background, 
                 borderColor: isMinimalist ? '#FFF' : '#000',
                 boxShadow: isMinimalist ? '8px 8px 0 #FFF' : '8px 8px 0 rgba(0,0,0,0.5)',
                 height: '600px'
             }}>
          
          {/* === MAIN MENU VIEW === */}
          {viewMode === 'menu' && (
             <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
                 
                 {/* Title Tools */}
                 <div className="text-center mb-4">
                     <h1 className="text-5xl md:text-6xl font-bold tracking-widest mb-2"
                         style={{ 
                             fontFamily: THEME.font,
                             color: isMinimalist ? '#FFF' : colors.yellow.main,
                             textShadow: isMinimalist ? 'none' : '4px 4px 0 #000',
                             WebkitTextStroke: isMinimalist ? '0px' : '2px #000'
                         }}>
                         TOOLS
                     </h1>
                     <div className="w-full h-2 bg-black opacity-20 rounded-full mx-auto" style={{ backgroundColor: isMinimalist ? '#FFF' : '#000' }}></div>
                 </div>

                 {/* Flex Grid for Buttons - Can handle 5 items nicely */}
                 <div className="flex flex-wrap justify-center gap-6 w-full max-w-3xl">
                     <RetroButton 
                         onClick={() => switchView('tasks')} 
                         colorType="purple" 
                         size="lg" 
                         className="h-28 w-[180px] md:w-[200px] text-xl flex-col gap-2"
                         themeMode={themeMode}
                         title="Manage Tasks"
                     >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                             <path fillRule="evenodd" clipRule="evenodd" d="M8 2H16V4H8V2ZM6 6H18V20H6V6ZM8 8H16V10H8V8ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z" />
                         </svg>
                         TASKS
                     </RetroButton>

                     <RetroButton 
                         onClick={() => switchView('library')} 
                         colorType="orange" 
                         size="lg" 
                         className="h-28 w-[180px] md:w-[200px] text-xl flex-col gap-2"
                         themeMode={themeMode}
                         title="Book Library"
                     >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                            <path fillRule="evenodd" clipRule="evenodd" d="M3 5H11V21H3V5ZM5 7H9V19H5V7ZM13 5H21V21H13V5ZM15 7H19V19H15V7Z" />
                         </svg>
                         BOOKS
                     </RetroButton>

                     <RetroButton 
                         onClick={() => switchView('exams')} 
                         colorType="red" 
                         size="lg" 
                         className="h-28 w-[180px] md:w-[200px] text-xl flex-col gap-2"
                         themeMode={themeMode}
                         title="Exam Scores"
                     >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                         </svg>
                         EXAMS
                     </RetroButton>

                     <RetroButton 
                         onClick={() => switchView('manga')} 
                         colorType="blue" 
                         size="lg" 
                         className="h-28 w-[180px] md:w-[200px] text-xl flex-col gap-2"
                         themeMode={themeMode}
                         title="Manga Tracker"
                     >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                             <path d="M4 4H20V20H4V4ZM6 6V18H18V6H6ZM8 8H16V10H8V8ZM8 12H16V14H8V12Z" />
                         </svg>
                         MANGA
                     </RetroButton>

                     <RetroButton 
                         onClick={() => switchView('events')} 
                         colorType="green" 
                         size="lg" 
                         className="h-28 w-[180px] md:w-[200px] text-xl flex-col gap-2"
                         themeMode={themeMode}
                         title="Deadline Tracker"
                     >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                             <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                         </svg>
                         DEADLINES
                     </RetroButton>
                 </div>
             </div>
          )}

          {/* === SUB-VIEWS (Header with Back Button + Content) === */}
          {viewMode !== 'menu' && (
              <>
                {/* Header with Back Button */}
                <div className="border-b-4 p-4 flex items-center justify-between relative z-20 gap-4 flex-shrink-0" 
                    style={{ 
                        backgroundColor: headerColor, 
                        borderColor: isMinimalist ? '#FFF' : '#000' 
                    }}>
                    
                    <RetroButton 
                        onClick={() => switchView('menu')} 
                        colorType="white" 
                        size="sm" 
                        themeMode={themeMode}
                        className="px-6 w-auto text-xs md:text-sm"
                        title="Back to Tools"
                    >
                        {"< BACK"}
                    </RetroButton>

                    <h2 className="text-xl md:text-2xl font-bold tracking-wider absolute left-1/2 transform -translate-x-1/2" 
                        style={{ 
                            fontFamily: THEME.font, 
                            color: '#FFF',
                            textShadow: isMinimalist ? 'none' : '2px 2px 0 #000',
                            whiteSpace: 'nowrap'
                        }}>
                    {viewMode === 'tasks' ? "TASKS" : 
                     viewMode === 'library' ? "BOOKS" : 
                     viewMode === 'exams' ? "EXAMS" : 
                     viewMode === 'events' ? "DEADLINES" : "MANGA"}
                    </h2>

                    <div className="w-16"></div> 
                </div>

                {/* --- CONTENT AREA --- */}
                
                {viewMode === 'tasks' && (
                    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-black" style={{ backgroundColor: boardColor }}>
                        
                        {/* --- VIEW: FOLDER LIST --- */}
                        {!activeTaskFolderId && (
                            <>
                                <div className="p-4 border-b-4 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#e6f2ff', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newTaskFolderInput}
                                            onChange={(e) => setNewTaskFolderInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTaskFolder()}
                                            placeholder="NEW FOLDER (e.g. WORK)..."
                                            className="flex-1 p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase"
                                            style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                        />
                                        <RetroButton onClick={addTaskFolder} colorType="green" size="md" title="Add Folder" sound="powerup" themeMode={themeMode}>ADD</RetroButton>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {taskFolders.map(folder => (
                                            <div 
                                                key={folder.id} 
                                                onClick={() => openTaskFolder(folder.id)}
                                                className={`
                                                    relative cursor-pointer transition-all active:translate-y-1 hover:brightness-110 flex flex-col items-center justify-center p-6 min-h-[140px] border-4
                                                `}
                                                style={{ 
                                                    backgroundColor: folder.type === 'fixed' ? (isMinimalist ? '#222' : colors.yellow.main) : (isMinimalist ? '#000' : '#FFF'), 
                                                    borderColor: isMinimalist ? '#FFF' : '#000',
                                                    boxShadow: isMinimalist ? '4px 4px 0 #FFF' : '4px 4px 0 rgba(0,0,0,0.5)', 
                                                    color: isMinimalist ? '#FFF' : (folder.type === 'fixed' ? '#000' : '#000')
                                                }}
                                            >
                                                <div className="mb-2">
                                                    {folder.type === 'fixed' ? (
                                                        // Star Icon for Fixed
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={isMinimalist ? "#FFF" : "none"} strokeWidth={isMinimalist ? "2" : "0"} fill={isMinimalist ? "none" : "currentColor"}/></svg>
                                                    ) : (
                                                        // Folder Icon for Normal
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg uppercase text-center leading-tight" style={{ fontFamily: THEME.font, textShadow: isMinimalist ? 'none' : (folder.type === 'fixed' ? 'none' : 'none') }}>{folder.title}</span>
                                                </div>
                                                <div className="text-[10px] mt-2 opacity-80" style={{ fontFamily: 'monospace' }}>
                                                    {folder.tasks.filter(t => !t.completed).length} OPEN / {folder.tasks.length} TOTAL
                                                </div>
                                                
                                                {/* Only allow deleting normal folders */}
                                                {folder.type !== 'fixed' && (
                                                    <button onClick={(e) => { e.stopPropagation(); deleteTaskFolder(folder.id); }} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-xs font-bold border-2 rounded hover:bg-red-500 hover:text-white transition-colors bg-white text-black" style={{ borderColor: '#000' }} title="Delete Folder">X</button>
                                                )}
                                                {folder.type === 'fixed' && (
                                                    <div className="absolute top-2 right-2 px-2 py-1 text-[8px] bg-black text-white border border-white rounded opacity-50">FIXED</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- VIEW: TASK LIST (INSIDE FOLDER) --- */}
                        {activeTaskFolderId && activeTaskFolder && (
                            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                                {/* Folder Header */}
                                <div className="p-3 border-b-4 flex items-center gap-2 sticky top-0 z-10 flex-shrink-0" style={{ backgroundColor: isMinimalist ? '#111' : (activeTaskFolder.type === 'fixed' ? colors.yellow.light : '#f0f0f0'), borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                    <RetroButton onClick={closeTaskFolder} colorType="white" size="sm" className="w-auto px-6 text-xs md:text-sm" title="Back" themeMode={themeMode}>{"< BACK"}</RetroButton>
                                    <h3 className="text-lg md:text-xl font-bold uppercase truncate flex-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{activeTaskFolder.title}</h3>
                                    
                                    {/* ROTINA DIÁRIA EXTRAS */}
                                    {activeTaskFolder.type === 'fixed' && (
                                        <div className="flex items-center gap-2">
                                            {/* Streak Counter */}
                                            <div className="flex items-center gap-1 bg-black text-white px-2 py-1 rounded border-2 border-white" title="Current Streak">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF4500" stroke="#FFF" strokeWidth="1">
                                                    <path d="M12 2C12 2 8 6 8 10C8 13 10 15 12 15C14 15 16 13 16 10C16 6 12 2 12 2ZM12 22C7 22 4 17 4 12C4 7 8 2 8 2C8 2 6 7 6 10C6 14 9 17 12 17C15 17 18 14 18 10C18 7 16 2 16 2C16 2 20 7 20 12C20 17 17 22 12 22Z"/>
                                                </svg>
                                                <span className="text-[10px] font-bold" style={{ fontFamily: THEME.font }}>{streakCount}</span>
                                            </div>

                                            {/* History Button */}
                                            <RetroButton onClick={() => setShowHistoryModal(true)} colorType="orange" size="sm" className="w-auto px-2" title="History" themeMode={themeMode}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                                                </svg>
                                            </RetroButton>

                                            {/* Reset Button */}
                                            <RetroButton onClick={resetDailyTasks} colorType="blue" size="sm" className="w-auto px-2 text-[10px]" title="Uncheck all" themeMode={themeMode}>RESET</RetroButton>
                                        </div>
                                    )}
                                </div>

                                {/* Add Task Input */}
                                <div className="p-4 border-b-4 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#fff', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            value={newTaskInput}
                                            onChange={(e) => setNewTaskInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTaskItem()}
                                            placeholder="NEW TASK..."
                                            className="flex-1 p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase"
                                            style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                        />
                                        <RetroButton onClick={addTaskItem} colorType="green" size="md" title="Add Task" sound="powerup" themeMode={themeMode}>ADD</RetroButton>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                    {activeTaskFolder.tasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                            <p style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>NO TASKS HERE.</p>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {activeTaskFolder.tasks.map((item) => (
                                            <div key={item.id} onClick={() => toggleTaskItem(item.id)} className={`relative flex items-center gap-3 p-3 border-2 rounded shadow-sm transition-all group cursor-pointer ${item.completed ? 'opacity-70' : 'opacity-100 hover:brightness-95'}`} style={{ backgroundColor: isMinimalist ? '#000' : (item.completed ? '#e6ffe6' : '#FFF'), borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                                <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors flex-shrink-0 ${item.completed ? (isMinimalist ? 'bg-white' : 'bg-green-500') : (isMinimalist ? 'bg-black' : 'bg-white')}`} style={{ borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                                    {item.completed && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isMinimalist ? "#000" : "#FFF"} strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                                </div>
                                                <span className={`flex-1 text-sm md:text-base font-bold uppercase break-words ${item.completed ? 'line-through' : ''}`} style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{item.task}</span>
                                                <button type="button" onClick={(e) => deleteTaskItem(e, item.id)} className="px-2 py-1 text-xs font-bold border-2 rounded hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 relative z-10" style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#F00', fontFamily: THEME.font }}>DEL</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* --- HISTORY MODAL --- */}
                        {showHistoryModal && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="w-[90%] max-w-sm border-4 p-1" 
                                     style={{ 
                                         backgroundColor: isMinimalist ? '#000' : '#FFF',
                                         borderColor: isMinimalist ? '#FFF' : '#000',
                                         boxShadow: '8px 8px 0 rgba(0,0,0,0.5)'
                                     }}>
                                    <div className="border-2 p-4 flex flex-col gap-4 max-h-[400px]" style={{ borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                        <div className="flex justify-between items-center border-b-2 pb-2" style={{ borderColor: isMinimalist ? '#FFF' : '#eee' }}>
                                            <h3 className="font-bold text-sm" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>STREAK HISTORY</h3>
                                            <button onClick={() => setShowHistoryModal(false)} className="font-bold hover:text-red-500" style={{ color: isMinimalist ? '#FFF' : '#000' }}>X</button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                                            {routineHistory.length === 0 ? (
                                                <p className="text-center text-xs py-8 opacity-50" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>NO DAYS COMPLETED YET.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[...routineHistory].reverse().map(date => (
                                                        <div key={date} className="flex items-center gap-2 p-2 border rounded bg-green-50" style={{ backgroundColor: isMinimalist ? '#111' : '#e6ffe6', borderColor: isMinimalist ? '#333' : '#bbf7d0' }}>
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="text-xs font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{new Date(date + 'T12:00:00').toLocaleDateString()}</span>
                                                            <span className="text-[8px] ml-auto opacity-60 font-bold text-green-700" style={{ color: isMinimalist ? '#4ade80' : '#15803d' }}>COMPLETED</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-center text-[10px] opacity-70 border-t-2 pt-2" style={{ fontFamily: 'monospace', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#eee' }}>
                                            TOTAL DAYS: {routineHistory.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
                
                {viewMode === 'library' && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: boardColor }}>
                        <div className="p-4 border-b-4 flex-shrink-0 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#fdf6e3', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                            <div className="flex gap-2">
                                <input type="text" value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchBooks()} placeholder="SEARCH BOOKS..." autoFocus className="flex-1 p-2 border-2 rounded font-bold uppercase focus:outline-none focus:ring-2" style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000' }} />
                                <RetroButton onClick={handleSearchBooks} colorType="blue" size="sm" title="Search" sound="fireball" themeMode={themeMode}>{isSearching ? '...' : 'GO'}</RetroButton>
                            </div>
                        </div>

                        {showSearchResults && (
                            <div className="p-4 border-b-4 flex-shrink-0 animate-in slide-in-from-top-2 duration-200" style={{ borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#111' : 'rgba(255,255,255,0.5)' }}>
                                <h4 className="font-bold mb-2 text-xs opacity-70" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>SEARCH RESULTS {searchResults.length > 0 && `(${searchResults.length})`}</h4>
                                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 items-center min-h-[160px]">
                                    {searchResults.length === 0 && !isSearching && (<div className="w-full text-center opacity-40 text-xs italic" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{isSearching ? 'SEARCHING...' : 'RESULTS WILL APPEAR HERE'}</div>)}
                                    {searchResults.map((book) => (
                                        <div key={book.id} className="flex-shrink-0 w-48 p-3 border-2 rounded flex flex-col justify-between relative group transition-transform hover:scale-105 h-[150px]" style={{ backgroundColor: isMinimalist ? '#000' : '#FFF', borderColor: isMinimalist ? '#FFF' : '#000', boxShadow: isMinimalist ? '4px 4px 0 #333' : '4px 4px 0 rgba(0,0,0,0.1)' }}>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-xs uppercase truncate mb-1" title={book.title} style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{book.title}</div>
                                                <div className="text-[9px] italic mb-2 truncate" style={{ fontFamily: 'monospace', color: isMinimalist ? '#CCC' : '#666' }}>{book.author}</div>
                                                {book.description && <div className="text-[8px] opacity-80 leading-tight line-clamp-3" style={{ color: isMinimalist ? '#FFF' : '#000' }}>{book.description}</div>}
                                            </div>
                                            <RetroButton onClick={() => saveBook(book)} colorType="green" size="sm" className="w-full text-[9px] h-7" title="Save to Collection" themeMode={themeMode}>SAVE</RetroButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar" style={{ backgroundColor: isMinimalist ? '#000' : 'rgba(0,0,0,0.03)' }}>
                            <h4 className="font-bold mb-3 text-xs opacity-70 sticky top-0 py-1 z-10 backdrop-blur-sm" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>MY COLLECTION ({savedBooks.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {savedBooks.length === 0 && <div className="col-span-full text-center opacity-40 mt-4 text-xs" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>EMPTY SHELF.</div>}
                                {savedBooks.map((book) => (
                                    <div key={book.id} onClick={() => toggleBookCompletion(book.id)} className="flex items-center justify-between p-3 border-2 rounded hover:translate-x-1 transition-transform cursor-pointer" style={{ backgroundColor: isMinimalist ? '#000' : (book.completed ? '#c8e6c9' : '#deb887'), borderColor: isMinimalist ? '#FFF' : '#8b4513' }}>
                                        <div className={`w-6 h-6 border-2 flex items-center justify-center mr-3 transition-colors flex-shrink-0 ${book.completed ? (isMinimalist ? 'bg-white' : 'bg-green-500') : (isMinimalist ? 'bg-black' : 'bg-white')}`} style={{ borderColor: isMinimalist ? '#FFF' : '#8b4513' }}>{book.completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isMinimalist ? "#000" : "#FFF"} strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}</div>
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className={`font-bold text-xs truncate ${book.completed ? 'line-through opacity-60' : ''}`} style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#3e2723' }}>{book.title}</div>
                                            <div className="text-[10px] truncate" style={{ color: isMinimalist ? '#CCC' : '#5d4037' }}>{book.author}</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }} className="w-7 h-7 flex items-center justify-center border-2 rounded hover:bg-red-500 hover:text-white transition-colors text-xs font-bold" style={{ borderColor: isMinimalist ? '#FFF' : '#5d4037', color: isMinimalist ? '#FFF' : '#5d4037' }}>X</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'manga' && (
                    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-black">
                        {/* INPUT AREA */}
                        <div className="p-4 border-b-4 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#e0f7fa', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input 
                                    type="text" 
                                    value={newMangaTitle}
                                    onChange={(e) => setNewMangaTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addManga()}
                                    placeholder="MANGA TITLE..."
                                    className="flex-1 p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase"
                                    style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                />
                                <input 
                                    type="text" 
                                    value={newMangaChapter}
                                    onChange={(e) => setNewMangaChapter(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addManga()}
                                    placeholder="CH"
                                    className="w-20 md:w-24 p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase text-center"
                                    style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                />
                                <RetroButton onClick={addManga} colorType="blue" size="md" title="Add" sound="powerup" themeMode={themeMode}>ADD</RetroButton>
                            </div>
                        </div>

                        {/* LIST AREA */}
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: boardColor }}>
                            {mangaItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                    <p style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>NO MANGA TRACKED.</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {mangaItems.map((item) => (
                                    <div key={item.id} className="relative flex items-center justify-between gap-3 p-3 border-2 rounded shadow-sm group hover:brightness-95 transition-all" 
                                         style={{ 
                                             backgroundColor: isMinimalist ? '#000' : '#FFF', 
                                             borderColor: isMinimalist ? '#FFF' : '#000' 
                                         }}>
                                        
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm md:text-base font-bold uppercase truncate block" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>
                                                {item.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => updateMangaChapter(item.id, -1)}
                                                className="w-8 h-8 border-2 rounded hover:bg-red-200 flex items-center justify-center font-bold text-lg"
                                                style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#000' }}
                                            >-</button>
                                            
                                            <div className="flex items-center justify-center w-20 border rounded px-1" 
                                                 style={{ 
                                                     borderColor: isMinimalist ? '#FFF' : '#000',
                                                     backgroundColor: isMinimalist ? '#333' : '#F0F0F0' 
                                                 }}>
                                                <span className="text-[10px] mr-1 opacity-60" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>CH</span>
                                                <input
                                                    type="text"
                                                    value={item.chapter}
                                                    onChange={(e) => handleMangaChapterEdit(item.id, e.target.value)}
                                                    className="w-full bg-transparent focus:outline-none font-bold text-center p-1"
                                                    style={{ fontFamily: 'monospace', color: isMinimalist ? '#FFF' : '#000' }}
                                                />
                                            </div>

                                            <button 
                                                onClick={() => updateMangaChapter(item.id, 1)}
                                                className="w-8 h-8 border-2 rounded hover:bg-green-200 flex items-center justify-center font-bold text-lg"
                                                style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#000' }}
                                            >+</button>
                                            
                                            <div className="w-2"></div>

                                            <button 
                                                onClick={(e) => deleteManga(item.id)}
                                                className="w-8 h-8 text-xs font-bold border-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                                                style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#F00', fontFamily: THEME.font }}
                                            >X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'events' && (
                    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-black">
                        {/* INPUT AREA */}
                        <div className="p-4 border-b-4 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#e0f7fa', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input 
                                    type="text" 
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    placeholder="EVENT (e.g. MATH EXAM)..."
                                    className="flex-1 p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase"
                                    style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                />
                                <input 
                                    type="date" 
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="p-2 border-2 rounded font-bold focus:outline-none focus:ring-2 uppercase"
                                    style={{ fontFamily: THEME.font, backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000', borderColor: isMinimalist ? '#FFF' : '#000' }}
                                />
                                <RetroButton onClick={addEvent} colorType="green" size="md" title="Add" sound="powerup" themeMode={themeMode}>ADD</RetroButton>
                            </div>
                        </div>

                        {/* LIST AREA */}
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: boardColor }}>
                            {eventItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                    <p style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>NO EVENTS TRACKED.</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {eventItems.map((item) => {
                                    const daysLeft = getDaysLeft(item.date);
                                    const isPast = daysLeft < 0;
                                    const isToday = daysLeft === 0;
                                    const isUrgent = daysLeft > 0 && daysLeft <= 7;
                                    const isSoon = daysLeft > 7 && daysLeft <= 30;
                                    
                                    // Cores baseadas na urgência
                                    let statusColor = isMinimalist ? '#FFF' : '#4ade80'; // Green
                                    if (isPast) statusColor = '#9ca3af'; // Gray
                                    if (isToday) statusColor = isMinimalist ? '#FFF' : '#3b82f6'; // Blue
                                    if (isSoon) statusColor = isMinimalist ? '#FFF' : '#facc15'; // Yellow
                                    if (isUrgent) statusColor = isMinimalist ? '#FFF' : '#ef4444'; // Red

                                    return (
                                        <div key={item.id} className="relative flex items-center justify-between p-4 border-4 rounded-lg shadow-md group hover:brightness-95 transition-all" 
                                             style={{ 
                                                 backgroundColor: isMinimalist ? '#000' : '#FFF', 
                                                 borderColor: isMinimalist ? '#FFF' : '#000',
                                                 borderLeftWidth: '8px',
                                                 borderLeftColor: statusColor
                                             }}>
                                            
                                            <div className="flex flex-col min-w-0 pr-4">
                                                <span className="text-sm md:text-lg font-bold uppercase truncate" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>
                                                    {item.title}
                                                </span>
                                                <span className="text-xs opacity-70" style={{ fontFamily: 'monospace', color: isMinimalist ? '#CCC' : '#555' }}>
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    {isPast ? (
                                                        <span className="text-xs font-bold text-gray-500" style={{ fontFamily: THEME.font }}>PASSED</span>
                                                    ) : isToday ? (
                                                        <span className="text-sm font-bold text-blue-600 animate-pulse" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#2563eb' }}>TODAY!</span>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-2xl font-bold leading-none" style={{ fontFamily: THEME.font, color: statusColor }}>
                                                                {daysLeft}
                                                            </span>
                                                            <span className="text-[9px] opacity-60" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>DAYS LEFT</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={(e) => deleteEvent(item.id)}
                                                    className="w-8 h-8 text-xs font-bold border-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                                                    style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#F00', fontFamily: THEME.font }}
                                                >X</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'exams' && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: boardColor }}>
                        
                        {/* === MODE 1: FOLDER NAVIGATION === */}
                        {!activeFolderId && (
                            <>
                                <div className="p-4 border-b-4 flex-shrink-0 relative z-10" style={{ backgroundColor: isMinimalist ? '#000' : '#ffe4e1', borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                    <div className="flex gap-2">
                                        <input type="text" value={newFolderInput} onChange={(e) => setNewFolderInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExamFolder()} placeholder="NEW EXAM CATEGORY (e.g. UNICAMP)..." autoFocus className="flex-1 p-2 border-2 rounded font-bold uppercase focus:outline-none focus:ring-2" style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#FFF', color: isMinimalist ? '#FFF' : '#000' }} />
                                        <RetroButton onClick={addExamFolder} colorType="green" size="sm" title="Add Category" sound="powerup" themeMode={themeMode}>ADD</RetroButton>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                    {examFolders.length === 0 && <div className="text-center opacity-40 mt-10 text-xs" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>NO EXAM HISTORY YET.</div>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {examFolders.map(folder => (
                                            <div key={folder.id} className={`relative cursor-pointer transition-all active:translate-y-1 hover:brightness-110 flex flex-col items-center justify-center p-6 min-h-[140px]`} onClick={() => openFolder(folder.id)} style={{ backgroundColor: isMinimalist ? '#000' : colors.red.main, border: `4px solid ${isMinimalist ? '#FFF' : '#000'}`, boxShadow: isMinimalist ? '4px 4px 0 #FFF' : '4px 4px 0 rgba(0,0,0,0.5)', color: '#FFF' }}>
                                                <div className="mb-2"><svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg></div>
                                                <div className="flex items-center gap-2"><span className="font-bold text-xl uppercase" style={{ fontFamily: THEME.font, textShadow: isMinimalist ? 'none' : '2px 2px 0 #000' }}>{folder.title}</span></div>
                                                <div className="text-xs mt-2 opacity-80" style={{ fontFamily: 'monospace' }}>{folder.entries.length} RECORDS</div>
                                                <button onClick={(e) => { e.stopPropagation(); deleteExamFolder(folder.id); }} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-xs font-bold border-2 rounded hover:bg-red-500 hover:text-white transition-colors bg-white text-black" style={{ borderColor: '#000' }} title="Delete Folder">X</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === MODE 2: SPECIFIC FOLDER === */}
                        {activeFolderId && activeFolder && (
                            <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-black animate-in slide-in-from-right duration-300 w-full" style={{ backgroundColor: boardColor }}>
                                <div className="p-3 border-b-4 flex items-center gap-4 sticky top-0 z-10 flex-shrink-0" style={{ backgroundColor: isMinimalist ? '#111' : colors.yellow.light, borderColor: isMinimalist ? '#FFF' : '#000' }}>
                                        <RetroButton onClick={closeFolder} colorType="white" size="sm" className="w-auto px-6 text-xs md:text-sm" title="Back" themeMode={themeMode}>{"< BACK"}</RetroButton>
                                        <h3 className="text-xl font-bold uppercase" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{activeFolder.title}</h3>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar min-h-0 w-full flex flex-col">
                                        {isEnemFolder ? (
                                            /* ENEM SPECIFIC FORM */
                                            <div className="flex flex-col gap-4 mb-6 p-4 border-4 border-dashed rounded flex-shrink-0" style={{ borderColor: isMinimalist ? '#555' : '#ccc', backgroundColor: isMinimalist ? '#000' : '#f8f8f8' }}>
                                                <h4 className="text-sm font-bold opacity-70 mb-2" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>ADD NEW RESULT:</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] block mb-1 font-bold" style={{fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000'}}>YEAR</label>
                                                        <input type="number" value={enemInput.year} onChange={(e) => setEnemInput({...enemInput, year: e.target.value})} placeholder="e.g. 2023" className="w-full p-3 text-sm border-2 rounded focus:outline-none font-bold" style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#222' : '#FFF', color: isMinimalist ? '#FFF' : '#000' }} />
                                                    </div>
                                                    {['Linguagens', 'Humanas', 'Natureza', 'Matematica'].map((subj) => (
                                                        <div key={subj}>
                                                            <label className="text-[10px] block mb-1 uppercase opacity-80" style={{fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000'}}>{subj}</label>
                                                            <input type="number" 
                                                            // @ts-ignore
                                                            value={enemInput[subj.toLowerCase()]} 
                                                            // @ts-ignore
                                                            onChange={(e) => setEnemInput({...enemInput, [subj.toLowerCase()]: e.target.value})} placeholder="Score" className="w-full p-2 text-sm border-2 rounded focus:outline-none" style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#FFF' : '#ccc', backgroundColor: isMinimalist ? '#222' : '#FFF', color: isMinimalist ? '#FFF' : '#000' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <RetroButton onClick={addEnemEntry} colorType="green" size="lg" title="Add Result" className="w-full mt-2" themeMode={themeMode}>SAVE RESULT</RetroButton>
                                            </div>
                                        ) : (
                                            /* GENERIC FORM */
                                            <div className="flex gap-2 mb-6 p-4 border-4 rounded flex-shrink-0" style={{ backgroundColor: isMinimalist ? '#111' : '#fff', borderColor: isMinimalist ? '#FFF' : '#eee' }}>
                                                <input type="text" value={newEntryInput[activeFolder.id] || ''} onChange={(e) => setNewEntryInput({...newEntryInput, [activeFolder.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && addExamEntry(activeFolder.id)} placeholder="ADD SCORE, NOTE, OR RECORD..." className="flex-1 p-3 text-sm border-2 rounded focus:outline-none" style={{ fontFamily: THEME.font, borderColor: isMinimalist ? '#FFF' : '#ccc', backgroundColor: isMinimalist ? '#000' : '#f9f9f9', color: isMinimalist ? '#FFF' : '#000' }} />
                                                <button onClick={() => addExamEntry(activeFolder.id)} className="px-6 border-2 rounded text-sm font-bold hover:bg-green-200 transition-colors" style={{ borderColor: isMinimalist ? '#FFF' : '#000', color: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#FFF' }}>ADD</button>
                                            </div>
                                        )}

                                        <h4 className="text-sm font-bold opacity-50 mb-4 border-b pb-2 flex-shrink-0" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>HISTORY</h4>
                                        
                                        {/* Lista com scroll garantido */}
                                        <div className="space-y-3 w-full flex-1 min-h-0">
                                            {activeFolder.entries.length === 0 && (
                                                <div className="text-center text-sm opacity-40 italic py-10" style={{ color: isMinimalist ? '#FFF' : '#000' }}>
                                                    No history recorded for {activeFolder.title}.
                                                </div>
                                            )}
                                            {activeFolder.entries.map(entry => (
                                                <div key={entry.id} className="relative group p-4 border-2 rounded hover:brightness-95 transition-all shadow-sm w-full" style={{ borderColor: isMinimalist ? '#555' : '#000', backgroundColor: isMinimalist ? '#222' : '#FFF' }}>
                                                    {isEnemFolder && entry.year ? (
                                                        <div className="flex flex-col gap-2 w-full">
                                                            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: isMinimalist ? '#444' : '#eee' }}>
                                                                <span className="font-bold text-lg" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{entry.year}</span>
                                                                <div className="text-xs font-bold bg-gray-200 px-2 py-1 rounded text-black">TOTAL: {(parseInt(entry.scores?.linguagens || '0') + parseInt(entry.scores?.humanas || '0') + parseInt(entry.scores?.natureza || '0') + parseInt(entry.scores?.matematica || '0'))}</div>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2 text-xs text-center mt-1">
                                                                <div className="flex flex-col p-1 rounded bg-opacity-10 bg-blue-500"><span className="opacity-50 text-[10px]">LIN</span><span className="font-bold">{entry.scores?.linguagens || '-'}</span></div>
                                                                <div className="flex flex-col p-1 rounded bg-opacity-10 bg-yellow-500"><span className="opacity-50 text-[10px]">HUM</span><span className="font-bold">{entry.scores?.humanas || '-'}</span></div>
                                                                <div className="flex flex-col p-1 rounded bg-opacity-10 bg-green-500"><span className="opacity-50 text-[10px]">NAT</span><span className="font-bold">{entry.scores?.natureza || '-'}</span></div>
                                                                <div className="flex flex-col p-1 rounded bg-opacity-10 bg-red-500"><span className="opacity-50 text-[10px]">MAT</span><span className="font-bold">{entry.scores?.matematica || '-'}</span></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold break-words block pr-8" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>{entry.text}</span>
                                                    )}
                                                    <button onClick={() => deleteExamEntry(activeFolder.id, entry.id)} className="absolute top-2 right-2 text-xs hover:bg-red-500 hover:text-white font-bold px-3 py-1 border rounded transition-colors" style={{ color: isMinimalist ? '#888' : '#666', borderColor: 'currentColor' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
              </>
          )}

        </div>
      </div>
    </div>
  );
}
