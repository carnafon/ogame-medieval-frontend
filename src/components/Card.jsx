import React from 'react';

export default function Card({ title, description, children }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-300 mb-2">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
