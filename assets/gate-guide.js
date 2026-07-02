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

  const HOME_ROUTES = [
    {
      icon: '🟢',
      title: '第一次想直接出图',
      desc: '先搭好主体，再补氛围，最后去 ComfyUI 生成。',
      steps: ['Nova Anima 起手', 'Lighting Codex 补光影', 'Cyber Summon 整理标签', '星穹绘所出图'],
      links: ['nova-anima', 'lighting-codex', 'cyber-summon', 'portal']
    },
    {
      icon: '🔁',
      title: '看到参考图想复刻',
      desc: '先从图片拿信息，再把标签变成可控提示词。',
      steps: ['Prompt Reader 读元数据', 'WD Tagger 反推标签', 'Lust Codex 查词', '星穹绘所重画'],
      links: ['prompt-reader', 'wd-tagger', 'lust-codex', 'portal']
    },
    {
      icon: '🧯',
      title: 'ComfyUI 出问题',
      desc: '先排拖拽和工作流问题，再回到出图。',
      steps: ['Drag Resolver 排错', 'Prompt Reader 检查图片/工作流', 'Reverse Showcase 修负面词', '星穹绘所复测'],
      links: ['drag-resolver', 'prompt-reader', 'reverse-showcase', 'portal']
    },
    {
      icon: '🧭',
      title: '不知道该用哪个标签',
      desc: '先查词，再组合，不要一股脑全塞进 prompt。',
      steps: ['Lust Codex 查普通标签', 'NSFW Tags 查成人向分类', 'Cyber Summon 组合加权', '星穹绘所测试'],
      links: ['lust-codex', 'nsfw-tags', 'cyber-summon', 'portal']
    },
    {
      icon: '🗝️',
      title: '跨工具共享说明',
      desc: '把固定术语和上下文写成协议，再用终端检查。',
      steps: ['Moon Scroll 看格式', 'Decoder Terminal 解码检查', 'Secret Scroll 存复杂约定'],
      links: ['moon-scroll', 'decoder-terminal', 'secret-scroll']
    }
  ];

  const style = `

    .gs-beginner-guide, .gs-route-map { position: relative; z-index: 20; max-width: 1120px; margin: 1.05rem auto 1.45rem; padding: 1px; border-radius: 26px; background: linear-gradient(135deg, rgba(255,225,166,.34), rgba(129,230,255,.18), rgba(255,158,201,.22)); box-shadow: 0 24px 90px rgba(0,0,0,.34); color: rgba(238,238,250,.82); font-family: 'Noto Sans SC','Microsoft YaHei',sans-serif; box-sizing: border-box; overflow: hidden; }
    .gs-beginner-guide::before, .gs-route-map::before { content: ''; position: absolute; inset: 1px; border-radius: 25px; background: radial-gradient(circle at 14% 0%, rgba(242,189,115,.14), transparent 34%), radial-gradient(circle at 92% 18%, rgba(129,230,255,.11), transparent 32%), linear-gradient(180deg, rgba(9,14,28,.88), rgba(10,12,26,.74)); z-index: -1; }
    .gs-beginner-guide::after, .gs-route-map::after { content: ''; position: absolute; left: 26px; right: 26px; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,225,166,.64), transparent); opacity: .7; }
    .gs-beginner-guide *,.gs-route-map *{box-sizing:border-box}.gs-beginner-guide a,.gs-route-map a{color:inherit;text-decoration:none}
    .gs-guide-head{display:flex;gap:1rem;align-items:flex-start;padding:1.05rem 1.05rem .75rem}.gs-guide-icon{width:3rem;height:3rem;display:grid;place-items:center;border-radius:18px;background:rgba(255,255,255,.055);border:1px solid rgba(255,225,166,.18);font-size:1.38rem;flex:0 0 auto;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 34px rgba(0,0,0,.18)}.gs-guide-kicker{font-size:.68rem;letter-spacing:.18em;color:rgba(255,225,166,.72);text-transform:uppercase}.gs-guide-title{margin:.12rem 0 0;color:#ffe1a6;font-family:'Noto Serif SC','Songti SC',serif;font-weight:900;font-size:1.18rem;line-height:1.35}.gs-guide-plain{margin:.36rem 0 0;color:rgba(238,238,255,.78);font-size:.9rem;line-height:1.78}.gs-guide-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,1.04fr);gap:.8rem;padding:0 1.05rem 1.05rem}.gs-guide-card{border:1px solid rgba(255,255,255,.075);border-radius:18px;background:rgba(255,255,255,.035);padding:.9rem .95rem}.gs-guide-card h3{margin:0 0 .55rem;color:#f2bd73;font-size:.86rem;font-weight:900;letter-spacing:.03em}.gs-guide-card p{margin:0;color:rgba(230,230,248,.62);font-size:.8rem;line-height:1.75}.gs-guide-card ol{margin:.18rem 0 0 1.15rem;padding:0;color:rgba(230,230,248,.74);font-size:.8rem;line-height:1.8}.gs-guide-card li{padding-left:.15rem}.gs-link-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.52rem}.gs-link-card{display:block;border:1px solid rgba(255,225,166,.13);border-radius:15px;padding:.66rem .72rem;background:rgba(255,255,255,.04);transition:transform .18s ease,border-color .18s ease,background .18s ease}.gs-link-card:hover{transform:translateY(-2px);border-color:rgba(255,225,166,.38);background:rgba(242,189,115,.09)}.gs-link-name{display:flex;align-items:center;gap:.42rem;color:#ffe1a6;font-size:.78rem;font-weight:900}.gs-link-why{display:block;margin-top:.3rem;color:rgba(225,225,245,.52);font-size:.7rem;line-height:1.55}.gs-guide-note{margin:0 1.05rem 1.05rem;padding:.66rem .8rem;border-radius:15px;background:rgba(129,230,255,.06);border:1px solid rgba(129,230,255,.13);color:rgba(224,248,255,.64);font-size:.72rem;line-height:1.65}
    .gs-route-title{display:flex;align-items:center;gap:.55rem;margin:1.05rem 1.05rem .25rem;color:#ffe1a6;font-family:'Noto Serif SC','Songti SC',serif;font-size:1.18rem;font-weight:900}.gs-route-sub{color:rgba(232,232,248,.56);font-size:.82rem;line-height:1.7;margin:0 1.05rem .9rem}.gs-route-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.7rem;padding:0 1.05rem 1.05rem}.gs-route-card{border:1px solid rgba(255,255,255,.075);border-radius:18px;background:rgba(255,255,255,.035);padding:.9rem}.gs-route-card h3{margin:0 0 .35rem;color:#ffe1a6;font-size:.9rem}.gs-route-card p{margin:0 0 .55rem;color:rgba(232,232,248,.54);font-size:.74rem;line-height:1.65}.gs-route-steps{display:flex;flex-wrap:wrap;gap:.35rem}.gs-route-pill{display:inline-flex;align-items:center;gap:.25rem;padding:.26rem .52rem;border-radius:999px;background:rgba(129,230,255,.075);border:1px solid rgba(129,230,255,.14);color:rgba(221,249,255,.78);font-size:.66rem}
    @media(max-width:760px){.gs-beginner-guide,.gs-route-map{margin:.85rem .75rem 1rem}.gs-guide-head{padding:.9rem .9rem .65rem}.gs-guide-grid{grid-template-columns:1fr;padding:0 .9rem .9rem}.gs-link-grid{grid-template-columns:1fr}.gs-guide-note{margin:0 .9rem .9rem}.gs-guide-title{font-size:1.02rem}.gs-route-grid{grid-template-columns:1fr;padding:0 .9rem .9rem}.gs-route-title,.gs-route-sub{margin-left:.9rem;margin-right:.9rem}}
  
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
    let slug = parts[parts.length - 1] || '';
    if (GATES[slug]) return slug;
    const title = document.title || '';
    for (const [key, gate] of Object.entries(GATES)) {
      if ((gate.alias || []).some(hint => title.includes(hint))) return key;
    }
    if (/Gemini Sanctuary|双子星秘境|GEMINI SANCTUARY/i.test(title) || /GeminiSanctuary/i.test(slug)) return '__home';
    return '';
  }

  function isHome() {
    return currentSlug() === '__home';
  }

  function hrefFor(slug) {
    if (!slug || !GATES[slug]) return '#';
    const target = `${slug}/index.html`;
    return isHome() ? target : `../${target}`;
  }

  function linkCard(slug, why) {
    const gate = GATES[slug];
    if (!gate) return '';
    return `<a class="gs-link-card" href="${esc(hrefFor(slug))}"><span class="gs-link-name"><span>${esc(gate.icon)}</span>${esc(gate.name)}</span><span class="gs-link-why">${esc(why)}</span></a>`;
  }

  function routePill(slug, index) {
    const gate = GATES[slug];
    if (!gate) return '';
    return `<a class="gs-route-pill" href="${esc(hrefFor(slug))}">${index + 1}. ${esc(gate.name)}</a>`;
  }

  function renderGuide(slug) {
    const gate = GATES[slug];
    if (!gate || document.getElementById('gs-beginner-guide')) return;
    const el = document.createElement('section');
    el.id = 'gs-beginner-guide';
    el.className = 'gs-beginner-guide';
    el.setAttribute('aria-label', `${gate.name} 星门说明`);
    el.innerHTML = `
      <div class="gs-guide-head">
        <div class="gs-guide-icon">${esc(gate.icon)}</div>
        <div>
          <div class="gs-guide-kicker">星门说明 · 新手可读</div>
          <div class="gs-guide-title">${esc(gate.name)} 是干什么的？</div>
          <p class="gs-guide-plain">${esc(gate.plain)}</p>
        </div>
      </div>
      <div class="gs-guide-grid">
        <div class="gs-guide-card">
          <h3>什么时候用它</h3>
          <p>${esc(gate.when)}</p>
          <h3 style="margin-top:.75rem">三步上手</h3>
          <ol>${gate.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
        </div>
        <div class="gs-guide-card">
          <h3>可以联动的星门</h3>
          <div class="gs-link-grid">${gate.links.map(([target, why]) => linkCard(target, why)).join('')}</div>
        </div>
      </div>
      <div class="gs-guide-note">小提示：如果你不知道下一步去哪，就按右侧联动卡片从上往下试；“查词/整理 prompt/出图/复盘”通常是一个闭环。</div>
    `;
    insertNearHeader(el);
  }

  function renderHomeRoutes() {
    if (document.getElementById('gs-route-map')) return;
    const el = document.createElement('section');
    el.id = 'gs-route-map';
    el.className = 'gs-route-map';
    el.setAttribute('aria-label', '新手星门路线图');
    el.innerHTML = `
      <div class="gs-route-title">🧭 新手星门路线图</div>
      <div class="gs-route-sub">不知道先开哪个星门时，就按目标走下面的路线。每个子页面里也会显示“它能和谁联动”。</div>
      <div class="gs-route-grid">
        ${HOME_ROUTES.map(route => `
          <div class="gs-route-card">
            <h3>${esc(route.icon)} ${esc(route.title)}</h3>
            <p>${esc(route.desc)}</p>
            <div class="gs-route-steps">${route.links.map(routePill).join('')}</div>
          </div>
        `).join('')}
      </div>
    `;
    const anchor = document.querySelector('.command') || document.querySelector('.hero') || document.querySelector('main') || document.body;
    if (anchor && anchor.parentNode && anchor.classList && anchor.classList.contains('command')) anchor.parentNode.insertBefore(el, anchor.nextSibling);
    else insertNearHeader(el);
  }

  function insertNearHeader(el) {
    const candidates = [
      document.querySelector('.page-header'),
      document.querySelector('.hero'),
      document.querySelector('header'),
      document.querySelector('h1') && document.querySelector('h1').closest('section, header, div')
    ].filter(Boolean);
    const target = candidates[0];
    if (target && target.parentNode) target.parentNode.insertBefore(el, target.nextSibling);
    else (document.querySelector('main') || document.body).prepend(el);
  }

  function init() {
    addStyle();
    const slug = currentSlug();
    if (slug === '__home') renderHomeRoutes();
    else renderGuide(slug);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

