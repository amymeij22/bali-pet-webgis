import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListFilter, MapPin, Search, Thermometer } from 'lucide-react';
import { PET_COLORS, classifyPet } from '@/data/dummyData';
import type { PETStandard } from '@/data/dummyData';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/lib/i18n';

interface DestinationSidebarProps {
  selectedTime: string;
  petStandard: PETStandard;
  onDestinationClick: (
    villageId: string,
    destinationName: string,
    villageName: string
  ) => void;
  activeVillage?: string | null;
  activeDestinationId?: string | null;
  destinations: Array<{
    id: string;
    village_id: string;
    destination_name: string;
    village_name: string;
    kdepum_code: string;
    // Optional metadata (may exist in runtime payload even if TS type doesn't require it)
    district?: string | null;
    regency?: string | null;
  }>;
  destinationChoropleth: Map<string, { pet_value: number }>;
}

export default function DestinationSidebar({
  petStandard,
  onDestinationClick,
  activeVillage,
  activeDestinationId,
  destinations,
  destinationChoropleth,
}: DestinationSidebarProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [query, setQuery] = useState('');
  const [grouped, setGrouped] = useState(false);
  const itemRefs = useRef(new Map<string, HTMLButtonElement | null>());

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const sidebarWidth = isMobile ? 220 : 264;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => d.destination_name.toLowerCase().includes(q));
  }, [destinations, query]);

  const hasGroupingMeta = useMemo(() => {
    return filtered.some((d) => (d.regency ?? d.district) != null);
  }, [filtered]);

  const groupedData = useMemo(() => {
    if (!grouped || !hasGroupingMeta) {
      return [{ key: '__all__', title: null as string | null, items: filtered }];
    }

    const groups = new Map<string, { title: string; items: typeof filtered }>();
    for (const d of filtered) {
      const title =
        [d.regency, d.district].filter(Boolean).join(' • ') ||
        (t('not_available') as string);
      const key = title;
      const g = groups.get(key);
      if (g) g.items.push(d);
      else groups.set(key, { title, items: [d] });
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ key, title: v.title, items: v.items }));
  }, [filtered, grouped, hasGroupingMeta, t]);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeDestinationId) return;
    const el = itemRefs.current.get(activeDestinationId);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeDestinationId, isOpen]);

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
                {t('destinations_header')}
              </h2>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {filtered.length} {t('destinations_count_suffix')}
              </p>
              <button
                type="button"
                onClick={() => setGrouped((v) => !v)}
                disabled={!hasGroupingMeta}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[10px] sm:text-xs text-muted-foreground hover:bg-secondary/40 transition-colors',
                  (!hasGroupingMeta || filtered.length === 0) && 'opacity-50 cursor-not-allowed',
                  grouped && 'text-foreground'
                )}
                aria-label={t('destinations_group_toggle')}
                title={t('destinations_group_toggle')}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>{grouped ? t('destinations_grouped_by') : t('destinations_group_toggle')}</span>
              </button>
            </div>

            <div className="mt-2 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('destinations_search_placeholder')}
                className="w-full h-8 rounded-md border border-border bg-background/40 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {groupedData.map((g) => (
              <div key={g.key} className="mb-2 last:mb-0">
                {g.title ? (
                  <div className="px-2 pt-2 pb-1 text-[10px] sm:text-xs font-medium text-muted-foreground">
                    {g.title}
                  </div>
                ) : null}

                {g.items.map((destination) => {
                  const forecast = destinationChoropleth.get(destination.id);
                  const isActive =
                    activeDestinationId === destination.id || activeVillage === destination.village_id;

                  let category: string | null = null;
                  if (forecast) category = classifyPet(forecast.pet_value, petStandard);

                  return (
                    <button
                      key={destination.id}
                      ref={(el) => {
                        itemRefs.current.set(destination.id, el);
                      }}
                      onClick={() =>
                        onDestinationClick(
                          destination.village_id,
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
                              ? PET_COLORS[category as keyof typeof PET_COLORS]
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
                          <span className="font-mono">{forecast.pet_value}°</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground/60 flex-shrink-0">
                          <span className="text-[9px]">{t('not_available')}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border/50 bg-secondary/30 text-center">
            <p className="text-[9px] sm:text-xs text-muted-foreground">
              {t('destinations_footer_hint')}
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
          aria-label={t('sidebar_toggle_aria')}
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
            {t('destinations_toggle')}
          </span>
        </button>
      </motion.div>
    </>
  );
}
