import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Thermometer } from 'lucide-react';
import { PET_COLORS, PET_RANGES, PETStandard } from '@/data/dummyData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DestinationSidebarProps {
  selectedTime: string;
  petStandard: PETStandard;
  onDestinationClick: (
    villageId: string,
    destinationName: string,
    villageName: string
  ) => void;
  activeVillage?: string | null;
  destinations: Array<{
    id: string;
    village_id: string;
    destination_name: string;
    village_name: string;
    kdepum_code: string;
  }>;
  choropleth: Map<string, { pet_value: number }>;
}

export default function DestinationSidebar({
  petStandard,
  onDestinationClick,
  activeVillage,
  destinations,
  choropleth,
}: DestinationSidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const sidebarWidth = isMobile ? 220 : 264;
  const ranges = PET_RANGES[petStandard];

  return (
    <>
      {/* Backdrop mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-background/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* === SIDEBAR + TOGGLE CONTAINER === */}
      <motion.div
        className="fixed top-0 left-0 bottom-0 z-40 flex"
        animate={{ x: isOpen ? 0 : -sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* SIDEBAR */}
        <aside
          className={cn(
            'glass-panel flex flex-col rounded-r-2xl z-20',
            isMobile ? 'w-[220px]' : 'w-[264px]'
          )}
        >
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent destination-header-icon" />
              <h2 className="font-semibold text-sm sm:text-lg text-foreground">
                Destinasi Wisata
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {destinations.length} lokasi wisata di Bali
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {destinations.map((destination) => {
              // Forecast is per village (kdepum), not per destination
              const forecast = choropleth.get(destination.village_id);
              const isActive = activeVillage === destination.village_id;

              let category: string | null = null;
              if (forecast) {
                for (const [key, range] of Object.entries(ranges)) {
                  if (
                    forecast.pet_value >= range.min &&
                    forecast.pet_value < range.max
                  ) {
                    category = key;
                    break;
                  }
                }
              }

              return (
                <button
                  key={destination.id}
                  onClick={() =>
                    onDestinationClick(
                      destination.village_id, // Use village_id because forecast is per village
                      destination.destination_name,
                      destination.village_name
                    )
                  }
                  className={cn(
                    'destination-item w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left',
                    isActive && 'active'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: category
                          ? PET_COLORS[
                              category as keyof typeof PET_COLORS
                            ]
                          : '#ccc',
                      }}
                    />
                    <span className="truncate text-xs sm:text-sm font-medium">
                      {destination.destination_name}
                    </span>
                  </div>

                  {forecast ? (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                      <Thermometer className="w-3 h-3" />
                      <span className="font-mono">
                        {forecast.pet_value}°
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground/60 flex-shrink-0">
                      <span className="text-[9px]">Belum tersedia</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border/50 bg-secondary/30 text-center">
            <p className="text-[9px] sm:text-xs text-muted-foreground">
              Klik destinasi untuk melihat detail
            </p>
          </div>
        </aside>

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="
            absolute top-1/2 -right-8 -translate-y-1/2
            z-10
            bg-card border border-border shadow-sm
            rounded-r-2xl
            px-2 py-3
            sm:px-3 sm:py-5
            hover:bg-secondary/60 transition-colors
          "
          aria-label="Toggle sidebar"
        >
          <span
            className="
              text-[10px] sm:text-xs
              font-semibold uppercase tracking-wider
              text-foreground
              select-none
            "
            style={{ writingMode: 'vertical-rl' }}
          >
            DESTINASI
          </span>
        </button>
      </motion.div>
    </>
  );
}
