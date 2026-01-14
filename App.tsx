import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import GrammarHub from './components/GrammarHub';
import VocabularyBuilder from './components/VocabularyBuilder';
import WordAnalyzer from './components/WordAnalyzer'; 
import WritingLab from './components/WritingLab';
import ReadingRoom from './components/ReadingRoom';
import PronunciationTrainer from './components/PronunciationTrainer';
import Profile from './components/Profile';
import { AppView, GermanLevel, UserProgress } from './types';
import { Menu, Star, Trophy, Flame, Target, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { getProgress } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentLevel, setCurrentLevel] = useState<GermanLevel>('B1.2');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real stats
  const [stats, setStats] = useState<UserProgress | null>(null);

  const refreshStats = () => {
    setStats(getProgress());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatArea currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.GRAMMAR:
        return <GrammarHub currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.VOCABULARY:
        return <VocabularyBuilder currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.WRITING:
        return <WritingLab currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.READING:
        return <ReadingRoom currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.PRONUNCIATION:
        return <PronunciationTrainer currentLevel={currentLevel} onUpdateStats={refreshStats} />;
      case AppView.PROFILE:
        return <Profile onUpdateStats={refreshStats} />;
      case AppView.DASHBOARD:
      default:
        const currentXP = stats?.xp || 0;
        const currentStreak = stats?.streak || 0;
        const savedCount = stats?.savedWords?.length || 0;
        const levelNum = Math.floor(currentXP / 500) + 1;
        const missions = stats?.dailyMissions || [];

        return (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-enter">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Hallo, Champion! 👋</h1>
                <p className="text-slate-500 font-medium text-lg">Твій прогрес у німецькій <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg">{currentLevel}</span> просто вражає.</p>
              </div>
              <div className="flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-full border border-orange-100 shadow-sm transition-transform hover:scale-105 cursor-default">
                 <Flame className="animate-pulse fill-orange-500" />
                 <span className="font-bold">{currentStreak} Днів Стрік</span>
              </div>
            </header>

            {/* Daily Missions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-enter delay-100 transition-all hover:shadow-md">
               <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                 <Target className="text-red-500" /> Щоденні Місії
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {missions.map((mission, idx) => (
                   <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 ${mission.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${mission.completed ? 'text-green-700' : 'text-slate-700'}`}>{mission.label}</span>
                        {mission.completed ? <CheckCircle2 className="text-green-500 animate-pop" size={20} /> : <Circle className="text-slate-300" size={20} />}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${mission.completed ? 'bg-green-500' : 'bg-indigo-500'}`} 
                          style={{width: `${(mission.progress / mission.target) * 100}%`}}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                         <span className="text-slate-500">{mission.progress} / {mission.target}</span>
                         <span className="text-yellow-600 bg-yellow-100 px-1.5 rounded">+{mission.xpReward} XP</span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-enter delay-200">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110"></div>
                 <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center relative z-10 shadow-inner group-hover:rotate-12 transition-transform">
                   <Trophy size={28} />
                 </div>
                 <div className="relative z-10">
                   <h3 className="font-black text-3xl text-slate-800">LVL {levelNum}</h3>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Рівень Майстерності</p>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110"></div>
                 <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center relative z-10 shadow-inner group-hover:rotate-12 transition-transform">
                   <Target size={28} />
                 </div>
                 <div className="relative z-10">
                   <h3 className="font-black text-3xl text-slate-800">{savedCount}</h3>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Вивчених слів</p>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                 <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110"></div>
                 <div className="h-14 w-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center relative z-10 shadow-inner group-hover:rotate-12 transition-transform">
                   <Star size={28} />
                 </div>
                 <div className="relative z-10">
                   <h3 className="font-black text-3xl text-slate-800">{currentXP} XP</h3>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Досвід</p>
                 </div>
              </div>
            </div>

            {/* Hero Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-200 animate-enter delay-300 group">
               <div className="relative z-10 max-w-xl">
                 <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold mb-4 border border-white/10 shadow-sm animate-pulse">ЩОДЕННИЙ ЧЕЛЕНДЖ</span>
                 <h2 className="text-3xl font-extrabold mb-4 leading-tight">Готові поговорити про свої хобі німецькою ({currentLevel})?</h2>
                 <p className="text-indigo-100 mb-8 text-lg opacity-90">Ханс чекає! Практикуйте розмовну мову та отримуйте миттєві виправлення помилок.</p>
                 <button 
                   onClick={() => setCurrentView(AppView.CHAT)}
                   className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg transform hover:-translate-y-1 active:scale-95 duration-200 flex items-center gap-2"
                 >
                   Розпочати Чат 💬
                 </button>
               </div>
               {/* Abstract Decoration */}
               <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 transition-transform duration-700 group-hover:scale-110">
                 <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
                   <circle cx="12" cy="12" r="10" />
                 </svg>
               </div>
               <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-30 animate-float"></div>
            </div>

            {/* Learning Path */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 animate-enter delay-400">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-xl text-slate-800">Твій шлях {currentLevel}</h3>
                 <button onClick={() => setCurrentView(AppView.GRAMMAR)} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1 group">
                    Дивитись все <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
              
              <div className="space-y-4">
                <div 
                  onClick={() => setCurrentView(AppView.GRAMMAR)}
                  className="group flex items-center p-4 rounded-2xl cursor-pointer border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mr-4 shadow-sm">
                    🏗️
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                       <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Основна Граматика</h4>
                       <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                         {stats?.completedTopics.length || 0} тем пройдено
                       </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 w-1/3 rounded-full"></div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all ml-4" />
                </div>

                <div 
                  onClick={() => setCurrentView(AppView.VOCABULARY)}
                  className="group flex items-center p-4 rounded-2xl cursor-pointer border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mr-4 shadow-sm">
                    🦁
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                       <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Словниковий Запас</h4>
                       <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                         {stats?.savedWords.length || 0} слів
                       </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-2/3 rounded-full"></div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all ml-4" />
                </div>

              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 font-sans selection:bg-indigo-200 overflow-hidden">
      <WordAnalyzer currentLevel={currentLevel} onSave={refreshStats} /> 
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentLevel={currentLevel}
        setLevel={setCurrentLevel}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-30 transition-all">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg active:scale-95 transition-transform">
            <Menu size={24} />
          </button>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 text-lg">DeutschMeister</span>
          <span className="ml-auto text-xs font-bold bg-yellow-400 text-slate-900 px-2 py-1 rounded shadow-sm">{currentLevel}</span>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth" id="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Helper for icon
const ChevronRight = ({size, className}: {size: number, className?: string}) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

export default App;