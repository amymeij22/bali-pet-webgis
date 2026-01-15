import { useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LeafletMap from '@/components/map/LeafletMap';
import DestinationSidebar from '@/components/sidebar/DestinationSidebar';
import PETLegend from '@/components/controls/PETLegend';
import TimeSlider from '@/components/controls/TimeSlider';
import WeatherPopup from '@/components/popup/WeatherPopup';
import MapHeader from '@/components/header/MapHeader';
import DataSourceCard from '@/components/controls/DataSourceCard';
import { PETStandard } from '@/data/dummyData';
import { getLatestBatch, getVillages, getAllForecastsForBatch, WeatherForecast, ForecastBatch } from '@/data/supabaseQueries';
import { useBatchMonitor } from '@/hooks/useBatchMonitor';

const Index = () => {
  // State
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [petStandard, setPetStandard] = useState<PETStandard>('tropical');
  const [activeVillage, setActiveVillage] = useState<
    {
      id: string;
      destinationName: string;
      villageName: string;
    } | null
  >(null);
  const [showPopup, setShowPopup] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [producedAt, setProducedAt] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [villages, setVillages] = useState<Array<{ id: string; village_name: string; destination_name: string | null; kdepum_code: string | null }>>([]);
  const [forecastsByTime, setForecastsByTime] = useState<Map<string, Map<string, WeatherForecast>>>(new Map());
  const [choropleth, setChoropleth] = useState<Map<string, { pet_value: number }>>(new Map());
  const [popupForecast, setPopupForecast] = useState<null | WeatherForecast>(null);

  // Load initial batch, times, and villages
  useEffect(() => {
    (async () => {
      try {
        const latest = await getLatestBatch();
        if (!latest) return;
        setCurrentBatchId(latest.id);
        const allForecasts = await getAllForecastsForBatch(latest.id);
        setProducedAt(latest.produced_at);

        // Build times list (sorted)
        const timeSet = new Set(allForecasts.map((f) => f.forecast_time));
        const sortedTimes = Array.from(timeSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        setTimes(sortedTimes);
        setSelectedTime(sortedTimes[0] ?? '');

        // Group forecasts by time -> village
        const grouped = new Map<string, Map<string, WeatherForecast>>();
        allForecasts.forEach((f) => {
          const map = grouped.get(f.forecast_time) ?? new Map<string, WeatherForecast>();
          map.set(f.village_id, f);
          grouped.set(f.forecast_time, map);
        });
        setForecastsByTime(grouped);

        const v = await getVillages();
        setVillages(v);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to init data:', err);
      }
    })();
  }, []);

  // Handle new batch detected
  const handleNewBatch = useCallback(async (batch: ForecastBatch) => {
    console.log('[Index] New batch detected, reloading data...', batch.id);
    
    // Reload data untuk batch baru
    try {
      const allForecasts = await getAllForecastsForBatch(batch.id);
      setCurrentBatchId(batch.id);
      setProducedAt(batch.produced_at);

      // Build times list (sorted)
      const timeSet = new Set(allForecasts.map((f) => f.forecast_time));
      const sortedTimes = Array.from(timeSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setTimes(sortedTimes);
      setSelectedTime(sortedTimes[0] ?? '');

      // Group forecasts by time -> village
      const grouped = new Map<string, Map<string, WeatherForecast>>();
      allForecasts.forEach((f) => {
        const map = grouped.get(f.forecast_time) ?? new Map<string, WeatherForecast>();
        map.set(f.village_id, f);
        grouped.set(f.forecast_time, map);
      });
      setForecastsByTime(grouped);
    } catch (err) {
      console.error('[Index] Failed to reload data for new batch:', err);
    }
  }, []);

  // Monitor for new batches (triggers push notification)
  useBatchMonitor(currentBatchId, handleNewBatch);

  // Derive choropleth from cached forecasts when time changes
  useEffect(() => {
    if (!selectedTime) return;
    const timeMap = forecastsByTime.get(selectedTime);
    if (!timeMap) {
      setChoropleth(new Map());
      return;
    }
    const map = new Map<string, { pet_value: number }>();
    timeMap.forEach((forecast, villageId) => {
      map.set(villageId, { pet_value: forecast.pet_value });
    });
    setChoropleth(map);
  }, [forecastsByTime, selectedTime]);

  // Handlers
  const handleTimeChange = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const handleStandardChange = useCallback((standard: PETStandard) => {
    setPetStandard(standard);
  }, []);

  const handleVillageClick = useCallback((villageId: string, destinationName: string, villageName: string) => {
    setActiveVillage({ id: villageId, destinationName, villageName });
    setIsPlaying(false); // pause slider when popup opens
    setShowPopup(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    // Keep activeVillage for highlight, clear after animation
    setTimeout(() => {
      setActiveVillage(null);
    }, 300);
  }, []);

  // Pull popup detail from cached forecasts (no extra DB calls)
  useEffect(() => {
    if (!showPopup || !activeVillage || !selectedTime) {
      setPopupForecast(null);
      return;
    }
    const timeMap = forecastsByTime.get(selectedTime);
    const detail = timeMap?.get(activeVillage.id) ?? null;
    setPopupForecast(detail ?? null);
  }, [showPopup, activeVillage, selectedTime, forecastsByTime]);

  // Memo for villages keyed by KDEPUM (raw & normalized) with both names
  const villagesByKdepum = useMemo(() => {
    return Object.fromEntries(
      villages
        .filter((v) => v.kdepum_code)
        .flatMap((v) => {
          const raw = (v.kdepum_code as string).trim();
          const normalized = raw.replace(/\D/g, '');
          const entry = { id: v.id, destinationName: v.destination_name || v.village_name, villageName: v.village_name };

          return normalized && normalized !== raw
            ? [[raw, entry], [normalized, entry]]
            : [[raw, entry]];
        })
    );
  }, [villages]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Full-bleed Map */}
      <LeafletMap
        selectedTime={selectedTime}
        petStandard={petStandard}
        onVillageClick={handleVillageClick}
        highlightedVillage={activeVillage?.id}
        villagesByKdepum={villagesByKdepum}
        choropleth={choropleth}
      />

      {/* Header */}
      <MapHeader />

      {/* Left Sidebar - Destination List */}
      <DestinationSidebar
        selectedTime={selectedTime}
        petStandard={petStandard}
        onDestinationClick={handleVillageClick}
        activeVillage={activeVillage?.id}
        villages={villages}
        choropleth={choropleth}
      />

      {/* Right Panel - PET Legend & Standard Selector */}
      <PETLegend
        standard={petStandard}
        onStandardChange={handleStandardChange}
      />

      {/* Bottom - Time Slider */}
      {times.length > 0 && (
        <TimeSlider
          selectedTime={selectedTime}
          times={times}
          producedAt={producedAt}
          isPlaying={isPlaying}
          onPlayChange={setIsPlaying}
          onTimeChange={handleTimeChange}
        />
      )}

      {/* Data Source Card */}
      <DataSourceCard />

      {/* Weather Popup */}
      <AnimatePresence>
        {showPopup && activeVillage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handlePopupClose();
              }
            }}
            role="presentation"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => handlePopupClose()}
            />

            {/* Popup */}
            <div className="relative z-10">
              <WeatherPopup
                destinationName={activeVillage.destinationName}
                villageName={activeVillage.villageName}
                villageId={activeVillage.id}
                forecast={popupForecast}
                currentTime={selectedTime}
                times={times}
                standard={petStandard}
                onClose={handlePopupClose}
                onTimeChange={handleTimeChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
