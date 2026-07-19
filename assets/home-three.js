import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("heroScene");
const TARGET_FRAME_INTERVAL_MS = 1000 / 30;
const FRAME_INTERVAL_TOLERANCE_MS = 1;

/** WebGL 不可用时隐藏装饰画布，让图片与正文自然接管首屏。 */
function hideCanvas(targetCanvas, message) {
  targetCanvas.classList.remove("is-ready");
  targetCanvas.hidden = true;
  targetCanvas.style.display = "none";

  if (message) {
    console.info(`[星穹枢庭] ${message}`);
  }
}

/** 创建固定种子的轻量随机数，保证每次载入的星尘构图一致。 */
function createSeededRandom(seed) {
  let value = seed >>> 0;

  /** 使用整数混合生成 0 到 1 之间的稳定随机值。 */
  return function nextRandom() {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** 按设备性能档位生成带少量冷暖变化的三维星尘。 */
function createParticleField(isCompact) {
  const particleCount = isCompact ? 220 : 720;
  const random = createSeededRandom(0x51a7c0de);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const coolColor = new THREE.Color("#84bccc");
  const warmColor = new THREE.Color("#e1b56f");
  const color = new THREE.Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const radius = 2.2 + Math.pow(random(), 0.7) * 8.1;
    const angle = random() * Math.PI * 2;
    const height = (random() - 0.5) * 7.2;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = height;
    positions[offset + 2] = Math.sin(angle) * radius * 0.52 - 1.8;

    color.copy(coolColor).lerp(warmColor, random() * 0.7);
    const brightness = 0.46 + random() * 0.54;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isCompact ? 0.035 : 0.03,
    sizeAttenuation: true,
    transparent: true,
    opacity: isCompact ? 0.5 : 0.64,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  particles.rotation.x = -0.08;
  return particles;
}

/** 创建单条倾斜轨道及沿轨道运行的光点。 */
function createOrbitalTrack(options, sharedOrbiterGeometry) {
  const points = [];
  const segmentCount = 180;

  for (let index = 0; index < segmentCount; index += 1) {
    const angle = (index / segmentCount) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * options.radiusX,
      Math.sin(angle) * options.radiusY,
      Math.sin(angle * 2 + options.phase) * options.depth
    ));
  }

  const carrier = new THREE.Group();
  carrier.rotation.set(options.tiltX, options.tiltY, options.tiltZ);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: options.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const line = new THREE.LineLoop(lineGeometry, lineMaterial);
  carrier.add(line);

  const orbiterMaterial = new THREE.MeshBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const orbiter = new THREE.Mesh(sharedOrbiterGeometry, orbiterMaterial);
  carrier.add(orbiter);

  return {
    carrier,
    orbiter,
    radiusX: options.radiusX,
    radiusY: options.radiusY,
    depth: options.depth,
    phase: options.phase,
    speed: options.speed
  };
}

/** 生成一张小尺寸径向柔光纹理，让晶核在纯深色背景上也有体积边界。 */
function createCoreGlowTexture() {
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const context = glowCanvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 248, 222, 0.98)");
  gradient.addColorStop(0.12, "rgba(234, 188, 105, 0.72)");
  gradient.addColorStop(0.38, "rgba(105, 180, 195, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 创建一条可独立旋转的能量环，使用线几何控制面数与透明度。 */
function createEnergyRing(radius, color, opacity, rotation) {
  const points = [];
  const segmentCount = 96;

  for (let index = 0; index < segmentCount; index += 1) {
    const angle = (index / segmentCount) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ring = new THREE.LineLoop(geometry, material);
  ring.rotation.set(rotation.x, rotation.y, rotation.z);
  return ring;
}

/** 创建六向档案坐标线与低面数外框，作为晶核的结构识别层。 */
function createStructuralFrame() {
  const group = new THREE.Group();
  const frameSource = new THREE.DodecahedronGeometry(0.96, 0);
  const frameGeometry = new THREE.EdgesGeometry(frameSource);
  frameSource.dispose();

  const frameMaterial = new THREE.LineBasicMaterial({
    color: "#c9a86a",
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
  group.add(frame);

  const axisGeometry = new THREE.BufferGeometry();
  axisGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -1.12, 0, 0, 1.12, 0, 0,
    0, -1.12, 0, 0, 1.12, 0,
    0, 0, -1.12, 0, 0, 1.12
  ], 3));
  const axisMaterial = new THREE.LineBasicMaterial({
    color: "#77b9c3",
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const axes = new THREE.LineSegments(axisGeometry, axisMaterial);
  group.add(axes);
  return group;
}

/** 创建多层“星穹档案核心”，组合柔光、晶体、经纬壳与结构线。 */
function createArchiveCore() {
  const group = new THREE.Group();
  const detailLayer = new THREE.Group();
  const glowTexture = createCoreGlowTexture();
  let glow = null;

  if (glowTexture) {
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#f0c77d",
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(3.1, 3.1, 1);
    glow.renderOrder = -3;
    group.add(glow);
  }

  const coreGeometry = new THREE.SphereGeometry(0.48, 24, 16);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: "#d59a43",
    emissive: "#e6ad57",
    emissiveIntensity: 0.74,
    specular: "#fff0c2",
    shininess: 110,
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.renderOrder = 2;
  group.add(core);

  const facetGeometry = new THREE.IcosahedronGeometry(0.68, 1);
  const facetMaterial = new THREE.MeshBasicMaterial({
    color: "#f8dfaa",
    transparent: true,
    opacity: 0.46,
    wireframe: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const facetShell = new THREE.Mesh(facetGeometry, facetMaterial);
  group.add(facetShell);

  const glassGeometry = new THREE.IcosahedronGeometry(0.82, 2);
  const glassMaterial = new THREE.MeshPhongMaterial({
    color: "#b9d5df",
    specular: "#ffffff",
    shininess: 120,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const glassShell = new THREE.Mesh(glassGeometry, glassMaterial);
  glassShell.scale.set(1, 1.08, 0.9);
  group.add(glassShell);

  const globeGeometry = new THREE.SphereGeometry(0.88, 18, 10);
  const globeMaterial = new THREE.MeshBasicMaterial({
    color: "#7fbcc5",
    transparent: true,
    opacity: 0.17,
    wireframe: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const coordinateGlobe = new THREE.Mesh(globeGeometry, globeMaterial);
  coordinateGlobe.scale.z = 0.9;
  detailLayer.add(coordinateGlobe);

  const structuralFrame = createStructuralFrame();
  structuralFrame.rotation.set(0.36, 0.18, 0.22);
  detailLayer.add(structuralFrame);

  const energyRings = [
    createEnergyRing(0.96, "#e2b46c", 0.5, { x: 1.18, y: 0.12, z: 0.22 }),
    createEnergyRing(1.04, "#76bac5", 0.36, { x: 0.35, y: 1.02, z: -0.42 }),
    createEnergyRing(1.12, "#cf8599", 0.26, { x: -0.52, y: 0.4, z: 0.76 })
  ];
  group.add(...energyRings, detailLayer);

  const warmLight = new THREE.PointLight("#ffd58c", 3.4, 5.5, 2);
  warmLight.position.set(1.4, 1.1, 2.1);
  const coolLight = new THREE.PointLight("#78c3ce", 2.2, 4.5, 2);
  coolLight.position.set(-1.3, -0.8, 1.4);
  const ambientLight = new THREE.AmbientLight("#b6d8dc", 0.34);
  group.add(warmLight, coolLight, ambientLight);

  return {
    group,
    core,
    facetShell,
    glassShell,
    coordinateGlobe,
    structuralFrame,
    energyRings,
    detailLayer,
    glow
  };
}

/** 生成档案核心、三维轨道和轨道光点的完整主视觉装置。 */
function createOrbitalSystem() {
  const root = new THREE.Group();
  const tracks = [];
  const orbiterGeometry = new THREE.SphereGeometry(0.055, 10, 10);
  const trackOptions = [
    { radiusX: 2.65, radiusY: 0.82, depth: 0.2, tiltX: 0.72, tiltY: 0.18, tiltZ: 0.08, color: "#e3b76e", opacity: 0.42, phase: 0.2, speed: 0.34 },
    { radiusX: 2.05, radiusY: 1.22, depth: 0.14, tiltX: -0.44, tiltY: 0.35, tiltZ: 0.56, color: "#70b8c5", opacity: 0.34, phase: 2.4, speed: -0.27 },
    { radiusX: 1.45, radiusY: 1.72, depth: 0.17, tiltX: 0.24, tiltY: -0.62, tiltZ: -0.34, color: "#ca8198", opacity: 0.27, phase: 4.3, speed: 0.22 }
  ];

  for (const options of trackOptions) {
    const track = createOrbitalTrack(options, orbiterGeometry);
    tracks.push(track);
    root.add(track.carrier);
  }

  const archiveCore = createArchiveCore();
  root.add(archiveCore.group);

  return { root, tracks, ...archiveCore };
}

/** 释放单个 Three.js 材质，兼容数组材质。 */
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const item of material) {
      disposeMaterial(item);
    }
    return;
  }

  material?.map?.dispose();
  material?.dispose();
}

/** 释放场景节点持有的几何体与材质，避免离开页面后占用显存。 */
function disposeSceneNode(node) {
  node.geometry?.dispose();
  disposeMaterial(node.material);
}

/** 在交给 Three.js 前安静探测 WebGL，避免降级场景产生 renderer 错误日志。 */
function createRenderingContext(targetCanvas, isCompact) {
  const attributes = {
    alpha: true,
    antialias: !isCompact,
    powerPreference: "default",
    premultipliedAlpha: true
  };

  try {
    return targetCanvas.getContext("webgl2", attributes)
      || targetCanvas.getContext("webgl", attributes);
  } catch {
    return null;
  }
}

/** 初始化首屏 Three.js 装饰，并集中管理性能、暂停和降级策略。 */
function initializeHeroScene(targetCanvas) {
  const host = targetCanvas.closest(".hero") || targetCanvas.parentElement || document.body;
  const mobileQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const renderingContext = createRenderingContext(targetCanvas, mobileQuery.matches);
  let renderer;

  if (!renderingContext) {
    hideCanvas(targetCanvas, "当前浏览器未启用 WebGL，已使用静态首屏。");
    return;
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: targetCanvas,
      context: renderingContext,
      alpha: true,
      antialias: !mobileQuery.matches,
      powerPreference: "default",
      premultipliedAlpha: true
    });
  } catch {
    hideCanvas(targetCanvas, "当前浏览器未启用 WebGL，已使用静态首图。");
    return;
  }

  targetCanvas.setAttribute("aria-hidden", "true");
  targetCanvas.style.position = "absolute";
  targetCanvas.style.inset = "0";
  targetCanvas.style.width = "100%";
  targetCanvas.style.height = "100%";
  targetCanvas.style.pointerEvents = "none";
  targetCanvas.style.display = "block";

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.set(0, 0, 8.8);

  const orbitalSystem = createOrbitalSystem();
  let particles = createParticleField(mobileQuery.matches);
  scene.add(particles, orbitalSystem.root);

  const state = {
    compact: mobileQuery.matches,
    failed: false,
    ready: false,
    inViewport: true,
    pageVisible: !document.hidden,
    reducedMotion: motionQuery.matches,
    frameId: 0,
    lastTimestamp: 0,
    elapsed: 0,
    pointerTarget: new THREE.Vector2(),
    pointerCurrent: new THREE.Vector2()
  };

  let intersectionObserver = null;
  let resizeObserver = null;

  /** 读取 Hero 的实际像素尺寸，避免动态内容造成画布布局抖动。 */
  function getRenderSize() {
    const rectangle = host.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rectangle.width || targetCanvas.clientWidth || window.innerWidth)),
      height: Math.max(1, Math.round(rectangle.height || targetCanvas.clientHeight || window.innerHeight))
    };
  }

  /** 只渲染当前状态，不推进动画时间。 */
  function renderCurrentFrame() {
    if (!state.failed) {
      renderer.render(scene, camera);

      if (!state.ready) {
        state.ready = true;
        targetCanvas.classList.add("is-ready");
      }
    }
  }

  /** 根据桌面或移动档位重建粒子，确保移动端数量明显下降。 */
  function rebuildParticles(isCompact) {
    scene.remove(particles);
    particles.geometry.dispose();
    disposeMaterial(particles.material);
    particles = createParticleField(isCompact);
    scene.add(particles);
  }

  /** 同步画布分辨率、相机和装置位置，限制 DPR 以控制显存与功耗。 */
  function handleResize() {
    if (state.failed) {
      return;
    }

    const { width, height } = getRenderSize();
    const isCompact = mobileQuery.matches || width < 768;

    if (isCompact !== state.compact) {
      state.compact = isCompact;
      rebuildParticles(isCompact);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = isCompact ? 9.7 : 8.8;
    camera.updateProjectionMatrix();

    orbitalSystem.root.position.set(isCompact ? 1.08 : 2.35, isCompact ? 2.05 : 0.06, -0.36);
    orbitalSystem.root.scale.setScalar(isCompact ? 0.72 : 1.12);
    orbitalSystem.detailLayer.visible = !isCompact;
    renderCurrentFrame();
  }

  /** 判断动画是否应继续运行，页面不可见或首屏离开视口时自动暂停。 */
  function shouldAnimate() {
    return !state.failed && !state.reducedMotion && state.inViewport && state.pageVisible;
  }

  /** 更新轨道位置、星核呼吸和轻微视差。 */
  function updateScene(deltaSeconds) {
    state.elapsed += deltaSeconds;
    const time = state.elapsed;

    const pointerLerpFactor = deltaSeconds > 0
      ? 1 - Math.pow(1 - 0.045, deltaSeconds * 60)
      : 0.045;
    state.pointerCurrent.lerp(state.pointerTarget, pointerLerpFactor);
    const heroRectangle = host.getBoundingClientRect();
    const scrollProgress = THREE.MathUtils.clamp(
      -heroRectangle.top / Math.max(1, heroRectangle.height),
      0,
      1
    );
    const baseScale = state.compact ? 0.72 : 1.12;
    orbitalSystem.root.position.y = (state.compact ? 2.05 : 0.06) + scrollProgress * 0.16;
    orbitalSystem.root.position.z = -0.36 - scrollProgress * 0.9;
    orbitalSystem.root.scale.setScalar(baseScale * (1 - scrollProgress * 0.1));
    orbitalSystem.root.rotation.x = -0.05 + state.pointerCurrent.y * 0.075;
    orbitalSystem.root.rotation.y = Math.sin(time * 0.17) * 0.04 + state.pointerCurrent.x * 0.09;
    orbitalSystem.root.rotation.z = scrollProgress * 0.12;
    particles.rotation.y = time * 0.006 + state.pointerCurrent.x * 0.018;
    particles.rotation.x = -0.08 + state.pointerCurrent.y * 0.012;

    for (const track of orbitalSystem.tracks) {
      const angle = time * track.speed + track.phase;
      track.orbiter.position.set(
        Math.cos(angle) * track.radiusX,
        Math.sin(angle) * track.radiusY,
        Math.sin(angle * 2 + track.phase) * track.depth
      );
    }

    const pulse = 1 + Math.sin(time * 1.35) * 0.055;
    orbitalSystem.core.scale.setScalar(pulse);
    orbitalSystem.core.rotation.x += deltaSeconds * 0.11;
    orbitalSystem.core.rotation.y += deltaSeconds * 0.19;
    orbitalSystem.facetShell.rotation.x -= deltaSeconds * 0.08;
    orbitalSystem.facetShell.rotation.y += deltaSeconds * 0.13;
    orbitalSystem.glassShell.rotation.x += deltaSeconds * 0.035;
    orbitalSystem.glassShell.rotation.y -= deltaSeconds * 0.055;
    orbitalSystem.coordinateGlobe.rotation.y += deltaSeconds * 0.045;
    orbitalSystem.coordinateGlobe.rotation.z -= deltaSeconds * 0.025;
    orbitalSystem.structuralFrame.rotation.y += deltaSeconds * 0.035;

    for (let index = 0; index < orbitalSystem.energyRings.length; index += 1) {
      const direction = index % 2 === 0 ? 1 : -1;
      orbitalSystem.energyRings[index].rotation.z += deltaSeconds * (0.045 + index * 0.018) * direction;
    }

    if (orbitalSystem.glow) {
      orbitalSystem.glow.material.opacity = 0.45 + Math.sin(time * 1.1) * 0.055;
    }
  }

  /** 执行单帧动画，并将长时间暂停后的时间步限制在稳定范围内。 */
  function animate(timestamp) {
    state.frameId = 0;
    if (!shouldAnimate()) {
      state.lastTimestamp = 0;
      return;
    }

    const elapsedMilliseconds = state.lastTimestamp ? timestamp - state.lastTimestamp : 0;

    if (
      state.lastTimestamp
      && elapsedMilliseconds < TARGET_FRAME_INTERVAL_MS - FRAME_INTERVAL_TOLERANCE_MS
    ) {
      state.frameId = window.requestAnimationFrame(animate);
      return;
    }

    const deltaSeconds = state.lastTimestamp
      ? Math.min(elapsedMilliseconds / 1000, 0.05)
      : 0;
    state.lastTimestamp = timestamp;

    updateScene(deltaSeconds);
    renderCurrentFrame();
    state.frameId = window.requestAnimationFrame(animate);
  }

  /** 按当前可见性启动或停止 requestAnimationFrame 循环。 */
  function synchronizeAnimation() {
    if (shouldAnimate()) {
      if (!state.frameId) {
        state.frameId = window.requestAnimationFrame(animate);
      }
      return;
    }

    if (state.frameId) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }
    state.lastTimestamp = 0;
    renderCurrentFrame();
  }

  /** 将 Hero 内的指针位置映射为幅度受限的二维视差目标。 */
  function handlePointerMove(event) {
    if (state.reducedMotion || state.failed) {
      return;
    }

    const rectangle = host.getBoundingClientRect();
    if (!rectangle.width || !rectangle.height) {
      return;
    }

    const normalizedX = ((event.clientX - rectangle.left) / rectangle.width) * 2 - 1;
    const normalizedY = ((event.clientY - rectangle.top) / rectangle.height) * 2 - 1;
    state.pointerTarget.set(
      THREE.MathUtils.clamp(normalizedX, -1, 1),
      THREE.MathUtils.clamp(-normalizedY, -1, 1)
    );
  }

  /** 指针离开 Hero 后让视差平滑回到中心。 */
  function handlePointerLeave() {
    state.pointerTarget.set(0, 0);
  }

  /** 根据 Hero 与视口的交集状态暂停或恢复绘制。 */
  function handleIntersection(entries) {
    state.inViewport = Boolean(entries[0]?.isIntersecting);
    synchronizeAnimation();
  }

  /** 页面切到后台时立即停帧，回到前台后按条件恢复。 */
  function handleVisibilityChange() {
    state.pageVisible = !document.hidden;
    synchronizeAnimation();
  }

  /** 进入往返缓存时只暂停；真正离开页面时才释放 GPU 资源。 */
  function handlePageHide(event) {
    if (event.persisted) {
      state.pageVisible = false;
      synchronizeAnimation();
      return;
    }

    disposeScene();
  }

  /** 从往返缓存恢复后重新同步尺寸、可见性和动画状态。 */
  function handlePageShow(event) {
    if (!event.persisted || state.failed) {
      return;
    }

    state.pageVisible = !document.hidden;
    handleResize();
    synchronizeAnimation();
  }

  /** 响应系统减少动态效果设置，并在静止模式下保留完整构图。 */
  function handleMotionPreferenceChange(event) {
    state.reducedMotion = event.matches;
    state.pointerTarget.set(0, 0);
    state.pointerCurrent.set(0, 0);
    updateScene(0);
    synchronizeAnimation();
  }

  /** 响应设备档位变化，更新粒子数量与 DPR 上限。 */
  function handleMobilePreferenceChange() {
    handleResize();
  }

  /** WebGL 上下文丢失时永久关闭装饰层，正文与静态背景保持可用。 */
  function handleContextLost(event) {
    event.preventDefault();
    state.failed = true;
    synchronizeAnimation();
    hideCanvas(targetCanvas, "WebGL 上下文已丢失，已切换为静态首图。");
  }

  /** 为浏览器回归测试主动绘制稳定的一帧，不改变动画运行条件。 */
  function renderOnceForDiagnostics() {
    if (state.failed) {
      return false;
    }

    updateScene(0);
    renderCurrentFrame();
    return true;
  }

  /** 返回冻结的只读快照，供回归测试检查性能档位与暂停状态。 */
  function getSceneState() {
    return Object.freeze({
      revision: THREE.REVISION,
      compact: state.compact,
      failed: state.failed,
      ready: state.ready,
      inViewport: state.inViewport,
      pageVisible: state.pageVisible,
      reducedMotion: state.reducedMotion,
      running: Boolean(state.frameId),
      particleCount: particles.geometry.getAttribute("position")?.count || 0,
      detailLayerVisible: orbitalSystem.detailLayer.visible,
      pixelRatio: renderer.getPixelRatio(),
      width: targetCanvas.width,
      height: targetCanvas.height
    });
  }

  const diagnostics = Object.freeze({
    renderOnce: renderOnceForDiagnostics,
    getState: getSceneState
  });

  // 诊断口只暴露方法且对象冻结，生产功能不读取也不依赖该全局值。
  Object.defineProperty(window, "__xingqiongScene", {
    value: diagnostics,
    configurable: true,
    enumerable: false,
    writable: false
  });

  /** 解绑监听并释放 GPU 资源，仅供页面真正离开或关闭时调用。 */
  function disposeScene() {
    if (state.frameId) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }

    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("pageshow", handlePageShow);
    host.removeEventListener("pointermove", handlePointerMove);
    host.removeEventListener("pointerleave", handlePointerLeave);
    targetCanvas.removeEventListener("webglcontextlost", handleContextLost);
    motionQuery.removeEventListener?.("change", handleMotionPreferenceChange);
    mobileQuery.removeEventListener?.("change", handleMobilePreferenceChange);
    scene.traverse(disposeSceneNode);
    renderer.dispose();

    if (window.__xingqiongScene === diagnostics) {
      Reflect.deleteProperty(window, "__xingqiongScene");
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
  host.addEventListener("pointermove", handlePointerMove, { passive: true });
  host.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  targetCanvas.addEventListener("webglcontextlost", handleContextLost, false);
  motionQuery.addEventListener?.("change", handleMotionPreferenceChange);
  mobileQuery.addEventListener?.("change", handleMobilePreferenceChange);

  if ("IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver(handleIntersection, { threshold: 0.02 });
    intersectionObserver.observe(host);
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);
  }

  handleResize();
  updateScene(0);
  synchronizeAnimation();
}

// 画布节点由首页模板提供；节点缺失时模块保持无副作用。
if (canvas instanceof HTMLCanvasElement) {
  initializeHeroScene(canvas);
}
