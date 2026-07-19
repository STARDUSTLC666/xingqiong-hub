"use strict";

const ARCHIVES = [
  { slug: "prompt-reader", href: "prompt-reader/index.html", icon: "file-scan", title: "Prompt Reader", role: "图片提示词与工作流读取", category: "tool", mode: "standard", badge: "复盘", accent: "#79aebc", description: "直接在浏览器中读取图片保存的 prompt、workflow、seed 与生成参数。", keywords: ["元数据", "ComfyUI", "工作流", "复盘"] },
  { slug: "lighting-codex", href: "lighting-codex/index.html", icon: "sun-medium", title: "双子星光影魔典", role: "光影、氛围与镜头质感", category: "guide", mode: "standard", badge: "氛围", accent: "#e7ad61", description: "为已经确定的主体补充光线方向、空气感、镜头语言与材质表现。", keywords: ["光影", "氛围", "镜头", "材质"] },
  { slug: "nova-anima", href: "nova-anima/index.html", icon: "flower-2", title: "Nova Anima 黄金起词手册", role: "二次元模型起手词", category: "guide", mode: "adult", badge: "起手", accent: "#dd765d", description: "从角色、构图与画风开始，快速搭好 Anima / Nova Anima 的第一版提示词。", keywords: ["Anima", "角色", "构图", "画风"] },
  { slug: "prompt-engine", href: "prompt-engine/index.html", icon: "sparkles", title: "Anima3 灵感魔盒", role: "提示词结构化灵感板", category: "prompt", mode: "adult", badge: "结构", accent: "#76bba5", description: "把零散想法拆成主体、动作、场景、风格与避坑项，减少词义冲突。", keywords: ["灵感", "结构", "主体", "场景"] },
  { slug: "krea2", href: "krea2/index.html", icon: "diamond", title: "Krea2 提示词工匠", role: "八卡槽提示词整理", category: "prompt", mode: "standard", badge: "扩写", accent: "#e7ad61", description: "把八个英文描述槽静态拼成 Krea2 提示词，并附上负向词和参数建议。", keywords: ["Krea2", "八卡槽", "扩写", "负向词"] },
  { slug: "anima-guide", href: "anima-guide/index.html", icon: "book-open-text", title: "Anima 提示词指南", role: "Anima 系模型详细参考", category: "guide", mode: "adult", badge: "指南", accent: "#dd765d", description: "系统查阅角色、构图、光照、风格化写法与可以直接改写的模板。", keywords: ["Anima", "模板", "光照", "参考"] },
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
    goals: {
      blank: {
        label: "从零开始",
        icon: "wand-sparkles",
        description: "还没有提示词也没关系。先借一个接近的例子，再逐步换成自己的画面。",
        prep: ["一句中文画面想法", "先接受第一张图不完美"],
        placeholder: "例如：雨后的旧车站里，一位短发女孩撑着透明伞……",
        finish: "把草稿复制到 ChatGPT 网页版，直接说“请根据这段提示词生成图片”。第一张先确认主体和构图，再回来补细节。",
        steps: [
          {
            id: "pick-example",
            slug: "krea2",
            title: "载入一个最接近的示例",
            task: "点一张“快速示例”卡把内容载入八个槽，再点“扩写 Prompt”和“复制”。不要只停在载入示例。",
            done: "“扩写结果”里已经出现完整提示词，而不是默认说明文字。",
            result: "把扩写结果复制到右侧草稿，作为第一版骨架。",
            action: "打开 Krea2"
          },
          {
            id: "choose-light",
            slug: "lighting-codex",
            title: "只选一组光影",
            task: "从光线方向、时间或氛围中各挑少量词。不要复制页面自动拼出的整段复合提示词。",
            done: "你能用一句话说清画面是亮、暗、冷、暖或什么时段。",
            result: "只带走单独的光影词，追加到草稿末尾。",
            action: "挑选光影词"
          },
          {
            id: "translate-slots",
            href: "https://chatgpt.com/",
            tool: "ChatGPT 网页版",
            icon: "languages",
            accent: "#76bba5",
            title: "把中文想法整理成八槽英文",
            task: "把中文想法交给 ChatGPT，请它只输出主体、动作、着装、表情、环境、光影、风格、氛围八项英文短语。",
            done: "主体、动作和环境至少三项已有英文内容，没有多余解释。",
            result: "把八项英文短语保留在草稿中。",
            action: "去 ChatGPT 整理"
          },
          {
            id: "fill-expand-copy",
            slug: "krea2",
            title: "填入八槽，扩写并复制",
            task: "把八项英文分别填入对应槽位并点“扩写 Prompt”。如果画的不是人物，删掉固定加入的 Portrait、皮肤和胶片词，再复制。",
            done: "扩写结果包含你的主体、动作和环境，且八槽名称都对应正确。",
            result: "用复制出的完整提示词替换草稿中的临时八项。",
            action: "回到 Krea2 完成"
          }
        ]
      },
      idea: {
        label: "已有一句想法",
        icon: "message-square-text",
        description: "你已经能用一句中文描述画面。先拆清楚，再让工具补足镜头与风格。",
        prep: ["现有的一句中文想法", "最不能被改掉的主体特征"],
        placeholder: "粘贴你的中文想法，再换行写：主体 / 动作 / 环境。",
        finish: "复制完整草稿去 ChatGPT 出图。结果偏离时，先删掉冲突词；不要同时追加很多新词。",
        steps: [
          {
            id: "split-idea",
            href: "https://chatgpt.com/",
            tool: "ChatGPT 网页版",
            icon: "message-square-text",
            accent: "#76bba5",
            title: "先拆成主体、动作、环境",
            task: "让 ChatGPT 把中文想法拆成三行：谁或什么、正在做什么、发生在哪里。先不要考虑画风。",
            done: "三行都有明确内容，而且互相不冲突。",
            result: "把三行结构留在右侧草稿顶部。",
            action: "去 ChatGPT 拆分"
          },
          {
            id: "fill-slots",
            href: "https://chatgpt.com/",
            tool: "ChatGPT 网页版",
            icon: "languages",
            accent: "#76bba5",
            title: "补成八槽英文短语",
            task: "请 ChatGPT 按主体、动作、着装、表情、环境、光影、风格、氛围输出八项英文短语，不要改掉原主体。",
            done: "主体、动作、环境至少三项准确，其余不需要的项可留空。",
            result: "得到可以逐项粘贴到 Krea2 的英文八槽。",
            action: "整理八槽英文"
          },
          {
            id: "expand-copy",
            slug: "krea2",
            title: "填入八槽，扩写并复制",
            task: "逐项填入八卡槽，点“扩写 Prompt”，再删除固定拼入但你不想要的人像、皮肤或胶片描述。",
            done: "扩写结果仍符合原来那句中文意思，且没有误加的内容。",
            result: "用清理后的英文结果替换右侧草稿。",
            action: "去 Krea2 完成"
          },
          {
            id: "generate-compare",
            href: "https://chatgpt.com/",
            tool: "ChatGPT 网页版",
            icon: "images",
            accent: "#76bba5",
            title: "出图并对照原想法",
            task: "把草稿交给 ChatGPT 生成图片，然后只检查主体、动作、环境三件事。",
            done: "三件事中至少两件准确，或你已明确下一次要改哪一件。",
            result: "保存图片，并在草稿中记录单一修改目标。",
            action: "去 ChatGPT 出图"
          }
        ]
      },
      reference: {
        label: "已有参考图",
        icon: "scan-search",
        description: "先判断图片里有没有生成参数。读得到就复用；读不到才使用视觉反推协议。",
        prep: ["尽量使用原始 PNG 或 JPEG", "普通截图通常没有生成元数据"],
        placeholder: "先记录参考图来源。读到元数据后，把 prompt / seed / workflow 粘贴到这里。",
        finish: "把重组后的草稿和参考图一起交给 ChatGPT，说明“参考构图和氛围，不要照搬人物身份”。",
        steps: [
          {
            id: "read-metadata",
            slug: "prompt-reader",
            title: "先读图片内嵌元数据",
            task: "把原始 PNG 或 JPEG 拖入 Prompt Reader。它只读取图片内部保存的参数，不会看图猜提示词。",
            done: "读到了 prompt、workflow 或 seed；或者页面明确显示没有元数据。",
            result: "使用结果卡上的分项或全部复制按钮；没有结果就记下“无元数据”。",
            action: "读取图片参数"
          },
          {
            id: "reverse-plain-image",
            slug: "moon-scroll",
            title: "无元数据时再做视觉反推",
            task: "复制月卷反推指令，再到 ChatGPT 上传参考图；追加要求它最后按 Krea2 八槽输出英文短语。只有上一步无结果时才做。",
            done: "得到主体、构图、光影、风格说明，以及八项英文短语。",
            result: "把 ChatGPT 返回的英文八槽粘贴到草稿。",
            action: "复制反推协议"
          },
          {
            id: "rebuild-reference",
            slug: "krea2",
            title: "填入八槽并清理扩写结果",
            task: "把英文内容分入真实八槽，删除模型名和节点信息；非人物图再删掉固定的 Portrait、皮肤和胶片词，然后复制。",
            done: "主体、环境、光影和风格都已对应到真实槽位，扩写结果没有节点信息。",
            result: "复制 Krea2 静态拼接出的完整提示词。",
            action: "用 Krea2 整理"
          },
          {
            id: "reference-generate",
            href: "https://chatgpt.com/",
            tool: "ChatGPT 网页版",
            icon: "image-up",
            accent: "#76bba5",
            title: "带参考图生成第一版",
            task: "同时上传参考图和右侧草稿，说明要保留哪些视觉特征、允许改变哪些内容。",
            done: "新图的构图或氛围至少有一项接近参考。",
            result: "保存首图，并记录仍不相符的一项。",
            action: "带图去 ChatGPT"
          }
        ]
      }
    }
  },
  adult: {
    goals: {
      blank: {
        label: "从零组词",
        icon: "list-plus",
        description: "适合通用 Stable Diffusion / ComfyUI：先查基础英文标签，再补细节并统一整理。",
        prep: ["先确定成人角色", "确认所用模型支持这些标签"],
        placeholder: "在这里汇总英文标签。建议一行正向词，一行负向词。",
        finish: "把赛博魔典生成的正向提示词和单独整理的负向词分别粘贴到出图工具。第一次使用固定 seed，便于判断每次修改是否有效。",
        steps: [
          {
            id: "base-tags",
            slug: "lust-codex",
            title: "用英文词搭基础骨架",
            task: "用英文标签搜索角色、动作和视角。这个页面实际按英文查找，先不要输入整句中文。",
            done: "已经选出少量角色、动作和视角标签。",
            result: "把选中的英文标签复制到草稿正向词一行。",
            action: "查基础标签"
          },
          {
            id: "detail-tags",
            slug: "nsfw-tags",
            title: "补细节和负向词",
            task: "按中文或英文查漏补缺。多词标签逐个选择，不要把整段内容交给按空格拆分的导入器。",
            done: "细节词足够表达画面，并单独列出了需要排除的内容。",
            result: "正向词追加到第一行，负向词另起一行保存。",
            action: "补充分类标签"
          },
          {
            id: "merge-weight",
            slug: "cyber-summon",
            title: "合并、去重并调整权重",
            task: "只导入正向标签，删除重复项；仅给最关键的一两项加权，不要给每个词都加权。",
            done: "页面中没有明显重复标签，重点词不超过两项。",
            result: "复制生成的正向提示词，负向词仍在草稿中单独保留。",
            action: "整理正向词"
          },
          {
            id: "first-adult-run",
            slug: "cyber-summon",
            title: "复制最终版本并小步试跑",
            task: "把整理结果复制到你常用的出图工具，固定模型、尺寸、seed 和采样参数。",
            done: "完成第一次生成，并能说出下一次只改哪个标签。",
            result: "在草稿末尾记录固定参数和单一修改项。",
            action: "复制最终提示词"
          }
        ]
      },
      existing: {
        label: "已有提示词",
        icon: "text-cursor-input",
        description: "先保留原始版本，再导入、去重和查漏；每轮只改一处才能看出变化。",
        prep: ["保留一份原始提示词", "记下模型、seed 和尺寸"],
        placeholder: "先粘贴原始提示词，再换行记录模型 / seed / 尺寸 / 采样参数。",
        finish: "用相同模型、seed、尺寸和采样参数重跑；只比较本轮修改的标签是否产生预期变化。",
        steps: [
          {
            id: "import-existing",
            slug: "cyber-summon",
            title: "导入原词并保留原版",
            task: "先把原始提示词留在右侧草稿，再把副本导入赛博魔典解析。",
            done: "原版仍完整保存，页面中也出现了可编辑标签。",
            result: "保留原版，后续只编辑导入后的副本。",
            action: "导入赛博魔典"
          },
          {
            id: "lookup-gaps",
            slug: "nsfw-tags",
            title: "查词补漏，不整段导入",
            task: "逐个查询不确定的标签含义，补上真正缺少的细节。带空格的标签不要整段导入。",
            done: "已删除含义错误的词，并补入必要标签。",
            result: "在草稿中记录“删除了什么、加入了什么”。",
            action: "查词和补漏"
          },
          {
            id: "clean-generate",
            slug: "cyber-summon",
            title: "去重、调权并生成新版",
            task: "合并同义词、删除重复项，只给核心元素加权，然后生成新的正向提示词。",
            done: "新版比原版更短或结构更清楚，且没有无意义重复。",
            result: "把新版追加到草稿，保留原版用于对比。",
            action: "生成清理版"
          },
          {
            id: "controlled-rerun",
            slug: "cyber-summon",
            title: "固定参数对比重跑",
            task: "使用原来的模型、seed、尺寸和采样参数，只替换提示词后重新生成。",
            done: "能够判断这次改词带来了什么变化。",
            result: "记录有效改动；无效改动撤回，不继续堆词。",
            action: "复制对比版本"
          }
        ]
      }
    }
  }
};

const FEATURED_BY_MODE = {
  standard: [
    { slug: "krea2", image: "assets/featured/krea2.webp", label: "新手起点", alt: "Krea2 提示词工匠页面预览" },
    { slug: "lighting-codex", image: "assets/featured/lighting-codex.webp", label: "视觉方法", alt: "双子星光影魔典页面预览" },
    { slug: "prompt-reader", image: "assets/featured/prompt-reader.webp", label: "图片复盘", alt: "Prompt Reader 页面预览" }
  ],
  adult: [
    { slug: "nova-anima", image: "assets/featured/nova-anima.webp", label: "起词手册", alt: "Nova Anima 黄金起词手册页面预览" },
    { slug: "prompt-engine", image: "assets/featured/prompt-engine.webp", label: "结构工具", alt: "Anima3 灵感魔盒页面预览" },
    { slug: "nsfw-tags", image: "assets/featured/nsfw-tags.webp", label: "标签速查", alt: "NSFW 标签大全页面预览" }
  ]
};

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

const WORKFLOW_STORAGE_KEY = "xingqiong-workflow-v1";

const elements = {
  menuToggle: document.getElementById("menuToggle"),
  mainNav: document.getElementById("mainNav"),
  modeButtons: Array.from(document.querySelectorAll(".mode-switch__button")),
  workflowPanel: document.getElementById("workflowPanel"),
  goalSwitch: document.getElementById("goalSwitch"),
  workflowDescription: document.getElementById("workflowDescription"),
  workflowPrep: document.getElementById("workflowPrep"),
  workflowTrack: document.getElementById("workflowTrack"),
  workflowProgressText: document.getElementById("workflowProgressText"),
  workflowProgressBar: document.getElementById("workflowProgressBar"),
  workflowProgressFill: document.getElementById("workflowProgressFill"),
  workflowFinish: document.getElementById("workflowFinish"),
  workflowDraft: document.getElementById("workflowDraft"),
  draftToggle: document.getElementById("draftToggle"),
  draftToolBody: document.getElementById("draftToolBody"),
  draftInput: document.getElementById("draftInput"),
  draftCount: document.getElementById("draftCount"),
  draftStatus: document.getElementById("draftStatus"),
  clearDraft: document.getElementById("clearDraft"),
  copyDraft: document.getElementById("copyDraft"),
  resetWorkflow: document.getElementById("resetWorkflow"),
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
let storageHealthy = true;
let adultAcknowledgedInMemory = false;
let draftSaveTimer = 0;
let expandedStepId = null;
let workflowState = loadWorkflowState();

/** 为指定模式创建一份可独立使用的新手工作流默认状态。 */
function createDefaultModeState(mode) {
  return {
    goal: Object.keys(WORKFLOWS[mode].goals)[0],
    draft: "",
    completedByGoal: {}
  };
}

/** 校验本地存储中的单个模式，忽略旧版本或异常字段。 */
function normalizeModeState(mode, candidate) {
  const fallback = createDefaultModeState(mode);
  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const goal = Object.hasOwn(WORKFLOWS[mode].goals, candidate.goal)
    ? candidate.goal
    : fallback.goal;
  const completedByGoal = {};

  if (candidate.completedByGoal && typeof candidate.completedByGoal === "object") {
    Object.entries(candidate.completedByGoal).forEach(([goalId, completed]) => {
      if (Object.hasOwn(WORKFLOWS[mode].goals, goalId) && Array.isArray(completed)) {
        completedByGoal[goalId] = completed.filter((stepId) => typeof stepId === "string");
      }
    });
  }

  return {
    goal,
    draft: typeof candidate.draft === "string" ? candidate.draft : "",
    completedByGoal
  };
}

/** 从浏览器恢复版本化状态；读取失败时回退到当前页面内存。 */
function loadWorkflowState() {
  const fallback = {
    version: 1,
    standard: createDefaultModeState("standard"),
    adult: createDefaultModeState("adult")
  };

  try {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const stored = JSON.parse(raw);
    if (!stored || stored.version !== 1) {
      return fallback;
    }

    return {
      version: 1,
      standard: normalizeModeState("standard", stored.standard),
      adult: normalizeModeState("adult", stored.adult)
    };
  } catch {
    storageHealthy = false;
    return fallback;
  }
}

/** 将常规与成人向状态一起持久化；失败时保留内存中的可操作状态。 */
function saveWorkflowState() {
  try {
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflowState));
    storageHealthy = true;
    return true;
  } catch {
    storageHealthy = false;
    return false;
  }
}

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

/** 创建只包含文本的元素，供动态向导安全复用。 */
function createTextElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = textContent;
  return element;
}

/** 返回当前模式保存的目标和对应路线配置。 */
function getCurrentGoal() {
  const modeState = workflowState[state.mode];
  const goalId = Object.hasOwn(WORKFLOWS[state.mode].goals, modeState.goal)
    ? modeState.goal
    : Object.keys(WORKFLOWS[state.mode].goals)[0];
  modeState.goal = goalId;
  return { goalId, config: WORKFLOWS[state.mode].goals[goalId] };
}

/** 把步骤中的档案引用或外部工具信息整理为统一结构。 */
function getStepTool(step) {
  if (step.slug) {
    return archiveBySlug[step.slug];
  }

  return {
    href: step.href,
    title: step.tool,
    icon: step.icon || "external-link",
    accent: step.accent || "#e7ad61"
  };
}

/** 返回当前路线已完成步骤的集合，并过滤已经失效的旧步骤。 */
function getCompletedStepIds() {
  const modeState = workflowState[state.mode];
  const { goalId, config } = getCurrentGoal();
  const validIds = new Set(config.steps.map((step) => step.id));
  const stored = modeState.completedByGoal[goalId] || [];
  const completed = new Set(stored.filter((stepId) => validIds.has(stepId)));
  modeState.completedByGoal[goalId] = Array.from(completed);
  return completed;
}

/** 同步进度文字、进度条和步骤完成视觉。 */
function updateWorkflowProgress() {
  const { config } = getCurrentGoal();
  const completed = getCompletedStepIds();
  const total = config.steps.length;
  const count = completed.size;

  elements.workflowProgressText.textContent = count + " / " + total + " 已完成";
  elements.workflowProgressBar.setAttribute("aria-valuemax", String(total));
  elements.workflowProgressBar.setAttribute("aria-valuenow", String(count));
  elements.workflowProgressFill.style.width = (total ? (count / total) * 100 : 0) + "%";

  elements.workflowTrack.querySelectorAll(".workflow-step").forEach((item) => {
    item.classList.toggle("is-complete", completed.has(item.dataset.stepId));
  });
  elements.workflowFinish.classList.toggle("is-complete", total > 0 && count === total);
}

/** 展开指定步骤并收起其余步骤；传入空值时全部收起。 */
function setExpandedStep(stepId, shouldFocus = false) {
  expandedStepId = stepId;

  elements.workflowTrack.querySelectorAll(".workflow-step").forEach((item) => {
    const expanded = item.dataset.stepId === stepId;
    const trigger = item.querySelector(".workflow-step__header");
    const body = item.querySelector(".workflow-step__body");

    item.classList.toggle("is-expanded", expanded);
    trigger?.setAttribute("aria-expanded", String(expanded));
    if (body) {
      body.hidden = !expanded;
    }
  });

  if (shouldFocus && stepId) {
    elements.workflowTrack
      .querySelector(`.workflow-step[data-step-id="${CSS.escape(stepId)}"] .workflow-step__header`)
      ?.focus({ preventScroll: true });
  }
}

/** 保存单个步骤的勾选状态并立即刷新进度。 */
function setStepCompleted(stepId, completed) {
  const modeState = workflowState[state.mode];
  const { goalId } = getCurrentGoal();
  const completedIds = getCompletedStepIds();

  if (completed) {
    completedIds.add(stepId);
  } else {
    completedIds.delete(stepId);
  }

  modeState.completedByGoal[goalId] = Array.from(completedIds);
  saveWorkflowState();
  updateWorkflowProgress();

  const { config } = getCurrentGoal();
  if (!completed) {
    setExpandedStep(stepId);
    return;
  }

  const nextStep = config.steps.find((step) => !completedIds.has(step.id));
  if (nextStep) {
    setExpandedStep(nextStep.id, true);
  }
}

/** 渲染“你现在手里有什么”目标按钮，并支持随时切换路线。 */
function renderGoalSwitch() {
  const { goalId } = getCurrentGoal();
  elements.goalSwitch.replaceChildren();

  Object.entries(WORKFLOWS[state.mode].goals).forEach(([candidateId, goal]) => {
    const button = document.createElement("button");
    const icon = document.createElement("i");
    const label = createTextElement("span", "", goal.label);
    const isActive = candidateId === goalId;

    button.type = "button";
    button.className = "goal-switch__button";
    button.dataset.goal = candidateId;
    button.setAttribute("aria-pressed", String(isActive));
    button.classList.toggle("is-active", isActive);
    icon.dataset.lucide = goal.icon;
    button.append(icon, label);
    button.addEventListener("click", () => {
      if (workflowState[state.mode].goal === candidateId) {
        return;
      }
      workflowState[state.mode].goal = candidateId;
      saveWorkflowState();
      setDraftStatus("已切换路线，草稿仍为你保留。");
      renderWorkflow();
      // 重渲染会替换按钮节点，主动把键盘焦点交回新的选中按钮。
      Array.from(elements.goalSwitch.querySelectorAll("button"))
        .find((candidate) => candidate.dataset.goal === candidateId)
        ?.focus();
    });
    elements.goalSwitch.append(button);
  });
}

/** 向步骤说明列表加入一个“说明项 + 内容”组合。 */
function appendStepDetail(list, term, content, modifier) {
  const item = document.createElement("div");
  if (modifier) {
    item.className = modifier;
  }
  item.append(
    createTextElement("dt", "", term),
    createTextElement("dd", "", content)
  );
  list.append(item);
}

/** 创建一张包含任务、完成标准、产物和工具入口的步骤卡。 */
function createWorkflowStep(step, index, completedIds) {
  const tool = getStepTool(step);
  const item = document.createElement("li");
  const header = document.createElement("button");
  const iconBox = document.createElement("span");
  const icon = document.createElement("i");
  const copy = document.createElement("div");
  const chevron = document.createElement("i");
  const body = document.createElement("div");
  const details = document.createElement("dl");
  const footer = document.createElement("div");
  const checkLabel = document.createElement("label");
  const checkbox = document.createElement("input");
  const link = document.createElement("a");
  const linkIcon = document.createElement("i");
  const checkId = "workflow-check-" + state.mode + "-" + getCurrentGoal().goalId + "-" + step.id;
  const bodyId = "workflow-step-body-" + state.mode + "-" + getCurrentGoal().goalId + "-" + step.id;
  const isComplete = completedIds.has(step.id);
  const isExpanded = expandedStepId === step.id;

  item.className = "workflow-step";
  item.dataset.stepId = step.id;
  item.style.setProperty("--step-accent", tool.accent);
  item.classList.toggle("is-complete", isComplete);
  item.classList.toggle("is-expanded", isExpanded);

  header.type = "button";
  header.className = "workflow-step__header";
  header.setAttribute("aria-expanded", String(isExpanded));
  header.setAttribute("aria-controls", bodyId);
  iconBox.className = "workflow-step__icon";
  icon.dataset.lucide = tool.icon;
  iconBox.append(icon);
  copy.className = "workflow-step__copy";
  copy.append(
    createTextElement("small", "", tool.title),
    createTextElement("strong", "workflow-step__title", step.title)
  );
  header.append(
    createTextElement("span", "workflow-step__number", String(index + 1).padStart(2, "0")),
    iconBox,
    copy,
    chevron
  );
  chevron.dataset.lucide = "chevron-down";
  chevron.className = "workflow-step__chevron";
  header.addEventListener("click", () => {
    setExpandedStep(item.classList.contains("is-expanded") ? null : step.id);
  });

  body.id = bodyId;
  body.className = "workflow-step__body";
  body.hidden = !isExpanded;
  details.className = "workflow-step__details";
  appendStepDetail(details, "这一步做什么", step.task);
  appendStepDetail(details, "做到什么算完成", step.done);
  appendStepDetail(details, "带走什么结果", step.result, "workflow-step__result");

  footer.className = "workflow-step__footer";
  checkLabel.className = "workflow-step__check";
  checkLabel.htmlFor = checkId;
  checkbox.type = "checkbox";
  checkbox.id = checkId;
  checkbox.dataset.stepId = step.id;
  checkbox.checked = isComplete;
  checkbox.addEventListener("change", () => setStepCompleted(step.id, checkbox.checked));
  checkLabel.append(checkbox, createTextElement("span", "", "这一步完成了"));

  link.className = "workflow-step__link";
  link.href = tool.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.append(createTextElement("span", "", step.action), linkIcon);
  linkIcon.dataset.lucide = "arrow-up-right";
  footer.append(checkLabel, link);

  body.append(details, footer);
  item.append(header, body);
  return item;
}

/** 渲染当前路线的四个新手步骤和最终使用提示。 */
function renderWorkflow() {
  const { config } = getCurrentGoal();
  const completedIds = getCompletedStepIds();
  const fragment = document.createDocumentFragment();

  if (!config.steps.some((step) => step.id === expandedStepId)) {
    expandedStepId = config.steps.find((step) => !completedIds.has(step.id))?.id
      || config.steps.at(-1)?.id
      || null;
  }

  renderGoalSwitch();
  elements.workflowDescription.textContent = config.description;
  elements.workflowPrep.replaceChildren(
    ...config.prep.map((item) => createTextElement("li", "", item))
  );
  elements.workflowTrack.replaceChildren();
  config.steps.forEach((step, index) => {
    fragment.append(createWorkflowStep(step, index, completedIds));
  });
  elements.workflowTrack.append(fragment);
  elements.workflowFinish.querySelector("p").textContent = config.finish;
  elements.draftInput.placeholder = config.placeholder;
  updateWorkflowProgress();
  refreshIcons();
}

/** 用真实子页面截图渲染精选档案，避免只展示抽象图标。 */
function renderFeatured() {
  const featured = FEATURED_BY_MODE[state.mode];
  elements.featuredGrid.innerHTML = featured.map((item, index) => {
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
  initializeFeaturedTilt();
}

/** 给精选档案增加轻量 3D 倾斜；触控和减少动态设备保持静态。 */
function initializeFeaturedTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) {
    return;
  }

  elements.featuredGrid.querySelectorAll(".featured-item").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rectangle = card.getBoundingClientRect();
      const x = (event.clientX - rectangle.left) / rectangle.width;
      const y = (event.clientY - rectangle.top) / rectangle.height;
      card.style.setProperty("--tilt-x", `${((0.5 - y) * 5).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${((x - 0.5) * 6).toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      card.style.removeProperty("--shine-x");
      card.style.removeProperty("--shine-y");
    });
  });
}

/** 在草稿区播报保存、复制或清空结果。 */
function setDraftStatus(message) {
  elements.draftStatus.textContent = message;
}

/** 更新草稿字数和操作按钮状态。 */
function updateDraftMeta() {
  const draft = elements.draftInput.value;
  elements.draftCount.textContent = draft.length + " 字";
  elements.copyDraft.disabled = draft.trim().length === 0;
  elements.clearDraft.disabled = draft.length === 0;
}

/** 切换模式时恢复该模式独立保存的草稿。 */
function showDraftForCurrentMode() {
  elements.draftInput.value = workflowState[state.mode].draft;
  updateDraftMeta();
  if (!storageHealthy) {
    setDraftStatus("当前为临时草稿，关闭页面前请先复制。");
  } else if (elements.draftInput.value) {
    setDraftStatus("已恢复这个模式上次保存的草稿。");
  } else {
    setDraftStatus("");
  }
}

/** 延迟写入频繁变化的草稿，避免每次按键都访问本地存储。 */
function scheduleDraftSave() {
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(() => {
    const saved = saveWorkflowState();
    if (!saved) {
      setDraftStatus("当前为临时草稿，关闭页面前请先复制。");
    }
  }, 200);
}

/** 接收草稿输入，立即保留在内存并安排本地保存。 */
function handleDraftInput() {
  workflowState[state.mode].draft = elements.draftInput.value;
  updateDraftMeta();
  scheduleDraftSave();
}

/** 在模式切换或离开页面前立即提交仍在等待的草稿。 */
function flushDraftSave() {
  window.clearTimeout(draftSaveTimer);
  workflowState[state.mode].draft = elements.draftInput.value;
  saveWorkflowState();
}

/** 使用浏览器剪贴板写入文本，并为受限环境保留兼容路径。 */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 继续尝试旧浏览器可用的同步复制方式。
    }
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.readOnly = true;
  helper.style.position = "fixed";
  helper.style.inset = "-9999px auto auto -9999px";
  document.body.append(helper);
  helper.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    helper.remove();
  }
}

/** 复制当前模式草稿，并用中文状态反馈结果。 */
async function copyCurrentDraft() {
  const draft = elements.draftInput.value;
  if (!draft.trim()) {
    return;
  }

  const copied = await copyText(draft);
  setDraftStatus(copied ? "草稿已复制，可以去出图了。" : "复制未成功，请在草稿框中全选后复制。");
}

/** 经确认后仅清空当前模式草稿，保留另一模式和步骤进度。 */
function clearCurrentDraft() {
  if (!elements.draftInput.value) {
    return;
  }

  const confirmed = window.confirm("确定清空当前模式的提示词草稿吗？步骤进度会保留。");
  if (!confirmed) {
    setDraftStatus("已保留草稿。");
    return;
  }

  window.clearTimeout(draftSaveTimer);
  workflowState[state.mode].draft = "";
  elements.draftInput.value = "";
  saveWorkflowState();
  updateDraftMeta();
  setDraftStatus("当前模式的草稿已清空。");
  elements.draftInput.focus();
}

/** 折叠或展开草稿面板，手机上作为紧凑抽屉使用。 */
function setDraftCollapsed(collapsed) {
  elements.workflowDraft.classList.toggle("is-collapsed", collapsed);
  elements.draftToggle.setAttribute("aria-expanded", String(!collapsed));
  elements.draftToggle.setAttribute("aria-label", collapsed ? "展开提示词草稿" : "收起提示词草稿");
  elements.draftToolBody.hidden = collapsed;
}

/** 经确认后清空当前模式草稿和当前路线进度，其他路线保持不变。 */
function resetCurrentWorkflow() {
  const { goalId } = getCurrentGoal();
  const hasProgress = getCompletedStepIds().size > 0;
  const hasDraft = Boolean(elements.draftInput.value.trim());

  if (!hasProgress && !hasDraft) {
    setDraftStatus("这条路线已经是全新的。");
    return;
  }

  const confirmed = window.confirm("开始一次新创作会清空当前草稿与这条路线的步骤进度。其他路线和模式不会改变。继续吗？");
  if (!confirmed) {
    setDraftStatus("已保留当前创作。");
    return;
  }

  window.clearTimeout(draftSaveTimer);
  workflowState[state.mode].draft = "";
  workflowState[state.mode].completedByGoal[goalId] = [];
  elements.draftInput.value = "";
  expandedStepId = null;
  saveWorkflowState();
  renderWorkflow();
  updateDraftMeta();
  setDraftCollapsed(false);
  setDraftStatus("已开始一次新创作。");
  elements.draftInput.focus();
}

/** 同步搜索清空按钮状态，避免与浏览器原生清除控件重复。 */
function updateSearchClearState() {
  elements.clearSearch.disabled = elements.searchInput.value.length === 0;
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

  updateSearchClearState();

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
  if (mode !== state.mode) {
    flushDraftSave();
    elements.searchInput.value = "";
  }

  state.mode = mode;
  state.activeFilter = "all";
  document.body.dataset.mode = mode;

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  elements.workflowPanel.setAttribute(
    "aria-labelledby",
    mode === "adult" ? "adultMode" : "standardMode"
  );
  elements.archiveModeNote.textContent = mode === "adult"
    ? "当前显示成人向创作内容。"
    : "当前显示常规创作内容。";

  renderWorkflow();
  showDraftForCurrentMode();
  setDraftCollapsed(window.innerWidth <= 760 && !elements.draftInput.value.trim());
  renderFeatured();
  setFilter("all");
}

/** 读取本次浏览会话中的成人内容确认状态。 */
function hasAdultAcknowledgement() {
  if (adultAcknowledgedInMemory) {
    return true;
  }

  try {
    return window.sessionStorage.getItem("xingqiong-adult-acknowledged") === "true";
  } catch {
    return false;
  }
}

/** 记录成人内容确认；存储不可用时只在当前页面继续。 */
function rememberAdultAcknowledgement() {
  adultAcknowledgedInMemory = true;
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

    const confirmed = window.confirm("该路径包含成人向创作档案。请确认你已年满 18 岁并希望继续。");
    if (!confirmed) {
      elements.modeButtons.find((button) => button.dataset.mode === state.mode)?.focus();
      return;
    }
    rememberAdultAcknowledgement();
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

  elements.draftInput.addEventListener("input", handleDraftInput);
  elements.copyDraft.addEventListener("click", copyCurrentDraft);
  elements.clearDraft.addEventListener("click", clearCurrentDraft);
  elements.resetWorkflow.addEventListener("click", resetCurrentWorkflow);
  elements.draftToggle.addEventListener("click", () => {
    setDraftCollapsed(elements.draftToggle.getAttribute("aria-expanded") === "true");
  });
  window.addEventListener("pagehide", flushDraftSave);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushDraftSave();
    }
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
    if (window.innerWidth > 760 && elements.mainNav.classList.contains("is-open")) {
      setMobileMenu(false);
    }
  });

  elements.adultDialog.addEventListener("close", () => {
    if (elements.adultDialog.returnValue === "confirm") {
      rememberAdultAcknowledgement();
      setMode("adult");
      return;
    }

    window.setTimeout(() => {
      elements.modeButtons.find((button) => button.dataset.mode === state.mode)?.focus();
    }, 0);
  });
}

initializeHome();
