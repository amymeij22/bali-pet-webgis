import { motion } from "framer-motion";
import { Building2, Landmark, GraduationCap } from "lucide-react";

export default function MapHeader() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pt-3 pointer-events-none"
    >
      {/* Logo Row */}
      <div className="flex items-center justify-center gap-2 mb-2 pointer-events-auto">
        {[Building2, Landmark, GraduationCap].map((Icon, i) => (
          <div
            key={i}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-sm"
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="glass-panel rounded-xl px-4 sm:px-6 py-2 pointer-events-auto max-w-[92vw] sm:max-w-[720px]">
        <h1 className="text-[11px] sm:text-sm md:text-base font-semibold text-foreground text-center leading-snug">
          {/* Baris 1 */}
          <span className="block">
            Prediksi Kenyamanan Termal Berbasis Indeks <em className="italic">Physiological Equivalent Temperature</em>
          </span>

          {/* Baris 2 (desktop only) */}
          <span className="hidden sm:block text-muted-foreground font-normal">
            untuk Destinasi Wisata di Provinsi Bali
          </span>
        </h1>
      </div>
    </motion.header>
  );
}
