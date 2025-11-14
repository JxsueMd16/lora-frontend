import { Link } from "react-router-dom";
import { useState } from "react";
import "./home.css";

// Iconos SVG personalizados
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const ClimateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/>
  </svg>
);

const ReadingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/>
    <path d="M18 17l-5-5-4 4-5-5"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const WaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12c.5-2 1.5-3.5 3-3.5s2.5 1.5 3 3.5 1.5 3.5 3 3.5 2.5-1.5 3-3.5 1.5-3.5 3-3.5 2.5 1.5 3 3.5"/>
    <path d="M2 17c.5-2 1.5-3.5 3-3.5s2.5 1.5 3 3.5 1.5 3.5 3 3.5 2.5-1.5 3-3.5 1.5-3.5 3-3.5 2.5 1.5 3 3.5"/>
  </svg>
);

const items = [
  { 
    to: "/dashboard", 
    title: "Dashboard", 
    desc: "Visualiza indicadores y tendencias",
    Icon: DashboardIcon,
    color: "blue"
  },
  { 
    to: "/mapa", 
    title: "Mapa y Simulación", 
    desc: "Zonas de impacto del río",
    Icon: MapIcon,
    color: "green"
  },
  { 
    to: "/clima", 
    title: "Clima", 
    desc: "Pronóstico y condiciones actuales",
    Icon: ClimateIcon,
    color: "orange"
  },
  { 
    to: "/lecturas", 
    title: "Lecturas", 
    desc: "Historial y exportación de datos",
    Icon: ReadingsIcon,
    color: "purple"
  },
  { 
    to: "/alertas", 
    title: "Alertas", 
    desc: "Configuración de umbrales y avisos",
    Icon: AlertIcon,
    color: "red"
  },
];

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <main className="home-wrap">
      {/* Fondo animado con ondas */}
      <div className="wave-bg">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* Header */}
      <header className="home-header">
        <div className="header-icon">
          <WaveIcon />
        </div>
        <h1 className="home-title">
          <span className="title-gradient">Monitoreo del Río</span>
        </h1>
        <p className="home-sub">Selecciona un módulo para continuar</p>
      </header>

      {/* Grid de tarjetas */}
      <section className="home-grid">
        {items.map((item, idx) => {
          const { Icon } = item;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`home-card card-${item.color}`}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="card-glow"></div>
              <div className="card-content">
                <div className="card-icon">
                  <Icon />
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.desc}</p>
                <div className="card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14m-7-7l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <span className="footer-label">Backend:</span>
          <a 
            href="https://lora-backend-9606.onrender.com" 
            target="_blank" 
            rel="noreferrer"
            className="footer-link"
          >
            lora-backend-9606.onrender.com
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3"/>
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}