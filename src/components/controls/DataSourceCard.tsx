import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DataSourceCardProps {
  className?: string;
}

export default function DataSourceCard({ className }: DataSourceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDesktopCard, setShowDesktopCard] = useState(true);

  return (
    <>
      {/* Desktop: Always visible card */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        className={cn(
          "hidden md:block fixed bottom-4 right-4 z-20",
          className
        )}
      >
        <div className="glass-panel rounded-xl px-4 py-3 w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Sumber Data</span>
          </div>
          <ul className="text-[10px] text-muted-foreground space-y-1.5 leading-relaxed">
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>Data Prakiraan Cuaca Terbuka Badan Meteorologi Klimatologi dan Geofisika</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>Batas Administrasi Desa/Kelurahan Badan Informasi Geospasial</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>Kode, Data Wilayah Administrasi Pemerintahan, dan Pulau Menteri Dalam Negeri</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Mobile: Overlay button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-20 w-10 h-10 rounded-full glass-panel flex items-center justify-center"
        aria-label="Lihat sumber data"
      >
        <Info className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      {/* Mobile: Overlay modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex items-end justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 glass-panel rounded-xl px-4 py-4 w-full max-w-sm mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Sumber Data</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Data Prakiraan Cuaca Terbuka Badan Meteorologi Klimatologi dan Geofisika</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Batas Administrasi Desa/Kelurahan Badan Informasi Geospasial</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Kode, Data Wilayah Administrasi Pemerintahan, dan Pulau Menteri Dalam Negeri</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
