import React, { useRef, useEffect, useState } from "react";

export default function MapCanvas({ players = [], activeId, gridSize = 100, cellSize = 20 }) {
  const canvasRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // 🔹 Responsive resize
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight || width; // cuadrado si no hay altura
        setDimensions({ width, height });
      }
    };
    window.addEventListener("resize", resize);
    resize(); // inicial
    return () => window.removeEventListener("resize", resize);
  }, []);

  // 🔹 Dibujar mapa + jugadores
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Ajustar tamaño real del canvas
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;

    for (let x = 0; x <= gridSize; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize * scale + offset.x, offset.y);
      ctx.lineTo(x * cellSize * scale + offset.x, gridSize * cellSize * scale + offset.y);
      ctx.stroke();
    }

    for (let y = 0; y <= gridSize; y++) {
      ctx.beginPath();
      ctx.moveTo(offset.x, y * cellSize * scale + offset.y);
      ctx.lineTo(gridSize * cellSize * scale + offset.x, y * cellSize * scale + offset.y);
      ctx.stroke();
    }

    // Dibujar jugadores
    players.forEach((p) => {
      if (!p) return;

      const px = p.x_coord * cellSize * scale + offset.x + (cellSize * scale) / 2;
      const py = p.y_coord * cellSize * scale + offset.y + (cellSize * scale) / 2;

      // Si px o py son NaN -> log
      if (isNaN(px) || isNaN(py)) {
        console.warn("⚠ Coordenada inválida:", p, { px, py });
        return;
      }

      ctx.beginPath();
      ctx.arc(px, py, (cellSize * scale) / 3, 0, 2 * Math.PI);
      ctx.fillStyle = p.is_current_user ? "cyan" : "red";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(p.username || p.id, px + 5, py - 5);
    });
  }, [players, offset, scale, gridSize, cellSize, dimensions]);

  // 🔹 Pan & zoom
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
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => (isDragging = false);

    const onWheel = (e) => {
      e.preventDefault();
      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((prev) => Math.min(3, Math.max(0.5, prev * zoom)));
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
  }, []);

  return (
    <div className="w-full h-[80vh] flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 rounded-lg bg-black w-full h-full"
      />
    </div>
  );
}
