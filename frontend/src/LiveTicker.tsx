import { motion } from 'framer-motion';
import { Activity, Zap, ShieldCheck, Globe } from 'lucide-react';

const EVENTS = [
  { icon: <Zap className="w-4 h-4" />, text: "New Donation: 0.1 BNB to Ocean Cleanup" },
  { icon: <ShieldCheck className="w-4 h-4" />, text: "NGO Verified: EarthCare Foundation" },
  { icon: <Globe className="w-4 h-4" />, text: "Proposal #01: 65% Votes for 'YES'" },
  { icon: <Activity className="w-4 h-4" />, text: "Impact Milestone: 10,000 Lives Saved" },
  { icon: <Zap className="w-4 h-4" />, text: "New Donor signed up" },
];

export const LiveTicker = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`fixed bottom-0 left-0 w-full h-10 border-t ${isDarkMode ? 'bg-slate-950 border-white/10' : 'bg-slate-900 border-slate-700'} z-150 overflow-hidden flex items-center`}>
      <motion.div 
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        className="flex whitespace-nowrap gap-12 px-6 items-center"
      >
        {[...EVENTS, ...EVENTS, ...EVENTS].map((event, i) => (
          <div key={i} className="flex items-center gap-3 text-white/80">
            <span className="text-[10px] text-emerald-400">{event.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{event.text}</span>
            <span className="text-white/20">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
