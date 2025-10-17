// Production rates per building per tick (tick = 10s)
// Keep these in sync with backend/utils/gameUtils.js PRODUCTION_RATES
export const PRODUCTION_RATES = {
  house: {},
  sawmill: { wood: 5, food: -1 },
  quarry: { stone: 8, food: -2 },
  farm: { food: 10, wood: -1 },
  well: { water: 5 },
  clay_pit: { clay: 4 },
  tannery: { leather: 3 },
  coal_mine: { coal: 3 },
  copper_mine: { copper: 3 },
  sheepfold: { wool: 2, food: -1 },
  apiary: { honey: 1 }
  ,
  sastreria: { silk_cloth: 1 }
  ,
  carpinteria: { lumber: 1 },
  fabrica_ladrillos: { baked_brick: 1 },
  bazar_especias: { spice: 1 },
  alfareria: { refined_clay: 1 },
  tintoreria_morada: { purple_dye: 1 },
  herreria: { iron_ingot: 1 },
  salazoneria: { salted: 1 },
  libreria: { books: 1 },
  cerveceria: { beer: 1 },
  forja: { tools: 1 }
  ,
  elixireria: { preservation_elixir: 1 },
  tintoreria_real: { royal_dye: 1 },
  escriba: { illustrated_parchment: 1 },
  artificiero: { explosive_compound: 1 },
  herreria_real: { damascus_steel: 1 },
  lineria: { linen: 1 }
};
