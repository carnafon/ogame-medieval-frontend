import React from 'react';

export default function ResourceDisplay(props) {
  // Aceptar tanto { resources: { wood, stone, food } } como props individuales
  const resources = props.resources || {};
  const wood = typeof props.wood !== 'undefined' ? props.wood : (resources.wood || 0);
  const stone = typeof props.stone !== 'undefined' ? props.stone : (resources.stone || 0);
  const food = typeof props.food !== 'undefined' ? props.food : (resources.food || 0);
  const population = props.population || {};

  return (
    <div className="flex flex-wrap gap-4 mb-4 text-white">
      <div className="bg-gray-800 p-3 rounded shadow flex flex-col items-center w-24">
        <span className="font-bold">Madera</span>
        <span>{wood}</span>
      </div>
      <div className="bg-gray-800 p-3 rounded shadow flex flex-col items-center w-24">
        <span className="font-bold">Piedra</span>
        <span>{stone}</span>
      </div>
      <div className="bg-gray-800 p-3 rounded shadow flex flex-col items-center w-24">
        <span className="font-bold">Comida</span>
        <span>{food}</span>
      </div>
      <div className="bg-gray-800 p-3 rounded shadow flex flex-col items-center w-36">
        <span className="font-bold">Población</span>
        <span>{population.current_population || 0} / {population.max_population || 0}</span>
      </div>
    </div>
  );
}
