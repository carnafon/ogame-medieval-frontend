import React, { useRef, useEffect, useState } from "react";

export default function MapCanvas({ players = [], activeId, gridSize = 100, cellSize = 20 }) {
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
   
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar cuadrícula
      ctx.strokeStyle = "#444";
      for (let x = 0; x <= gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize * scale + offset.x, 0 + offset.y);
        ctx.lineTo(x * cellSize * scale + offset.x, gridSize * cellSize * scale + offset.y);
        ctx.stroke();
      }
      for (let y = 0; y <= gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0 + offset.x, y * cellSize * scale + offset.y);
        ctx.lineTo(gridSize * cellSize * scale + offset.x, y * cellSize * scale + offset.y);
        ctx.stroke();
      }
     
      // Dibujar jugadores
      (players).forEach((p) => {
        if (!p) return;
        const px = p.x_coord  * cellSize * scale + offset.x + (cellSize * scale) / 2;
        const py = p.y_coord  * cellSize * scale + offset.y  + (cellSize * scale) / 2;
        console.log("coorrdenada", px,py,p.id,p.x_coord,p.y_coord);
        let jugActivo = p.id;
        if(p.is_current_user === false)
          {jugActivo=0;}
        ctx.beginPath();
        ctx.arc(px, py, (cellSize * scale) / 3, 0, 2 * Math.PI);
        ctx.fillStyle = p.id === jugActivo ? "cyan" : "red";
        ctx.fill();

        // Nombre del jugador
        ctx.fillStyle = "white";
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.fillText(p.username || p.id, px + 5, py - 5);
      });
    };

    draw();
  }, [players, offset, scale, gridSize, cellSize, activeId]);

  // Panning + zoom
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
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="border border-gray-500 rounded-lg bg-black"
    />
  );
}


