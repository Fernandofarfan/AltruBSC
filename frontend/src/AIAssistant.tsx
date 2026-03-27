import { useState } from 'react';
import { Send, X, Sparkles, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am AltruAI. Ask me how your donation changes lives.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');

    // Mock AI Logic
    setTimeout(() => {
      let response = "I'm analyzing the blockchain impact... 0.5 BNB currently provides clean water to 30 people in South America for 12 months.";
      if (input.toLowerCase().includes('usdt')) response = "USDT donations are ultra-stable. 10 USDT provides 5 nutrient-rich meals for children in local shelters.";
      if (input.toLowerCase().includes('nft')) response = "The Impact Badge NFT is a soul-bound verifiable proof of your kindness on the Binance Smart Chain.";
      
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-100">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[350px] h-[500px] mb-6 rounded-[32px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl"><Brain className="w-5 h-5" /></div>
                <div>
                  <p className="font-black text-sm tracking-tight">AltruAI</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Engine</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-bold ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about impact..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500/20"
              />
              <button onClick={handleSend} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 text-white p-5 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
      >
        <Sparkles className="w-6 h-6 text-amber-400" />
        {isOpen ? null : <span className="font-black text-xs uppercase tracking-widest pr-2">Ask AltruAI</span>}
      </motion.button>
    </div>
  );
};
