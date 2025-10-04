import React, { useRef, useEffect } from 'react';

// MapGrid: recibe players (array of {id,x,y}), activeId, mapSize (default 100), bgImage optional
export default function MapGrid({ players = [], activeId, mapSize = 100, bgImage = '/spain.jpg', grid = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cellSize = size / mapSize;

    // draw background subtle grid or background image handled by CSS below
    if (grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= mapSize; i += 10) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
      }
    }

    // draw players
    players.forEach(p => {
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
      const cx = (p.x + 0.5) * cellSize;
      const cy = (mapSize - p.y - 0.5) * cellSize;

      const isActive = String(p.id) === String(activeId);

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, cellSize * 0.25), 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#10B981' : '#3B82F6';
      ctx.fill();

      // outline
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.stroke();

      // label for others
      if (!isActive) {
        ctx.font = `${Math.max(10, cellSize * 0.25)}px Inter, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.fillText(String(p.id), cx + Math.max(6, cellSize * 0.15), cy - Math.max(6, cellSize * 0.15));
      }
    });

  }, [players, activeId, mapSize, grid]);

  return (
    <div className="relative w-full h-full">
      {/* background image */}
      <img src={bgImage} alt="Mapa" className="absolute inset-0 w-full h-full object-contain opacity-30 pointer-events-none" />
      <canvas ref={canvasRef} className="relative w-full h-full" />
    </div>
  );
}
