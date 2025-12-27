import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PET_COLORS, PET_RANGES, PETStandard } from '@/data/dummyData';

interface LeafletMapProps {
  selectedTime: string;
  petStandard: PETStandard;
  onVillageClick: (villageId: string, destinationName: string, villageName: string) => void;
  highlightedVillage?: string | null;
  villagesByKdepum: Record<string, { id: string; destinationName: string; villageName: string }>;
  choropleth: Map<string, { pet_value: number }>;
}

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];
const BALI_ZOOM = 10;
const GEOJSON_PATH = `${import.meta.env.BASE_URL}data/destinasi_wisata_bali.geojson`;
// Strip any non-digit separators so both "51.03.05.1004" and "5103051004" match
const normalizeKdepum = (value?: string | null) => value?.replace(/\D/g, '').trim() || null;

export default function LeafletMap({ selectedTime, petStandard, onVillageClick, highlightedVillage, villagesByKdepum, choropleth }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [forecastData, setForecastData] = useState<Map<string, { pet_value: number }>>(new Map());

  // Load GeoJSON
  useEffect(() => {
    fetch(GEOJSON_PATH)
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoJsonData(data);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Update forecast data when choropleth changes
  useEffect(() => {
    setForecastData(choropleth);
  }, [choropleth]);

  // Get village info from feature using KDEPUM (normalized)
  const getVillageInfo = useCallback((feature: GeoJSON.Feature): { id: string; destinationName: string; villageName: string } | null => {
    const props = feature.properties || {};
    const raw: string | undefined = props.KDEPUM || props.kdepum || props.kdepum_code;
    const fallback: string | undefined = props.KDCPUM || props.KDCBPS || props.KDBBPS;
    const normalized = normalizeKdepum(raw);
    const normalizedFallback = normalizeKdepum(fallback);

    if (normalized && villagesByKdepum[normalized]) return villagesByKdepum[normalized];
    if (raw && villagesByKdepum[raw]) return villagesByKdepum[raw];
    if (normalizedFallback && villagesByKdepum[normalizedFallback]) return villagesByKdepum[normalizedFallback];
    if (fallback && villagesByKdepum[fallback]) return villagesByKdepum[fallback];

    return null;
  }, [villagesByKdepum]);

  const getVillageId = useCallback((feature: GeoJSON.Feature): string | null => {
    const info = getVillageInfo(feature);
    return info?.id ?? null;
  }, [getVillageInfo]);

  // Get village name from feature
  const getVillageName = useCallback((feature: GeoJSON.Feature): string => {
    const props = feature.properties || {};
    const info = getVillageInfo(feature);
    if (info) return info.destinationName;
    return props.WADMKD || props.NAMOBJ || props.DESA || props.KELURAHAN || props.NAMA || 'Unknown';
  }, [getVillageInfo]);

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

    const forecast = villageId ? forecastData.get(villageId) : undefined;
    
    if (!forecast) {
      return { fillColor: '#cccccc', weight: 2, color: '#ffffff', fillOpacity: 0.7 };
    }

    // Compute category based on PET standard
    const ranges = PET_RANGES[petStandard];
    let category: string = 'neutral';
    const pet = forecast.pet_value;
    for (const [key, range] of Object.entries(ranges)) {
      if (pet >= range.min && pet < range.max) {
        category = key;
        break;
      }
    }
    const fillColor = PET_COLORS[category as keyof typeof PET_COLORS];

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
        const info = getVillageInfo(feature);
        const isDest = isDestination(feature);

        if (isDest && villageId && info) {
          // Tooltip on hover
          layer.bindTooltip(info.destinationName, {
            permanent: false,
            direction: 'center',
            className: 'bg-card text-card-foreground px-2 py-1 rounded-lg shadow-lg text-sm font-medium border border-border',
          });

          // Click handler
          layer.on('click', () => {
            onVillageClick(villageId, info.destinationName, info.villageName);
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
      if (isDestination(feature) && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        const layer = L.geoJSON(feature);
        destinationBounds.extend(layer.getBounds());
      }
    });
    
    if (destinationBounds.isValid()) {
      map.current.fitBounds(destinationBounds, { padding: [50, 50] });
    }
  }, [geoJsonData, getStyle, getVillageName, getVillageId, onVillageClick, isDestination, getVillageInfo]);

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
