import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Thermometer } from 'lucide-react';
import { VILLAGES, getForecast, PET_COLORS, ThermalCategory } from '@/data/dummyData';
import { cn } from '@/lib/utils';

interface DestinationSidebarProps {
  selectedTime: string;
  onDestinationClick: (villageId: string, villageName: string) => void;
  activeVillage?: string | null;
}

export default function DestinationSidebar({
  selectedTime,
  onDestinationClick,
  activeVillage,
}: DestinationSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-30",
          "glass-panel rounded-r-xl p-2 border-l-0",
          "hover:bg-secondary/50 transition-colors"
        )}
        initial={false}
        animate={{ left: isOpen ? 264 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        aria-label={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-foreground" />
        )}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-20 w-[264px] glass-panel rounded-r-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="font-semibold text-lg text-foreground">Destinasi Wisata</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                10 lokasi wisata di Bali
              </p>
            </div>

            {/* Destination List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
              {VILLAGES.map((village, index) => {
                const forecast = getForecast(village.id, selectedTime);
                const isActive = activeVillage === village.id;

                return (
                  <motion.button
                    key={village.id}
                    onClick={() => onDestinationClick(village.id, village.village_name)}
                    className={cn(
                      "destination-item w-full text-left flex items-center justify-between gap-2",
                      isActive && "active"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-1 ring-border/30"
                        style={{
                          backgroundColor: forecast
                            ? PET_COLORS[forecast.thermal_category as ThermalCategory]
                            : '#cccccc',
                        }}
                      />
                      <span className="truncate text-sm font-medium">{village.village_name}</span>
                    </div>

                    {forecast && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Thermometer className="w-3 h-3" />
                        <span className="font-mono">{forecast.pet_value}°</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 bg-secondary/30">
              <p className="text-xs text-muted-foreground text-center">
                Klik destinasi untuk melihat detail
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
