import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, BrainCircuit, RefreshCw, Volume2, GraduationCap, X, Send, Loader2, BookOpen, Play, AlertCircle } from 'lucide-react';
import { TOPICS_BY_LEVEL } from '../constants';
import { GrammarTopic, QuizData, QuizQuestion, Message, GermanLevel } from '../types';
import { generateGrammarQuiz, askLessonTutor, getGrammarTheory } from '../services/geminiService';
import { addXp, markTopicComplete, saveMistake } from '../services/storageService';

interface GrammarHubProps {
  currentLevel: GermanLevel;
  onUpdateStats?: () => void;
}

const GrammarHub: React.FC<GrammarHubProps> = ({ currentLevel, onUpdateStats }) => {
  const [view, setView] = useState<'menu' | 'theory' | 'quiz'>('menu');
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  
  // Theory State
  const [theoryContent, setTheoryContent] = useState<string>('');
  const [theoryLoading, setTheoryLoading] = useState(false);

  // Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // New error state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const availableTopics = TOPICS_BY_LEVEL[currentLevel] || [];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [sentenceOrder, setSentenceOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const assistantEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedTopic(null);
    setView('menu');
    setError(null);
  }, [currentLevel]);

  const handleTopicSelect = async (topic: GrammarTopic) => {
    setSelectedTopic(topic);
    setView('theory');
    setTheoryLoading(true);
    setTheoryContent('');
    setError(null);
    
    try {
      // Check if we have cached theory (optional optimization, but we'll fetch fresh for now)
      const theory = await getGrammarTheory(topic.title, currentLevel);
      setTheoryContent(theory);
    } catch (e) {
      setTheoryContent("Вибачте, не вдалося завантажити теорію.");
    } finally {
      setTheoryLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!selectedTopic) return;
    setView('quiz');
    setLoading(true);
    setError(null);
    setQuizData(null);
    setCurrentQuestionIndex(0);
    setCurrentScore(0);
    setQuizFinished(false);
    setFeedbackState('idle');
    resetQuestionState();
    resetAssistant();

    try {
      const data = await generateGrammarQuiz(selectedTopic.promptContext, currentLevel);
      setQuizData(data);
    } catch (error: any) {
      console.error("Quiz generation failed", error);
      setError(error.message || "Не вдалося згенерувати тест. Перевірте з'єднання або спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionState = () => {
    setSelectedOption(null);
    setSentenceOrder([]);
    setAvailableWords([]);
    setTextInput('');
    setFeedbackState('idle');
  };

  const resetAssistant = () => {
    setShowAssistant(false);
    setAssistantMessages([{ role: 'model', text: 'Привіт! Я Професор Мюллер. Якщо щось незрозуміло у цьому завданні, запитай мене! 👇' }]);
  };

  useEffect(() => {
    if (quizData && quizData.questions[currentQuestionIndex]) {
      const q = quizData.questions[currentQuestionIndex];
      if (q.type === 'sentence_order' && q.options) {
        setAvailableWords([...q.options]); 
        setSentenceOrder([]);
      }
    }
  }, [quizData, currentQuestionIndex]);

  useEffect(() => {
    if (showAssistant) {
        assistantEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, showAssistant]);

  const handleCheck = () => {
    if (!quizData) return;
    const q = quizData.questions[currentQuestionIndex];
    let isCorrect = false;

    if (q.type === 'multiple_choice') {
      isCorrect = selectedOption === q.correctAnswer;
    } else if (q.type === 'sentence_order') {
      const userAnswer = sentenceOrder.join(' ');
      isCorrect = userAnswer.replace(/[.,!?;]/g, '') === q.correctAnswer.replace(/[.,!?;]/g, '');
    } else if (q.type === 'fill_gap') {
      isCorrect = textInput.trim().toLowerCase() === q.correctAnswer.toLowerCase();
    }

    setFeedbackState(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      setCurrentScore(prev => prev + 1);
      addXp(10); 
    } else {
      // Save mistake to bank
      if (selectedTopic) {
        saveMistake(q, selectedTopic.id);
      }
    }
    
    if (onUpdateStats) onUpdateStats();
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    if (selectedTopic && quizData && currentScore >= Math.floor(quizData.questions.length * 0.8)) {
       markTopicComplete(selectedTopic.id);
       if (onUpdateStats) onUpdateStats();
    }
  };

  const handleAskAssistant = async () => {
    if (!assistantInput.trim() || !quizData) return;
    
    const userMsg: Message = { role: 'user', text: assistantInput };
    setAssistantMessages(prev => [...prev, userMsg]);
    setAssistantInput('');
    setAssistantLoading(true);

    const currentQ = quizData.questions[currentQuestionIndex];
    const context = `
      Question Type: ${currentQ.type}
      Question Text: ${currentQ.question}
      Options/Context: ${currentQ.options?.join(', ')}
      Correct Answer: ${currentQ.correctAnswer}
    `;

    try {
      const response = await askLessonTutor(assistantMessages, userMsg.text, context);
      setAssistantMessages(prev => [...prev, response]);
    } catch (e) {
      setAssistantMessages(prev => [...prev, { role: 'model', text: 'Вибач, я зараз не можу відповісти.' }]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const renderTheoryContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold mt-4 mb-2 text-indigo-700">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold mt-6 mb-3 text-slate-800 border-b pb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <strong key={idx} className="block mt-2 mb-1 text-slate-900">{line.replace(/\*\*/g, '')}</strong>;
      if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc text-slate-700 mb-1">{line.replace('- ', '')}</li>;
      if (line.includes('|')) return <div key={idx} className="font-mono text-xs md:text-sm bg-slate-50 p-1 overflow-x-auto whitespace-pre">{line}</div>; 
      return <p key={idx} className="mb-2 text-slate-600 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, (_, p1) => p1)}</p>; 
    });
  };

  const renderMultipleChoice = (q: QuizQuestion) => (
    <div className="grid grid-cols-1 gap-3">
      {q.options?.map((opt) => (
        <button
          key={opt}
          onClick={() => feedbackState === 'idle' && setSelectedOption(opt)}
          disabled={feedbackState !== 'idle'}
          className={`
            p-4 rounded-xl border-2 text-left transition-all font-medium text-lg
            ${selectedOption === opt 
              ? 'bg-indigo-100 border-indigo-500 text-indigo-800' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200'}
            ${feedbackState === 'correct' && opt === q.correctAnswer ? '!bg-green-100 !border-green-500 !text-green-800' : ''}
            ${feedbackState === 'wrong' && selectedOption === opt ? '!bg-red-100 !border-red-500 !text-red-800' : ''}
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderSentenceOrder = () => (
    <div className="space-y-8">
      <div className="min-h-[80px] border-b-2 border-slate-200 flex flex-wrap gap-2 p-2 items-center">
        {sentenceOrder.map((word, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (feedbackState !== 'idle') return;
              setSentenceOrder(prev => prev.filter((_, i) => i !== idx));
              setAvailableWords(prev => [...prev, word]);
            }}
            className="bg-white border-2 border-slate-200 text-slate-800 px-4 py-2 rounded-xl shadow-sm hover:bg-red-50 font-bold animate-pop-in"
          >
            {word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {availableWords.map((word, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (feedbackState !== 'idle') return;
              setAvailableWords(prev => prev.filter((_, i) => i !== idx));
              setSentenceOrder(prev => [...prev, word]);
            }}
            className="bg-white border-b-4 border-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-indigo-50 active:border-b-0 active:translate-y-1 transition-all font-medium text-lg"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );

  const renderFillGap = (q: QuizQuestion) => {
    const parts = q.question.split('____');
    return (
      <div className="text-xl md:text-2xl font-medium leading-loose text-slate-800">
        {parts[0]}
        <input
          type="text"
          value={textInput}
          onChange={(e) => {
            setFeedbackState('idle');
            setTextInput(e.target.value);
          }}
          disabled={feedbackState !== 'idle'}
          className={`
            mx-2 border-b-2 w-40 text-center focus:outline-none bg-transparent font-bold
            ${feedbackState === 'correct' ? 'border-green-500 text-green-600' : ''}
            ${feedbackState === 'wrong' ? 'border-red-500 text-red-600' : 'border-indigo-300 focus:border-indigo-600 text-indigo-600'}
          `}
          placeholder="..."
        />
        {parts[1]}
      </div>
    );
  };

  // VIEW: THEORY
  if (view === 'theory' && selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 animate-fade-in">
         {/* Theory Header */}
         <div className={`p-8 bg-gradient-to-r ${selectedTopic.color.replace('text-', 'from-').replace('100', '100').replace('700', 'to-white')} relative overflow-hidden`}>
            <button onClick={() => setView('menu')} className="absolute top-6 left-6 bg-white/30 hover:bg-white/50 p-2 rounded-full transition-colors text-slate-900">
              <ArrowLeft size={24} />
            </button>
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
               <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
                 {selectedTopic.icon}
               </div>
               <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{selectedTopic.title}</h2>
               <p className="text-slate-700 max-w-lg font-medium opacity-80">{selectedTopic.description}</p>
            </div>
         </div>

         {/* Theory Content */}
         <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
           {theoryLoading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
               <BookOpen size={48} className="animate-pulse" />
               <p>Завантажую теорію...</p>
             </div>
           ) : (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose max-w-none">
               {renderTheoryContent(theoryContent)}
             </div>
           )}
         </div>

         {/* Action Bar */}
         <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
            <button 
              onClick={startQuiz}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              <Play fill="currentColor" size={20} />
              Перейти до Практики
            </button>
         </div>
      </div>
    );
  }

  // VIEW: QUIZ ACTIVE
  if (view === 'quiz' && selectedTopic && quizData && !loading) {
    if (quizFinished) {
       const isPerfect = currentScore === quizData.questions.length;
       return (
         <div className="max-w-2xl mx-auto py-12 text-center animate-fade-in">
           <div className={`mx-auto h-32 w-32 rounded-full flex items-center justify-center text-6xl mb-6 shadow-xl ${isPerfect ? 'bg-yellow-100 text-yellow-500' : 'bg-indigo-100 text-indigo-500'}`}>
             {isPerfect ? '🏆' : '🎉'}
           </div>
           <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{isPerfect ? 'Perfekt!' : 'Gut gemacht!'}</h2>
           <p className="text-xl text-slate-500 mb-8">
             Ви набрали <span className="font-bold text-indigo-600">{currentScore}</span> з <span className="font-bold">{quizData.questions.length}</span>
           </p>
           <div className="flex justify-center gap-4">
             <button onClick={() => setView('menu')} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
               Меню тем ({currentLevel})
             </button>
             <button onClick={startQuiz} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors">
               <RefreshCw className="inline mr-2" size={20} /> Ще раз
             </button>
           </div>
         </div>
       );
    }

    const q = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quizData.questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto h-full flex flex-col relative">
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-slate-50 z-10 py-2">
          <button onClick={() => setView('theory')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold uppercase">
             <ArrowLeft size={16} /> Теорія
          </button>
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <button 
             onClick={() => setShowAssistant(!showAssistant)}
             className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all shadow-sm ${showAssistant ? 'bg-slate-800 text-white' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
          >
             <GraduationCap size={20} />
             <span className="font-bold text-sm hidden md:inline">Вчитель</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto px-1">
          <div className="my-auto">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center leading-tight">
                {q.type === 'sentence_order' ? `Складіть речення: "${q.question.replace('Translate: ', '')}"` : 
                 q.type === 'fill_gap' ? "Заповніть пропуск:" :
                 q.question}
              </h2>
              <div className="mb-8">
                 {q.type === 'multiple_choice' && renderMultipleChoice(q)}
                 {q.type === 'sentence_order' && renderSentenceOrder()}
                 {q.type === 'fill_gap' && renderFillGap(q)}
              </div>
          </div>
        </div>

        <div className={`
           -mx-4 md:-mx-8 p-4 md:p-8 border-t transition-colors duration-300 mt-auto sticky bottom-0 z-10
           ${feedbackState === 'idle' ? 'border-slate-100 bg-white/90 backdrop-blur' : ''}
           ${feedbackState === 'correct' ? 'bg-green-100 border-green-200' : ''}
           ${feedbackState === 'wrong' ? 'bg-red-100 border-red-200' : ''}
        `}>
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {feedbackState === 'idle' && (
              <button 
                onClick={handleCheck}
                disabled={!selectedOption && sentenceOrder.length === 0 && textInput.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_4px_0_0_rgba(22,163,74,1)] hover:shadow-[0_2px_0_0_rgba(22,163,74,1)] hover:translate-y-[2px] transition-all"
              >
                ПЕРЕВІРИТИ
              </button>
            )}
            {feedbackState !== 'idle' && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                   <div className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl bg-white ${feedbackState === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                     {feedbackState === 'correct' ? <CheckCircle2 size={40}/> : <XCircle size={40}/>}
                   </div>
                   <div>
                     <h3 className={`font-extrabold text-xl ${feedbackState === 'correct' ? 'text-green-800' : 'text-red-800'}`}>
                       {feedbackState === 'correct' ? 'Чудово!' : 'Неправильно...'}
                     </h3>
                     <p className={`${feedbackState === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                       {feedbackState === 'wrong' && <span className="font-bold">Відповідь: </span>}
                       {feedbackState === 'wrong' && q.correctAnswer}
                       {feedbackState === 'wrong' && <span className="block text-xs mt-1">Збережено в Банк Помилок 💾</span>}
                       <span className="block text-sm opacity-80 mt-1">{q.explanation}</span>
                     </p>
                   </div>
                </div>
                <button 
                  onClick={handleNext}
                  className={`px-8 py-3 rounded-2xl font-bold text-white shadow-lg transition-all
                    ${feedbackState === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  `}
                >
                  ДАЛІ <ArrowLeft className="inline rotate-180 ml-2" size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Assistant code */}
        <div className={`
          fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-[60] border-l border-slate-200 flex flex-col
          ${showAssistant ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Професор Мюллер</h3>
                <p className="text-slate-400 text-xs">Помічник на уроці ({currentLevel})</p>
              </div>
            </div>
            <button onClick={() => setShowAssistant(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
             {assistantMessages.map((msg, i) => (
               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
               </div>
             ))}
             {assistantLoading && (
               <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600"/>
                    <span className="text-xs text-slate-500">Думаю...</span>
                  </div>
               </div>
             )}
             <div ref={assistantEndRef} />
          </div>
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input 
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                placeholder="Запитати..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button 
                onClick={handleAskAssistant}
                disabled={assistantLoading || !assistantInput.trim()}
                className="bg-indigo-600 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-indigo-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Topic Selection (MENU) & Loading/Error States
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Граматична Арена ({currentLevel}) <span className="text-yellow-500">⚡</span></h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Виберіть тему для рівня {currentLevel}. Вивчайте теорію та закріплюйте на практиці!</p>
      </div>

      {view === 'quiz' && loading && (
         <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-slate-100 shadow-xl">
           <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
             <BrainCircuit size={64} className="relative z-10 animate-bounce text-indigo-600 mb-6" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">Генерую вправи ({currentLevel})...</h3>
           <p className="text-slate-500">ШІ придумує хитрі запитання 🤔</p>
         </div>
      )}

      {view === 'quiz' && error && (
         <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center animate-fade-in">
            <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-md shadow-lg">
               <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
               <h3 className="text-2xl font-bold text-red-800 mb-2">Ой, халепа!</h3>
               <p className="text-red-600 mb-8 text-lg">{error}</p>
               <div className="flex flex-col gap-3">
                   <button 
                     onClick={startQuiz}
                     className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={20} /> Спробувати ще раз
                   </button>
                   <button 
                     onClick={() => setView('menu')}
                     className="text-red-400 font-bold hover:text-red-600 py-2"
                   >
                     Повернутися до меню
                   </button>
               </div>
            </div>
         </div>
      )}

      {view === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTopics.map((topic) => {
            const isCompleted = localStorage.getItem('deutsch_meister_progress_v1')?.includes(topic.id);
            
            return (
              <div 
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={`group relative bg-white rounded-3xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden ${isCompleted ? 'border-green-200 shadow-sm' : 'border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2'}`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${topic.color.replace('text-', 'from-').replace('100', '100').replace('700', 'to-white')} opacity-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                
                {isCompleted && (
                  <div className="absolute top-4 right-4 z-20 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Вивчено
                  </div>
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`h-14 w-14 rounded-2xl ${topic.color} flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {topic.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-grow">
                    {topic.description}
                  </p>
                  
                  <div className="flex items-center text-indigo-500 font-bold text-sm mt-auto group-hover:translate-x-1 transition-transform">
                    {isCompleted ? 'Повторити' : 'Вчити'} <ArrowLeft className="rotate-180 ml-1" size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrammarHub;