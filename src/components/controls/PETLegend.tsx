import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  PET_COLORS,
  PET_RANGES,
  PETStandard,
  ThermalCategory,
} from '@/data/dummyData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const ranges = PET_RANGES[standard];

  const LegendContent = () => (
    <>
      {/* Header with Standard Selector */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-semibold text-foreground">Standar PET</span>
      </div>

      {/* Standard Selector */}
      <Select value={standard} onValueChange={(v) => onStandardChange(v as PETStandard)}>
        <SelectTrigger className="w-full h-8 text-xs mb-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tropical">Tropis / Subtropis</SelectItem>
          <SelectItem value="temperate">Iklim Sedang</SelectItem>
        </SelectContent>
      </Select>

      {/* Legend Items */}
      <div className="space-y-1">
        {CATEGORY_ORDER.map((category) => {
          const range = ranges[category];
          const color = PET_COLORS[category];
          const minDisplay = range.min === -999 ? '<' : '';
          const maxDisplay = range.max === 999 ? '>' : '';

          return (
            <div key={category} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs truncate block">{range.labelId}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {minDisplay}{range.min !== -999 ? range.min : range.max}
                {range.max !== 999 && ` - ${range.max}`}
                {maxDisplay}°C
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.14, ease: 'easeOut' }}
        className="hidden md:block fixed right-4 top-4 z-30 map-control w-[200px] pointer-events-auto"
      >
        <LegendContent />
      </motion.div>

      {/* Mobile: Overlay button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.12, ease: 'easeOut' }}
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-1/2 -translate-y-1/2 right-4 z-30 w-10 h-10 rounded-full glass-panel flex items-center justify-center"
        aria-label="Lihat standar PET"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[8px] font-bold text-primary-foreground">PET</span>
        </div>
      </motion.button>

      {/* Mobile: Overlay modal */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 z-50 flex items-start justify-end p-4 pt-28"
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="relative z-10 map-control w-[200px]"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-card border border-border shadow-sm hover:bg-secondary/50 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              <LegendContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
