/* ===========================================================================
   星穹枢庭 · 星门星图 v2（深空仪表盘版）
   ---------------------------------------------------------------------------
   星门不再是画布上的圆点，而是「发光徽章」：
   彩色光环画在 canvas 上，实体星门（图标圆环 + 名称）是 DOM 徽章，
   每个徽章带各自页面的 lucide 图标，点击即跳转。
   背景加一层稳定星尘，节点呼吸发光。
   =========================================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("constellationCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const stage = canvas.closest(".constellation-stage");
  const gateLayer = stage ? stage.querySelector(".constellation-gates") : null;
  if (!gateLayer) return;

  /** 星门与它们的联动关系，与 gate-guide.js 的 GATES 保持一致；icon 对应 lucide 图标名。 */
  const GATES = [
    { slug: "portal", name: "星穹绘所", group: "出图", icon: "images", links: ["nova-anima", "lighting-codex", "wd-tagger", "prompt-reader"] },
    { slug: "wd-tagger", name: "WD 标签反推器", group: "出图", icon: "scan-text", links: ["lust-codex", "cyber-summon", "portal", "prompt-reader"] },
    { slug: "krea2", name: "Krea2 提示词工匠", group: "提示词", icon: "diamond", links: ["prompt-engine", "lighting-codex", "portal", "prompt-reader"] },
    { slug: "prompt-engine", name: "Anima3 灵感魔盒", group: "提示词", icon: "sparkles", links: ["nova-anima", "anima-guide", "lighting-codex", "portal"] },
    { slug: "nova-anima", name: "Nova Anima 起词手册", group: "提示词", icon: "flower-2", links: ["anima-guide", "prompt-engine", "lighting-codex", "portal"] },
    { slug: "anima-guide", name: "Anima 提示词指南", group: "提示词", icon: "book-open-text", links: ["nova-anima", "prompt-engine", "lighting-codex", "portal"] },
    { slug: "lighting-codex", name: "双子星光影魔典", group: "提示词", icon: "sun-medium", links: ["nova-anima", "prompt-engine", "cyber-summon", "portal"] },
    { slug: "cyber-summon", name: "赛博魔典", group: "标签", icon: "braces", links: ["wd-tagger", "lust-codex", "nsfw-tags", "portal"] },
    { slug: "lust-codex", name: "魔典检索", group: "标签", icon: "search-code", links: ["wd-tagger", "cyber-summon", "nsfw-tags", "portal"] },
    { slug: "nsfw-tags", name: "NSFW 标签大全", group: "标签", icon: "list-filter", links: ["cyber-summon", "lust-codex", "wd-tagger", "portal"] },
    { slug: "prompt-reader", name: "Prompt Reader", group: "工具", icon: "file-scan", links: ["wd-tagger", "portal", "cyber-summon", "reverse-showcase"] },
    { slug: "drag-resolver", name: "Drag Resolver", group: "工具", icon: "unplug", links: ["portal", "prompt-reader", "wd-tagger"] },
    { slug: "reverse-showcase", name: "反向破限解构实录", group: "工具", icon: "radar", links: ["portal", "prompt-reader", "wd-tagger", "lighting-codex"] },
    { slug: "moon-scroll", name: "月卷协议", group: "协议", icon: "orbit", links: ["decoder-terminal", "secret-scroll", "portal"] },
    { slug: "decoder-terminal", name: "解码终端", group: "协议", icon: "square-terminal", links: ["moon-scroll", "secret-scroll", "prompt-engine"] },
    { slug: "secret-scroll", name: "密使之札", group: "协议", icon: "scroll-text", links: ["moon-scroll", "decoder-terminal", "portal"] }
  ];

  const GROUPS = [
    { id: "出图", color: "#e8a860" },
    { id: "提示词", color: "#76bba5" },
    { id: "标签", color: "#d77882" },
    { id: "工具", color: "#79aebc" },
    { id: "协议", color: "#a69acb" }
  ];

  const bySlug = new Map(GATES.map((gate) => [gate.slug, gate]));
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const context = canvas.getContext("2d");
  if (!context) return;

  /** 与首页其它动效共用同一个显式开关。 */
  function prefersStill() {
    let override = null;
    try {
      override = localStorage.getItem("xingqiong-motion");
    } catch {
      override = null;
    }
    if (override === "on") return false;
    if (override === "off") return true;
    return motionQuery.matches;
  }

  /** 固定种子随机数，星尘构图每次载入一致。 */
  function createSeededRandom(seed) {
    let value = seed >>> 0;
    return function next() {
      value += 0x6d2b79f5;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 去重后的边。同一对星门互相引用时只画一条线。
  const edges = [];
  const seen = new Set();
  for (const gate of GATES) {
    for (const target of gate.links) {
      if (!bySlug.has(target)) continue;
      const key = [gate.slug, target].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: gate.slug, to: target });
    }
  }

  // 连接数决定星的大小，枢纽星门自然更亮更大
  const degree = new Map(GATES.map((gate) => [gate.slug, 0]));
  for (const edge of edges) {
    degree.set(edge.from, degree.get(edge.from) + 1);
    degree.set(edge.to, degree.get(edge.to) + 1);
  }

  const nodes = new Map();
  let dust = [];
  let width = 0;
  let height = 0;
  let hovered = null;
  let frameId = 0;
  let elapsed = 0;

  /** 重建背景星尘：数量随舞台面积变化，暖冷双色。 */
  function rebuildDust() {
    const random = createSeededRandom(0x5eaf00d);
    const count = Math.min(170, Math.round((width * height) / 8200));
    dust = Array.from({ length: count }, () => ({
      x: random() * width,
      y: random() * height,
      r: 0.4 + random() * 1.3,
      phase: random() * Math.PI * 2,
      warm: random() > 0.82
    }));
  }

  /** 按分类分扇区的放射布局：同类星门聚在一起，位置对每次载入都稳定。 */
  function layout() {
    const centerX = width / 2;
    const centerY = height / 2;
    // 窄屏放大散布半径，避免十六个星门挤成一团
    const radiusX = width * (width < 640 ? 0.38 : 0.3);
    const radiusY = height * (width < 640 ? 0.36 : 0.32);

    GROUPS.forEach((group, groupIndex) => {
      const members = GATES.filter((gate) => gate.group === group.id);
      const sectorCenter = (groupIndex / GROUPS.length) * Math.PI * 2 - Math.PI / 2;
      const sectorWidth = (Math.PI * 2) / GROUPS.length * 0.86;

      members.forEach((gate, memberIndex) => {
        const spread = members.length === 1
          ? 0
          : (memberIndex / (members.length - 1) - 0.5) * sectorWidth;
        const angle = sectorCenter + spread;
        const pull = 1 - Math.min(degree.get(gate.slug), 8) / 16;
        // 窄屏收敛交错幅度，外圈星门不至于贴出舞台边界
        const staggerScale = width < 640 ? 0.6 : 1;
        const stagger = [0, 0.26, -0.14, 0.4, -0.02][memberIndex % 5] * staggerScale;
        const reach = 0.5 + pull * 0.52 + stagger;

        const node = nodes.get(gate.slug);
        node.x = centerX + Math.cos(angle) * radiusX * reach;
        node.y = centerY + Math.sin(angle) * radiusY * reach;
        node.size = 3 + Math.min(degree.get(gate.slug), 8) * 0.8;
        node.phase = (groupIndex * 7 + memberIndex * 13) % 20;
        node.labelAbove = memberIndex % 2 === 1;
      });
    });
  }

  /** 建 DOM 星门徽章：发光圆环 + 页面图标 + 名称。 */
  function buildGates() {
    for (const gate of GATES) {
      const group = GROUPS.find((item) => item.id === gate.group);
      const link = document.createElement("a");
      link.className = "constellation-gate";
      link.href = `${gate.slug}/index.html`;
      link.dataset.slug = gate.slug;
      link.style.setProperty("--gate-color", group.color);

      const ring = document.createElement("span");
      ring.className = "constellation-gate__ring";
      const icon = document.createElement("span");
      icon.className = "constellation-gate__icon";
      const iconElement = document.createElement("i");
      iconElement.dataset.lucide = gate.icon;
      icon.append(iconElement);
      const label = document.createElement("span");
      label.className = "constellation-gate__label";
      label.textContent = gate.name;

      link.append(ring, icon, label);
      gateLayer.append(link);

      const node = nodes.get(gate.slug);
      node.element = link;

      link.addEventListener("pointerenter", () => {
        if (hovered === node) return;
        hovered = node;
        draw();
      });
      link.addEventListener("pointerleave", () => {
        if (hovered !== node) return;
        hovered = null;
        draw();
      });
      link.addEventListener("focus", () => {
        hovered = node;
        draw();
      });
      link.addEventListener("blur", () => {
        if (hovered === node) {
          hovered = null;
          draw();
        }
      });
    }

    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
    }
  }

  function positionGates() {
    for (const node of nodes.values()) {
      node.element.classList.toggle("is-above", node.labelAbove);
      node.element.style.transform =
        `translate(-50%, -50%) translate(${node.x.toFixed(1)}px, ${node.y.toFixed(1)}px)`;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    layout();
    positionGates();
    rebuildDust();
    return true;
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const full = value.length === 3
      ? value.split("").map((char) => char + char).join("")
      : value;
    const number = Number.parseInt(full, 16);
    return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const still = prefersStill();
    const activeSlug = hovered ? hovered.gate.slug : null;
    const activeLinks = hovered ? new Set(hovered.gate.links) : null;

    // ── 星尘背景 ──
    for (const star of dust) {
      const twinkle = still ? 0.5 : 0.5 + 0.5 * Math.sin(elapsed * 0.0011 + star.phase);
      const alpha = 0.1 + 0.26 * twinkle;
      context.fillStyle = star.warm
        ? `rgba(240, 200, 121, ${alpha.toFixed(3)})`
        : `rgba(168, 196, 214, ${alpha.toFixed(3)})`;
      context.fillRect(star.x, star.y, star.r, star.r);
    }

    // ── 连线 ──
    for (const edge of edges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) continue;

      const related = !activeSlug
        || edge.from === activeSlug
        || edge.to === activeSlug;

      const gradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
      const strength = related ? (activeSlug ? 0.55 : 0.15) : 0.03;
      gradient.addColorStop(0, hexToRgba(from.color, strength));
      gradient.addColorStop(1, hexToRgba(to.color, strength));

      context.strokeStyle = gradient;
      context.lineWidth = related && activeSlug ? 1.6 : 0.9;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    // ── 徽章底座光环（徽章 DOM 压在其上）──
    for (const node of nodes.values()) {
      const isActive = activeSlug === node.gate.slug;
      const isNeighbour = activeLinks ? activeLinks.has(node.gate.slug) : false;
      const dimmed = activeSlug && !isActive && !isNeighbour;

      const breathe = still ? 1 : 0.86 + Math.sin(elapsed * 0.0015 + node.phase) * 0.14;
      const haloRadius = node.size * 5.2 * (isActive ? 1.5 : 1) * breathe;
      const alpha = dimmed ? 0.14 : (isActive ? 0.62 : 0.4);

      const halo = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
      halo.addColorStop(0, hexToRgba(node.color, alpha));
      halo.addColorStop(1, hexToRgba(node.color, 0));
      context.fillStyle = halo;
      context.beginPath();
      context.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function tick(timestamp) {
    frameId = 0;
    elapsed = timestamp;
    draw();
    if (!prefersStill() && !document.hidden) frameId = requestAnimationFrame(tick);
  }

  function sync() {
    if (prefersStill() || document.hidden) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      draw();
      return;
    }
    if (!frameId) frameId = requestAnimationFrame(tick);
  }

  // 初始化节点表后再建徽章
  for (const gate of GATES) {
    const group = GROUPS.find((item) => item.id === gate.group);
    nodes.set(gate.slug, { gate, color: group.color, x: 0, y: 0, size: 3, phase: 0, labelAbove: false, element: null });
  }
  buildGates();

  // 画布尚未拿到尺寸时（折叠容器、隐藏标签页）稍后重试
  function start(attemptsLeft) {
    if (resize()) {
      sync();
      return;
    }
    if (attemptsLeft > 0) setTimeout(() => start(attemptsLeft - 1), 250);
  }

  start(12);

  if ("ResizeObserver" in window) {
    let timer = 0;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (resize()) draw();
      }, 160);
    }).observe(canvas);
  }

  window.addEventListener("resize", () => {
    if (resize()) draw();
  }, { passive: true });

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("xq:motionchange", sync);
  motionQuery.addEventListener?.("change", sync);
})();
