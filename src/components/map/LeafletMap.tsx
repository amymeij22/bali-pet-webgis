import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  PET_COLORS, 
  ThermalCategory, 
  WeatherForecast, 
  getForecastsByTime,
  VILLAGES,
  getVillageIdByName 
} from '@/data/dummyData';

interface LeafletMapProps {
  selectedTime: string;
  onVillageClick: (villageId: string, villageName: string) => void;
  highlightedVillage?: string | null;
}

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];
const BALI_ZOOM = 10;

export default function LeafletMap({ selectedTime, onVillageClick, highlightedVillage }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [forecastData, setForecastData] = useState<Map<string, WeatherForecast>>(new Map());

  // Load GeoJSON and add index-based IDs
  useEffect(() => {
    fetch('/data/destinasi_wisata_bali.geojson')
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        // Add index as ID to each feature for matching with dummy data
        const processedData = {
          ...data,
          features: data.features.map((feature, index) => ({
            ...feature,
            properties: {
              ...feature.properties,
              _index: index.toString(),
              _village_id: index.toString(),
            }
          }))
        };
        setGeoJsonData(processedData);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Update forecast data when time changes
  useEffect(() => {
    if (selectedTime) {
      setForecastData(getForecastsByTime(selectedTime));
    }
  }, [selectedTime]);

  // Get village ID from feature (using index)
  const getVillageId = useCallback((feature: GeoJSON.Feature): string => {
    const props = feature.properties || {};
    return props._village_id || props._index || '0';
  }, []);

  // Get village name from feature or use village data
  const getVillageName = useCallback((feature: GeoJSON.Feature): string => {
    const villageId = getVillageId(feature);
    const village = VILLAGES.find(v => v.id === villageId);
    if (village) return village.village_name;
    
    const props = feature.properties || {};
    return props.NAMA || props.nama || props.name || props.NAME || 
           props.village_name || props.DESA || `Destinasi ${parseInt(villageId) + 1}`;
  }, [getVillageId]);

  // Style function for GeoJSON layer
  const getStyle = useCallback((feature: GeoJSON.Feature | undefined): L.PathOptions => {
    if (!feature) return { fillColor: '#cccccc', weight: 2, color: '#ffffff', fillOpacity: 0.7 };

    const villageId = getVillageId(feature);
    const forecast = forecastData.get(villageId);
    const isHighlighted = highlightedVillage === villageId;

    const fillColor = forecast ? PET_COLORS[forecast.thermal_category as ThermalCategory] : '#cccccc';

    return {
      fillColor,
      weight: isHighlighted ? 3 : 2,
      color: isHighlighted ? '#1e3a5f' : '#ffffff',
      fillOpacity: isHighlighted ? 0.9 : 0.75,
      opacity: 1,
    };
  }, [forecastData, highlightedVillage, getVillageId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: BALI_CENTER,
      zoom: BALI_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // Add OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map.current);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add/Update GeoJSON layer
  useEffect(() => {
    if (!map.current || !geoJsonData) return;

    // Remove existing layer
    if (geoJsonLayer.current) {
      map.current.removeLayer(geoJsonLayer.current);
    }

    // Create new layer
    geoJsonLayer.current = L.geoJSON(geoJsonData, {
      style: getStyle,
      onEachFeature: (feature, layer) => {
        const villageName = getVillageName(feature);
        const villageId = getVillageId(feature);

        // Tooltip on hover
        layer.bindTooltip(villageName, {
          permanent: false,
          direction: 'center',
          className: 'bg-card text-card-foreground px-2 py-1 rounded-lg shadow-lg text-sm font-medium border border-border',
        });

        // Click handler
        layer.on('click', () => {
          onVillageClick(villageId, villageName);
        });

        // Hover effects
        layer.on('mouseover', (e) => {
          const target = e.target as L.Path;
          target.setStyle({
            weight: 3,
            color: '#1e3a5f',
            fillOpacity: 0.9,
          });
          target.bringToFront();
        });

        layer.on('mouseout', (e) => {
          if (geoJsonLayer.current) {
            geoJsonLayer.current.resetStyle(e.target);
          }
        });
      },
    }).addTo(map.current);

    // Fit bounds to GeoJSON
    const bounds = geoJsonLayer.current.getBounds();
    if (bounds.isValid()) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geoJsonData, getStyle, getVillageName, getVillageId, onVillageClick]);

  // Update styles when forecast data or highlight changes
  useEffect(() => {
    if (geoJsonLayer.current && geoJsonData) {
      geoJsonLayer.current.setStyle((feature) => getStyle(feature as GeoJSON.Feature));
    }
  }, [forecastData, highlightedVillage, geoJsonData, getStyle]);

  return (
    <div ref={mapContainer} className="absolute inset-0 z-0" />
  );
}
