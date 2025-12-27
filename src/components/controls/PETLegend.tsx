import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const ranges = PET_RANGES[standard];

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="fixed right-4 top-4 z-20 map-control w-[200px]"
    >
      {/* Header with Standard Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">Standar PET</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <p className="text-xs">
                Physiological Equivalent Temperature - indeks kenyamanan termal berdasarkan kondisi cuaca.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
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
                <span className="text-xs truncate block">{range.labelId}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {minDisplay}{range.min !== -999 ? range.min : range.max}
                {range.max !== 999 && ` - ${range.max}`}
                {maxDisplay}°C
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
