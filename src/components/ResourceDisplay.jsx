import React from 'react';

export default function ResourceDisplay({ wood = 0, stone = 0, food = 0, population = {} }) {
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
