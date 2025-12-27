import { motion } from 'framer-motion';
import { Building2, Landmark, GraduationCap } from 'lucide-react';

export default function MapHeader() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-3xl"
    >
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between">
        {/* Title - Centered */}
        <div className="flex-1 text-center">
          <h1 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
            Prediksi Kenyamanan Termal Destinasi Wisata Provinsi Bali
          </h1>
        </div>
        
        {/* Logo Placeholders - Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
            <Landmark className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
