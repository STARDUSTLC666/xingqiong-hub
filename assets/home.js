"use strict";

const ARCHIVES = [
  { slug: "prompt-reader", href: "prompt-reader/index.html", icon: "file-scan", title: "Prompt Reader", role: "图片提示词与工作流读取", category: "tool", mode: "standard", badge: "复盘", accent: "#79aebc", description: "直接在浏览器中读取图片保存的 prompt、workflow、seed 与生成参数。", keywords: ["元数据", "ComfyUI", "工作流", "复盘"] },
  { slug: "lighting-codex", href: "lighting-codex/index.html", icon: "sun-medium", title: "双子星光影魔典", role: "光影、氛围与镜头质感", category: "guide", mode: "standard", badge: "氛围", accent: "#e7ad61", description: "为已经确定的主体补充光线方向、空气感、镜头语言与材质表现。", keywords: ["光影", "氛围", "镜头", "材质"] },
  { slug: "nova-anima", href: "nova-anima/index.html", icon: "flower-2", title: "Nova Anima 黄金起词手册", role: "二次元模型起手词", category: "guide", mode: "standard", badge: "起手", accent: "#dd765d", description: "从角色、构图与画风开始，快速搭好 Anima / Nova Anima 的第一版提示词。", keywords: ["Anima", "角色", "构图", "画风"] },
  { slug: "prompt-engine", href: "prompt-engine/index.html", icon: "sparkles", title: "Anima3 灵感魔盒", role: "提示词结构化灵感板", category: "prompt", mode: "standard", badge: "结构", accent: "#76bba5", description: "把零散想法拆成主体、动作、场景、风格与避坑项，减少词义冲突。", keywords: ["灵感", "结构", "主体", "场景"] },
  { slug: "krea2", href: "krea2/index.html", icon: "diamond", title: "Krea2 提示词工匠", role: "通用提示词扩写", category: "prompt", mode: "standard", badge: "扩写", accent: "#e7ad61", description: "把一句普通想法扩成完整提示词，补足镜头、材质、场景与风格。", keywords: ["Krea2", "扩写", "镜头", "风格"] },
  { slug: "anima-guide", href: "anima-guide/index.html", icon: "book-open-text", title: "Anima 提示词指南", role: "Anima 系模型详细参考", category: "guide", mode: "standard", badge: "指南", accent: "#dd765d", description: "系统查阅角色、构图、光照、风格化写法与可以直接改写的模板。", keywords: ["Anima", "模板", "光照", "参考"] },
  { slug: "drag-resolver", href: "drag-resolver/index.html", icon: "unplug", title: "Drag Resolver", role: "工作流拖拽冲突排查", category: "tool", mode: "standard", badge: "排障", accent: "#76bba5", description: "集中查看拖拽导入异常涉及的浏览器、插件与工作流排查项。", keywords: ["拖拽", "浏览器", "插件", "排障"] },
  { slug: "secret-scroll", href: "secret-scroll/index.html", icon: "scroll-text", title: "密使之札", role: "文本规则与约定备忘", category: "protocol", mode: "standard", badge: "协议", accent: "#a69acb", description: "整理复杂表达、固定术语与跨工具约定，留作后续任务继续使用。", keywords: ["文本", "规则", "术语", "备忘"] },
  { slug: "moon-scroll", href: "moon-scroll/index.html", icon: "orbit", title: "月卷协议", role: "跨模型上下文约定", category: "protocol", mode: "standard", badge: "协议", accent: "#9d91c5", description: "把固定术语、上下文和消息格式写成可在不同工具间延续的协议。", keywords: ["上下文", "消息", "跨模型", "协议"] },
  { slug: "decoder-terminal", href: "decoder-terminal/index.html", icon: "square-terminal", title: "解码终端", role: "跨栖消息解码检查", category: "protocol", mode: "standard", badge: "终端", accent: "#79aebc", description: "还原约定格式或编码消息，并检查内容能否在目标工具中正确传递。", keywords: ["解码", "格式", "消息", "终端"] },
  { slug: "lust-codex", href: "lust-codex/index.html", icon: "search-code", title: "魔典检索", role: "Danbooru 成人向标签字典", category: "tag", mode: "adult", badge: "查词", accent: "#d77882", description: "查询标签含义、同类词与可替换词，筛掉干扰项并补齐缺失描述。", keywords: ["Danbooru", "成人向", "查词", "字典"] },
  { slug: "nsfw-tags", href: "nsfw-tags/index.html", icon: "list-filter", title: "NSFW 标签大全", role: "成人向标签分类速查", category: "tag", mode: "adult", badge: "分类", accent: "#d86861", description: "按类别检索成人向 Danbooru 标签、近义词与常见组合方向。", keywords: ["NSFW", "成人向", "标签", "分类"] },
  { slug: "cyber-summon", href: "cyber-summon/index.html", icon: "braces", title: "赛博魔典", role: "标签组合与权重整理", category: "prompt", mode: "adult", badge: "组合", accent: "#76bba5", description: "把零散标签组合成可复制的提示词，完成分组、权重与复用整理。", keywords: ["标签", "权重", "组合", "提示词"] },
  { slug: "reverse-showcase", href: "reverse-showcase/index.html", icon: "radar", title: "反向破限解构实录", role: "成人向逆向提示词过程记录", category: "protocol", mode: "adult", badge: "实录", accent: "#9d91c5", description: "查看反向提示词从输入、拆解到重构的阶段记录与方法复盘。", keywords: ["逆向", "提示词", "解构", "实录"] }
];

const WORKFLOWS = {
  standard: {
    description: "从角色与画面意图出发，逐步建立结构、光影和完整表达。",
    steps: [
      { slug: "nova-anima", title: "灵感成形", description: "确定角色、构图与第一组视觉关键词。" },
      { slug: "prompt-engine", title: "结构扩写", description: "把想法拆成主体、动作、场景和风格。" },
      { slug: "lighting-codex", title: "光影定调", description: "补齐方向光、空气感和镜头质感。" },
      { slug: "anima-guide", title: "系统校准", description: "对照模板检查细节，整理为稳定版本。" }
    ]
  },
  adult: {
    description: "先建立准确词库，再完成分类、组合与过程校验。",
    steps: [
      { slug: "lust-codex", title: "建立词库", description: "先查清标签含义、同义词与适用范围。" },
      { slug: "nsfw-tags", title: "分类筛选", description: "按主题归类，留下真正需要的表达。" },
      { slug: "cyber-summon", title: "权重组合", description: "组织标签顺序、分组与权重关系。" },
      { slug: "reverse-showcase", title: "过程复盘", description: "检查拆解链路并记录可复用的方法。" }
    ]
  }
};

const FEATURED = [
  { slug: "nova-anima", image: "assets/featured/nova-anima.webp", label: "起词手册", alt: "Nova Anima 黄金起词手册页面预览" },
  { slug: "lighting-codex", image: "assets/featured/lighting-codex.webp", label: "视觉方法", alt: "双子星光影魔典页面预览" },
  { slug: "prompt-engine", image: "assets/featured/prompt-engine.webp", label: "结构工具", alt: "Anima3 灵感魔盒页面预览" }
];

const CATEGORY_NAMES = {
  guide: "创作手册",
  prompt: "提示词",
  tag: "标签资料",
  tool: "实用工具",
  protocol: "协议记录"
};

const state = {
  mode: "standard",
  activeFilter: "all"
};

const elements = {
  menuToggle: document.getElementById("menuToggle"),
  mainNav: document.getElementById("mainNav"),
  modeButtons: Array.from(document.querySelectorAll(".mode-switch__button")),
  workflowDescription: document.getElementById("workflowDescription"),
  workflowStart: document.getElementById("workflowStart"),
  workflowTrack: document.getElementById("workflowTrack"),
  featuredGrid: document.getElementById("featuredGrid"),
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  archiveGrid: document.getElementById("archiveGrid"),
  resultCount: document.getElementById("resultCount"),
  archiveModeNote: document.getElementById("archiveModeNote"),
  emptyState: document.getElementById("emptyState"),
  adultDialog: document.getElementById("adultDialog")
};

const archiveBySlug = Object.fromEntries(ARCHIVES.map((archive) => [archive.slug, archive]));

/** 将动态内容转义后再写入模板，避免档案数据突破 HTML 边界。 */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

/** 刷新动态插入的 Lucide 图标；图标库未加载时文字内容仍然可用。 */
function refreshIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
  }
}

/** 渲染当前创作模式的四步工作流，并让每一步直达对应档案。 */
function renderWorkflow() {
  const workflow = WORKFLOWS[state.mode];
  const firstArchive = archiveBySlug[workflow.steps[0].slug];

  elements.workflowDescription.textContent = workflow.description;
  elements.workflowStart.href = firstArchive.href;
  elements.workflowTrack.innerHTML = workflow.steps.map((step, index) => {
    const archive = archiveBySlug[step.slug];
    return `
      <a class="workflow-step" href="${escapeHtml(archive.href)}" style="--step-accent:${escapeHtml(archive.accent)}">
        <span class="workflow-step__number">0${index + 1}</span>
        <span class="workflow-step__icon"><i data-lucide="${escapeHtml(archive.icon)}"></i></span>
        <span class="workflow-step__copy">
          <small>${escapeHtml(archive.title)}</small>
          <strong>${escapeHtml(step.title)}</strong>
          <span>${escapeHtml(step.description)}</span>
        </span>
        <i class="workflow-step__arrow" data-lucide="arrow-up-right"></i>
      </a>`;
  }).join("");

  refreshIcons();
}

/** 用真实子页面截图渲染精选档案，避免只展示抽象图标。 */
function renderFeatured() {
  elements.featuredGrid.innerHTML = FEATURED.map((item, index) => {
    const archive = archiveBySlug[item.slug];
    return `
      <a class="featured-item featured-item--${index + 1}" href="${escapeHtml(archive.href)}">
        <span class="featured-item__media">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy">
          <span class="featured-item__index">0${index + 1}</span>
        </span>
        <span class="featured-item__body">
          <small>${escapeHtml(item.label)}</small>
          <strong>${escapeHtml(archive.title)}</strong>
          <span>${escapeHtml(archive.description)}</span>
          <span class="featured-item__open">打开档案 <i data-lucide="arrow-up-right"></i></span>
        </span>
      </a>`;
  }).join("");

  refreshIcons();
}

/** 根据当前模式、分类和关键词判断一份档案是否显示。 */
function archiveMatches(archive, query) {
  const matchesMode = archive.mode === state.mode;
  const matchesFilter = state.activeFilter === "all" || archive.category === state.activeFilter;
  const searchable = [archive.title, archive.role, archive.description, archive.badge, archive.slug, ...archive.keywords].join(" ").toLowerCase();
  return matchesMode && matchesFilter && (!query || searchable.includes(query));
}

/** 渲染公开档案列表，并同步结果计数和空状态。 */
function renderArchives() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = ARCHIVES.filter((archive) => archiveMatches(archive, query));

  elements.archiveGrid.innerHTML = filtered.map((archive, index) => `
    <a class="archive-card" href="${escapeHtml(archive.href)}" style="--archive-accent:${escapeHtml(archive.accent)};--archive-delay:${Math.min(index * 28, 220)}ms">
      <span class="archive-card__topline"></span>
      <span class="archive-card__meta">
        <span class="archive-card__number">${String(index + 1).padStart(2, "0")}</span>
        <span class="archive-card__badge">${escapeHtml(archive.badge)}</span>
      </span>
      <span class="archive-card__icon"><i data-lucide="${escapeHtml(archive.icon)}"></i></span>
      <span class="archive-card__copy">
        <strong>${escapeHtml(archive.title)}</strong>
        <small>${escapeHtml(archive.role)}</small>
        <span>${escapeHtml(archive.description)}</span>
      </span>
      <span class="archive-card__footer">
        <span>${escapeHtml(CATEGORY_NAMES[archive.category])}</span>
        <span>查看 <i data-lucide="arrow-up-right"></i></span>
      </span>
    </a>`).join("");

  elements.resultCount.textContent = `${filtered.length} 份档案`;
  elements.emptyState.hidden = filtered.length !== 0;
  refreshIcons();
}

/** 切换档案分类，并同步按钮的选中状态。 */
function setFilter(filter) {
  state.activeFilter = filter;
  document.querySelectorAll(".archive-filter").forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderArchives();
}

/** 写入模式状态并同时更新工作流、档案和页面视觉语义。 */
function setMode(mode) {
  state.mode = mode;
  state.activeFilter = "all";
  document.body.dataset.mode = mode;

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  elements.archiveModeNote.textContent = mode === "adult"
    ? "当前显示成人向创作内容。"
    : "当前显示常规创作内容。";

  setFilter("all");
  renderWorkflow();
}

/** 读取本次浏览会话中的成人内容确认状态。 */
function hasAdultAcknowledgement() {
  try {
    return window.sessionStorage.getItem("xingqiong-adult-acknowledged") === "true";
  } catch {
    return false;
  }
}

/** 记录成人内容确认；存储不可用时只在当前页面继续。 */
function rememberAdultAcknowledgement() {
  try {
    window.sessionStorage.setItem("xingqiong-adult-acknowledged", "true");
  } catch {
    // 浏览器禁用会话存储时，不阻塞本次切换。
  }
}

/** 请求切换创作模式，首次进入成人向内容前显示年龄确认。 */
function requestMode(mode) {
  if (mode === state.mode) {
    return;
  }

  if (mode === "adult" && !hasAdultAcknowledgement()) {
    if (typeof elements.adultDialog.showModal === "function") {
      elements.adultDialog.showModal();
      return;
    }
  }

  setMode(mode);
}

/** 控制移动端导航显隐，并维持 aria-expanded 与图标一致。 */
function setMobileMenu(open) {
  elements.mainNav.classList.toggle("is-open", open);
  elements.menuToggle.setAttribute("aria-expanded", String(open));
  elements.menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  elements.menuToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
  refreshIcons();
}

/** 绑定键盘、筛选、模式和移动导航交互并完成首次渲染。 */
function initializeHome() {
  renderFeatured();
  setMode("standard");
  refreshIcons();

  elements.modeButtons.forEach((button, index) => {
    button.addEventListener("click", () => requestMode(button.dataset.mode));
    button.addEventListener("keydown", (event) => {
      if (!(["ArrowLeft", "ArrowRight"].includes(event.key))) {
        return;
      }
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + elements.modeButtons.length) % elements.modeButtons.length;
      elements.modeButtons[nextIndex].focus();
      requestMode(elements.modeButtons[nextIndex].dataset.mode);
    });
  });

  document.querySelectorAll(".archive-filter").forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  elements.searchInput.addEventListener("input", renderArchives);
  elements.clearSearch.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.searchInput.focus();
    renderArchives();
  });

  elements.menuToggle.addEventListener("click", () => {
    setMobileMenu(elements.menuToggle.getAttribute("aria-expanded") !== "true");
  });
  elements.mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMobileMenu(false);
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setMobileMenu(false);
    }
  });

  elements.adultDialog.addEventListener("close", () => {
    if (elements.adultDialog.returnValue === "confirm") {
      rememberAdultAcknowledgement();
      setMode("adult");
    }
  });
}

initializeHome();
