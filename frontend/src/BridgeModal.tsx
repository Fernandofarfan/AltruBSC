import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Globe, Loader2, CheckCircle2 } from 'lucide-react';

export const BridgeModal = ({ isOpen, onClose, isDarkMode, isSpanish }: { isOpen: boolean, onClose: () => void, isDarkMode: boolean, isSpanish: boolean }) => {
  const [isBridging, setIsBridging] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = {
    en: { title: 'Omnichain Bridge', subtitle: 'Move funds from any network to BSC.', from: 'From Network', to: 'To Network', amount: 'Amount to Bridge', button: 'Bridge Now', success: 'Bridge Complete!' },
    es: { title: 'Puente Omnichain', subtitle: 'Mueve fondos desde cualquier red a BSC.', from: 'Red de Origen', to: 'Red de Destino', amount: 'Monto a Mover', button: 'Cruzar Ahora', success: '¡Puente Completado!' }
  }[isSpanish ? 'es' : 'en'];

  const handleBridge = () => {
    setIsBridging(true);
    setTimeout(() => {
      setIsBridging(false);
      setSuccess(true);
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className={`${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} w-full max-w-lg rounded-[40px] border shadow-2xl overflow-hidden relative z-10`}
          >
            <div className="p-10">
               <div className="flex justify-between items-start mb-10">
                  <div>
                     <h2 className="text-3xl font-black tracking-tighter">{t.title}</h2>
                     <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-1">LayerZero Powered</p>
                  </div>
                  <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
               </div>

               {!success ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                       <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.from}</p>
                          <div className="flex items-center gap-3">
                             <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[10px]">ETH</div>
                             <span className="font-bold">Ethereum</span>
                          </div>
                       </div>
                       <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="hidden md:flex justify-center text-slate-400"><ArrowRight /></motion.div>
                       <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.to}</p>
                          <div className="flex items-center gap-3">
                             <div className="bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[10px]">BSC</div>
                             <span className="font-bold">BNB Chain</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">{t.amount}</label>
                       <input type="number" placeholder="0.5" className={`w-full ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} p-5 rounded-3xl outline-none font-black`} />
                    </div>

                    <button onClick={handleBridge} disabled={isBridging} className="w-full py-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                       {isBridging ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 text-amber-500" /> {t.button}</>}
                    </button>
                 </div>
               ) : (
                 <div className="py-12 flex flex-col items-center text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500/10 p-8 rounded-full mb-8">
                       <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">{t.success}</h3>
                    <p className="text-slate-500 font-bold text-sm">Assets are now available on AltruBSC.</p>
                 </div>
               )}
            </div>

            <div className={`p-6 ${isDarkMode ? 'bg-white/5 border-t border-white/10' : 'bg-slate-50 border-t border-slate-100'} flex items-center justify-center gap-4`}>
               <Globe className="w-4 h-4 text-slate-400" />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Global Liquidity Network Active</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
