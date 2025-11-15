// src/pages/Clima.jsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './clima.css';

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api";

// Funciones de API
async function getCurrentWeather(city) {
  const res = await fetch(`${API_URL}/mcp/weather/current?city=${encodeURIComponent(city)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

async function getForecast(city, days = 5) {
  const res = await fetch(`${API_URL}/mcp/weather/forecast?city=${encodeURIComponent(city)}&days=${days}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

async function getRainProbability(city, days = 5) {
  const res = await fetch(`${API_URL}/mcp/weather/rain?city=${encodeURIComponent(city)}&days=${days}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

async function getLatestSensor() {
  const res = await fetch(`${API_URL}/data/latest?limit=1`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data[0];
}

async function analyzeWithGemini(sensorId, city, question) {
  const res = await fetch(`${API_URL}/mcp/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sensorId, city, question })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

export default function Clima() {
  const [city, setCity] = useState('Cobán');
  const [cityInput, setCityInput] = useState('Cobán');
  const [aiQuestion, setAiQuestion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Queries
  const { data: currentWeather, isLoading: loadingCurrent } = useQuery({
    queryKey: ['weather-current', city],
    queryFn: () => getCurrentWeather(city),
    refetchInterval: 300000 // 5 minutos
  });

  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: ['weather-forecast', city],
    queryFn: () => getForecast(city, 5),
    refetchInterval: 300000
  });

  const { data: rainProb, isLoading: loadingRain } = useQuery({
    queryKey: ['weather-rain', city],
    queryFn: () => getRainProbability(city, 5),
    refetchInterval: 300000
  });

  const { data: latestSensor } = useQuery({
    queryKey: ['latest-sensor'],
    queryFn: getLatestSensor,
    refetchInterval: 30000
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Datos para gráficas
  const forecastChartData = useMemo(() => {
    if (!forecast?.dailyForecast) return [];
    return forecast.dailyForecast.map(day => ({
      date: new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      tempMin: day.minTemp.toFixed(1),
      tempMax: day.maxTemp.toFixed(1),
      tempAvg: day.avgTemp.toFixed(1),
      humidity: day.avgHumidity.toFixed(0),
      rain: (day.maxRainProbability * 100).toFixed(0)
    }));
  }, [forecast]);

  const rainChartData = useMemo(() => {
    if (!rainProb?.rainAnalysis) return [];
    return rainProb.rainAnalysis.map(day => ({
      date: new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      maxProb: (day.maxProbability * 100).toFixed(0),
      avgProb: (day.avgProbability * 100).toFixed(0),
      totalRain: day.totalRain.toFixed(1)
    }));
  }, [rainProb]);

  // Handlers
  const handleCitySearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      setCity(cityInput.trim());
    }
  };

  const handleAiAnalysis = async () => {
    if (!latestSensor?._id || aiLoading) return;
    
    setAiLoading(true);
    try {
      const result = await analyzeWithGemini(
        latestSensor._id,
        city,
        aiQuestion || undefined
      );
      setAiAnalysis(result);
      setShowAiPanel(true);
    } catch (error) {
      alert('Error al analizar: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="clima-wrap">
      {/* Header con búsqueda */}
      <div className="clima-header">
        <div>
          <h1 className="clima-title">Clima y Pronóstico</h1>
          <p className="clima-subtitle">Análisis meteorológico con IA</p>
        </div>
        
        <form onSubmit={handleCitySearch} className="city-search">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Buscar ciudad..."
            className="city-input"
          />
          <button type="submit" className="city-btn">Buscar</button>
        </form>
      </div>

      {/* Clima Actual */}
      {loadingCurrent ? (
        <div className="loading">Cargando clima actual...</div>
      ) : currentWeather ? (
        <div className="current-weather-card">
          <div className="current-main">
            <div className="current-info">
              <h2 className="current-city">{currentWeather.city}</h2>
              <p className="current-desc">{currentWeather.description}</p>
            </div>
            <div className="current-temp">
              <span className="temp-value">{currentWeather.temperature.toFixed(1)}</span>
              <span className="temp-unit">°C</span>
            </div>
          </div>
          
          <div className="current-details">
            <div className="detail-item">
              <span className="detail-label">Sensación</span>
              <span className="detail-value">{currentWeather.feelsLike.toFixed(1)}°C</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Humedad</span>
              <span className="detail-value">{currentWeather.humidity}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Viento</span>
              <span className="detail-value">{currentWeather.windSpeed} m/s</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Presión</span>
              <span className="detail-value">{currentWeather.pressure} hPa</span>
            </div>
            {currentWeather.visibility && (
              <div className="detail-item">
                <span className="detail-label">Visibilidad</span>
                <span className="detail-value">{currentWeather.visibility} km</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Nubes</span>
              <span className="detail-value">{currentWeather.clouds}%</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Gráficas de Pronóstico */}
      <div className="charts-section">
        {/* Temperatura */}
        <div className="chart-card">
          <h3 className="chart-title">Pronóstico de Temperatura (5 días)</h3>
          {loadingForecast ? (
            <div className="loading">Cargando...</div>
          ) : forecastChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263241" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1419',
                    border: '1px solid #263241',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tempMax"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Máx (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="tempAvg"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Prom (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="tempMin"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Mín (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Sin datos</div>
          )}
        </div>

        {/* Probabilidad de Lluvia */}
        <div className="chart-card">
          <h3 className="chart-title">Probabilidad de Lluvia</h3>
          {loadingRain ? (
            <div className="loading">Cargando...</div>
          ) : rainChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rainChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263241" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1419',
                    border: '1px solid #263241',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="maxProb" fill="#3b82f6" name="Prob. Máx (%)" />
                <Bar dataKey="avgProb" fill="#60a5fa" name="Prob. Prom (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Sin datos</div>
          )}
        </div>
      </div>

      {/* Análisis con IA */}
      <div className="ai-section">
        <h3 className="ai-title">Análisis con Gemini AI</h3>
        
        {latestSensor ? (
          <div className="ai-controls">
            <div className="sensor-info">
              <span className="sensor-label">Última lectura del sensor:</span>
              <span className="sensor-value">
                Dist: {latestSensor.dist_cm?.toFixed(1) || '-'} cm | 
                Prof: {latestSensor.depth_cm?.toFixed(1) || '-'} cm
              </span>
            </div>
            
            <div className="ai-input-group">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Pregunta opcional (ej: ¿Cuál es el riesgo de inundación?)"
                className="ai-input"
              />
              <button
                onClick={handleAiAnalysis}
                disabled={aiLoading}
                className="ai-btn"
              >
                {aiLoading ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
          </div>
        ) : (
          <div className="no-sensor">
            No hay lecturas del sensor disponibles
          </div>
        )}

        {/* Panel de resultados */}
        {showAiPanel && aiAnalysis && (
          <div className="ai-results">
            <div className="ai-result-section">
              <h4>Análisis General</h4>
              <p className="ai-text">{aiAnalysis.analysis}</p>
            </div>
            
            <div className="ai-result-section">
              <h4>Recomendaciones</h4>
              <p className="ai-text">{aiAnalysis.recommendations}</p>
            </div>

            <div className="ai-metadata">
              <span>Análisis generado: {new Date(aiAnalysis.timestamp).toLocaleString('es-ES')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de lluvia */}
      {rainProb?.summary && (
        <div className="rain-summary">
          <h3>Resumen de Lluvia (5 días)</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Días con lluvia</span>
              <span className="summary-value">{rainProb.summary.daysWithRain} / {rainProb.summary.totalDays}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Prob. más alta</span>
              <span className="summary-value">{(rainProb.summary.highestProbability * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}