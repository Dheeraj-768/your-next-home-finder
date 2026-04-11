import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useState } from "react";

function PanoramaSphere({ url }: { url: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      setTexture(tex);
    });
  }, [url]);

  if (!texture) return null;

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

export default function PanoramaViewer({ url }: { url: string }) {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <PanoramaSphere url={url} />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.3} />
      </Canvas>
    </div>
  );
}