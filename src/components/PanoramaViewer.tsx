import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

function PanoramaSphere({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="hsl(250, 75%, 58%)" wireframe />
    </mesh>
  );
}

export default function PanoramaViewer({ url }: { url: string }) {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-secondary">
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <Suspense fallback={<LoadingFallback />}>
          <PanoramaSphere url={url} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={-0.3}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      <div className="absolute bottom-3 left-3 px-3 py-1.5 glass rounded-lg text-xs font-medium text-foreground pointer-events-none">
        🔄 Drag to look around • 360° View
      </div>
    </div>
  );
}
