import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const REGIONS_EN = [
  { id: 'africa', name: 'Africa', active: 12, funds: '2,500 BNB', pos: { top: '50%', left: '50%' } },
  { id: 'latam', name: 'Latin America', active: 8, funds: '1,800 BNB', pos: { top: '55%', left: '25%' } },
  { id: 'asia', name: 'SE Asia', active: 22, funds: '4,200 BNB', pos: { top: '45%', left: '75%' } },
];

const REGIONS_ES = [
  { id: 'africa', name: 'África', active: 12, funds: '2,500 BNB', pos: { top: '50%', left: '50%' } },
  { id: 'latam', name: 'Latam', active: 8, funds: '1,800 BNB', pos: { top: '55%', left: '25%' } },
  { id: 'asia', name: 'SE Asia', active: 22, funds: '4,200 BNB', pos: { top: '45%', left: '75%' } },
];

export const ImpactMap = ({ isDarkMode, isSpanish }: { isDarkMode: boolean, isSpanish: boolean }) => {
  const regions = isSpanish ? REGIONS_ES : REGIONS_EN;
  const title = isSpanish ? "Huella de Impacto Global" : "Global Impact Footprint";
  const deployed = isSpanish ? "Redes de Despliegue en Vivo" : "Live Deployment Networks";
  const active_txt = isSpanish ? "ONGs Activas" : "Active NGOs";
  const total_txt = isSpanish ? "Total" : "Total";

  return (
    <section className={`${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-[40px] p-8 md:p-12 shadow-sm border overflow-hidden relative backdrop-blur-xl`}>
      <div className="flex items-center justify-between mb-12">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Globe className="text-emerald-500 w-5 h-5" />
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{deployed}</span>
           </div>
           <h2 className="text-3xl font-black">{title}</h2>
        </div>
      </div>

      <div className={`h-[400px] w-full ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'} rounded-[32px] border ${isDarkMode ? 'border-white/5' : 'border-slate-100'} relative group overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 flex items-center justify-center grayscale">
           <svg viewBox="0 0 800 400" className="w-full h-full">
             <path d="M150,150 Q200,100 250,150 T350,150" fill={isDarkMode ? "#ffffff" : "#10b981"} />
             <path d="M450,250 Q500,200 550,250 T650,250" fill={isDarkMode ? "#ffffff" : "#10b981"} />
             <circle cx="400" cy="200" r="100" fill={isDarkMode ? "#ffffff" : "#10b981"} />
           </svg>
        </div>

        {regions.map((region) => (
          <motion.div 
            key={region.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute z-10 cursor-pointer"
            style={{ ...region.pos }}
          >
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-400/50' : 'bg-emerald-500/20 border-emerald-500'} rounded-full flex items-center justify-center border`}>
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-900'} text-white p-4 rounded-2xl shadow-2xl mt-4 w-[180px] pointer-events-none border ${isDarkMode ? 'border-white/10' : 'border-slate-700'}`}
              >
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">{region.name}</p>
                <p className="text-sm font-bold mb-1">{region.active} {active_txt}</p>
                <p className="text-xs font-medium text-slate-400">{total_txt}: {region.funds}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}

        <div className="absolute inset-0 bg-linear-to-t from-white/20 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
