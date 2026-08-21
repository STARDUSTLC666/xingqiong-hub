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

/** 按设备性能档位生成带冷暖变化和独立闪烁相位的三维星尘。 */
function createParticleField(isCompact) {
  const particleCount = isCompact ? 6000 : 20000;
  const random = createSeededRandom(0x51a7c0de);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  const coolColor = new THREE.Color("#84bccc");
  const warmColor = new THREE.Color("#e1b56f");
  const color = new THREE.Color();

  const ARM_COUNT = 2;
  const ARM_TWIST = 2.9;
  const DISC_RADIUS = 26.0;

  // 夜空由两个星族组成：银河带负责结构，散点星负责铺满全天。
  // 只有银河带的话四角会空掉，只有散点星又看不出银河。
  const fieldCount = Math.round(particleCount * 0.38);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;

    if (index < fieldCount) {
      // 均匀散布在一个大球壳上，各个方向密度一致
      const cosine = random() * 2 - 1;
      const azimuth = random() * Math.PI * 2;
      const shell = 15 + random() * 24;
      const ring = Math.sqrt(1 - cosine * cosine);

      positions[offset] = Math.cos(azimuth) * ring * shell;
      positions[offset + 1] = cosine * shell;
      positions[offset + 2] = Math.sin(azimuth) * ring * shell;

      color.copy(coolColor).lerp(warmColor, random() * 0.65);
      // 极少数暖金星，给均匀的球壳星群添一点色相
      if (random() > 0.985) color.setRGB(0.94, 0.78, 0.47);
      const fieldBrightness = 0.26 + random() * 0.44;
      colors[offset] = color.r * fieldBrightness;
      colors[offset + 1] = color.g * fieldBrightness;
      colors[offset + 2] = color.b * fieldBrightness;

      sizes[index] = random() > 0.975 ? 2.4 + random() * 1.8 : 0.5 + random() * 0.8;
      phases[index] = random() * Math.PI * 2;
      continue;
    }

    // 半径向中心聚集，天然形成核球密、外盘疏的分布
    const spread = Math.pow(random(), 1.35);
    const radius = 0.35 + spread * DISC_RADIUS;

    // 对数螺旋：转角随 log(半径) 增长，才是真实星系旋臂的形状。
    // 散射量随半径变大，旋臂由内向外逐渐散开而不是一直细如刀刻。
    const arm = Math.floor(random() * ARM_COUNT);
    const spiral = (arm / ARM_COUNT) * Math.PI * 2 + Math.log(radius + 1.0) * ARM_TWIST;
    const scatter = (random() - 0.5) * (0.5 + radius * 0.07);
    const angle = spiral + scatter;

    // 核球厚、盘很薄。三个随机数相加近似正态，避免出现生硬的上下边界。
    const bulge = Math.exp(-radius * 0.22);
    const height = (random() + random() + random() - 1.5) * (0.5 + bulge * 3.2);

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = height;
    positions[offset + 2] = Math.sin(angle) * radius;

    // 星族配色：核球是年老的暖黄星，旋臂是年轻的蓝白星
    const youth = Math.min(1, radius / (DISC_RADIUS * 0.55));
    color.copy(warmColor).lerp(coolColor, youth * 0.85);
    if (random() > 0.97) color.setRGB(1.0, 0.62, 0.48); // 零星红巨星
    if (random() > 0.988) color.setRGB(0.65, 0.6, 0.79); // 稀疏的紫罗兰星
    const brightness = (0.4 + random() * 0.6) * (0.78 + bulge * 0.35);
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;

    // 少量“亮星”撑起层次，其余保持细小，避免整片糊成一团。
    sizes[index] = random() > 0.965 ? 2.8 + random() * 2.0 : 0.55 + random() * 0.9;
    phases[index] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  // 用着色器画圆形柔边星点：PointsMaterial 的方块贴图在深色背景上很显廉价。
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: isCompact ? 42 : 58 },
      uOpacity: { value: isCompact ? 0.72 : 0.9 }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uScale;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = aColor;
        vTwinkle = 0.45 + 0.55 * sin(uTime * 1.3 + aPhase);
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(-viewPosition.z, 0.001);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 offset = gl_PointCoord - vec2(0.5);
        float distance = length(offset);
        if (distance > 0.5) discard;

        float core = smoothstep(0.5, 0.0, distance);
        float halo = pow(core, 3.0);
        gl_FragColor = vec4(vColor * (0.7 + halo * 1.5), (core * 0.45 + halo * 0.55) * uOpacity * vTwinkle);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  particles.rotation.set(-0.42, 0, 0.52);
  particles.position.set(-1.5, 0.4, -12.0);
  return particles;
}

/** 太阳系八大行星的地表配方，各自编译成独立着色器。 */
const PLANET_SURFACES = {
  mercury: `
    // 无大气、密布撞击坑的灰色岩体
    float relief = xqFbm(direction * 5.8);
    float craters = xqFbm(direction * 13.0);
    surface = mix(vec3(0.24, 0.23, 0.22), vec3(0.63, 0.61, 0.58), smoothstep(0.34, 0.7, relief));
    surface *= 0.82 + craters * 0.34;
    atmosphere = vec3(0.42, 0.42, 0.44);
  `,
  venus: `
    // 硫酸云把地表整个盖住，所以看不到任何地貌，只有均匀的昏黄
    float swirl = xqFbm(direction * 2.1 + vec3(0.0, 0.0, uTime * 0.02));
    surface = mix(vec3(0.74, 0.6, 0.36), vec3(0.96, 0.88, 0.68), smoothstep(0.32, 0.72, swirl));
    atmosphere = vec3(1.0, 0.9, 0.6);
  `,
  earth: `
    float land = xqFbm(direction * 2.5);
    surface = mix(vec3(0.06, 0.21, 0.44), vec3(0.21, 0.4, 0.23), smoothstep(0.5, 0.6, land));
    // 云层独立于地表漂移
    float cloud = smoothstep(0.52, 0.78, xqFbm(direction * 3.2 + vec3(uTime * 0.02, 0.0, 0.0)));
    surface = mix(surface, vec3(0.97, 0.97, 1.0), cloud * 0.72);
    surface = mix(surface, vec3(0.95, 0.96, 0.98), smoothstep(0.88, 0.99, abs(direction.y)));
    atmosphere = vec3(0.42, 0.66, 1.0);
  `,
  mars: `
    float relief = xqFbm(direction * 3.3);
    surface = mix(vec3(0.4, 0.17, 0.1), vec3(0.79, 0.45, 0.26), smoothstep(0.3, 0.7, relief));
    // 两极干冰冠
    surface = mix(surface, vec3(0.93, 0.92, 0.9), smoothstep(0.83, 0.96, abs(direction.y)));
    atmosphere = vec3(0.85, 0.48, 0.32);
  `,
  jupiter: `
    // 强烈的纬向条带加大红斑
    float swirl = xqFbm(direction * 2.4 + vec3(0.0, 0.0, uTime * 0.04));
    float bands = sin(direction.y * 17.0 + swirl * 4.4);
    surface = mix(vec3(0.48, 0.29, 0.18), vec3(0.89, 0.76, 0.56), smoothstep(-0.5, 0.5, bands));
    float spot = smoothstep(0.17, 0.0, length(direction - normalize(vec3(0.6, -0.28, 0.68))));
    surface = mix(surface, vec3(0.78, 0.31, 0.2), spot * 0.88);
    atmosphere = vec3(0.92, 0.74, 0.48);
  `,
  saturn: `
    // 条带比木星淡得多，整体偏奶金色
    float swirl = xqFbm(direction * 2.0 + vec3(0.0, 0.0, uTime * 0.03));
    float bands = sin(direction.y * 12.0 + swirl * 2.8);
    surface = mix(vec3(0.7, 0.58, 0.4), vec3(0.95, 0.87, 0.68), smoothstep(-0.55, 0.55, bands));
    atmosphere = vec3(0.96, 0.86, 0.62);
  `,
  uranus: `
    // 几乎没有可见结构的淡青色冰巨星
    float faint = xqFbm(direction * 1.9) * 0.14;
    surface = vec3(0.52, 0.8, 0.83) + faint;
    atmosphere = vec3(0.58, 0.9, 0.95);
  `,
  neptune: `
    float swirl = xqFbm(direction * 2.6 + vec3(0.0, 0.0, uTime * 0.03));
    float bands = sin(direction.y * 9.0 + swirl * 2.4);
    surface = mix(vec3(0.13, 0.25, 0.62), vec3(0.38, 0.54, 0.88), smoothstep(-0.6, 0.6, bands));
    // 大暗斑
    float spot = smoothstep(0.15, 0.0, length(direction - normalize(vec3(-0.52, -0.22, 0.7))));
    surface = mix(surface, vec3(0.08, 0.14, 0.38), spot * 0.82);
    atmosphere = vec3(0.45, 0.62, 1.0);
  `
};

/** 气态巨行星的环：内外缘渐隐，中间被噪声切出卡西尼缝那样的暗环。 */
function createPlanetRing(innerRadius, outerRadius, isCompact, tilt) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, isCompact ? 48 : 96);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uInner: { value: innerRadius },
      uOuter: { value: outerRadius }
    },
    vertexShader: `
      varying vec3 vLocalPosition;

      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uInner;
      uniform float uOuter;
      varying vec3 vLocalPosition;

      ${noiseGlsl(isCompact)}

      void main() {
        float radius = length(vLocalPosition.xy);
        float span = clamp((radius - uInner) / max(uOuter - uInner, 0.0001), 0.0, 1.0);

        // 细密的同心亮暗环
        float grain = xqFbm(vec3(span * 26.0, 0.0, 0.0));
        float gap = smoothstep(0.34, 0.42, span) * (1.0 - smoothstep(0.46, 0.54, span));
        float alpha = (0.28 + 0.72 * grain) * (1.0 - gap * 0.9);

        // 两端淡出，避免出现生硬的几何边
        alpha *= smoothstep(0.0, 0.12, span) * (1.0 - smoothstep(0.82, 1.0, span));

        vec3 color = mix(vec3(0.72, 0.6, 0.44), vec3(0.94, 0.88, 0.76), grain);
        gl_FragColor = vec4(color, alpha * 0.85);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2 - (tilt === undefined ? 0.32 : tilt);
  return ring;
}

/** 创建一颗有昼夜晨昏线与大气边缘的行星。 */
function createPlanet(kind, radius, isCompact) {
  const geometry = new THREE.SphereGeometry(radius, isCompact ? 24 : 40, isCompact ? 16 : 28);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightPosition: { value: new THREE.Vector3(0, 0, 0) }
    },
    vertexShader: `
      varying vec3 vObjectPosition;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        vObjectPosition = position;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uLightPosition;
      varying vec3 vObjectPosition;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      ${noiseGlsl(isCompact)}

      void main() {
        vec3 normal = normalize(vNormalWorld);
        vec3 direction = normalize(vObjectPosition);
        vec3 toLight = normalize(uLightPosition - vWorldPosition);
        vec3 toCamera = normalize(cameraPosition - vWorldPosition);

        vec3 surface;
        vec3 atmosphere;
        ${PLANET_SURFACES[kind]}

        // 晨昏线：日夜交界要有一段过渡，硬切会让球看起来像贴纸
        float lambert = dot(normal, toLight);
        float daylight = smoothstep(-0.22, 0.32, lambert);
        vec3 color = surface * (0.05 + daylight * 1.15);

        // 大气在边缘散射，背光侧留一圈冷光
        float rim = pow(1.0 - clamp(dot(normal, toCamera), 0.0, 1.0), 3.0);
        color += atmosphere * rim * (0.18 + daylight * 0.75);

        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  return new THREE.Mesh(geometry, material);
}

/** 铺满整个视口的星云层：银河真正占画面的是发光气体与暗尘带，不是点状恒星。 */
function createNebula(isCompact) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1.8 }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uAspect;
      varying vec2 vUv;

      ${noiseGlsl(isCompact)}

      void main() {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.4;

        // 域扭曲让云团有撕扯感，不是一团均匀的噪声
        vec3 base = vec3(p, uTime * 0.006);
        vec3 warp = vec3(xqFbm(base * 1.1), xqFbm(base * 1.1 + 5.3), 0.0);
        float density = xqFbm(base * 1.45 + warp * 1.5);

        // 银河带：与星场同一个倾角，越靠近中心线气体越浓
        float band = exp(-pow((p.y - p.x * 0.46) * 1.05, 2.0));
        density *= 0.34 + band * 1.75;

        // 暗尘带压暗气体，这是银河最有辨识度的结构
        float dust = smoothstep(0.42, 0.63, xqFbm(base * 2.4 + 17.0));
        density *= 1.0 - dust * 0.62;

        vec3 cool = vec3(0.05, 0.07, 0.2);
        vec3 warm = vec3(0.24, 0.14, 0.19);
        vec3 core = vec3(0.5, 0.34, 0.2);
        vec3 color = mix(cool, warm, smoothstep(0.18, 0.52, density));
        color = mix(color, core, smoothstep(0.52, 0.92, density) * band);

        // 文案在左侧，星云往那边收，保证正文对比度
        float copySafe = smoothstep(-0.55, 0.8, p.x / max(uAspect, 0.001) * 2.0);
        float veil = smoothstep(0.26, 0.78, density) * (0.1 + copySafe * 0.56);
        gl_FragColor = vec4(color, veil);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });

  const nebula = new THREE.Mesh(geometry, material);
  // 画在所有东西之前，纯粹作为幕布
  nebula.renderOrder = -100;
  nebula.frustumCulled = false;
  return nebula;
}

/** 行星大气色映射：与 PLANET_SURFACES 中每颗行星的 atmosphere 保持一致，用于外发光。 */
const PLANET_GLOW_COLORS = {
  mercury: "#8a8a92",
  venus: "#ffd98a",
  earth: "#6fa8ff",
  mars: "#ff8a5e",
  jupiter: "#ffc37e",
  saturn: "#ffe3a0",
  uranus: "#9fe8f2",
  neptune: "#7d9dff"
};

/** 共享径向柔光纹理：所有行星外发光复用同一张，避免重复 canvas。 */
let sharedGlowTexture = null;

function getSharedGlowTexture() {
  if (!sharedGlowTexture) {
    sharedGlowTexture = createCoreGlowTexture();
  }
  return sharedGlowTexture;
}

/** 沿轨道流动的微光粒子：一条轨道上分布的星点，以行星同速公转，让轨道有流体感。 */
function createOrbitalStream(options, isCompact) {
  const count = isCompact ? 36 : 72;
  const angles = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    angles[index] = (index / count) * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadiusX: { value: options.radiusX },
      uRadiusY: { value: options.radiusY },
      uDepth: { value: options.depth },
      uPhase: { value: options.phase },
      uSpeed: { value: options.speed },
      uSize: { value: isCompact ? 34 : 46 },
      uColor: { value: new THREE.Color(options.color) },
      uScale: { value: isCompact ? 0.8 : 1 }
    },
    vertexShader: `
      attribute float aAngle;
      uniform float uTime;
      uniform float uRadiusX;
      uniform float uRadiusY;
      uniform float uDepth;
      uniform float uPhase;
      uniform float uSpeed;
      uniform float uSize;
      varying float vFlow;

      void main() {
        float angle = aAngle + uTime * uSpeed + uPhase;
        vec3 flowPosition = vec3(
          cos(angle) * uRadiusX,
          sin(angle) * uRadiusY,
          sin(angle * 2.0 + uPhase) * uDepth
        );
        vFlow = fract(aAngle / 6.2831 + uTime * 0.05);
        vec4 viewPosition = modelViewMatrix * vec4(flowPosition, 1.0);
        gl_PointSize = uSize / max(-viewPosition.z, 0.01);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uScale;
      varying float vFlow;

      void main() {
        vec2 offset = gl_PointCoord - vec2(0.5);
        float distance = length(offset);
        if (distance > 0.5) discard;
        float core = smoothstep(0.5, 0.0, distance);
        // 每三颗亮一颗，制造断续的星点串，而不是一条实心珠子
        float twinkle = step(0.34, fract(vFlow * 3.0 + 0.16));
        gl_FragColor = vec4(uColor, core * core * uScale * twinkle * 0.75);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const stream = new THREE.Points(geometry, material);
  stream.frustumCulled = false;
  return stream;
}

/** 创建单条倾斜轨道及沿轨道运行的行星。 */
function createOrbitalTrack(options, isCompact) {
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

  // 轨道星点流：和行星同角速度，沿同一椭圆流动
  const stream = createOrbitalStream(options, isCompact);
  carrier.add(stream);

  // 行星是实体：不透明并写深度，才能挡住背后的银河
  const orbiter = createPlanet(options.planet, options.planetRadius, isCompact);
  if (options.ring) {
    orbiter.add(createPlanetRing(options.planetRadius * 1.5, options.planetRadius * 2.4, isCompact, options.ringTilt));
  }

  const meta = options.meta || null;
  orbiter.userData.gateMeta = meta;

  // 隐形命中球：行星在首屏很小，直接点球面很难点中，扩大可点击范围
  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false
  });
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(Math.max(0.26, options.planetRadius * 2.6), 12, 8),
    hitMaterial
  );
  hitSphere.userData.gateMeta = meta;
  orbiter.add(hitSphere);

  // 大气外发光：暖色行星带暖辉，冰巨星带冷辉
  const glowTexture = getSharedGlowTexture();
  if (glowTexture) {
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color(PLANET_GLOW_COLORS[options.planet] || options.color),
      transparent: true,
      opacity: isCompact ? 0.4 : 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(options.planetRadius * (isCompact ? 4.2 : 4.6));
    orbiter.add(glow);
  }

  carrier.add(orbiter);

  return {
    carrier,
    orbiter,
    stream,
    streamMaterial: stream.material,
    line,
    lineMaterial,
    meta,
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

  // 多段缓慢衰减，避免叠加两层后出现可见的圆环边界。
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 249, 228, 1)");
  gradient.addColorStop(0.08, "rgba(255, 226, 168, 0.72)");
  gradient.addColorStop(0.2, "rgba(238, 176, 92, 0.36)");
  gradient.addColorStop(0.42, "rgba(176, 140, 150, 0.14)");
  gradient.addColorStop(0.68, "rgba(96, 150, 178, 0.05)");
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

/* 三维值噪声 + fBm，供恒星表面与日冕共用。
   用哈希噪声而不是外部噪声库，是为了让主视觉保持零依赖。 */
const NOISE_GLSL = `
  float xqHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float xqNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(xqHash(i + vec3(0.0, 0.0, 0.0)), xqHash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(xqHash(i + vec3(0.0, 1.0, 0.0)), xqHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(xqHash(i + vec3(0.0, 0.0, 1.0)), xqHash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(xqHash(i + vec3(0.0, 1.0, 1.0)), xqHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
  }

  float xqFbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < XQ_OCTAVES; i++) {
      value += amplitude * xqNoise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }
`;

/** 移动端把 fBm 降到 3 阶：这两个着色器是逐像素的，八度数直接决定发热量。 */
function noiseGlsl(isCompact) {
  return `#define XQ_OCTAVES ${isCompact ? 3 : 5}\n${NOISE_GLSL}`;
}

/** 创建写实恒星核心：湍流等离子体表面 + 临边昏暗 + 日冕。 */
function createSolarCore(isCompact) {
  const group = new THREE.Group();

  // 表面。噪声取自物体空间坐标，球体自转时纹理才会跟着转而不是在表面滑动。
  const surfaceGeometry = new THREE.SphereGeometry(0.62, 96, 64);
  const surfaceMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vObjectPosition;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vObjectPosition = position;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vObjectPosition;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      ${noiseGlsl(isCompact)}

      void main() {
        vec3 direction = normalize(vObjectPosition);
        vec3 p = direction * 3.4;

        // 域扭曲：让噪声像对流元胞一样翻滚，而不是静止的斑点
        vec3 warp = vec3(
          xqFbm(p + vec3(0.0, 0.0, uTime * 0.06)),
          xqFbm(p + vec3(4.7, 2.3, uTime * 0.05)),
          xqFbm(p + vec3(9.1, 6.4, uTime * 0.045))
        );

        float plasma = xqFbm(p + warp * 2.1 + uTime * 0.035);
        float granulation = xqFbm(p * 5.5 + warp * 0.8 + uTime * 0.09);
        float heat = plasma * 0.68 + granulation * 0.32;

        // 临边昏暗：真实恒星圆面中心最亮、边缘骤暗，这是它区别于
        // 普通发光球体最关键的一处观感。
        float mu = clamp(dot(normalize(vNormalWorld), normalize(vViewDirection)), 0.0, 1.0);
        float limb = 0.28 + 0.72 * pow(mu, 0.52);

        vec3 shadowed = vec3(0.42, 0.07, 0.01);
        vec3 warm     = vec3(0.98, 0.36, 0.04);
        vec3 bright   = vec3(1.0, 0.78, 0.34);
        vec3 core     = vec3(1.0, 0.97, 0.86);

        vec3 color = mix(shadowed, warm, smoothstep(0.22, 0.52, heat));
        color = mix(color, bright, smoothstep(0.48, 0.74, heat));
        color = mix(color, core, smoothstep(0.7, 0.94, heat));
        color *= limb;

        // 黑子：低温区压暗，给圆面一点可辨识的结构
        float spot = smoothstep(0.14, 0.03, xqFbm(p * 1.6 + 21.0));
        color *= 1.0 - spot * 0.55;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: true
  });
  const core = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  core.renderOrder = 2;
  group.add(core);

  // 日冕用正对镜头的公告板，而不是球壳：球壳自身的轮廓会在天上留下
  // 一圈硬边，看起来像套了个玻璃罩。公告板可以让透明度平滑归零。
  const CORONA_HALF_SIZE = 2.2;
  const coronaGeometry = new THREE.PlaneGeometry(CORONA_HALF_SIZE * 2, CORONA_HALF_SIZE * 2);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      // 光球在公告板上占据的半径比例，日冕从这里往外长
      uInner: { value: 0.62 / CORONA_HALF_SIZE }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uInner;
      varying vec2 vUv;

      ${noiseGlsl(isCompact)}

      void main() {
        vec2 offset = vUv - 0.5;
        float radius = length(offset) * 2.0;
        if (radius > 1.0 || radius < uInner * 0.88) discard;

        // 角向变化留在 xy、半径与时间放在 z：冕流才会沿半径向外拉直，
        // 并且随时间向外飘散，而不是斜着整片平移。
        float angle = atan(offset.y, offset.x);
        vec3 samplePoint = vec3(cos(angle), sin(angle), 0.0) * 3.6
          + vec3(0.0, 0.0, radius * 3.2 - uTime * 0.16);
        float tendril = xqFbm(samplePoint);
        float streamer = pow(smoothstep(0.38, 0.82, tendril), 1.4);

        // 内缘贴着光球淡入，外缘完全散掉，两头都没有硬边
        float outward = smoothstep(1.0, uInner * 1.15, radius);
        float inward = smoothstep(uInner * 0.88, uInner * 1.04, radius);

        // 紧贴光球的色球层始终明亮，往外才交给冕流决定浓淡
        float chromosphere = pow(smoothstep(uInner * 1.5, uInner * 0.95, radius), 1.8);
        float alpha = outward * inward * (0.2 + 0.8 * streamer) + chromosphere * inward * 0.5;

        vec3 color = mix(vec3(1.0, 0.3, 0.03), vec3(1.0, 0.76, 0.4), streamer);
        color = mix(color, vec3(1.0, 0.62, 0.24), chromosphere);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  corona.renderOrder = -2;
  group.add(corona);

  // 外层光晕沿用档案版那张径向纹理，负责把光洒到背景上
  const glowTexture = createCoreGlowTexture();
  let glow = null;
  let outerGlow = null;

  if (glowTexture) {
    const outerMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#d4802f",
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    outerGlow = new THREE.Sprite(outerMaterial);
    outerGlow.scale.set(9.2, 9.2, 1);
    outerGlow.renderOrder = -4;
    group.add(outerGlow);

    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#ffd9a0",
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(3.4, 3.4, 1);
    glow.renderOrder = -3;
    group.add(glow);
  }

  // 写实版不需要晶体外壳与经纬网，返回空值让更新逻辑跳过它们。
  return {
    group,
    core,
    corona,
    glow,
    outerGlow,
    atmosphere: null,
    facetShell: null,
    glassShell: null,
    coordinateGlobe: null,
    structuralFrame: null,
    energyRings: [],
    detailLayer: new THREE.Group()
  };
}

/** 创建黑洞：不透明视界 + 吸积盘 + 光子环 + 被透镜抬起的远端盘面。 */
function createBlackHoleCore(isCompact) {
  const group = new THREE.Group();

  // 视界用实心黑球而不是着色器里的黑色：加法混合画不出黑，
  // 只有写深度的不透明几何体才能把背后的星星真正挡住。
  const horizonGeometry = new THREE.SphereGeometry(0.34, 48, 32);
  const horizonMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const core = new THREE.Mesh(horizonGeometry, horizonMaterial);
  core.renderOrder = 0;
  group.add(core);

  const DISC_HALF_SIZE = 2.6;
  const discGeometry = new THREE.PlaneGeometry(DISC_HALF_SIZE * 2, DISC_HALF_SIZE * 2);
  const discMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHorizon: { value: 0.34 / DISC_HALF_SIZE }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uHorizon;
      varying vec2 vUv;

      ${noiseGlsl(isCompact)}

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        if (r > 1.0 || r < uHorizon) discard;

        // 盘面几乎侧对镜头，压扁纵轴把圆盘投影成椭圆
        float tilt = 0.26;
        vec2 discSpace = vec2(p.x, p.y / tilt);
        float discRadius = length(discSpace);
        float angle = atan(discSpace.y, discSpace.x);

        // 内外径都取椭圆坐标下的值。外径必须落在公告板范围内，
        // 否则衰减项永远不生效，整块面板会被均匀填满。
        float inner = 0.42;
        float outer = 1.15;
        float band = smoothstep(inner, inner * 1.4, discRadius)
          * (1.0 - smoothstep(outer * 0.55, outer, discRadius));

        // 沿半径方向拖出的湍流条纹，随时间向内旋落
        float turbulence = xqFbm(vec3(cos(angle), sin(angle), 0.0) * 3.4
          + vec3(0.0, 0.0, discRadius * 1.6 - uTime * 0.55));

        // 多普勒增亮：转向镜头的一侧又亮又偏白，另一侧压暗偏红。
        // 这是黑洞吸积盘最容易辨认的特征，左右不对称正是它该有的样子。
        float doppler = 0.34 + 0.66 * smoothstep(-0.9, 0.9, -p.x);
        doppler = pow(doppler, 1.35);

        float shaped = pow(smoothstep(0.2, 0.85, turbulence), 1.25);
        vec3 hot = mix(vec3(1.0, 0.22, 0.02), vec3(1.0, 0.95, 0.85), shaped);
        float discAlpha = band * (0.18 + 0.82 * shaped) * doppler * 1.35;

        // 光子环：紧贴视界的一圈极细亮环
        float photon = exp(-pow((r - uHorizon * 1.16) / 0.016, 2.0));

        // 引力透镜：远端盘面被抬到视界上方与下方，形成竖直的拱
        float lensArc = exp(-pow((r - uHorizon * 1.62) / 0.055, 2.0));
        float lensMask = smoothstep(0.04, 0.34, abs(p.y));
        float lens = lensArc * lensMask * (0.5 + 0.5 * turbulence) * 1.9;

        vec3 color = hot * discAlpha
          + vec3(1.0, 0.88, 0.68) * photon * 1.5
          + vec3(1.0, 0.72, 0.4) * lens;

        gl_FragColor = vec4(color, clamp(discAlpha + photon + lens * 0.8, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const disc = new THREE.Mesh(discGeometry, discMaterial);
  disc.renderOrder = 3;
  group.add(disc);

  // 远处的一圈弱光晕，交代黑洞把周围照亮的程度
  const glowTexture = createCoreGlowTexture();
  let glow = null;

  if (glowTexture) {
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#b0651f",
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(6.2, 6.2, 1);
    glow.renderOrder = -4;
    group.add(glow);
  }

  return {
    group,
    core,
    corona: disc,
    glow,
    outerGlow: null,
    atmosphere: null,
    facetShell: null,
    glassShell: null,
    coordinateGlobe: null,
    structuralFrame: null,
    energyRings: [],
    detailLayer: new THREE.Group()
  };
}

/** 创建多层“星穹档案核心”，组合柔光、晶体、经纬壳与结构线。 */
function createArchiveCore() {
  const group = new THREE.Group();
  const detailLayer = new THREE.Group();
  const glowTexture = createCoreGlowTexture();
  let glow = null;

  // 两层柔光叠加模拟 bloom：外层大而淡铺开氛围，内层小而亮收住核心。
  // 单层 sprite 要么糊成一片雾，要么亮度不够，撑不起“恒星”的感觉。
  let outerGlow = null;

  if (glowTexture) {
    const outerMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#c98f4e",
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    outerGlow = new THREE.Sprite(outerMaterial);
    outerGlow.scale.set(5.6, 5.6, 1);
    outerGlow.renderOrder = -4;
    group.add(outerGlow);

    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: "#ffd9a0",
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(2.6, 2.6, 1);
    glow.renderOrder = -3;
    group.add(glow);
  }

  // 菲涅尔着色：边缘越接近视线切面越亮，球体才有体积感。
  // 之前的 emissive Phong 把整个球压成一块没有层次的橙色圆盘。
  const coreGeometry = new THREE.SphereGeometry(0.52, 48, 32);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#7d4413") },
      uBody: { value: new THREE.Color("#e0a45c") },
      uRim: { value: new THREE.Color("#ffe6ae") }
    },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uBody;
      uniform vec3 uRim;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vec3 normal = normalize(vNormalWorld);
        vec3 view = normalize(vViewDirection);

        // 固定的斜上方主光，给球体一个明确的明暗交界线
        vec3 keyLight = normalize(vec3(0.55, 0.68, 0.85));
        float lambert = clamp(dot(normal, keyLight), 0.0, 1.0);
        float shaped = 0.18 + pow(lambert, 0.85) * 0.92;

        float facing = 1.0 - clamp(dot(normal, view), 0.0, 1.0);
        float rim = pow(facing, 2.6);
        float breath = 0.94 + 0.06 * sin(uTime * 1.25);

        vec3 color = mix(uDeep, uBody, shaped);
        color += uRim * rim * 1.35;
        color += uRim * pow(facing, 7.0) * 0.7;

        gl_FragColor = vec4(color * breath, 1.0);
      }
    `,
    depthWrite: true
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.renderOrder = 2;
  group.add(core);

  // 大气层：反面渲染 + 加法混合，在球体外沿堆出一圈柔光
  const atmosphereGeometry = new THREE.SphereGeometry(0.62, 40, 26);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: { uGlow: { value: new THREE.Color("#f6c47c") } },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uGlow;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        float facing = 1.0 - abs(dot(normalize(vNormalWorld), normalize(vViewDirection)));
        float shell = pow(facing, 3.0);
        gl_FragColor = vec4(uGlow, shell * 0.85);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.renderOrder = 1;
  group.add(atmosphere);

  // 晶壳改用棱线而非实心 wireframe：加法混合下的满屏白线会把核心糊掉
  const facetSource = new THREE.IcosahedronGeometry(0.74, 1);
  const facetGeometry = new THREE.EdgesGeometry(facetSource);
  facetSource.dispose();
  const facetMaterial = new THREE.LineBasicMaterial({
    color: "#f4cf94",
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const facetShell = new THREE.LineSegments(facetGeometry, facetMaterial);
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

  // 经纬球用深度衰减的着色器：背面线条压暗，球才有前后关系而不是一团网。
  const globeGeometry = new THREE.SphereGeometry(0.9, 22, 12);
  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: { uLine: { value: new THREE.Color("#7fbcc5") } },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uLine;
      varying vec3 vNormalWorld;
      varying vec3 vViewDirection;

      void main() {
        float towardsViewer = clamp(dot(normalize(vNormalWorld), normalize(vViewDirection)), 0.0, 1.0);
        // 正对镜头的那片经纬线正好压在核心最亮处，压暗它才看得见球体的渐变
        float depthFade = mix(0.2, 0.07, towardsViewer);
        gl_FragColor = vec4(uLine, depthFade);
      }
    `,
    wireframe: true,
    transparent: true,
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
    atmosphere,
    facetShell,
    glassShell,
    coordinateGlobe,
    structuralFrame,
    energyRings,
    detailLayer,
    glow,
    outerGlow
  };
}

/** 生成档案核心、三维轨道和轨道光点的完整主视觉装置。 */
/** 从伴星被撕出、螺旋落向黑洞的物质流。位置每帧在 CPU 上重算。 */
function createAccretionStream(isCompact) {
  const count = isCompact ? 220 : 620;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const random = createSeededRandom(0x2f19b3d1);

  for (let index = 0; index < count; index += 1) {
    seeds[index] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: isCompact ? 46 : 64 } },
    vertexShader: `
      attribute float aSeed;
      uniform float uScale;
      varying float vSeed;

      void main() {
        vSeed = aSeed;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (0.7 + aSeed * 1.1) * uScale / max(-viewPosition.z, 0.001);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      varying float vSeed;

      void main() {
        vec2 offset = gl_PointCoord - vec2(0.5);
        float distance = length(offset);
        if (distance > 0.5) discard;

        float core = smoothstep(0.5, 0.0, distance);
        // 越靠流末端越白热，用 seed 制造一点颜色离散
        vec3 tint = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.9, 0.72), vSeed);
        gl_FragColor = vec4(tint * (0.6 + core), core * core * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return { points: new THREE.Points(geometry, material), seeds, count };
}

/** 让物质流沿一条弯向黑洞的路径流动，落点越近速度越快。 */
function updateAccretionStream(orbitalSystem, time) {
  const stream = orbitalSystem.stream;
  if (!stream) return;

  const source = orbitalSystem.bodies[0].parts.group.position;
  const sink = orbitalSystem.bodies[1].parts.group.position;
  const array = stream.points.geometry.attributes.position.array;

  for (let index = 0; index < stream.count; index += 1) {
    const seed = stream.seeds[index];
    // 每颗粒子按自己的相位循环推进，整条流看起来是连续供料的
    const progress = (seed + time * 0.19) % 1;
    // 平方缓动：靠近黑洞时明显加速，符合被引力拉扯的观感
    const eased = progress * progress;

    // 二次贝塞尔，控制点偏到连线一侧，流就是弯的而不是一条直线
    const midX = (source.x + sink.x) * 0.5 + (sink.y - source.y) * 0.2;
    const midY = (source.y + sink.y) * 0.5 - (sink.x - source.x) * 0.2;
    const midZ = (source.z + sink.z) * 0.5;

    const inverse = 1 - eased;
    const baseX = inverse * inverse * source.x + 2 * inverse * eased * midX + eased * eased * sink.x;
    const baseY = inverse * inverse * source.y + 2 * inverse * eased * midY + eased * eased * sink.y;
    const baseZ = inverse * inverse * source.z + 2 * inverse * eased * midZ + eased * eased * sink.z;

    // 绕流轴的螺旋，半径随接近黑洞而收紧
    const coil = seed * Math.PI * 2 + progress * 5.5;
    const jitter = ((seed * 9301 + 49297) % 233280) / 233280;
    const spread = ((1 - eased) * 0.3 + 0.04) * (0.35 + jitter * 1.3);

    const offset = index * 3;
    array[offset] = baseX + Math.cos(coil) * spread;
    array[offset + 1] = baseY + Math.sin(coil) * spread * 0.5;
    array[offset + 2] = baseZ + Math.sin(coil) * spread;
  }

  stream.points.geometry.attributes.position.needsUpdate = true;
}

/** 双星：太阳与黑洞绕共同质心反相公转，中间连着一道吸积流。 */
function createBinarySystem(isCompact) {
  const group = new THREE.Group();
  const solar = createSolarCore(isCompact);
  const hole = createBlackHoleCore(isCompact);

  // 两个天体都要缩小，否则并排放进首屏会互相挤爆
  solar.group.scale.setScalar(0.62);
  hole.group.scale.setScalar(0.52);
  group.add(solar.group, hole.group);

  const stream = createAccretionStream(isCompact);
  group.add(stream.points);

  return {
    group,
    stream,
    detailLayer: new THREE.Group(),
    // 质量越大离质心越近，所以黑洞的轨道半径明显小于太阳
    bodies: [
      { parts: solar, radius: 1.42, speed: 0.24, phase: 0, spinX: 0.04, spinY: 0.1 },
      { parts: hole, radius: 0.82, speed: 0.24, phase: Math.PI, spinX: 0, spinY: 0 }
    ]
  };
}

const PLANET_GATES = [
  { planet: "mercury", slug: "prompt-reader", name: "Prompt Reader", role: "读取图片提示词与工作流", href: "prompt-reader/index.html", accent: "#79aebc", group: "工具" },
  { planet: "venus", slug: "krea2", name: "Krea2 提示词工匠", role: "八卡槽提示词整理与扩写", href: "krea2/index.html", accent: "#e7ad61", group: "提示词" },
  { planet: "earth", slug: "lighting-codex", name: "双子星光影魔典", role: "光影、氛围与镜头质感", href: "lighting-codex/index.html", accent: "#e7ad61", group: "提示词" },
  { planet: "mars", slug: "portal", name: "星穹绘所", role: "连接 ComfyUI 的出图工作台", href: "portal/index.html", accent: "#76bba5", group: "出图" },
  { planet: "jupiter", slug: "wd-tagger", name: "WD 标签反推器", role: "从参考图反推 Danbooru 标签", href: "wd-tagger/index.html", accent: "#76bba5", group: "出图" },
  { planet: "saturn", slug: "drag-resolver", name: "Drag Resolver", role: "ComfyUI 拖拽导入排障", href: "drag-resolver/index.html", accent: "#79aebc", group: "工具" },
  { planet: "uranus", slug: "moon-scroll", name: "月卷协议", role: "跨模型上下文约定", href: "moon-scroll/index.html", accent: "#9d91c5", group: "协议" },
  { planet: "neptune", slug: "decoder-terminal", name: "解码终端", role: "还原约定格式与编码消息", href: "decoder-terminal/index.html", accent: "#79aebc", group: "协议" }
];

const PLANET_GATE_BY_PLANET = new Map(PLANET_GATES.map((gate) => [gate.planet, gate]));

function readVisitedGates() {
  try {
    const raw = localStorage.getItem("xingqiong-visited-gates");
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function saveVisitedGate(slug) {
  try {
    const key = "xingqiong-visited-gates";
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list) && !list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {
    // 存储不可用时静默忽略。
  }
}

function getTodayGate() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return PLANET_GATES[day % PLANET_GATES.length];
}

function createOrbitalSystem(isCompact) {
  const root = new THREE.Group();
  const tracks = [];
  const trackOptions = [
    // 由内向外即水金地火木土天海，越靠内公转越快；轨道倾角各异以免叠成一条带
    { radiusX: 1.82, radiusY: 1.5, depth: 0.18, tiltX: 0.26, tiltY: -0.6, tiltZ: -0.3, color: "#9c9791", opacity: 0.22, phase: 4.3, speed: 0.52, planet: "mercury", planetRadius: 0.06 },
    { radiusX: 2.14, radiusY: 1.02, depth: 0.16, tiltX: -0.5, tiltY: 0.2, tiltZ: 0.42, color: "#e0c489", opacity: 0.26, phase: 1.1, speed: 0.42, planet: "venus", planetRadius: 0.088 },
    { radiusX: 2.5, radiusY: 1.42, depth: 0.14, tiltX: -0.42, tiltY: 0.34, tiltZ: 0.54, color: "#70b8c5", opacity: 0.3, phase: 2.4, speed: -0.35, planet: "earth", planetRadius: 0.095 },
    { radiusX: 2.86, radiusY: 0.9, depth: 0.2, tiltX: 0.64, tiltY: -0.22, tiltZ: 0.12, color: "#c9764f", opacity: 0.26, phase: 5.6, speed: 0.3, planet: "mars", planetRadius: 0.072 },
    { radiusX: 3.3, radiusY: 1.66, depth: 0.18, tiltX: 0.7, tiltY: 0.16, tiltZ: 0.06, color: "#e3b76e", opacity: 0.36, phase: 0.2, speed: 0.23, planet: "jupiter", planetRadius: 0.215 },
    { radiusX: 3.72, radiusY: 1.16, depth: 0.2, tiltX: -0.32, tiltY: 0.5, tiltZ: -0.4, color: "#e8cf9a", opacity: 0.3, phase: 3.3, speed: 0.18, planet: "saturn", planetRadius: 0.185, ring: true, ringTilt: 0.3 },
    { radiusX: 4.08, radiusY: 1.9, depth: 0.16, tiltX: 0.4, tiltY: -0.38, tiltZ: 0.58, color: "#8fd0d8", opacity: 0.22, phase: 2.0, speed: 0.14, planet: "uranus", planetRadius: 0.13, ring: true, ringTilt: 1.45 },
    { radiusX: 4.4, radiusY: 1.34, depth: 0.18, tiltX: -0.6, tiltY: 0.28, tiltZ: 0.24, color: "#7f9ce0", opacity: 0.2, phase: 5.0, speed: 0.11, planet: "neptune", planetRadius: 0.125 }
  ];

  for (const options of trackOptions) {
    const meta = PLANET_GATE_BY_PLANET.get(options.planet) || null;
    const track = createOrbitalTrack({ ...options, meta }, isCompact);
    tracks.push(track);
    root.add(track.carrier);
  }

  const heroCore = heroVariant() === "archive" ? createArchiveCore() : createBinarySystem(isCompact);
  root.add(heroCore.group);

  // 单体形态也包成 bodies，更新循环就只有一条路径，不必到处判空
  const bodies = heroCore.bodies || [{ parts: heroCore, radius: 0, speed: 0, phase: 0, spinX: 0.11, spinY: 0.19 }];

  return { root, tracks, bodies, stream: heroCore.stream || null, detailLayer: heroCore.detailLayer };
}

/** 主视觉形态：archive 是默认的档案晶核，sun 是写实恒星。 */
function heroVariant() {
  try {
    const stored = localStorage.getItem("xingqiong-hero");
    return stored === "archive" ? "archive" : "binary";
  } catch {
    return "archive";
  }
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

  // 与 sanctuary.js 共用同一个显式开关，读的是同一个 localStorage 键。
  const MOTION_KEY = "xingqiong-motion";

  /** 系统偏好之外允许访客只为本站打开动效，默认仍然跟随系统。 */
  function prefersStatic() {
    let override = null;
    try {
      override = localStorage.getItem(MOTION_KEY);
    } catch {
      override = null;
    }

    if (override === "on") return false;
    if (override === "off") return true;
    return motionQuery.matches;
  }

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

  const orbitalSystem = createOrbitalSystem(mobileQuery.matches);
  // 每帧复用，避免在动画循环里反复分配
  const billboardQuaternion = new THREE.Quaternion();
  const starWorldPosition = new THREE.Vector3();
  let particles = createParticleField(mobileQuery.matches);
  const nebula = createNebula(mobileQuery.matches);
  // 作为相机的子节点：不管相机怎么动，幕布始终正对并铺满视口
  nebula.position.set(0, 0, -30);
  camera.add(nebula);
  scene.add(camera, particles, orbitalSystem.root);

  /* ── 星轨即导航：行星悬停/点击 + 访客点亮 ── */
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const visitedGates = readVisitedGates();
  const gateTip = document.createElement("div");
  gateTip.className = "hero__gate-tip";
  gateTip.setAttribute("role", "tooltip");
  gateTip.hidden = true;
  host.appendChild(gateTip);

  const gateProgress = document.createElement("div");
  gateProgress.className = "hero__gate-progress";
  gateProgress.setAttribute("role", "status");
  gateProgress.setAttribute("aria-live", "polite");
  host.appendChild(gateProgress);

  const gateHitMeshes = orbitalSystem.tracks
    .map((track) => track.orbiter)
    .filter(Boolean);

  let hoveredGate = null;
  let lastPointer = null;
  let pointerOverInteractive = false;

  function planetMetaFromObject(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.gateMeta) return node.userData.gateMeta;
      node = node.parent;
    }
    return null;
  }

  function updateVisitedHighlight() {
    for (const track of orbitalSystem.tracks) {
      if (!track.meta) continue;
      const visited = visitedGates.has(track.meta.slug);
      if (track.lineMaterial) {
        if (visited) {
          track.lineMaterial.color.set(track.meta.accent);
          track.lineMaterial.opacity = Math.min(0.78, track.lineMaterial.opacity + 0.34);
        }
      }
    }
  }

  function updateGateProgress() {
    const total = PLANET_GATES.length;
    const lit = PLANET_GATES.filter((gate) => visitedGates.has(gate.slug)).length;
    const today = getTodayGate();
    gateProgress.innerHTML =
      '<span class="hero__gate-progress__hint">点击行星</span>' +
      '<span class="hero__gate-progress__label">星轨点亮</span>' +
      '<strong>' + lit + ' / ' + total + '</strong>' +
      '<a class="hero__gate-progress__today" href="' + today.href + '">今日星门 · ' + today.name + '</a>';
  }

  function showGateTip(meta, clientX, clientY) {
    const rect = host.getBoundingClientRect();
    const left = Math.max(12, Math.min(rect.width - 240, clientX - rect.left + 14));
    const top = Math.max(12, Math.min(rect.height - 90, clientY - rect.top + 14));
    const visited = visitedGates.has(meta.slug);
    gateTip.innerHTML =
      '<span class="hero__gate-tip__group">' + meta.group + '</span>' +
      '<strong>' + meta.name + '</strong>' +
      '<span class="hero__gate-tip__role">' + meta.role + '</span>' +
      '<small class="' + (visited ? 'is-visited' : '') + '">' + (visited ? '已点亮 · ' : '') + '点击前往档案</small>';
    gateTip.style.left = left + 'px';
    gateTip.style.top = top + 'px';
    gateTip.hidden = false;
  }

  function hideGateTip() {
    gateTip.hidden = true;
  }

  function findGateAt(clientX, clientY) {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(gateHitMeshes, true);
    for (const hit of hits) {
      const meta = planetMetaFromObject(hit.object);
      if (meta) return meta;
    }
    return null;
  }

  function refreshGateHover() {
    if (!lastPointer) {
      hoveredGate = null;
      hideGateTip();
      return;
    }
    if (pointerOverInteractive) {
      hoveredGate = null;
      hideGateTip();
      return;
    }
    const meta = findGateAt(lastPointer.x, lastPointer.y);
    hoveredGate = meta;
    if (meta) {
      showGateTip(meta, lastPointer.x, lastPointer.y);
    } else {
      hideGateTip();
    }
  }

  function handleGatePointerMove(event) {
    lastPointer = { x: event.clientX, y: event.clientY };
    pointerOverInteractive = Boolean(event.target.closest && event.target.closest('a, button'));
    refreshGateHover();
  }

  function handleGatePointerLeave() {
    lastPointer = null;
    pointerOverInteractive = false;
    hoveredGate = null;
    hideGateTip();
  }

  function handleGateClick(event) {
    if (event.target.closest && event.target.closest('a, button')) return;
    const meta = findGateAt(event.clientX, event.clientY);
    if (!meta) return;
    if (!visitedGates.has(meta.slug)) {
      visitedGates.add(meta.slug);
      saveVisitedGate(meta.slug);
      updateVisitedHighlight();
      updateGateProgress();
    }
    window.location.href = meta.href;
  }

  updateVisitedHighlight();
      updateGateProgress();
    }
    window.location.href = meta.href;
  }

  updateVisitedHighlight();
  updateGateProgress();

  host.addEventListener('pointermove', handleGatePointerMove, { passive: true });
  host.addEventListener('pointerleave', handleGatePointerLeave, { passive: true });
  host.addEventListener('click', handleGateClick, { passive: false });


  const state = {
    compact: mobileQuery.matches,
    failed: false,
    ready: false,
    inViewport: true,
    pageVisible: !document.hidden,
    reducedMotion: prefersStatic(),
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

    orbitalSystem.root.position.set(isCompact ? 1.0 : 3.15, isCompact ? 1.9 : -0.05, -0.36);
    orbitalSystem.root.scale.setScalar(isCompact ? 1.05 : 1.95);
    orbitalSystem.detailLayer.visible = !isCompact;

    // 幕布必须刚好盖满该深度处的视锥，留一点余量避免边缘露底
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * 30;
    nebula.scale.set(halfHeight * camera.aspect * 1.12, halfHeight * 1.12, 1);
    nebula.material.uniforms.uAspect.value = camera.aspect;
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
    const baseScale = state.compact ? 1.05 : 1.95;
    orbitalSystem.root.position.y = (state.compact ? 1.9 : -0.05) + scrollProgress * 0.16;
    orbitalSystem.root.position.z = -0.36 - scrollProgress * 0.9;
    orbitalSystem.root.scale.setScalar(baseScale * (1 - scrollProgress * 0.1));
    orbitalSystem.root.rotation.x = -0.05 + state.pointerCurrent.y * 0.075;
    orbitalSystem.root.rotation.y = Math.sin(time * 0.17) * 0.04 + state.pointerCurrent.x * 0.09;
    orbitalSystem.root.rotation.z = scrollProgress * 0.12;
    particles.rotation.y = time * 0.006 + state.pointerCurrent.x * 0.018;
    particles.rotation.x = -0.08 + state.pointerCurrent.y * 0.012;

    // 恒星在双星里一直在动，行星的晨昏线必须跟着它转，
    // 用世界坐标传进着色器，才不受各级 group 旋转的影响。
    orbitalSystem.bodies[0].parts.group.getWorldPosition(starWorldPosition);

    for (const track of orbitalSystem.tracks) {
      const angle = time * track.speed + track.phase;
      track.orbiter.position.set(
        Math.cos(angle) * track.radiusX,
        Math.sin(angle) * track.radiusY,
        Math.sin(angle * 2 + track.phase) * track.depth
      );
      track.orbiter.rotation.y += deltaSeconds * 0.16;
      track.orbiter.material.uniforms.uTime.value = time;
      track.orbiter.material.uniforms.uLightPosition.value.copy(starWorldPosition);
      // 轨道星点流与行星同相流动
      track.streamMaterial.uniforms.uTime.value = time;
    }

    const pulse = 1 + Math.sin(time * 1.35) * 0.055;
    particles.material.uniforms.uTime.value = time;
    nebula.material.uniforms.uTime.value = time;

    for (const body of orbitalSystem.bodies) {
      const parts = body.parts;

      // 双星绕共同质心公转：同角速度、反相，半径由质量比决定。
      // 单体形态半径为 0，这段自然退化成原地不动。
      if (body.radius > 0) {
        const orbitAngle = time * body.speed + body.phase;
        parts.group.position.set(
          Math.cos(orbitAngle) * body.radius,
          Math.sin(orbitAngle) * body.radius * 0.24,
          Math.sin(orbitAngle) * body.radius * 0.45
        );
      }

      parts.core.scale.setScalar(pulse);
      parts.core.rotation.x += deltaSeconds * body.spinX;
      parts.core.rotation.y += deltaSeconds * body.spinY;
      if (parts.core.material.uniforms?.uTime) parts.core.material.uniforms.uTime.value = time;
      parts.atmosphere?.scale.setScalar(1 + Math.sin(time * 1.35 + 0.6) * 0.03);

      if (parts.corona) {
        parts.corona.material.uniforms.uTime.value = time;
        // 抵消父级的世界旋转，让公告板的世界朝向恒等于相机朝向
        parts.corona.parent.getWorldQuaternion(billboardQuaternion);
        parts.corona.quaternion.copy(billboardQuaternion.invert()).multiply(camera.quaternion);
      }

      // 档案晶核独有的外壳与经纬网，其余形态为空时整段跳过。
      if (parts.facetShell) {
        parts.facetShell.rotation.x -= deltaSeconds * 0.08;
        parts.facetShell.rotation.y += deltaSeconds * 0.13;
      }

      if (parts.glassShell) {
        parts.glassShell.rotation.x += deltaSeconds * 0.035;
        parts.glassShell.rotation.y -= deltaSeconds * 0.055;
      }

      if (parts.coordinateGlobe) {
        parts.coordinateGlobe.rotation.y += deltaSeconds * 0.045;
        parts.coordinateGlobe.rotation.z -= deltaSeconds * 0.025;
      }

      if (parts.structuralFrame) {
        parts.structuralFrame.rotation.y += deltaSeconds * 0.035;
      }

      for (let index = 0; index < parts.energyRings.length; index += 1) {
        const direction = index % 2 === 0 ? 1 : -1;
        parts.energyRings[index].rotation.z += deltaSeconds * (0.045 + index * 0.018) * direction;
      }
    }

    updateAccretionStream(orbitalSystem, time);

    if (orbitalSystem.glow) {
      orbitalSystem.glow.material.opacity = 0.45 + Math.sin(time * 1.1) * 0.055;
    }

    // 每帧根据行星当前位置刷新悬停状态，行星移开时提示卡会自动消失
    refreshGateHover();

    // 镜头呼吸：极慢的推近拉远，让整片星海像在太空中漂浮
    const baseZoom = state.compact ? 9.7 : 8.8;
    camera.position.z = baseZoom * (1 + Math.sin(time * 0.3) * 0.011);
    camera.position.x = state.pointerCurrent.x * 0.34;
    camera.position.y = state.pointerCurrent.y * 0.2;
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
    state.reducedMotion = prefersStatic();
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
    host.removeEventListener("pointermove", handleGatePointerMove);
    host.removeEventListener("pointerleave", handleGatePointerLeave);
    host.removeEventListener("click", handleGateClick);
    targetCanvas.removeEventListener("webglcontextlost", handleContextLost);
    motionQuery.removeEventListener?.("change", handleMotionPreferenceChange);
    window.removeEventListener("xq:motionchange", handleMotionPreferenceChange);
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
  // 站点内的显式动效开关也要即时生效，不必刷新页面。
  window.addEventListener("xq:motionchange", handleMotionPreferenceChange);
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
