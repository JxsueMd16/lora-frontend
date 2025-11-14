// src/pages/Mapa.jsx
import { useEffect } from 'react';
import MapView from '../map/MapView';
import './map.css';

export default function Mapa() {
  useEffect(() => {
    // Prevenir scroll cuando se monta el componente
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Restaurar scroll cuando se desmonta
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="mapa-container">
      <MapView />
    </div>
  );
}