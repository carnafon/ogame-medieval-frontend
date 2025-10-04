import React, { useRef, useEffect, useState } from 'react';

// MapGrid: recibe players (array of {id,x,y}), activeId, mapSize (default 100), bgImage optional
export default function MapGrid({ players = [], activeId, mapSize = 100, bgImage = '/spain.jpg', grid = true, fillCells = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [hover, setHover] = useState(null); // {id,x,y,screenX,screenY}

  // Calcular tamaño del canvas y escalar por DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      try {
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        const dpr = window.devicePixelRatio || 1;
        // protect against zero-size
        if (size <= 0) return;
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      } catch (e) {
        // swallow any transient errors (e.g., canvas not ready)
        // we'll attempt a safe redraw later
      }
    };

    let ro;
    try {
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(resize);
        ro.observe(container);
      } else {
        // fallback: listen to window resize
        window.addEventListener('resize', resize);
      }
    } catch (e) {
      // fallback to window resize if ResizeObserver throws
      window.addEventListener('resize', resize);
    }

    // Initial attempt to resize; if container is 0-sized, retry once shortly after
    resize();
    const retryId = setTimeout(resize, 150);

    return () => {
      if (ro && ro.disconnect) ro.disconnect();
      window.removeEventListener('resize', resize);
      clearTimeout(retryId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drawing routine
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const safeMapSize = (typeof mapSize === 'number' && mapSize > 0) ? mapSize : 100;
    const cellSize = size / safeMapSize;

    // DEBUG: help troubleshooting when nothing appears
    // eslint-disable-next-line no-console
    console.debug('[MapGrid] draw:', { playersCount: Array.isArray(players) ? players.length : 0, mapSize: safeMapSize, size, cellSize });

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Optional grid
    if (grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= mapSize; i += 10) {
        const pos = i * cellSize;
        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(size, pos); ctx.stroke();
      }
    }

    // Draw players
    if (fillCells) {
      // Draw each player as a filled cell (sized to cellSize)
      players.forEach(p => {
        if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        if (px < 0 || py < 0 || px >= mapSize || py >= mapSize) return;
        const x = px * cellSize;
        const y = (mapSize - py - 1) * cellSize; // invert Y to keep origin bottom-left

        // background for cell
        ctx.fillStyle = String(p.id) === String(activeId) ? '#10B981' : '#3B82F6';
        ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, cellSize - 1), Math.max(1, cellSize - 1));

        // optional id text when cell is large enough
        if (cellSize > 12) {
          ctx.font = `${Math.max(9, cellSize * 0.22)}px Inter, sans-serif`;
          ctx.fillStyle = 'white';
          ctx.fillText(String(p.id), x + 4, y + 12);
        }
      });
    } else {
      players.forEach(p => {
        if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
        const cx = (p.x + 0.5) * cellSize;
        const cy = (mapSize - p.y - 0.5) * cellSize;
        const isActive = String(p.id) === String(activeId);
        const r = Math.max(3, cellSize * 0.28);

        // shadow / outline
        ctx.beginPath(); ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

        // fill
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = isActive ? '#10B981' : '#3B82F6'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();

        // id label
        if (!isActive) {
          ctx.font = `${Math.max(9, cellSize * 0.22)}px Inter, sans-serif`;
          ctx.fillStyle = 'white';
          ctx.fillText(String(p.id), cx + r + 4, cy - r - 4);
        }
      });
    }
  };

  // Redraw on players change
  useEffect(() => {
    // Use rAF for smoother draws
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => draw());
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, activeId, mapSize, grid]);

  // Mouse move: detect hover over players
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.min(rect.width, rect.height);
      const cellSize = size / mapSize;

      // hit test players
      let found = null;
      for (const p of players) {
        if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
        const cx = (p.x + 0.5) * cellSize;
        const cy = (mapSize - p.y - 0.5) * cellSize;
        const dx = x - cx; const dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < Math.max(6, cellSize * 0.28)) { found = { ...p, screenX: e.clientX, screenY: e.clientY }; break; }
      }
      if (found) setHover(found); else setHover(null);
    };

    const onLeave = () => setHover(null);
    // Attach listeners safely
    try {
      container.addEventListener('mousemove', onMove);
      container.addEventListener('mouseleave', onLeave);
    } catch (e) {
      // ignore attach errors
    }
    return () => {
      try { container.removeEventListener('mousemove', onMove); } catch (e) {}
      try { container.removeEventListener('mouseleave', onLeave); } catch (e) {}
    };
  }, [players, mapSize]);

    return (
    <div ref={containerRef} className="relative w-full h-full bg-transparent">
      <img src={bgImage} alt="Mapa" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.32, pointerEvents: 'none', zIndex: 0 }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }} />
      {hover && (
        <div style={{ position: 'fixed', left: hover.screenX + 12, top: hover.screenY + 12, background: 'rgba(0,0,0,0.75)', color:'white', padding: '6px 8px', borderRadius:8, pointerEvents:'none', zIndex:50 }}>
          <div className="text-sm font-semibold">{hover.id}</div>
          <div className="text-xs">x: {hover.x} y: {hover.y}</div>
        </div>
      )}
    </div>
  );
}
