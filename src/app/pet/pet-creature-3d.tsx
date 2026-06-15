"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Outlines } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 真 3D 萌宠(占位生物)——React Three Fiber / WebGL。
 * 卡通材质(toon) + 描边 + 大眼高光,做成"刻意的卡通"而非"糙realistic"。
 * 可拖着 360° 转、会呼吸/眨眼/看向你、点击会跳;按 species 配色和特征区分。
 * 正式 glb 模型到位前的「程序化身体」:换模型时只替换 <Creature/>,交互/动画不动。
 */

type SpeciesKey = "dragon" | "owl" | "fox";

const THEME: Record<SpeciesKey, { body: string; belly: string; accent: string; inner: string }> = {
  dragon: { body: "#34d399", belly: "#ecfdf5", accent: "#f59e0b", inner: "#a7f3d0" },
  owl: { body: "#60a5fa", belly: "#eff6ff", accent: "#fbbf24", inner: "#bfdbfe" },
  fox: { body: "#fb923c", belly: "#fff7ed", accent: "#ffffff", inner: "#fed7aa" },
};

const OUTLINE = "#0b1c30";

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

/** 一只眼睛:白球 + 深色瞳孔 + 高光点(瞳孔/高光跟相机转,显得在"看你") */
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
    <group ref={groupRef} position={[x, 0.34, 0.78]}>
      <mesh scale={[0.85, 1, 0.7]}>
        <sphereGeometry args={[0.27, 28, 28]} />
        <meshToonMaterial color="#ffffff" />
        <Outlines thickness={0.012} color={OUTLINE} />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshToonMaterial color="#16223a" />
        {/* 高光点 */}
        <mesh position={[0.05, 0.06, 0.09]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </mesh>
    </group>
  );
}

/** 程序化生物本体:呼吸 / 眨眼 / 瞳孔看相机 / 点击跳跃 + 转身,全在 useFrame 算。 */
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
    if (reactRef.current > 0) {
      reactRef.current = Math.max(0, reactRef.current - delta / 0.6);
      const env = Math.sin((1 - reactRef.current) * Math.PI);
      yOff += env * 0.55; // 跳
      sy *= 1 - env * 0.16; // 落地挤压
      if (!reduce) g.rotation.y += delta * env * 7; // 开心转一下
    }
    g.position.y = yOff;
    if (body.current) {
      const sxz = 1 / Math.sqrt(sy);
      body.current.scale.set(sxz, sy, sxz);
    }

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
      {/* 会呼吸的身体组(脚不缩放) */}
      <group ref={body}>
        {/* 身体(略蛋形) */}
        <mesh scale={[1, 1.06, 1]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshToonMaterial color={c.body} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
        {/* 肚皮 */}
        <mesh position={[0, -0.18, 0.72]} scale={[0.78, 0.92, 0.6]}>
          <sphereGeometry args={[0.6, 28, 28]} />
          <meshToonMaterial color={c.belly} />
        </mesh>
        {/* 圆吻 + 鼻子 */}
        <mesh position={[0, -0.04, 0.9]} scale={[0.5, 0.36, 0.4]}>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshToonMaterial color={c.belly} />
        </mesh>
        <mesh position={[0, 0.0, 1.04]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshToonMaterial color={OUTLINE} />
        </mesh>
        {/* 腮红 */}
        <mesh position={[-0.5, -0.05, 0.74]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.5, -0.05, 0.74]} scale={[1, 0.7, 0.5]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.7} />
        </mesh>

        {/* 眼睛 */}
        <Eye x={-0.34} groupRef={leftEye} pupilRef={leftPupil} />
        <Eye x={0.34} groupRef={rightEye} pupilRef={rightPupil} />

        {/* species 特征 */}
        {species === "fox" && (
          <>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.5, 0.85, 0.05]} rotation={[0, 0, -s * 0.25]}>
                <mesh>
                  <coneGeometry args={[0.22, 0.55, 20]} />
                  <meshToonMaterial color={c.body} />
                  <Outlines thickness={0.02} color={OUTLINE} />
                </mesh>
                <mesh position={[0, -0.02, 0.06]} scale={[0.6, 0.7, 0.6]}>
                  <coneGeometry args={[0.22, 0.55, 20]} />
                  <meshToonMaterial color={c.inner} />
                </mesh>
              </group>
            ))}
          </>
        )}
        {species === "dragon" && (
          <>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.28, 0.98, 0.1]} rotation={[0, 0, -s * 0.3]}>
                <coneGeometry args={[0.11, 0.36, 16]} />
                <meshToonMaterial color={c.accent} />
                <Outlines thickness={0.02} color={OUTLINE} />
              </mesh>
            ))}
            <mesh position={[0, 0.62, 0]} rotation={[0.2, 0, 0]} scale={[1, 0.5, 0.5]}>
              <coneGeometry args={[0.12, 0.5, 4]} />
              <meshToonMaterial color={c.inner} />
            </mesh>
          </>
        )}
        {species === "owl" && (
          <>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.5, 0.92, 0.1]} rotation={[0, 0, -s * 0.15]}>
                <coneGeometry args={[0.18, 0.4, 4]} />
                <meshToonMaterial color={c.body} />
                <Outlines thickness={0.02} color={OUTLINE} />
              </mesh>
            ))}
            <mesh position={[0, 0.04, 1.0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.12, 0.26, 4]} />
              <meshToonMaterial color={c.accent} />
            </mesh>
          </>
        )}
      </group>

      {/* 小手(身体两侧) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.96, -0.35, 0.35]} scale={[0.7, 1, 0.7]}>
          <sphereGeometry args={[0.22, 18, 18]} />
          <meshToonMaterial color={c.body} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
      ))}
      {/* 小脚 */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, -1.02, 0.42]} scale={[1, 0.7, 1.2]}>
          <sphereGeometry args={[0.27, 20, 20]} />
          <meshToonMaterial color={c.accent} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
      ))}
      {/* 尾巴(狐/龙) */}
      {(species === "fox" || species === "dragon") && (
        <mesh position={[0, -0.55, -1.0]} rotation={[0.7, 0, 0]}>
          <coneGeometry args={[0.3, 1.0, 18]} />
          <meshToonMaterial color={species === "fox" ? c.accent : c.body} />
          <Outlines thickness={0.02} color={OUTLINE} />
        </mesh>
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
        <hemisphereLight args={["#ffffff", "#cdd6e8", 1.0]} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} />
        <directionalLight position={[-4, 1, 2]} intensity={0.5} />
        <directionalLight position={[0, 2, -5]} intensity={0.6} color="#fff7ed" />
        <Creature species={species} reactRef={reactRef} reduce={reduce} />
        <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={6} blur={2.8} far={3.2} />
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          autoRotate={!reduce}
          autoRotateSpeed={0.8}
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
