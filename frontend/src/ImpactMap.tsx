import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const REGIONS = [
  { id: 'africa', name: 'Africa', active: 12, funds: '2,500 BNB', pos: { top: '50%', left: '50%' } },
  { id: 'latam', name: 'Latin America', active: 8, funds: '1,800 BNB', pos: { top: '55%', left: '25%' } },
  { id: 'asia', name: 'SE Asia', active: 22, funds: '4,200 BNB', pos: { top: '45%', left: '75%' } },
];

export const ImpactMap = () => {
  return (
    <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="flex items-center justify-between mb-12">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Globe className="text-emerald-500 w-5 h-5" />
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Live Deployment Networks</span>
           </div>
           <h2 className="text-3xl font-black">Global Impact Footprint</h2>
        </div>
      </div>

      <div className="h-[400px] w-full bg-slate-50 rounded-[32px] border border-slate-100 relative group overflow-hidden">
        <div className="absolute inset-0 opacity-10 flex items-center justify-center grayscale">
           <svg viewBox="0 0 800 400" className="w-full h-full">
             <path d="M150,150 Q200,100 250,150 T350,150" fill="#10b981" />
             <path d="M450,250 Q500,200 550,250 T650,250" fill="#10b981" />
             <circle cx="400" cy="200" r="100" fill="#10b981" />
           </svg>
        </div>

        {REGIONS.map((region) => (
          <motion.div 
            key={region.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute z-10 cursor-pointer"
            style={{ ...region.pos }}
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl mt-4 w-[180px] pointer-events-none"
              >
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">{region.name}</p>
                <p className="text-sm font-bold mb-1">{region.active} Active NGOs</p>
                <p className="text-xs font-medium text-slate-400">Total: {region.funds}</p>
              </motion.div>
            </div>
          </motion.div>
        ))}

        <div className="absolute inset-0 bg-linear-to-t from-white/20 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
