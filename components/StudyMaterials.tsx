import React, { useState, useEffect, useRef } from 'react';
import { RetroButton, THEME, play8BitSound, getThemeColors } from './RetroUtils';

// --- TIPOS DA HIERARQUIA (Exportados para uso no App e Timer) ---
export interface Quest {
  id: number;
  text: string;
  completed: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  quests: Quest[];
  isOpen: boolean;
}

export interface Book {
  id: number;
  title: string;
  chapters: Chapter[];
  isOpen: boolean;
}

export interface Subject {
  id: number;
  title: string;
  books: Book[];
  isOpen: boolean;
}

// Definição das Props que o componente aceita
interface StudyMaterialsProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  themeMode: 'mario' | 'minimalist';
}

// Interface para o item sendo arrastado
interface DragItem {
  type: 'SUBJECT' | 'BOOK' | 'CHAPTER' | 'QUEST';
  id: number;
  index: number;
  // Parent IDs para garantir que só arrastamos dentro do mesmo pai
  subjectId?: number;
  bookId?: number;
  chapterId?: number;
}

// --- COMPONENTE AUXILIAR: GRIP HANDLE ---
const GripHandle = ({ className = "", setDragEnabled, isMinimalist = false }: { className?: string, setDragEnabled: (enabled: boolean) => void, isMinimalist?: boolean }) => (
  <div 
    className={`flex flex-col gap-[2px] cursor-grab active:cursor-grabbing p-1 opacity-40 hover:opacity-100 ${className}`}
    onMouseEnter={() => setDragEnabled(true)}
    onMouseLeave={() => setDragEnabled(false)}
    onMouseDown={() => setDragEnabled(true)}
  >
    <div className={`w-3 h-[2px] ${isMinimalist ? 'bg-white' : 'bg-black'}`}></div>
    <div className={`w-3 h-[2px] ${isMinimalist ? 'bg-white' : 'bg-black'}`}></div>
    <div className={`w-3 h-[2px] ${isMinimalist ? 'bg-white' : 'bg-black'}`}></div>
  </div>
);

export default function StudyMaterials({ subjects, setSubjects, themeMode }: StudyMaterialsProps) {
  // Estados para os Inputs (Mapeados por ID do pai)
  const [newSubjectText, setNewSubjectText] = useState('');
  const [newBookText, setNewBookText] = useState<{ [subjectId: number]: string }>({});
  const [newChapterText, setNewChapterText] = useState<{ [bookId: number]: string }>({});
  const [newQuestText, setNewQuestText] = useState<{ [chapterId: number]: string }>({});

  // Estado para Drag and Drop
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [isDragEnabled, setIsDragEnabled] = useState(false);

  // Estado para controle de redimensionamento (altura + largura)
  const [height, setHeight] = useState(500);
  const [width, setWidth] = useState(768); // max-w-4xl ≈ 768px
  const [resizeMode, setResizeMode] = useState<'none' | 'height' | 'width'>('none');
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  // Carregar dimensões salvas ao iniciar
  useEffect(() => {
    try {
      const savedHeight = localStorage.getItem('study:height');
      if (savedHeight) setHeight(Number(savedHeight));
      const savedWidth = localStorage.getItem('study:width');
      if (savedWidth) setWidth(Number(savedWidth));
    } catch (error) {
      console.log('Failed to load dimensions');
    }
  }, []);

  // Salvar dimensões quando mudam
  useEffect(() => {
    try {
      localStorage.setItem('study:height', height.toString());
      localStorage.setItem('study:width', width.toString());
    } catch (error) {
      console.log('Failed to save dimensions');
    }
  }, [height, width]);

  // Handler para redimensionamento (altura e largura)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeMode === 'none' || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (resizeMode === 'height') {
        const newHeight = e.clientY - rect.top - 100;
        if (newHeight >= 250 && newHeight <= 850) setHeight(newHeight);
      }

      if (resizeMode === 'width') {
        const newWidth = e.clientX - rect.left + 12; // +12 = metade da borda
        if (newWidth >= 420 && newWidth <= 1100) setWidth(newWidth);
      }
    };

    const handleMouseUp = () => setResizeMode('none');

    if (resizeMode !== 'none') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeMode]);

  // Helper para gerar IDs únicos
  const generateId = () => Date.now() + Math.random();

  // --- LOGICA DE DRAG AND DROP ---
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    e.stopPropagation();
    setDragItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setIsDragEnabled(false);
  };

  const handleDrop = (e: React.DragEvent, targetItem: DragItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragItem) return;
    if (dragItem.type !== targetItem.type) return;
    if (dragItem.subjectId !== targetItem.subjectId) return;
    if (dragItem.bookId !== targetItem.bookId) return;
    if (dragItem.chapterId !== targetItem.chapterId) return;
    if (dragItem.id === targetItem.id) return;

    reorderItems(dragItem, targetItem.index);
    setDragItem(null);
  };

  const reorderItems = (source: DragItem, targetIndex: number) => {
    setSubjects(prevSubjects => {
      const newSubjects = [...prevSubjects];

      const moveInArray = <T,>(arr: T[], from: number, to: number) => {
        const item = arr[from];
        const newArr = [...arr];
        newArr.splice(from, 1);
        newArr.splice(to, 0, item);
        return newArr;
      };

      if (source.type === 'SUBJECT') {
        return moveInArray(newSubjects, source.index, targetIndex);
      }

      if (source.type === 'BOOK' && source.subjectId !== undefined) {
        const subj = newSubjects.find(s => s.id === source.subjectId);
        if (subj) {
          subj.books = moveInArray(subj.books, source.index, targetIndex);
        }
      }

      if (source.type === 'CHAPTER' && source.subjectId !== undefined && source.bookId !== undefined) {
        const subj = newSubjects.find(s => s.id === source.subjectId);
        const book = subj?.books.find(b => b.id === source.bookId);
        if (book) {
          book.chapters = moveInArray(book.chapters, source.index, targetIndex);
        }
      }

      if (source.type === 'QUEST' && source.subjectId !== undefined && source.bookId !== undefined && source.chapterId !== undefined) {
        const subj = newSubjects.find(s => s.id === source.subjectId);
        const book = subj?.books.find(b => b.id === source.bookId);
        const chap = book?.chapters.find(c => c.id === source.chapterId);
        if (chap) {
          chap.quests = moveInArray(chap.quests, source.index, targetIndex);
        }
      }

      return newSubjects;
    });
  };

  // --- FUNCOES CRUD ---
  const addSubject = () => {
    if (!newSubjectText.trim()) return;
    play8BitSound('powerup');
    setSubjects([...subjects, { id: generateId(), title: newSubjectText, books: [], isOpen: true }]);
    setNewSubjectText('');
  };

  const deleteSubject = (subjectId: number) => {
    play8BitSound('stomp');
    setSubjects(subjects.filter(s => s.id !== subjectId));
  };

  const toggleSubject = (subjectId: number) => {
    play8BitSound('coin');
    setSubjects(subjects.map(s => s.id === subjectId ? { ...s, isOpen: !s.isOpen } : s));
  };

  const addBook = (subjectId: number) => {
    const text = newBookText[subjectId];
    if (!text?.trim()) return;
    play8BitSound('powerup');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? { ...s, books: [...s.books, { id: generateId(), title: text, chapters: [], isOpen: true }] } : s
    ));
    setNewBookText({ ...newBookText, [subjectId]: '' });
  };

  const deleteBook = (subjectId: number, bookId: number) => {
    play8BitSound('stomp');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? { ...s, books: s.books.filter(b => b.id !== bookId) } : s
    ));
  };

  const toggleBook = (subjectId: number, bookId: number) => {
    play8BitSound('coin');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? { ...s, books: s.books.map(b => b.id === bookId ? { ...b, isOpen: !b.isOpen } : b) } : s
    ));
  };

  const addChapter = (subjectId: number, bookId: number) => {
    const text = newChapterText[bookId];
    if (!text?.trim()) return;
    play8BitSound('powerup');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? { ...b, chapters: [...b.chapters, { id: generateId(), title: text, quests: [], isOpen: true }] } : b
        )
      } : s
    ));
    setNewChapterText({ ...newChapterText, [bookId]: '' });
  };

  const deleteChapter = (subjectId: number, bookId: number, chapterId: number) => {
    play8BitSound('stomp');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? { ...b, chapters: b.chapters.filter(c => c.id !== chapterId) } : b
        )
      } : s
    ));
  };

  const toggleChapter = (subjectId: number, bookId: number, chapterId: number) => {
    play8BitSound('coin');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? { ...b, chapters: b.chapters.map(c => c.id === chapterId ? { ...c, isOpen: !c.isOpen } : c) } : b
        )
      } : s
    ));
  };

  const addQuest = (subjectId: number, bookId: number, chapterId: number) => {
    const text = newQuestText[chapterId];
    if (!text?.trim()) return;
    play8BitSound('coin');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? {
            ...b, chapters: b.chapters.map(c =>
              c.id === chapterId ? { ...c, quests: [...c.quests, { id: generateId(), text, completed: false }] } : c
            )
          } : b
        )
      } : s
    ));
    setNewQuestText({ ...newQuestText, [chapterId]: '' });
  };

  const deleteQuest = (subjectId: number, bookId: number, chapterId: number, questId: number) => {
    play8BitSound('stomp');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? {
            ...b, chapters: b.chapters.map(c =>
              c.id === chapterId ? { ...c, quests: c.quests.filter(q => q.id !== questId) } : c
            )
          } : b
        )
      } : s
    ));
  };

  const toggleQuest = (subjectId: number, bookId: number, chapterId: number, questId: number) => {
    play8BitSound('coin');
    setSubjects(subjects.map(s =>
      s.id === subjectId ? {
        ...s, books: s.books.map(b =>
          b.id === bookId ? {
            ...b, chapters: b.chapters.map(c =>
              c.id === chapterId ? { ...c, quests: c.quests.map(q => q.id === questId ? { ...q, completed: !q.completed } : q) } : c
            )
          } : b
        )
      } : s
    ));
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div style={{ width: `${width}px`, maxWidth: '100%' }}>
        {/* Container estilo NES com moldura pixelada */}
        <div className="relative" ref={containerRef}>
          {/* Sombra externa */}
          <div className="absolute bottom-0 left-2 w-full h-full bg-black/40 rounded-lg transform translate-y-2"></div>
          
          {/* Container principal - Message Box Style */}
          <div className="relative border-4 rounded-lg overflow-hidden"
               style={{ 
                   backgroundColor: colors.ui.background, 
                   borderColor: isMinimalist ? '#FFF' : '#000',
                   boxShadow: isMinimalist ? 'none' : 'inset 4px 4px 0 rgba(255,255,255,0.3), inset -4px -4px 0 rgba(0,0,0,0.1)' 
               }}>
            
            {/* Header */}
            <div className="border-b-4 p-4 relative overflow-hidden" 
                 style={{ 
                     backgroundColor: colors.yellow.main, 
                     borderColor: isMinimalist ? '#FFF' : '#000' 
                 }}>
              <div className="relative flex items-center justify-center gap-3">
                <h2 className="text-3xl font-bold tracking-wider" 
                    style={{ 
                        fontFamily: THEME.font, 
                        color: colors.yellow.text,
                        textShadow: isMinimalist ? 'none' : '2px 2px 0 rgba(255,255,255,0.5)' 
                    }}>
                  STUDY MAP
                </h2>
              </div>
            </div>

            {/* Conteúdo principal com scroll */}
            <div className="p-6 overflow-y-auto"
                 style={{ 
                   height: `${height}px`,
                   scrollbarWidth: 'thin',
                   transition: resizeMode !== 'none' ? 'none' : 'height 0.2s ease-out'
                 }}>
              
              {/* Input de Novo Subject (Nível 1) - Estilo Cano Verde */}
              <div className="mb-6 relative">
                <div className="relative border-4 rounded-lg p-3" 
                     style={{ 
                         backgroundColor: colors.green.light, 
                         borderColor: isMinimalist ? '#FFF' : '#000' 
                     }}>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newSubjectText}
                      onChange={(e) => setNewSubjectText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                      placeholder="NEW WORLD (e.g. Math)..."
                      className="flex-1 p-3 text-sm border-4 rounded focus:outline-none focus:ring-4 placeholder-gray-500 font-bold"
                      style={{ 
                          fontFamily: THEME.font,
                          backgroundColor: isMinimalist ? '#000' : '#fff',
                          color: isMinimalist ? '#fff' : '#000',
                          borderColor: isMinimalist ? '#FFF' : '#000',
                          // Minimalist focus ring will be handled by color
                      }}
                    />
                    <RetroButton onClick={addSubject} colorType="blue" size="md" title="Add Subject" sound="powerup" themeMode={themeMode}>
                      <span className="text-xl">+</span>
                    </RetroButton>
                  </div>
                </div>
              </div>

              {/* Lista de Subjects */}
              <div className="space-y-6">
                {subjects.map((subject, subjectIndex) => (
                  <div 
                    key={subject.id} 
                    className={`relative transition-all duration-200 ${dragItem?.id === subject.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                    draggable={isDragEnabled}
                    onDragStart={(e) => handleDragStart(e, { type: 'SUBJECT', id: subject.id, index: subjectIndex })}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, { type: 'SUBJECT', id: subject.id, index: subjectIndex })}
                    onDragEnd={handleDragEnd}
                  >
                    
                    {/* Container do Subject - Estilo Bloco Interrogação */}
                    <div className="relative border-4 rounded-xl overflow-hidden"
                         style={{ 
                             backgroundColor: colors.red.light, 
                             borderColor: isMinimalist ? '#FFF' : '#000' 
                         }}>
                      
                      {/* Header Subject */}
                      <div 
                        className="flex items-center p-4 border-b-4 cursor-pointer hover:brightness-110 transition-all active:translate-y-1"
                        style={{ 
                            backgroundColor: colors.red.main, 
                            borderColor: isMinimalist ? '#FFF' : '#000' 
                        }}
                        onClick={() => toggleSubject(subject.id)}
                      >
                        <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                          <GripHandle setDragEnabled={setIsDragEnabled} isMinimalist={isMinimalist} />
                        </div>
                        
                        {/* Ícone de Mundo - Bloco Interrogação Pixelado */}
                        <div className="mr-3 w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <div className="w-10 h-10 border-4 flex items-center justify-center shadow-lg relative"
                               style={{ 
                                   backgroundColor: colors.yellow.main, 
                                   borderColor: isMinimalist ? '#FFF' : '#000' 
                               }}>
                             <span className="font-bold text-xl" style={{ color: colors.yellow.text }}>?</span>
                          </div>
                        </div>
                        
                        <span className="flex-1 text-xl font-bold break-words tracking-wide" 
                              style={{ 
                                  fontFamily: THEME.font, 
                                  color: colors.red.text,
                                  textShadow: isMinimalist ? 'none' : '2px 2px 0 #000' 
                              }}>
                          {subject.title}
                        </span>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }} 
                          className="px-4 py-2 rounded-lg border-2 hover:opacity-80 active:translate-y-0.5 text-sm font-bold flex-shrink-0 ml-3"
                          style={{ 
                              fontFamily: THEME.font,
                              backgroundColor: isMinimalist ? '#000' : '#000',
                              color: isMinimalist ? '#FFF' : '#FFF',
                              borderColor: isMinimalist ? '#FFF' : '#FFF'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Conteúdo Subject */}
                      {subject.isOpen && (
                        <div className="p-5" style={{ backgroundColor: isMinimalist ? '#000' : '#fff0f0' }}>
                          
                          {/* Input de Novo Book */}
                          <div className="mb-4 relative">
                            <div className="relative border-2 rounded p-2"
                                 style={{ 
                                     backgroundColor: isMinimalist ? '#000' : '#fff',
                                     borderColor: isMinimalist ? '#FFF' : '#000'
                                 }}>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={newBookText[subject.id] || ''}
                                  onChange={(e) => setNewBookText({...newBookText, [subject.id]: e.target.value})}
                                  onKeyDown={(e) => e.key === 'Enter' && addBook(subject.id)}
                                  placeholder="NEW LEVEL..."
                                  className="flex-1 p-2 text-sm border-2 rounded focus:outline-none focus:ring-2 placeholder-gray-500"
                                  style={{ 
                                      fontFamily: THEME.font,
                                      backgroundColor: isMinimalist ? '#000' : '#f3f4f6',
                                      color: isMinimalist ? '#FFF' : '#000',
                                      borderColor: isMinimalist ? '#FFF' : '#000'
                                  }}
                                />
                                <RetroButton onClick={() => addBook(subject.id)} colorType="green" size="sm" title="Add Book" sound="powerup" themeMode={themeMode}>
                                  +
                                </RetroButton>
                              </div>
                            </div>
                          </div>

                          {/* Lista de Books - Estilo Blocos de Tijolos */}
                          <div className="space-y-4">
                            {subject.books.map((book, bookIndex) => (
                              <div 
                                key={book.id} 
                                className={`relative transition-all duration-200 ${dragItem?.id === book.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                draggable={isDragEnabled}
                                onDragStart={(e) => handleDragStart(e, { type: 'BOOK', id: book.id, index: bookIndex, subjectId: subject.id })}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, { type: 'BOOK', id: book.id, index: bookIndex, subjectId: subject.id })}
                                onDragEnd={handleDragEnd}
                              >
                                
                                {/* Container Book */}
                                <div className="relative border-4 rounded-lg overflow-hidden"
                                     style={{ 
                                         backgroundColor: colors.yellow.light,
                                         borderColor: isMinimalist ? '#FFF' : '#000'
                                     }}>
                                
                                  {/* Header Book */}
                                  <div 
                                    className="flex items-center p-3 border-b-4 cursor-pointer hover:brightness-110 transition-all"
                                    style={{ 
                                        backgroundColor: colors.yellow.main,
                                        borderColor: isMinimalist ? '#FFF' : '#000'
                                    }}
                                    onClick={() => toggleBook(subject.id, book.id)}
                                  >
                                    <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                                      <GripHandle setDragEnabled={setIsDragEnabled} isMinimalist={isMinimalist} />
                                    </div>
                                    
                                    <span className="flex-1 text-sm font-bold break-words tracking-wide" 
                                          style={{ fontFamily: THEME.font, color: colors.yellow.text }}>
                                      {book.title}
                                    </span>
                                    
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteBook(subject.id, book.id); }} 
                                      className="px-2 py-1 rounded border-2 hover:opacity-80 active:translate-y-0.5 text-xs font-bold flex-shrink-0 ml-2"
                                      style={{ 
                                          fontFamily: THEME.font,
                                          backgroundColor: isMinimalist ? '#000' : '#ef4444',
                                          color: isMinimalist ? '#FFF' : '#fff',
                                          borderColor: isMinimalist ? '#FFF' : '#000'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* Conteúdo Book */}
                                  {book.isOpen && (
                                    <div className="p-3" style={{ backgroundColor: isMinimalist ? '#000' : '#fff' }}>
                                      
                                      {/* Input de Novo Chapter */}
                                      <div className="flex gap-2 mb-3">
                                        <input 
                                          type="text" 
                                          value={newChapterText[book.id] || ''}
                                          onChange={(e) => setNewChapterText({...newChapterText, [book.id]: e.target.value})}
                                          onKeyDown={(e) => e.key === 'Enter' && addChapter(subject.id, book.id)}
                                          placeholder="NEW STAGE..."
                                          className="flex-1 p-2 text-xs border-2 rounded focus:outline-none focus:ring-2 placeholder-gray-400"
                                          style={{ 
                                              fontFamily: THEME.font,
                                              backgroundColor: isMinimalist ? '#000' : '#fff',
                                              color: isMinimalist ? '#FFF' : '#000',
                                              borderColor: isMinimalist ? '#FFF' : '#000'
                                          }}
                                        />
                                        <button 
                                          onClick={() => addChapter(subject.id, book.id)}
                                          className="px-3 py-1 rounded border-2 hover:opacity-80 active:translate-y-0.5 text-xs font-bold shadow-md"
                                          style={{ 
                                              fontFamily: THEME.font,
                                              backgroundColor: isMinimalist ? '#000' : '#3b82f6',
                                              color: isMinimalist ? '#FFF' : '#fff',
                                              borderColor: isMinimalist ? '#FFF' : '#000'
                                          }}
                                        >
                                          +
                                        </button>
                                      </div>

                                      {/* Lista de Chapters - Estilo Plataformas */}
                                      <div className="space-y-3">
                                        {book.chapters.map((chapter, chapIndex) => (
                                          <div 
                                            key={chapter.id} 
                                            className={`relative transition-all duration-150 ${dragItem?.id === chapter.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                            draggable={isDragEnabled}
                                            onDragStart={(e) => handleDragStart(e, { type: 'CHAPTER', id: chapter.id, index: chapIndex, subjectId: subject.id, bookId: book.id })}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, { type: 'CHAPTER', id: chapter.id, index: chapIndex, subjectId: subject.id, bookId: book.id })}
                                            onDragEnd={handleDragEnd}
                                          >
                                            
                                            {/* Container Chapter */}
                                            <div className="relative border-2 rounded overflow-hidden"
                                                 style={{ 
                                                     backgroundColor: colors.blue.light,
                                                     borderColor: isMinimalist ? '#FFF' : '#000'
                                                 }}>
                                              
                                              {/* Header Chapter */}
                                              <div 
                                                className="flex items-center p-2 border-b-2 cursor-pointer hover:brightness-110 transition-all"
                                                style={{ 
                                                    backgroundColor: colors.blue.main,
                                                    borderColor: isMinimalist ? '#FFF' : '#000'
                                                }}
                                                onClick={() => toggleChapter(subject.id, book.id, chapter.id)}
                                              >
                                                <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                                                  <GripHandle setDragEnabled={setIsDragEnabled} isMinimalist={isMinimalist} />
                                                </div>
                                                
                                                <span className="flex-1 text-xs font-bold break-words" 
                                                      style={{ 
                                                          fontFamily: THEME.font, 
                                                          color: colors.blue.text,
                                                          textShadow: isMinimalist ? 'none' : '1px 1px 0 #000' 
                                                      }}>
                                                  {chapter.title}
                                                </span>
                                                
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); deleteChapter(subject.id, book.id, chapter.id); }} 
                                                  className="hover:text-white px-2 text-xs font-bold flex-shrink-0"
                                                  style={{ color: isMinimalist ? '#FFF' : '#fca5a5' }}
                                                >
                                                  ✕
                                                </button>
                                              </div>

                                              {/* Conteúdo Chapter */}
                                              {chapter.isOpen && (
                                                <div className="p-2" style={{ backgroundColor: isMinimalist ? '#000' : '#fff' }}>
                                                  
                                                  {/* Input de Novo Quest */}
                                                  <div className="flex gap-1 mb-2">
                                                    <input 
                                                      type="text" 
                                                      value={newQuestText[chapter.id] || ''}
                                                      onChange={(e) => setNewQuestText({...newQuestText, [chapter.id]: e.target.value})}
                                                      onKeyDown={(e) => e.key === 'Enter' && addQuest(subject.id, book.id, chapter.id)}
                                                      placeholder="QUEST..."
                                                      className="flex-1 p-1 text-[10px] border rounded focus:outline-none placeholder-gray-400"
                                                      style={{ 
                                                          fontFamily: THEME.font,
                                                          backgroundColor: isMinimalist ? '#000' : '#f9fafb',
                                                          color: isMinimalist ? '#FFF' : '#000',
                                                          borderColor: isMinimalist ? '#FFF' : '#d1d5db'
                                                      }}
                                                    />
                                                    <button 
                                                      onClick={() => addQuest(subject.id, book.id, chapter.id)}
                                                      className="px-2 border rounded text-[10px] font-bold shadow-sm"
                                                      style={{ 
                                                          fontFamily: THEME.font,
                                                          backgroundColor: isMinimalist ? '#000' : '#22c55e',
                                                          color: isMinimalist ? '#FFF' : '#fff',
                                                          borderColor: isMinimalist ? '#FFF' : '#15803d'
                                                      }}
                                                    >
                                                      +
                                                    </button>
                                                  </div>

                                                  {/* Lista de Quests - Estilo Checkboxes Mario */}
                                                  <div className="space-y-1.5">
                                                    {chapter.quests.map((quest, questIndex) => (
                                                      <div 
                                                        key={quest.id} 
                                                        className={`
                                                          group flex items-center gap-2 p-2 rounded transition-all duration-150
                                                          ${dragItem?.id === quest.id ? 'opacity-50 scale-95' : 'opacity-100'}
                                                          ${quest.completed 
                                                            ? (isMinimalist ? 'bg-black border-2 border-white' : 'bg-green-100 border-2 border-green-400') 
                                                            : (isMinimalist ? 'bg-black border-2 border-white' : 'bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:shadow-md')
                                                          }
                                                        `}
                                                        draggable={isDragEnabled}
                                                        onDragStart={(e) => handleDragStart(e, { type: 'QUEST', id: quest.id, index: questIndex, subjectId: subject.id, bookId: book.id, chapterId: chapter.id })}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, { type: 'QUEST', id: quest.id, index: questIndex, subjectId: subject.id, bookId: book.id, chapterId: chapter.id })}
                                                        onDragEnd={handleDragEnd}
                                                      >
                                                        <div className="cursor-grab">
                                                          <GripHandle className="text-gray-300 group-hover:text-gray-500" setDragEnabled={setIsDragEnabled} isMinimalist={isMinimalist} />
                                                        </div>
                                                        
                                                        {/* Checkbox estilo Mario */}
                                                        <div 
                                                          onClick={() => toggleQuest(subject.id, book.id, chapter.id, quest.id)}
                                                          className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                                                            quest.completed 
                                                              ? (isMinimalist ? 'bg-black' : 'bg-green-500 shadow-inner')
                                                              : (isMinimalist ? 'bg-black' : 'bg-white hover:bg-green-100 shadow-sm')
                                                          }`}
                                                          style={{ borderColor: isMinimalist ? '#FFF' : '#000' }}
                                                        >
                                                          {quest.completed && (
                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill={isMinimalist ? "#FFF" : "white"}>
                                                              <path d="M2 6L5 9L10 3" stroke={isMinimalist ? "#FFF" : "white"} strokeWidth="2" fill="none"/>
                                                            </svg>
                                                          )}
                                                        </div>
                                                        
                                                        <span 
                                                          className={`flex-1 text-[11px] break-words ${
                                                            quest.completed 
                                                              ? (isMinimalist ? 'line-through text-white opacity-50' : 'line-through text-gray-500')
                                                              : (isMinimalist ? 'text-white' : 'text-gray-800 font-medium')
                                                          }`}
                                                          style={{ fontFamily: THEME.font }}
                                                        >
                                                          {quest.text}
                                                        </span>
                                                        
                                                        <button 
                                                          onClick={() => deleteQuest(subject.id, book.id, chapter.id, quest.id)}
                                                          className="hover:text-red-600 px-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                          style={{ color: isMinimalist ? '#FFF' : '#f87171' }}
                                                        >
                                                          ✕
                                                        </button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de redimensionamento de ALTURA (bottom) */}
            <div 
              className={`w-full h-2.5 border-t-2 cursor-ns-resize relative group ${
                resizeMode === 'height' ? (isMinimalist ? 'bg-white' : 'bg-yellow-400') : (isMinimalist ? 'bg-black' : 'bg-gray-300')
              }`}
              style={{ borderColor: isMinimalist ? '#FFF' : '#000' }}
              onMouseDown={() => {
                setResizeMode('height');
                play8BitSound('coin');
              }}
            >
              {/* Indicador visual de arrasto */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-1">
                  <div className={`w-1 h-1 rounded-full ${isMinimalist ? 'bg-white' : 'bg-black/50'}`}></div>
                  <div className={`w-1 h-1 rounded-full ${isMinimalist ? 'bg-white' : 'bg-black/50'}`}></div>
                  <div className={`w-1 h-1 rounded-full ${isMinimalist ? 'bg-white' : 'bg-black/50'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Handle de redimensionamento de LARGURA (right edge) */}
          <div
            className="absolute top-0 right-0 w-2.5 h-full cursor-ew-resize group z-10"
            style={{ transform: 'translateX(50%)' }}
            onMouseDown={() => {
              setResizeMode('width');
              play8BitSound('coin');
            }}
          >
            {/* Faixa visual */}
            <div className={`absolute inset-0 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity ${
              resizeMode === 'width' ? (isMinimalist ? 'bg-white opacity-100' : 'opacity-100 bg-yellow-400') : (isMinimalist ? 'bg-white' : 'bg-gray-300')
            }`}
            style={{ borderColor: isMinimalist ? '#FFF' : '#000' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}