import React, { useState, useEffect } from 'react';
import { Search, Plus, Book, ChevronRight, Trash2, BookmarkCheck, Bookmark, Layers, RotateCw, Check, X } from 'lucide-react';
import { generateVocabulary } from '../services/geminiService';
import { VocabularyItem, GermanLevel, SavedWord } from '../types';
import { saveWordToDictionary, getProgress, removeWordFromDictionary } from '../services/storageService';

interface VocabularyBuilderProps {
  currentLevel: GermanLevel;
  onUpdateStats: () => void; // Callback to refresh header stats
}

type VocabView = 'generate' | 'dictionary' | 'flashcards';

const VocabularyBuilder: React.FC<VocabularyBuilderProps> = ({ currentLevel, onUpdateStats }) => {
  const [view, setView] = useState<VocabView>('generate');
  const [theme, setTheme] = useState('');
  const [generatedWords, setGeneratedWords] = useState<VocabularyItem[]>([]);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(false);

  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load dictionary on mount and when tab changes
  useEffect(() => {
    refreshDictionary();
  }, [view]);

  const refreshDictionary = () => {
    const progress = getProgress();
    setSavedWords(progress.savedWords);
  };

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setGeneratedWords([]);
    try {
      const result = await generateVocabulary(theme, currentLevel);
      setGeneratedWords(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = (word: VocabularyItem) => {
    saveWordToDictionary(word, currentLevel);
    refreshDictionary();
    onUpdateStats();
  };

  const handleRemoveWord = (id: string) => {
    removeWordFromDictionary(id);
    refreshDictionary();
    onUpdateStats();
  };

  const isSaved = (word: string) => savedWords.some(w => w.german === word);

  // Flashcard Logic
  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % savedWords.length);
    }, 200);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-6 self-center overflow-x-auto max-w-full">
        <button 
          onClick={() => setView('generate')}
          className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'generate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Генератор ✨
        </button>
        <button 
          onClick={() => setView('dictionary')}
          className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'dictionary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Мій Словник 📖 <span className="ml-1 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-xs">{savedWords.length}</span>
        </button>
        <button 
          onClick={() => { setView('flashcards'); setCurrentCardIndex(0); setIsFlipped(false); }}
          className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'flashcards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Картки 🃏
        </button>
      </div>

      {view === 'generate' && (
        <>
          <div className="bg-indigo-600 rounded-2xl p-8 mb-6 text-white shadow-lg shadow-indigo-900/20">
            <h2 className="text-2xl font-bold mb-2">Генератор слів</h2>
            <p className="text-indigo-100 mb-6">Введіть тему, і я знайду 5 корисних слів для рівня <span className="font-bold text-yellow-300">{currentLevel}</span>.</p>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Введіть тему (напр. Reisen, Arbeit)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading || !theme.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Пошук'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pb-10">
            {generatedWords.length > 0 ? (
              generatedWords.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {item.german}
                        <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500">{currentLevel}</span>
                      </h3>
                      <p className="text-slate-500 italic mb-3">{item.ukrainian}</p>
                    </div>
                    <button 
                      onClick={() => handleSaveWord(item)}
                      disabled={isSaved(item.german)}
                      className={`p-2 rounded-full transition-colors ${isSaved(item.german) ? 'bg-green-50 text-green-600' : 'hover:bg-indigo-50 text-indigo-400'}`}
                    >
                       {isSaved(item.german) ? <BookmarkCheck size={24} /> : <Plus size={24} />}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border-l-4 border-indigo-400">
                    "{item.exampleSentence}"
                  </div>
                </div>
              ))
            ) : (
              !loading && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Book size={48} className="mb-2 opacity-50" />
                  <p>Введіть тему, щоб почати</p>
                </div>
              )
            )}
            {loading && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white h-32 rounded-xl animate-pulse"></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'dictionary' && (
        <div className="flex-1 overflow-y-auto space-y-4 pb-10">
          {savedWords.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
               <Bookmark size={64} className="mx-auto mb-4 opacity-20" />
               <p className="text-lg">Ваш словник порожній.</p>
               <button onClick={() => setView('generate')} className="text-indigo-600 font-bold mt-2 hover:underline">Додати слова</button>
            </div>
          ) : (
            savedWords.map((word) => (
              <div key={word.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{word.level}</span>
                      <span className="text-xs text-slate-400">{new Date(word.addedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{word.german}</h3>
                    <p className="text-slate-600">{word.ukrainian}</p>
                    <p className="text-sm text-slate-400 mt-1 italic">"{word.exampleSentence}"</p>
                 </div>
                 <button 
                   onClick={() => handleRemoveWord(word.id)}
                   className="text-slate-300 hover:text-red-500 p-2 transition-colors self-end md:self-center"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'flashcards' && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {savedWords.length === 0 ? (
            <div className="text-center text-slate-500">
              <Layers size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium mb-2">Немає карток</p>
              <p className="mb-4">Спочатку додайте слова до словника.</p>
              <button onClick={() => setView('generate')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">
                Знайти слова
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md perspective-1000">
               <div className="text-center mb-6 text-slate-400 font-medium">
                  Картка {currentCardIndex + 1} / {savedWords.length}
               </div>

               {/* Flip Card Container */}
               <div 
                 className="relative w-full h-80 cursor-pointer group"
                 onClick={() => setIsFlipped(!isFlipped)}
                 style={{ perspective: '1000px' }}
               >
                 <div className={`
                    absolute inset-0 w-full h-full rounded-3xl shadow-2xl transition-all duration-500 transform border border-slate-200
                    ${isFlipped ? 'rotate-y-180' : ''}
                 `} style={{ transformStyle: 'preserve-3d' }}>
                    
                    {/* Front */}
                    <div className="absolute inset-0 w-full h-full bg-white rounded-3xl flex flex-col items-center justify-center p-8 backface-hidden">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Deutsch</span>
                       <h2 className="text-4xl font-extrabold text-slate-900 text-center break-words">
                         {savedWords[currentCardIndex].german}
                       </h2>
                       <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-1 animate-pulse">
                         <RotateCw size={14} /> Натисніть, щоб перевернути
                       </div>
                    </div>

                    {/* Back */}
                    <div className={`
                      absolute inset-0 w-full h-full bg-indigo-600 text-white rounded-3xl flex flex-col items-center justify-center p-8 backface-hidden
                    `} style={{ transform: 'rotateY(180deg)' }}>
                       <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Українська</span>
                       <h2 className="text-3xl font-bold mb-6 text-center break-words">
                         {savedWords[currentCardIndex].ukrainian}
                       </h2>
                       <div className="bg-white/10 p-4 rounded-xl text-center">
                         <p className="text-indigo-100 italic">"{savedWords[currentCardIndex].exampleSentence}"</p>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Controls */}
               <div className="flex items-center justify-center gap-4 mt-8">
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                   className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 hover:scale-110 transition-all shadow-md"
                   title="Ще не знаю"
                 >
                   <X size={28} />
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                   className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 hover:scale-110 transition-all shadow-md"
                   title="Знаю"
                 >
                   <Check size={28} />
                 </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyBuilder;