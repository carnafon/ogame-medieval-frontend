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

  const mapPixelSize = gridSize * cellSize; // tamaño real del mapa en px

  // 🔹 Ajustar dimensiones del canvas al contenedor
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent.clientWidth;
        const height = parent.clientHeight || width;
        setDimensions({ width, height });

        // Ajuste inicial: encajar el mapa entero en pantalla
        const initialScale = Math.min(width / mapPixelSize, height / mapPixelSize);
        setScale(initialScale);
        setOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, [mapPixelSize]);

  // 🔹 Dibujar mapa + jugadores
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
      ctx.fillStyle = p.is_current_user ? "cyan" : "red";
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(p.username || p.id, px + 5, py - 5);
    });
  }, [players, offset, scale, gridSize, cellSize, dimensions]);

  // 🔹 Pan & Zoom con ratón y táctil
  useEffect(() => {
    const canvas = canvasRef.current;
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    let lastTouchDist = null;

    const clampOffset = (x, y, newScale = scale) => {
      const maxOffsetX = dimensions.width - mapPixelSize * newScale;
      const maxOffsetY = dimensions.height - mapPixelSize * newScale;
      return {
        x: Math.min(0, Math.max(maxOffsetX, x)),
        y: Math.min(0, Math.max(maxOffsetY, y)),
      };
    };

    // 🖱️ Ratón
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
        dimensions.width / cellSize,
        Math.max(Math.min(dimensions.width, dimensions.height) / mapPixelSize, scale * zoom)
      );
      setScale(newScale);
      setOffset((prev) => clampOffset(prev.x, prev.y, newScale));
    };

    // 📱 Touch
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
            dimensions.width / cellSize,
            Math.max(Math.min(dimensions.width, dimensions.height) / mapPixelSize, scale * zoom)
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

    // Eventos
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

  return (
    <div className="w-full h-[80vh] flex justify-center items-center">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 rounded-lg bg-black w-full h-full"
      />
    </div>
  );
}
