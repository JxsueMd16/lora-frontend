// src/map/MapView.jsx
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Controls from './Controls';
import {
  calculateFloodZones,
  getActiveFloodZone,
  calculateRiskStats,
  getFloodColor
} from '../lib/sim';

export default function MapView() {
  const [aoi, setAoi] = useState(null);
  const [river, setRiver] = useState(null);
  const [houses, setHouses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waterLevel, setWaterLevel] = useState(0);

  // Cargar GeoJSON de /public/data
  useEffect(() => {
    let ok = true;
    async function load() {
      try {
        const [a, r, h] = await Promise.all([
          fetch('/data/aoi.geojson').then(r => r.json()),
          fetch('/data/river.geojson').then(r => r.json()),
          fetch('/data/houses.geojson').then(r => r.json()),
        ]);
        if (!ok) return;
        setAoi(a);
        setRiver(r);
        setHouses(h);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        if (ok) setLoading(false);
      }
    }
    load();
    return () => { ok = false; };
  }, []);

  // Definir niveles de inundación (ajustados)
  const floodLevels = useMemo(() => [
    { level: 0, width: 3 },     // Normal - 3m buffer (mínimo)
    { level: 1, width: 25 },    // Alerta - 25m buffer
    { level: 2, width: 50 },    // Evacuación - 50m buffer
    { level: 3, width: 85 },    // Crítico - 85m buffer
    { level: 4, width: 120 }    // Crítico externo - 120m buffer
  ], []);

  // Calcular todas las zonas de inundación
  const floodZones = useMemo(() => {
    if (!river) return [];
    return calculateFloodZones(aoi, river, floodLevels);
  }, [aoi, river, floodLevels]);

  // Obtener zona activa según nivel del agua
  const activeZone = useMemo(() => {
    return getActiveFloodZone(floodZones, waterLevel);
  }, [floodZones, waterLevel]);

  // Calcular estadísticas de casas afectadas
  const stats = useMemo(() => {
    if (!houses || floodZones.length === 0) {
      return { zone1: 0, zone2: 0, zone3: 0 };
    }
    return calculateRiskStats(houses, floodZones, waterLevel);
  }, [houses, floodZones, waterLevel]);

  // Color dinámico de la zona inundada
  const floodColor = useMemo(() => {
    return getFloodColor(waterLevel);
  }, [waterLevel]);

  if (loading) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center',
        color: '#94a3b8' 
      }}>
        Cargando mapa...
      </div>
    );
  }

  // Centro ajustado al trazado completo del río
  const center = [15.4649, -90.3703];
  const zoom = 15.8;

  return (
    <div className="map-view-container">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* AOI - Área de interés */}
        {aoi && (
          <GeoJSON
            data={aoi}
            style={{
              color: '#6ee7b7',
              weight: 2,
              fillOpacity: 0.05,
              dashArray: '5, 5'
            }}
          />
        )}

          {/* Zonas de inundación - múltiples capas según nivel */}

          {/* NIVEL ALERTA (1.00 - 2.00m) - 2 capas */}
          {waterLevel >= 1 && waterLevel < 2 && floodZones.length > 0 && (
            <>
              {/* Zona exterior naranja (50m) - Tomar medidas */}
              <GeoJSON
                key={`flood-outer-${waterLevel}`}
                data={floodZones[2].buffer}
                style={{
                  color: '#f59e0b',
                  weight: 0,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.35
                }}
              />
              {/* Zona interior roja (25m) - Evacuar */}
              <GeoJSON
                key={`flood-inner-${waterLevel}`}
                data={floodZones[1].buffer}
                style={{
                  color: '#ef4444',
                  weight: 0,
                  fillColor: '#ef4444',
                  fillOpacity: 0.5
                }}
              />
            </>
          )}

          {/* NIVEL EVACUACIÓN (2.00 - 3.00m) - 3 capas */}
          {waterLevel >= 2 && waterLevel < 3 && floodZones.length >= 4 && (
            <>
              {/* Capa 1: Zona externa (85m) - Naranja claro - precaución */}
              <GeoJSON
                key={`flood-outer-evac-${waterLevel}`}
                data={floodZones[3].buffer}
                style={{
                  color: '#fb923c',
                  weight: 0,
                  fillColor: '#fb923c',
                  fillOpacity: 0.3
                }}
              />
              {/* Capa 2: Zona media (50m) - Naranja/Rojo - peligro */}
              <GeoJSON
                key={`flood-middle-evac-${waterLevel}`}
                data={floodZones[2].buffer}
                style={{
                  color: '#f97316',
                  weight: 0,
                  fillColor: '#f97316',
                  fillOpacity: 0.45
                }}
              />
              {/* Capa 3: Zona interna (25m) - Rojo intenso - mucho peligro */}
              <GeoJSON
                key={`flood-inner-evac-${waterLevel}`}
                data={floodZones[1].buffer}
                style={{
                  color: '#dc2626',
                  weight: 0,
                  fillColor: '#dc2626',
                  fillOpacity: 0.6
                }}
              />
            </>
          )}

          {/* NIVEL NORMAL (< 1.00m) - zona única azul */}
          {waterLevel < 1 && activeZone && (
            <GeoJSON
              key={`flood-${waterLevel}`}
              data={activeZone}
              style={{
                color: floodColor,
                weight: 0,
                fillColor: floodColor,
                fillOpacity: 0.4
              }}
            />
          )}

          {/* NIVEL CRÍTICO (>= 3.00m) - 3 capas progresivas */}
          {waterLevel >= 3 && floodZones.length >= 5 && (
            <>
              {/* Capa 1: Zona externa (120m) - Amarillo - precaución */}
              <GeoJSON
                key={`flood-outer-critical-${waterLevel}`}
                data={floodZones[4].buffer}
                style={{
                  color: '#fbbf24',
                  weight: 0,
                  fillColor: '#fbbf24',
                  fillOpacity: 0.35
                }}
              />
              {/* Capa 2: Zona media (85m) - Rojo oscuro - peligro extremo */}
              <GeoJSON
                key={`flood-middle-critical-${waterLevel}`}
                data={floodZones[3].buffer}
                style={{
                  color: '#dc2626',
                  weight: 0,
                  fillColor: '#dc2626',
                  fillOpacity: 0.55
                }}
              />
              {/* Capa 3: Zona interna (50m) - Rojo muy oscuro - peligro mortal */}
              <GeoJSON
                key={`flood-inner-critical-${waterLevel}`}
                data={floodZones[2].buffer}
                style={{
                  color: '#991b1b',
                  weight: 0,
                  fillColor: '#991b1b',
                  fillOpacity: 0.7
                }}
              />
            </>
          )}

        {/* Río */}
        {river && (
          <GeoJSON
            data={river}
            style={{
              color: '#0ea5e9',
              weight: 3,
              opacity: 1
            }}
          />
        )}

        {/* Casas */}
        {houses && (
          <GeoJSON
            data={houses}
            pointToLayer={(feature, latlng) =>
              L.circleMarker(latlng, {
                radius: 5,
                fillColor: '#fca5a5',
                color: '#dc2626',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              })
            }
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindPopup(`<b>${feature.properties.name}</b>`);
              }
            }}
          />
        )}
      </MapContainer>

      {/* Controles interactivos */}
      <Controls
        level={waterLevel}
        setLevel={setWaterLevel}
        stats={stats}
      />
    </div>
  );
}