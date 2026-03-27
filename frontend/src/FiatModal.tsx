import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, CheckCircle2, Loader2, Globe } from 'lucide-react';

export const FiatModal = ({ isOpen, onClose, isDarkMode, isSpanish }: { isOpen: boolean, onClose: () => void, isDarkMode: boolean, isSpanish: boolean }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const t = {
    en: { title: 'Buy Crypto with Card', subtitle: 'Onboard instantly using your local card.', amount: 'Select Amount', info: 'Card Details', pay: 'Pay Now', success: 'Success!', next: 'Next Step' },
    es: { title: 'Comprar con Tarjeta', subtitle: 'Fondea tu cuenta al instante.', amount: 'Monto a Comprar', info: 'Datos de Tarjeta', pay: 'Pagar Ahora', success: '¡Éxito!', next: 'Siguiente' }
  }[isSpanish ? 'es' : 'en'];

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-6 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className={`${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} w-full max-w-md rounded-[32px] border shadow-2xl overflow-hidden relative z-10`}
          >
            <div className="p-8">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
                     <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-xs font-bold uppercase tracking-widest mt-1`}>{t.subtitle}</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
               </div>

               {step === 1 && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                       {['$50', '$100', '$250'].map(val => (
                         <button key={val} onClick={() => setStep(2)} className={`py-4 rounded-2xl border ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} font-black transition-all duration-300`}>{val}</button>
                       ))}
                    </div>
                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">Minimal Fee: 0.5%</p>
                 </div>
               )}

               {step === 2 && (
                 <div className="space-y-6">
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-3 mb-4"><CreditCard className="w-5 h-5 text-emerald-500" /><p className="text-xs font-black uppercase tracking-widest">Card Processing</p></div>
                       <div className="space-y-4">
                          <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-lg animate-pulse" />
                          <div className="grid grid-cols-2 gap-4">
                             <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-lg animate-pulse" />
                             <div className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-lg animate-pulse" />
                          </div>
                       </div>
                    </div>
                    <button onClick={handlePay} disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                       {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> {t.pay}</>}
                    </button>
                 </div>
               )}

               {step === 3 && (
                 <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-12 flex flex-col items-center text-center">
                    <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
                    <h3 className="text-3xl font-black mb-2">{t.success}</h3>
                    <p className="text-slate-500 font-bold text-sm">Crypto sent to your wallet on BSC.</p>
                 </motion.div>
               )}
            </div>
            
            <div className={`p-4 ${isDarkMode ? 'bg-white/5 border-t border-white/10' : 'bg-slate-50 border-t border-slate-100'} flex items-center justify-center gap-2`}>
               <Globe className="w-3 h-3 text-slate-400" />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Powered by Stripe Connect Proxy</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
