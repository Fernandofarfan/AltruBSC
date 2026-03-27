import { motion } from 'framer-motion';

export const ImpactAvatar = ({ address, size = 12 }: { address: string, size?: number }) => {
  // Generate consistent patterns based on address
  const hash = address ? address.slice(-6) : 'ABCDEF';
  const color1 = `#${hash}`;
  const color2 = `#${hash.split('').reverse().join('')}`;
  
  return (
    <motion.div 
      whileHover={{ rotate: 15 }}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      className="rounded-2xl overflow-hidden relative shadow-inner border border-white/10"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" fill={color1} />
        <motion.circle 
          animate={{ r: [20, 25, 20] }}
          transition={{ repeat: Infinity, duration: 3 }}
          cx="50" cy="50" r="20" fill={color2} opacity="0.5" 
        />
        <motion.rect 
          animate={{ rotate: [0, 90, 180, 270, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          x="25" y="25" width="50" height="50" stroke="white" strokeWidth="2" fill="none" opacity="0.3" 
        />
        <circle cx="35" cy="40" r="5" fill="white" />
        <circle cx="65" cy="40" r="5" fill="white" />
        <path d="M 40 70 Q 50 80 60 70" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
};
