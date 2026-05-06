import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toWitaDate } from '@/lib/timezone';
import NotificationToggle from '@/components/notifications/NotificationToggle';
import LanguageSelector from '@/components/controls/LanguageSelector';
import { useI18n } from '@/lib/i18n';

interface TimeSliderProps {
  selectedTime: string;
  times: string[];
  producedAt?: string | null;
  isPlaying: boolean;
  onPlayChange: (playing: boolean) => void;
  onTimeChange: (time: string) => void;
}

export default function TimeSlider({ selectedTime, times, producedAt, isPlaying, onPlayChange, onTimeChange }: TimeSliderProps) {
  const { t, lang } = useI18n();
  const dfLocale = lang === 'en' ? enUS : id;
  const reduceMotion = useReducedMotion();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasData = times.length > 0;

  const currentIndex = useMemo(() => {
    if (!hasData) return -1;
    return times.findIndex((t) => t === selectedTime);
  }, [selectedTime, times, hasData]);

  const selectedDate = useMemo(() => {
    if (!hasData || !selectedTime) return new Date();
    return toWitaDate(selectedTime);
  }, [selectedTime, hasData]);

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
    if (!hasData || currentIndex <= 0) return;
    onTimeChange(times[currentIndex - 1]);
  }, [currentIndex, onTimeChange, times, hasData]);

  const handleNext = useCallback(() => {
    if (!hasData) return;
    if (currentIndex < times.length - 1) {
      onTimeChange(times[currentIndex + 1]);
    } else {
      // Loop back to start
      onTimeChange(times[0]);
    }
  }, [currentIndex, onTimeChange, times, hasData]);

  const handleSliderChange = (value: number[]) => {
    if (!hasData) return;
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
    if (!hasData) {
      // Stop playing if no data
      if (isPlaying) {
        onPlayChange(false);
      }
      return;
    }

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
  }, [isPlaying, handleNext, hasData, onPlayChange]);

  return (
    <div
      className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
    >
      <div className="glass-panel rounded-xl px-3 sm:px-4 py-2 sm:py-3 pointer-events-auto max-w-full">
        {/* Top Row - Date and Time Display */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <span className="text-[10px] sm:text-xs font-medium text-foreground">
            {hasData ? format(selectedDate, 'EEE, dd MMM', { locale: dfLocale }) : '-'}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">|</span>
          <span className="text-[10px] sm:text-xs font-medium text-primary font-mono">
            {hasData ? `${format(selectedDate, 'HH:mm')} ${t('wita')}` : '-'}
          </span>
        </div>

        {/* Slider with Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={handlePrev}
            disabled={!hasData || currentIndex === 0}
            aria-label={t('time_prev_aria')}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>

          <Button
            variant={isPlaying ? "default" : "outline"}
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={togglePlay}
            disabled={!hasData}
            aria-label={isPlaying ? t('stop_aria') : t('play_aria')}
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            ) : (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
            )}
          </Button>

          <Slider
            value={hasData ? [Math.max(0, currentIndex)] : [0]}
            min={0}
            max={Math.max(0, times.length - 1)}
            step={1}
            onValueChange={handleSliderChange}
            disabled={!hasData}
            className="w-32 sm:w-48"
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
            onClick={handleNext}
            disabled={!hasData || (currentIndex === times.length - 1 && !isPlaying)}
            aria-label={t('time_next_aria')}
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Day Labels */}
        <div className="flex justify-center gap-1 mt-2">
          {hasData && days.length > 0 ? (
            days.map((day, index) => {
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
                  {isToday ? t('today') : format(day.date, 'dd/MM', { locale: dfLocale })}
                </button>
              );
            })
          ) : (
            <span className="text-[9px] sm:text-[10px] text-muted-foreground px-1.5 sm:px-2 py-0.5">
              -
            </span>
          )}
        </div>

        {/* Notification Toggle - Above produced time */}
        <div className="mt-2 flex justify-center items-center gap-2">
          <NotificationToggle />
          <LanguageSelector />
        </div>
        
        {/* Produced time label */}
        <div className="mt-1 text-center text-[10px] sm:text-xs text-muted-foreground">
          {t('time_produced')}: {producedAt ? `${format(toWitaDate(producedAt), 'dd MMM yyyy HH:mm', { locale: dfLocale })} ${t('wita')}` : '-'}
        </div>
        
      </div>
    </div>
  );
}
