import React from 'react';
import { MessageSquare, BookOpen, GraduationCap, LayoutDashboard, Menu, X, BarChart, PenTool, Library, UserCircle, Mic } from 'lucide-react';
import { AppView, GermanLevel } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  currentLevel: GermanLevel;
  setLevel: (level: GermanLevel) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentLevel, setLevel, isOpen, toggleSidebar }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Головна', icon: <LayoutDashboard size={20} /> },
    { view: AppView.PROFILE, label: 'Мій Профіль', icon: <UserCircle size={20} /> },
    { view: AppView.CHAT, label: 'AI Репетитор', icon: <MessageSquare size={20} /> },
    { view: AppView.GRAMMAR, label: 'Граматика', icon: <GraduationCap size={20} /> },
    { view: AppView.VOCABULARY, label: 'Лексика', icon: <BookOpen size={20} /> },
    { view: AppView.PRONUNCIATION, label: 'Вимова', icon: <Mic size={20} /> },
    { view: AppView.READING, label: 'Читання', icon: <Library size={20} /> },
    { view: AppView.WRITING, label: 'Письмо', icon: <PenTool size={20} /> },
  ];

  const levels: GermanLevel[] = ['A1', 'A2', 'B1.1', 'B1.2'];

  return (
    <>
      {/* Mobile Overlay with Blur */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-pointer">
            DeutschMeister
          </h1>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Level Selector */}
        <div className="px-6 mb-6">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ваш Рівень</label>
           <div className="grid grid-cols-2 gap-2">
             {levels.map(level => (
               <button
                 key={level}
                 onClick={() => setLevel(level)}
                 className={`
                   text-sm font-bold py-2 px-2 rounded-lg transition-all border transform active:scale-95 duration-200
                   ${currentLevel === level 
                     ? 'bg-yellow-400 text-slate-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                     : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'}
                 `}
               >
                 {level}
               </button>
             ))}
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative overflow-hidden group
                ${currentView === item.view 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-100' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'}
              `}
            >
              <div className={`transition-transform duration-300 ${currentView === item.view ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
              {currentView === item.view && (
                <div className="absolute right-0 top-0 h-full w-1 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 transition-transform hover:scale-[1.02]">
            <p className="text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span>Прогрес {currentLevel}</span>
              <BarChart size={12} />
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-white text-lg">{currentLevel}</span>
              <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: currentLevel === 'B1.2' ? '25%' : currentLevel === 'B1.1' ? '50%' : currentLevel === 'A2' ? '75%' : '10%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;