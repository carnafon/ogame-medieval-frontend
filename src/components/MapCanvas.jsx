import React, { useRef, useEffect, useState, useCallback } from "react";

export default function MapCanvas({
  players = [],
  activeId,
  gridSize = 100,
  cellSize = 20,
}) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const mapPixelSize = gridSize * cellSize;
  const legendPadding = 20; // espacio para las coordenadas

  const clampOffset = useCallback(
    (x, y, newScale = scale) => {
      const maxOffsetX = dimensions.width - mapPixelSize * newScale;
      const maxOffsetY = dimensions.height - mapPixelSize * newScale;
      return {
        x: Math.min(0, Math.max(maxOffsetX, x)),
        y: Math.min(0, Math.max(maxOffsetY, y)),
      };
    },
    [scale, dimensions, mapPixelSize]
  );

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight || width;
        setDimensions({ width, height });
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ▪ Dibujar leyendas Y (izquierda)
    ctx.save();
    ctx.font = `${12 / scale}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let y = 0; y < gridSize; y++) {
      const py = offset.y + y * cellSize * scale + (cellSize * scale) / 2;
      if (py >= legendPadding && py <= dimensions.height) {
        ctx.fillText(y, legendPadding - 5, py);
      }
    }
    ctx.restore();

    // ▪ Dibujar leyendas X (arriba)
    ctx.save();
    ctx.font = `${12 / scale}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    for (let x = 0; x < gridSize; x++) {
      const px = offset.x + x * cellSize * scale + (cellSize * scale) / 2;
      if (px >= legendPadding && px <= dimensions.width) {
        ctx.fillText(x, px, legendPadding - 5);
      }
    }
    ctx.restore();

    // ▪ Transformación para el mapa
    ctx.save();
    ctx.translate(offset.x + legendPadding, offset.y + legendPadding);
    ctx.scale(scale, scale);

    // Dibujar cuadrícula
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1 / scale;
    for (let x = 0; x <= gridSize; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, gridSize * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= gridSize; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(gridSize * cellSize, y * cellSize);
      ctx.stroke();
    }

    // Dibujar jugadores
    players.forEach((p) => {
      if (!p) return;
      const px = p.x_coord * cellSize + cellSize / 2;
      const py = p.y_coord * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(px, py, cellSize / 3, 0, 2 * Math.PI);
      ctx.fillStyle = p.id === activeId ? "cyan" : "red";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.fillText(p.username || p.id, px + 5, py - 5);
    });

    ctx.restore();
  }, [players, activeId, offset, scale, gridSize, cellSize, dimensions]);

  // ▪ Panning y Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy));
      lastPos = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => (isDragging = false);

    const onWheel = (e) => {
      e.preventDefault();
      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((prev) => {
        const newScale = Math.min(3, Math.max(1, prev * zoom));
        return newScale;
      });
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [clampOffset]);

  const centerOnPlayer = () => {
    const player = players.find((p) => p.id === activeId);
    if (!player) return;
    const px = player.x_coord * cellSize + cellSize / 2;
    const py = player.y_coord * cellSize + cellSize / 2;
    const centerX = dimensions.width / 2 - legendPadding;
    const centerY = dimensions.height / 2 - legendPadding;
    setOffset(clampOffset(centerX - px * scale, centerY - py * scale, scale));
  };

/////////////SELECCIONAR JUGADOR EN EL MAPA//////////


const [selectedPlayer, setSelectedPlayer] = useState(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const handleClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x - legendPadding) / scale;
    const my = (e.clientY - rect.top - offset.y - legendPadding) / scale;

    // Buscar jugador en esa celda
    const player = players.find(p => {
      const px = p.x_coord * cellSize;
      const py = p.y_coord * cellSize;
      return (
        mx >= px && mx < px + cellSize &&
        my >= py && my < py + cellSize
      );
    });

    setSelectedPlayer(player || null);
  };

  canvas.addEventListener('click', handleClick);
  return () => canvas.removeEventListener('click', handleClick);
}, [players, offset, scale, cellSize, legendPadding]);


///_---------------------------------///////////

  return (
    <div className="w-full h-[80vh] relative flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 rounded-lg bg-black w-full h-full"
      />
      {selectedPlayer && (
  <div className="absolute bg-gray-900 text-white p-2 rounded shadow-lg">
    <p><strong>Usuario:</strong> {selectedPlayer.username || selectedPlayer.name || selectedPlayer.id}</p>
    <p><strong>Facción:</strong> {selectedPlayer.faction_name || 'N/A'}</p>
    <p><strong>Recursos:</strong> 
      
        <>
          <div> Madera: {selectedPlayer.wood ?? 0}</div>
          <div> Piedra: {selectedPlayer.stone ?? 0}</div>
          <div> Comida: {selectedPlayer.food ?? 0}</div>
        </>
      
    </p>
    <p><strong>Población:</strong> {selectedPlayer.current_population ?? 0}/{selectedPlayer.max_population ?? 0}</p>
  </div>
)}
      <button
        onClick={centerOnPlayer}
        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded shadow"
      >
        Centrar jugador
      </button>
    </div>
  );
}
