import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface DataSourceCardProps {
  className?: string;
}

export default function DataSourceCard({ className }: DataSourceCardProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [showDesktopCard, setShowDesktopCard] = useState(true);

  return (
    <>
      {/* Desktop: Always visible card */}
      <div
        className={cn(
          "hidden xl:block fixed bottom-4 right-4 z-20",
          className
        )}
      >
        <div className="glass-panel rounded-xl px-4 py-3 w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">{t('data_sources')}</span>
          </div>
          <ul className="text-[10px] text-foreground/80 space-y-1.5 leading-relaxed">
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>{t('data_source_bmkg')}</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>{t('data_source_big')}</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>{t('data_source_disparda')}</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-primary">•</span>
              <span>{t('data_source_kemendagri')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile: Overlay button */}
      <motion.button
        initial={reduceMotion ? false : { x: 40, opacity: 0 }}
        animate={reduceMotion ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        onClick={() => setIsOpen(true)}
        className="xl:hidden fixed right-0 top-[50%] z-30 w-8 h-[45px] rounded-bl-2xl bg-card border-l border-t border-b border-border shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors pointer-events-auto"
        aria-label={t('view_data_sources')}
      >
        <Info className="w-4 h-4 text-muted-foreground" />
      </motion.button>

      {/* Mobile: Overlay modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
            className="xl:hidden fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
              className="relative z-10 glass-panel rounded-xl p-4 w-[280px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">{t('data_sources')}</span>
              </div>
              <ul className="text-xs text-foreground/80 space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('data_source_bmkg')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('data_source_big')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('data_source_disparda')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('data_source_kemendagri')}</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
