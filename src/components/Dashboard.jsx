import React, { useRef, useMemo } from 'react'
import { Activity, Beaker, Factory, Leaf, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

// ─── DATOS ───
const MICROORGANISMS = [
  { name: 'Bacterias', uses: 'Yogur, ácido láctico', time: '20–60 min', icon: '🦠' },
  { name: 'Levaduras', uses: 'Etanol, insulina', time: '90–120 min', icon: '🍺' },
  { name: 'Hongos', uses: 'Penicilina, enzimas', time: '4–8 h', icon: '🧫' },
]

const APPLICATIONS = [
  { sector: 'Alimentos & Bebidas', pct: 35, color: '#879186' },
  { sector: 'Farmacéutica', pct: 28, color: '#1a1a1a' },
  { sector: 'Biocombustibles', pct: 20, color: '#64748b' },
  { sector: 'Enzimas', pct: 17, color: '#cbd5e1' },
]

// ─── COMPONENTES 3D ───
function BioSwarm({ count = 40 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20
      const y = (Math.random() - 0.5) * 20
      const z = (Math.random() - 0.5) * 10 - 5
      const speed = 0.01 + Math.random() * 0.02
      const scale = 0.1 + Math.random() * 0.3
      temp.push({ x, y, z, speed, scale, offset: Math.random() * 100 })
    }
    return temp
  }, [count])

  useFrame((state) => {
    particles.forEach((particle, i) => {
      const time = state.clock.getElapsedTime()
      dummy.position.set(
        particle.x + Math.sin(time * particle.speed + particle.offset) * 2,
        particle.y + Math.cos(time * particle.speed + particle.offset) * 2,
        particle.z
      )
      dummy.scale.set(particle.scale, particle.scale, particle.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#E6F7ED" roughness={0.2} metalness={0.1} transparent opacity={0.6} />
    </instancedMesh>
  )
}

function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none opacity-50">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <BioSwarm count={60} />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}

// ─── ANIMACIONES ───
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8 } }
}

// ─── COMPONENTE DASHBOARD ───
export default function Dashboard() {
  return (
    <div className="relative min-h-[80vh] w-full">
      <Scene3D />
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 relative z-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 shadow-[0_8px_30px_rgba(135,145,134,0.1)] border border-white relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#E6F7ED]/60 rounded-full mix-blend-multiply filter blur-[80px] group-hover:bg-[#E6F7ED] transition-colors duration-1000"></div>
            <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-6 flex items-center gap-4">
              <span className="w-8 h-px bg-[#879186]/30"></span> Módulo 1
            </p>
            <h2 className="text-4xl md:text-6xl font-light text-[#1a1a1a] tracking-tighter leading-[1.1] mb-8">
              Ingeniería de <br />
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#1a1a1a] to-[#879186]">Fermentación.</span>
            </h2>
            <p className="text-[#879186] text-lg font-light leading-relaxed max-w-xl">
              La orquestación de nanofábricas microbianas a escala industrial. Transformamos sustratos orgánicos en metabolitos de alto valor añadido.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="md:col-span-4 flex flex-col gap-6">
            <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white flex flex-col justify-center">
              <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">Mercado Global</p>
              <h3 className="text-6xl font-light text-[#1a1a1a] tracking-tighter">$390<span className="text-3xl text-[#879186]">B</span></h3>
              <div className="w-full h-px bg-gradient-to-r from-[#E6F7ED] to-transparent my-6"></div>
              <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">CAGR</p>
              <h3 className="text-4xl font-light text-[#1a1a1a] tracking-tighter">8.3<span className="text-xl text-[#879186]">%</span></h3>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── EXPORTACIONES ÚNICAS (Sin duplicados) ───
export function SectionHeader({ tag, title, sub }) {
  return (
    <div className="max-w-3xl mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-px bg-[#879186]/30"></span>
        <span className="text-xs font-medium text-[#879186] tracking-widest uppercase">{tag}</span>
      </div>
      <h2 className="text-3xl font-light text-[#1a1a1a] mb-3 tracking-tight">{title}</h2>
      {sub && <p className="text-[#879186] text-base leading-relaxed font-light">{sub}</p>}
    </div>
  )
}

export function Row({ label, val, highlight }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-[#E6F7ED]/50 last:border-0">
      <span className="text-[#879186] text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-right text-sm ${highlight ? 'text-[#1a1a1a] font-mono font-medium' : 'text-[#1a1a1a] font-light'}`}>
        {val}
      </span>
    </div>
  )
}
