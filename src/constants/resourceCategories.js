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
  iron_ingot: 'processed',
  beer: 'processed',
  baked_brick: 'processed',
  textile: 'processed',
  silk_cloth: 'processed',
  salted: 'processed',
  refined_clay: 'processed',
  books: 'processed',
  purple_dye: 'processed',

  // specialized (ejemplos)
  
  spice: 'specialized',
  damascus_steel: 'specialized',
  preservation_elixir: 'specialized',
  explosive_compound: 'specialized',
  royal_dye: 'specialized',
  illustrated_parchment: 'specialized',
  magic_catalyst: 'specialized',

  // strategic (ejemplos)

  gold: 'strategic',
  // recursos estratégicos añadidos por el usuario
  rare_iron: 'strategic',
  sea_salt: 'strategic',
  linen: 'strategic',
  gold_dye: 'strategic',
  sulfur: 'strategic',
  precious_gems: 'strategic',
  silk: 'strategic'
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
// etiquetas en español para recursos procesados añadidos
  lumber: 'Madera Procesada',
  tools: 'Herramientas',
  iron_ingot: 'Lingote de Hierro',
  beer: 'Cerveza',
  baked_brick: 'Ladrillo Cocido',
  textile: 'Textil',
  silk_cloth: 'Telas de Seda',
  salted: 'Salazonado',
  refined_clay: 'Barro Refinado',
  books: 'Libros',
  purple_dye: 'Tintura Púrpura',
  silk: 'Seda',
  spice: 'Especias',

  //etiquetas en español para recursos especializados añadidos
  damascus_steel: 'Acero de Damasco',
  preservation_elixir: 'Elixir de Conservación',
  explosive_compound: 'Compuesto Explosivo',
  royal_dye: 'Tintura Real',
  illustrated_parchment: 'Pergaminos Ilustrados',
  magic_catalyst: 'Catalizador Mágico',
  gold: 'Oro'
  ,
  // etiquetas en español para recursos estratégicos añadidos
  rare_iron: 'Hierro Raro',
  sea_salt: 'Sal Marina',
  linen: 'Lino',
  gold_dye: 'Tinte Dorado',
  sulfur: 'Azufre',
  precious_gems: 'Gemas Preciosas'
};

module.exports = { RESOURCE_CATEGORIES, RESOURCE_LABELS };
