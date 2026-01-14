import React, { useState } from 'react';
import { Library, BookOpen, RefreshCw, CheckCircle2, XCircle, AlertCircle, ArrowRight, LampDesk, Book } from 'lucide-react';
import { GermanLevel, ReadingStory } from '../types';
import { generateReadingStory } from '../services/geminiService';
import { addXp, updateMissionProgress } from '../services/storageService';

interface ReadingRoomProps {
  currentLevel: GermanLevel;
  onUpdateStats?: () => void;
}

const GENRES = [
  { id: 'krimi', title: 'Krimi', emoji: '🕵️‍♂️', desc: 'Загадки та розслідування', gradient: 'from-slate-700 to-slate-900', text: 'text-slate-100' },
  { id: 'romanze', title: 'Romanze', emoji: '🌹', desc: 'Кохання та емоції', gradient: 'from-pink-400 to-rose-500', text: 'text-white' },
  { id: 'scifi', title: 'Science Fiction', emoji: '👽', desc: 'Майбутнє та технології', gradient: 'from-violet-500 to-indigo-600', text: 'text-white' },
  { id: 'alltag', title: 'Alltag', emoji: '🚲', desc: 'Щоденне життя в Німеччині', gradient: 'from-emerald-400 to-teal-600', text: 'text-white' },
  { id: 'nachrichten', title: 'Nachrichten', emoji: '📰', desc: 'Актуальні новини', gradient: 'from-blue-400 to-cyan-600', text: 'text-white' },
  { id: 'geschichte', title: 'Geschichte', emoji: '🏰', desc: 'Історія та легенди', gradient: 'from-amber-600 to-yellow-800', text: 'text-white' },
  { id: 'reisen', title: 'Reisen', emoji: '✈️', desc: 'Подорожі та пригоди', gradient: 'from-cyan-400 to-blue-500', text: 'text-white' },
  { id: 'beruf', title: 'Beruf & Karriere', emoji: '💼', desc: 'Бізнес та робоче середовище', gradient: 'from-gray-600 to-slate-700', text: 'text-white' },
  { id: 'maerchen', title: 'Märchen', emoji: '🐉', desc: 'Казки з повчальним змістом', gradient: 'from-fuchsia-500 to-purple-700', text: 'text-white' },
  { id: 'kultur', title: 'Kunst & Kultur', emoji: '🎨', desc: 'Мистецтво, музика та кіно', gradient: 'from-rose-400 to-orange-500', text: 'text-white' }
];

const ReadingRoom: React.FC<ReadingRoomProps> = ({ currentLevel, onUpdateStats }) => {
  const [story, setStory] = useState<ReadingStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz state
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerate = async (genre: string) => {
    setLoading(true);
    setError(null);
    setSelectedGenre(genre);
    setStory(null);
    setQuizSubmitted(false);
    setUserAnswers([]);
    
    try {
      const newStory = await generateReadingStory(genre, currentLevel);
      setStory(newStory);
      setUserAnswers(new Array(newStory.questions.length).fill(-1));
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Не вдалося згенерувати історію. Спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (!story) return;
    let correctCount = 0;
    story.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    setQuizSubmitted(true);
    
    if (correctCount >= 2) {
      addXp(30);
      updateMissionProgress('story_read', 1);
      if (onUpdateStats) onUpdateStats();
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      {!story && !loading && (
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
             <LampDesk className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Бібліотека <span className="text-indigo-600">{currentLevel}</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Оберіть жанр, і штучний інтелект напише для вас унікальну історію з корисною лексикою.
          </p>
        </div>
      )}

      {!story && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2 animate-fade-in">
          {GENRES.map(genre => (
            <button
              key={genre.id}
              onClick={() => handleGenerate(genre.id)}
              className={`
                group relative overflow-hidden rounded-3xl p-6 h-56 text-left transition-all duration-300
                hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${genre.gradient}
              `}
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                  <span className="text-8xl">{genre.emoji}</span>
               </div>
               
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-4xl mb-4 block drop-shadow-sm">{genre.emoji}</span>
                    <h3 className={`text-2xl font-bold mb-1 ${genre.text}`}>{genre.title}</h3>
                    <p className={`text-sm opacity-80 font-medium ${genre.text}`}>{genre.desc}</p>
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-bold ${genre.text} opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0`}>
                    Читати <ArrowRight size={16} />
                  </div>
               </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
           <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
             <BookOpen size={64} className="text-indigo-600 animate-bounce relative z-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">Пишу історію...</h3>
           <p className="text-slate-500">Підбираю цікаві слова для рівня {currentLevel}</p>
        </div>
      )}

      {error && (
         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl max-w-md">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-red-900 mb-2">Виникла помилка</h3>
               <p className="text-red-600/80 mb-6">{error}</p>
               <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => selectedGenre && handleGenerate(selectedGenre)}
                   className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                 >
                   Спробувати ще раз
                 </button>
                 <button 
                   onClick={() => setError(null)}
                   className="text-slate-400 hover:text-slate-600 font-medium text-sm"
                 >
                   Повернутися назад
                 </button>
               </div>
            </div>
         </div>
      )}

      {story && (
        <div className="flex-1 overflow-y-auto animate-fade-in pb-10">
           <div className="flex flex-col lg:flex-row gap-8">
             
             {/* Main Content Column */}
             <div className="flex-1 space-y-8">
                {/* Story Paper */}
                <div className="bg-[#fdfbf7] p-8 md:p-12 rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden group">
                  {/* Decorative book binding effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-stone-300/50"></div>
                  
                  <div className="flex justify-between items-start mb-8 border-b border-stone-200 pb-4">
                     <div>
                       <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1 block">
                         {story.genre} • {currentLevel}
                       </span>
                       <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
                         {story.title}
                       </h1>
                     </div>
                     <button onClick={() => setStory(null)} className="text-stone-400 hover:text-stone-600 transition-colors p-2 hover:bg-stone-100 rounded-full">
                        <XCircle size={24} />
                     </button>
                  </div>
                  
                  <div className="prose prose-lg prose-stone max-w-none font-serif text-stone-800 leading-loose selection:bg-yellow-200">
                    <p className="whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:text-stone-900 first-letter:mr-3 first-letter:float-left">
                      {story.content}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-center text-stone-400 text-sm italic">
                    <Book size={16} className="mr-2" /> Кінець історії
                  </div>
                </div>

                {/* Quiz Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-6 relative z-10 flex items-center gap-2">
                     <CheckCircle2 className="text-indigo-600" />
                     Тест на розуміння
                   </h3>
                   
                   <div className="space-y-8 relative z-10">
                     {story.questions.map((q, qIdx) => (
                       <div key={qIdx} className="space-y-4">
                         <p className="font-bold text-slate-800 text-lg">
                           <span className="text-indigo-500 mr-2">0{qIdx + 1}.</span>
                           {q.question}
                         </p>
                         <div className="grid grid-cols-1 gap-3 pl-4">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userAnswers[qIdx] === optIdx;
                              const isCorrect = q.correctAnswer === optIdx;
                              
                              let statusClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700";
                              let icon = <div className="w-5 h-5 rounded-full border-2 border-slate-300 mr-3"></div>;

                              if (quizSubmitted) {
                                if (isCorrect) {
                                  statusClass = "bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500";
                                  icon = <CheckCircle2 size={20} className="text-green-600 mr-3" />;
                                } else if (isSelected && !isCorrect) {
                                  statusClass = "bg-red-50 border-red-300 text-red-800 opacity-70";
                                  icon = <XCircle size={20} className="text-red-500 mr-3" />;
                                } else {
                                  statusClass = "opacity-50 border-slate-100";
                                }
                              } else if (isSelected) {
                                statusClass = "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500";
                                icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600 mr-3"></div>;
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                  disabled={quizSubmitted}
                                  className={`
                                    flex items-center text-left p-4 rounded-xl border-2 transition-all font-medium text-base
                                    ${statusClass}
                                  `}
                                >
                                  {icon}
                                  {opt}
                                </button>
                              )
                            })}
                         </div>
                       </div>
                     ))}
                   </div>

                   {!quizSubmitted ? (
                      <button 
                        onClick={handleSubmitQuiz}
                        disabled={userAnswers.includes(-1)}
                        className="mt-10 w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-slate-300 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Перевірити відповіді
                      </button>
                   ) : (
                     <div className={`mt-8 p-6 rounded-2xl text-center border-2 animate-pop-in ${score >= 2 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="text-3xl mb-2">{score >= 2 ? '🎉' : '📚'}</div>
                        <h4 className={`text-xl font-extrabold mb-1 ${score >= 2 ? 'text-green-800' : 'text-yellow-800'}`}>
                           {score >= 2 ? 'Чудовий результат!' : 'Гарна спроба!'}
                        </h4>
                        <p className={`${score >= 2 ? 'text-green-700' : 'text-yellow-700'} mb-4`}>
                          Ви відповіли правильно на {score} з {story.questions.length} питань.
                        </p>
                        <button 
                          onClick={() => setStory(null)} 
                          className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${score >= 2 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                        >
                          Читати іншу історію
                        </button>
                     </div>
                   )}
                </div>
             </div>

             {/* Sidebar Column (Vocabulary) */}
             <div className="lg:w-80 space-y-6">
                <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 shadow-sm sticky top-4">
                  <div className="flex items-center gap-2 mb-4 text-yellow-800">
                    <BookOpen size={20} />
                    <h4 className="font-bold text-lg">Словничок</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {story.vocabularyHighlights.map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-yellow-200 shadow-sm transition-transform hover:scale-105 cursor-help group">
                        <div className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{item.word}</div>
                        <div className="text-slate-500 text-sm border-t border-slate-100 mt-1 pt-1">{item.translation}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-xs text-yellow-700/60 text-center leading-relaxed">
                    💡 Натисніть на будь-яке слово в тексті, щоб додати його до свого особистого словника.
                  </div>
                </div>
             </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default ReadingRoom;