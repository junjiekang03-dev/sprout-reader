"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Outlines } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 真 3D 萌宠(占位生物)——React Three Fiber / WebGL。
 * 卡通分级着色(toon + gradientMap)+ 描边 + 大眼双高光,做成"刻意的卡通"而非"糙realistic"。
 * 可拖着 360° 转、呼吸/眨眼/瞳孔看你、耳朵尾巴次级摆动、点击会跳;按 species 配色和特征区分。
 * 正式 glb 模型到位前的「程序化身体」:换模型时只替换 <Creature/>,交互/动画不动。
 */

type SpeciesKey = "dragon" | "owl" | "fox";

const THEME: Record<SpeciesKey, { body: string; belly: string; accent: string; inner: string }> = {
  dragon: { body: "#34d399", belly: "#ecfdf5", accent: "#f59e0b", inner: "#a7f3d0" },
  owl: { body: "#60a5fa", belly: "#eff6ff", accent: "#fbbf24", inner: "#bfdbfe" },
  fox: { body: "#fb923c", belly: "#fff7ed", accent: "#ffffff", inner: "#fed7aa" },
};

const OUTLINE = "#0b1c30";

// 3 级卡通分色渐变(给 meshToonMaterial 做清爽的 cel-shading,而非默认柔和过渡)
const GRAD = (() => {
  const data = new Uint8Array([110, 110, 110, 255, 180, 180, 180, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

/** 统一的卡通材质(带分级渐变) */
function Toon({ c }: { c: string }) {
  return <meshToonMaterial color={c} gradientMap={GRAD} />;
}

const CHEERS = [
  "再读一篇,我会更有精神!",
  "今天的你超棒 🌟",
  "我们一起加油!",
  "下一个故事在等我们啦~",
  "谢谢你陪我长大 🌱",
  "你越读,我越神气!",
];
const PARTICLES = ["💚", "✨", "⭐", "🌟", "💫"];

interface Burst {
  id: number;
  emoji: string;
  left: number;
  delay: number;
}

const _cam = new THREE.Vector3();

/** 一只眼睛:白球 + 深色瞳孔 + 大小双高光(瞳孔跟相机转,显得在"看你") */
function Eye({
  x,
  groupRef,
  pupilRef,
}: {
  x: number;
  groupRef: React.Ref<THREE.Group>;
  pupilRef: React.RefObject<THREE.Mesh | null>;
}) {
  return (
    <group ref={groupRef} position={[x, 0.33, 0.79]}>
      <mesh scale={[0.86, 1, 0.7]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <Toon c="#ffffff" />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.22]}>
        <sphereGeometry args={[0.155, 24, 24]} />
        <meshToonMaterial color="#16223a" gradientMap={GRAD} />
        {/* 主高光 */}
        <mesh position={[0.055, 0.07, 0.1]}>
          <sphereGeometry args={[0.052, 14, 14]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* 次高光 */}
        <mesh position={[-0.045, -0.05, 0.1]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </mesh>
    </group>
  );
}

/** 程序化生物本体:呼吸 / 眨眼 / 瞳孔看相机 / 耳尾次级摆动 / 点击跳跃,全在 useFrame 算。 */
function Creature({
  species,
  reactRef,
  reduce,
}: {
  species: SpeciesKey;
  reactRef: React.MutableRefObject<number>;
  reduce: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const ears = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Group>(null);
  const rightEye = useRef<THREE.Group>(null);
  const leftPupil = useRef<THREE.Mesh>(null);
  const rightPupil = useRef<THREE.Mesh>(null);
  const blink = useRef({ t: 0, next: 2.5 });
  const c = THEME[species];

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    let sy = 1;
    let yOff = 0;
    if (!reduce) {
      sy = 1 + Math.sin(t * 1.9) * 0.035; // 呼吸
      yOff = Math.sin(t * 1.6) * 0.05; // 浮动
      g.rotation.z = Math.sin(t * 0.8) * 0.04; // 轻微重心摆动
    }

    // 点击反应包络(0→1→0);仅推进计时,动效另算
    let env = 0;
    if (reactRef.current > 0) {
      reactRef.current = Math.max(0, reactRef.current - delta / 0.6);
      env = Math.sin((1 - reactRef.current) * Math.PI);
    }
    // reduced-motion 下点击不做位移/挤压/甩动,只保留气泡+播报+(CSS已关的)粒子
    const e = reduce ? 0 : env;
    yOff += e * 0.55; // 跳
    sy *= 1 - e * 0.16; // 落地挤压
    g.rotation.y = e * 0.5; // 开心晃一下(用包络直接赋值,不累加→不会越转越偏)

    g.position.y = yOff;
    if (body.current) {
      const sxz = 1 / Math.sqrt(sy);
      body.current.scale.set(sxz, sy, sxz);
    }

    // 耳朵/尾巴次级摆动(idle 轻摆 + 跳跃时跟随甩动)
    if (ears.current) ears.current.rotation.x = (reduce ? 0 : Math.sin(t * 2.3) * 0.05) - e * 0.2;
    if (tail.current) tail.current.rotation.z = (reduce ? 0 : Math.sin(t * 1.7) * 0.16) + e * 0.28;

    // 眨眼
    let lid = 1;
    if (!reduce) {
      const b = blink.current;
      b.t += delta;
      if (b.t > b.next) {
        const into = b.t - b.next;
        if (into < 0.16) lid = 1 - Math.sin((into / 0.16) * Math.PI);
        else b.next = b.t + 2.5 + Math.random() * 3;
      }
    }
    if (leftEye.current) leftEye.current.scale.y = lid;
    if (rightEye.current) rightEye.current.scale.y = lid;

    // 瞳孔看相机
    for (const pr of [leftPupil, rightPupil]) {
      const p = pr.current;
      if (!p || !p.parent) continue;
      _cam.copy(state.camera.position);
      p.parent.worldToLocal(_cam).normalize();
      p.position.x = _cam.x * 0.08;
      p.position.y = _cam.y * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* 会呼吸的身体组(手脚不缩放) */}
      <group ref={body}>
        {/* 身体(略蛋形) */}
        <mesh scale={[1, 1.06, 1]}>
          <sphereGeometry args={[1, 48, 48]} />
          <Toon c={c.body} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
        {/* 肚皮 */}
        <mesh position={[0, -0.18, 0.72]} scale={[0.78, 0.92, 0.6]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <Toon c={c.belly} />
        </mesh>
        {/* 圆吻 + 鼻子 */}
        <mesh position={[0, -0.04, 0.9]} scale={[0.5, 0.36, 0.4]}>
          <sphereGeometry args={[0.4, 28, 28]} />
          <Toon c={c.belly} />
        </mesh>
        <mesh position={[0, 0.0, 1.04]}>
          <sphereGeometry args={[0.07, 18, 18]} />
          <Toon c={OUTLINE} />
        </mesh>
        {/* 腮红 */}
        <mesh position={[-0.5, -0.05, 0.74]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0.5, -0.05, 0.74]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.65} />
        </mesh>

        {/* 眼睛 */}
        <Eye x={-0.34} groupRef={leftEye} pupilRef={leftPupil} />
        <Eye x={0.34} groupRef={rightEye} pupilRef={rightPupil} />

        {/* species 头部特征(整组绕 head-top 枢轴次级摆动) */}
        {species === "fox" && (
          <group ref={ears} position={[0, 0.62, 0.03]}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.5, 0.23, 0.02]} rotation={[0, 0, -s * 0.25]}>
                <mesh>
                  <coneGeometry args={[0.22, 0.55, 24]} />
                  <Toon c={c.body} />
                  <Outlines thickness={0.02} color={OUTLINE} />
                </mesh>
                <mesh position={[0, -0.02, 0.06]} scale={[0.6, 0.7, 0.6]}>
                  <coneGeometry args={[0.22, 0.55, 24]} />
                  <Toon c={c.inner} />
                </mesh>
              </group>
            ))}
          </group>
        )}
        {species === "dragon" && (
          <group ref={ears} position={[0, 0.7, 0.05]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.28, 0.28, 0.05]} rotation={[0, 0, -s * 0.3]}>
                <coneGeometry args={[0.11, 0.36, 18]} />
                <Toon c={c.accent} />
                <Outlines thickness={0.02} color={OUTLINE} />
              </mesh>
            ))}
            <mesh position={[0, -0.08, -0.05]} rotation={[0.2, 0, 0]} scale={[1, 0.5, 0.5]}>
              <coneGeometry args={[0.12, 0.5, 4]} />
              <Toon c={c.inner} />
            </mesh>
          </group>
        )}
        {species === "owl" && (
          <>
            <group ref={ears} position={[0, 0.7, 0.05]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.5, 0.22, 0.05]} rotation={[0, 0, -s * 0.15]}>
                  <coneGeometry args={[0.18, 0.4, 4]} />
                  <Toon c={c.body} />
                  <Outlines thickness={0.02} color={OUTLINE} />
                </mesh>
              ))}
            </group>
            <mesh position={[0, 0.04, 1.0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.12, 0.26, 4]} />
              <Toon c={c.accent} />
            </mesh>
          </>
        )}
      </group>

      {/* 小手(身体两侧) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.96, -0.35, 0.35]} scale={[0.7, 1, 0.7]}>
          <sphereGeometry args={[0.22, 22, 22]} />
          <Toon c={c.body} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
      ))}
      {/* 小脚 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, -1.02, 0.42]} scale={[1, 0.7, 1.2]}>
          <sphereGeometry args={[0.27, 24, 24]} />
          <Toon c={c.accent} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
      ))}
      {/* 尾巴(狐/龙;绕基部枢轴摆动) */}
      {(species === "fox" || species === "dragon") && (
        <group ref={tail} position={[0, -0.3, -0.82]}>
          <mesh position={[0, -0.25, -0.18]} rotation={[0.7, 0, 0]}>
            <coneGeometry args={[0.3, 1.0, 22]} />
            <Toon c={species === "fox" ? c.accent : c.body} />
            <Outlines thickness={0.02} color={OUTLINE} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function PetCreature3D({ species, name }: { species: SpeciesKey; name: string }) {
  const reactRef = useRef(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seq = useRef(0);
  const cheerIdx = useRef(0);
  const down = useRef<{ x: number; y: number } | null>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // R3F 在路由切换瞬间偶发把 canvas 量成默认 300×150 → 布局稳定后触发一次重测
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    timers.current.push(t);
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const pat = useCallback(() => {
    reactRef.current = 1;
    setBubble(CHEERS[cheerIdx.current % CHEERS.length]);
    cheerIdx.current += 1;
    later(1800, () => setBubble(null));
    const burst: Burst[] = Array.from({ length: 5 }, () => ({
      id: seq.current++,
      emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)],
      left: 18 + Math.random() * 64,
      delay: Math.round(Math.random() * 160),
    }));
    setBursts((b) => [...b, ...burst]);
    const ids = new Set(burst.map((x) => x.id));
    later(1300, () => setBursts((b) => b.filter((x) => !ids.has(x.id))));
  }, [later]);

  const onDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) pat();
  };

  return (
    <div
      className="relative mx-auto h-60 w-full max-w-[20rem]"
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      {bubble && (
        <div
          aria-hidden
          className="pet-bubble pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-card"
        >
          {bubble}
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {bubble}
      </p>
      {bursts.map((p) => (
        <span
          key={p.id}
          aria-hidden
          className="pet-particle pointer-events-none absolute bottom-12 z-10 text-xl"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}ms` }}
        >
          {p.emoji}
        </span>
      ))}

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.25, 5], fov: 38 }}
        className="!touch-pan-y"
        style={{ width: "100%", height: "100%" }}
      >
        <hemisphereLight args={["#ffffff", "#cdd6e8", 0.9]} />
        <directionalLight position={[3, 5, 4]} intensity={1.25} color="#fff6ec" />
        <directionalLight position={[-4, 1, 2]} intensity={0.5} color="#dbeafe" />
        <directionalLight position={[0, 3, -5]} intensity={0.7} color="#fff7ed" />
        <Creature species={species} reactRef={reactRef} reduce={reduce} />
        <ContactShadows
          frames={1}
          position={[0, -1.5, 0]}
          opacity={0.32}
          scale={6}
          blur={3}
          far={3.2}
        />
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          autoRotate={!reduce}
          autoRotateSpeed={0.7}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.9}
        />
      </Canvas>

      <button
        type="button"
        onClick={pat}
        aria-label={`摸摸${name}`}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        拖一拖转个圈 · 点一点摸摸它 👆
      </button>
    </div>
  );
}
