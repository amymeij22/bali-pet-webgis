import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  PET_COLORS, 
  ThermalCategory, 
  WeatherForecast, 
  getForecastsByTime,
  VILLAGES,
  VILLAGE_KDEPUM_MAP,
  PETStandard,
  getThermalCategory,
} from '@/data/dummyData';

interface LeafletMapProps {
  selectedTime: string;
  petStandard: PETStandard;
  onVillageClick: (villageId: string, villageName: string) => void;
  highlightedVillage?: string | null;
}

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];
const BALI_ZOOM = 10;

export default function LeafletMap({ selectedTime, petStandard, onVillageClick, highlightedVillage }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [forecastData, setForecastData] = useState<Map<string, WeatherForecast>>(new Map());

  // Load GeoJSON
  useEffect(() => {
    fetch('/data/destinasi_wisata_bali.geojson')
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoJsonData(data);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Update forecast data when time changes
  useEffect(() => {
    if (selectedTime) {
      setForecastData(getForecastsByTime(selectedTime));
    }
  }, [selectedTime]);

  // Get village ID from feature using KDEPUM (normalized without dots)
  const getVillageId = useCallback((feature: GeoJSON.Feature): string | null => {
    const props = feature.properties || {};
    // Use KDEPUM and normalize (remove dots)
    const kdepum = props.KDEPUM || props.kdepum;
    if (kdepum) {
      const normalizedId = kdepum.replace(/\./g, '');
      if (VILLAGE_KDEPUM_MAP[normalizedId]) {
        return normalizedId;
      }
    }
    return null;
  }, []);

  // Get village name from feature
  const getVillageName = useCallback((feature: GeoJSON.Feature): string => {
    const villageId = getVillageId(feature);
    if (villageId && VILLAGE_KDEPUM_MAP[villageId]) {
      return VILLAGE_KDEPUM_MAP[villageId];
    }
    
    const props = feature.properties || {};
    return props.WADMKD || props.NAMOBJ || props.DESA || props.KELURAHAN || props.NAMA || 'Unknown';
  }, [getVillageId]);

  // Check if feature is a destination
  const isDestination = useCallback((feature: GeoJSON.Feature): boolean => {
    const villageId = getVillageId(feature);
    return villageId !== null;
  }, [getVillageId]);

  // Style function for GeoJSON layer
  const getStyle = useCallback((feature: GeoJSON.Feature | undefined): L.PathOptions => {
    if (!feature) return { fillColor: '#cccccc', weight: 1, color: '#999999', fillOpacity: 0.3 };

    const villageId = getVillageId(feature);
    const isHighlighted = highlightedVillage === villageId;
    
    // Only style destination polygons with PET colors
    if (!villageId) {
      return {
        fillColor: '#e5e5e5',
        weight: 1,
        color: '#cccccc',
        fillOpacity: 0.2,
        opacity: 0.5,
      };
    }

    const forecast = forecastData.get(villageId);
    
    if (!forecast) {
      return { fillColor: '#cccccc', weight: 2, color: '#ffffff', fillOpacity: 0.7 };
    }

    // Get category based on current PET standard
    const category = getThermalCategory(forecast, petStandard);
    const fillColor = PET_COLORS[category];

    return {
      fillColor,
      weight: isHighlighted ? 3 : 2,
      color: isHighlighted ? '#1e3a5f' : '#ffffff',
      fillOpacity: isHighlighted ? 0.9 : 0.75,
      opacity: 1,
    };
  }, [forecastData, highlightedVillage, getVillageId, petStandard]);

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
        const villageId = getVillageId(feature);
        const villageName = getVillageName(feature);
        const isDest = isDestination(feature);

        if (isDest && villageId) {
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
        }
      },
    }).addTo(map.current);

    // Fit bounds to destinations only
    const destinationBounds = L.latLngBounds([]);
    geoJsonData.features.forEach((feature) => {
      if (isDestination(feature) && feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const layer = L.geoJSON(feature);
        destinationBounds.extend(layer.getBounds());
      }
    });
    
    if (destinationBounds.isValid()) {
      map.current.fitBounds(destinationBounds, { padding: [50, 50] });
    }
  }, [geoJsonData, getStyle, getVillageName, getVillageId, onVillageClick, isDestination]);

  // Update styles when forecast data, highlight, or PET standard changes
  useEffect(() => {
    if (geoJsonLayer.current && geoJsonData) {
      geoJsonLayer.current.setStyle((feature) => getStyle(feature as GeoJSON.Feature));
    }
  }, [forecastData, highlightedVillage, geoJsonData, getStyle, petStandard]);

  return (
    <div ref={mapContainer} className="absolute inset-0 z-0" />
  );
}
