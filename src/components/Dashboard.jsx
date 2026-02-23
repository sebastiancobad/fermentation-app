import React, { useRef, useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

const MICROORGANISMS = [
  { name: 'Bacterias', uses: 'Yogur, ácido láctico', time: '20–60 min', icon: '🦠' },
  { name: 'Levaduras', uses: 'Etanol, insulina', time: '90–120 min', icon: '🍺' },
  { name: 'Hongos', uses: 'Penicilina, enzimas', time: '4–8 h', icon: '🧫' },
]

function BioSwarm({ count = 40 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({ x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 10 - 5, speed: 0.01 + Math.random() * 0.02, scale: 0.1 + Math.random() * 0.3, offset: Math.random() * 100 })
    }
    return temp
  }, [count])
  useFrame((state) => {
    particles.forEach((p, i) => {
      const t = state.clock.getElapsedTime()
      dummy.position.set(p.x + Math.sin(t * p.speed + p.offset) * 2, p.y + Math.cos(t * p.speed + p.offset) * 2, p.z)
      dummy.scale.set(p.scale, p.scale, p.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (<instancedMesh ref={mesh} args={[null, null, count]}><sphereGeometry args={[1, 32, 32]} /><meshStandardMaterial color="#E6F7ED" transparent opacity={0.6} /></instancedMesh>)
}

export default function Dashboard() {
  return (
    <div className="relative min-h-[60vh] w-full">
      <div className="absolute inset-0 -z-10 opacity-40">
        <Canvas camera={{ position: [0, 0, 10] }}><ambientLight intensity={0.8} /><BioSwarm count={50} /><Environment preset="city" /></Canvas>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 pt-4">
        <div className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl border border-white relative overflow-hidden">
          <h2 className="text-4xl md:text-6xl font-light text-[#1a1a1a] tracking-tighter leading-tight mb-8">Ingeniería de <br /><span className="font-semibold text-[#879186]">Fermentación.</span></h2>
          <p className="text-[#879186] text-lg font-light leading-relaxed max-w-xl">La orquestación de nanofábricas microbianas a escala industrial.</p>
        </div>
        <div className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white">
          <p className="text-[10px] font-bold text-[#879186] tracking-widest uppercase mb-2">Mercado Global</p>
          <h3 className="text-5xl font-light text-[#1a1a1a] tracking-tighter">$390B</h3>
        </div>
      </motion.div>
    </div>
  )
}

export function SectionHeader({ tag, title, sub }) {
  return (
    <div className="max-w-3xl mb-10">
      <div className="flex items-center gap-3 mb-2"><span className="w-8 h-px bg-[#879186]/30"></span><span className="text-[10px] font-bold text-[#879186] tracking-widest uppercase">{tag}</span></div>
      <h2 className="text-3xl font-light text-[#1a1a1a] mb-2 tracking-tight">{title}</h2>
      {sub && <p className="text-[#879186] text-sm font-light leading-relaxed">{sub}</p>}
    </div>
  )
}

export function Row({ label, val, highlight }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-[#E6F7ED]/50 last:border-0">
      <span className="text-[#879186] text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-right text-sm ${highlight ? 'font-mono font-bold text-[#1a1a1a]' : 'font-light text-[#1a1a1a]'}`}>{val}</span>
    </div>
  )
}
