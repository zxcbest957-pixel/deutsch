import React, { useState, useEffect } from 'react';
import { User, Trophy, Flame, Target, Book, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Trash2, Lock } from 'lucide-react';
import { UserProgress, Achievement, MistakeRecord } from '../types';
import { getProgress, ACHIEVEMENTS_LIST, removeMistake } from '../services/storageService';

interface ProfileProps {
  onUpdateStats: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onUpdateStats }) => {
  const [stats, setStats] = useState<UserProgress | null>(null);
  
  // Mistake Review State
  const [reviewMistake, setReviewMistake] = useState<MistakeRecord | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [sentenceOrder, setSentenceOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  useEffect(() => {
    setStats(getProgress());
  }, []);

  const handleRefresh = () => {
    const updated = getProgress();
    setStats(updated);
    onUpdateStats();
  };

  const startReview = (mistake: MistakeRecord) => {
    setReviewMistake(mistake);
    setFeedback('idle');
    setSelectedOption(null);
    setTextInput('');
    setSentenceOrder([]);
    if (mistake.question.type === 'sentence_order' && mistake.question.options) {
      setAvailableWords([...mistake.question.options]);
    } else {
      setAvailableWords([]);
    }
  };

  const checkAnswer = () => {
    if (!reviewMistake) return;
    const q = reviewMistake.question;
    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      isCorrect = selectedOption === q.correctAnswer;
    } else if (q.type === 'sentence_order') {
       const userAnswer = sentenceOrder.join(' ');
       isCorrect = userAnswer.replace(/[.,!?;]/g, '') === q.correctAnswer.replace(/[.,!?;]/g, '');
    } else if (q.type === 'fill_gap') {
      isCorrect = textInput.trim().toLowerCase() === q.correctAnswer.toLowerCase();
    }

    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => {
        removeMistake(reviewMistake.id);
        setReviewMistake(null);
        handleRefresh();
      }, 1500);
    } else {
      setFeedback('wrong');
    }
  };

  if (!stats) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
         
         <div className="h-28 w-28 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20 shadow-inner backdrop-blur-sm">
           <User size={64} className="text-white" />
         </div>
         
         <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-3xl font-extrabold mb-2">Мій Профіль</h2>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
               <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                 <Trophy className="text-yellow-400" size={20} />
                 <span className="font-bold">{stats.xp} XP</span>
               </div>
               <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                 <Flame className="text-orange-400" size={20} />
                 <span className="font-bold">{stats.streak} днів</span>
               </div>
               <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                 <Book className="text-blue-400" size={20} />
                 <span className="font-bold">{stats.savedWords.length} слів</span>
               </div>
            </div>
         </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Achievements Section */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Target className="text-indigo-600" /> Досягнення
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {ACHIEVEMENTS_LIST.map((ach) => {
               const isUnlocked = stats.unlockedAchievements.includes(ach.id);
               return (
                 <div 
                   key={ach.id} 
                   className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center
                     ${isUnlocked ? 'bg-white border-yellow-200 shadow-sm' : 'bg-slate-50 border-slate-100 grayscale opacity-70'}
                   `}
                 >
                   <div className={`text-4xl mb-2 ${isUnlocked ? 'animate-bounce-slow' : 'opacity-50'}`}>
                     {isUnlocked ? ach.icon : <Lock size={32} className="text-slate-300 mx-auto" />}
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm mb-1">{ach.title}</h4>
                   <p className="text-xs text-slate-500">{ach.description}</p>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Mistake Bank Section */}
        <div className="lg:col-span-1">
           <div className="bg-red-50 rounded-3xl p-6 border border-red-100 h-full flex flex-col">
              <h3 className="text-xl font-bold text-red-800 flex items-center gap-2 mb-4">
                <AlertTriangle /> Банк Помилок <span className="bg-white text-red-600 text-xs px-2 py-1 rounded-full">{stats.mistakes.length}</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2 custom-scrollbar">
                {stats.mistakes.length === 0 ? (
                  <div className="text-center text-red-300 py-10">
                    <CheckCircle2 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Чудово! Помилок немає.</p>
                  </div>
                ) : (
                  stats.mistakes.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-all">
                       <p className="text-sm font-bold text-slate-700 mb-2 line-clamp-2">{m.question.question}</p>
                       <button 
                         onClick={() => startReview(m)}
                         className="w-full py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center justify-center gap-2"
                       >
                         <RefreshCw size={14} /> Виправити
                       </button>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewMistake && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button 
                onClick={() => setReviewMistake(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <XCircle size={24} />
              </button>
              
              <h3 className="text-lg font-bold text-slate-500 uppercase mb-4">Робота над помилками</h3>
              <p className="text-xl font-bold text-slate-900 mb-6">{reviewMistake.question.question}</p>

              {/* Interaction Area based on type */}
              <div className="mb-6">
                 {reviewMistake.question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {reviewMistake.question.options?.map(opt => (
                        <button
                          key={opt}
                          onClick={() => feedback === 'idle' && setSelectedOption(opt)}
                          className={`w-full p-3 rounded-xl border-2 text-left font-medium
                            ${selectedOption === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-200'}
                            ${feedback === 'correct' && opt === reviewMistake.question.correctAnswer ? '!bg-green-100 !border-green-500 !text-green-800' : ''}
                            ${feedback === 'wrong' && selectedOption === opt ? '!bg-red-100 !border-red-500' : ''}
                          `}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                 )}

                 {reviewMistake.question.type === 'fill_gap' && (
                    <input 
                      className={`w-full p-4 border-2 rounded-xl text-lg font-bold outline-none
                        ${feedback === 'correct' ? 'border-green-500 text-green-700 bg-green-50' : feedback === 'wrong' ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}
                      `}
                      placeholder="..."
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                    />
                 )}
                 
                 {reviewMistake.question.type === 'sentence_order' && (
                    <div className="space-y-4">
                       <div className="min-h-[60px] border-b-2 border-slate-100 flex flex-wrap gap-2 p-2">
                          {sentenceOrder.map((word, idx) => (
                             <span key={idx} onClick={() => {
                                setSentenceOrder(prev => prev.filter((_, i) => i !== idx));
                                setAvailableWords(prev => [...prev, word]);
                             }} className="bg-slate-100 px-3 py-1 rounded-lg font-bold cursor-pointer">{word}</span>
                          ))}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {availableWords.map((word, idx) => (
                             <button key={idx} onClick={() => {
                                setAvailableWords(prev => prev.filter((_, i) => i !== idx));
                                setSentenceOrder(prev => [...prev, word]);
                             }} className="border border-slate-300 px-3 py-1 rounded-lg font-medium hover:bg-slate-50">{word}</button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              {feedback === 'idle' && (
                <button 
                  onClick={checkAnswer}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg"
                >
                  Перевірити
                </button>
              )}
              
              {feedback === 'correct' && (
                <div className="text-center text-green-600 font-bold text-lg animate-bounce">
                  <CheckCircle2 className="inline mr-2" /> Виправлено! (+5 XP)
                </div>
              )}
              
              {feedback === 'wrong' && (
                <div className="text-center text-red-500 font-bold mb-4">
                  Спробуйте ще раз!
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
