import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { FORECAST_TIMES } from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface TimeSliderProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

export default function TimeSlider({ selectedTime, onTimeChange }: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentIndex = useMemo(() => {
    return FORECAST_TIMES.findIndex((t) => t === selectedTime);
  }, [selectedTime]);

  const selectedDate = useMemo(() => {
    return parseISO(selectedTime);
  }, [selectedTime]);

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

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onTimeChange(FORECAST_TIMES[currentIndex - 1]);
    }
  }, [currentIndex, onTimeChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < FORECAST_TIMES.length - 1) {
      onTimeChange(FORECAST_TIMES[currentIndex + 1]);
    } else {
      // Loop back to start
      onTimeChange(FORECAST_TIMES[0]);
    }
  }, [currentIndex, onTimeChange]);

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    if (index >= 0 && index < FORECAST_TIMES.length) {
      onTimeChange(FORECAST_TIMES[index]);
    }
  };

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Handle autoplay
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        handleNext();
      }, 1500); // 1.5 second interval
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, handleNext]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className="fixed bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none"
    >
      <div className="glass-panel rounded-xl px-4 py-3 pointer-events-auto">
      {/* Top Row - Date and Time Display */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-xs font-medium text-foreground">
          {format(selectedDate, 'EEE, dd MMM', { locale: id })}
        </span>
        <span className="text-xs text-muted-foreground">|</span>
        <span className="text-xs font-medium text-primary font-mono">
          {format(selectedDate, 'HH:mm')} WITA
        </span>
      </div>

      {/* Slider with Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Waktu sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant={isPlaying ? "default" : "outline"}
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={togglePlay}
          aria-label={isPlaying ? "Stop" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </Button>

        <Slider
          value={[currentIndex]}
          min={0}
          max={FORECAST_TIMES.length - 1}
          step={1}
          onValueChange={handleSliderChange}
          className="w-48"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={handleNext}
          disabled={currentIndex === FORECAST_TIMES.length - 1 && !isPlaying}
          aria-label="Waktu berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Labels */}
      <div className="flex justify-center gap-1 mt-2">
        {days.map((day, index) => {
          const isActive = isSameDay(day.date, selectedDate);
          const isToday = isSameDay(day.date, new Date());
          
          return (
            <button
              key={index}
              onClick={() => onTimeChange(day.times[0])}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {isToday ? 'Hari Ini' : format(day.date, 'dd/MM', { locale: id })}
            </button>
          );
        })}
      </div>
      </div>
    </motion.div>
  );
}
