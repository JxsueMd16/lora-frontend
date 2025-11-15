import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: "fixed",
        top: 15,
        left: 15,
        zIndex: 999,
        padding: "10px 14px",
        borderRadius: "8px",
        backgroundColor: "#0a525d",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        border: "none",
        boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
        cursor: "pointer"
      }}
    >
      ← Regresar
    </button>
  );
}
