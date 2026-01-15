import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
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
  CloudRain,
} from 'lucide-react';
import {
  PET_COLORS,
  PET_RANGES,
  PETStandard,
  VISITOR_NOTES,
} from '@/data/dummyData';
import type { WeatherForecast, ThermalCategory } from '@/data/supabaseQueries';
import { Button } from '@/components/ui/button';
import { toWitaDate } from '@/lib/timezone';

interface WeatherPopupProps {
  destinationName: string;
  villageName: string;
  villageId: string;
  forecast: WeatherForecast | null;
  currentTime: string;
  times: string[];
  standard: PETStandard;
  onClose: () => void;
  onTimeChange: (time: string) => void;
  hideVisitorNote?: boolean;
}

export default function WeatherPopup({
  destinationName,
  villageName,
  villageId,
  forecast,
  currentTime,
  times,
  standard,
  onClose,
  onTimeChange,
  hideVisitorNote = false,
}: WeatherPopupProps) {
  // Indexing is handled by parent now; we only navigate using provided time
  const ranges = PET_RANGES[standard];

  const currentIndex = useMemo(() => times.findIndex((t) => t === currentTime), [times, currentTime]);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < times.length - 1;

  const handlePrev = () => {
    if (currentIndex > 0) onTimeChange(times[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < times.length - 1) {
      onTimeChange(times[currentIndex + 1]);
    }
  };

  if (!forecast) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="weather-popup w-[340px] h-[480px] flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Data tidak tersedia</p>
            <Button variant="ghost" size="sm" onClick={onClose} className="mt-2">
              Tutup
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compute category based on PET value and selected standard
  let category: ThermalCategory = forecast.thermal_category;
  const pet = forecast.pet_value;
  for (const [key, range] of Object.entries(ranges)) {
    if (pet >= range.min && pet < range.max) {
      category = key as ThermalCategory;
      break;
    }
  }
  const petColor = PET_COLORS[category];
  const petRange = PET_RANGES[standard][category];
  const visitorNote = VISITOR_NOTES[category];
  const forecastDate = toWitaDate(forecast.forecast_time);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="weather-popup w-[340px] h-[480px] flex flex-col"
    >
      {/* Header */}
      <div className="popup-header relative flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">{destinationName}</h3>
            <p className="text-[11px] text-muted-foreground leading-tight">{villageName}</p>
            <p className="text-xs text-muted-foreground">
              {format(forecastDate, "EEEE, dd MMM yyyy", { locale: id })}
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
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Waktu sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
            {format(forecastDate, "HH:mm")} WITA
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
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
        className="popup-pet-display flex-shrink-0"
        style={{ backgroundColor: petColor }}
      >
        <p className="text-[10px] text-white/70 uppercase tracking-wide mb-1">
          Kenyamanan Termal (PET)
        </p>
        <div className="text-3xl font-bold text-white drop-shadow-sm">
          {forecast.pet_value}°C
        </div>
        <div className="mt-1">
          <span className="text-white/90 font-medium text-sm">
            {petRange.labelId}
          </span>
        </div>
      </div>

      {/* Weather Parameters */}
      <div className="popup-weather-grid flex-1 overflow-auto">
        <WeatherItem
          icon={<Thermometer className="w-3.5 h-3.5" />}
          label="Suhu Udara"
          value={`${forecast.temperature}°C`}
        />
        <WeatherItem
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Kelembapan"
          value={`${forecast.humidity}%`}
        />
        <WeatherItem
          icon={<Wind className="w-3.5 h-3.5" />}
          label="Kec. Angin"
          value={`${forecast.wind_speed} km/jam`}
        />
        <WeatherItem
          icon={<Compass className="w-3.5 h-3.5" />}
          label="Arah Angin"
          value={`${forecast.wind_direction}`}
        />
        <WeatherItem
          icon={<Cloud className="w-3.5 h-3.5" />}
          label="Kondisi"
          value={forecast.weather_condition}
        />
        <WeatherItem
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Jarak Pandang"
          value={forecast.visibility}
        />
        {/* Optional: precipitation and cloud cover are not in the new schema */}
      </div>

      {/* Visitor Notes */}
      {!hideVisitorNote && (
        <div className="popup-notes flex-shrink-0">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-medium text-foreground mb-0.5">
                Saran untuk Wisatawan
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {visitorNote}
              </p>
            </div>
          </div>
        </div>
      )}
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
    <div className="flex items-center gap-2 p-1.5 bg-secondary/50 rounded-lg">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] text-muted-foreground truncate">{label}</p>
        <p className="text-[11px] font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
