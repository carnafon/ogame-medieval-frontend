// Category mapping for frontend display
// Categories: common, processed, specialized, strategic

const RESOURCE_CATEGORIES = {
  // comunes (llaves internas esperadas por el backend)
  wood: 'common',
  stone: 'common',
  food: 'common',
  water: 'common',
  clay: 'common',
  leather: 'common',
  coal: 'common',
  copper: 'common',
  wool: 'common',
  honey: 'common',

  // processed (ejemplos)
  lumber: 'processed',
  tools: 'processed',

  // specialized (ejemplos)
  silk: 'specialized',
  spice: 'specialized',

  // strategic (ejemplos)
  iron: 'strategic',
  gold: 'strategic'
};

// Human-friendly labels (español)
const RESOURCE_LABELS = {
  wood: 'Madera',
  stone: 'Piedra',
  food: 'Grano',
  water: 'Agua Dulce',
  clay: 'Arcilla',
  leather: 'Cuero',
  coal: 'Carbón',
  copper: 'Cobre',
  wool: 'Lana',
  honey: 'Miel',

  lumber: 'Madera Procesada',
  tools: 'Herramientas',
  silk: 'Seda',
  spice: 'Especias',
  iron: 'Hierro',
  gold: 'Oro'
};

module.exports = { RESOURCE_CATEGORIES, RESOURCE_LABELS };
