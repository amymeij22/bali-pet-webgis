import { useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toWitaDate } from '@/lib/timezone';
import NotificationToggle from '@/components/notifications/NotificationToggle';

interface TimeSliderProps {
  selectedTime: string;
  times: string[];
  producedAt?: string | null;
  isPlaying: boolean;
  onPlayChange: (playing: boolean) => void;
  onTimeChange: (time: string) => void;
}

export default function TimeSlider({ selectedTime, times, producedAt, isPlaying, onPlayChange, onTimeChange }: TimeSliderProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentIndex = useMemo(() => {
    return times.findIndex((t) => t === selectedTime);
  }, [selectedTime, times]);

  const selectedDate = useMemo(() => {
    return toWitaDate(selectedTime);
  }, [selectedTime]);

  // Group forecast times by day
  const days = useMemo(() => {
    const grouped: { date: Date; times: string[] }[] = [];
    
    times.forEach((time) => {
      const date = toWitaDate(time);
      const existingDay = grouped.find((d) => isSameDay(d.date, date));
      
      if (existingDay) {
        existingDay.times.push(time);
      } else {
        grouped.push({ date, times: [time] });
      }
    });

    return grouped;
  }, [times]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onTimeChange(times[currentIndex - 1]);
    }
  }, [currentIndex, onTimeChange, times]);

  const handleNext = useCallback(() => {
    if (currentIndex < times.length - 1) {
      onTimeChange(times[currentIndex + 1]);
    } else {
      // Loop back to start
      onTimeChange(times[0]);
    }
  }, [currentIndex, onTimeChange, times]);

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    if (index >= 0 && index < times.length) {
      onTimeChange(times[index]);
    }
  };

  const togglePlay = useCallback(() => {
    onPlayChange(!isPlaying);
  }, [isPlaying, onPlayChange]);

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
      className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
    >
      <div className="glass-panel rounded-xl px-3 sm:px-4 py-2 sm:py-3 pointer-events-auto max-w-full">
        {/* Top Row - Date and Time Display */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <span className="text-[10px] sm:text-xs font-medium text-foreground">
            {format(selectedDate, 'EEE, dd MMM', { locale: id })}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">|</span>
          <span className="text-[10px] sm:text-xs font-medium text-primary font-mono">
            {format(selectedDate, 'HH:mm')} WITA
          </span>
        </div>

        {/* Slider with Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Waktu sebelumnya"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>

          <Button
            variant={isPlaying ? "default" : "outline"}
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={togglePlay}
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            ) : (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
            )}
          </Button>

          <Slider
            value={[Math.max(0, currentIndex)]}
            min={0}
            max={Math.max(0, times.length - 1)}
            step={1}
            onValueChange={handleSliderChange}
            className="w-32 sm:w-48"
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={handleNext}
            disabled={currentIndex === times.length - 1 && !isPlaying}
            aria-label="Waktu berikutnya"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Day Labels */}
        <div className="flex justify-center gap-1 mt-2">
          {days.map((day, index) => {
            const isActive = isSameDay(day.date, selectedDate);
            const isToday = isSameDay(day.date, toWitaDate(new Date()));
            
            return (
              <button
                key={index}
                onClick={() => onTimeChange(day.times[0])}
                className={cn(
                  "text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded transition-colors",
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

        {/* Notification Toggle - Above produced time */}
        <div className="mt-2 flex justify-center">
          <NotificationToggle />
        </div>
        
        {/* Produced time label */}
        {producedAt && (
          <div className="mt-1 text-center text-[10px] sm:text-xs text-muted-foreground">
            Waktu Produksi: {format(toWitaDate(producedAt), 'dd MMM yyyy HH:mm', { locale: id })} WITA
          </div>
        )}
        
      </div>
    </motion.div>
  );
}
