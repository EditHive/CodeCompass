import React, { useRef, useEffect } from 'react';

// ─── Codebase City: Data-Driven Digital Twin ──────────────────────────────────
// Every element on this canvas is derived from real repo analysis data.
// Districts = actual directories, Buildings = actual files, Cars = actual edges.

export default function GraphCanvas({
  graphData,
  selectedNode,
  onNodeSelect,
  impactNodes,
  flowNodes,
}) {
  const canvasRef = useRef(null);
  const mmRef = useRef(null);
  const wrapRef = useRef(null);



  // All mutable animation state lives in a ref to avoid React re‐render overhead.
  const S = useRef({
    W: 0, H: 0,
    cam: { x: 0, y: 0, scale: 1 },
    drag: false, lastMouse: null,
    hoveredBuilding: null,
    animId: null,

    // Processed world data (populated once from graphData)
    districts: [],   // { id, label, x, y, w, h, color, files:[] }
    buildings: [],   // { id, label, district, gx, gy, loc, funcs, classes, imports, score }
    roads: [],       // { srcId, tgtId, type, names, ax, ay, bx, by }
    cars: [],        // { road, t, speed, color }
    landmarks: [],   // { id, label, x, y }

    // Lookup helpers
    buildingById: new Map(),
  });

  // ── STEP 1: Transform graphData into city geometry ──────────────────────────

  useEffect(() => {
    if (!graphData?.nodes?.length) return;
    const s = S.current;
    const { nodes, edges } = graphData;

    // ─── A. Collect only file nodes, group by directory ───────────────────
    const fileNodes = nodes.filter(n => n.type === 'file');
    const folderMap = new Map(); // folderPath -> [node, ...]

    fileNodes.forEach(n => {
      const lastSlash = n.id.lastIndexOf('/');
      const folder = lastSlash > 0 ? n.id.substring(0, lastSlash) : 'root';
      if (!folderMap.has(folder)) folderMap.set(folder, []);
      folderMap.get(folder).push(n);
    });

    // ─── B. Compute degree scores for every file ─────────────────────────
    const inDeg = new Map();
    const outDeg = new Map();
    edges.forEach(e => {
      if (e.type === 'contains') return;
      const src = e.source?.id || e.source;
      const tgt = e.target?.id || e.target;
      outDeg.set(src, (outDeg.get(src) || 0) + 1);
      inDeg.set(tgt, (inDeg.get(tgt) || 0) + 1);
    });
    const score = id => (inDeg.get(id) || 0) + (outDeg.get(id) || 0);

    // Landmark threshold = top 10%
    const scores = fileNodes.map(n => score(n.id)).sort((a, b) => b - a);
    const lmThresh = scores[Math.max(0, Math.floor(scores.length * 0.1))] || 999;

    // ─── C. Layout districts in a grid ───────────────────────────────────
    const folders = Array.from(folderMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([path, files]) => ({ path, files }));

    const COLS = Math.min(5, Math.ceil(Math.sqrt(folders.length)));
    const FILE_W = 110, FILE_H = 60, FILE_GAP = 16;
    const FILES_PER_ROW = 3;
    const HEADER = 36, PAD = 20;
    const DIST_W = PAD * 2 + FILES_PER_ROW * FILE_W + (FILES_PER_ROW - 1) * FILE_GAP;
    const DIST_PAD_X = 50;

    // Slot sizing: each row slot must fit roof + max height + label
    const ROOF_H = 16;                         // roof triangle above building
    const MAX_H_MUL = 1.5;                     // max LOC height multiplier
    const MAX_BLDG_H = FILE_H * MAX_H_MUL;     // tallest possible building = 90px
    const LABEL_H = 22;                        // file name label below building
    const ROW_SLOT = ROOF_H + MAX_BLDG_H + LABEL_H + FILE_GAP; // = 144px per row
    const CONTENT_TOP = HEADER + PAD + 10;     // top of first row inside district

    const COLORS = ['#94a3b8', '#f43f5e', '#22d3ee', '#10b981', '#f59e0b', '#64748b', '#64748b', '#ec4899', '#14b8a6', '#475569'];

    s.districts = [];
    s.buildings = [];
    s.landmarks = [];
    s.buildingById = new Map();

    // Pre-calculate district heights
    const distHeights = folders.map(f => {
      const rowsNeeded = Math.ceil(f.files.length / FILES_PER_ROW);
      return CONTENT_TOP + rowsNeeded * ROW_SLOT + PAD;
    });

    // Compute max height per grid row for uniform alignment
    const rowMaxH = [];
    for (let i = 0; i < folders.length; i++) {
      const row = Math.floor(i / COLS);
      rowMaxH[row] = Math.max(rowMaxH[row] || 0, Math.max(distHeights[i], 180));
    }

    // Compute cumulative Y offsets for each grid row
    const rowY = [60];
    for (let r = 1; r < rowMaxH.length; r++) {
      rowY[r] = rowY[r - 1] + rowMaxH[r - 1] + DIST_PAD_X;
    }

    folders.forEach((f, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);

      const rowsNeeded = Math.ceil(f.files.length / FILES_PER_ROW);
      const distH = Math.max(CONTENT_TOP + rowsNeeded * ROW_SLOT + PAD, 180);

      const dx = 60 + col * (DIST_W + DIST_PAD_X);
      const dy = rowY[row];
      const color = COLORS[idx % COLORS.length];

      const parts = f.path.split('/');
      const label = parts[parts.length - 1] || f.path;

      const district = {
        id: f.path,
        label,
        fullPath: f.path,
        x: dx, y: dy,
        w: DIST_W, h: distH,
        color,
        files: [],
      };

      // Place files inside district
      f.files.forEach((node, fi) => {
        const gx = fi % FILES_PER_ROW;
        const gy = Math.floor(fi / FILES_PER_ROW);

        const b = {
          id: node.id,
          label: node.label,
          district: f.path,
          gx, gy,
          loc: node.loc || 0,
          funcs: node.num_functions || 0,
          classes: node.num_classes || 0,
          imports: node.num_imports || 0,
          score: score(node.id),
          language: node.language || '',
          docstring: node.docstring || '',
        };
        s.buildings.push(b);
        s.buildingById.set(b.id, b);
        district.files.push(b);

        // Landmark?
        if (b.score >= lmThresh && lmThresh > 0) {
          const pos = bldgPos(b, [district]);
          s.landmarks.push({
            id: b.id,
            label: b.label,
            x: pos.cx,
            y: pos.y - 8,
          });
        }
      });

      s.districts.push(district);
    });

    // ─── D. Build roads from real import/call edges between files ─────────
    const depEdges = edges.filter(e => e.type === 'imports' || e.type === 'calls');
    s.roads = [];

    depEdges.forEach(e => {
      const srcId = e.source?.id || e.source;
      const tgtId = e.target?.id || e.target;
      const srcB = s.buildingById.get(srcId);
      const tgtB = s.buildingById.get(tgtId);
      if (!srcB || !tgtB) return;

      const srcD = s.districts.find(d => d.id === srcB.district);
      const tgtD = s.districts.find(d => d.id === tgtB.district);
      if (!srcD || !tgtD) return;

      const sp = bldgPos(srcB, [srcD]);
      const tp = bldgPos(tgtB, [tgtD]);

      s.roads.push({
        srcId, tgtId,
        type: e.type,
        names: e.names || [],
        ax: sp.cx, ay: sp.cy,
        bx: tp.cx, by: tp.cy,
      });
    });

    // ─── E. Spawn cars with semantic coloring ────────────────────────────────
    function getCarColor(road) {
      const tgt = road.tgtId.toLowerCase();
      const isDb = tgt.includes('db') || tgt.includes('database') || tgt.includes('model') || tgt.includes('schema') || tgt.includes('repository');
      const isApi = tgt.includes('api') || tgt.includes('route') || tgt.includes('controller');

      if (isDb) return '#f43f5e'; // rose/red for database traffic
      if (isApi) return '#22d3ee'; // cyan for api traffic
      return road.type === 'imports' ? '#cbd5e1' : '#fbbf24'; // indigo for imports, yellow for standard func calls
    }

    s.cars = s.roads.map((road) => ({
      road,
      t: Math.random(),
      speed: 0.0015 + Math.random() * 0.001,
      color: getCarColor(road),
    }));

    // ─── F. Auto-fit camera ──────────────────────────────────────────────
    if (s.districts.length && s.W > 0) fitCamera(s);

  }, [graphData]);

  // ── Geometry helpers ────────────────────────────────────────────────────────

  function bldgPos(b, districts) {
    const d = districts.find(dd => dd.id === b.district) || S.current.districts.find(dd => dd.id === b.district);
    if (!d) return { x: 0, y: 0, w: 110, h: 60, cx: 55, cy: 30 };

    const FILE_W = 110, FILE_H = 60;
    const ROOF_H = 16;
    const MAX_H_MUL = 1.5;
    const MAX_BLDG_H = FILE_H * MAX_H_MUL;
    const LABEL_H = 22;
    const FILE_GAP = 16;
    const ROW_SLOT = ROOF_H + MAX_BLDG_H + LABEL_H + FILE_GAP;
    const HEADER = 36, PAD = 20;
    const CONTENT_TOP = HEADER + PAD + 10;

    const x = d.x + PAD + b.gx * (FILE_W + FILE_GAP);

    // Each row slot: [ROOF_H | building (variable) | LABEL_H | FILE_GAP]
    // Building bottom is anchored at a fixed position in the slot
    const slotTop = d.y + CONTENT_TOP + b.gy * ROW_SLOT;
    const buildingBottom = slotTop + ROOF_H + MAX_BLDG_H; // fixed bottom line

    // Scale height by LOC (log scale, clamped)
    const hMul = Math.min(MAX_H_MUL, 0.9 + Math.log10(Math.max(b.loc, 1)) * 0.3);
    const h = FILE_H * hMul;

    // Building top = bottom - height (grows upward from fixed bottom)
    const y = buildingBottom - h;

    return { x, y, w: FILE_W, h, cx: x + FILE_W / 2, cy: y + h / 2, d, buildingBottom };
  }

  function fitCamera(s) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    s.districts.forEach(d => {
      minX = Math.min(minX, d.x); minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x + d.w); maxY = Math.max(maxY, d.y + d.h);
    });
    const pad = 60;
    const bW = (maxX - minX) + pad * 2;
    const bH = (maxY - minY) + pad * 2;
    // Zoom in more — show ~60% of the city so it's readable
    const sc = Math.min(s.W / bW, s.H / bH) * 1.35;
    // Center on the top-left quadrant so user sees detail immediately
    const cx = minX + (maxX - minX) * 0.35;
    const cy = minY + (maxY - minY) * 0.35;
    s.cam = {
      x: s.W / 2 - cx * sc,
      y: s.H / 2 - cy * sc,
      scale: sc,
    };
  }

  function quadBezier(ax, ay, bx, by, t) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = Math.min(30, len * 0.12);
    const nx = (-dy / len) * off, ny = (dx / len) * off;
    const cxp = mx + nx, cyp = my + ny;
    const u = 1 - t;
    return {
      x: u * u * ax + 2 * u * t * cxp + t * t * bx,
      y: u * u * ay + 2 * u * t * cyp + t * t * by,
      angle: Math.atan2(
        2 * u * (cyp - ay) + 2 * t * (by - cyp),
        2 * u * (cxp - ax) + 2 * t * (bx - cxp)
      ),
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Canvas render loop ──────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const mm = mmRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !mm || !wrap) return;

    const ctx = canvas.getContext('2d');
    const mctx = mm.getContext('2d');
    const s = S.current;

    function resize() {
      s.W = wrap.clientWidth;
      s.H = wrap.clientHeight;
      canvas.width = s.W;
      canvas.height = s.H;
      if (s.districts.length) fitCamera(s);
    }
    resize();
    window.addEventListener('resize', resize);

    // ─── Interaction ─────────────────────────────────────────────────────
    const onWheel = (ev) => {
      ev.preventDefault();
      const r = wrap.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      const d = ev.deltaY < 0 ? 1.10 : 0.91;
      const ns = Math.max(0.08, Math.min(8, s.cam.scale * d));
      s.cam.x = mx - (mx - s.cam.x) * (ns / s.cam.scale);
      s.cam.y = my - (my - s.cam.y) * (ns / s.cam.scale);
      s.cam.scale = ns;
    };

    const onDown = (ev) => {
      s.drag = true;
      s.lastMouse = { x: ev.clientX, y: ev.clientY };
      wrap.style.cursor = 'grabbing';
    };

    const onMove = (ev) => {
      if (s.drag && s.lastMouse) {
        s.cam.x += ev.clientX - s.lastMouse.x;
        s.cam.y += ev.clientY - s.lastMouse.y;
        s.lastMouse = { x: ev.clientX, y: ev.clientY };
      }
      // Hit test
      const r = wrap.getBoundingClientRect();
      const wx = (ev.clientX - r.left - s.cam.x) / s.cam.scale;
      const wy = (ev.clientY - r.top - s.cam.y) / s.cam.scale;
      let hit = null;
      for (const b of s.buildings) {
        const p = bldgPos(b, s.districts);
        if (wx >= p.x && wx <= p.x + p.w && wy >= p.y && wy <= p.y + p.h) {
          hit = b; break;
        }
      }
      s.hoveredBuilding = hit;
      wrap.style.cursor = s.drag ? 'grabbing' : (hit ? 'pointer' : 'grab');
    };

    const onUp = () => { s.drag = false; };

    const onClick = () => {
      const b = s.hoveredBuilding;
      if (b) {
        onNodeSelect?.(b.id);
      } else {
        onNodeSelect?.(null);
      }
    };

    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    wrap.addEventListener('click', onClick);

    // ─── Animation tick ──────────────────────────────────────────────────
    function tick() {
      s.cars.forEach(c => { c.t = (c.t + c.speed) % 1; });
      draw(ctx, s);
      drawMinimap(mctx, s);
      s.animId = requestAnimationFrame(tick);
    }
    s.animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(s.animId);
      window.removeEventListener('resize', resize);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      wrap.removeEventListener('click', onClick);
    };
  }, [graphData, selectedNode, onNodeSelect]);

  // ── Main draw ───────────────────────────────────────────────────────────────

  function draw(ctx, s) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, s.W, s.H);

    // Background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, s.W, s.H);

    // Apply camera
    ctx.setTransform(s.cam.scale, 0, 0, s.cam.scale, s.cam.x, s.cam.y);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 0.5;
    const worldW = 3000, worldH = 3000;
    for (let x = 0; x < worldW; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, worldH); ctx.stroke(); }
    for (let y = 0; y < worldH; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(worldW, y); ctx.stroke(); }

    // Roads (draw under everything)
    s.roads.forEach(r => drawRoad(ctx, r));

    // Districts
    s.districts.forEach(d => drawDistrict(ctx, d));

    // Buildings
    s.buildings.forEach(b => {
      const hovered = s.hoveredBuilding?.id === b.id;
      const selected = selectedNode === b.id;
      const impacted = impactNodes?.has?.(b.id);
      const inFlow = flowNodes?.has?.(b.id);
      drawBuilding(ctx, b, hovered, selected, impacted, inFlow, s);
    });

    // Landmarks
    s.landmarks.forEach(lm => drawLandmark(ctx, lm));

    // Cars
    s.cars.forEach(car => drawCar(ctx, car));

    // You Are Here pin
    if (selectedNode) {
      const b = s.buildingById.get(selectedNode);
      if (b) {
        const p = bldgPos(b, s.districts);
        drawPin(ctx, p.cx, p.y - 4);
      }
    }
  }

  // ── Rendering primitives ────────────────────────────────────────────────────

  function drawDistrict(ctx, d) {
    // Background fill
    ctx.fillStyle = d.color + '0a';
    ctx.strokeStyle = d.color + '38';
    ctx.lineWidth = 1.5;
    roundRect(ctx, d.x, d.y, d.w, d.h, 10);
    ctx.fill(); ctx.stroke();

    // Header bar
    ctx.fillStyle = d.color + '1a';
    roundRect(ctx, d.x, d.y, d.w, HEADER_H, 10);
    ctx.fill();

    // Label = real directory name (larger, bolder)
    ctx.fillStyle = d.color + 'dd';
    ctx.font = 'bold 12px "SF Mono", "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Show short label prominently
    ctx.fillText(d.label.toUpperCase(), d.x + 12, d.y + HEADER_H / 2);

    // Full path subtitle (dimmer, smaller)
    ctx.fillStyle = d.color + '66';
    ctx.font = '9px monospace';
    ctx.fillText(d.fullPath, d.x + 12, d.y + HEADER_H + 10);

    // File count badge
    ctx.fillStyle = d.color + '44';
    const badge = `${d.files.length} files`;
    const bw = ctx.measureText(badge).width + 12;
    roundRect(ctx, d.x + d.w - bw - 10, d.y + 8, bw, 20, 5);
    ctx.fill();
    ctx.fillStyle = '#fffa';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(badge, d.x + d.w - bw / 2 - 10, d.y + 18);
  }

  const HEADER_H = 36;

  function drawBuilding(ctx, b, hovered, selected, impacted, inFlow, s) {
    const p = bldgPos(b, s.districts);
    const { x, y, w, h, d } = p;
    if (!d) return;

    // Glow for impact/flow
    if (impacted) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
    } else if (inFlow) {
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14;
    }

    // Body
    const bodyColor = selected ? '#1a1f38' : hovered ? '#161b30' : '#111525';
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = selected ? '#ffffffcc' : hovered ? d.color : d.color + '40';
    ctx.lineWidth = selected ? 2.5 : hovered ? 2 : 1;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill(); ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Roof triangle
    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + w / 2, y - 14);
    ctx.lineTo(x + w - 6, y);
    ctx.closePath();
    ctx.fillStyle = d.color + (hovered || selected ? 'bb' : '55');
    ctx.fill();

    // Indicators for functions and classes
    if (b.funcs > 0 || b.classes > 0) {
      ctx.font = 'bold 7px "SF Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const fnText = b.funcs > 0 ? `fn:${b.funcs}` : '';
      const clsText = b.classes > 0 ? `cls:${b.classes}` : '';
      const fnW = fnText ? ctx.measureText(fnText).width : 0;
      const clsW = clsText ? ctx.measureText(clsText).width : 0;
      const gap = (fnW > 0 && clsW > 0) ? 6 : 0;
      const totalW = fnW + clsW + gap;

      let dX = x + w / 2 - totalW / 2;
      if (fnText) {
        ctx.fillStyle = '#22d3eeaa'; // cyan
        ctx.fillText(fnText, dX + fnW / 2, y + 2.5);
        dX += fnW + gap;
      }
      if (clsText) {
        ctx.fillStyle = '#10b981aa'; // emerald
        ctx.fillText(clsText, dX + clsW / 2, y + 2.5);
      }
    }

    // Windows: rows based on LOC, color hints at language
    const winRows = Math.max(1, Math.min(5, Math.ceil(b.loc / 60)));
    const winColor = b.language === 'python' ? '#3b82f655' : b.language === 'javascript' ? '#fbbf2444' : '#1e2a4a';
    ctx.fillStyle = hovered || selected ? '#fbbf2455' : winColor;
    for (let r = 0; r < winRows; r++) {
      const wy = y + 13 + r * 11;
      if (wy + 8 > y + h - 14) break;
      roundRect(ctx, x + 8, wy, 10, 8, 2); ctx.fill();
      roundRect(ctx, x + w / 2 - 5, wy, 10, 8, 2); ctx.fill();
      roundRect(ctx, x + w - 18, wy, 10, 8, 2); ctx.fill();
    }

    // Door
    ctx.fillStyle = d.color + '44';
    roundRect(ctx, x + w / 2 - 5, y + h - 12, 10, 12, 3);
    ctx.fill();

    // File name label (REAL name) — larger and always visible
    ctx.fillStyle = hovered || selected ? '#ffffffee' : '#c8d0e0aa';
    ctx.font = `bold 9px "SF Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(b.label, x + w / 2, y + h + 5);

    // LOC + func badge on hover
    if (hovered || selected) {
      const badgeText = `${b.loc} LOC · ${b.funcs}fn`;
      const tw = ctx.measureText(badgeText).width + 12;
      ctx.fillStyle = '#000c';
      roundRect(ctx, x + w / 2 - tw / 2, y - 26, tw, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(badgeText, x + w / 2, y - 19);
    }
  }

  function drawRoad(ctx, road) {
    const { ax, ay, bx, by, type } = road;

    // Road surface
    ctx.beginPath();
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = Math.min(30, len * 0.12);
    const nx = (-dy / len) * off, ny = (dx / len) * off;
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx + nx, my + ny, bx, by);

    // Asphalt
    ctx.strokeStyle = '#151a28';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Lane markings
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = type === 'imports' ? '#94a3b822' : '#f59e0b18';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.setLineDash([]);

    // Direction arrow at midpoint
    const mid = quadBezier(ax, ay, bx, by, 0.5);
    ctx.save();
    ctx.translate(mid.x, mid.y);
    ctx.rotate(mid.angle);
    ctx.fillStyle = type === 'imports' ? '#94a3b844' : '#f59e0b33';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-3, -3);
    ctx.lineTo(-3, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCar(ctx, car) {
    const { road, t, color } = car;
    const p = quadBezier(road.ax, road.ay, road.bx, road.by, t);

    // Trail
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (let i = 1; i <= 4; i++) {
      const tp = quadBezier(road.ax, road.ay, road.bx, road.by, Math.max(0, t - i * 0.04));
      ctx.lineTo(tp.x, tp.y);
    }
    ctx.strokeStyle = color + '33';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Car body
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = color;
    roundRect(ctx, -6, -3.5, 12, 7, 2);
    ctx.fill();
    // Headlights
    ctx.fillStyle = '#ffffffaa';
    ctx.fillRect(4.5, -2.5, 1.5, 1.5);
    ctx.fillRect(4.5, 1, 1.5, 1.5);
    ctx.restore();
  }

  function drawLandmark(ctx, lm) {
    const now = Date.now();
    const pulse = 1 + Math.sin(now / 600) * 0.15;

    ctx.save();
    ctx.translate(lm.x, lm.y);
    ctx.scale(pulse, pulse);

    // Star
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 0);
    ctx.restore();

    // Label
    ctx.fillStyle = '#f59e0bcc';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lm.label, lm.x, lm.y - 10);
  }

  function drawPin(ctx, cx, cy) {
    const now = Date.now();
    const bob = Math.sin(now / 250) * 2;

    ctx.save();
    ctx.translate(cx, cy - 18 + bob);
    // Pin body
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-6, 0);
    ctx.arc(0, 0, 6, Math.PI, 0);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fff3';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Dot
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    // Radar pulse on ground
    const r = ((now % 1200) / 1200) * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${1 - r / 30})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Minimap ─────────────────────────────────────────────────────────────────

  function drawMinimap(mctx, s) {
    const MW = 140, MH = 100;
    mctx.fillStyle = '#0d1117';
    mctx.fillRect(0, 0, MW, MH);

    if (!s.districts.length) return;

    // Compute world bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    s.districts.forEach(d => {
      minX = Math.min(minX, d.x); minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x + d.w); maxY = Math.max(maxY, d.y + d.h);
    });
    const wW = maxX - minX || 1, wH = maxY - minY || 1;
    const msc = Math.min((MW - 8) / wW, (MH - 8) / wH);
    const ox = 4 - minX * msc, oy = 4 - minY * msc;

    // Districts
    s.districts.forEach(d => {
      mctx.fillStyle = d.color + '33';
      mctx.fillRect(d.x * msc + ox, d.y * msc + oy, d.w * msc, d.h * msc);
    });

    // Cars
    s.cars.forEach(car => {
      const p = quadBezier(car.road.ax, car.road.ay, car.road.bx, car.road.by, car.t);
      mctx.fillStyle = car.color;
      mctx.beginPath();
      mctx.arc(p.x * msc + ox, p.y * msc + oy, 1.2, 0, Math.PI * 2);
      mctx.fill();
    });

    // Viewport rect
    const vx = (-s.cam.x / s.cam.scale) * msc + ox;
    const vy = (-s.cam.y / s.cam.scale) * msc + oy;
    const vw = (s.W / s.cam.scale) * msc;
    const vh = (s.H / s.cam.scale) * msc;
    mctx.strokeStyle = '#ffffff55';
    mctx.lineWidth = 1;
    mctx.strokeRect(vx, vy, vw, vh);
  }

  // ── JSX Layout ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={wrapRef}
      className="w-full h-full relative bg-[#0a0d14] rounded-xl overflow-hidden border border-white/5"
      style={{ cursor: 'grab' }}
    >
      <canvas ref={canvasRef} className="block" />


      {/* HUD: Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'rgba(13,15,26,0.92)',
        border: '1px solid rgba(148, 163, 184,0.18)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 0,
        minWidth: 172,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(148, 163, 184,0.06)',
        userSelect: 'none',
        fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 8, paddingBottom: 8,
          borderBottom: '1px solid rgba(148, 163, 184,0.1)',
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: 4,
            background: 'linear-gradient(135deg,#94a3b8,#334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, color: '#fff', fontWeight: 700,
          }}>P</div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#555870', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            City Legend
          </span>
        </div>

        {/* Nodes section */}
        <div style={{ fontSize: 8.5, fontWeight: 600, color: '#3a3d52', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
          Nodes
        </div>
        {[
          { swatch: { background: 'linear-gradient(135deg,#94a3b8,#64748b)', borderRadius: 4 }, label: 'District (Directory)' },
          { swatch: { background: '#111422', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4 }, label: 'File (Building)' },
          { swatch: { background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 6px rgba(245,158,11,0.5)' }, label: 'Critical Landmark' },
        ].map(({ swatch, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, flexShrink: 0, ...swatch }} />
            <span style={{ fontSize: 9.5, color: '#8b8fa8', fontFamily: "'SF Mono','Fira Code',monospace" }}>{label}</span>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(148, 163, 184,0.08)', margin: '6px 0' }} />

        {/* Traffic section */}
        <div style={{ fontSize: 8.5, fontWeight: 600, color: '#3a3d52', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
          Traffic
        </div>
        {[
          { color: '#f43f5e', glow: 'rgba(244,63,94,0.4)', label: 'Database', shape: 4 },
          { color: '#22d3ee', glow: 'rgba(34,211,238,0.4)', label: 'API', shape: 4 },
          { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Call', shape: 4 },
          { color: '#cbd5e1', glow: 'rgba(203, 213, 225,0.4)', label: 'Import', shape: 4 },
        ].map(({ color, glow, label, shape }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, flexShrink: 0, borderRadius: shape,
              background: color, boxShadow: `0 0 5px ${glow}`,
            }} />
            <span style={{ fontSize: 9.5, color: '#8b8fa8', fontFamily: "'SF Mono','Fira Code',monospace" }}>
              {label} Traffic
            </span>
          </div>
        ))}
      </div>

      {/* ── Zoom Controls ── */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(13,15,26,0.92)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 10,
        padding: '3px 4px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
        userSelect: 'none',
        fontFamily: "'SF Mono','Fira Code',monospace",
      }}>
        {[
          { label: '−', title: 'Zoom Out', action: () => {
            const s = S.current;
            const cx = s.W / 2, cy = s.H / 2;
            const ns = Math.max(0.08, s.cam.scale * 0.8);
            s.cam.x = cx - (cx - s.cam.x) * (ns / s.cam.scale);
            s.cam.y = cy - (cy - s.cam.y) * (ns / s.cam.scale);
            s.cam.scale = ns;
          }},
          { label: '⌂', title: 'Reset View', action: () => {
            const s = S.current;
            if (!s.districts.length || s.W <= 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            s.districts.forEach(d => {
              minX = Math.min(minX, d.x); minY = Math.min(minY, d.y);
              maxX = Math.max(maxX, d.x + d.w); maxY = Math.max(maxY, d.y + d.h);
            });
            const pad = 80;
            const bW = (maxX - minX) + pad * 2;
            const bH = (maxY - minY) + pad * 2;
            const sc = Math.min(s.W / bW, s.H / bH);
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            s.cam = { x: s.W / 2 - cx * sc, y: s.H / 2 - cy * sc, scale: sc };
          }},
          { label: '+', title: 'Zoom In', action: () => {
            const s = S.current;
            const cx = s.W / 2, cy = s.H / 2;
            const ns = Math.min(8, s.cam.scale * 1.25);
            s.cam.x = cx - (cx - s.cam.x) * (ns / s.cam.scale);
            s.cam.y = cy - (cy - s.cam.y) * (ns / s.cam.scale);
            s.cam.scale = ns;
          }},
        ].map(({ label, title, action }) => (
          <button
            key={title}
            title={title}
            onClick={action}
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', borderRadius: 7,
              color: '#8b8fa8', fontSize: label === '⌂' ? 14 : 16, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s ease',
              lineHeight: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
              e.currentTarget.style.color = '#c4c9ff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8b8fa8';
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Minimap HUD ── */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        width: 148,
        background: 'rgba(13,15,26,0.92)',
        border: '1px solid rgba(148, 163, 184,0.18)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(148, 163, 184,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
      }}>
        {/* Minimap header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 9px',
          borderBottom: '1px solid rgba(148, 163, 184,0.1)',
          background: 'rgba(148, 163, 184,0.04)',
        }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#555870', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Minimap
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(148, 163, 184,0.3)' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(34,211,238,0.3)' }} />
          </div>
        </div>

        {/* Canvas */}
        <div style={{ position: 'relative' }}>
          <canvas ref={mmRef} width={148} height={100} style={{ display: 'block' }} />
          {/* corner accent lines */}
          <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid rgba(148, 163, 184,0.4)', borderLeft: '1px solid rgba(148, 163, 184,0.4)' }} />
          <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid rgba(148, 163, 184,0.4)', borderRight: '1px solid rgba(148, 163, 184,0.4)' }} />
          <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid rgba(148, 163, 184,0.4)', borderLeft: '1px solid rgba(148, 163, 184,0.4)' }} />
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid rgba(148, 163, 184,0.4)', borderRight: '1px solid rgba(148, 163, 184,0.4)' }} />
        </div>

        {/* Footer coordinates */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 9px',
          borderTop: '1px solid rgba(148, 163, 184,0.08)',
          background: 'rgba(148, 163, 184,0.02)',
        }}>
          <span style={{
            fontSize: 8.5, color: '#3a3d52', fontFamily: "'SF Mono','Fira Code',monospace",
            letterSpacing: '0.04em',
          }}>
            CITY VIEW v0.9
          </span>
        </div>
      </div>
    </div>
  );
}
