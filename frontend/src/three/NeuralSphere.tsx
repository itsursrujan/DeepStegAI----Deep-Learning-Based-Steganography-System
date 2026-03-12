import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function NeuralSphere() {
  const pointsRef = useRef<THREE.Points>(null!)
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)
  
  const count = 4000
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const color = new THREE.Color('#00f2ff')
    
    for (let i = 0; i < count; i++) {
        const theta = 2 * Math.PI * Math.random()
        const phi = Math.acos(2 * Math.random() - 1)
        
        // Distribution for "Neural" feel: slightly layered
        const layer = Math.random() > 0.5 ? 4 : 4.5
        const r = layer + (Math.random() - 0.5) * 0.2
        
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        pos[i * 3 + 2] = r * Math.cos(phi)
        
        col[i * 3] = color.r
        col[i * 3 + 1] = color.g
        col[i * 3 + 2] = color.b
    }
    return [pos, col]
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.08
      pointsRef.current.rotation.x = t * 0.04
      const breath = 1 + Math.sin(t * 0.5) * 0.1 + Math.sin(t * 2) * 0.01
      pointsRef.current.scale.set(breath, breath, breath)
    }

    // Industrial Ring Rotations
    if (ring1Ref.current) {
        ring1Ref.current.rotation.z = t * 0.2
        ring1Ref.current.rotation.x = t * 0.1
    }
    if (ring2Ref.current) {
        ring2Ref.current.rotation.z = -t * 0.15
        ring2Ref.current.rotation.y = t * 0.25
    }
    if (ring3Ref.current) {
        ring3Ref.current.rotation.x = -t * 0.1
        ring3Ref.current.rotation.y = -t * 0.2
    }
  })

  return (
    <group>
      {/* Central Neural Points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.03} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation={true} />
      </points>
      
      {/* Industrial Outer Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[5.2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.15} />
      </mesh>
      
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.005, 16, 100]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, 0]}>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color="#00f2ff" wireframe transparent opacity={0.03} />
      </mesh>
      
      {/* Internal core glow */}
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.015} />
      </mesh>
    </group>
  )
}
