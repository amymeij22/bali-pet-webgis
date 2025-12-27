import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { FORECAST_TIMES, FORECAST_BATCH } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface TimeSliderProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export default function TimeSlider({ selectedTime, onTimeChange }: TimeSliderProps) {
  const currentIndex = useMemo(() => {
    return FORECAST_TIMES.findIndex((t) => t === selectedTime);
  }, [selectedTime]);

  const selectedDate = useMemo(() => {
    return parseISO(selectedTime);
  }, [selectedTime]);

  const producedAt = useMemo(() => {
    return parseISO(FORECAST_BATCH.produced_at);
  }, []);

  // Group forecast times by day
  const days = useMemo(() => {
    const grouped: { date: Date; times: string[] }[] = [];
    
    FORECAST_TIMES.forEach((time) => {
      const date = parseISO(time);
      const existingDay = grouped.find((d) => isSameDay(d.date, date));
      
      if (existingDay) {
        existingDay.times.push(time);
      } else {
        grouped.push({ date, times: [time] });
      }
    });

    return grouped;
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onTimeChange(FORECAST_TIMES[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < FORECAST_TIMES.length - 1) {
      onTimeChange(FORECAST_TIMES[currentIndex + 1]);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    if (index >= 0 && index < FORECAST_TIMES.length) {
      onTimeChange(FORECAST_TIMES[index]);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 map-control w-[calc(100%-2rem)] max-w-2xl"
    >
      {/* Top Row - Date and Time Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              {format(selectedDate, 'EEEE, dd MMM yyyy', { locale: id })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold font-mono text-primary">
              {format(selectedDate, 'HH:mm')} WITA
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Waktu sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            disabled={currentIndex === FORECAST_TIMES.length - 1}
            aria-label="Waktu berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <Slider
          value={[currentIndex]}
          min={0}
          max={FORECAST_TIMES.length - 1}
          step={1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>

      {/* Day Labels */}
      <div className="flex justify-between mt-2 px-1">
        {days.map((day, index) => {
          const isActive = isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, new Date());
          
          return (
            <button
              key={index}
              onClick={() => onTimeChange(day.times[0])}
              className={cn(
                "text-xs px-2 py-1 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {isToday ? 'Hari Ini' : format(day.date, 'EEE, dd', { locale: id })}
            </button>
          );
        })}
      </div>

      {/* Production Time Footer */}
      <div className="mt-3 pt-2 border-t border-border/50 text-center">
        <span className="text-[10px] text-muted-foreground">
          Waktu Produksi Data: {format(producedAt, 'dd/MM/yyyy HH:mm', { locale: id })} WITA
        </span>
      </div>
    </motion.div>
  );
}
