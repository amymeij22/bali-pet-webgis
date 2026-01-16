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
import { 
  getLatestBatch, 
  getDestinationsWithVillage, 
  getVillagesWithDestinations,
  getAllForecastsForBatch, 
  WeatherForecast, 
  ForecastBatch,
  VillageWithDestinations,
} from '@/data/supabaseQueries';
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
      destinations?: string[]; // List of all destination names for villages with multiple destinations
      kdepumCode?: string; // kdepum_code for highlighting all polygons with same kdepum
    } | null
  >(null);
  const [showPopup, setShowPopup] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [producedAt, setProducedAt] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Destinations for sidebar (flat list - 49 destinasi)
  const [destinations, setDestinations] = useState<Array<{ 
    id: string; 
    village_id: string;
    destination_name: string; 
    village_name: string;
    kdepum_code: string;
  }>>([]);
  
  // Villages with destinations for map (grouped by kdepum)
  const [villagesWithDestinations, setVillagesWithDestinations] = useState<VillageWithDestinations[]>([]);
  const [forecastsByTime, setForecastsByTime] = useState<Map<string, Map<string, WeatherForecast>>>(new Map());
  const [choropleth, setChoropleth] = useState<Map<string, { pet_value: number }>>(new Map());
  const [popupForecast, setPopupForecast] = useState<null | WeatherForecast>(null);

  // Load initial batch, times, villages, and destinations
  // IMPORTANT: Load villages and destinations even if no batch exists
  useEffect(() => {
    (async () => {
      try {
        // Always load villages and destinations first (even without batch)
        const dests = await getDestinationsWithVillage();
        setDestinations(dests);
        
        const villagesData = await getVillagesWithDestinations();
        setVillagesWithDestinations(villagesData);

        // Try to load batch and forecasts (may not exist)
        const latest = await getLatestBatch();
        if (latest) {
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
        }
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
    // Find the clicked village from villagesWithDestinations
    // If villageId is empty, try to find by destinationName or villageName
    let clickedVillage = villageId 
      ? villagesWithDestinations.find(v => v.id === villageId)
      : villagesWithDestinations.find(v => 
          v.village_name === villageName || 
          v.destinations.some(d => d.destination_name === destinationName)
        );
    
    // If found in database, use database data
    if (clickedVillage) {
      const destinationNames = clickedVillage.destinations.map(d => d.destination_name);
      
      // Use village name as main if multiple destinations, otherwise use destination name
      const displayName = destinationNames.length > 1
        ? villageName
        : destinationName;
      
      setActiveVillage({ 
        id: clickedVillage.id, // Use database village ID
        destinationName: displayName, 
        villageName: clickedVillage.village_name,
        destinations: destinationNames.length > 1 ? destinationNames : undefined,
        kdepumCode: clickedVillage.kdepum_code,
      });
    } else {
      // Not in database yet, but still show popup with basic info
      setActiveVillage({ 
        id: '', // Empty ID means no forecast data available
        destinationName, 
        villageName,
        kdepumCode: undefined,
      });
    }
    
    setIsPlaying(false); // pause slider when popup opens
    setShowPopup(true);
  }, [villagesWithDestinations]);

  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    // Keep activeVillage for highlight, clear after animation
    setTimeout(() => {
      setActiveVillage(null);
    }, 300);
  }, []);

  // Pull popup detail from cached forecasts (no extra DB calls)
  // Allow popup to open even without forecast data
  useEffect(() => {
    if (!showPopup || !activeVillage) {
      setPopupForecast(null);
      return;
    }
    
    // If no selectedTime or no forecasts, set forecast to null (popup will show "belum tersedia")
    if (!selectedTime || !activeVillage.id) {
      setPopupForecast(null);
      return;
    }
    
    const timeMap = forecastsByTime.get(selectedTime);
    const detail = timeMap?.get(activeVillage.id) ?? null;
    setPopupForecast(detail ?? null);
  }, [showPopup, activeVillage, selectedTime, forecastsByTime]);

  // Memo for villages keyed by KDEPUM (raw & normalized) with both names
  // For villages with multiple destinations, include all destination names
  const villagesByKdepum = useMemo(() => {
    const result: Record<string, { 
      id: string; 
      destinationName: string; 
      villageName: string;
      destinations?: string[]; // List of all destination names for this kdepum
    }> = {};

    villagesWithDestinations.forEach((village) => {
      const raw = village.kdepum_code.trim();
      const normalized = raw.replace(/\D/g, '');
      
      const destinationNames = village.destinations.map(d => d.destination_name);
      
      // If multiple destinations, use village name as main name and list all destinations
      const entry = destinationNames.length > 1
        ? {
            id: village.id,
            destinationName: village.village_name, // Use village name as main
            villageName: village.village_name,
            destinations: destinationNames, // List all destinations
          }
        : destinationNames.length === 1
        ? {
            id: village.id,
            destinationName: destinationNames[0], // Use single destination name
            villageName: village.village_name,
          }
        : {
            id: village.id,
            destinationName: village.village_name, // Fallback to village name
            villageName: village.village_name,
          };

      // Add both raw and normalized keys
      result[raw] = entry;
      if (normalized && normalized !== raw) {
        result[normalized] = entry;
      }
    });

    return result;
  }, [villagesWithDestinations]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Full-bleed Map */}
      <LeafletMap
        selectedTime={selectedTime}
        petStandard={petStandard}
        onVillageClick={handleVillageClick}
        highlightedVillage={activeVillage?.id}
        highlightedKdepum={activeVillage?.kdepumCode}
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
        destinations={destinations}
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
                destinations={activeVillage.destinations}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
