// src/lib/sim.js
import * as turf from '@turf/turf';

/**
 * Calcula zonas de inundación progresivas basadas en niveles del agua
 * @param {Feature} aoi - Área de interés
 * @param {Feature} river - Geometría del río
 * @param {Array} levels - Array de objetos {level: number, width: number}
 * @returns {Array} Array de {level, buffer}
 */
export function calculateFloodZones(aoi, river, levels) {
  if (!river) return [];

  const zones = [];

  for (const { level, width } of levels) {
    try {
      let buffer = turf.buffer(river, width, { units: 'meters' });
      
      // Recortar por AOI si existe
      if (aoi) {
        const clipped = safeIntersect(aoi, buffer);
        if (clipped) buffer = clipped;
      }
      
      zones.push({ level, buffer, width });
    } catch (error) {
      console.warn(`Error creando buffer para nivel ${level}:`, error);
    }
  }

  return zones;
}

/**
 * Interpola la zona de inundación activa según el nivel del agua
 * @param {Array} zones - Array de zonas calculadas
 * @param {number} waterLevel - Nivel actual del agua
 * @returns {Feature|null} Geometría de la zona inundada
 */
export function getActiveFloodZone(zones, waterLevel) {
  if (!zones || zones.length === 0) return null;

  // Encontrar las dos zonas entre las que está el nivel
  let lowerZone = null;
  let upperZone = null;

  for (let i = 0; i < zones.length; i++) {
    if (waterLevel <= zones[i].level) {
      upperZone = zones[i];
      lowerZone = i > 0 ? zones[i - 1] : null;
      break;
    }
  }

  // Si supera todos los niveles, devolver el máximo
  if (!upperZone) {
    return zones[zones.length - 1].buffer;
  }

  // Si está exactamente en un nivel o por debajo del mínimo
  if (!lowerZone || waterLevel === upperZone.level) {
    return upperZone.buffer;
  }

  // Interpolación: devolver la zona superior (más simple)
  // Para interpolación real entre buffers, sería más complejo
  return upperZone.buffer;
}

/**
 * Cuenta cuántas casas están dentro de una zona de inundación
 * @param {FeatureCollection} houses - Colección de puntos (casas)
 * @param {Feature} floodZone - Zona de inundación
 * @returns {number} Cantidad de casas afectadas
 */
export function countAffectedHouses(houses, floodZone) {
  if (!houses || !floodZone) return 0;

  const features = houses.type === 'FeatureCollection'
    ? houses.features
    : [houses];

  // Normalizar el polígono de la zona (buffer puede venir como FeatureCollection)
  const zoneFeature =
    floodZone.type === 'FeatureCollection'
      ? floodZone.features?.[0]
      : floodZone;

  if (!zoneFeature) return 0;

  let count = 0;

  for (const house of features) {
    try {
      if (turf.booleanPointInPolygon(house, zoneFeature)) {
        count++;
      }
    } catch (error) {
      // Ignorar errores de geometría inválida
    }
  }

  return count;
}


/**
 * Calcula estadísticas de casas por nivel de riesgo
 * @param {FeatureCollection} houses - Casas
 * @param {Array} zones - Zonas de inundación
 * @returns {Object} {zone1: number, zone2: number, zone3: number}
 */
export function calculateRiskStats(houses, zones, waterLevel = 0) {
  if (!houses || !zones || zones.length === 0) {
    return { zone1: 0, zone2: 0, zone3: 0 };
  }

  const houseFeatures = houses.type === 'FeatureCollection'
    ? houses.features
    : [houses];

  // Tomamos buffers según el nivel de agua actual
  let smallZone, mediumZone, largeZone;

  if (waterLevel < 1) {
    // Nivel Normal
    smallZone = zones[0]?.buffer; // 3m
    mediumZone = zones[1]?.buffer; // 25m
    largeZone = zones[2]?.buffer; // 50m
  } else if (waterLevel < 2) {
    // Nivel Alerta
    smallZone = zones[1]?.buffer; // 25m
    mediumZone = zones[2]?.buffer; // 50m
    largeZone = zones[3]?.buffer; // 85m
  } else if (waterLevel < 3) {
    // Nivel Evacuación
    smallZone = zones[2]?.buffer; // 50m
    mediumZone = zones[3]?.buffer; // 85m
    largeZone = zones[4]?.buffer; // 120m
  } else {
    // Nivel CRÍTICO - MÁS AGRESIVO que evacuación
    smallZone = zones[2]?.buffer; // 50m - zona roja base
    mediumZone = zones[3]?.buffer; // 85m - zona amarilla (entre 50-85m)
    largeZone = zones[4]?.buffer; // 120m - para detectar casas muy afuera
  }

  const smallPoly =
    smallZone?.type === 'FeatureCollection' ? smallZone.features?.[0] : smallZone;
  const mediumPoly =
    mediumZone?.type === 'FeatureCollection' ? mediumZone.features?.[0] : mediumZone;
  const largePoly =
    largeZone?.type === 'FeatureCollection' ? largeZone.features?.[0] : largeZone;

  const stats = { zone1: 0, zone2: 0, zone3: 0 };

  for (const house of houseFeatures) {
    let inSmall = false;
    let inMediumBand = false;
    let inLargeBand = false;

    try {
      if (smallPoly) {
        inSmall = turf.booleanPointInPolygon(house, smallPoly);
      }
      if (mediumPoly && !inSmall) {
        const inMedium = turf.booleanPointInPolygon(house, mediumPoly);
        inMediumBand = inMedium;
      }
      if (largePoly && !inSmall && !inMediumBand) {
        const inLarge = turf.booleanPointInPolygon(house, largePoly);
        inLargeBand = inLarge;
      }
    } catch {
      // ignorar geometrías raras
    }

    // Clasificación según nivel de agua
    if (waterLevel < 1) {
      // Normal
      if (inSmall) stats.zone2++;
      else stats.zone1++;
    } else if (waterLevel < 2) {
      // Alerta
      if (inSmall) stats.zone3++;
      else if (inMediumBand) stats.zone2++;
      else stats.zone1++;
    } else if (waterLevel < 3) {
      // Evacuación
      if (inSmall) stats.zone3++;
      else if (inMediumBand) stats.zone2++;
      else stats.zone1++;
    } else {
      // CRÍTICO - 0-50m rojo, 50-85m rojo también, 85-120m amarillo
      if (inSmall) stats.zone3++;  // 0-50m = ROJO
      else if (inMediumBand) stats.zone3++;  // 50-85m = ROJO TAMBIÉN (más agresivo)
      else if (inLargeBand) stats.zone2++;  // 85-120m = amarillo
      else stats.zone1++;  // >120m = sin peligro
    }
  }

  return stats;
} 

/**
 * Obtiene el color según el nivel del agua
 * @param {number} level - Nivel del agua
 * @returns {string} Color hexadecimal
 */
export function getFloodColor(level) {
  if (level < 1) return '#60a5fa'; // Azul claro - Normal
  if (level < 2) return '#f59e0b'; // Amarillo - Alerta
  if (level < 3) return '#ef4444'; // Rojo - Evacuación
  return '#991b1b'; // Rojo oscuro - Crítico
}

/**
 * Obtiene el nivel de alerta según el nivel del agua
 * @param {number} level - Nivel del agua
 * @returns {Object} {label, color, description}
 */
export function getAlertLevel(level) {
  if (level < 1) {
    return {
      label: 'Normal',
      color: '#10b981',
      description: 'Nivel normal del río'
    };
  }
  if (level < 2) {
    return {
      label: 'Alerta',
      color: '#f59e0b',
      description: 'Posible inundación menor'
    };
  }
  if (level < 3) {
    return {
      label: 'Evacuación',
      color: '#ef4444',
      description: 'Riesgo alto - Evacuar zonas bajas'
    };
  }
  return {
    label: 'Crítico',
    color: '#991b1b',
    description: '¡EMERGENCIA! Evacuación inmediata'
  };
}

// Funciones auxiliares privadas
function safeIntersect(a, b) {
  try {
    if (!a || !b) return null;
    return turf.intersect(turf.featureCollection([a, b])) || null;
  } catch {
    return null;
  }
}