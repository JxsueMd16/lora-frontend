// src/pages/Alertas.jsx
import { useState, useEffect } from "react";
import "./alertas.css";

// Iconos SVG
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function Alertas() {
  const [config, setConfig] = useState({
    ALERT_DIST_HIGH: 7,
    ALERT_DIST_CRITICAL: 5,
    ALERT_COOLDOWN_SECONDS: 60
  });

  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [botUrl, setBotUrl] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3007').replace(/\/$/, '');

  // Cargar suscriptores
  useEffect(() => {
    fetchSubscribers();
    // Construir URL del bot desde el token
    const token = '8007887698:AAEaWS_yz_-S0K-LGKMxMLZM3rADiP4peno';
    const botUsername = 'syslora_bot'; // Cambiar por el username real de tu bot
    setBotUrl(`https://t.me/${botUsername}`);
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch(`${API_URL}/telegram/subscribers`);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error cargando suscriptores:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleSendTest = async () => {
    if (!testMessage.trim()) {
      showNotification('Escribe un mensaje de prueba', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/telegram/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': 'mySecretKey123'
        },
        body: JSON.stringify({ message: testMessage })
      });

      const data = await res.json();
      
      if (data.success) {
        showNotification('✅ Mensaje enviado a todos los suscriptores', 'success');
        setTestMessage('');
      } else {
        showNotification('Error al enviar mensaje', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error de conexión', 'error');
    } finally {
      setSending(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="alertas-wrap">
      {/* Notificación flotante */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <CheckIcon />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="alertas-header">
        <div>
          <h1 className="alertas-title">Sistema de Alertas</h1>
          <p className="alertas-subtitle">Configuración y gestión de notificaciones</p>
        </div>
      </div>

      {/* Configuración de umbrales */}
      <section className="card">
        <div className="card-header">
          <div className="header-with-icon">
            <SettingsIcon />
            <h3>Configuración de Umbrales</h3>
          </div>
          <span className="card-badge">Ajustes de alerta</span>
        </div>
        <div className="card-body">
          <div className="config-grid">
            <div className="config-item">
              <label>
                <AlertTriangleIcon />
                <span>Nivel de Alerta (ALTO)</span>
              </label>
              <div className="input-group">
                <input 
                  type="number" 
                  value={config.ALERT_DIST_HIGH}
                  onChange={(e) => setConfig({...config, ALERT_DIST_HIGH: Number(e.target.value)})}
                  min="0"
                  max="20"
                />
                <span className="input-suffix">cm</span>
              </div>
              <p className="input-hint">Se activa cuando el agua sube a este nivel o menos</p>
            </div>

            <div className="config-item">
              <label>
                <AlertTriangleIcon />
                <span>Nivel Crítico</span>
              </label>
              <div className="input-group">
                <input 
                  type="number" 
                  value={config.ALERT_DIST_CRITICAL}
                  onChange={(e) => setConfig({...config, ALERT_DIST_CRITICAL: Number(e.target.value)})}
                  min="0"
                  max="10"
                />
                <span className="input-suffix">cm</span>
              </div>
              <p className="input-hint">Nivel de emergencia - evacuación inmediata</p>
            </div>

            <div className="config-item">
              <label>
                <BellIcon />
                <span>Cooldown entre alertas</span>
              </label>
              <div className="input-group">
                <input 
                  type="number" 
                  value={config.ALERT_COOLDOWN_SECONDS}
                  onChange={(e) => setConfig({...config, ALERT_COOLDOWN_SECONDS: Number(e.target.value)})}
                  min="30"
                  max="3600"
                />
                <span className="input-suffix">seg</span>
              </div>
              <p className="input-hint">Tiempo mínimo entre notificaciones del mismo nivel</p>
            </div>
          </div>

          <div className="alert-info">
            <AlertTriangleIcon />
            <div>
              <strong>Nota:</strong> Los umbrales actuales están configurados para una cubeta de prueba de 12cm. 
            </div>
          </div>
        </div>
      </section>

      {/* Bot de Telegram */}
      <section className="card telegram-card">
        <div className="card-header">
          <div className="header-with-icon">
            <TelegramIcon />
            <h3>Bot de Telegram</h3>
          </div>
          <span className="card-badge telegram-badge">
            {subscribers.length} suscriptores
          </span>
        </div>
        <div className="card-body">
          <div className="telegram-info">
            <div className="telegram-instructions">
              <h4>¿Cómo suscribirse?</h4>
              <ol>
                <li>Abre Telegram en tu dispositivo</li>
                <li>Busca el bot o haz clic en el botón de abajo</li>
                <li>Envía el comando <code>/start</code></li>
                <li>¡Listo! Recibirás alertas automáticas</li>
              </ol>
              
              <a 
                href={botUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="telegram-button"
              >
                <TelegramIcon />
                <span>Abrir Bot en Telegram</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3"/>
                </svg>
              </a>

              <div className="unsubscribe-info">
                <p>Para dejar de recibir alertas, envía <code>/stop</code> al bot</p>
              </div>
            </div>

            <div className="test-message-section">
              <h4>Enviar mensaje de prueba</h4>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Escribe un mensaje para enviar a todos los suscriptores..."
                rows={4}
                className="test-textarea"
              />
              <button 
                onClick={handleSendTest}
                disabled={sending || !testMessage.trim()}
                className="send-button"
              >
                {sending ? (
                  <>
                    <div className="spinner"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <BellIcon />
                    <span>Enviar a todos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de suscriptores */}
      <section className="card">
        <div className="card-header">
          <div className="header-with-icon">
            <UsersIcon />
            <h3>Suscriptores</h3>
          </div>
          <span className="card-badge">{subscribers.length} activos</span>
        </div>
        <div className="card-body">
          {loadingSubscribers ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Cargando suscriptores...</span>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="empty-state">
              <BellIcon />
              <h4>No hay suscriptores</h4>
              <p>Los usuarios que envíen /start al bot aparecerán aquí</p>
            </div>
          ) : (
            <div className="subscribers-grid">
              {subscribers.map((sub) => (
                <div key={sub._id} className="subscriber-card">
                  <div className="subscriber-avatar">
                    {sub.name?.charAt(0) || '?'}
                  </div>
                  <div className="subscriber-info">
                    <div className="subscriber-name">{sub.name || 'Usuario'}</div>
                    <div className="subscriber-id">ID: {sub.chatId}</div>
                    <div className="subscriber-date">
                      Desde: {new Date(sub.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="subscriber-status">
                    <CheckIcon />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Información adicional */}
      <section className="card info-card">
        <div className="card-header">
          <h3>Información del Sistema</h3>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Estado del sistema</span>
              <span className="info-value status-active">● Activo</span>
            </div>
            <div className="info-item">
              <span className="info-label">Última alerta enviada</span>
              <span className="info-value">--</span>
            </div>
            <div className="info-item">
              <span className="info-label">Alertas hoy</span>
              <span className="info-value">0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Backend</span>
              <span className="info-value">{API_URL}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}