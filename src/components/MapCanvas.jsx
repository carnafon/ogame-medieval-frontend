import React, { useRef, useEffect, useState, useCallback } from "react";

export default function MapCanvas({
  players = [],
  activeId,
  gridSize = 100,
  cellSize = 20,
  onShowDetails = null, // callback(entity)
}) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const mapPixelSize = gridSize * cellSize;
  const legendPadding = 28; // espacio para las coordenadas
  const edgePadding = Math.ceil(cellSize * 0.5); // padding para que celdas en el borde no queden cortadas

  const clampOffset = useCallback(
    (x, y, newScale = scale) => {
      // Considerar padding por leyenda y bordes para que la cuadrícula completa quede visible
      const totalMapW = mapPixelSize * newScale + edgePadding * 2;
      const totalMapH = mapPixelSize * newScale + edgePadding * 2;
      const maxOffsetX = dimensions.width - legendPadding - totalMapW;
      const maxOffsetY = dimensions.height - legendPadding - totalMapH;
      const minX = legendPadding + edgePadding * -1; // allow a bit of negative offset to show prefix
      const minY = legendPadding + edgePadding * -1;

      return {
        x: Math.min(minX, Math.max(maxOffsetX, x)),
        y: Math.min(minY, Math.max(maxOffsetY, y)),
      };
    },
    [scale, dimensions, mapPixelSize, edgePadding]
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
      const py = offset.y + legendPadding + edgePadding + y * cellSize * scale + (cellSize * scale) / 2;
      if (py >= legendPadding && py <= dimensions.height - legendPadding) {
        ctx.fillText(y, legendPadding - 8, py);
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
      const px = offset.x + legendPadding + edgePadding + x * cellSize * scale + (cellSize * scale) / 2;
      if (px >= legendPadding && px <= dimensions.width - legendPadding) {
        ctx.fillText(x, px, legendPadding - 8);
      }
    }
    ctx.restore();

    // ▪ Transformación para el mapa
    ctx.save();
  // Translate including legend and edge padding so cell (0,0) is fully visible
  ctx.translate(offset.x + legendPadding + edgePadding, offset.y + legendPadding + edgePadding);
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
  }, [players, activeId, offset, scale, gridSize, cellSize, dimensions, edgePadding]);

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
     const centerX = dimensions.width / 2 - legendPadding - edgePadding;
     const centerY = dimensions.height / 2 - legendPadding - edgePadding;
     setOffset(clampOffset(centerX - px * scale, centerY - py * scale, scale));
  };

/////////////SELECCIONAR JUGADOR EN EL MAPA//////////


const [selectedPlayer, setSelectedPlayer] = useState(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const handleClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    // Map mouse to map-local coordinates taking into account offset, legend and edge padding
    const mx = (e.clientX - rect.left - offset.x - legendPadding - edgePadding) / scale;
    const my = (e.clientY - rect.top - offset.y - legendPadding - edgePadding) / scale;

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
}, [players, offset, scale, cellSize, legendPadding, edgePadding]);


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
    {selectedPlayer.populations ? (
      <div>
        <div className="font-semibold">Población</div>
        <div className="text-sm">Pobres: {selectedPlayer.populations.poor?.current_population ?? selectedPlayer.current_population ?? 0}/{selectedPlayer.populations.poor?.max_population ?? selectedPlayer.max_population ?? 0}</div>
        <div className="text-sm">Burgueses: {selectedPlayer.populations.burgess?.current_population ?? 0}/{selectedPlayer.populations.burgess?.max_population ?? 0}</div>
        <div className="text-sm">Patricios: {selectedPlayer.populations.patrician?.current_population ?? 0}/{selectedPlayer.populations.patrician?.max_population ?? 0}</div>
      </div>
    ) : (
      <p><strong>Población:</strong> {selectedPlayer.current_population ?? 0}/{selectedPlayer.max_population ?? 0}</p>
    )}

    {onShowDetails && (
      <div className="mt-2">
        <button
          onClick={() => onShowDetails(selectedPlayer.id)}
          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
        >
          Detalles
        </button>
      </div>
    )}
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
