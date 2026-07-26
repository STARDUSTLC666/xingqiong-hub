/* ===========================================================================
   星穹枢庭 · 星门星图
   ---------------------------------------------------------------------------
   把「哪个星门能联动到哪个」画成一张星图。这份关系数据本来只存在于
   assets/gate-guide.js 的逐页说明里，访客一次只能看到一页；聚成全局视图
   才看得出整个站点的结构。
   画布只是增强层，真正可访问的内容是同一份数据渲染出的链接列表。
   =========================================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("constellationCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  /** 星门与它们的联动关系，与 gate-guide.js 的 GATES 保持一致。 */
  const GATES = [
    { slug: "portal", name: "星穹绘所", group: "出图", links: ["nova-anima", "lighting-codex", "wd-tagger", "prompt-reader"] },
    { slug: "wd-tagger", name: "WD 标签反推器", group: "出图", links: ["lust-codex", "cyber-summon", "portal", "prompt-reader"] },
    { slug: "krea2", name: "Krea2 提示词工匠", group: "提示词", links: ["prompt-engine", "lighting-codex", "portal", "prompt-reader"] },
    { slug: "prompt-engine", name: "Anima3 灵感魔盒", group: "提示词", links: ["nova-anima", "anima-guide", "lighting-codex", "portal"] },
    { slug: "nova-anima", name: "Nova Anima 起词手册", group: "提示词", links: ["anima-guide", "prompt-engine", "lighting-codex", "portal"] },
    { slug: "anima-guide", name: "Anima 提示词指南", group: "提示词", links: ["nova-anima", "prompt-engine", "lighting-codex", "portal"] },
    { slug: "lighting-codex", name: "双子星光影魔典", group: "提示词", links: ["nova-anima", "prompt-engine", "cyber-summon", "portal"] },
    { slug: "cyber-summon", name: "赛博魔典", group: "标签", links: ["wd-tagger", "lust-codex", "nsfw-tags", "portal"] },
    { slug: "lust-codex", name: "魔典检索", group: "标签", links: ["wd-tagger", "cyber-summon", "nsfw-tags", "portal"] },
    { slug: "nsfw-tags", name: "NSFW 标签大全", group: "标签", links: ["cyber-summon", "lust-codex", "wd-tagger", "portal"] },
    { slug: "prompt-reader", name: "Prompt Reader", group: "工具", links: ["wd-tagger", "portal", "cyber-summon", "reverse-showcase"] },
    { slug: "drag-resolver", name: "Drag Resolver", group: "工具", links: ["portal", "prompt-reader", "wd-tagger"] },
    { slug: "reverse-showcase", name: "反向破限解构实录", group: "工具", links: ["portal", "prompt-reader", "wd-tagger", "lighting-codex"] },
    { slug: "moon-scroll", name: "月卷协议", group: "协议", links: ["decoder-terminal", "secret-scroll", "portal"] },
    { slug: "decoder-terminal", name: "解码终端", group: "协议", links: ["moon-scroll", "secret-scroll", "prompt-engine"] },
    { slug: "secret-scroll", name: "密使之札", group: "协议", links: ["moon-scroll", "decoder-terminal", "portal"] }
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
  let width = 0;
  let height = 0;
  let hovered = null;
  let frameId = 0;
  let elapsed = 0;

  /** 按分类分扇区的放射布局：同类星门聚在一起，位置对每次载入都稳定。 */
  function layout() {
    const centerX = width / 2;
    const centerY = height / 2;
    // 画布通常很宽，横纵分别取半径才能把整块铺满而不是缩在中间
    const radiusX = width * 0.3;
    const radiusY = height * 0.32;

    GROUPS.forEach((group, groupIndex) => {
      const members = GATES.filter((gate) => gate.group === group.id);
      const sectorCenter = (groupIndex / GROUPS.length) * Math.PI * 2 - Math.PI / 2;
      const sectorWidth = (Math.PI * 2) / GROUPS.length * 0.86;

      members.forEach((gate, memberIndex) => {
        const spread = members.length === 1
          ? 0
          : (memberIndex / (members.length - 1) - 0.5) * sectorWidth;
        const angle = sectorCenter + spread;
        // 连接多的往内圈放，视觉上更像枢纽
        const pull = 1 - Math.min(degree.get(gate.slug), 8) / 16;
        // 同簇成员在半径方向交错，否则五个节点挤在一段弧上标签必然重叠
        const stagger = [0, 0.26, -0.14, 0.4, -0.02][memberIndex % 5];
        const reach = 0.5 + pull * 0.52 + stagger;

        nodes.set(gate.slug, {
          gate,
          color: group.color,
          x: centerX + Math.cos(angle) * radiusX * reach,
          y: centerY + Math.sin(angle) * radiusY * reach,
          size: 3 + Math.min(degree.get(gate.slug), 8) * 0.8,
          phase: (groupIndex * 7 + memberIndex * 13) % 20,
          // 同簇内上下交错放标签，密集处才不会叠在一起
          labelAbove: memberIndex % 2 === 1
        });
      });
    });
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
    return true;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const still = prefersStill();
    const activeSlug = hovered && hovered.gate.slug;
    const activeLinks = hovered ? new Set(hovered.gate.links) : null;

    // 先画连线，星点压在上面
    for (const edge of edges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) continue;

      const related = !activeSlug
        || edge.from === activeSlug
        || edge.to === activeSlug;

      const gradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
      const strength = related ? (activeSlug ? 0.5 : 0.16) : 0.03;
      gradient.addColorStop(0, hexToRgba(from.color, strength));
      gradient.addColorStop(1, hexToRgba(to.color, strength));

      context.strokeStyle = gradient;
      context.lineWidth = related && activeSlug ? 1.4 : 0.8;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    for (const node of nodes.values()) {
      const isActive = activeSlug === node.gate.slug;
      const isNeighbour = activeLinks ? activeLinks.has(node.gate.slug) : false;
      const dimmed = activeSlug && !isActive && !isNeighbour;

      const twinkle = still ? 1 : 0.82 + Math.sin(elapsed * 0.0016 + node.phase) * 0.18;
      const size = node.size * (isActive ? 1.6 : 1) * twinkle;
      const alpha = dimmed ? 0.22 : 1;

      const halo = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 5);
      halo.addColorStop(0, hexToRgba(node.color, 0.55 * alpha));
      halo.addColorStop(1, hexToRgba(node.color, 0));
      context.fillStyle = halo;
      context.beginPath();
      context.arc(node.x, node.y, size * 5, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = hexToRgba("#fff6e2", alpha);
      context.beginPath();
      context.arc(node.x, node.y, size, 0, Math.PI * 2);
      context.fill();

      // 名称只在悬停相关或画布够宽时出现，避免小屏挤成一团
      if (isActive || isNeighbour || (!activeSlug && width > 760)) {
        const above = node.labelAbove && !isActive;
        context.fillStyle = hexToRgba("#e8e6f2", isActive ? 0.95 : 0.5 * alpha);
        context.font = `${isActive ? 600 : 400} 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = above ? "bottom" : "top";
        context.fillText(node.gate.name, node.x, node.y + (above ? -(size + 7) : size + 7));
      }
    }
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const full = value.length === 3
      ? value.split("").map((char) => char + char).join("")
      : value;
    const number = Number.parseInt(full, 16);
    return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
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

  function nodeAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestDistance = 26;

    for (const node of nodes.values()) {
      const distance = Math.hypot(node.x - x, node.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    }
    return best;
  }

  canvas.addEventListener("pointermove", (event) => {
    const found = nodeAt(event.clientX, event.clientY);
    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found ? "pointer" : "default";
      draw();
    }
  }, { passive: true });

  canvas.addEventListener("pointerleave", () => {
    hovered = null;
    canvas.style.cursor = "default";
    draw();
  });

  canvas.addEventListener("click", (event) => {
    const found = nodeAt(event.clientX, event.clientY);
    if (found) window.location.href = `${found.gate.slug}/index.html`;
  });

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
