import { Home, Factory, Mountain, Soup, Droplet, Box, Feather, Wind, Zap, Grid } from 'lucide-react';

export const BUILDING_DEFINITIONS = {
  house: { 
    name: 'Casa Simple', 
    icon: Home,
    cost: { wood: 20, stone: 10, food: 5 },
    description: 'Aumenta el límite de población y la moral.',
    category: 'common'
  },
  sawmill: {
    name: 'Aserradero',
    icon: Factory,
    cost: { wood: 50, stone: 30, food: 10 },
    description: 'Produce Madera (+5) y consume Comida cada tick.',
    category: 'common'
  },
  quarry: {
    name: 'Cantera',
    icon: Mountain,
    cost: { wood: 40, stone: 80, food: 15 },
    description: 'Produce Piedra (+8) y consume Comida cada tick.',
    category: 'common'
  },
  farm: {
    name: 'Granja',
    icon: Soup,
    cost: { wood: 40, stone: 10, food: 10 },
    description: 'Produce Comida (+10) cada tick.',
    category: 'common'
  },
  well: {
    name: 'Pozo',
    icon: Droplet,
    cost: { wood: 15, stone: 10 },
    description: 'Provee Agua (+5) por tick.',
    category: 'common'
  },
  clay_pit: {
    name: 'Abarco de Arcilla',
    icon: Box,
    cost: { wood: 20, stone: 20 },
    description: 'Extrae Arcilla (+4) por tick.',
    category: 'common'
  },
  tannery: {
    name: 'Curtiduría',
    icon: Feather,
    cost: { wood: 25, stone: 15, food: 5 },
    description: 'Produce Cuero (+3) por tick.',
    category: 'common'
  },
  coal_mine: {
    name: 'Mina de Carbón',
    icon: Zap,
    cost: { wood: 30, stone: 40 },
    description: 'Extrae Carbón (+3) por tick.',
    category: 'common'
  },
  copper_mine: {
    name: 'Mina de Cobre',
    icon: Grid,
    cost: { wood: 35, stone: 45 },
    description: 'Extrae Cobre (+3) por tick.',
    category: 'common'
  },
  sheepfold: {
    name: 'Corral',
    icon: Wind,
    cost: { wood: 20, stone: 10, food: 5 },
    description: 'Produce Lana (+2) por tick.',
    category: 'common'
  },
  apiary: {
    name: 'Colmenar',
    icon: Box,
    cost: { wood: 15, stone: 5 },
    description: 'Produce Miel (+1) por tick.',
    category: 'common'
  },
  sastreria: {
    name: 'Sastrería',
    icon: Factory,
    cost: { wood: 60, stone: 20, food: 10 },
    description: 'Produce tela de seda (silk_cloth) consumiendo lana, madera y tinte púrpura.',
    category: 'processed'
  }
  ,
  carpinteria: {
    name: 'Carpintería',
    icon: Factory,
    cost: { wood: 40, stone: 20, food: 5 },
    description: 'Procesa Madera para obtener Madera Procesada.',
    category: 'processed'
  },
  fabrica_ladrillos: {
    name: 'Fábrica de Ladrillos',
    icon: Box,
    cost: { wood: 30, stone: 25, food: 5 },
    description: 'Produce Ladrillo Cocido a partir de arcilla y carbón.',
    category: 'processed'
  },
  bazar_especias: {
    name: 'Bazar de Especias',
    icon: Factory,
    cost: { wood: 20, stone: 15, food: 10 },
    description: 'Convierte Grano y Miel en Especias.',
    category: 'processed'
  },
  alfareria: {
    name: 'Alfarería',
    icon: Box,
    cost: { wood: 25, stone: 20, food: 5 },
    description: 'Produce Arcilla Refinada usando agua dulce.',
    category: 'processed'
  },
  tintoreria_morada: {
    name: 'Tintorería Morada',
    icon: Factory,
    cost: { wood: 30, stone: 15, food: 5 },
    description: 'Produce Tintura Púrpura a partir de Lana y Cobre.',
    category: 'processed'
  },
  herreria: {
    name: 'Herrería',
    icon: Factory,
    cost: { wood: 50, stone: 40, food: 10 },
    description: 'Produce Lingote de Hierro usando Cobre y Carbón.',
    category: 'processed'
  },
  salazoneria: {
    name: 'Salazonería',
    icon: Box,
    cost: { wood: 25, stone: 20, food: 5 },
    description: 'Produce productos salazonados usando cuero y piedra.',
    category: 'processed'
  },
  libreria: {
    name: 'Librería',
    icon: Factory,
    cost: { wood: 45, stone: 10, food: 5 },
    description: 'Produce Libros usando Lana y Madera.',
    category: 'processed'
  },
  cerveceria: {
    name: 'Cervecería',
    icon: Factory,
    cost: { wood: 30, stone: 10, food: 10 },
    description: 'Produce Cerveza a partir de Grano y Agua Dulce.',
    category: 'processed'
  },
  forja: {
    name: 'Forja',
    icon: Factory,
    cost: { wood: 40, stone: 30, food: 8 },
    description: 'Produce Herramientas usando Cobre y Madera.',
    category: 'processed'
  }
  ,
  elixireria: {
    name: 'Elixirería',
    icon: Factory,
    cost: { wood: 30, stone: 20, food: 10 },
    description: 'Produce Elixir de Conservación consumiendo Miel y Especias.',
    category: 'specialized'
  },
  tintoreria_real: {
    name: 'Tintorería Real',
    icon: Factory,
    cost: { wood: 35, stone: 20, food: 10 },
    description: 'Produce Tintura Real usando Cobre y Tintura Púrpura.',
    category: 'specialized'
  },
  escriba: {
    name: 'Escriba',
    icon: Box,
    cost: { wood: 20, stone: 10, food: 5 },
    description: 'Produce Pergaminos Ilustrados usando Agua Dulce y Libros.',
    category: 'specialized'
  },
  artificiero: {
    name: 'Artificiero',
    icon: Factory,
    cost: { wood: 45, stone: 30, food: 15 },
    description: 'Produce Compuesto Explosivo usando Carbón y Ladrillo Cocido.',
    category: 'specialized'
  },
  herreria_real: {
    name: 'Herrería Real',
    icon: Factory,
    cost: { wood: 60, stone: 50, food: 15 },
    description: 'Produce Acero de Damasco usando Piedra y Lingotes de Hierro.',
    category: 'specialized'
  },
  lineria: {
    name: 'Linería',
    icon: Factory,
    cost: { wood: 30, stone: 20, food: 8 },
    description: 'Produce Lino a partir de Cuero y Telas de Seda.',
    category: 'specialized'
  }
  ,
  // Strategic buildings
  tintoreria_dorada: {
    name: 'Tintorería Dorada',
    icon: Feather,
    cost: { wood: 60, stone: 40, food: 10 },
    description: 'Consume Lana y telas para producir Tinte Dorado (golden_dye).',
    category: 'strategic'
  },
  herreria_mitica: {
    name: 'Herrería Mítica',
    icon: Factory,
    cost: { wood: 80, stone: 120, food: 20 },
    description: 'Consume Piedra y Lingotes para producir Hierro Raro (rare_iron).',
    category: 'strategic'
  },
  salinas: {
    name: 'Salinas',
    icon: Droplet,
    cost: { wood: 30, stone: 20, food: 50 },
    description: 'Consume Grano y cerveza para producir Sal Marina (sea_salt).',
    category: 'strategic'
  },
  mina_azufre: {
    name: 'Mina de Azufre',
    icon: Zap,
    cost: { wood: 50, stone: 70, food: 10 },
    description: 'Consume Carbón y compuestos para crear Azufre (sulfur).',
    category: 'strategic'
  },
  mina_gemas: {
    name: 'Mina de Gemas',
    icon: Grid,
    cost: { wood: 90, stone: 150, food: 20 },
    description: 'Consume Cobre y catalizadores para crear Gemas (gems).',
    category: 'strategic'
  },
  telar_real: {
    name: 'Telar Real',
    icon: Box,
    cost: { wood: 70, stone: 30, food: 15 },
    description: 'Consume Miel, salazón y lino para producir Seda Real (royal_silk).',
    category: 'strategic'
  }
};
