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

// ─── COMPONENTES 3D (Fondo Interactivo) ───
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
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#E6F7ED" />
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

// ─── COMPONENTE PRINCIPAL (DASHBOARD) ───
export default function Dashboard() {
  return (
    <div className="relative min-h-[80vh] w-full">
      <Scene3D />
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 relative z-10 pt-4">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01, transition: { duration: 0.2 } }} className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 shadow-[0_8px_30px_rgba(135,145,134,0.1)] border border-white relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#E6F7ED]/60 rounded-full mix-blend-multiply filter blur-[80px] group-hover:bg-[#E6F7ED] transition-colors duration-1000"></div>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-6 flex items-center gap-4">
              <span className="w-8 h-px bg-[#879186]/30"></span> Módulo 1
            </motion.p>
            <h2 className="text-4xl md:text-6xl font-light text-[#1a1a1a] tracking-tighter leading-[1.1] mb-8">
              Ingeniería de <br />
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#1a1a1a] to-[#879186]">Fermentación.</span>
            </h2>
            <p className="text-[#879186] text-lg font-light leading-relaxed max-w-xl">
              La orquestación de nanofábricas microbianas a escala industrial. Transformamos sustratos orgánicos en metabolitos de alto valor añadido mediante un control cinético riguroso.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-4 flex flex-col gap-6">
            <motion.div whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(135,145,134,0.15)" }} className="flex-1 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white flex flex-col justify-center transition-all duration-300">
              <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">Mercado Global</p>
              <h3 className="text-6xl font-light text-[#1a1a1a] tracking-tighter">$390<span className="text-3xl text-[#879186]">B</span></h3>
              <div className="w-full h-px bg-gradient-to-r from-[#E6F7ED] to-transparent my-6"></div>
              <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">CAGR (2024-2030)</p>
              <h3 className="text-4xl font-light text-[#1a1a1a] tracking-tighter">8.3<span className="text-xl text-[#879186]">%</span></h3>
            </motion.div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white shadow-[0_8px_30px_rgba(135,145,134,0.05)]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-medium text-[#1a1a1a] tracking-tight">Agentes Catalíticos</h4>
              <ArrowRight size={18} className="text-[#879186]" />
            </div>
            <div className="space-y-6">
              {MICROORGANISMS.map((mo, i) => (
                <motion.div key={i} whileHover={{ x: 10 }} className="flex items-start gap-5 group cursor-default">
                  <div className="w-12 h-12 rounded-2xl bg-[#fafcfb] flex items-center justify-center text-xl border border-[#E6F7ED]/50 transition-colors duration-300 group-hover:bg-[#E6F7ED]/50 group-hover:border-[#E6F7ED]">
                    {mo.icon}
                  </div>
                  <div className="flex-1 border-b border-[#E6F7ED]/50 pb-4 group-last:border-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h5 className="font-medium text-[#1a1a1a] transition-colors">{mo.name}</h5>
                      <span className="text-xs font-mono text-[#879186]">{mo.time}</span>
                    </div>
                    <p className="text-xs text-[#879186] font-light">{mo.uses}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} className="md:col-span-7 bg-[#111312] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E6F7ED]/10 rounded-full mix-blend-overlay filter blur-[100px] pointer-events-none"></div>
            <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-10">Distribución Industrial</p>
            <div className="space-y-8 relative z-10">
              {APPLICATIONS.map((app, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-3">
                    <h5 className="text-white font-light tracking-wide">{app.sector}</h5>
                    <span className="text-white/60 font-mono text-sm">{app.pct}%</span>
                  </div>
                  <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${app.pct}%` }} transition={{ duration: 1.5, delay: 0.5 + (i * 0.2), ease: "easeOut" }} className="h-full bg-white relative shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── COMPONENTES EXPORTADOS PARA EVITAR ERRORES EN OTRAS PÁGINAS ───
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
