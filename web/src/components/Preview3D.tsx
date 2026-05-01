import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface Preview3DProps {
  getCanvas: () => HTMLCanvasElement | null;
}

export default function Preview3D({ getCanvas }: Preview3DProps) {
  const [hasGlb, setHasGlb] = useState(false);

  useEffect(() => {
    fetch("/models/model3.glb", { method: "HEAD" })
      .then((r) => setHasGlb(r.ok))
      .catch(() => setHasGlb(false));
  }, []);

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#1a1d22] to-[#0b0d10]">
      <Canvas camera={{ position: [4, 2.4, 5.5], fov: 35 }} shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Environment preset="city" />
          {hasGlb ? (
            <WrappedGLB getCanvas={getCanvas} />
          ) : (
            <PlaceholderCar getCanvas={getCanvas} />
          )}
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.6}
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
          : "Placeholder body — drop a Model 3 GLB at assets/models/model3.glb for a real preview"}
      </div>
    </div>
  );
}

function useDesignTexture(getCanvas: () => HTMLCanvasElement | null) {
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(document.createElement("canvas"));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.flipY = true;
    return tex;
  }, []);

  useFrame(() => {
    const c = getCanvas();
    if (c && tex_image_changed(texture, c)) {
      texture.image = c;
      texture.needsUpdate = true;
    } else if (c) {
      texture.needsUpdate = true;
    }
  });

  return texture;
}

function tex_image_changed(tex: THREE.CanvasTexture, c: HTMLCanvasElement) {
  return tex.image !== c;
}

/**
 * Placeholder car — a stylized sedan made of merged primitives.
 * The wrap texture is applied across the body so users get a sense of
 * how their design reads on a curved surface, even without the real Tesla mesh.
 */
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
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]} material={bodyMat}>
        <boxGeometry args={[2.0, 0.55, 4.6, 8, 4, 16]} />
      </mesh>
      {/* Hood slope */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.65, 1.7]}
        rotation={[0.18, 0, 0]}
        material={bodyMat}
      >
        <boxGeometry args={[1.95, 0.1, 1.4]} />
      </mesh>
      {/* Trunk slope */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.7, -1.7]}
        rotation={[-0.12, 0, 0]}
        material={bodyMat}
      >
        <boxGeometry args={[1.95, 0.1, 1.3]} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow receiveShadow position={[0, 1.05, 0]} material={bodyMat}>
        <boxGeometry args={[1.85, 0.5, 2.6]} />
      </mesh>
      {/* Roof glass */}
      <mesh position={[0, 1.31, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 2.5]} />
      </mesh>
      {/* Front windshield */}
      <mesh position={[0, 1.16, 1.25]} rotation={[0.55, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 0.95]} />
      </mesh>
      {/* Rear windshield */}
      <mesh position={[0, 1.16, -1.25]} rotation={[-0.55, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.78, 0.02, 0.85]} />
      </mesh>
      {/* Side windows L */}
      <mesh position={[-0.93, 1.05, 0]} rotation={[0, 0, 0]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 2.4]} />
      </mesh>
      <mesh position={[0.93, 1.05, 0]} rotation={[0, 0, 0]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 2.4]} />
      </mesh>
      {/* Wheels */}
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

useGLTF.preload("/models/model3.glb");
