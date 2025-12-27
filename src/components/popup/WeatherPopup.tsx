import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Cloud,
  Eye,
  Lightbulb,
} from 'lucide-react';
import {
  WeatherForecast,
  PET_COLORS,
  PET_RANGES,
  PETStandard,
  ThermalCategory,
  VISITOR_NOTES,
  FORECAST_TIMES,
  getForecast,
} from '@/data/dummyData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WeatherPopupProps {
  villageName: string;
  villageId: string;
  forecast: WeatherForecast | null;
  currentTime: string;
  standard: PETStandard;
  onClose: () => void;
  onTimeChange: (time: string) => void;
}

export default function WeatherPopup({
  villageName,
  villageId,
  forecast,
  currentTime,
  standard,
  onClose,
  onTimeChange,
}: WeatherPopupProps) {
  const currentTimeIndex = useMemo(() => {
    return FORECAST_TIMES.findIndex((t) => t === currentTime);
  }, [currentTime]);

  const canGoPrev = currentTimeIndex > 0;
  const canGoNext = currentTimeIndex < FORECAST_TIMES.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      onTimeChange(FORECAST_TIMES[currentTimeIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onTimeChange(FORECAST_TIMES[currentTimeIndex + 1]);
    }
  };

  if (!forecast) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="weather-popup"
      >
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Data tidak tersedia</p>
          <Button variant="ghost" size="sm" onClick={onClose} className="mt-2">
            Tutup
          </Button>
        </div>
      </motion.div>
    );
  }

  const category = forecast.thermal_category as ThermalCategory;
  const petColor = PET_COLORS[category];
  const petRange = PET_RANGES[standard][category];
  const visitorNote = VISITOR_NOTES[category];
  const forecastDate = parseISO(forecast.forecast_time);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="weather-popup"
    >
      {/* Header */}
      <div className="popup-header relative">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-foreground">{villageName}</h3>
            <p className="text-sm text-muted-foreground">
              {format(forecastDate, "dd MMM yyyy, HH:mm", { locale: id })} WITA
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Navigation */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Waktu sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono">
            {format(forecastDate, "HH:mm")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Waktu berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PET Display */}
      <div
        className="popup-pet-display"
        style={{ backgroundColor: petColor }}
      >
        <div className="text-4xl font-bold text-white drop-shadow-sm">
          {forecast.pet_value}°C
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-white/90 font-medium text-lg">
            {petRange.labelId}
          </span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {forecast.thermal_sensation_scale > 0 ? '+' : ''}
            {forecast.thermal_sensation_scale}
          </span>
        </div>
      </div>

      {/* Weather Parameters */}
      <div className="popup-weather-grid">
        <WeatherItem
          icon={<Thermometer className="w-4 h-4" />}
          label="Suhu Udara"
          value={`${forecast.temperature}°C`}
        />
        <WeatherItem
          icon={<Droplets className="w-4 h-4" />}
          label="Kelembapan"
          value={`${forecast.humidity}%`}
        />
        <WeatherItem
          icon={<Wind className="w-4 h-4" />}
          label="Kecepatan Angin"
          value={`${forecast.wind_speed} km/jam`}
        />
        <WeatherItem
          icon={<Compass className="w-4 h-4" />}
          label="Arah Angin"
          value={forecast.wind_direction}
        />
        <WeatherItem
          icon={<Cloud className="w-4 h-4" />}
          label="Kondisi Cuaca"
          value={forecast.weather_condition}
        />
        <WeatherItem
          icon={<Eye className="w-4 h-4" />}
          label="Jarak Pandang"
          value={forecast.visibility}
        />
      </div>

      {/* Visitor Notes */}
      <div className="popup-notes">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground mb-1">
              Saran untuk Wisatawan
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {visitorNote}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface WeatherItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function WeatherItem({ icon, label, value }: WeatherItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
