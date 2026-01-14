import React, { useState } from 'react';
import { PenTool, RefreshCw, Send, CheckCircle2, AlertTriangle, Sparkles, MoveRight, Award, AlignLeft, Eraser, FileText, ChevronRight } from 'lucide-react';
import { GermanLevel, WritingTopic, WritingAnalysis } from '../types';
import { generateWritingTopic, analyzeWriting } from '../services/geminiService';
import { addXp } from '../services/storageService';

interface WritingLabProps {
  currentLevel: GermanLevel;
  onUpdateStats?: () => void;
}

const WritingLab: React.FC<WritingLabProps> = ({ currentLevel, onUpdateStats }) => {
  const [topic, setTopic] = useState<WritingTopic | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<WritingAnalysis | null>(null);

  const handleNewTopic = async () => {
    setLoading(true);
    setTopic(null);
    setResult(null);
    setText('');
    try {
      const newTopic = await generateWritingTopic(currentLevel);
      setTopic(newTopic);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim() || !topic) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeWriting(text, topic.topic, currentLevel);
      setResult(analysis);
      addXp(20); 
      if (onUpdateStats) onUpdateStats();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-8 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <PenTool className="text-indigo-600" size={32} />
         </div>
         <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Писемна Майстерня
         </h2>
         <p className="text-slate-500 max-w-lg mx-auto">
            Практикуйте німецьку письмову мову, отримуйте виправлення та поради від ШІ.
         </p>
      </div>

      {!topic ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full text-center relative overflow-hidden group hover:shadow-2xl transition-all">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
             
             <div className="mb-8 relative">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-4xl">
                   ✍️
                </div>
                <div className="absolute top-0 right-1/3 animate-ping w-3 h-3 bg-yellow-400 rounded-full"></div>
             </div>

             <h3 className="text-2xl font-bold text-slate-800 mb-3">Нова тема</h3>
             <p className="text-slate-500 mb-8 leading-relaxed">
               Я згенерую цікаву тему для есе рівня <span className="font-bold text-indigo-600">{currentLevel}</span>, дам підказки по лексиці та перевірю твій текст.
             </p>
             
             <button 
               onClick={handleNewTopic}
               disabled={loading}
               className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loading ? (
                 <>
                   <RefreshCw className="animate-spin" size={20} /> Генерую...
                 </>
               ) : (
                 <>
                   <Sparkles size={20} className="text-yellow-400" /> Отримати Тему
                 </>
               )}
             </button>
          </div>
        </div>
      ) : !result ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fade-in-up">
          {/* Topic Sidebar / Top Section */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-lg relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 rounded-full blur-xl"></div>
               
               <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                 <FileText size={16} /> Ваше завдання
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{topic.topic}</h3>
               <p className="text-slate-600 mb-6 leading-relaxed">{topic.description}</p>
               
               <div className="space-y-3">
                 <span className="text-xs font-bold text-slate-400 uppercase">Спробуйте вжити:</span>
                 <div className="flex flex-wrap gap-2">
                   {topic.hints.map((hint, i) => (
                     <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200">
                       {hint}
                     </span>
                   ))}
                 </div>
               </div>
            </div>
            
            <button 
              onClick={() => setTopic(null)} 
              className="hidden lg:flex w-full items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-medium py-2"
            >
              <Eraser size={16} /> Скасувати та вийти
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
               <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${Math.min(100, Math.max(5, (text.length / 500) * 100))}%` }}></div>
               </div>
               
               <textarea 
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Schreiben Sie hier..."
                 className="flex-1 w-full resize-none focus:outline-none p-6 md:p-8 text-slate-800 text-lg leading-relaxed placeholder:text-slate-300"
                 spellCheck="false"
               />
               
               <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400">
                    {text.length} символів
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={analyzing || text.length < 20}
                    className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md hover:shadow-green-200 flex items-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Аналіз...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Перевірити
                      </>
                    )}
                  </button>
               </div>
            </div>
            <button onClick={() => setTopic(null)} className="lg:hidden mt-4 text-slate-400 hover:text-red-500 text-sm flex justify-center items-center gap-2">
               <Eraser size={16} /> Скасувати
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 animate-fade-in pb-10">
           {/* Report Card */}
           <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
              <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase text-xs tracking-wider mb-2">
                       <Award size={16} /> Результат аналізу
                    </div>
                    <h2 className="text-3xl font-extrabold mb-1">
                      Ваша оцінка: <span className={result.score >= 8 ? 'text-green-400' : result.score >= 5 ? 'text-yellow-400' : 'text-red-400'}>{result.score}/10</span>
                    </h2>
                    <p className="text-slate-400 max-w-xl">{result.generalComment}</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Рівень</div>
                    <div className="text-2xl font-black">{result.levelAssessment}</div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                 {/* Corrections Column */}
                 <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                       <AlertTriangle className="text-amber-500" size={20} /> Ваші помилки
                    </h4>
                    
                    <div className="space-y-6">
                       <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-slate-800 leading-relaxed font-medium">
                          {result.correctedText}
                       </div>
                       
                       <div className="space-y-3">
                         {result.feedback.map((item, i) => (
                           <div key={i} className="flex gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="min-w-[6px] w-[6px] h-[6px] rounded-full bg-red-500 mt-2"></div>
                              <span>{item}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>

                 {/* Native Version Column */}
                 <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-50/50 to-white">
                    <h4 className="font-bold text-indigo-900 mb-6 flex items-center gap-2 text-lg">
                       <Sparkles className="text-indigo-500" size={20} /> Версія носія (Native)
                    </h4>
                    
                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm text-slate-700 leading-loose font-serif text-lg relative">
                       <div className="absolute top-0 right-0 p-2 opacity-10">
                          <AlignLeft size={48} className="text-indigo-600" />
                       </div>
                       {result.improvedVersion}
                    </div>
                    
                    <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 bg-white/50 p-4 rounded-xl">
                       <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                          <CheckCircle2 size={18} />
                       </div>
                       <p>Порівняйте цю версію зі своєю. Зверніть увагу на порядок слів та використання більш природних фраз.</p>
                    </div>
                 </div>
              </div>
              
              {/* Footer Actions */}
              <div className="bg-slate-50 p-4 md:p-6 border-t border-slate-200 flex justify-center">
                 <button 
                   onClick={handleNewTopic}
                   className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-slate-300 flex items-center gap-2"
                 >
                   <RefreshCw size={18} /> Спробувати іншу тему
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WritingLab;