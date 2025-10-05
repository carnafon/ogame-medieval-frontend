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

  // 🔹 Mantener offset dentro de los límites del mapa
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

  // 🔹 Ajustar canvas al tamaño del contenedor
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

  // 🔹 Dibujar el mapa y jugadores
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
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

  // 🔹 Panning y Zoom
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
        const newScale = Math.min(3, Math.max(1, prev * zoom)); // 🔒 nunca menor a 1
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

  // 🔹 Centrar mapa en jugador activo
  const centerOnPlayer = () => {
    const player = players.find((p) => p.id === activeId);
    if (!player) return;
    const px = player.x_coord * cellSize + cellSize / 2;
    const py = player.y_coord * cellSize + cellSize / 2;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    setOffset(
      clampOffset(centerX - px * scale, centerY - py * scale, scale)
    );
  };

  return (
    <div className="w-full h-[80vh] relative flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 rounded-lg bg-black w-full h-full"
      />
      <button
        onClick={centerOnPlayer}
        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded shadow"
      >
        Centrar jugador
      </button>
    </div>
  );
}
