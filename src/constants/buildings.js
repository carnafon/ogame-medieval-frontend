import { Home, Factory, Mountain, Soup, Droplet, Box, Feather, Wind, Zap, Tool, Grid } from 'lucide-react';

export const BUILDING_DEFINITIONS = {
  house: { 
    name: 'Casa Simple', 
    icon: Home,
    cost: { wood: 20, stone: 10, food: 5 },
    description: 'Aumenta el límite de población y la moral.' 
  },
  sawmill: {
    name: 'Aserradero',
    icon: Factory,
    cost: { wood: 50, stone: 30, food: 10 },
    description: 'Produce Madera (+5) y consume Comida cada tick.'
  },
  quarry: {
    name: 'Cantera',
    icon: Mountain,
    cost: { wood: 40, stone: 80, food: 15 },
    description: 'Produce Piedra (+8) y consume Comida cada tick.'
  },
  farm: {
    name: 'Granja',
    icon: Soup,
    cost: { wood: 40, stone: 10, food: 10 },
    description: 'Produce Comida (+10) cada tick.'
  },
  well: {
    name: 'Pozo',
    icon: Droplet,
    cost: { wood: 15, stone: 10 },
    description: 'Provee Agua (+5) por tick.'
  },
  clay_pit: {
    name: 'Abarco de Arcilla',
    icon: Box,
    cost: { wood: 20, stone: 20 },
    description: 'Extrae Arcilla (+4) por tick.'
  },
  tannery: {
    name: 'Curtiduría',
    icon: Feather,
    cost: { wood: 25, stone: 15, food: 5 },
    description: 'Produce Cuero (+3) por tick.'
  },
  coal_mine: {
    name: 'Mina de Carbón',
    icon: Zap,
    cost: { wood: 30, stone: 40 },
    description: 'Extrae Carbón (+3) por tick.'
  },
  copper_mine: {
    name: 'Mina de Cobre',
    icon: Grid,
    cost: { wood: 35, stone: 45 },
    description: 'Extrae Cobre (+3) por tick.'
  },
  sheepfold: {
    name: 'Corral',
    icon: Wind,
    cost: { wood: 20, stone: 10, food: 5 },
    description: 'Produce Lana (+2) por tick.'
  },
  apiary: {
    name: 'Colmenar',
    icon: Tool,
    cost: { wood: 15, stone: 5 },
    description: 'Produce Miel (+1) por tick.'
  },
};
