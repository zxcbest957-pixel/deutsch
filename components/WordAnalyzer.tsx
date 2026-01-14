import React, { useEffect, useState, useRef } from 'react';
import { X, BookOpen, Sparkles, Loader2, BookmarkPlus, BookmarkCheck, AlertCircle } from 'lucide-react';
import { analyzeSelection } from '../services/geminiService';
import { TextAnalysis, GermanLevel, VocabularyItem } from '../types';
import { saveWordToDictionary, getProgress } from '../services/storageService';

interface WordAnalyzerProps {
  currentLevel: GermanLevel;
  onSave: () => void;
}

const WordAnalyzer: React.FC<WordAnalyzerProps> = ({ currentLevel, onSave }) => {
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TextAnalysis | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      const activeSelection = window.getSelection();
      const text = activeSelection?.toString().trim();

      // Basic validation: must be text, not too long, not inside the popup itself
      if (text && text.length > 1 && text.length < 50) {
        if (popupRef.current && popupRef.current.contains(activeSelection?.anchorNode?.parentElement || null)) {
          return;
        }

        const range = activeSelection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position (centered above selection)
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY
        });
        
        // Don't re-fetch if it's the same selection
        if (text !== selection) {
          setSelection(text);
          fetchAnalysis(text);
        }
      } else if (!text) {
        // Only close if we click outside and there is no text selected
        // We handle click-outside in a separate listener
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
       // Close if clicked outside
       if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
         setSelection(null);
         setData(null);
         setIsSaved(false);
         setError(null);
       }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selection]);

  const fetchAnalysis = async (text: string) => {
    setLoading(true);
    setData(null);
    setIsSaved(false);
    setError(null);
    
    try {
      const result = await analyzeSelection(text);
      setData(result);
      // Check if this word is already in storage to set initial isSaved state
      const progress = getProgress();
      const alreadyExists = progress.savedWords.some(w => w.german.toLowerCase() === result.word.toLowerCase());
      setIsSaved(alreadyExists);
    } catch (error: any) {
      console.error("Analysis failed", error);
      setError(error.message || "Не вдалося завантажити дані.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!data) return;
    
    const vocabItem: VocabularyItem = {
      german: data.word,
      ukrainian: data.translation,
      exampleSentence: data.examples[0] || `Das Wort "${data.word}" ist sehr nützlich.`
    };
    
    saveWordToDictionary(vocabItem, currentLevel);
    setIsSaved(true);
    onSave();
  };

  if (!selection) return null;

  return (
    <div 
      ref={popupRef}
      className="absolute z-50 transform -translate-x-1/2 -translate-y-full mb-2"
      style={{ left: position.x, top: position.y - 10 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-0 w-80 md:w-96 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="font-bold text-sm">Smart Dictionary</span>
          </div>
          <button onClick={() => setSelection(null)} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[100px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="text-xs">Аналізую "{selection}"...</span>
            </div>
          ) : error ? (
             <div className="flex flex-col items-center justify-center text-center p-4 text-red-500 gap-3">
               <AlertCircle size={24} />
               <p className="text-sm font-medium">{error}</p>
               <button 
                 onClick={() => fetchAnalysis(selection)}
                 className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
               >
                 Спробувати ще раз
               </button>
             </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Word & Translation */}
              <div>
                 <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">{data.word}</h3>
                    <span className="text-xs font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">{data.partOfSpeech}</span>
                 </div>
                 <p className="text-lg text-indigo-600 font-medium mb-1">{data.translation}</p>
                 <p className="text-sm text-slate-500">{data.grammarInfo}</p>
              </div>

              {/* Conjugation (if available) */}
              {data.conjugation && data.conjugation.length > 0 && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase mb-2 flex items-center gap-1">
                     <BookOpen size={12} /> Відмінювання (Präsens)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {data.conjugation[0]?.forms.slice(0, 6).map((form, i) => ( // Show first 6 forms usually
                      <div key={i} className="text-slate-700">{form}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Приклади</h4>
                <ul className="space-y-2">
                  {data.examples.map((ex, i) => (
                    <li key={i} className="text-sm text-slate-600 border-l-2 border-yellow-400 pl-3 italic">
                      "{ex}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`w-full py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                  ${isSaved 
                    ? 'bg-green-100 text-green-700 cursor-default' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-300/50'}
                `}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck size={16} /> Збережено в словник
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={16} /> Зберегти слово
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
        
        {/* Arrow pointer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white border-r border-b border-indigo-100"></div>
      </div>
    </div>
  );
};

export default WordAnalyzer;