import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PET_COLORS, classifyPet } from '@/lib/pet';
import type { PETStandard } from '@/lib/pet';

interface LeafletMapProps {
  selectedTime: string;
  petStandard: PETStandard;
  onVillageClick: (villageId: string, destinationName: string, villageName: string) => void;
  highlightedVillage?: string | null;
  highlightedKdepum?: string | null; // kdepum_code for highlighting all polygons with same kdepum
  villagesByKdepum: Record<string, { 
    id: string; 
    destinationName: string; 
    villageName: string;
    destinations?: string[]; // List of all destination names for villages with multiple destinations
  }>;
  choropleth: Map<string, { pet_value: number }>;
}

const BALI_CENTER: [number, number] = [-8.4095, 115.1889];
const BALI_ZOOM = 10;
const GEOJSON_PATH = `${import.meta.env.BASE_URL}data/destinasi_wisata_bali.geojson`;
// Batasi panning/scroll ke area Bali dengan toleransi kecil.
const BALI_BOUNDS: L.LatLngBoundsExpression = [
  [-9.30, 114.30], // south-west
  [-7.30, 115.70], // north-east
];
// Normalisasi KDEPUM
const normalizeKdepum = (value?: string | null) => value?.replace(/\D/g, '').trim() || null;

export default function LeafletMap({ selectedTime, petStandard, onVillageClick, highlightedVillage, highlightedKdepum, villagesByKdepum, choropleth }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [forecastData, setForecastData] = useState<Map<string, { pet_value: number }>>(new Map());
  const hasFittedBounds = useRef(false);

  useEffect(() => {
    fetch(GEOJSON_PATH)
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoJsonData(data);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  useEffect(() => {
    setForecastData(choropleth);
  }, [choropleth]);

  // Ambil info desa dari feature KDEPUM
  const getVillageInfo = useCallback((feature: GeoJSON.Feature): { 
    id: string; 
    destinationName: string; 
    villageName: string;
    destinations?: string[];
  } | null => {
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

  const getVillageDisplayName = useCallback((feature: GeoJSON.Feature): string => {
    const props = feature.properties || {};
    const info = getVillageInfo(feature);
    if (info) {
      if (info.destinations && info.destinations.length > 1) {
        return `${info.villageName}\n${info.destinations.map(d => `• ${d}`).join('\n')}`;
      }
      return info.destinationName;
    }
    return props.WADMKD || props.NAMOBJ || props.DESA || props.KELURAHAN || props.NAMA || 'Unknown';
  }, [getVillageInfo]);

  // Validasi apakah feature memiliki KDEPUM
  const isDestination = useCallback((feature: GeoJSON.Feature): boolean => {
    const props = feature.properties || {};
    const raw: string | undefined = props.KDEPUM || props.kdepum || props.kdepum_code;
    return raw !== undefined && raw !== null && raw.trim() !== '';
  }, []);

  const getStyle = useCallback((feature: GeoJSON.Feature | undefined): L.PathOptions => {
    if (!feature) return { fillColor: '#cccccc', weight: 1, color: '#999999', fillOpacity: 0.3 };

    const villageId = getVillageId(feature);
    const props = feature.properties || {};
    const rawKdepum: string | undefined = props.KDEPUM || props.kdepum || props.kdepum_code;
    const normalizedKdepum = rawKdepum ? rawKdepum.replace(/\D/g, '') : null;
    
    // Highlight jika ID atau kdepum cocok
    const isHighlighted = highlightedVillage === villageId || 
      (highlightedKdepum && (
        (rawKdepum && rawKdepum.trim() === highlightedKdepum.trim()) ||
        (normalizedKdepum && normalizedKdepum === highlightedKdepum.replace(/\D/g, ''))
      ));
    
    // Tampilkan abu-abu jika destinasi belum terdaftar di DB
    if (!villageId && rawKdepum) {
      return {
        fillColor: '#9ca3af', // grey-400
        weight: isHighlighted ? 3 : 2,
        color: isHighlighted ? '#111827' : '#6b7280', // grey-500
        fillOpacity: isHighlighted ? 0.6 : 0.5,
        opacity: 1,
      };
    }
    
    // If no KDEPUM at all, it's not a destination polygon
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
    
    // Tampilkan abu-abu jika data prakiraan belum ada
    if (!forecast) {
      return {
        fillColor: '#9ca3af', // grey-400
        weight: isHighlighted ? 3 : 2,
        color: isHighlighted ? '#111827' : '#6b7280', // grey-500
        fillOpacity: isHighlighted ? 0.6 : 0.5,
        opacity: 1,
      };
    }

    const category = classifyPet(forecast.pet_value, petStandard);
    const fillColor = PET_COLORS[category];

    return {
      fillColor,
      weight: isHighlighted ? 3 : 2,
      color: isHighlighted ? '#111827' : '#111827',
      fillOpacity: isHighlighted ? 0.9 : 0.75,
      opacity: 1,
    };
  }, [forecastData, highlightedVillage, highlightedKdepum, getVillageId, petStandard]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: BALI_CENTER,
      zoom: BALI_ZOOM,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: BALI_BOUNDS,
      maxBoundsViscosity: 0.9,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
      crossOrigin: true,
    }).addTo(map.current);

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
        const info = getVillageInfo(feature);
        const isDest = isDestination(feature);
        const props = feature.properties || {};
        const villageNameFromGeoJSON = props.WADMKD || props.NAMOBJ || props.DESA || props.KELURAHAN || 'Unknown';

        if (isDest) {
          const forecast = villageId ? forecastData.get(villageId) : undefined;
          const hasData = forecast !== undefined;
          
          if (info && villageId) {
            const tooltipText = info.destinations && info.destinations.length > 1
              ? `${info.villageName}<br/><small>${info.destinations.map(d => `• ${d}`).join('<br/>')}</small>${!hasData ? '<br/><small style="color: #9ca3af;">(Data belum tersedia)</small>' : ''}`
              : `${info.destinationName}${!hasData ? '<br/><small style="color: #9ca3af;">(Data belum tersedia)</small>' : ''}`;
            
            layer.bindTooltip(tooltipText, {
              permanent: false,
              direction: 'center',
              className: 'bg-card text-card-foreground px-2 py-1 rounded-lg shadow-lg text-sm font-medium border border-border',
            });

            layer.on('click', () => {
              const displayName = info.destinations && info.destinations.length > 1
                ? info.villageName
                : info.destinationName;
              onVillageClick(villageId, displayName, info.villageName);
            });
          } else {
            const tooltipText = `${villageNameFromGeoJSON}<br/><small style="color: #9ca3af;">(Data belum tersedia)</small>`;
            
            layer.bindTooltip(tooltipText, {
              permanent: false,
              direction: 'center',
              className: 'bg-card text-card-foreground px-2 py-1 rounded-lg shadow-lg text-sm font-medium border border-border',
            });

            layer.on('click', () => {
              onVillageClick('', villageNameFromGeoJSON, villageNameFromGeoJSON);
            });
          }

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

    if (!hasFittedBounds.current) {
      const destinationBounds = L.latLngBounds([]);
      geoJsonData.features.forEach((feature) => {
        if (isDestination(feature) && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
          const layer = L.geoJSON(feature);
          destinationBounds.extend(layer.getBounds());
        }
      });
      
      if (destinationBounds.isValid()) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
          map.current.setView(BALI_CENTER, 9.5);
        } else {
          map.current.fitBounds(destinationBounds, {
            padding: [50, 50],
          });
        }
        hasFittedBounds.current = true;
      }
    }
  }, [geoJsonData, getStyle, getVillageId, onVillageClick, isDestination, getVillageInfo, villagesByKdepum, forecastData]);

  useEffect(() => {
    if (geoJsonLayer.current && geoJsonData) {
      geoJsonLayer.current.setStyle((feature) => getStyle(feature as GeoJSON.Feature));
    }
  }, [forecastData, highlightedVillage, geoJsonData, getStyle, petStandard]);

  return (
    <div ref={mapContainer} className="absolute inset-0 z-0" />
  );
}
