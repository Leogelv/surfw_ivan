import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { Mesh } from 'three';
import dynamic from 'next/dynamic';

const CodeSphere = () => {
  const mesh1 = useRef<Mesh>(null);
  const mesh2 = useRef<Mesh>(null);
  
  return (
    <Float 
      speed={1.5} 
      rotationIntensity={1} 
      floatIntensity={1}
    >
      {/* Крутая тороидальная геометрия */}
      <mesh ref={mesh1} position={[0, 0, 0]} scale={2}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial 
          color="#8352FD" 
          roughness={0.3}
          metalness={0.8} 
          emissive="#310A90"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Дополнительная геометрия для крутости */}
      <mesh ref={mesh2} position={[0, -4, 0]} scale={1.5} rotation={[0, Math.PI/4, 0]}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial 
          color="#FF52FD" 
          roughness={0.1}
          metalness={0.9} 
          emissive="#FF10A0"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => {
  return (
    <div className="h-[70vh] w-full">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <CodeSphere />
          <Environment preset="city" />
          <OrbitControls 
            enableZoom={false} 
            autoRotate 
            autoRotateSpeed={1} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Экспортируем компонент как динамический, чтобы избежать ошибок SSR
export default dynamic(() => Promise.resolve(Scene), { ssr: false }); 