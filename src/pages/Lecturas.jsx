import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Iconos SVG
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
    <path d="M13 2v7h7"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// API
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api";

async function fetchDataRange(startDate, endDate, limit = 10000) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    onlyValid: 'false'
  });
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await fetch(`${API_URL}/data/range?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error al obtener datos');
  return json.data;
}

// Utilidades de exportación
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToCSV(data) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Encabezados
  const headers = [
    'ID',
    'Fecha y Hora',
    'Distancia (cm)',
    'Profundidad (cm)',
    'RSSI (dBm)',
    'SNR (dB)',
    'Origen',
    'Valid'
  ];

  // Filas
  const rows = data.map(row => [
    row._id,
    new Date(row.receivedAt).toLocaleString('es-ES'),
    row.dist_cm?.toFixed(2) || '',
    row.depth_cm?.toFixed(2) || '',
    row.rssi || '',
    row.snr?.toFixed(1) || '',
    row.source || 'lora',
    row.valid ? 'Sí' : 'No'
  ]);

  // Combinar
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  downloadFile(csvContent, `lecturas_${timestamp}.csv`, 'text/csv');
}

function exportToJSON(data) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  downloadFile(jsonContent, `lecturas_${timestamp}.json`, 'application/json');
}

function exportToExcel(data) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Crear XML para Excel (formato SpreadsheetML)
  const headers = ['ID', 'Fecha y Hora', 'Distancia (cm)', 'Profundidad (cm)', 'RSSI (dBm)', 'SNR (dB)', 'Origen', 'Valid'];
  
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Lecturas">
  <Table>
   <Row>`;

  // Encabezados
  headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
  });
  xml += `</Row>`;

  // Datos
  data.forEach(row => {
    xml += `<Row>
     <Cell><Data ss:Type="String">${row._id}</Data></Cell>
     <Cell><Data ss:Type="String">${new Date(row.receivedAt).toLocaleString('es-ES')}</Data></Cell>
     <Cell><Data ss:Type="Number">${row.dist_cm?.toFixed(2) || ''}</Data></Cell>
     <Cell><Data ss:Type="Number">${row.depth_cm?.toFixed(2) || ''}</Data></Cell>
     <Cell><Data ss:Type="Number">${row.rssi || ''}</Data></Cell>
     <Cell><Data ss:Type="Number">${row.snr?.toFixed(1) || ''}</Data></Cell>
     <Cell><Data ss:Type="String">${row.source || 'lora'}</Data></Cell>
     <Cell><Data ss:Type="String">${row.valid ? 'Sí' : 'No'}</Data></Cell>
    </Row>`;
  });

  xml += `</Table>
 </Worksheet>
</Workbook>`;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  downloadFile(xml, `lecturas_${timestamp}.xls`, 'application/vnd.ms-excel');
}

// Componente Principal
export default function Lecturas() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(1000);
  const [notification, setNotification] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Query para obtener datos
  const { data: readings = [], isLoading, refetch } = useQuery({
    queryKey: ['readings-export', startDate, endDate, limit],
    queryFn: () => fetchDataRange(startDate, endDate, limit),
    enabled: false // Solo ejecutar manualmente
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      
      // Obtener datos primero
      const result = await refetch();
      
      if (!result.data || result.data.length === 0) {
        showNotification('No hay datos para exportar', 'error');
        return;
      }

      // Exportar según formato
      switch (format) {
        case 'csv':
          exportToCSV(result.data);
          showNotification(`✅ ${result.data.length} registros exportados a CSV`);
          break;
        case 'json':
          exportToJSON(result.data);
          showNotification(`✅ ${result.data.length} registros exportados a JSON`);
          break;
        case 'excel':
          exportToExcel(result.data);
          showNotification(`✅ ${result.data.length} registros exportados a Excel`);
          break;
        default:
          throw new Error('Formato no válido');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      showNotification(error.message || 'Error al exportar', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleQuickExport = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div style={styles.wrap}>
      {/* Notificación */}
      {notification && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'error' ? styles.notificationError : styles.notificationSuccess)
        }}>
          <CheckIcon />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Exportar Lecturas</h1>
          <p style={styles.subtitle}>Descarga los datos del sensor en múltiples formatos</p>
        </div>
      </div>

      {/* Atajos rápidos */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Atajos Rápidos</h3>
          <span style={styles.cardBadge}>Exportar por período</span>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.quickButtons}>
            <button style={styles.quickBtn} onClick={() => handleQuickExport(1)}>
              Último día
            </button>
            <button style={styles.quickBtn} onClick={() => handleQuickExport(7)}>
              Última semana
            </button>
            <button style={styles.quickBtn} onClick={() => handleQuickExport(30)}>
              Último mes
            </button>
            <button style={styles.quickBtn} onClick={() => handleQuickExport(90)}>
              Últimos 3 meses
            </button>
          </div>
        </div>
      </div>

      {/* Filtros personalizados */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.headerWithIcon}>
            <CalendarIcon />
            <h3 style={styles.cardTitle}>Filtros Personalizados</h3>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.filtersGrid}>
            <div style={styles.filterItem}>
              <label style={styles.label}>
                <CalendarIcon />
                <span>Fecha Inicio</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.filterItem}>
              <label style={styles.label}>
                <CalendarIcon />
                <span>Fecha Fin</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.filterItem}>
              <label style={styles.label}>
                <span>Límite de registros</span>
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={styles.input}
              >
                <option value={100}>100 registros</option>
                <option value={500}>500 registros</option>
                <option value={1000}>1,000 registros</option>
                <option value={5000}>5,000 registros</option>
                <option value={10000}>10,000 registros</option>
                <option value={50000}>50,000 registros</option>
              </select>
            </div>
          </div>

          {startDate && endDate && (
            <div style={styles.dateRange}>
              📅 Exportando desde <strong>{new Date(startDate).toLocaleDateString('es-ES')}</strong> hasta <strong>{new Date(endDate).toLocaleDateString('es-ES')}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Formatos de exportación */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.headerWithIcon}>
            <FileIcon />
            <h3 style={styles.cardTitle}>Formatos de Exportación</h3>
          </div>
          {readings.length > 0 && (
            <span style={styles.cardBadge}>{readings.length} registros listos</span>
          )}
        </div>
        <div style={styles.cardBody}>
          <div style={styles.formatGrid}>
            {/* CSV */}
            <div style={styles.formatCard}>
              <div style={styles.formatIcon}>📄</div>
              <h4 style={styles.formatTitle}>CSV</h4>
              <p style={styles.formatDesc}>
                Formato universal compatible con Excel, Google Sheets y análisis de datos
              </p>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting || isLoading}
                style={{
                  ...styles.exportBtn,
                  ...(exporting || isLoading ? styles.exportBtnDisabled : {})
                }}
              >
                <DownloadIcon />
                {exporting ? 'Exportando...' : 'Descargar CSV'}
              </button>
            </div>

            {/* JSON */}
            <div style={styles.formatCard}>
              <div style={styles.formatIcon}>📦</div>
              <h4 style={styles.formatTitle}>JSON</h4>
              <p style={styles.formatDesc}>
                Formato estructurado ideal para desarrollo y APIs
              </p>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting || isLoading}
                style={{
                  ...styles.exportBtn,
                  ...(exporting || isLoading ? styles.exportBtnDisabled : {})
                }}
              >
                <DownloadIcon />
                {exporting ? 'Exportando...' : 'Descargar JSON'}
              </button>
            </div>

            {/* Excel */}
            <div style={styles.formatCard}>
              <div style={styles.formatIcon}>📊</div>
              <h4 style={styles.formatTitle}>Excel</h4>
              <p style={styles.formatDesc}>
                Archivo .xls listo para abrir directamente en Microsoft Excel
              </p>
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting || isLoading}
                style={{
                  ...styles.exportBtn,
                  ...(exporting || isLoading ? styles.exportBtnDisabled : {})
                }}
              >
                <DownloadIcon />
                {exporting ? 'Exportando...' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div style={styles.infoCard}>
        <h4 style={styles.infoTitle}>ℹ️ Información</h4>
        <ul style={styles.infoList}>
          <li>Los archivos incluyen: ID, Fecha/Hora, Distancia, Profundidad, RSSI, SNR y origen</li>
          <li>El límite máximo recomendado es de 50,000 registros para evitar problemas de memoria</li>
          <li>Los datos se descargan directamente desde el navegador sin envío a servidores</li>
          <li>Si no seleccionas fechas, se exportarán los últimos {limit.toLocaleString()} registros</li>
        </ul>
      </div>
    </div>
  );
}

// Estilos
const styles = {
  wrap: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    color: '#eaeef3',
    background: '#0a0e27',
    minHeight: '100vh'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #60a5fa 0%, #10b981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '0.95rem',
    color: '#9ca3af'
  },
  card: {
    background: '#131a22',
    border: '1px solid #263241',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '24px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #263241',
    background: 'rgba(255, 255, 255, 0.02)'
  },
  headerWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600
  },
  cardBadge: {
    fontSize: '0.75rem',
    padding: '4px 10px',
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    borderRadius: '12px',
    fontWeight: 500
  },
  cardBody: {
    padding: '24px'
  },
  quickButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px'
  },
  quickBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.9rem'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '16px'
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#eaeef3'
  },
  input: {
    padding: '10px 14px',
    background: '#0f1419',
    border: '1px solid #263241',
    borderRadius: '8px',
    color: '#eaeef3',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  dateRange: {
    padding: '12px 16px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#9ca3af'
  },
  formatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  formatCard: {
    padding: '24px',
    background: '#0f1419',
    border: '1px solid #263241',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'all 0.3s'
  },
  formatIcon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  formatTitle: {
    margin: '0 0 8px',
    fontSize: '1.25rem',
    fontWeight: 600
  },
  formatDesc: {
    margin: '0 0 20px',
    fontSize: '0.85rem',
    color: '#9ca3af',
    lineHeight: 1.5
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    transition: 'all 0.2s',
    fontSize: '0.9rem'
  },
  exportBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  infoCard: {
    padding: '20px',
    background: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px'
  },
  infoTitle: {
    margin: '0 0 12px',
    fontSize: '1rem',
    color: '#60a5fa'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#9ca3af',
    fontSize: '0.9rem',
    lineHeight: 1.8
  },
  notification: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    background: '#131a22',
    border: '1px solid #263241',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  notificationSuccess: {
    borderColor: '#10b981'
  },
  notificationError: {
    borderColor: '#ef4444'
  }
};