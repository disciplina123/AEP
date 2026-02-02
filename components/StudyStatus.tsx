import React, { useMemo } from 'react';
import { Subject } from './StudyMaterials';
import { THEME, getThemeColors } from './RetroUtils';

interface StudyStatusProps {
  subjects: Subject[];
  studyLog: Record<string, number>; // format: "YYYY-MM-DD": minutes
  themeMode: 'mario' | 'minimalist';
}

export default function StudyStatus({ subjects, studyLog, themeMode }: StudyStatusProps) {
  const colors = getThemeColors(themeMode);
  const isMinimalist = themeMode === 'minimalist';

  // Calculate general statistics
  const stats = useMemo(() => {
    // Total hours studied
    const totalMinutes = Object.values(studyLog).reduce((sum, min) => sum + min, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalRemainingMinutes = totalMinutes % 60;

    // Days studied (days with at least 1 minute)
    const daysStudied = Object.values(studyLog).filter(min => min > 0).length;

    // Total quests
    let totalQuests = 0;
    let completedQuests = 0;

    // Statistics per subject
    const subjectStats: Record<string, { totalQuests: number; completedQuests: number }> = {};

    subjects.forEach(subject => {
      let subjectTotalQuests = 0;
      let subjectCompletedQuests = 0;

      subject.books.forEach(book => {
        book.chapters.forEach(chapter => {
          chapter.quests.forEach(quest => {
            totalQuests++;
            subjectTotalQuests++;
            if (quest.completed) {
              completedQuests++;
              subjectCompletedQuests++;
            }
          });
        });
      });

      if (subjectTotalQuests > 0) {
        subjectStats[subject.title] = {
          totalQuests: subjectTotalQuests,
          completedQuests: subjectCompletedQuests
        };
      }
    });

    return {
      totalHours,
      totalRemainingMinutes,
      totalMinutes,
      daysStudied,
      totalQuests,
      completedQuests,
      subjectStats
    };
  }, [subjects, studyLog]);

  // Calculate time per subject
  const subjectTimeEstimates = useMemo(() => {
    const estimates: Record<string, number> = {};
    if (stats.totalQuests === 0) return estimates;

    subjects.forEach(subject => {
      const subjectQuestCount = stats.subjectStats[subject.title]?.totalQuests || 0;
      if (subjectQuestCount > 0) {
        const proportion = subjectQuestCount / stats.totalQuests;
        estimates[subject.title] = Math.round(stats.totalMinutes * proportion);
      }
    });

    return estimates;
  }, [subjects, stats]);

  // Calculate daily average
  const averageMinutesPerDay = stats.daysStudied > 0 
    ? Math.round(stats.totalMinutes / stats.daysStudied) 
    : 0;

  // Calculate streak
  const currentStreak = useMemo(() => {
    const dates = Object.keys(studyLog).sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const dateToCheck = new Date(today);
      dateToCheck.setDate(dateToCheck.getDate() - i);
      const dateStr = dateToCheck.toLocaleDateString('en-CA');
      
      if (studyLog[dateStr] && studyLog[dateStr] > 0) {
        streak++;
      } else {
        // Allow missing today if it's still early? No, strict streak.
        // Actually, if today is missing but yesterday is present, streak is still active until today ends.
        // Simplified check:
        if (i === 0 && dateStr !== dates[0]) {
             // If first date in log is not today, check if it's yesterday
             const lastLogDate = new Date(dates[0]);
             const diff = today.getTime() - lastLogDate.getTime();
             const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
             if (diffDays > 1) break; // Streak broken
             // Continue checking from yesterday
             i--; 
             continue; 
        }
        break;
      }
    }

    return streak;
  }, [studyLog]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Styles helpers
  const cardStyle = (bgColor: string) => ({
    backgroundColor: isMinimalist ? '#000' : bgColor,
    borderColor: isMinimalist ? '#FFF' : '#000',
    color: isMinimalist ? '#FFF' : '#000',
    borderWidth: '4px',
    borderStyle: 'solid',
    boxShadow: isMinimalist ? '4px 4px 0 #FFF' : 'none'
  });

  return (
    <div style={{ 
      width: '95%',
      maxWidth: '950px',
      maxHeight: '90vh',
      padding: '2rem',
      overflowY: 'auto',
      backgroundColor: colors.ui.background,
      border: `4px solid ${isMinimalist ? '#FFF' : '#000'}`,
      boxShadow: isMinimalist ? '8px 8px 0px #FFF' : '8px 8px 0px rgba(0,0,0,0.5)',
    }} className="custom-scrollbar">
      {/* Header - Course Clear Style */}
      <div className="text-center mb-10 relative">
         {/* Decorative bolts in corners */}
        {!isMinimalist && (
            <>
                <div className="absolute top-0 left-0 w-4 h-4 bg-black rounded-full border-2 border-gray-600"></div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-black rounded-full border-2 border-gray-600"></div>
            </>
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ 
          fontFamily: THEME.fonts.pixel,
          color: colors.yellow.main,
          letterSpacing: '2px',
          textShadow: isMinimalist ? 'none' : '4px 4px 0px #000',
          WebkitTextStroke: isMinimalist ? '0px' : '2px #000'
        }}>
          STATUS
        </h1>
      </div>

      {/* General Statistics - Block Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Total Time - Blue Block */}
        <div className="p-4 transform hover:-translate-y-1 transition-transform" style={cardStyle(colors.blue.main)}>
          <div className="flex flex-col items-center">
             {/* Pocket Watch Icon */}
            <div className="mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Minimalist: White outlines only */}
                  <path d="M12 2C12 2 14 2 14 4V6H10V4C10 2 12 2 12 2Z" fill={isMinimalist ? "none" : "#DAA520"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="1"/>
                  <circle cx="12" cy="14" r="8" fill={isMinimalist ? "none" : '#FFD700'} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2"/>
                  {!isMinimalist && <circle cx="12" cy="14" r="6" fill="#FFFFE0" stroke="black" strokeWidth="1"/>}
                  <path d="M12 14L12 10" stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 14L15 14" stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-xs font-bold mb-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF' }}>TOTAL PLAY</h3>
            <p className="text-xl font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF', textShadow: isMinimalist ? 'none' : '2px 2px 0 #000' }}>
                {stats.totalHours}<span className="text-sm">h</span> {stats.totalRemainingMinutes}<span className="text-sm">m</span>
            </p>
          </div>
        </div>

        {/* Streak - Red Block */}
        <div className="p-4 transform hover:-translate-y-1 transition-transform" style={cardStyle(colors.red.main)}>
          <div className="flex flex-col items-center">
             {/* Fire Flower Icon */}
            <div className="mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="6" fill={isMinimalist ? "none" : "#FF4500"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" fill={isMinimalist ? "none" : "#FFD700"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="1"/>
                    <path d="M12 6V2M12 22V18M6 12H2M22 12H18" stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2"/>
                </svg>
            </div>
            <h3 className="text-xs font-bold mb-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF' }}>STREAK</h3>
            <p className="text-xl font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF', textShadow: isMinimalist ? 'none' : '2px 2px 0 #000' }}>
                {currentStreak} DAYS
            </p>
          </div>
        </div>

        {/* Quests - Green Block */}
        <div className="p-4 transform hover:-translate-y-1 transition-transform" style={cardStyle(colors.green.main)}>
          <div className="flex flex-col items-center">
             {/* Checkbox / Flag Icon */}
            <div className="mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="16" height="16" rx="2" fill={isMinimalist ? "none" : "#32CD32"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2"/>
                    <path d="M8 12L11 15L16 9" stroke={isMinimalist ? "#FFF" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <h3 className="text-xs font-bold mb-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF' }}>QUESTS</h3>
            <p className="text-xl font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#FFF', textShadow: isMinimalist ? 'none' : '2px 2px 0 #000' }}>
                {stats.completedQuests}/{stats.totalQuests}
            </p>
          </div>
        </div>

        {/* Avg - Yellow Block */}
        <div className="p-4 transform hover:-translate-y-1 transition-transform" style={cardStyle(colors.yellow.main)}>
          <div className="flex flex-col items-center">
             {/* Graph Icon */}
            <div className="mb-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20H20" stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="2"/>
                    <rect x="6" y="12" width="3" height="8" fill={isMinimalist ? "none" : "#FF6347"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="1"/>
                    <rect x="11" y="8" width="3" height="12" fill={isMinimalist ? "none" : "#4169E1"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="1"/>
                    <rect x="16" y="4" width="3" height="16" fill={isMinimalist ? "none" : "#32CD32"} stroke={isMinimalist ? "#FFF" : "black"} strokeWidth="1"/>
                </svg>
            </div>
            <h3 className="text-xs font-bold mb-1" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : '#000' }}>AVG/DAY</h3>
            <p className="text-xl font-bold" style={{ fontFamily: THEME.font, color: isMinimalist ? '#FFF' : (themeMode === 'mario' ? '#000' : '#FFF'), textShadow: isMinimalist ? 'none' : (themeMode === 'mario' ? '2px 2px 0 #FFF' : '2px 2px 0 #000') }}>
                {averageMinutesPerDay}<span className="text-sm">m</span>
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown per Subject - List */}
      <div className="border-4 p-4 relative" 
           style={{ 
               backgroundColor: isMinimalist ? '#000' : '#fff', 
               borderColor: isMinimalist ? '#FFF' : '#000',
               color: isMinimalist ? '#FFF' : '#000'
           }}>
        
        <div className="absolute -top-4 left-4 px-2" style={{ backgroundColor: isMinimalist ? '#000' : '#fff' }}>
            <h3 className="text-lg font-bold" style={{ fontFamily: THEME.font }}>WORLD PROGRESS</h3>
        </div>

        <div className="mt-4 space-y-4">
            {subjects.length === 0 && (
                <p className="text-center text-gray-500 py-4" style={{ fontFamily: THEME.font }}>NO WORLDS DISCOVERED YET.</p>
            )}

            {subjects.map(subject => {
                const sStats = stats.subjectStats[subject.title] || { totalQuests: 0, completedQuests: 0 };
                const percentage = sStats.totalQuests > 0 
                    ? Math.round((sStats.completedQuests / sStats.totalQuests) * 100) 
                    : 0;
                
                return (
                    <div key={subject.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-sm truncate pr-2" style={{ fontFamily: THEME.font }}>
                                {subject.title}
                            </span>
                            <span className="text-xs" style={{ fontFamily: 'monospace' }}>
                                {percentage}% ({sStats.completedQuests}/{sStats.totalQuests})
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-4 border-2 relative" style={{ borderColor: isMinimalist ? '#FFF' : '#000', backgroundColor: isMinimalist ? '#000' : '#eee' }}>
                            <div className="h-full transition-all duration-500"
                                 style={{ 
                                     width: `${percentage}%`, 
                                     backgroundColor: isMinimalist ? '#FFF' : colors.green.main,
                                     backgroundImage: isMinimalist ? 'none' : `linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)`,
                                     backgroundSize: '1rem 1rem'
                                 }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

    </div>
  );
}