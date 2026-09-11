import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ══════════════════════════════════════════════════════════════════════════
   TALENT CORE — the hero's 3D object
   A glass "AI core" at the centre, wrapped in a slowly counter-rotating wire
   shell, with candidate nodes orbiting on three inclined rings and beams
   linking the strongest matches back to the core.

   It is a picture of what the product actually does — scoring and connecting
   people to a role — not an abstract blob. Everything is instanced or shares a
   material, so the whole scene is a handful of draw calls.
   ══════════════════════════════════════════════════════════════════════════ */

const VIOLET = new THREE.Color("#8b5cf6");
const CYAN = new THREE.Color("#22d3ee");
const FUCHSIA = new THREE.Color("#e879f9");

type Quality = "high" | "low";
type Tone = "light" | "dark";

interface NodeSpec {
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  yaw: number;
  scale: number;
  color: THREE.Color;
  linked: boolean;
}

function makeNodes(count: number): NodeSpec[] {
  // Deterministic pseudo-random so the composition is identical every load.
  let seed = 9;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, i) => {
    const ring = i % 3;
    const colour = ring === 0 ? VIOLET : ring === 1 ? CYAN : FUCHSIA;
    return {
      radius: 1.85 + ring * 0.52 + rand() * 0.22,
      speed: (0.16 + rand() * 0.12) * (ring === 1 ? -1 : 1),
      phase: rand() * Math.PI * 2,
      tilt: (ring - 1) * 0.42 + (rand() - 0.5) * 0.22,
      yaw: ring * 0.7,
      scale: 0.045 + rand() * 0.055,
      color: colour,
      // Roughly a fifth of candidates are "matched" and get a beam.
      linked: rand() > 0.82,
    };
  });
}

function nodePosition(n: NodeSpec, t: number, out: THREE.Vector3) {
  const a = n.phase + t * n.speed;
  out.set(Math.cos(a) * n.radius, Math.sin(a) * n.radius * 0.42, Math.sin(a) * n.radius);
  out.applyAxisAngle(AXIS_X, n.tilt);
  out.applyAxisAngle(AXIS_Y, n.yaw);
  return out;
}

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

/** Instanced orbiting candidate nodes. One draw call for all of them. */
function CandidateNodes({ specs }: { specs: NodeSpec[] }) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const vec = React.useMemo(() => new THREE.Vector3(), []);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    specs.forEach((n, i) => mesh.setColorAt(i, n.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [specs]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < specs.length; i++) {
      const n = specs[i];
      nodePosition(n, t, vec);
      dummy.position.copy(vec);
      // Matched nodes breathe slightly — draws the eye to the beams.
      const pulse = n.linked ? 1 + Math.sin(t * 2 + n.phase) * 0.18 : 1;
      dummy.scale.setScalar(n.scale * pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, specs.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Beams from the core out to matched candidates, redrawn each frame. */
function MatchBeams({ specs }: { specs: NodeSpec[] }) {
  const linked = React.useMemo(() => specs.filter((n) => n.linked), [specs]);
  const geomRef = React.useRef<THREE.BufferGeometry>(null);
  const vec = React.useMemo(() => new THREE.Vector3(), []);

  const positions = React.useMemo(() => new Float32Array(linked.length * 6), [linked.length]);

  useFrame(({ clock }) => {
    const geom = geomRef.current;
    if (!geom) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < linked.length; i++) {
      nodePosition(linked[i], t, vec);
      positions.set([0, 0, 0, vec.x, vec.y, vec.z], i * 6);
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#8b5cf6" transparent opacity={0.32} toneMapped={false} />
    </lineSegments>
  );
}

/** The glass core plus its counter-rotating wire shell. */
function Core({ quality, tone }: { quality: Quality; tone: Tone }) {
  const coreRef = React.useRef<THREE.Mesh>(null);
  const shellRef = React.useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.12;
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.07;
      shellRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.05, quality === "high" ? 4 : 2]} />
        {quality === "high" ? (
          <MeshTransmissionMaterial
            samples={4}
            resolution={256}
            thickness={1.1}
            roughness={0.08}
            anisotropy={0.4}
            chromaticAberration={0.28}
            distortion={0.32}
            distortionScale={0.28}
            temporalDistortion={0.1}
            ior={1.38}
            color={tone === "dark" ? "#d8d0ff" : "#ffffff"}
            attenuationColor={tone === "dark" ? "#8b5cf6" : "#c4b5fd"}
            attenuationDistance={2.2}
            // Transmission samples whatever is *behind* the mesh; on a
            // transparent canvas that is nothing, so the backdrop colour has to
            // be supplied explicitly or the core renders as a dark disc.
            background={new THREE.Color(tone === "dark" ? "#241b45" : "#f3f0ff")}
          />
        ) : (
          <meshStandardMaterial
            color={tone === "dark" ? "#a78bfa" : "#ddd6fe"}
            metalness={0.55}
            roughness={0.18}
            emissive={tone === "dark" ? "#4c1d95" : "#8b5cf6"}
            emissiveIntensity={tone === "dark" ? 0.45 : 0.25}
          />
        )}
      </mesh>

      <mesh ref={shellRef} scale={1.42}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial
          color="#8b5cf6"
          wireframe
          transparent
          opacity={tone === "dark" ? 0.2 : 0.28}
          toneMapped={false}
        />
      </mesh>

      {/* Soft halo so the core separates from a light page background */}
      <mesh scale={2.1}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={tone === "dark" ? "#7c3aed" : "#a78bfa"}
          transparent
          opacity={tone === "dark" ? 0.07 : 0.05}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Camera drifts toward the pointer — depth without a heavy orbit control. */
function PointerCamera({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const target = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, delta); // frame-rate independent damping
    camera.position.x += (target.current.x * 1.25 - camera.position.x) * k;
    camera.position.y += (-target.current.y * 0.85 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Scene({ quality, interactive, tone }: { quality: Quality; interactive: boolean; tone: Tone }) {
  const specs = React.useMemo(() => makeNodes(quality === "high" ? 96 : 48), [quality]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={28} color="#a78bfa" distance={18} />
      <pointLight position={[-4, -2, -3]} intensity={20} color="#22d3ee" distance={18} />

      <PointerCamera enabled={interactive} />

      <Float speed={interactive ? 1.1 : 0} rotationIntensity={0.22} floatIntensity={0.5}>
        <Core quality={quality} tone={tone} />
      </Float>

      <CandidateNodes specs={specs} />
      <MatchBeams specs={specs} />

      {/* Self-contained lighting environment — no HDR fetched over the network */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} color="#a78bfa" position={[3, 3, 3]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#22d3ee" position={[-4, -1, 2]} scale={[5, 5, 1]} />
        <Lightformer form="ring" intensity={1.4} color="#f0abfc" position={[0, 3, -4]} scale={[4, 4, 1]} />
      </Environment>
    </>
  );
}

export interface TalentCoreProps {
  className?: string;
  /** Freeze all motion (drives the reduced-motion path). */
  still?: boolean;
  /** Drop to the cheap material set — used on small screens. */
  quality?: Quality;
  /** Which page theme the scene sits on — drives the glass backdrop colour. */
  tone?: Tone;
}

/**
 * Canvas host. Rendering is paused whenever the canvas is off screen or the
 * tab is hidden, so the scene costs nothing once the user scrolls past it.
 */
export default function TalentCore({ className, still = false, quality = "high", tone = "light" }: TalentCoreProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const onVisibility = () => setActive(!document.hidden && !!el.getBoundingClientRect().height);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden>
      <Canvas
        frameloop={still ? "demand" : active ? "always" : "never"}
        dpr={[1, quality === "high" ? 1.75 : 1.35]}
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Scene quality={quality} interactive={!still} tone={tone} />
      </Canvas>
    </div>
  );
}
