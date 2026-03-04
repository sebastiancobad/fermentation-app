import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea, BarChart, Bar } from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── PID + pH Model ──────────────────────────────────────────────────────────
function phColor(pH) {
  if (pH < 6.5) return { hex: '#ef4444', three: new THREE.Color('#ef4444') }
  if (pH > 7.5) return { hex: '#3b82f6', three: new THREE.Color('#3b82f6') }
  return { hex: '#22c55e', three: new THREE.Color('#22c55e') }
}

function runPIDStep(state, params, dt) {
  const { pH, integral, prevErr, addBase, addAcid } = state
  const { Kp, Ki, Kd, setpoint, deadband } = params
  const err = setpoint - pH
  let u = 0, newInt = integral, newDose = addBase, newAcid = addAcid

  if (Math.abs(err) > deadband) {
    const newIntegral = integral + err * dt
    const derivative = (err - prevErr) / dt
    u = Kp * err + Ki * newIntegral + Kd * derivative
    newInt = newIntegral
    if (u > 0) newDose = addBase + 1
    if (u < 0) newAcid = addAcid + 1
  }

  // pH dynamics: first-order with control action
  const dpH = -0.15 * (pH - 7.0) + 0.4 * Math.tanh(u) + state.perturbation * 0.05
  const newPH = Math.max(2, Math.min(12, pH + dpH * dt))

  return {
    pH: newPH,
    integral: newInt,
    prevErr: err,
    u: +u.toFixed(4),
    perturbation: state.perturbation * Math.exp(-0.3 * dt),
    addBase: newDose,
    addAcid: newAcid,
  }
}

// ─── 3D Reactor ───────────────────────────────────────────────────────────────
function DosingParticles({ active, side, color, dosing }) {
  const ref = useRef()
  const n = 10
  const startX = side === 'acid' ? -1.4 : 1.4
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i*3] = startX; a[i*3+1] = 1.2 - i*0.2; a[i*3+2] = 0 }
    return a
  }, [startX])
  useFrame(() => {
    if (!active || !dosing || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    const dx = side === 'acid' ? 0.05 : -0.05
    for (let i = 0; i < n; i++) {
      a[i*3] += dx; a[i*3+1] -= 0.03
      const done = side === 'acid' ? a[i*3] > -0.5 : a[i*3] < 0.5
      if (done || a[i*3+1] < -0.5) { a[i*3] = startX; a[i*3+1] = 1.0 + Math.random()*0.4 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref} visible={dosing}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color={color} size={0.08} transparent opacity={0.9} />
    </points>
  )
}

function Bubbles({ active }) {
  const ref = useRef()
  const n = 20
  const pos = useMemo(() => {
    const a = new Float32Array(n*3)
    for(let i=0;i<n;i++){a[i*3]=(Math.random()-.5)*1.5;a[i*3+1]=Math.random()*2-1;a[i*3+2]=(Math.random()-.5)*1.5}
    return a
  }, [])
  useFrame(() => {
    if(!active||!ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for(let i=0;i<n;i++){
      a[i*3+1]+=0.015
      if(a[i*3+1]>1.3){a[i*3+1]=-1.2;a[i*3]=(Math.random()-.5)*1.5;a[i*3+2]=(Math.random()-.5)*1.5}
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="white" size={0.055} transparent opacity={0.65} />
    </points>
  )
}

function Impeller({ active }) {
  const ref = useRef()
  useFrame(() => { if(ref.current) ref.current.rotation.y += active ? 0.1 : 0.02 })
  return (
    <group ref={ref}>
      <mesh><cylinderGeometry args={[0.03,0.03,2.8,8]} /><meshStandardMaterial color="#666" /></mesh>
      {[0,60,120,180,240,300].map(d=>(
        <mesh key={d} rotation={[0,d*Math.PI/180,0]} position={[0.35,0,0]}>
          <boxGeometry args={[0.7,0.06,0.18]} /><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function PHReactor({ pH, active, dosingBase, dosingAcid }) {
  const liquidColor = useMemo(() => phColor(pH).three, [pH])
  const isDosBase = dosingBase
  const isDosAcid = dosingAcid

  return (
    <group>
      {/* Glass walls */}
      <mesh><cylinderGeometry args={[1,1,3,48,1,true]} /><meshPhongMaterial color="#d4eaff" transparent opacity={0.18} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0,1.5,0]}><torusGeometry args={[1,0.03,8,48]} /><meshStandardMaterial color="#aaa" metalness={0.7} /></mesh>
      <mesh position={[0,-1.5,0]}><circleGeometry args={[1,48]} /><meshPhongMaterial color="#b8d4cc" transparent opacity={0.4} /></mesh>
      {/* Liquid */}
      <mesh><cylinderGeometry args={[0.94,0.94,2.8,48]} /><meshPhongMaterial color={liquidColor} transparent opacity={0.72} /></mesh>
      {/* Acid bottle (left) */}
      <group position={[-2.2, 0.5, 0]}>
        <mesh position={[0,0.3,0]}><cylinderGeometry args={[0.25,0.25,0.8,16]} /><meshPhongMaterial color="#ef4444" transparent opacity={isDosAcid ? 0.9 : 0.4} /></mesh>
        <mesh position={[0,0.8,0]}><cylinderGeometry args={[0.08,0.08,0.3,8]} /><meshStandardMaterial color="#cc2222" /></mesh>
      </group>
      {/* Acid tube */}
      <mesh position={[-1.6,0.7,0]} rotation={[0,0,Math.PI/8]}><cylinderGeometry args={[0.025,0.025,1.2,8]} /><meshStandardMaterial color="#ef4444" transparent opacity={0.7} /></mesh>
      {/* Base bottle (right) */}
      <group position={[2.2, 0.5, 0]}>
        <mesh position={[0,0.3,0]}><cylinderGeometry args={[0.25,0.25,0.8,16]} /><meshPhongMaterial color="#3b82f6" transparent opacity={isDosBase ? 0.9 : 0.4} /></mesh>
        <mesh position={[0,0.8,0]}><cylinderGeometry args={[0.08,0.08,0.3,8]} /><meshStandardMaterial color="#1d4ed8" /></mesh>
      </group>
      {/* Base tube */}
      <mesh position={[1.6,0.7,0]} rotation={[0,0,-Math.PI/8]}><cylinderGeometry args={[0.025,0.025,1.2,8]} /><meshStandardMaterial color="#3b82f6" transparent opacity={0.7} /></mesh>
      {/* pH electrode */}
      <mesh position={[0.4,0.2,0]}><cylinderGeometry args={[0.04,0.04,0.7,8]} /><meshStandardMaterial color="#fff59d" /></mesh>
      {/* Dosing particles */}
      <DosingParticles active={active} side="acid" color="#ef4444" dosing={isDosAcid} />
      <DosingParticles active={active} side="base" color="#3b82f6" dosing={isDosBase} />
      <Impeller active={active} />
      <Bubbles active={active} />
    </group>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Slider({ label, unit, value, min, max, step, onChange, color = '#2D6A4F' }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-sage-500">{label}</label>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} className="w-full" style={{ accentColor: color }} />
    </div>
  )
}

const MAX_HISTORY = 300

export default function PHControlSimulator() {
  const [pidParams, setPidParams] = useState({ Kp: 3, Ki: 0.3, Kd: 0.0, setpoint: 7.0, deadband: 0.05 })
  const [simState, setSimState] = useState({ pH: 7.0, integral: 0, prevErr: 0, u: 0, perturbation: 0, addBase: 0, addAcid: 0 })
  const [history, setHistory] = useState([{ t: 0, pH: 7.0, u: 0, integral: 0 }])
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const set = k => v => setPidParams(p => ({ ...p, [k]: v }))

  const reset = useCallback(() => {
    setPlaying(false)
    setTime(0)
    setSimState({ pH: 7.0, integral: 0, prevErr: 0, u: 0, perturbation: 0, addBase: 0, addAcid: 0 })
    setHistory([{ t: 0, pH: 7.0, u: 0, integral: 0 }])
  }, [])

  const addPerturbation = (delta) => setSimState(s => ({ ...s, pH: Math.max(2, Math.min(12, s.pH + delta)), perturbation: delta * 3 }))

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const dt = 0.2
      setSimState(prev => {
        const next = runPIDStep(prev, pidParams, dt)
        setTime(t => {
          const newT = +(t + dt).toFixed(1)
          setHistory(h => {
            const entry = { t: newT, pH: +next.pH.toFixed(3), u: +next.u.toFixed(3), integral: +next.integral.toFixed(3) }
            return h.length >= MAX_HISTORY ? [...h.slice(1), entry] : [...h, entry]
          })
          return newT
        })
        return next
      })
    }, 80)
    return () => clearInterval(id)
  }, [playing, pidParams])

  const pColor = phColor(simState.pH)
  const isDosBase = simState.u > 0.05 && playing
  const isDosAcid = simState.u < -0.05 && playing

  return (
    <div className="space-y-6">
      <SectionHeader tag="SIMULADOR 4 · CONTROL PID DE pH" title="Control Automático de pH con Realimentación PID"
        sub="Sistema de dosificación automática de ácido/base. Ajusta los parámetros PID y observa la respuesta dinámica del reactor." />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* 3D */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 overflow-hidden">
          <div className="p-3 border-b border-sage-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-forest-700">Reactor con Control pH</span>
            <span className="text-3xl font-mono font-bold" style={{ color: pColor.hex }}>{simState.pH.toFixed(2)}</span>
          </div>
          <div className="h-72 lg:h-[340px]">
            <Canvas camera={{ position: [4, 1.5, 4], fov: 45 }} gl={{ antialias: true }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} />
              <pointLight position={[-3, 3, -3]} intensity={0.4} color="#c7e8ff" />
              <PHReactor pH={simState.pH} active={playing} dosingBase={isDosBase} dosingAcid={isDosAcid} />
              <OrbitControls enablePan={false} minDistance={3} maxDistance={9} />
            </Canvas>
          </div>
          {/* Dosing counts */}
          <div className="grid grid-cols-2 divide-x divide-sage-100 border-t border-sage-100 text-center">
            <div className="py-2"><div className="text-xs text-sage-400">Adiciones Base</div>
              <div className="font-mono text-lg font-bold text-blue-500">{simState.addBase}</div></div>
            <div className="py-2"><div className="text-xs text-sage-400">Adiciones Ácido</div>
              <div className="font-mono text-lg font-bold text-red-500">{simState.addAcid}</div></div>
          </div>
        </div>

        {/* Controls + Charts */}
        <div className="lg:col-span-3 space-y-4">
          {/* PID params */}
          <div className="bg-white rounded-xl border border-sage-200 p-4">
            <h3 className="text-sm font-semibold text-forest-900 mb-3">Parámetros PID</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Slider label="Kp (Proporcional)" unit="" min={0} max={10} step={0.1} value={pidParams.Kp} onChange={set('Kp')} color="#2D6A4F" />
              <Slider label="Ki (Integral)" unit="" min={0} max={2} step={0.05} value={pidParams.Ki} onChange={set('Ki')} color="#1B4965" />
              <Slider label="Kd (Derivativo)" unit="" min={0} max={2} step={0.1} value={pidParams.Kd} onChange={set('Kd')} color="#7B2D8E" />
              <Slider label="Setpoint pH" unit="" min={6.0} max={8.0} step={0.1} value={pidParams.setpoint} onChange={set('setpoint')} color="#D4A017" />
              <Slider label="Dead-band" unit="pH" min={0.01} max={0.3} step={0.01} value={pidParams.deadband} onChange={set('deadband')} color="#9ca3af" />
            </div>
            {/* Perturbation buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-sage-500 self-center">Perturbaciones:</span>
              <button onClick={() => addPerturbation(-0.5)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors">🔴 +Ácido (-0.5)</button>
              <button onClick={() => addPerturbation(0.5)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">🔵 +Base (+0.5)</button>
              <button onClick={() => addPerturbation((Math.random() > 0.5 ? 1 : -1) * 1.0)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">⚡ Fuerte (±1.0)</button>
            </div>
            <div className="flex gap-2 pt-3 border-t border-sage-100">
              <button onClick={() => setPlaying(p => !p)}
                className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors">
                {playing ? '⏸ Pausar' : '▶ Iniciar Control'}
              </button>
              <button onClick={reset} className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600">↺ Reset</button>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-xl border border-sage-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-forest-900">Respuesta del Sistema</h3>
            <div>
              <div className="text-xs text-sage-400 mb-1">pH vs Tiempo</div>
              <ResponsiveContainer width="100%" height={95}>
                <LineChart data={history} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                  <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" />
                  <YAxis domain={[4, 10]} tick={{ fontSize: 9 }} stroke="#879186" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceArea y1={pidParams.setpoint - pidParams.deadband} y2={pidParams.setpoint + pidParams.deadband} fill="#22c55e" fillOpacity={0.15} />
                  <ReferenceLine y={pidParams.setpoint} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'SP', fontSize: 9, fill: '#ef4444' }} />
                  <Line type="monotone" dataKey="pH" stroke={pColor.hex} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-xs text-sage-400 mb-1">Acción de control u(t) — Azul: base, Rojo: ácido</div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={history} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                  <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#ccc" />
                  <Bar dataKey="u" fill="#3b82f6" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
