import { motion } from 'framer-motion';
import { Building2, Landmark, GraduationCap } from 'lucide-react';

export default function MapHeader() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pt-3 pointer-events-none"
    >
      {/* Logo Row - Above Header */}
      <div className="flex items-center justify-center gap-2 mb-2 pointer-events-auto">
        <div className="w-10 h-10 rounded-lg bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-sm">
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-sm">
          <Landmark className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-sm">
          <GraduationCap className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
      
      {/* Title - Centered */}
      <div className="glass-panel rounded-xl px-5 py-2 pointer-events-auto">
        <h1 className="text-sm sm:text-base font-semibold text-foreground text-center leading-tight whitespace-nowrap">
          Prediksi Kenyamanan Termal Destinasi Wisata Provinsi Bali
        </h1>
      </div>
    </motion.header>
  );
}