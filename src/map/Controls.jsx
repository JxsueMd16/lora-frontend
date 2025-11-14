// src/map/Controls.jsx
import { useMemo, useState } from "react";
import { getAlertLevel } from "../lib/sim";

export default function Controls({ level, setLevel, stats }) {
  const [expanded, setExpanded] = useState(false);
  const alert = useMemo(() => getAlertLevel(level), [level]);
  const label = useMemo(() => `${level.toFixed(2)} m`, [level]);

  return (
    <div style={{
      ...styles.wrap,
      bottom: expanded ? 0 : '-290px'
    }}>
      {/* Header compacto - siempre visible */}
      <div 
        style={{
          ...styles.header,
          background: alert.color
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={styles.headerContent}>
          <div style={styles.dragHandle} />
          <div style={styles.headerInfo}>
            <span style={styles.headerTitle}>{alert.label}</span>
            <span style={styles.headerLevel}>{label}</span>
          </div>
        </div>
      </div>

      {/* Slider - siempre visible */}
      <div style={styles.sliderSection}>
        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>Nivel del agua</span>
          <span style={styles.sliderValue}>{label}</span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.05}
          value={level}
          onChange={(e) => setLevel(parseFloat(e.target.value))}
          style={styles.slider}
          aria-label="Nivel del río (m)"
        />
        <div style={styles.markers}>
          <span>normal</span>
          <span style={{ color: '#f59e0b' }}>medio</span>
          <span style={{ color: '#ef4444' }}>alto</span>
          <span style={{ color: '#991b1b' }}>crítico</span>
        </div>
      </div>

      {/* Contenido expandible */}
      <div style={styles.expandable}>
        {/* Estadísticas de casas afectadas */}
        {stats && (
          <div style={styles.section}>
            <strong style={styles.sectionTitle}>Casas en riesgo</strong>
            <div style={styles.kpis}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Zona 1</div>
                <div style={{...styles.kpiValue, color: '#60a5fa'}}>
                  {stats.zone1}
                </div>
                <div style={styles.kpiDesc}>sin peligro</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Zona 2</div>
                <div style={{...styles.kpiValue, color: '#f59e0b'}}>
                  {stats.zone2}
                </div>
                <div style={styles.kpiDesc}>tomar medidas</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>Zona 3</div>
                <div style={{...styles.kpiValue, color: '#ef4444'}}>
                  {stats.zone3}
                </div>
                <div style={styles.kpiDesc}>evacuar</div>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: '#38bdf8'}} />
            <span>Río</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: '#fca5a5'}} />
            <span>Casas</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, background: alert.color, opacity: 0.4}} />
            <span>Zona inundada</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    background: "linear-gradient(to top, rgba(10, 14, 39, 0.98), rgba(15, 20, 25, 0.95))",
    backdropFilter: "blur(16px)",
    borderTop: "2px solid rgba(59, 130, 246, 0.3)",
    color: "#eaeef3",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
    transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    maxHeight: '85vh',
    overflowY: 'auto',
    borderRadius: '20px 20px 0 0'
  },
  header: {
    padding: '16px 20px 12px',
    cursor: 'pointer',
    userSelect: 'none',
    borderRadius: '20px 20px 0 0',
    position: 'relative',
    overflow: 'hidden'
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    position: 'relative',
    zIndex: 2
  },
  dragHandle: {
    width: 48,
    height: 5,
    background: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  headerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  headerLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    fontFamily: 'monospace'
  },
  sliderSection: {
    padding: '20px',
    background: 'rgba(19, 26, 34, 0.8)',
    borderBottom: '1px solid rgba(38, 50, 65, 0.6)'
  },
  sliderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'center'
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: 600,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9ca3af'
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60a5fa',
    fontFamily: 'monospace'
  },
  slider: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    outline: "none",
    cursor: "pointer",
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444, #991b1b)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  markers: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    marginTop: 8,
    opacity: 0.8,
    paddingLeft: 4,
    paddingRight: 4,
    fontWeight: 600
  },
  expandable: {
    background: 'rgba(15, 20, 25, 0.95)'
  },
  section: {
    padding: '20px',
    borderBottom: "1px solid rgba(38, 50, 65, 0.6)"
  },
  sectionTitle: {
    marginBottom: 14,
    display: 'block',
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#60a5fa'
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12
  },
  kpi: {
    background: "linear-gradient(135deg, #131a22 0%, #0f1419 100%)",
    border: "1px solid #263241",
    borderRadius: 12,
    padding: '14px 10px',
    textAlign: "center",
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'relative',
    overflow: 'hidden'
  },
  kpiLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
    textShadow: 'none'
  },
  kpiDesc: {
    fontSize: 10,
    opacity: 0.6,
    fontWeight: 500
  },
  legend: {
    padding: '20px',
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 12px',
    background: 'rgba(19, 26, 34, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(38, 50, 65, 0.4)',
    transition: 'all 0.2s'
  },
  legendColor: {
    width: 28,
    height: 16,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  }
};