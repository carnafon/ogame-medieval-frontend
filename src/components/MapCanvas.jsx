import React, { useRef, useEffect, useState } from "react";

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

  const mapPixelSize = gridSize * cellSize; // tamaño lógico del mapa en px

  // 🔹 Resize responsive + ajuste inicial para encajar el mapa completo
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight || width;
        setDimensions({ width, height });

        const initialScale = Math.min(width / mapPixelSize, height / mapPixelSize);
        setScale(initialScale);
        setOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, [mapPixelSize]);

  // 🔹 Función clamp para que no se salga de la cuadrícula
  const clampOffset = (x, y, newScale = scale) => {
    const maxOffsetX = dimensions.width - mapPixelSize * newScale;
    const maxOffsetY = dimensions.height - mapPixelSize * newScale;
    return {
      x: Math.min(0, Math.max(maxOffsetX, x)),
      y: Math.min(0, Math.max(maxOffsetY, y)),
    };
  };

  // 🔹 Dibujar cuadrícula y jugadores
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;

    for (let x = 0; x <= gridSize; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize * scale + offset.x, offset.y);
      ctx.lineTo(
        x * cellSize * scale + offset.x,
        gridSize * cellSize * scale + offset.y
      );
      ctx.stroke();
    }

    for (let y = 0; y <= gridSize; y++) {
      ctx.beginPath();
      ctx.moveTo(offset.x, y * cellSize * scale + offset.y);
      ctx.lineTo(
        gridSize * cellSize * scale + offset.x,
        y * cellSize * scale + offset.y
      );
      ctx.stroke();
    }

    // Dibujar jugadores
    players.forEach((p) => {
      if (!p) return;

      const px =
        p.x_coord * cellSize * scale + offset.x + (cellSize * scale) / 2;
      const py =
        p.y_coord * cellSize * scale + offset.y + (cellSize * scale) / 2;

      if (isNaN(px) || isNaN(py)) return;

      ctx.beginPath();
      ctx.arc(px, py, (cellSize * scale) / 3, 0, 2 * Math.PI);
      ctx.fillStyle = p.id === activeId ? "cyan" : "red";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(p.username || p.id, px + 5, py - 5);
    });
  }, [players, offset, scale, gridSize, cellSize, dimensions, activeId]);

  // 🔹 Pan & Zoom (ratón + táctil)
  useEffect(() => {
    const canvas = canvasRef.current;
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    let lastTouchDist = null;

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
      const newScale = Math.min(
        3, // máximo zoom ×3
        Math.max(
          Math.min(dimensions.width, dimensions.height) / mapPixelSize, // mínimo: encajar todo
          scale * zoom
        )
      );
      setScale(newScale);
      setOffset((prev) => clampOffset(prev.x, prev.y, newScale));
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastPos.x;
        const dy = e.touches[0].clientY - lastPos.y;
        setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy));
        lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastTouchDist) {
          const zoom = newDist > lastTouchDist ? 1.05 : 0.95;
          const newScale = Math.min(
            3,
            Math.max(
              Math.min(dimensions.width, dimensions.height) / mapPixelSize,
              scale * zoom
            )
          );
          setScale(newScale);
          setOffset((prev) => clampOffset(prev.x, prev.y, newScale));
        }
        lastTouchDist = newDist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      lastTouchDist = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);

      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [scale, dimensions, mapPixelSize, cellSize]);

  // 🔹 Función para centrar en el jugador activo
  const centerOnActive = () => {
    const player = players.find((p) => p.id === activeId);
    if (!player) return;

    const px = player.x_coord * cellSize * scale + (cellSize * scale) / 2;
    const py = player.y_coord * cellSize * scale + (cellSize * scale) / 2;

    const centeredOffset = {
      x: dimensions.width / 2 - px,
      y: dimensions.height / 2 - py,
    };

    setOffset(clampOffset(centeredOffset.x, centeredOffset.y, scale));
  };

  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 rounded-lg bg-black w-full h-full"
      />
      <button
        onClick={centerOnActive}
        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700"
      >
        Centrar jugador
      </button>
    </div>
  );
}
