import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCcw, AlertCircle, GraduationCap, MessageCircleQuestion, User, Volume2, Mic, MicOff, Coffee, Briefcase, Stethoscope, Train, X, Home, MonitorSmartphone } from 'lucide-react';
import { Message, GermanLevel } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { addXp, updateMissionProgress } from '../services/storageService';

const SUGGESTIONS_CHAT = [
  "Erzähl mir einen Witz! 🤣",
  "Korrigiere meinen Text 📝",
  "Lass uns über Hobbys reden 🎨",
];

const SUGGESTIONS_EXPERT = [
  "Поясни різницю між 'als' і 'wenn'",
  "Як утворюється Passiv?",
  "Список прийменників з Dativ",
  "Коли вживається Konjunktiv II?"
];

type ChatMode = 'chat' | 'expert';

interface Scenario {
  id: string;
  title: string;
  icon: React.ReactNode;
  initialMessage: string;
  contextPrompt: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    title: 'У Кафе',
    icon: <Coffee size={18} />,
    initialMessage: 'Hallo! Willkommen im Café Berlin. Einen Tisch für zwei? ☕',
    contextPrompt: 'You are a waiter in a busy cafe in Berlin. The user is a customer. Be polite but quick. Ask for their order.'
  },
  {
    id: 'doctor',
    title: 'У Лікаря',
    icon: <Stethoscope size={18} />,
    initialMessage: 'Der Nächste, bitte! Guten Tag. Was fehlt Ihnen heute? 🩺',
    contextPrompt: 'You are a Hausarzt (GP) in Germany. The user is a patient describing symptoms. Ask clarifying questions about pain, duration, etc.'
  },
  {
    id: 'interview',
    title: 'Співбесіда',
    icon: <Briefcase size={18} />,
    initialMessage: 'Guten Tag. Danke, dass Sie gekommen sind. Erzählen Sie mir etwas über sich. 💼',
    contextPrompt: 'You are an HR manager conducting a job interview. Be formal and professional. Ask about experience, strengths, and weaknesses.'
  },
  {
    id: 'train',
    title: 'На Вокзалі',
    icon: <Train size={18} />,
    initialMessage: 'Die Fahrkarten, bitte! Wo möchten Sie hin? 🚄',
    contextPrompt: 'You are a train conductor (Schaffner) or ticket seller. Check tickets or sell them. Discuss delays or connections.'
  },
  {
    id: 'wohnung',
    title: 'Оренда (B1+)',
    icon: <Home size={18} />,
    initialMessage: 'Guten Tag. Sie interessieren sich für die 2-Zimmer-Wohnung? 🏠',
    contextPrompt: 'You are a landlord showing an apartment. Ask about the user\'s job, pets (Haustiere), and when they want to move in. Be slightly strict but polite.'
  },
  {
    id: 'support',
    title: 'Техпідтримка',
    icon: <MonitorSmartphone size={18} />,
    initialMessage: 'Tech-Support Müller hier. Was ist das Problem mit Ihrem Computer? 💻',
    contextPrompt: 'You are an IT support agent. The user has a technical problem. Ask specifically what is not working (screen black? internet slow?). Use technical but understandable German.'
  }
];

interface ChatAreaProps {
  currentLevel: GermanLevel;
  onUpdateStats?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ currentLevel, onUpdateStats }) => {
  const [mode, setMode] = useState<ChatMode>('chat');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  
  // Separate history for each mode
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'model', text: `Hallo! 👋 Wie geht es dir heute? Ich bin Hans. Lass uns Deutsch auf Niveau ${currentLevel} üben!` }
  ]);
  const [expertMessages, setExpertMessages] = useState<Message[]>([
    { role: 'model', text: 'Вітаю. Я Професор Мюллер. 🎓\nЗадайте мені будь-яке складне питання з німецької граматики або лексики, і я поясню його детально.' }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentMessages = mode === 'chat' ? chatMessages : expertMessages;
  const currentSuggestions = mode === 'chat' ? SUGGESTIONS_CHAT : SUGGESTIONS_EXPERT;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, expertMessages, mode, isLoading]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE'; // Force German
      utterance.rate = 0.9; // Slightly slower for learners
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Speech Recognition Setup ---
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Ваш браузер не підтримує голосове введення. Спробуйте Chrome.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = mode === 'chat' ? 'de-DE' : 'uk-UA'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
         console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  // -----------------------------

  const handleScenarioSelect = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setMode('chat');
    setChatMessages([{ role: 'model', text: scenario.initialMessage }]);
  };

  const clearScenario = () => {
    setActiveScenario(null);
    setChatMessages([{ role: 'model', text: `Hallo! 👋 Wie geht es dir heute? Ich bin Hans. Lass uns Deutsch auf Niveau ${currentLevel} üben!` }]);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    
    // UI Updates
    if (mode === 'chat') {
      setChatMessages(prev => [...prev, userMsg]);
    } else {
      setExpertMessages(prev => [...prev, userMsg]);
    }
    setInput('');
    setIsLoading(true);

    // Add XP & Mission Progress
    addXp(5); 
    updateMissionProgress('chat_msg', 1);
    if (onUpdateStats) onUpdateStats();

    try {
      const historyToUse = mode === 'chat' ? chatMessages : expertMessages;
      const recentHistory = historyToUse.slice(-8); 
      
      const response = await sendChatMessage(
        recentHistory, 
        userMsg.text, 
        currentLevel, 
        mode,
        activeScenario?.contextPrompt // Pass roleplay context if active
      );
      
      if (mode === 'chat') {
        setChatMessages(prev => [...prev, response]);
      } else {
        setExpertMessages(prev => [...prev, response]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = { role: 'model' as const, text: 'Вибачте, виникла помилка з’єднання.' };
      if (mode === 'chat') setChatMessages(prev => [...prev, errorMsg]);
      else setExpertMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-enter">
      {/* Chat Header */}
      <div className={`
        p-4 text-white flex flex-col shadow-lg z-10 transition-all duration-500 gap-4
        ${mode === 'chat' ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-slate-800'}
      `}>
        <div className="flex flex-col md:flex-row items-center justify-between w-full">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm relative transition-transform hover:scale-110">
               {mode === 'chat' ? <Sparkles size={24} className="text-yellow-300" /> : <GraduationCap size={24} className="text-white" />}
               {activeScenario && <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-indigo-600 animate-pop">🎭</div>}
            </div>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                {activeScenario ? activeScenario.title : (mode === 'chat' ? 'Hans (AI Friend)' : 'Prof. Müller (Expert)')}
              </h2>
              <p className="text-white/70 text-xs flex items-center gap-1">
                {activeScenario ? 'Рольова гра' : (mode === 'chat' ? `🇩🇪 Розмовна практика (${currentLevel})` : '🇺🇦/🇩🇪 Детальні пояснення')}
              </p>
            </div>
          </div>

          {/* Mode Toggle & Scenarios */}
          <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
             {mode === 'chat' && !activeScenario && (
               <div className="flex bg-black/20 p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-[200px] md:max-w-none">
                 {SCENARIOS.map(sc => (
                   <button
                     key={sc.id}
                     onClick={() => handleScenarioSelect(sc)}
                     className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                     title={sc.title}
                   >
                     {sc.icon}
                   </button>
                 ))}
               </div>
             )}
             
             {activeScenario && (
               <button onClick={clearScenario} className="bg-red-500/20 hover:bg-red-500/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                 <X size={14} /> Вийти
               </button>
             )}

             <div className="flex bg-black/20 p-1 rounded-xl">
               <button 
                 onClick={() => setMode('chat')}
                 className={`p-2 rounded-lg transition-all ${mode === 'chat' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-white/60 hover:text-white'}`}
               >
                 <User size={16} />
               </button>
               <button 
                 onClick={() => setMode('expert')}
                 className={`p-2 rounded-lg transition-all ${mode === 'expert' ? 'bg-white text-slate-800 shadow-md scale-105' : 'text-white/60 hover:text-white'}`}
               >
                 <GraduationCap size={16} />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative ${mode === 'expert' ? 'bg-slate-100' : 'bg-slate-50'}`}>
         {mode === 'chat' && (
           <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
         )}
         {mode === 'expert' && (
           <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
         )}

        {currentMessages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} relative z-10 animate-enter`}>
             <div className="text-xs text-slate-400 mb-1 px-2 flex items-center gap-2">
               {msg.role === 'user' ? 'Ти' : (activeScenario ? activeScenario.title : (mode === 'chat' ? 'Hans' : 'Prof. Müller'))}
               {msg.role === 'model' && (
                 <button onClick={() => speakText(msg.text)} className="hover:text-indigo-600 transition-colors transform hover:scale-110">
                   <Volume2 size={12} />
                 </button>
               )}
             </div>
            <div className={`
              max-w-[90%] md:max-w-[80%] rounded-3xl px-6 py-4 shadow-sm text-base leading-relaxed whitespace-pre-wrap transition-all duration-300
              ${msg.role === 'user' 
                ? (mode === 'chat' ? 'bg-indigo-600 text-white rounded-br-none hover:shadow-indigo-200 hover:shadow-md' : 'bg-slate-700 text-white rounded-br-none hover:shadow-md')
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-md hover:shadow-lg'}
            `}>
              {msg.text}
            </div>
            
            {msg.correction && (
              <div className="mt-2 max-w-[85%] bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm animate-pop shadow-sm">
                <div className="flex items-center gap-2 text-amber-800 mb-2 font-bold">
                  <AlertCircle size={18} />
                  <span>Корекція:</span>
                </div>
                <div className="bg-white/50 rounded-lg p-2 mb-2">
                   <p className="text-amber-900/60 line-through text-xs mb-1">"{currentMessages[idx-1]?.text}"</p>
                   <p className="text-amber-900 font-medium text-base">"{msg.correction}"</p>
                </div>
                {msg.explanation && (
                  <p className="text-amber-800 text-xs italic">
                    ℹ️ {msg.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-enter">
            <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-none px-6 py-4 flex items-center gap-3 shadow-sm">
              <div className="flex gap-1 h-2 items-center">
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-0"></div>
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-5 bg-white border-t border-slate-100">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {currentSuggestions.map((sugg, i) => (
            <button 
              key={i}
              onClick={() => handleSend(sugg)}
              disabled={isLoading}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border transform hover:scale-105 active:scale-95 ${mode === 'chat' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
            >
              {sugg}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <button
             onClick={toggleListening}
             className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 duration-200 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Слухаю..." : (mode === 'chat' ? (activeScenario ? "Ваша відповідь..." : "Schreib etwas...") : "Задай питання...")}
            className={`flex-1 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:bg-white transition-all text-slate-800 placeholder-slate-400 ${mode === 'chat' ? 'focus:border-indigo-500 focus:shadow-indigo-100 focus:shadow-md' : 'focus:border-slate-500 focus:shadow-md'}`}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={`text-white p-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:transform-none ${mode === 'chat' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300'}`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;