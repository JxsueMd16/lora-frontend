// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Mapa from "./pages/Mapa.jsx";
import Alertas from "./pages/Alertas.jsx";
import Clima from "./pages/clima.jsx";
import Lecturas from "./pages/Lecturas.jsx"; 

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
