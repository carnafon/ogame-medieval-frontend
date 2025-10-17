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
};
