import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Info } from 'lucide-react';
import {
  PET_COLORS,
  PET_RANGES,
} from '@/lib/pet';
import type { PETStandard, ThermalCategory } from '@/lib/pet';
import { useI18n } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PETLegendProps {
  standard: PETStandard;
  onStandardChange: (standard: PETStandard) => void;
}

const CATEGORY_ORDER: ThermalCategory[] = [
  'very_hot',
  'hot',
  'warm',
  'slight_warm',
  'neutral',
  'slight_cool',
  'cool',
  'cold',
  'very_cold',
];

export default function PETLegend({ standard, onStandardChange }: PETLegendProps) {
  const { lang, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const ranges = PET_RANGES[standard];

  const LegendContent = () => (
    <>
      {/* Header with Standard Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-foreground">{t('pet_standard_label')}</span>
          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label={t('pet_info_aria')}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>

      {/* Standard Selector */}
      <Select value={standard} onValueChange={(v) => onStandardChange(v as PETStandard)}>
        <SelectTrigger 
          className="w-full h-8 text-xs mb-3"
          aria-label={t('pet_standard_aria')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="center" className="w-[var(--radix-select-trigger-width)]">
          <SelectItem value="tropical" className="text-xs">{t('pet_standard_tropical')}</SelectItem>
          <SelectItem value="temperate" className="text-xs">{t('pet_standard_temperate')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Legend Items */}
      <div className="space-y-1">
        {CATEGORY_ORDER.map((category) => {
          const range = ranges[category];
          const color = PET_COLORS[category];

          return (
            <div key={category} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs truncate block">
                  {lang === 'en' ? range.label : range.labelId}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-foreground/80 font-mono whitespace-nowrap">
                {range.min === -999 ? (
                  `< ${range.max}`
                ) : range.max === 999 ? (
                  `> ${range.min}`
                ) : (
                  `${range.min} - ${range.max}`
                )}
                °C
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: Always visible */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.15, duration: 0.14, ease: 'easeOut' }}
        className="hidden xl:block fixed right-4 top-4 z-30 map-control w-[200px] pointer-events-auto"
      >
        <LegendContent />
      </motion.div>

      {/* Mobile: Overlay button */}
      <motion.button
        initial={reduceMotion ? false : { x: 40, opacity: 0 }}
        animate={reduceMotion ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
        onClick={() => setIsMobileOpen(true)}
        className="xl:hidden fixed right-0 top-[calc(50%-45px)] z-30 w-8 h-[45px] rounded-tl-2xl bg-card border-l border-t border-border shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors pointer-events-auto"
        aria-label={t('pet_view_legend_aria')}
      >
        <span className="text-[10px] font-bold text-foreground select-none">PET</span>
      </motion.button>

      {/* Mobile: Overlay modal */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
            className="xl:hidden fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
              className="relative z-10 glass-panel rounded-xl p-4 w-[280px]"
            >
              <LegendContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Popup - Centered Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsInfoOpen(false);
            }}
            role="presentation"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsInfoOpen(false)}
            />

            {/* Popup Content */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 glass-panel rounded-xl p-4 sm:p-6 w-[92vw] sm:w-[440px] h-[80vh] sm:h-[600px] max-h-[640px] flex flex-col mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsInfoOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors z-10"
                  aria-label={t('close')}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="px-2 sm:px-4 mb-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground text-center">
                  {t('faq_title')}
                </h3>
              </div>

              {/* Scrollable Content */}
              <div className="px-2 sm:px-4 overflow-y-auto flex-1 no-scrollbar">
                <Accordion type="single" collapsible className="w-full space-y-0">
                  <AccordionItem value="item-1" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q1')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a1')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q2')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a2')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q3')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a3')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q4')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a4')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q5')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a5')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q6')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a6')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q7')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a7')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-8" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q8')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a8')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-9" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q9')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a9')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-10" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q10')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a10')}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-11" className="border-b-0">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {t('faq_q11')}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {t('faq_a11')}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
