import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ErrorBoundary from "./ErrorBoundary";

interface Preview3DProps {
  getCanvas: () => HTMLCanvasElement | null;
}

const TEXTURE_UPDATE_HZ = 4;

export default function Preview3D({ getCanvas }: Preview3DProps) {
  const [hasGlb, setHasGlb] = useState(false);
  const [envFailed, setEnvFailed] = useState(false);

  useEffect(() => {
    fetch("/models/model3.glb", { method: "HEAD" })
      .then((r) => setHasGlb(r.ok))
      .catch(() => setHasGlb(false));
  }, []);

  return (
    <ErrorBoundary label="Preview3D">
      <div className="relative h-full w-full bg-gradient-to-b from-[#1a1d22] to-[#0b0d10]">
        <Canvas camera={{ position: [4, 2.4, 5.5], fov: 35 }} shadows dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[5, 8, 4]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            {!envFailed && (
              <ErrorBoundary
                label="Environment"
                fallback={(_err, reset) => {
                  setEnvFailed(true);
                  reset();
                  return null;
                }}
              >
                <Environment preset="city" />
              </ErrorBoundary>
            )}
            {hasGlb ? (
              <WrappedGLB getCanvas={getCanvas} />
            ) : (
              <PlaceholderCar getCanvas={getCanvas} />
            )}
            <ContactShadows
              position={[0, -0.55, 0]}
              opacity={0.5}
              scale={10}
              blur={2}
              far={4}
            />
            <OrbitControls
              enableDamping
              minDistance={3}
              maxDistance={12}
              maxPolarAngle={Math.PI / 2 - 0.05}
            />
          </Suspense>
        </Canvas>
        <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-white/40">
          {hasGlb
            ? "Model 3 (GLB)"
            : "Placeholder body — drop a Model 3 GLB at web/public/models/model3.glb"}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Build one persistent CanvasTexture backed by a stable internal canvas, and
 * blit the designer's frame into it at most TEXTURE_UPDATE_HZ times per second.
 *
 * This used to call stage.toCanvas() and reassign texture.image every frame,
 * which hammered the GPU with full uploads and risked WebGL context loss.
 */
function useDesignTexture(getCanvas: () => HTMLCanvasElement | null) {
  const internal = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    return c;
  }, []);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(internal);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.flipY = true;
    return tex;
  }, [internal]);

  const lastUpdate = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 1000 / TEXTURE_UPDATE_HZ) return;
    lastUpdate.current = now;
    const src = getCanvas();
    if (!src || src.width === 0 || src.height === 0) return;
    const ctx = internal.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, internal.width, internal.height);
    ctx.drawImage(src, 0, 0, internal.width, internal.height);
    texture.needsUpdate = true;
  });

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return texture;
}

function PlaceholderCar({ getCanvas }: { getCanvas: () => HTMLCanvasElement | null }) {
  const texture = useDesignTexture(getCanvas);
  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.4,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
    [texture]
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0a0a0a",
        roughness: 0.05,
        metalness: 0,
        transmission: 0.3,
        clearcoat: 1,
      }),
    []
  );
  const tireMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0a0a0a", roughness: 0.9 }),
    []
  );
  const rimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.4, metalness: 0.8 }),
    []
  );

  return (
    <group position={[0, -0.55, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]} material={bodyMat}>
        <boxGeometry args={[2.0, 0.55, 4.6, 8, 4, 16]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.65, 1.7]}
        rotation={[0.18, 0, 0]}
        material={bodyMat}
      >
        <boxGeometry args={[1.95, 0.1, 1.4]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.7, -1.7]}
        rotation={[-0.12, 0, 0]}
        material={bodyMat}
      >
        <boxGeometry args={[1.95, 0.1, 1.3]} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]} material={bodyMat}>
        <boxGeometry args={[1.85, 0.5, 2.6]} />
      </mesh>
      <mesh position={[0, 1.31, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 2.5]} />
      </mesh>
      <mesh position={[0, 1.16, 1.25]} rotation={[0.55, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 0.95]} />
      </mesh>
      <mesh position={[0, 1.16, -1.25]} rotation={[-0.55, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 0.85]} />
      </mesh>
      <mesh position={[-0.93, 1.05, 0]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 2.4]} />
      </mesh>
      <mesh position={[0.93, 1.05, 0]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 2.4]} />
      </mesh>
      {[
        [-0.9, 0.05, 1.4],
        [0.9, 0.05, 1.4],
        [-0.9, 0.05, -1.4],
        [0.9, 0.05, -1.4],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow material={tireMat}>
            <cylinderGeometry args={[0.36, 0.36, 0.24, 32]} />
          </mesh>
          <mesh material={rimMat} position={[0, 0, 0]} scale={[1, 1.01, 1]}>
            <cylinderGeometry args={[0.22, 0.22, 0.25, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WrappedGLB({ getCanvas }: { getCanvas: () => HTMLCanvasElement | null }) {
  const { scene } = useGLTF("/models/model3.glb");
  const texture = useDesignTexture(getCanvas);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        const isBody = /body|paint|wrap|exterior|panel/.test(name);
        if (isBody) {
          const mat = new THREE.MeshPhysicalMaterial({
            map: texture,
            roughness: 0.35,
            metalness: 0.4,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
          });
          mesh.material = mat;
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, texture]);

  return <primitive ref={ref} object={scene} />;
}
