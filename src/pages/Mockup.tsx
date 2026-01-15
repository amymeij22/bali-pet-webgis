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
import { getLatestBatch, getVillages, getAllForecastsForBatch, WeatherForecast } from '@/data/supabaseQueries';

const Mockup = () => {
  // State - same as Index.tsx
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
    setIsPlaying(false);
    setShowPopup(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    setTimeout(() => {
      setActiveVillage(null);
    }, 300);
  }, []);

  // Pull popup detail from cached forecasts
  useEffect(() => {
    if (!showPopup || !activeVillage || !selectedTime) {
      setPopupForecast(null);
      return;
    }
    const timeMap = forecastsByTime.get(selectedTime);
    const detail = timeMap?.get(activeVillage.id) ?? null;
    setPopupForecast(detail ?? null);
  }, [showPopup, activeVillage, selectedTime, forecastsByTime]);

  // Memo for villages keyed by KDEPUM with MOCKUP destination and village names
  const villagesByKdepum = useMemo(() => {
    return Object.fromEntries(
      villages
        .filter((v) => v.kdepum_code)
        .flatMap((v, idx) => {
          const raw = (v.kdepum_code as string).trim();
          const normalized = raw.replace(/\D/g, '');
          // Replace destination name with "Destinasi 1", "Destinasi 2", etc
          // Replace village name with "Desa 1", "Desa 2", etc
          const mockupName = `Destinasi ${idx + 1}`;
          const mockupVillageName = `Desa ${idx + 1}`;
          const entry = { id: v.id, destinationName: mockupName, villageName: mockupVillageName };

          return normalized && normalized !== raw
            ? [[raw, entry], [normalized, entry]]
            : [[raw, entry]];
        })
    );
  }, [villages]);

  // Create modified villages list with mockup names for sidebar
  const mockupVillages = useMemo(() => {
    return villages.map((v, idx) => ({
      ...v,
      destination_name: `Destinasi ${idx + 1}`,
    }));
  }, [villages]);

  // Modified active village with mockup destination and village name
  const mockupActiveVillage = useMemo(() => {
    if (!activeVillage) return null;
    const idx = villages.findIndex(v => v.id === activeVillage.id);
    return {
      ...activeVillage,
      destinationName: idx >= 0 ? `Destinasi ${idx + 1}` : activeVillage.destinationName,
      villageName: idx >= 0 ? `Desa ${idx + 1}` : activeVillage.villageName,
    };
  }, [activeVillage, villages]);

  return (
    <div className="wireframe relative h-screen w-screen overflow-hidden bg-[#f8f9fb] text-[#111827]">
      <style>{`
        .wireframe * { box-shadow: none !important; }
        .wireframe .glass-panel,
        .wireframe .map-control,
        .wireframe .leaflet-container,
        .wireframe .leaflet-popup-content-wrapper,
        .wireframe .leaflet-popup-tip,
        .wireframe .weather-popup,
        .wireframe .popup-pet-display,
        .wireframe .popup-notes,
        .wireframe .destination-item,
        .wireframe .destination-item.active,
        .wireframe .time-slider,
        .wireframe .legend-item,
        .wireframe .map-control button,
        .wireframe button,
        .wireframe .card,
        .wireframe .popover,
        .wireframe .sheet,
        .wireframe .drawer,
        .wireframe .dialog,
        .wireframe .select-trigger,
        .wireframe .select-content { background: transparent !important; border: 1px solid #111827 !important; }

        .wireframe .leaflet-container { border: 1px solid #111827 !important; }
        .wireframe .leaflet-pane { filter: grayscale(1); }
        .wireframe .leaflet-pane img { filter: grayscale(1) contrast(1.05); }
        .wireframe .leaflet-popup-content-wrapper,
        .wireframe .leaflet-popup-tip { background: #f8f9fb !important; border: 1px solid #111827 !important; }
        .wireframe .legend-item { border: 1px dashed #111827 !important; padding: 6px 8px !important; }
        .wireframe .legend-color { border: 1px solid #111827 !important; filter: grayscale(1) contrast(1.05); }
        .wireframe .popup-pet-display { color: #111827 !important; border: 1px dashed #111827 !important; background: transparent !important; }
        .wireframe .popup-pet-display div, .wireframe .popup-pet-display span, .wireframe .popup-pet-display p { color: #111827 !important; }
        .wireframe .leaflet-popup-content { color: #111827 !important; }
        .wireframe .leaflet-popup-content b { color: #111827 !important; }
        .wireframe .leaflet-marker-icon { filter: grayscale(1); }
        .wireframe .time-slider .bg-primary, .wireframe .time-slider .text-primary, .wireframe .time-slider .text-primary-foreground { background: transparent !important; color: #111827 !important; }
        .wireframe .time-slider .bg-secondary, .wireframe .time-slider .hover\:bg-secondary:hover { background: transparent !important; color: #111827 !important; }
        .wireframe .time-slider .rounded-full { border: 1px solid #111827 !important; }
        .wireframe .legend-item span { color: #111827 !important; }
        .wireframe .destination-item { border: 1px solid #111827 !important; background: transparent !important; }
        .wireframe .destination-item .w-3.h-3 { filter: grayscale(1) contrast(1.05); border: 1px solid #111827 !important; }
        .wireframe .destination-item.active { background: rgba(17,24,39,0.05) !important; }
        .wireframe .destination-item .font-mono, .wireframe .destination-item .text-muted-foreground { color: #374151 !important; }
        .wireframe .map-header { background: transparent !important; !important; }
        .wireframe .map-header img { filter: grayscale(1) contrast(1.05); border: 1px solid #111827 !important; border-radius: 6px; padding: 4px; background: transparent !important; }
        .wireframe .destination-header-icon { filter: grayscale(1) contrast(1.05); color: #111827 !important; border: 1px solid #111827 !important; border-radius: 4px; padding: 2px; background: transparent !important; }
      `}</style>
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

      {/* Left Sidebar - Destination List with mockup names */}
      <DestinationSidebar
        selectedTime={selectedTime}
        petStandard={petStandard}
        onDestinationClick={handleVillageClick}
        activeVillage={activeVillage?.id}
        villages={mockupVillages}
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

      {/* Weather Popup with mockup destination name */}
      <AnimatePresence>
        {showPopup && mockupActiveVillage && (
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
                destinationName={mockupActiveVillage.destinationName}
                villageName={mockupActiveVillage.villageName}
                villageId={mockupActiveVillage.id}
                forecast={popupForecast}
                currentTime={selectedTime}
                times={times}
                standard={petStandard}
                onClose={handlePopupClose}
                onTimeChange={handleTimeChange}
                hideVisitorNote
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mockup;
