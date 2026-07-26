/* ===========================================================================
   星穹枢庭 · Sanctuary Runtime
   ---------------------------------------------------------------------------
   全站共享的前端外壳：环境背景、顶栏、阅读进度、命令面板、提示条、
   滚动进场动画与复制工具。所有页面只需要引入本文件即可获得一致体验：
     <script src="../assets/sanctuary.js" defer></script>
   对旧脚本保持兼容：仍然导出 window.gsToast / window.gsCopy。
   =========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------ 站点索引 */
  /** 全站可跳转目的地。命令面板、顶栏与页脚都从这里取数据。 */
  const DESTINATIONS = [
    { slug: "", icon: "✦", name: "星穹枢庭", en: "Creative Archive", role: "首页 · 创作路径与公开档案", group: "枢庭", keywords: "home index shouye 首页 枢庭" },
    { slug: "portal", icon: "🌙", name: "星穹绘所", en: "Star Lab", role: "连接 ComfyUI 的出图工作台", group: "出图", local: true, keywords: "comfyui portal 出图 生成 工作台" },
    { slug: "wd-tagger", icon: "🔍", name: "WD 标签反推器", en: "WD Tagger", role: "从参考图反推 Danbooru 标签", group: "出图", local: true, keywords: "wd14 tagger 反推 标签 参考图" },
    { slug: "krea2", icon: "🎨", name: "Krea2 提示词工匠", en: "Krea2 Artisan", role: "八卡槽提示词整理与扩写", group: "提示词", keywords: "krea 卡槽 扩写 prompt" },
    { slug: "prompt-engine", icon: "🌿", name: "Anima3 灵感魔盒", en: "Prompt Engine", role: "把灵感拆成稳定的提示词结构", group: "提示词", keywords: "灵感 结构 主体 场景 prompt engine" },
    { slug: "nova-anima", icon: "🌸", name: "Nova Anima 起词手册", en: "Nova Anima", role: "二次元模型的黄金起手词", group: "提示词", adult: true, keywords: "anima 二次元 起手 画风" },
    { slug: "anima-guide", icon: "🎭", name: "Anima 提示词指南", en: "Anima Guide", role: "Anima 系模型的详细参考书", group: "提示词", adult: true, keywords: "anima 指南 模板 参考" },
    { slug: "lighting-codex", icon: "✨", name: "双子星光影魔典", en: "Lighting Codex", role: "光影方向、氛围与镜头质感", group: "提示词", keywords: "光影 氛围 镜头 材质 lighting" },
    { slug: "cyber-summon", icon: "🔮", name: "赛博魔典", en: "Cyber Summon", role: "标签组合、加权与复制", group: "标签", adult: true, keywords: "标签 权重 组合 danbooru" },
    { slug: "lust-codex", icon: "📚", name: "魔典检索", en: "Lust Codex", role: "Danbooru 标签字典与近义词", group: "标签", adult: true, keywords: "danbooru 查词 字典 标签" },
    { slug: "nsfw-tags", icon: "🔞", name: "NSFW 标签大全", en: "NSFW Tags", role: "成人向标签分类速查", group: "标签", adult: true, keywords: "nsfw 成人 标签 分类" },
    { slug: "prompt-reader", icon: "📖", name: "Prompt Reader", en: "Metadata Reader", role: "读取图片里的提示词与工作流", group: "工具", keywords: "元数据 metadata workflow seed 复盘" },
    { slug: "drag-resolver", icon: "⚡", name: "Drag Resolver", en: "Drag Resolver", role: "ComfyUI 拖拽导入排障", group: "工具", keywords: "拖拽 排障 插件 comfyui" },
    { slug: "reverse-showcase", icon: "🔄", name: "反向破限解构实录", en: "Reverse Showcase", role: "反向提示词的拆解与复盘记录", group: "工具", adult: true, keywords: "反向 负面 逆向 解构 negative" },
    { slug: "moon-scroll", icon: "🌙", name: "月卷协议", en: "Moon Scroll", role: "跨模型上下文与消息约定", group: "协议", keywords: "协议 上下文 消息 跨模型" },
    { slug: "decoder-terminal", icon: "💻", name: "解码终端", en: "Decoder Terminal", role: "还原约定格式与编码消息", group: "协议", keywords: "解码 终端 格式 decoder" },
    { slug: "secret-scroll", icon: "📜", name: "密使之札", en: "Secret Scroll", role: "文本规则与术语备忘", group: "协议", keywords: "文本 规则 术语 备忘" }
  ];

  const GROUP_ORDER = ["枢庭", "出图", "提示词", "标签", "工具", "协议"];

  /* -------------------------------------------------------------- 小工具 */
  const doc = document;
  const html = doc.documentElement;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(pointer: coarse)");

  /** 站点根目录，从本脚本自身的 URL 推导，避免各页面深度不同时写死相对路径。 */
  const ROOT = (function resolveRoot() {
    const self = doc.currentScript
      || Array.prototype.slice.call(doc.getElementsByTagName("script")).filter((tag) => /sanctuary\.js/.test(tag.src || "")).pop();
    if (!self || !self.src) return "./";
    return self.src.replace(/assets\/sanctuary\.js.*$/, "");
  })();

  /** 转义写入 HTML 的动态文本，页面标题等同样走这一层。 */
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function el(tag, className, html) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  /* ------------------------------------------------------------ 动效偏好 */
  /* 系统的 prefers-reduced-motion 之外再留一个显式开关。
     很多人只是关掉了 Windows 的「动画效果」来省性能，并非需要规避前庭不适，
     完全冻结主视觉对他们是过度服从；但默认仍然尊重系统设置，只有本人
     主动打开才恢复动效。 */
  const MOTION_KEY = "xingqiong-motion";

  function motionOverride() {
    try {
      return localStorage.getItem(MOTION_KEY);
    } catch {
      return null;
    }
  }

  function prefersStill() {
    const override = motionOverride();
    if (override === "on") return false;
    if (override === "off") return true;
    return motionQuery.matches;
  }

  function setMotionOverride(value) {
    try {
      if (value) localStorage.setItem(MOTION_KEY, value);
      else localStorage.removeItem(MOTION_KEY);
    } catch {
      // 隐私模式下写不进去，本次浏览内仍然生效。
    }

    html.dataset.xqMotion = prefersStill() ? "still" : "full";
    window.dispatchEvent(new CustomEvent("xq:motionchange", {
      detail: { still: prefersStill() }
    }));
  }

  /** 当前页面所在的星门 slug；识别不出时返回空字符串（首页返回 ""）。 */
  function currentSlug() {
    const parts = decodeURIComponent(location.pathname || "").split("/").filter(Boolean);
    if ((parts[parts.length - 1] || "").toLowerCase().endsWith(".html")) parts.pop();
    const last = parts[parts.length - 1] || "";
    return DESTINATIONS.some((item) => item.slug && item.slug === last) ? last : "";
  }

  const slug = currentSlug();
  const here = DESTINATIONS.find((item) => item.slug === slug) || DESTINATIONS[0];

  function hrefFor(target) {
    return target.slug ? `${ROOT}${target.slug}/index.html` : `${ROOT}index.html`;
  }

  /* ------------------------------------------------------------ 环境背景 */
  /** 星尘画布：稀疏的呼吸星点 + 偶发流星，随视口暂停以省电。 */
  function startStarfield(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let stars = [];
    let shooting = null;
    let frameId = 0;
    let lastTime = 0;
    let nextShootingAt = 4000;
    let elapsed = 0;
    let width = 0;
    let height = 0;

    function layout() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = canvas.clientWidth || window.innerWidth;
      const nextHeight = canvas.clientHeight || window.innerHeight;

      // 画布尚未拿到布局尺寸时不要按 0 重建，等 ResizeObserver 再来一次。
      if (nextWidth < 2 || nextHeight < 2) return false;

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const density = coarseQuery.matches ? 9000 : 6200;
      const count = Math.min(220, Math.max(40, Math.round((width * height) / density)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.25 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0016 + 0.0005,
        drift: Math.random() * 0.006 + 0.002,
        warm: Math.random() > 0.55
      }));

      return true;
    }

    function draw(deltaMs) {
      context.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.phase += star.speed * deltaMs;
        star.y -= star.drift * deltaMs * 0.06;
        if (star.y < -2) star.y = height + 2;

        const alpha = 0.22 + Math.sin(star.phase) * 0.26;
        if (alpha <= 0.02) continue;
        context.beginPath();
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fillStyle = star.warm
          ? `rgba(240, 214, 168, ${alpha})`
          : `rgba(178, 214, 232, ${alpha * 0.86})`;
        context.fill();
      }

      if (shooting) {
        shooting.life -= deltaMs;
        shooting.x += shooting.vx * deltaMs;
        shooting.y += shooting.vy * deltaMs;

        if (shooting.life <= 0 || shooting.x > width + 120 || shooting.y > height + 120) {
          shooting = null;
        } else {
          const fade = Math.min(1, shooting.life / 420);
          const gradient = context.createLinearGradient(
            shooting.x, shooting.y,
            shooting.x - shooting.vx * 150, shooting.y - shooting.vy * 150
          );
          gradient.addColorStop(0, `rgba(255, 238, 202, ${0.72 * fade})`);
          gradient.addColorStop(1, "rgba(255, 238, 202, 0)");
          context.strokeStyle = gradient;
          context.lineWidth = 1.4;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(shooting.x, shooting.y);
          context.lineTo(shooting.x - shooting.vx * 150, shooting.y - shooting.vy * 150);
          context.stroke();
        }
      } else if (elapsed > nextShootingAt) {
        const angle = 0.32 + Math.random() * 0.3;
        shooting = {
          x: Math.random() * width * 0.7,
          y: Math.random() * height * 0.34,
          vx: Math.cos(angle) * 0.62,
          vy: Math.sin(angle) * 0.62,
          life: 900
        };
        nextShootingAt = elapsed + 7000 + Math.random() * 11000;
      }
    }

    function tick(timestamp) {
      frameId = 0;
      const delta = lastTime ? Math.min(timestamp - lastTime, 64) : 16;
      lastTime = timestamp;
      elapsed += delta;
      draw(delta);
      if (running()) frameId = requestAnimationFrame(tick);
    }

    function running() {
      return !prefersStill() && !doc.hidden;
    }

    function sync() {
      if (running()) {
        if (!frameId) frameId = requestAnimationFrame(tick);
        return;
      }
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lastTime = 0;
    }

    let ready = false;
    let resizeTimer = 0;

    function relayout() {
      if (!layout()) return false;
      ready = true;
      draw(16);
      canvas.classList.add("is-ready");
      sync();
      return true;
    }

    function scheduleRelayout() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(relayout, 160);
    }

    /** 挂载时画布可能还没有布局尺寸（隐藏标签页、延迟显示的容器）。
        用递减的重试把首帧补上，避免星尘永远停在未初始化状态。 */
    function retryUntilSized(attemptsLeft) {
      if (ready || attemptsLeft <= 0) return;
      if (relayout()) return;
      setTimeout(() => retryUntilSized(attemptsLeft - 1), 250);
    }

    retryUntilSized(12);

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRelayout);
      observer.observe(canvas);
    }

    window.addEventListener("resize", scheduleRelayout, { passive: true });
    doc.addEventListener("visibilitychange", sync);
    motionQuery.addEventListener?.("change", relayout);
  }

  function mountAmbient() {
    if (doc.querySelector(".xq-ambient")) return;

    const ambient = el("div", "xq-ambient");
    ambient.setAttribute("aria-hidden", "true");
    ambient.innerHTML =
      '<div class="xq-ambient__base"></div>'
      + '<div class="xq-aurora xq-aurora--gold"></div>'
      + '<div class="xq-aurora xq-aurora--cyan"></div>'
      + '<div class="xq-aurora xq-aurora--rose"></div>'
      + '<div class="xq-ambient__grid"></div>'
      + '<canvas class="xq-ambient__stars"></canvas>'
      + '<div class="xq-ambient__vignette"></div>';

    doc.body.prepend(ambient);
    // html 也要打标记：环境层在负层，底色得由根元素兜住。
    doc.body.classList.add("xq-has-ambient");
    html.classList.add("xq-has-ambient");

    // 旧页面自带的 #starfield 现在由环境层接管，停掉它的绘制循环。
    const legacy = doc.getElementById("starfield");
    if (legacy) legacy.remove();

    startStarfield(ambient.querySelector(".xq-ambient__stars"));
  }

  /* ---------------------------------------------------------------- 顶栏 */
  function mountTopbar() {
    if (doc.querySelector(".xq-topbar")) return;

    const bar = el("header", "xq-topbar");
    bar.innerHTML =
      `<a class="xq-topbar__brand" href="${esc(hrefFor(DESTINATIONS[0]))}">`
      + '<span class="xq-topbar__mark" aria-hidden="true">✦</span>'
      + '<span class="xq-topbar__name">星穹枢庭</span>'
      + "</a>"
      + (slug ? '<span class="xq-topbar__sep" aria-hidden="true">/</span>'
        + `<span class="xq-topbar__here">${esc(here.name)}</span>` : "")
      + '<span class="xq-topbar__spacer"></span>'
      + '<nav class="xq-topbar__actions" aria-label="站点操作">'
      + '<button class="xq-tbtn" type="button" data-xq-open-cmdk aria-haspopup="dialog">'
      + '<span class="xq-tbtn__icon" aria-hidden="true">⌘</span><span>星门检索</span><kbd>Ctrl K</kbd>'
      + "</button>"
      + (slug ? `<a class="xq-tbtn" href="${esc(hrefFor(DESTINATIONS[0]))}"><span class="xq-tbtn__icon" aria-hidden="true">←</span><span>回枢庭</span></a>` : "")
      + "</nav>";

    doc.body.prepend(bar);

    const progress = el("div", "xq-progress", '<div class="xq-progress__bar"></div>');
    progress.setAttribute("aria-hidden", "true");
    doc.body.prepend(progress);

    const fill = progress.firstElementChild;
    const fab = el("button", "xq-fab", "↑");
    fab.type = "button";
    fab.setAttribute("aria-label", "回到页首");
    fab.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersStill() ? "auto" : "smooth" });
    });
    doc.body.append(fab);

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = doc.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY || window.pageYOffset || 0;
        fill.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
        bar.classList.toggle("is-scrolled", y > 8);
        fab.classList.toggle("is-visible", y > 480);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------ 命令面板 */
  let cmdk = null;

  function buildCommandPalette() {
    if (cmdk) return cmdk;

    const overlay = el("div", "xq-cmdk");
    overlay.innerHTML =
      '<div class="xq-cmdk__panel" role="dialog" aria-modal="true" aria-label="星门检索">'
      + '<div class="xq-cmdk__field"><span aria-hidden="true">✦</span>'
      + '<input type="text" autocomplete="off" spellcheck="false" placeholder="搜索星门：出图、标签、光影、协议…" aria-label="搜索星门">'
      + "</div>"
      + '<ul class="xq-cmdk__list" role="listbox"></ul>'
      + '<div class="xq-cmdk__hint"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 前往</span><span><kbd>Esc</kbd> 关闭</span></div>'
      + "</div>";

    doc.body.append(overlay);

    const input = overlay.querySelector("input");
    const list = overlay.querySelector(".xq-cmdk__list");
    let matches = [];
    let active = 0;
    let lastFocused = null;

    function score(item, query) {
      if (!query) return 1;
      const haystack = `${item.name} ${item.en} ${item.role} ${item.slug} ${item.keywords} ${item.group}`.toLowerCase();
      return haystack.includes(query) ? 1 : 0;
    }

    function render() {
      const query = input.value.trim().toLowerCase();
      matches = DESTINATIONS.filter((item) => score(item, query) > 0);
      active = 0;

      if (!matches.length) {
        list.innerHTML = '<li class="xq-cmdk__empty">没有匹配的星门，换一个关键词试试。</li>';
        return;
      }

      let markup = "";
      let group = "";
      const sorted = matches.slice().sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
      matches = sorted;

      sorted.forEach((item, index) => {
        if (item.group !== group) {
          group = item.group;
          markup += `<li class="xq-cmdk__group" role="presentation">${esc(group)}</li>`;
        }
        const badge = item.local ? "本地" : item.adult ? "18+" : "";
        markup += `<li role="presentation"><a class="xq-cmdk__item" role="option" id="xq-cmdk-${index}"`
          + ` aria-selected="${index === 0}" href="${esc(hrefFor(item))}" data-index="${index}">`
          + `<span class="xq-cmdk__icon" aria-hidden="true">${esc(item.icon)}</span>`
          + `<span class="xq-cmdk__copy"><strong>${esc(item.name)}</strong><small>${esc(item.role)}</small></span>`
          + (badge ? `<span class="xq-cmdk__badge">${esc(badge)}</span>` : "")
          + "</a></li>";
      });

      list.innerHTML = markup;
    }

    function setActive(index) {
      const options = list.querySelectorAll(".xq-cmdk__item");
      if (!options.length) return;
      active = (index + options.length) % options.length;
      options.forEach((option, i) => option.setAttribute("aria-selected", String(i === active)));
      options[active].scrollIntoView({ block: "nearest" });
    }

    function open() {
      lastFocused = doc.activeElement;
      input.value = "";
      render();
      overlay.classList.add("is-open");
      doc.body.style.overflow = "hidden";
      requestAnimationFrame(() => input.focus());
    }

    function close() {
      overlay.classList.remove("is-open");
      doc.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    function isOpen() {
      return overlay.classList.contains("is-open");
    }

    input.addEventListener("input", render);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(active + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(active - 1);
        return;
      }
      if (event.key === "Enter") {
        const target = list.querySelectorAll(".xq-cmdk__item")[active];
        if (target) {
          event.preventDefault();
          window.location.href = target.href;
        }
      }
    });

    list.addEventListener("mousemove", (event) => {
      const item = event.target.closest(".xq-cmdk__item");
      if (item) setActive(Number(item.dataset.index));
    });

    cmdk = { open, close, isOpen };
    return cmdk;
  }

  function bindCommandShortcuts() {
    doc.addEventListener("keydown", (event) => {
      const palette = buildCommandPalette();
      const key = (event.key || "").toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        palette.isOpen() ? palette.close() : palette.open();
        return;
      }

      if (key === "/" && !palette.isOpen()) {
        const node = doc.activeElement;
        const tag = node ? node.tagName : "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (node && node.isContentEditable)) return;
        event.preventDefault();
        palette.open();
      }
    });

    doc.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-xq-open-cmdk]");
      if (!trigger) return;
      event.preventDefault();
      buildCommandPalette().open();
    });
  }

  /* -------------------------------------------------------------- 提示条 */
  function toastHost() {
    let host = doc.querySelector(".xq-toasts");
    if (!host) {
      host = el("div", "xq-toasts");
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      doc.body.append(host);
    }
    return host;
  }

  function toast(message, tone) {
    const node = el("div", `xq-toast${tone ? ` xq-toast--${tone}` : ""}`);
    node.innerHTML = `<span class="xq-toast__dot" aria-hidden="true"></span><span>${esc(message)}</span>`;
    const host = toastHost();
    host.append(node);

    while (host.children.length > 3) host.firstElementChild.remove();

    setTimeout(() => {
      node.classList.add("is-leaving");
      setTimeout(() => node.remove(), 300);
    }, 2200);
  }

  /** 复制文本，剪贴板不可用时回退到临时 textarea。 */
  async function copy(text, sourceElement) {
    const value = String(text == null ? "" : text);
    let ok = false;

    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      try {
        const scratch = doc.createElement("textarea");
        scratch.value = value;
        scratch.setAttribute("readonly", "");
        scratch.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        doc.body.append(scratch);
        scratch.select();
        ok = doc.execCommand("copy");
        scratch.remove();
      } catch {
        ok = false;
      }
    }

    toast(ok ? "已复制到剪贴板" : "复制失败，请手动选择文本", ok ? "ok" : "error");

    if (ok && sourceElement && sourceElement.classList) {
      sourceElement.classList.remove("xq-flash");
      void sourceElement.offsetWidth;
      sourceElement.classList.add("xq-flash");
    }

    return ok;
  }

  /* ---------------------------------------------------------- 进场与微交互 */
  function mountReveal() {
    if (prefersStill() || !("IntersectionObserver" in window)) return;

    // 页面自身没有标注时，自动为主要卡片补上进场动画。
    // 只挑顶层卡片：折叠容器内的元素可能永远不进入视口，
    // 那样 observer 不会触发，它们会停在 opacity:0 上再也不出现。
    const auto = doc.querySelectorAll(".panel, .xq-card");
    auto.forEach((node, index) => {
      if (node.closest(".xq-topbar, .xq-cmdk, .xq-ambient, .gs-beginner-guide")) return;
      if (!node.hasAttribute("data-xq-reveal")) {
        node.setAttribute("data-xq-reveal", "");
        node.style.setProperty("--xq-reveal-delay", `${Math.min(index, 6) * 55}ms`);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });

    doc.querySelectorAll("[data-xq-reveal]").forEach((node) => observer.observe(node));
  }

  function mountMicroInteractions() {
    if (coarseQuery.matches || prefersStill()) return;

    // 指针跟随高光
    doc.addEventListener("pointermove", (event) => {
      const card = event.target.closest(".xq-spotlight, .panel, .xq-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--xq-mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--xq-my", `${event.clientY - rect.top}px`);
    }, { passive: true });

    // 按钮涟漪
    doc.addEventListener("pointerdown", (event) => {
      const button = event.target.closest(".btn, .xq-tbtn, .xq-btn, button.chip");
      if (!button || button.disabled) return;
      const style = getComputedStyle(button);
      if (style.position === "static") button.style.position = "relative";
      if (style.overflow !== "hidden") button.style.overflow = "hidden";

      const rect = button.getBoundingClientRect();
      const ripple = el("span", "xq-ripple");
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.append(ripple);
      setTimeout(() => ripple.remove(), 640);
    }, { passive: true });
  }

  /* ------------------------------------------------------------ 动效开关 */
  /* 只在系统要求减少动效时才出现：动效本来就正常的访客不需要多这一个按钮。 */
  function mountMotionToggle() {
    if (!motionQuery.matches) return;
    if (doc.querySelector("[data-xq-motion-toggle]")) return;

    const host = doc.querySelector(".xq-topbar__actions") || doc.querySelector("[data-xq-motion-slot]");
    if (!host) return;

    const button = el("button", "xq-tbtn");
    button.type = "button";
    button.setAttribute("data-xq-motion-toggle", "");

    function sync() {
      const still = prefersStill();
      button.innerHTML = `<span aria-hidden="true">${still ? "✧" : "✦"}</span><span>${still ? "启用动效" : "动效已开"}</span>`;
      button.setAttribute("aria-pressed", String(!still));
      button.title = still
        ? "你的系统设置为减少动态效果，页面主视觉已静止。点击可只为本站开启。"
        : "点击恢复为跟随系统的减少动态效果设置。";
    }

    button.addEventListener("click", () => {
      setMotionOverride(prefersStill() ? "on" : null);
      sync();
    });

    sync();
    host.prepend(button);
  }

  /* ---------------------------------------------------------------- 页脚 */
  function mountFooter() {
    if (!slug || doc.querySelector(".xq-sitefoot")) return;

    const siblings = DESTINATIONS.filter((item) => item.slug && item.slug !== slug && item.group === here.group).slice(0, 4);
    const links = siblings.length ? siblings : DESTINATIONS.filter((item) => item.slug && item.slug !== slug).slice(0, 4);

    const footer = el("footer", "xq-sitefoot");
    footer.innerHTML =
      '<div class="xq-sitefoot__row">'
      + links.map((item) => `<a href="${esc(hrefFor(item))}">${esc(item.icon)} ${esc(item.name)}</a>`).join("")
      + "</div>"
      + `<div>星穹枢庭 · Personal Creative Archive · <a href="${esc(hrefFor(DESTINATIONS[0]))}">返回枢庭首页</a></div>`;

    doc.body.append(footer);
  }

  /* ----------------------------------------------------------- 强调色适配 */
  function applyAccent() {
    if (here.adult) html.setAttribute("data-xq-accent", "coral");
    else if (here.group === "工具" || here.group === "协议") html.setAttribute("data-xq-accent", "cyan");
  }

  /* ---------------------------------------------------------------- 启动 */
  function boot() {
    // 首页自带一整套外壳与 Three.js 主视觉，用 data-xq-shell="off" 只取
    // 命令面板、提示条与微交互，不注入顶栏、环境层和页脚。
    const wantsShell = html.dataset.xqShell !== "off";

    if (wantsShell) {
      applyAccent();
      mountAmbient();
      mountTopbar();
      mountFooter();
    }

    bindCommandShortcuts();
    mountReveal();
    mountMicroInteractions();
    mountMotionToggle();
    html.dataset.xqMotion = prefersStill() ? "still" : "full";
  }

  const XQ = {
    destinations: DESTINATIONS,
    root: ROOT,
    slug,
    toast,
    copy,
    openPalette: () => buildCommandPalette().open()
  };

  Object.defineProperty(window, "XQ", { value: Object.freeze(XQ), configurable: true });

  // 旧页面直接调用这两个全局函数，保持签名不变。
  window.gsToast = (message) => toast(message);
  window.gsCopy = (text, source) => copy(text, source);

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
