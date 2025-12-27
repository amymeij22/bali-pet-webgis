import { motion } from "framer-motion";
import { Globe, Thermometer } from "lucide-react";

export default function MapHeader() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Thermometer className="w-4.5 h-4.5 text-primary" />
        </div>

        {/* Text Content */}
        <div className="flex flex-col leading-tight">
          {/* Baris 1 */}
          <h1 className="text-sm font-semibold text-foreground">Thermal Comfort Forecast</h1>

          {/* Baris 2 (desktop only, elegant) */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Destinasi Wisata Provinsi Bali</span>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>WebGIS</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
