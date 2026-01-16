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
  VillageWithDestinations,
} from '@/data/supabaseQueries';

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
  // Destinations for sidebar (flat list)
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
  // IMPORTANT: Load villages and destinations even if no batch exists (for mockup)
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
        console.error('[Mockup] Failed to init data:', err);
        // Don't throw - allow page to render even if data loading fails
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
      // Find destination index for mockup name
      const destIdx = destinations.findIndex(d => d.village_id === clickedVillage!.id);
      const destinationNumber = destIdx >= 0 ? destIdx + 1 : 1;
      
      // Find village index
      const villageIdx = villagesWithDestinations.findIndex(v => v.id === clickedVillage!.id);
      const villageNumber = villageIdx >= 0 ? villageIdx + 1 : destinationNumber;
      
      const destinationNames = clickedVillage.destinations.map(d => d.destination_name);
      const hasMultipleDestinations = destinationNames.length > 1;
      
      setActiveVillage({ 
        id: clickedVillage.id,
        destinationName: hasMultipleDestinations 
          ? `Desa ${villageNumber}`
          : `Destinasi ${destinationNumber}`,
        villageName: `Desa ${villageNumber}`,
      });
    } else {
      // Not in database yet, but still show popup with basic info
      setActiveVillage({ 
        id: '', // Empty ID means no forecast data available
        destinationName, 
        villageName,
      });
    }
    
    setIsPlaying(false);
    setShowPopup(true);
  }, [villagesWithDestinations, destinations]);

  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    setTimeout(() => {
      setActiveVillage(null);
    }, 300);
  }, []);

  // Pull popup detail from cached forecasts
  // Allow popup to open even without forecast data (for mockup)
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

  // Memo for villages keyed by KDEPUM with MOCKUP destination and village names
  // Use destination index (1-49) for consistent numbering
  const villagesByKdepum = useMemo(() => {
    const result: Record<string, { 
      id: string; 
      destinationName: string; 
      villageName: string;
      destinations?: string[];
    }> = {};

    // Create a map of village_id to destination indices for consistent numbering
    const villageToDestIndices = new Map<string, number[]>();
    destinations.forEach((dest, idx) => {
      const indices = villageToDestIndices.get(dest.village_id) || [];
      indices.push(idx + 1); // 1-based index
      villageToDestIndices.set(dest.village_id, indices);
    });

    villagesWithDestinations.forEach((village) => {
      if (!village || !village.kdepum_code) return;
      
      const raw = village.kdepum_code.trim();
      const normalized = raw.replace(/\D/g, '');
      
      // Get destination indices for this village
      const destIndices = villageToDestIndices.get(village.id) || [];
      const firstDestIndex = destIndices[0] || 1;
      
      // Use first destination index for village name
      const mockupVillageName = `Desa ${firstDestIndex}`;
      
      // Map destinations to mockup names using their indices
      const destinationNames = (village.destinations || []).map((d) => {
        if (!d || !d.id) return `Destinasi ${firstDestIndex}`;
        const destIdx = destinations.findIndex(dest => dest.id === d.id);
        return `Destinasi ${destIdx >= 0 ? destIdx + 1 : firstDestIndex}`;
      });
      
      const entry = destinationNames.length > 1
        ? {
            id: village.id,
            destinationName: mockupVillageName,
            villageName: mockupVillageName,
            destinations: destinationNames,
          }
        : destinationNames.length === 1
        ? {
            id: village.id,
            destinationName: destinationNames[0],
            villageName: mockupVillageName,
          }
        : {
            id: village.id,
            destinationName: mockupVillageName,
            villageName: mockupVillageName,
          };

      result[raw] = entry;
      if (normalized && normalized !== raw) {
        result[normalized] = entry;
      }
      // Also add with spaces removed (in case of formatting differences)
      const noSpaces = raw.replace(/\s/g, '');
      if (noSpaces !== raw && noSpaces !== normalized) {
        result[noSpaces] = entry;
      }
    });

    return result;
  }, [villagesWithDestinations, destinations]);

  // Create modified destinations list with mockup names for sidebar
  // Number destinations sequentially 1-49
  const mockupDestinations = useMemo(() => {
    if (!destinations || destinations.length === 0) return [];
    
    return destinations.map((d, idx) => {
      if (!d) return null;
      
      // Find village index for this destination's village
      const villageIdx = villagesWithDestinations.findIndex(v => v && v.id === d.village_id);
      const villageNumber = villageIdx >= 0 ? villageIdx + 1 : idx + 1;
      
      return {
        id: d.id || `dest-${idx}`,
        village_id: d.village_id || '',
        destination_name: `Destinasi ${idx + 1}`, // Sequential 1-49
        village_name: `Desa ${villageNumber}`, // Based on village index
        kdepum_code: d.kdepum_code || '',
      };
    }).filter(Boolean) as Array<{
      id: string;
      village_id: string;
      destination_name: string;
      village_name: string;
      kdepum_code: string;
    }>;
  }, [destinations, villagesWithDestinations]);

  // Modified active village with mockup destination and village name
  const mockupActiveVillage = useMemo(() => {
    if (!activeVillage) return null;
    
    // Find destination index (1-49)
    const destIdx = destinations.findIndex(d => d && d.village_id === activeVillage.id);
    const destinationNumber = destIdx >= 0 ? destIdx + 1 : 1;
    
    // Find village index
    const villageIdx = villagesWithDestinations.findIndex(v => v && v.id === activeVillage.id);
    const villageNumber = villageIdx >= 0 ? villageIdx + 1 : destinationNumber;
    
    // Get destinations for this village to check if multiple
    const village = villagesWithDestinations.find(v => v && v.id === activeVillage.id);
    const hasMultipleDestinations = village && village.destinations && village.destinations.length > 1;
    
    return {
      ...activeVillage,
      destinationName: hasMultipleDestinations 
        ? `Desa ${villageNumber}`
        : `Destinasi ${destinationNumber}`,
      villageName: `Desa ${villageNumber}`,
      destinations: hasMultipleDestinations && village.destinations
        ? village.destinations.map((d, dIdx) => {
            if (!d || !d.id) return `Destinasi ${destinationNumber + dIdx}`;
            const destIndex = destinations.findIndex(dest => dest && dest.id === d.id);
            return `Destinasi ${destIndex >= 0 ? destIndex + 1 : destinationNumber + dIdx}`;
          })
        : undefined,
    };
  }, [activeVillage, destinations, villagesWithDestinations]);

  // Ensure component always renders, even if data is empty
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
        /* Keep choropleth polygons colorful - exclude from grayscale */
        /* Apply grayscale to leaflet panes but exclude interactive polygons */
        /* Note: We apply grayscale to specific panes, not all panes */
        /* Only apply grayscale to tile pane (map tiles), not overlay pane (polygons) */
        .wireframe .leaflet-tile-pane { filter: grayscale(1); }
        .wireframe .leaflet-tile-pane img { filter: grayscale(1) contrast(1.05); }
        /* Don't apply grayscale to overlay pane (where polygons are) */
        .wireframe .leaflet-overlay-pane { filter: none !important; }
        .wireframe .leaflet-overlay-pane * { filter: none !important; }
        /* Only apply grayscale to tile images, not all images in panes */
        .wireframe .leaflet-tile-container img { filter: grayscale(1) contrast(1.05) !important; }
        /* All polygons in overlay pane are already excluded from grayscale above */
        /* Additional safety: ensure all interactive elements keep colors */
        .wireframe .leaflet-interactive { filter: none !important; }
        .wireframe .leaflet-popup-content-wrapper,
        .wireframe .leaflet-popup-tip { background: #f8f9fb !important; border: 1px solid #111827 !important; }
        .wireframe .legend-item { border: 1px dashed #111827 !important; padding: 6px 8px !important; }
        .wireframe .legend-color { border: 1px solid #111827 !important; filter: grayscale(1) contrast(1.05); }
        /* Keep legend colors in PET legend - they represent the choropleth colors */
        .wireframe .map-control .legend-color { filter: none !important; }
        /* Keep popup PET display colors - they match choropleth */
        .wireframe .popup-pet-display { 
          border: 1px dashed #111827 !important; 
          filter: none !important; 
          /* Ensure background color is preserved */
          background-color: inherit !important;
        }
        .wireframe .popup-pet-display div, 
        .wireframe .popup-pet-display span, 
        .wireframe .popup-pet-display p { 
          color: inherit !important; 
          filter: none !important;
        }
        /* Ensure popup container doesn't apply grayscale to children */
        .wireframe .weather-popup { filter: none !important; }
        .wireframe .weather-popup * { filter: none !important; }
        .wireframe .leaflet-popup-content { color: #111827 !important; }
        .wireframe .leaflet-popup-content b { color: #111827 !important; }
        .wireframe .leaflet-marker-icon { filter: grayscale(1); }
        .wireframe .time-slider .bg-primary, .wireframe .time-slider .text-primary, .wireframe .time-slider .text-primary-foreground { background: transparent !important; color: #111827 !important; }
        .wireframe .time-slider .bg-secondary, .wireframe .time-slider .hover\:bg-secondary:hover { background: transparent !important; color: #111827 !important; }
        .wireframe .time-slider .rounded-full { border: 1px solid #111827 !important; }
        .wireframe .legend-item span { color: #111827 !important; }
        .wireframe .destination-item { border: 1px solid #111827 !important; background: transparent !important; }
        .wireframe .destination-item .w-3.h-3 { border: 1px solid #111827 !important; }
        /* Keep destination item colors - they match choropleth */
        .wireframe .destination-item .w-3.h-3 { filter: none !important; }
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
        highlightedKdepum={undefined}
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
        destinations={mockupDestinations}
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
                destinations={mockupActiveVillage.destinations}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mockup;
