/* ===========================================================================
   星穹枢庭 · 星门说明
   ---------------------------------------------------------------------------
   在每个子页面顶部注入一张「这个星门是干什么的 + 可以联动去哪」的引导卡。
   样式使用 assets/sanctuary.css 的设计令牌，可折叠并记住用户的选择。
   =========================================================================== */

(function () {
  'use strict';

  const GATES = {
    'krea2': {
      icon: '🎨',
      name: 'Krea2 提示词工匠',
      alias: ['Krea2'],
      plain: '把一句普通想法，整理成更像绘图模型能听懂的完整提示词。',
      when: '当你只有“想画什么”的粗略念头，还不知道怎么写镜头、材质、光线和风格时，先来这里。',
      steps: ['先用中文写下你想要的画面。', '按页面里的卡槽补齐主体、动作、场景、镜头和风格。', '复制成品提示词，再去出图页或其它提示词星门继续细化。'],
      links: [
        ['prompt-engine', '补灵感结构，把想法拆得更稳'],
        ['lighting-codex', '补光影、氛围和镜头质感'],
        ['portal', '把整理好的提示词送去 ComfyUI 出图'],
        ['prompt-reader', '出图后反查图片里保存的提示词']
      ]
    },
    'prompt-reader': {
      icon: '📖',
      name: 'Prompt Reader',
      alias: ['Prompt Reader', '提示词与元数据管理'],
      plain: '读取图片里藏着的提示词、工作流或参数，帮你知道一张图是怎么来的。',
      when: '当你拿到一张 ComfyUI 图片，想复盘它的 prompt、workflow、seed 或模型参数时使用。',
      steps: ['拖入或选择图片。', '查看页面读出的提示词、节点或参数。', '把有用部分复制到提示词星门或星穹绘所里继续改。'],
      links: [
        ['wd-tagger', '如果图片没有元数据，就用 WD Tagger 反推标签'],
        ['portal', '把读出的工作流或提示词拿去重新出图'],
        ['cyber-summon', '把读出的标签整理成可复制组合'],
        ['reverse-showcase', '对照负面词，找出画面问题来源']
      ]
    },
    'drag-resolver': {
      icon: '⚡',
      name: 'Drag Resolver',
      alias: ['Drag Resolver'],
      plain: 'ComfyUI 拖不进图片或工作流时，用它排查是谁在挡。',
      when: '当你把图片、json 或 workflow 拖进 ComfyUI 没反应、弹错、页面卡住时，先来这里。',
      steps: ['打开排查页，按提示检查当前浏览器和 ComfyUI 状态。', '看它列出的可能冲突项。', '按建议临时关闭冲突插件或换入口，再回 ComfyUI 测试。'],
      links: [
        ['portal', '排查后回星穹绘所继续出图'],
        ['prompt-reader', '拖拽恢复后读取图片元数据'],
        ['wd-tagger', '如果只是想从图片提取标签，用 WD Tagger 更直接']
      ]
    },
    'wd-tagger': {
      icon: '🔍',
      name: 'WD 标签反推器',
      alias: ['WD 标签反推器', 'WD Tagger'],
      plain: '让本机 WD14 模型看一张图，然后给你一串 Danbooru 标签。',
      when: '当你想复刻一张图的元素、服装、构图或画风，但图片没有 prompt 元数据时使用。',
      steps: ['启动 WD14 后台，确认状态是“已就绪”。', '拖入图片，点击“反推标签”。', '选择想要的标签，复制到赛博魔典、魔典检索或出图页。'],
      links: [
        ['lust-codex', '查标签含义，筛掉不想要的词'],
        ['cyber-summon', '把反推标签组合成可用提示词'],
        ['portal', '把标签送去 ComfyUI 试画'],
        ['prompt-reader', '优先读取原图元数据，读不到再反推']
      ]
    },
    'nova-anima': {
      icon: '🌸',
      name: 'Nova Anima 黄金起词手册',
      alias: ['Nova Anima'],
      plain: '给 Anima / Nova Anima 这类二次元模型准备起手提示词。',
      when: '当你要画二次元角色，但不知道从哪些基础词、画风词、构图词开始时使用。',
      steps: ['先选角色主体和画风方向。', '再补姿态、镜头、背景和细节。', '最后加光影或标签组合，再去星穹绘所出图。'],
      links: [
        ['anima-guide', '需要更完整规则时看详细指南'],
        ['prompt-engine', '把灵感拆成稳定结构'],
        ['lighting-codex', '补光影气氛'],
        ['portal', '把成品提示词送去出图']
      ]
    },
    'lighting-codex': {
      icon: '✨',
      name: '双子星光影魔典',
      alias: ['Lighting Codex', '光影魔典'],
      plain: '专门给画面加“光从哪来、氛围是什么、质感像什么”。',
      when: '当图片主体已经想好，但画面太平、太灰、没有电影感或氛围感时使用。',
      steps: ['先选一个大氛围，比如清晨、霓虹、逆光、月光。', '复制对应光影词。', '贴到主提示词后面，再配合出图页测试。'],
      links: [
        ['nova-anima', '先定二次元主体和风格'],
        ['prompt-engine', '先把画面结构写完整'],
        ['cyber-summon', '把光影词和标签组合起来'],
        ['portal', '在 ComfyUI 里观察光影变化']
      ]
    },
    'prompt-engine': {
      icon: '🌿',
      name: 'Anima3 灵感魔盒',
      alias: ['Prompt Engine', '灵感魔盒'],
      plain: '把灵感拆成模块，避免提示词乱堆导致画面跑偏。',
      when: '当你脑子里有很多想法，但不知道哪些该放主体、哪些该放风格、哪些会互相打架时使用。',
      steps: ['先按页面分类挑选主体、动作、场景和风格。', '查看互斥或避坑提示，删掉冲突词。', '把整理好的结构交给光影、标签或出图星门。'],
      links: [
        ['nova-anima', '拿到更适合 Anima 的起手词'],
        ['anima-guide', '查更细的模型写法'],
        ['lighting-codex', '补画面氛围'],
        ['portal', '把稳定结构送去出图']
      ]
    },
    'cyber-summon': {
      icon: '🔮',
      name: '赛博魔典',
      alias: ['Cyber Summon', '赛博魔典'],
      plain: '把零散 Danbooru 标签整理成一段可复制的提示词组合。',
      when: '当你已经有一堆标签，但想快速筛选、加权、组合、复制时使用。',
      steps: ['从标签库、WD Tagger 或手动输入里拿到标签。', '挑选需要的词，按权重或分组整理。', '复制到星穹绘所或其它出图工具里测试。'],
      links: [
        ['wd-tagger', '从参考图自动反推标签'],
        ['lust-codex', '查标签意思和同类词'],
        ['nsfw-tags', '需要成人向标签时先查分类'],
        ['portal', '把组合好的标签送去出图']
      ]
    },
    'secret-scroll': {
      icon: '📜',
      name: '密使之札',
      alias: ['Secret Scroll', '密使之札'],
      plain: '偏文本协议和写法备忘录，用来整理复杂表达方式，不是直接出图工具。',
      when: '当你想把一套沟通规则、术语、暗号或写作约定保存成可复用格式时使用。',
      steps: ['先看它定义的术语和格式。', '把要传递的信息按固定结构整理。', '再交给解码终端或其它文本星门还原、检查。'],
      links: [
        ['moon-scroll', '查看跨模型/跨姐妹的消息约定'],
        ['decoder-terminal', '把约定格式还原成可读说明'],
        ['portal', '如果目标是出图，最后仍要回到星穹绘所']
      ]
    },
    'lust-codex': {
      icon: '📚',
      name: '魔典检索',
      alias: ['Lust Codex', '魔典检索'],
      plain: '像字典一样查 Danbooru 标签，知道每个词大概管什么。',
      when: '当你不知道某个标签什么意思，或者想找同类姿态、服装、构图、风格词时使用。',
      steps: ['输入关键词或按分类浏览。', '点击/复制有用标签。', '把标签交给赛博魔典组合，或直接贴到出图页。'],
      links: [
        ['wd-tagger', '从图里反推出候选标签'],
        ['cyber-summon', '把查到的标签组合成咒语'],
        ['nsfw-tags', '成人向标签先看专门分类'],
        ['portal', '把筛好的标签用于实际出图']
      ]
    },
    'portal': {
      icon: '🌙',
      name: '星穹绘所',
      alias: ['星穹绘所', 'Star Lab'],
      plain: '真正连接 ComfyUI 出图的工作台。其它星门多半是在帮它准备 prompt、标签或排错。',
      when: '当提示词已经整理好，或者你想直接启动桥接、启动 ComfyUI、提交生成任务时使用。',
      steps: ['确认桥接和 ComfyUI 状态。', '把提示词、负面词、尺寸和风格参数填好。', '点击生成，出图后再用读取或反推工具复盘。'],
      links: [
        ['nova-anima', '先准备二次元主体提示词'],
        ['lighting-codex', '补光影气氛'],
        ['wd-tagger', '用参考图反推标签再回来出图'],
        ['prompt-reader', '读取生成图里保存的工作流']
      ]
    },
    'anima-guide': {
      icon: '🎭',
      name: 'Anima 提示词指南',
      alias: ['ANIMA3', 'Anima 提示词指南'],
      plain: 'Anima 系模型的详细参考书，适合查规则、模板和写法。',
      when: '当 Nova Anima 快速手册不够用，想系统理解角色、构图、风格、光照写法时使用。',
      steps: ['先看目录，找到你要补的部分。', '复制或改写里面的模板。', '回到灵感魔盒、光影魔典或星穹绘所继续落地。'],
      links: [
        ['nova-anima', '需要快速起手时用精简手册'],
        ['prompt-engine', '把指南内容拆成实战结构'],
        ['lighting-codex', '补充光影部分'],
        ['portal', '把模板送去出图测试']
      ]
    },
    'nsfw-tags': {
      icon: '🔞',
      name: 'NSFW 标签大全',
      alias: ['NSFW 标签大全', 'Danbooru NSFW'],
      plain: '成人向 Danbooru 标签的分类速查表，核心作用是查词和整理标签。',
      when: '当你需要理解成人向标签属于哪类、该怎么归类、哪些词容易混淆时使用。',
      steps: ['先按分类找到大方向。', '只复制你确实需要的标签，避免一次堆太多。', '交给赛博魔典或魔典检索继续筛选，再用于本地工作流。'],
      links: [
        ['cyber-summon', '把标签组合和加权'],
        ['lust-codex', '查更广的 Danbooru 标签'],
        ['wd-tagger', '从参考图反推候选标签'],
        ['portal', '本地出图时使用整理后的标签']
      ]
    },
    'reverse-showcase': {
      icon: '🔄',
      name: '反向提示词展示',
      alias: ['反向提示词展示', 'Negative Prompt Showcase'],
      plain: '展示负面词/反向词对画面的影响，帮你知道哪些词能修坏图。',
      when: '当图出现多手、糊脸、畸形、背景乱、质感脏等问题，想知道该加什么负面词时使用。',
      steps: ['先找到和你问题相近的展示项。', '复制对应负面词或排错思路。', '回到出图页小步测试，不要一次加太多。'],
      links: [
        ['portal', '把负面词放进出图工作台测试'],
        ['prompt-reader', '读取坏图参数，确认问题来源'],
        ['wd-tagger', '看坏图里是否有多余标签'],
        ['lighting-codex', '有时光影词也能改善画面脏乱']
      ]
    },
    'moon-scroll': {
      icon: '🌙',
      name: '月卷协议',
      alias: ['月卷协议', 'Moon Scroll'],
      plain: '跨模型/跨会话的消息约定说明，方便把同一套术语传给不同工具。',
      when: '当你要让不同“栖栖”或不同工具读懂同一份上下文、暗号或约定时使用。',
      steps: ['先看协议里每段代表什么。', '按固定格式写出要传递的内容。', '交给解码终端检查能不能还原。'],
      links: [
        ['decoder-terminal', '测试协议文本能不能正确解码'],
        ['secret-scroll', '整理更复杂的文本规则'],
        ['portal', '需要出图时，把协议里的视觉需求转成 prompt']
      ]
    },
    'decoder-terminal': {
      icon: '💻',
      name: '解码终端',
      alias: ['解码终端', 'Decoder Terminal'],
      plain: '把约定格式、暗号或跨模型消息翻译回普通人能读懂的文本。',
      when: '当你从月卷协议或其它文本星门拿到一段编码信息，想确认它表达了什么时使用。',
      steps: ['把要解码的文本贴进去。', '查看还原后的说明。', '如果要继续出图，再把视觉需求送去提示词星门。'],
      links: [
        ['moon-scroll', '先了解消息格式怎么写'],
        ['secret-scroll', '整理更复杂的文本协议'],
        ['prompt-engine', '把解码出的视觉需求拆成 prompt 结构']
      ]
    }
  };

  const COLLAPSE_KEY = 'xingqiong-gate-guide-collapsed';

  const style = `
.gs-beginner-guide {
  position: relative;
  z-index: 20;
  width: min(var(--xq-page, 1180px), 100%);
  padding: 1px;
  border-radius: var(--xq-r-xl, 26px);
  margin: 1.05rem auto 1.6rem;
  background: linear-gradient(135deg, rgba(255, 226, 178, .3), rgba(116, 196, 212, .16), rgba(255, 178, 205, .2));
  box-shadow: var(--xq-shadow-lg, 0 24px 90px rgba(0, 0, 0, .34));
  color: var(--xq-text-soft, rgba(238, 238, 250, .82));
  font-family: var(--xq-font-sans, sans-serif);
  overflow: hidden;
}
.gs-beginner-guide::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: calc(var(--xq-r-xl, 26px) - 1px);
  background:
    radial-gradient(circle at 14% 0%, rgba(242, 189, 115, .14), transparent 34%),
    radial-gradient(circle at 92% 18%, rgba(129, 230, 255, .11), transparent 32%),
    linear-gradient(180deg, rgba(9, 14, 28, .9), rgba(10, 12, 26, .78));
}
.gs-beginner-guide::after {
  content: '';
  position: absolute;
  top: 0;
  right: 26px;
  left: 26px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--xq-line-strong, rgba(255, 225, 166, .64)), transparent);
  opacity: .8;
}
.gs-beginner-guide * { box-sizing: border-box; }
.gs-beginner-guide a { color: inherit; text-decoration: none; }

.gs-guide-head { display: flex; gap: 1rem; align-items: flex-start; padding: 1.05rem 1.05rem .8rem; }
.gs-guide-icon {
  width: 3rem; height: 3rem; flex: 0 0 auto;
  display: grid; place-items: center;
  border: 1px solid var(--xq-line, rgba(255, 225, 166, .18));
  border-radius: var(--xq-r-lg, 18px);
  background: rgba(255, 255, 255, .055);
  box-shadow: var(--xq-inner-top, inset 0 1px 0 rgba(255, 255, 255, .08)), 0 14px 34px rgba(0, 0, 0, .18);
  font-size: 1.38rem;
}
.gs-guide-kicker {
  font-size: .68rem; letter-spacing: .18em; text-transform: uppercase;
  color: var(--xq-gold-bright, rgba(255, 225, 166, .72));
}
.gs-guide-title {
  margin: .12rem 0 0;
  color: var(--xq-gold-bright, #ffe1a6);
  font-family: var(--xq-font-serif, serif);
  font-size: 1.18rem; font-weight: 800; line-height: 1.35;
}
.gs-guide-plain { margin: .36rem 0 0; font-size: .9rem; line-height: 1.78; }

.gs-guide-toggle {
  flex: 0 0 auto; align-self: center;
  display: inline-flex; align-items: center; gap: .38rem;
  padding: .34rem .8rem;
  border: 1px solid var(--xq-line-soft, rgba(255, 255, 255, .08));
  border-radius: var(--xq-r-pill, 999px);
  background: rgba(255, 255, 255, .04);
  color: var(--xq-text-muted, rgba(226, 226, 244, .6));
  font: inherit; font-size: .72rem; cursor: pointer;
  transition: color .16s ease, border-color .16s ease, background .16s ease;
}
.gs-guide-toggle:hover {
  border-color: var(--xq-line-strong, rgba(255, 225, 166, .38));
  background: var(--xq-accent-soft, rgba(242, 189, 115, .1));
  color: var(--xq-gold-bright, #ffe1a6);
}
.gs-guide-toggle span:last-child { transition: transform .2s ease; }
.gs-beginner-guide.is-collapsed .gs-guide-toggle span:last-child { transform: rotate(-90deg); }

.gs-guide-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .32s ease; }
.gs-beginner-guide.is-collapsed .gs-guide-body { grid-template-rows: 0fr; }
.gs-guide-body > div { overflow: hidden; min-height: 0; }
.gs-beginner-guide.is-collapsed .gs-guide-head { padding-bottom: 1.05rem; }
.gs-beginner-guide.is-collapsed .gs-guide-plain { display: none; }

.gs-guide-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 1.04fr);
  gap: .8rem;
  padding: 0 1.05rem 1.05rem;
}
.gs-guide-card {
  padding: .9rem .95rem;
  border: 1px solid var(--xq-line-soft, rgba(255, 255, 255, .075));
  border-radius: var(--xq-r-lg, 18px);
  background: rgba(255, 255, 255, .035);
}
.gs-guide-card h3 {
  margin: 0 0 .55rem;
  color: var(--xq-gold, #f2bd73);
  font-size: .86rem; font-weight: 800; letter-spacing: .03em;
}
.gs-guide-card h3 + h3 { margin-top: .75rem; }
.gs-guide-card p { margin: 0; font-size: .8rem; line-height: 1.75; color: var(--xq-text-muted, rgba(230, 230, 248, .62)); }
.gs-guide-card ol { margin: .18rem 0 0 1.15rem; padding: 0; font-size: .8rem; line-height: 1.8; }
.gs-guide-card li { padding-left: .15rem; }

.gs-link-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .52rem; }
.gs-link-card {
  display: block; padding: .66rem .72rem;
  border: 1px solid var(--xq-line, rgba(255, 225, 166, .13));
  border-radius: var(--xq-r-md, 15px);
  background: rgba(255, 255, 255, .04);
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}
.gs-link-card:hover {
  transform: translateY(-2px);
  border-color: var(--xq-line-strong, rgba(255, 225, 166, .38));
  background: var(--xq-accent-soft, rgba(242, 189, 115, .09));
}
.gs-link-name {
  display: flex; align-items: center; gap: .42rem;
  color: var(--xq-gold-bright, #ffe1a6);
  font-size: .78rem; font-weight: 800;
}
.gs-link-why { display: block; margin-top: .3rem; font-size: .7rem; line-height: 1.55; color: var(--xq-text-faint, rgba(225, 225, 245, .52)); }

.gs-guide-note {
  margin: 0 1.05rem 1.05rem;
  padding: .66rem .8rem;
  border: 1px solid rgba(116, 196, 212, .14);
  border-radius: var(--xq-r-md, 15px);
  background: rgba(116, 196, 212, .06);
  color: rgba(224, 248, 255, .66);
  font-size: .72rem; line-height: 1.65;
}

@media (max-width: 760px) {
  .gs-beginner-guide { margin: .85rem .75rem 1rem; width: auto; }
  .gs-guide-head { padding: .9rem .9rem .7rem; }
  .gs-guide-grid, .gs-link-grid { grid-template-columns: 1fr; }
  .gs-guide-grid { padding: 0 .9rem .9rem; }
  .gs-guide-note { margin: 0 .9rem .9rem; }
  .gs-guide-title { font-size: 1.02rem; }
}

@media (prefers-reduced-motion: reduce) {
  .gs-link-card, .gs-guide-body, .gs-guide-toggle span:last-child { transition: none; }
  .gs-link-card:hover { transform: none; }
}
`;

  function addStyle() {
    if (document.getElementById('gs-gate-guide-style')) return;
    const tag = document.createElement('style');
    tag.id = 'gs-gate-guide-style';
    tag.textContent = style;
    document.head.appendChild(tag);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function currentSlug() {
    const path = decodeURIComponent(location.pathname || '').replace(/\\/g, '/');
    const parts = path.split('/').filter(Boolean);
    if ((parts[parts.length - 1] || '').toLowerCase() === 'index.html') parts.pop();
    const slug = parts[parts.length - 1] || '';
    if (GATES[slug]) return slug;

    const title = document.title || '';
    for (const [key, gate] of Object.entries(GATES)) {
      if ((gate.alias || []).some(hint => title.includes(hint))) return key;
    }
    return '';
  }

  function linkCard(slug, why) {
    const gate = GATES[slug];
    if (!gate) return '';
    return `<a class="gs-link-card" href="../${esc(slug)}/index.html">`
      + `<span class="gs-link-name"><span>${esc(gate.icon)}</span>${esc(gate.name)}</span>`
      + `<span class="gs-link-why">${esc(why)}</span></a>`;
  }

  function readCollapsed() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function writeCollapsed(collapsed) {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // 隐私模式下写入会失败，只在本次浏览中保持状态即可。
    }
  }

  function renderGuide(slug) {
    const gate = GATES[slug];
    if (!gate || document.getElementById('gs-beginner-guide')) return;

    const section = document.createElement('section');
    section.id = 'gs-beginner-guide';
    section.className = 'gs-beginner-guide';
    section.setAttribute('aria-label', `${gate.name} 星门说明`);
    section.innerHTML = `
      <div class="gs-guide-head">
        <div class="gs-guide-icon" aria-hidden="true">${esc(gate.icon)}</div>
        <div style="flex:1 1 auto;min-width:0">
          <p class="gs-guide-kicker">星门说明 · 新手可读</p>
          <h2 class="gs-guide-title">${esc(gate.name)} 是干什么的？</h2>
          <p class="gs-guide-plain">${esc(gate.plain)}</p>
        </div>
        <button class="gs-guide-toggle" type="button" aria-expanded="true" aria-controls="gs-guide-body">
          <span class="gs-guide-toggle-label">收起</span><span aria-hidden="true">▾</span>
        </button>
      </div>
      <div class="gs-guide-body" id="gs-guide-body"><div>
        <div class="gs-guide-grid">
          <div class="gs-guide-card">
            <h3>什么时候用它</h3>
            <p>${esc(gate.when)}</p>
            <h3>三步上手</h3>
            <ol>${gate.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
          </div>
          <div class="gs-guide-card">
            <h3>可以联动的星门</h3>
            <div class="gs-link-grid">${gate.links.map(([target, why]) => linkCard(target, why)).join('')}</div>
          </div>
        </div>
        <div class="gs-guide-note">小提示：如果你不知道下一步去哪，就按右侧联动卡片从上往下试；“查词 / 整理 prompt / 出图 / 复盘”通常是一个闭环。</div>
      </div></div>
    `;

    const toggle = section.querySelector('.gs-guide-toggle');
    const label = section.querySelector('.gs-guide-toggle-label');

    function applyCollapsed(collapsed) {
      section.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      label.textContent = collapsed ? '展开说明' : '收起';
    }

    applyCollapsed(readCollapsed());
    toggle.addEventListener('click', () => {
      const collapsed = !section.classList.contains('is-collapsed');
      applyCollapsed(collapsed);
      writeCollapsed(collapsed);
    });

    insertNearHeader(section);
  }

  function insertNearHeader(node) {
    const candidates = [
      document.querySelector('.page-header'),
      document.querySelector('.hero'),
      document.querySelector('main > header'),
      document.querySelector('header')
    ].filter(Boolean);

    // 只接受不在窄侧栏里的落点，否则 1180px 的卡片会挤垮固定侧栏布局。
    const target = candidates.find(candidate => !candidate.closest('aside, nav, .sidebar'));

    if (target && target.parentNode) target.parentNode.insertBefore(node, target.nextSibling);
    else (document.querySelector('main') || document.body).prepend(node);
  }

  function init() {
    const slug = currentSlug();
    if (!slug) return;
    addStyle();
    renderGuide(slug);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
