import { Home, Factory, Mountain, Soup } from 'lucide-react';

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
    cost: { wood: 40, stone: 10, food: 0 },
    description: 'Produce Comida (+10) cada tick.'
  },
};
