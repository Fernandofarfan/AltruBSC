import { useState } from 'react';
import { Send, X, Sparkles, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AIAssistant = ({ isDarkMode, isSpanish, onRecommend }: { isDarkMode: boolean, isSpanish: boolean, onRecommend: (id: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [messages, setMessages] = useState([
    { role: 'bot', text: isSpanish ? '¡Hola! Soy AltruAI. ¿Buscamos tu causa ideal?' : "Hello! I am AltruAI. Shall we find your perfect cause?" }
  ]);
  const [input, setInput] = useState('');

  const t = {
    analyzing: isSpanish ? "Analizando tu perfil de impacto..." : "Analyzing your impact profile...",
    quiz_btn: isSpanish ? "Iniciar Matchmaker" : "Start Matchmaker",
    q1: isSpanish ? "¿Qué causa te apasiona más?" : "What cause are you most passionate about?",
    q2: isSpanish ? "¿En qué región quieres impactar?" : "Which region do you want to impact?",
    res: isSpanish ? "¡He encontrado tu Match! Te recomiendo apoyar:" : "I found your Match! I recommend supporting:",
    placeholder: isSpanish ? "Pregunta sobre impacto..." : "Ask about impact...",
    ask: isSpanish ? "Pregunta a AltruAI" : "Ask AltruAI"
  };

  const startQuiz = () => {
    setQuizStep(1);
    setMessages(prev => [...prev, { role: 'bot', text: t.q1 }]);
  };

  const handleQuizAnswer = (ans: string) => {
    setMessages(prev => [...prev, { role: 'user', text: ans }]);
    if (quizStep === 1) {
      setTimeout(() => {
        setQuizStep(2);
        setMessages(prev => [...prev, { role: 'bot', text: t.q2 }]);
      }, 800);
    } else if (quizStep === 2) {
      setTimeout(() => {
        setQuizStep(0);
        // Recommendation logic (simplified for demo)
        const recId = ans.toLowerCase().includes('latam') || ans.toLowerCase().includes('américa') ? 1 : 2;
        setMessages(prev => [...prev, { role: 'bot', text: t.res }]);
        onRecommend(recId);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');

    setTimeout(() => {
      let response = isSpanish ? "Personalmente, creo que tu aporte será transformador." : "Personally, I believe your contribution will be transformative.";
      if (input.toLowerCase().includes('usdt')) response = isSpanish ? "USDT es ideal para evitar volatilidad." : "USDT is ideal to avoid volatility.";
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-12 right-8 z-100">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} w-[380px] h-[550px] mb-6 rounded-[40px] shadow-2xl border flex flex-col overflow-hidden backdrop-blur-3xl`}
          >
            <div className={`${isDarkMode ? 'bg-emerald-950/40' : 'bg-slate-900'} p-8 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2.5 rounded-2xl"><Brain className="w-5 h-5" /></div>
                <div><p className="font-black text-sm tracking-tight">AltruAI ELITE</p><p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">N-Phase Intelligence</p></div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[28px] text-[13px] font-bold leading-relaxed ${m.role === 'user' ? 'bg-emerald-600 text-white shadow-lg' : isDarkMode ? 'bg-white/5 border border-white/5 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-700'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              
              {quizStep === 0 && messages.length === 1 && (
                <button onClick={startQuiz} className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                  {t.quiz_btn}
                </button>
              )}

              {quizStep === 1 && (
                <div className="grid grid-cols-2 gap-3">
                   {['Ocean', 'Health', 'Education', 'Nature'].map(o => (
                     <button key={o} onClick={() => handleQuizAnswer(o)} className="p-4 bg-slate-900/5 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">{o}</button>
                   ))}
                </div>
              )}

              {quizStep === 2 && (
                <div className="grid grid-cols-2 gap-3">
                   {['Latam', 'Africa', 'Asia', 'Global'].map(o => (
                     <button key={o} onClick={() => handleQuizAnswer(o)} className="p-4 bg-slate-900/5 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">{o}</button>
                   ))}
                </div>
              )}
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'} flex gap-3`}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className={`flex-1 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} border rounded-[24px] px-6 py-4 text-sm font-bold outline-none`} />
              <button onClick={handleSend} className="bg-emerald-600 text-white p-4 rounded-[24px] shadow-xl hover:bg-emerald-700 transition-all"><Send className="w-5 h-5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)}
        className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-900'} text-white p-6 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 group`}
      >
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:rotate-12 transition-transform"><Sparkles className="w-6 h-6 text-white" /></div>
        {isOpen ? null : <span className="font-black text-[10px] uppercase tracking-widest pr-4">{t.ask}</span>}
      </motion.button>
    </div>
  );
};
