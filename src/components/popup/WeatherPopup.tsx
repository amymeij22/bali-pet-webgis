import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
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
} from 'lucide-react';
import { PET_COLORS, PET_RANGES, PETStandard, classifyPet } from '@/data/dummyData';
import type { ThermalCategory } from '@/data/dummyData';
import type { WeatherForecast } from '@/data/supabaseQueries';
import { Button } from '@/components/ui/button';
import { toWitaDate } from '@/lib/timezone';
import { useI18n } from '@/lib/i18n';

interface WeatherPopupProps {
  destinationName: string;
  heroImageUrl?: string | null;
  villageName: string;
  district?: string | null;
  regency?: string | null;
  villageId: string;
  forecast: WeatherForecast | null;
  currentTime: string;
  times: string[];
  standard: PETStandard;
  onClose: () => void;
  onTimeChange: (time: string) => void;
  destinations?: Array<{ id: string; name: string; imageUrl?: string | null }>;
  selectedDestinationId?: string;
  onDestinationChange?: (destinationId: string) => void;
}

export default function WeatherPopup({
  destinationName,
  heroImageUrl,
  villageName,
  district,
  regency,
  villageId,
  forecast,
  currentTime,
  times,
  standard,
  onClose,
  onTimeChange,
  destinations,
  selectedDestinationId,
  onDestinationChange,
}: WeatherPopupProps) {
  const { t, lang } = useI18n();
  const dfLocale = lang === 'en' ? enUS : id;
  const reduceMotion = useReducedMotion();
  // Indexing is handled by parent now; we only navigate using provided time
  const ranges = PET_RANGES[standard];

  // Fallback hero image (WEBP) kalau dari DB kosong / gagal load.
  const HERO_FALLBACK_URL =
    'https://images.unsplash.com/photo-1555861496-0666c8981751?auto=format&fit=crop&w=1200&q=80&fm=webp';
  const desiredHeroSrcRaw = (heroImageUrl ?? '').trim();
  const desiredHeroSrc = useMemo(() => {
    const raw = desiredHeroSrcRaw;
    if (!raw) return HERO_FALLBACK_URL;

    // If DB stores a signed Supabase Storage URL, try to normalize to public URL.
    // This avoids expiry issues *if* the bucket is public.
    if (raw.includes('/storage/v1/object/sign/')) {
      const noQuery = raw.split('?')[0] ?? raw;
      return noQuery.replace('/storage/v1/object/sign/', '/storage/v1/object/public/');
    }

    return raw;
  }, [desiredHeroSrcRaw]);
  const [heroSrc, setHeroSrc] = useState<string>(desiredHeroSrc);

  useEffect(() => {
    setHeroSrc(desiredHeroSrc);
  }, [desiredHeroSrc]);

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
  
  if (forecast) {
    pet = forecast.pet_value;
    category = classifyPet(pet, standard);
    petColor = PET_COLORS[category];
    petRange = PET_RANGES[standard][category];
  }
  
  const forecastDate = forecast ? toWitaDate(forecast.forecast_time) : currentDate;

  const locationLine = useMemo(() => {
    const parts = [villageName, district, regency].map((x) => (x ?? '').trim()).filter(Boolean);
    return parts.join(', ');
  }, [villageName, district, regency]);

  const windDirDisplay = useMemo(() => {
    const raw = (forecast?.wind_direction ?? '').trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw; // already textual (e.g. N, NE, Barat)
    const deg = ((n % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return `${dirs[idx]} (${Math.round(deg)}°)`;
  }, [forecast?.wind_direction]);

  const visibilityDisplay = useMemo(() => {
    const raw = (forecast?.visibility ?? '').trim();
    if (!raw) return null;
    // If the API already includes unit, keep it.
    if (/[a-zA-Z]/.test(raw)) return raw;
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    // Heuristic: many weather visibilities are in km. Keep numeric and add unit gently.
    return `${n} km`;
  }, [forecast?.visibility]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 20 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="
        weather-popup
        w-[360px] sm:w-[400px] md:w-[440px]
        h-[520px] sm:h-[560px]
        max-w-[92vw] max-h-[88vh]
        flex flex-col
      "
    >
      {/* Header */}
      <div className="popup-header relative flex-shrink-0 overflow-hidden rounded-t-2xl min-h-[140px]">
        {/* Background image (subtle) */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={heroSrc}
            alt=""
            className="h-full w-full object-cover opacity-90"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              if (heroSrc !== HERO_FALLBACK_URL) setHeroSrc(HERO_FALLBACK_URL);
            }}
          />
          {/* White overlay to keep header text readable */}
          <div className="absolute inset-0 bg-white/45" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 to-white/0" />
        </div>

        <div className="relative flex items-start justify-between p-3">
          <div className="min-w-0">
            {/* Jika multiple destinasi, tampilkan dropdown pilihan destinasi */}
            {destinations && destinations.length > 1 ? (
              <>
                <h3 className="font-bold text-base text-foreground">{t('popup_destinations_title')}</h3>
                <div className="mt-1">
                  <select
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-[11px] text-foreground"
                    value={selectedDestinationId ?? destinations[0]?.id ?? ''}
                    onChange={(e) => onDestinationChange?.(e.target.value)}
                    aria-label={t('popup_select_destination_aria')}
                  >
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-foreground leading-tight mt-1">{locationLine}</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-base text-foreground">{destinationName}</h3>
                <p className="text-[11px] text-foreground leading-tight">{locationLine}</p>
              </>
            )}
            {currentTime ? (
              <p className="text-xs text-foreground">
                {format(forecastDate, 'EEEE, dd MMM yyyy', { locale: dfLocale })}
              </p>
            ) : (
              <p className="text-xs text-foreground">
                {format(new Date(), 'EEEE, dd MMM yyyy', { locale: dfLocale })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1"
            onClick={onClose}
            aria-label={t('popup_close_aria')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Navigation - Only show if forecast exists */}
        {forecast && (
          <div className="relative flex items-center justify-center gap-2 mt-1 pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label={t('popup_prev_time_aria')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-foreground font-mono bg-secondary px-2 py-0.5 rounded">
              {format(forecastDate, 'HH:mm')} {t('wita')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label={t('popup_next_time_aria')}
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
        <p className="text-[10px] text-white/95 uppercase tracking-wide mb-1">
          {t('popup_thermal_comfort')}
        </p>
        {forecast ? (
          <>
            <div className="text-3xl font-bold text-white drop-shadow-sm">
              {forecast.pet_value}°C
            </div>
            <div className="mt-1">
              <span className="text-white/90 font-medium text-sm">
                {lang === 'en' ? petRange.label : petRange.labelId}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-white/90 drop-shadow-sm">
              {t('popup_no_forecast_title')}
            </div>
            <div className="mt-1">
              <span className="text-white/70 font-medium text-xs">
                {t('popup_no_forecast_desc')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Weather Parameters */}
      <div className="popup-weather-grid flex-1 overflow-auto">
        <WeatherItem
          icon={<Thermometer className="w-5 h-5" />}
          label={t('popup_weather_temp')}
          value={forecast ? `${forecast.temperature}°C` : t('not_available')}
        />
        <WeatherItem
          icon={<Droplets className="w-5 h-5" />}
          label={t('popup_weather_humidity')}
          value={forecast ? `${forecast.humidity}%` : t('not_available')}
        />
        <WeatherItem
          icon={<Wind className="w-5 h-5" />}
          label={t('popup_weather_wind_speed')}
          value={forecast ? `${forecast.wind_speed} ${lang === 'en' ? 'km/h' : 'km/jam'}` : t('not_available')}
        />
        <WeatherItem
          icon={<Compass className="w-5 h-5" />}
          label={t('popup_weather_wind_dir')}
          value={forecast ? (windDirDisplay ?? t('not_available')) : t('not_available')}
        />
        <WeatherItem
          icon={<Cloud className="w-5 h-5" />}
          label={t('popup_weather_condition')}
          value={forecast ? forecast.weather_condition : t('not_available')}
        />
        <WeatherItem
          icon={<Eye className="w-5 h-5" />}
          label={t('popup_weather_visibility')}
          value={forecast ? (visibilityDisplay ?? t('not_available')) : t('not_available')}
        />
        {/* Optional: precipitation and cloud cover are not in the new schema */}
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
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background/60 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-secondary/70 flex items-center justify-center text-muted-foreground flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] text-muted-foreground truncate leading-tight">{label}</p>
        <p className="text-[13px] font-semibold text-foreground truncate leading-snug">{value}</p>
      </div>
    </div>
  );
}
