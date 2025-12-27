import { motion } from "framer-motion";
import logoBmkg from "@/assets/logo-bmkg.webp";
import logoStmkg from "@/assets/logo-stmkg.png";
import logoInstrumentasi from "@/assets/logo-instrumentasi.png";

export default function MapHeader() {
  const logos = [
    { src: logoBmkg, alt: "Logo BMKG" },
    { src: logoStmkg, alt: "Logo STMKG" },
    { src: logoInstrumentasi, alt: "Logo Instrumentasi" },
  ];

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center pt-3 pointer-events-none"
    >
      {/* Logo Row */}
      <div className="flex items-center justify-center gap-2 mb-2 pointer-events-auto">
        {logos.map((logo, i) => (
          <div
            key={i}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg  backdrop-blur-md flex items-center justify-center shadow-sm p-1"
          >
            <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" />
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
