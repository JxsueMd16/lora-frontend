import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatest, fetchStats } from "../api";
import "./dashboard.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from "recharts";

// Iconos SVG
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18"/>
    <path d="M17 6h6v6"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 18l-9.5-9.5-5 5L1 6"/>
    <path d="M17 18h6v-6"/>
  </svg>
);

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const DropletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);

// Componente KPI mejorado
function KpiCard({ title, value, suffix, trend, icon: Icon, color = "blue" }) {
  const trendValue = trend != null ? (trend > 0 ? `+${trend}%` : `${trend}%`) : null;
  const isPositive = trend > 0;

  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-header">
        <div className="kpi-icon">
          <Icon />
        </div>
        {trendValue && (
          <div className={`kpi-trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
            {isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="kpi-body">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">
          {value ?? "--"}
          {value != null && suffix ? <span className="kpi-suffix">{suffix}</span> : ""}
        </div>
      </div>
      <div className="kpi-glow"></div>
    </div>
  );
}

// Gráfica de tendencia (línea suave)
function ChartTrend({ readings }) {
  const data = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .map((r, i) => ({
        index: i,
        time: new Date(r.receivedAt).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        dist: r.dist_cm,
        depth: r.depth_cm || 0
      }));
  }, [readings]);

return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#0f1419', 
            border: '1px solid #263241',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="dist" 
          stroke="#10b981" 
          fillOpacity={1}
          fill="url(#colorDist)" 
          name="Distancia (cm)"
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="depth" 
          stroke="#3b82f6" 
          fillOpacity={1}
          fill="url(#colorDepth)" 
          name="Profundidad (cm)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Gráfica de señal (RSSI y SNR)
function ChartSignal({ readings }) {
  const data = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .filter(r => r.rssi != null)
      .map((r, i) => ({
        index: i,
        time: new Date(r.receivedAt).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        rssi: r.rssi,
        snr: r.snr || 0
      }));
  }, [readings]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
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
          dataKey="rssi" 
          stroke="#f59e0b" 
          strokeWidth={2}
          dot={false}
          name="RSSI (dBm)"
        />
        <Line 
          type="monotone" 
          dataKey="snr" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={false}
          name="SNR (dB)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Medidor de nivel de riesgo (Gauge)
function RiskGauge({ readings }) {
  const riskLevel = useMemo(() => {
    if (!readings.length) return 50;
    
    const recent = readings.slice(0, 10).filter(r => r.dist_cm != null && r.depth_cm != null);
    if (recent.length === 0) return 50;
    
    // Mayor diferencia (distancia alta - profundidad baja) = Seguro (verde, alto)
    // Menor diferencia (distancia baja - profundidad alta) = Peligro (rojo, bajo)
    const differences = recent.map(r => r.dist_cm - r.depth_cm);
    const avgDiff = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    
    // Convertir a porcentaje de seguridad
    // Si avgDiff = 10 o más = 100% (muy seguro, verde)
    // Si avgDiff = 0 o menos = 0% (peligro, rojo)
    const maxSafeDiff = 10;
    const riskPercent = Math.max(0, Math.min(100, (avgDiff / maxSafeDiff) * 100));
    
    return riskPercent;
  }, [readings]);

  const getColor = (value) => {
    if (value >= 70) return '#10b981'; // Verde - Seguro
    if (value >= 40) return '#f59e0b'; // Amarillo - Precaución
    return '#ef4444'; // Rojo - Peligro
  };

  const getLabel = (value) => {
    if (value >= 70) return 'Seguro';
    if (value >= 40) return 'Precaución';
    return 'Peligro';
  };

  const needleAngle = -90 + (riskLevel * 1.8); // De -90° a 90°
  const color = getColor(riskLevel);

  return (
    <div style={{ 
      width: '100%', 
      height: '280px', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: '300px' }}>
        {/* Arco rojo (peligro) */}
        <path
          d="M 20 100 A 80 80 0 0 1 66.67 35"
          fill="none"
          stroke="#10b981"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Arco amarillo (precaución) */}
        <path
          d="M 66.67 35 A 80 80 0 0 1 133.33 35"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Arco verde (seguro) */}
        <path
          d="M 133.33 35 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#ef4444"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Centro de la aguja */}
        <circle cx="100" cy="100" r="8" fill={color} stroke="#0f1419" strokeWidth="2"/>
        
        {/* Aguja */}
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((needleAngle * Math.PI) / 180)}
          y2={100 + 60 * Math.sin((needleAngle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease-out' }}
        />
      </svg>
      
      {/* Etiquetas */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '16px',
        width: '100%'
      }}>
        <div style={{ 
          fontSize: '1.5rem',
          color: color,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {getLabel(riskLevel)}
        </div>
      </div>
    </div>
  );
}

// Gráfica radar de calidad
function ChartQuality({ readings }) {
  const data = useMemo(() => {
    const recent = readings.slice(0, 10);
    
    const avgDist = recent.reduce((sum, r) => sum + (r.dist_cm || 0), 0) / recent.length;
    const avgRssi = recent.reduce((sum, r) => sum + (r.rssi || 0), 0) / recent.length;
    const avgSnr = recent.reduce((sum, r) => sum + (r.snr || 0), 0) / recent.length;
    
    // Normalizar valores a escala 0-100
    const distScore = Math.max(0, Math.min(100, 100 - (avgDist / 3)));
    const rssiScore = Math.max(0, Math.min(100, ((avgRssi + 120) / 50) * 100));
    const snrScore = Math.max(0, Math.min(100, ((avgSnr + 20) / 30) * 100));
    const consistency = Math.max(0, Math.min(100, (recent.length / 10) * 100));
    const overall = (distScore + rssiScore + snrScore + consistency) / 4;

    return [
      { metric: 'Señal', value: rssiScore.toFixed(0) },
      { metric: 'SNR', value: snrScore.toFixed(0) },
      { metric: 'Distancia', value: distScore.toFixed(0) },
      { metric: 'Consistencia', value: consistency.toFixed(0) },
      { metric: 'General', value: overall.toFixed(0) },
    ];
  }, [readings]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="#263241" />
        <PolarAngleAxis dataKey="metric" stroke="#6b7280" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
        <Radar 
          name="Calidad" 
          dataKey="value" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#0f1419', 
            border: '1px solid #263241',
            borderRadius: '8px'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Estadísticas rápidas
function QuickStats({ readings }) {
  const stats = useMemo(() => {
    if (!readings.length) return null;

    const validReadings = readings.filter(r => r.dist_cm != null);
    const distances = validReadings.map(r => r.dist_cm);
    
    const max = Math.max(...distances);
    const min = Math.min(...distances);
    const latest = readings[0]?.dist_cm;
    const previous = readings[1]?.dist_cm;
    const change = latest && previous ? ((latest - previous) / previous * 100).toFixed(1) : null;

    return { max, min, latest, change };
  }, [readings]);

  if (!stats) return null;

  return (
    <div className="quick-stats">
      <div className="stat-item">
        <span className="stat-label">Máximo</span>
        <span className="stat-value">{stats.max.toFixed(1)} cm</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-label">Mínimo</span>
        <span className="stat-value">{stats.min.toFixed(1)} cm</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-label">Última lectura</span>
        <span className="stat-value">{stats.latest.toFixed(1)} cm</span>
      </div>
      {stats.change && (
        <>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-label">Cambio</span>
            <span className={`stat-value ${stats.change > 0 ? 'text-danger' : 'text-success'}`}>
              {stats.change > 0 ? '+' : ''}{stats.change}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: latest = [], isLoading: loadingLatest } = useQuery({
    queryKey: ["latest", 100],
    queryFn: () => fetchLatest(100),
    refetchInterval: 15000
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000
  });

  const trendCalc = useMemo(() => {
    if (latest.length < 20) return null;
    const recent10 = latest.slice(0, 10).filter(r => r.dist_cm != null);
    const previous10 = latest.slice(10, 20).filter(r => r.dist_cm != null);
    
    if (recent10.length === 0 || previous10.length === 0) return null;
    
    const avgRecent = recent10.reduce((sum, r) => sum + r.dist_cm, 0) / recent10.length;
    const avgPrevious = previous10.reduce((sum, r) => sum + r.dist_cm, 0) / previous10.length;
    
    return ((avgRecent - avgPrevious) / avgPrevious * 100).toFixed(1);
  }, [latest]);

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Monitoreo en tiempo real del río</p>
        </div>
        <div className="dash-refresh">
          <ActivityIcon />
          <span>Actualización automática cada 15s</span>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="kpi-grid">
        <KpiCard
          title="Lecturas Válidas"
          value={stats?.successful}
          icon={ActivityIcon}
          color="blue"
        />
        <KpiCard
          title="Total Registros"
          value={stats?.total}
          icon={DropletIcon}
          color="green"
        />
        <KpiCard
          title="Distancia Promedio"
          value={stats?.averages?.avgDistance?.toFixed(1)}
          suffix="cm"
          trend={trendCalc ? parseFloat(trendCalc) : null}
          icon={TrendUpIcon}
          color="purple"
        />
        <KpiCard
          title="RSSI Promedio"
          value={stats?.averages?.avgRssi?.toFixed(0)}
          suffix="dBm"
          icon={ActivityIcon}
          color="orange"
        />
      </div>

      {/* Estadísticas rápidas */}
      {!loadingLatest && latest.length > 0 && (
        <div className="card quick-stats-card">
          <QuickStats readings={latest} />
        </div>
      )}

      {/* Gráficas principales */}
      <div className="charts-grid">
        <section className="card chart-card-large">
          <div className="card-header">
            <h3>Tendencia de Mediciones</h3>
            <span className="card-badge">Últimas 100 lecturas</span>
          </div>
          <div className="card-body">
            {loadingLatest ? (
              <div className="skeleton" />
            ) : (
              <ChartTrend readings={latest} />
            )}
          </div>
        </section>

        <section className="card chart-card">
          <div className="card-header">
            <h3>Calidad de Señal</h3>
            <span className="card-badge">RSSI & SNR</span>
          </div>
          <div className="card-body">
            {loadingLatest ? (
              <div className="skeleton skeleton-small" />
            ) : (
              <ChartSignal readings={latest} />
            )}
          </div>
        </section>

        <section className="card chart-card">
          <div className="card-header">
            <h3>Nivel de Riesgo</h3>
            <span className="card-badge">Diferencia Dist/Prof</span>
          </div>
          <div className="card-body">
            {loadingLatest ? (
              <div className="skeleton skeleton-small" />
            ) : (
              <RiskGauge readings={latest} />
            )}
          </div>
        </section>

        <section className="card chart-card">
          <div className="card-header">
            <h3>Análisis de Calidad</h3>
            <span className="card-badge">Score general</span>
          </div>
          <div className="card-body">
            {loadingLatest ? (
              <div className="skeleton skeleton-small" />
            ) : (
              <ChartQuality readings={latest} />
            )}
          </div>
        </section>
      </div>

      {/* Tabla detallada */}
      <section className="card table-card">
        <div className="card-header">
          <h3>Últimas Lecturas Detalladas</h3>
          <span className="card-badge">{latest.length} registros</span>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Distancia</th>
                  <th>Profundidad</th>
                  <th>RSSI</th>
                  <th>SNR</th>
                </tr>
              </thead>
              <tbody>
                {latest.slice(0, 40).map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.receivedAt).toLocaleString('es-ES')}</td>
                    <td>{r.dist_cm?.toFixed?.(1) || '-'} cm</td>
                    <td>{r.depth_cm?.toFixed?.(1) || '-'} cm</td>
                    <td className={r.rssi < -100 ? 'signal-weak' : r.rssi > -80 ? 'signal-strong' : ''}>
                      {r.rssi || '-'} dBm
                    </td>
                    <td>{r.snr?.toFixed?.(1) || '-'} dB</td>
                  </tr>
                ))}
                {!loadingLatest && latest.length === 0 && (
                  <tr>
                    <td colSpan={5} className="no-data">Sin datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}