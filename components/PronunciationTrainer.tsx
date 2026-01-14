import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Play, RefreshCw, AudioWaveform, ThumbsUp, ThumbsDown, Loader2, Keyboard, Sparkles } from 'lucide-react';
import { GermanLevel, PronunciationFeedback } from '../types';
import { generatePronunciationExercise, analyzePronunciation } from '../services/geminiService';
import { addXp, updateMissionProgress } from '../services/storageService';

interface PronunciationTrainerProps {
  currentLevel: GermanLevel;
  onUpdateStats?: () => void;
}

type Mode = 'random' | 'custom';

const PronunciationTrainer: React.FC<PronunciationTrainerProps> = ({ currentLevel, onUpdateStats }) => {
  const [mode, setMode] = useState<Mode>('random');
  const [customInput, setCustomInput] = useState('');
  
  const [targetText, setTargetText] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);

  const recognitionRef = useRef<any>(null);

  const startNewExercise = async () => {
    setLoading(true);
    setFeedback(null);
    setUserTranscript('');
    try {
      const sentence = await generatePronunciationExercise(currentLevel);
      setTargetText(sentence);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    setTargetText(customInput.trim());
    setFeedback(null);
    setUserTranscript('');
  };

  const resetCustom = () => {
    setTargetText(null);
    setFeedback(null);
    setUserTranscript('');
  };

  const speakTarget = () => {
    if (!targetText) return;
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Ваш браузер не підтримує розпізнавання мови.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'de-DE';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setUserTranscript(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleAnalyze = async () => {
    if (!targetText || !userTranscript) return;
    setAnalyzing(true);
    try {
      const result = await analyzePronunciation(targetText, userTranscript);
      setFeedback(result);
      if (result.score > 60) {
          addXp(20);
          updateMissionProgress('pronunciation_practice', 1);
          if (onUpdateStats) onUpdateStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Initial load only if mode is random
  useEffect(() => {
     if (mode === 'random' && !targetText) {
       startNewExercise();
     }
  }, [mode]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col items-center pb-20">
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
           <AudioWaveform className="text-indigo-600" size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Тренер Вимови</h2>
        <p className="text-slate-500">Повторюйте за ШІ та вдосконалюйте свій акцент.</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-200 p-1 rounded-xl mb-8 shadow-inner">
         <button 
            onClick={() => { setMode('random'); setTargetText(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'random' ? 'bg-white shadow-sm text-indigo-900 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <Sparkles size={16} /> Випадкова фраза
         </button>
         <button 
            onClick={() => { setMode('custom'); setTargetText(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'custom' ? 'bg-white shadow-sm text-indigo-900 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <Keyboard size={16} /> Ввести свій текст
         </button>
      </div>

      {/* CUSTOM INPUT AREA */}
      {mode === 'custom' && !targetText && (
         <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-200 animate-fade-in mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Що хочете вивчити?</label>
            <textarea 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-lg text-slate-800 placeholder-slate-300 transition-all resize-none"
              placeholder="Введіть слово або речення німецькою..."
              rows={3}
            />
            <button 
              onClick={handleCustomSubmit}
              disabled={!customInput.trim()}
              className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-200"
            >
              Почати тренування
            </button>
         </div>
      )}

      {/* TRAINER CARD */}
      {(targetText || loading) && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative animate-fade-in-up">
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                    <p>Підбираю фразу для рівня {currentLevel}...</p>
                </div>
            ) : (
                <div className="p-8 md:p-12 text-center">
                    <div className="mb-8">
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                           {mode === 'random' ? `Фраза (${currentLevel})` : 'Ваш текст'}
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
                            {targetText}
                        </h3>
                        <button 
                        onClick={speakTarget}
                        className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                        >
                        <Volume2 size={20} /> Прослухати (Носій)
                        </button>
                    </div>

                    {/* Interaction Area */}
                    <div className="space-y-6">
                        <button
                        onClick={toggleRecording}
                        className={`
                            w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg mx-auto
                            ${isRecording 
                                ? 'bg-red-500 text-white animate-pulse shadow-red-300 scale-110' 
                                : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:scale-105 shadow-indigo-300'}
                        `}
                        >
                        {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
                        </button>
                        
                        <p className="text-slate-400 h-6">
                            {isRecording ? "Слухаю..." : (userTranscript ? "Натисніть мікрофон, щоб перезаписати" : "Натисніть, щоб говорити")}
                        </p>

                        {userTranscript && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Що я почув:</p>
                                <p className="text-lg text-slate-700 font-medium italic">"{userTranscript}"</p>
                            </div>
                        )}
                    </div>

                    {/* Analysis Button */}
                    {userTranscript && !feedback && (
                    <button 
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg w-full md:w-auto"
                    >
                        {analyzing ? <Loader2 className="animate-spin mx-auto" /> : "Перевірити Вимову"}
                    </button>
                    )}
                </div>
            )}

            {/* Feedback Section */}
            {feedback && (
                <div className="bg-slate-50 border-t border-slate-100 p-8 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className={`
                            w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-4 shadow-sm
                            ${feedback.score >= 80 ? 'bg-green-100 border-green-500 text-green-600' : 
                            feedback.score >= 50 ? 'bg-yellow-100 border-yellow-500 text-yellow-600' : 
                            'bg-red-100 border-red-500 text-red-600'}
                        `}>
                            {feedback.score}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="font-bold text-lg text-slate-800 mb-1">
                                {feedback.score >= 80 ? "Відмінно!" : feedback.score >= 50 ? "Непогано!" : "Треба попрацювати"}
                            </h4>
                            <p className="text-slate-600 leading-relaxed">{feedback.feedback}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {feedback.tips.map((tip, i) => (
                            <div key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-600">
                                <div className="min-w-[4px] w-1 bg-indigo-400 rounded-full"></div>
                                {tip}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={mode === 'random' ? startNewExercise : resetCustom}
                        className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                        {mode === 'random' ? <><RefreshCw size={20} /> Наступна фраза</> : <><Keyboard size={20} /> Ввести інше слово</>}
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PronunciationTrainer;