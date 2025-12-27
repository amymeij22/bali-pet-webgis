import { motion } from 'framer-motion';
import { Globe, Thermometer } from 'lucide-react';

export default function MapHeader() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Thermometer className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Thermal Comfort Forecast
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Destinasi Wisata Provinsi Bali
            </p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-border/50 hidden sm:block" />
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">WebGIS</span>
        </div>
      </div>
    </motion.header>
  );
}
