import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LeafletMap from '@/components/map/LeafletMap';
import DestinationSidebar from '@/components/sidebar/DestinationSidebar';
import PETLegend from '@/components/controls/PETLegend';
import TimeSlider from '@/components/controls/TimeSlider';
import WeatherPopup from '@/components/popup/WeatherPopup';
import MapHeader from '@/components/header/MapHeader';
import { FORECAST_TIMES, PETStandard, getForecast, VILLAGES } from '@/data/dummyData';

const Index = () => {
  // State
  const [selectedTime, setSelectedTime] = useState<string>(FORECAST_TIMES[0]);
  const [petStandard, setPetStandard] = useState<PETStandard>('tropical');
  const [activeVillage, setActiveVillage] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Handlers
  const handleTimeChange = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const handleStandardChange = useCallback((standard: PETStandard) => {
    setPetStandard(standard);
  }, []);

  const handleVillageClick = useCallback((villageId: string, villageName: string) => {
    setActiveVillage({ id: villageId, name: villageName });
    setShowPopup(true);
  }, []);

  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    // Keep activeVillage for highlight, clear after animation
    setTimeout(() => {
      setActiveVillage(null);
    }, 300);
  }, []);

  // Get current forecast for popup
  const currentForecast = activeVillage
    ? getForecast(activeVillage.id, selectedTime)
    : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Full-bleed Map */}
      <LeafletMap
        selectedTime={selectedTime}
        onVillageClick={handleVillageClick}
        highlightedVillage={activeVillage?.id}
      />

      {/* Header */}
      <MapHeader />

      {/* Left Sidebar - Destination List */}
      <DestinationSidebar
        selectedTime={selectedTime}
        onDestinationClick={handleVillageClick}
        activeVillage={activeVillage?.id}
      />

      {/* Right Panel - PET Legend & Standard Selector */}
      <PETLegend
        standard={petStandard}
        onStandardChange={handleStandardChange}
      />

      {/* Bottom - Time Slider */}
      <TimeSlider
        selectedTime={selectedTime}
        onTimeChange={handleTimeChange}
      />

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
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            />

            {/* Popup */}
            <div className="relative z-10">
              <WeatherPopup
                villageName={activeVillage.name}
                villageId={activeVillage.id}
                forecast={currentForecast || null}
                currentTime={selectedTime}
                standard={petStandard}
                onClose={handlePopupClose}
                onTimeChange={handleTimeChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 right-4 z-10"
      >
        <div className="glass-panel rounded-lg px-2 py-1 text-[10px] text-muted-foreground">
          BMKG × STMKG
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
