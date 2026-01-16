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
  destinations?: string[]; // List of all destination names for villages with multiple destinations
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
  destinations,
}: WeatherPopupProps) {
  // Indexing is handled by parent now; we only navigate using provided time
  const ranges = PET_RANGES[standard];

  // Handle case when times array is empty (no batch data)
  const currentIndex = useMemo(() => {
    if (!times || times.length === 0) return -1;
    return times.findIndex((t) => t === currentTime);
  }, [times, currentTime]);
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

  // Get current date/time from selected time or use current date
  const currentDate = currentTime ? toWitaDate(currentTime) : new Date();

  // Compute category based on PET value and selected standard (if forecast exists)
  let category: ThermalCategory = 'neutral';
  let pet = 0;
  let petColor = '#9ca3af'; // grey-400 for no data
  let petRange = PET_RANGES[standard]['neutral'];
  let visitorNote = VISITOR_NOTES['neutral'];
  
  if (forecast) {
    pet = forecast.pet_value;
    for (const [key, range] of Object.entries(ranges)) {
      if (pet >= range.min && pet < range.max) {
        category = key as ThermalCategory;
        break;
      }
    }
    petColor = PET_COLORS[category];
    petRange = PET_RANGES[standard][category];
    visitorNote = VISITOR_NOTES[category];
  }
  
  const forecastDate = forecast ? toWitaDate(forecast.forecast_time) : currentDate;

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
            {/* If multiple destinations, show village name as main title */}
            {destinations && destinations.length > 1 ? (
              <>
                <h3 className="font-bold text-base text-foreground">{villageName}</h3>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                  Destinasi Wisata:
                </p>
                <ul className="text-[11px] text-muted-foreground leading-tight list-disc list-inside mb-1">
                  {destinations.map((dest, idx) => (
                    <li key={idx}>{dest}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3 className="font-bold text-base text-foreground">{destinationName}</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">{villageName}</p>
              </>
            )}
            {currentTime ? (
              <p className="text-xs text-muted-foreground">
                {format(forecastDate, "EEEE, dd MMM yyyy", { locale: id })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "EEEE, dd MMM yyyy", { locale: id })}
              </p>
            )}
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

        {/* Time Navigation - Only show if forecast exists */}
        {forecast && (
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
        )}
      </div>

      {/* PET Display */}
      <div
        className="popup-pet-display flex-shrink-0"
        style={{ backgroundColor: petColor }}
      >
        <p className="text-[10px] text-white/70 uppercase tracking-wide mb-1">
          Kenyamanan Termal (PET)
        </p>
        {forecast ? (
          <>
            <div className="text-3xl font-bold text-white drop-shadow-sm">
              {forecast.pet_value}°C
            </div>
            <div className="mt-1">
              <span className="text-white/90 font-medium text-sm">
                {petRange.labelId}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-white/90 drop-shadow-sm">
              Belum Tersedia
            </div>
            <div className="mt-1">
              <span className="text-white/70 font-medium text-xs">
                Data prakiraan belum tersedia
              </span>
            </div>
          </>
        )}
      </div>

      {/* Weather Parameters */}
      <div className="popup-weather-grid flex-1 overflow-auto">
        <WeatherItem
          icon={<Thermometer className="w-3.5 h-3.5" />}
          label="Suhu Udara"
          value={forecast ? `${forecast.temperature}°C` : 'Belum tersedia'}
        />
        <WeatherItem
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Kelembapan"
          value={forecast ? `${forecast.humidity}%` : 'Belum tersedia'}
        />
        <WeatherItem
          icon={<Wind className="w-3.5 h-3.5" />}
          label="Kec. Angin"
          value={forecast ? `${forecast.wind_speed} km/jam` : 'Belum tersedia'}
        />
        <WeatherItem
          icon={<Compass className="w-3.5 h-3.5" />}
          label="Arah Angin"
          value={forecast ? forecast.wind_direction : 'Belum tersedia'}
        />
        <WeatherItem
          icon={<Cloud className="w-3.5 h-3.5" />}
          label="Kondisi"
          value={forecast ? forecast.weather_condition : 'Belum tersedia'}
        />
        <WeatherItem
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Jarak Pandang"
          value={forecast ? forecast.visibility : 'Belum tersedia'}
        />
        {/* Optional: precipitation and cloud cover are not in the new schema */}
      </div>

      {/* Visitor Notes */}
      {!hideVisitorNote && forecast && (
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
