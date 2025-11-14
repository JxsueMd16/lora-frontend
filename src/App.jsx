// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Mapa from "./pages/Mapa.jsx";

// (puedes dejar estos como placeholders por ahora)
const Clima    = () => <div style={{padding:"2rem"}}><h2>Clima</h2><p>Próximamente…</p></div>;
const Lecturas = () => <div style={{padding:"2rem"}}><h2>Lecturas</h2><p>Próximamente…</p></div>;
const Alertas  = () => <div style={{padding:"2rem"}}><h2>Alertas</h2><p>Próximamente…</p></div>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/clima" element={<Clima />} />
      <Route path="/lecturas" element={<Lecturas />} />
      <Route path="/alertas" element={<Alertas />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
