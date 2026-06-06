import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import LeafletMap from '@/components/map/LeafletMap';
import DestinationSidebar from '@/components/sidebar/DestinationSidebar';
import PETLegend from '@/components/controls/PETLegend';
import TimeSlider from '@/components/controls/TimeSlider';
import WeatherPopup from '@/components/popup/WeatherPopup';
import MapHeader from '@/components/header/MapHeader';
import DataSourceCard from '@/components/controls/DataSourceCard';
import type { PETStandard } from '@/lib/pet';
import { 
  getLatestBatch, 
  getDestinationsWithVillage, 
  getAllForecastsForBatch, 
  WeatherForecast, 
  ForecastBatch,
  VillageWithDestinations,
} from '@/data/supabaseQueries';
import { useBatchMonitor } from '@/hooks/useBatchMonitor';
import { buildSliderTimes, nearestForecast } from '@/lib/forecastTime';

const Index = () => {
  const reduceMotion = useReducedMotion();
  // State
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [petStandard, setPetStandard] = useState<PETStandard>('tropical');
  const [activeVillage, setActiveVillage] = useState<
    {
      id: string;
      villageName: string;
      destinations?: Array<{ id: string; name: string; imageUrl?: string | null }>;
      district?: string | null;
      regency?: string | null;
      selectedDestinationId?: string;
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
  const [forecastListsByDestination, setForecastListsByDestination] = useState<Map<string, WeatherForecast[]>>(new Map());
  const [destinationChoropleth, setDestinationChoropleth] = useState<Map<string, { pet_value: number }>>(new Map());
  const [choropleth, setChoropleth] = useState<Map<string, { pet_value: number }>>(new Map()); // per village_id (untuk peta)
  const [popupForecast, setPopupForecast] = useState<null | WeatherForecast>(null);

  // Guard untuk mencegah race condition (request lama menimpa state batch terbaru)
  const loadSeqRef = useRef(0);

  const resetDynamicState = useCallback(() => {
    setTimes([]);
    setSelectedTime('');
    setProducedAt(null);
    setForecastListsByDestination(new Map());
    setDestinationChoropleth(new Map());
    setChoropleth(new Map());
    setPopupForecast(null);
  }, []);

  const loadBatchForecasts = useCallback(
    async (batch: ForecastBatch) => {
      const seq = ++loadSeqRef.current;

      // Set batch id segera agar monitor tidak re-trigger untuk batch yang sama
      setCurrentBatchId(batch.id);

      // Reset cache dinamis sebelum fetch (best practice: selalu rebuild dari latest batch)
      resetDynamicState();

      try {
        const allForecasts = await getAllForecastsForBatch(batch.id);
        if (seq !== loadSeqRef.current) return; // hasil request lama, abaikan

        setProducedAt(batch.produced_at);

        const sortedTimes = buildSliderTimes(allForecasts);
        setTimes(sortedTimes);
        setSelectedTime(sortedTimes[0] ?? '');

        const lists = new Map<string, WeatherForecast[]>();
        allForecasts.forEach((f) => {
          const arr = lists.get(f.destination_id) ?? [];
          arr.push(f);
          lists.set(f.destination_id, arr);
        });
        lists.forEach((arr, did) => {
          arr.sort((a, b) => new Date(a.forecast_time).getTime() - new Date(b.forecast_time).getTime());
          lists.set(did, arr);
        });
        setForecastListsByDestination(lists);
      } catch (err) {
        if (seq !== loadSeqRef.current) return;
        // eslint-disable-next-line no-console
        console.error('[Index] Failed to load batch forecasts:', err);
        // Tetap biarkan master data (destinations) tampil, dynamic kosong.
      }
    },
    [resetDynamicState]
  );

  // ---------------------------------------------------------------------------
  // Init: load destinations + batch saat pertama buka
  // SW akan otomatis serve data dari cache jika offline
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        // Load destinations (SW akan serve dari API cache jika offline)
        const dests = await getDestinationsWithVillage();
        setDestinations(dests);

        // Prefetch destination images in the background if online
        if (navigator.onLine && dests && dests.length > 0) {
          setTimeout(() => {
            console.log('[Index] Prefetching destination images for offline cache...');
            dests.forEach((d) => {
              if (d.image_url) {
                fetch(d.image_url, { mode: 'cors' }).catch(() => {});
              }
            });
          }, 3000);
        }

        const grouped: Record<string, any> = {};
        dests.forEach((d: any) => {
          const vid = d.village_id;
          if (!grouped[vid]) {
            grouped[vid] = {
              id: vid,
              village_name: d.village_name,
              kdepum_code: d.kdepum_code,
              regency: d.regency ?? null,
              district: d.district ?? null,
              destinations: [],
            };
          }
          grouped[vid].destinations.push({
            id: d.id,
            village_id: vid,
            destination_name: d.destination_name,
            image_url: d.image_url ?? null,
            latitude: d.latitude ?? null,
            longitude: d.longitude ?? null,
            sea_level_height: d.sea_level_height ?? null,
          });
        });
        setVillagesWithDestinations(Object.values(grouped));

        const latest = await getLatestBatch();
        if (latest) {
          await loadBatchForecasts(latest);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Index] Failed to init data:', err);
        // Jika offline & SW belum cache → destinations kosong, app tetap jalan (peta muncul)
      }
    })();
  }, [loadBatchForecasts]);

  // ---------------------------------------------------------------------------
  // Online / Offline detection
  // Saat kembali online → langsung fetch data terbaru dari Supabase
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Index] Back online – refreshing data from Supabase...');
      try {
        // Fetch latest batch – jika ada yang lebih baru dari yang sedang ditampilkan,
        // loadBatchForecasts akan memperbarui seluruh state UI secara otomatis
        const latest = await getLatestBatch();
        if (latest && latest.id !== currentBatchId) {
          console.log('[Index] New batch found on reconnect:', latest.id);
          await loadBatchForecasts(latest);
        }
      } catch (err) {
        console.error('[Index] Failed to refresh after reconnect:', err);
      }
    };

    const handleOffline = () => {
      console.log('[Index] Went offline – serving cached data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentBatchId, loadBatchForecasts]);

  // Handle new batch detected via Supabase Realtime
  const handleNewBatch = useCallback(async (batch: ForecastBatch) => {
    console.log('[Index] New batch detected, reloading data...', batch.id);
    await loadBatchForecasts(batch);
  }, [loadBatchForecasts]);

  // Monitor for new batches (triggers push notification)
  useBatchMonitor(currentBatchId, handleNewBatch);

  // Derive choropleth (destinasi + peta per-desa) dengan strategi nearest-time per destinasi
  useEffect(() => {
    if (!selectedTime) return;
    if (!forecastListsByDestination || forecastListsByDestination.size === 0) {
      setDestinationChoropleth(new Map());
      setChoropleth(new Map());
      return;
    }

    // 1) per destinasi: nearest-time
    const destMap = new Map<string, { pet_value: number }>();
    forecastListsByDestination.forEach((list, did) => {
      const nf = nearestForecast(list, selectedTime);
      if (nf) destMap.set(did, { pet_value: nf.pet_value });
    });
    setDestinationChoropleth(destMap);

    // 2) per desa/polygon: ambil yang paling panas (max) dari destinasi dalam desa tsb
    const villageMap = new Map<string, { pet_value: number }>();
    villagesWithDestinations.forEach((v) => {
      let maxPet: number | null = null;
      v.destinations.forEach((d) => {
        const pv = destMap.get(d.id)?.pet_value;
        if (typeof pv === 'number' && Number.isFinite(pv)) {
          if (maxPet === null || pv > maxPet) maxPet = pv;
        }
      });
      if (maxPet !== null) villageMap.set(v.id, { pet_value: maxPet });
    });
    setChoropleth(villageMap);
  }, [forecastListsByDestination, selectedTime, villagesWithDestinations]);

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
      const dests = clickedVillage.destinations.map((d: any) => ({
        id: d.id,
        name: d.destination_name,
        imageUrl: d.image_url ?? null,
      }));
      const selectedObj =
        dests.find((d) => d.name === destinationName) ?? dests[0] ?? null;

      setActiveVillage({ 
        id: clickedVillage.id, // Use database village ID
        villageName: clickedVillage.village_name,
        // Selalu simpan list destinasi agar popup bisa ambil image_url dari DB,
        // dropdown tetap hanya muncul jika length > 1.
        destinations: dests,
        district: (clickedVillage as any).district ?? null,
        regency: (clickedVillage as any).regency ?? null,
        selectedDestinationId: selectedObj?.id,
        kdepumCode: clickedVillage.kdepum_code,
      });
    } else {
      // Not in database yet, but still show popup with basic info
      setActiveVillage({ 
        id: '', // Empty ID means no forecast data available
        villageName,
        selectedDestinationId: undefined,
        kdepumCode: undefined,
      });
    }
    
    setIsPlaying(false); // pause slider when popup opens
    setShowPopup(true);
  }, [villagesWithDestinations]);

  const handleDestinationChangeInPopup = useCallback((destinationId: string) => {
    setActiveVillage((prev) => {
      if (!prev) return prev;
      return { ...prev, selectedDestinationId: destinationId };
    });
  }, []);

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
    
    // If no selectedTime or no destination selection, set forecast to null
    if (!selectedTime || !activeVillage.selectedDestinationId) {
      setPopupForecast(null);
      return;
    }

    const list = forecastListsByDestination.get(activeVillage.selectedDestinationId) ?? [];
    const detail = nearestForecast(list, selectedTime);
    setPopupForecast(detail ?? null);
  }, [showPopup, activeVillage, selectedTime, forecastListsByDestination]);

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
        activeDestinationId={activeVillage?.selectedDestinationId ?? null}
        destinations={destinations}
        destinationChoropleth={destinationChoropleth}
      />

      {/* Right Panel - PET Legend & Standard Selector */}
      <div
        className={showPopup ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}
        aria-hidden={showPopup ? true : undefined}
      >
        <PETLegend
          standard={petStandard}
          onStandardChange={handleStandardChange}
        />
      </div>

      {/* Bottom - Time Slider - Always visible */}
      <div
        className={showPopup ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}
        aria-hidden={showPopup ? true : undefined}
      >
        <TimeSlider
          selectedTime={selectedTime}
          times={times}
          producedAt={producedAt}
          isPlaying={isPlaying}
          onPlayChange={setIsPlaying}
          onTimeChange={handleTimeChange}
        />
      </div>

      {/* Data Source Card */}
      <div
        className={showPopup ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}
        aria-hidden={showPopup ? true : undefined}
      >
        <DataSourceCard />
      </div>

      {/* Weather Popup */}
      <AnimatePresence>
        {showPopup && activeVillage && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
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
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => handlePopupClose()}
            />

            {/* Popup */}
            <div className="relative z-10">
              <WeatherPopup
                destinationName={
                  activeVillage.destinations?.find((d) => d.id === activeVillage.selectedDestinationId)?.name ??
                  activeVillage.destinations?.[0]?.name ??
                  activeVillage.villageName
                }
                heroImageUrl={
                  activeVillage.destinations?.find((d) => d.id === activeVillage.selectedDestinationId)?.imageUrl ??
                  activeVillage.destinations?.[0]?.imageUrl ??
                  null
                }
                villageName={activeVillage.villageName}
                district={activeVillage.district}
                regency={activeVillage.regency}
                villageId={activeVillage.id}
                forecast={popupForecast}
                currentTime={selectedTime}
                times={times}
                standard={petStandard}
                onClose={handlePopupClose}
                onTimeChange={handleTimeChange}
                destinations={activeVillage.destinations}
                selectedDestinationId={activeVillage.selectedDestinationId}
                onDestinationChange={handleDestinationChangeInPopup}
                forecastList={activeVillage.selectedDestinationId ? forecastListsByDestination.get(activeVillage.selectedDestinationId) : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
