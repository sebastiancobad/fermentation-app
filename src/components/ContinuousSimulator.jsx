import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Solver ──────────────────────────────────────────────────────────────────
function monodMu(S, muMax, Ks) { return muMax * Math.max(0, S) / (Ks + Math.max(0, S)) }

function solveContinuous(p) {
  const dt = 0.1, steps = Math.ceil(p.tf / dt)
  const { D, S0, X0, muMax, Ks, Yxs } = p
  let y = [X0, S0], t = 0
  const out = [{ t: 0, X: X0, S: S0, mu: monodMu(S0, muMax, Ks), D }]
  for (let i = 1; i <= steps; i++) {
    const [X, S] = y
    const mu = monodMu(S, muMax, Ks)
    const dXdt = (mu - D) * X
    const dSdt = D * (S0 - S) - mu * X / Yxs
    y = [Math.max(0, X + dt * dXdt), Math.max(0, S + dt * dSdt)]
    t += dt
    if (i % 2 === 0) {
      const m = monodMu(y[1], muMax, Ks)
      out.push({ t: +t.toFixed(1), X: +y[0].toFixed(4), S: +y[1].toFixed(4), mu: +m.toFixed(4), D })
    }
  }
  return out
}

// Steady-state curve: D vs X_ss and S_ss (includes washout extension)
function steadyStateCurve(p) {
  const { muMax, Ks, Yxs, S0 } = p
  const pts = []
  for (let D = 0.01; D < muMax * 0.99; D += muMax / 80) {
    const Sss = Ks * D / (muMax - D)
    const Xss = Sss < S0 ? Yxs * (S0 - Sss) : 0
    pts.push({ D: +D.toFixed(3), Xss: +Math.max(0, Xss).toFixed(3), Sss: +Math.min(S0, Sss).toFixed(3) })
  }
  // Washout boundary + extension
  pts.push({ D: +muMax.toFixed(3), Xss: 0, Sss: +S0.toFixed(3) })
  pts.push({ D: +(muMax * 1.25).toFixed(3), Xss: 0, Sss: +S0.toFixed(3) })
  return pts
}

// ─── 3D Chemostat ────────────────────────────────────────────────────────────
function FlowParticles({ position, direction, active, color }) {
  const ref = useRef()
  const n = 12
  const baseY = position[1]
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i*3] = position[0]; a[i*3+1] = baseY + Math.random(); a[i*3+2] = position[2]
    }
    return a
  }, [])
  useFrame(() => {
    if (!active || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] += direction * 0.04
      const limit = direction > 0 ? baseY + 1.5 : baseY - 1.5
      if (direction > 0 && a[i*3+1] > limit) a[i*3+1] = baseY
      if (direction < 0 && a[i*3+1] < limit) a[i*3+1] = baseY
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color={color} size={0.07} transparent opacity={0.85} />
    </points>
  )
}

function Bubbles({ active }) {
  const ref = useRef()
  const n = 20
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i*3] = (Math.random()-.5)*1.5; a[i*3+1] = Math.random()*2.6-1.3; a[i*3+2] = (Math.random()-.5)*1.5 }
    return a
  }, [])
  useFrame(() => {
    if (!active || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] += 0.015
      if (a[i*3+1] > 1.3) { a[i*3+1] = -1.3; a[i*3] = (Math.random()-.5)*1.5; a[i*3+2] = (Math.random()-.5)*1.5 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="white" size={0.055} transparent opacity={0.7} />
    </points>
  )
}

function Impeller({ active }) {
  const ref = useRef()
  useFrame(() => { if (ref.current) ref.current.rotation.y += active ? 0.1 : 0.03 })
  return (
    <group ref={ref}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 2.8, 8]} /><meshStandardMaterial color="#666" /></mesh>
      {[0,60,120,180,240,300].map(d => (
        <mesh key={d} rotation={[0, d*Math.PI/180, 0]} position={[0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.18]} /><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function ChemostatReactor({ biomassRatio, active, isWashout }) {
  const liquidColor = useMemo(() => {
    if (isWashout) return new THREE.Color('#ef4444')
    const c = new THREE.Color()
    c.setHSL(0.28 - biomassRatio * 0.05, 0.65, 0.82 - biomassRatio * 0.45)
    return c
  }, [biomassRatio, isWashout])

  return (
    <group>
      <mesh><cylinderGeometry args={[1, 1, 3, 48, 1, true]} /><meshPhongMaterial color="#d4eaff" transparent opacity={0.18} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.5, 0]}><torusGeometry args={[1, 0.03, 8, 48]} /><meshStandardMaterial color="#aaa" metalness={0.7} /></mesh>
      <mesh position={[0, -1.5, 0]}><circleGeometry args={[1, 48]} /><meshPhongMaterial color="#b8d4cc" transparent opacity={0.4} /></mesh>
      {/* Liquid - fixed level */}
      <mesh><cylinderGeometry args={[0.94, 0.94, 2.8, 48]} /><meshPhongMaterial color={liquidColor} transparent opacity={0.72} /></mesh>
      {/* Inlet pipe (top left) */}
      <mesh position={[-0.5, 2.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.9, 8]} /><meshStandardMaterial color="#4ade80" metalness={0.6} /></mesh>
      {/* Outlet pipe (bottom right) */}
      <mesh position={[0.5, -2.2, 0]}><cylinderGeometry args={[0.04, 0.04, 0.9, 8]} /><meshStandardMaterial color={isWashout ? '#ef4444' : '#2D6A4F'} metalness={0.6} /></mesh>
      {/* Flow particles */}
      <FlowParticles position={[-0.5, 1.8, 0]} direction={-1} active={active} color="#86efac" />
      <FlowParticles position={[0.5, -1.8, 0]} direction={-1} active={active} color={isWashout ? '#f87171' : '#4ade80'} />
      <Impeller active={active} />
      <Bubbles active={active} />
    </group>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, unit, value, min, max, step, onChange, color = '#2D6A4F', mark }) {
  const pct = (value - min) / (max - min) * 100
  const markPct = mark ? (mark - min) / (max - min) * 100 : null
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-sage-500">{label}</label>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(+e.target.value)} className="w-full" style={{ accentColor: color }} />
        {markPct !== null && (
          <div className="absolute top-0 h-full pointer-events-none" style={{ left: `${markPct}%` }}>
            <div className="w-0.5 h-4 bg-red-400 mt-0.5" title={`D_crit = µmax = ${mark}`} />
          </div>
        )}
      </div>
      {mark && <div className="text-xs text-red-400 mt-0.5">D_crit = µmax = {mark} h⁻¹</div>}
    </div>
  )
}

const SPEED_OPTIONS = [1, 5, 10, 50]

export default function ContinuousSimulator() {
  const [params, setParams] = useState({ D: 0.2, S0: 20, X0: 0.1, muMax: 0.5, Ks: 0.1, Yxs: 0.5, tf: 48 })
  const [speed, setSpeed] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [tIdx, setTIdx] = useState(0)

  const set = k => v => { setParams(p => ({ ...p, [k]: v })); reset() }
  const trajectory = useMemo(() => solveContinuous(params), [params])
  const ssCurve = useMemo(() => steadyStateCurve(params), [params])
  const current = trajectory[Math.min(tIdx, trajectory.length - 1)] || trajectory[0]
  const isWashout = params.D >= params.muMax * 0.95
  const Sss = params.Ks * params.D / (params.muMax - params.D)
  const Xss = Sss < params.S0 && !isWashout ? params.Yxs * (params.S0 - Sss) : 0
  const chartData = trajectory.slice(0, tIdx + 1)
  const maxX = useMemo(() => Math.max(...trajectory.map(d => d.X), 0.01), [trajectory])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTIdx(i => { if (i >= trajectory.length - 1) { setPlaying(false); return i }; return i + speed })
    }, 100)
    return () => clearInterval(id)
  }, [playing, speed, trajectory.length])

  const reset = useCallback(() => { setPlaying(false); setTIdx(0) }, [])

  return (
    <div className="space-y-6">
      <SectionHeader tag="SIMULADOR 3 · PROCESO CONTINUO" title="Quimiostato — Tasa de Dilución y Washout"
        sub="Sistema en estado estacionario con entrada y salida continuas. Analiza la condición de washout cuando D > µmax." />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* 3D */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 overflow-hidden">
          <div className="p-3 border-b border-sage-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-forest-700">Quimiostato 3D</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isWashout ? 'bg-red-100 text-red-600' : 'bg-green-100 text-forest-600'}`}>
              {isWashout ? '⚠ WASHOUT' : '✓ Viable'}
            </span>
          </div>
          <div className="h-72 lg:h-[360px]">
            <Canvas camera={{ position: [3, 1.5, 3.5], fov: 45 }} gl={{ antialias: true }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} />
              <pointLight position={[-3, 3, -3]} intensity={0.4} color="#c7e8ff" />
              <ChemostatReactor biomassRatio={current ? current.X / maxX : 0} active={playing} isWashout={isWashout} />
              <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} />
            </Canvas>
          </div>
          <div className="grid grid-cols-3 divide-x divide-sage-100 border-t border-sage-100 text-center">
            {[
              { label: 'X_ss', val: isWashout ? '→ 0' : Xss.toFixed(2), unit: 'g/L', color: '#2D6A4F' },
              { label: 'S_ss', val: isWashout ? params.S0.toFixed(1) : Sss.toFixed(2), unit: 'g/L', color: '#D4A017' },
              { label: 'D', val: params.D.toFixed(2), unit: 'h⁻¹', color: '#1B4965' },
            ].map(s => (
              <div key={s.label} className="py-2 px-1">
                <div className="text-xs text-sage-400">{s.label}</div>
                <div className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-sage-400">{s.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls + Charts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-sage-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-forest-900">Parámetros del Quimiostato</h3>
              <div className="flex gap-1">
                {SPEED_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${speed === s ? 'bg-forest-600 text-white' : 'bg-sage-100 text-sage-500'}`}>{s}x</button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Slider label="D (Tasa de dilución)" unit="h⁻¹" min={0.01} max={params.muMax * 1.1} step={0.01}
                value={params.D} onChange={set('D')} color={isWashout ? '#ef4444' : '#1B4965'} mark={params.muMax} />
              <Slider label="µmax" unit="h⁻¹" min={0.1} max={1.5} step={0.05} value={params.muMax} onChange={set('muMax')} color="#2D6A4F" />
              <Slider label="Ks" unit="g/L" min={0.01} max={1} step={0.01} value={params.Ks} onChange={set('Ks')} color="#D4A017" />
              <Slider label="S₀" unit="g/L" min={1} max={50} step={1} value={params.S0} onChange={set('S0')} color="#D4A017" />
              <Slider label="YX/S" unit="g/g" min={0.3} max={0.7} step={0.05} value={params.Yxs} onChange={set('Yxs')} color="#7B2D8E" />
              <Slider label="Tiempo simulación" unit="h" min={10} max={100} step={2} value={params.tf} onChange={set('tf')} color="#1B4965" />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-sage-100">
              <button onClick={() => { if (tIdx >= trajectory.length-1) reset(); setPlaying(p=>!p) }}
                className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors">
                {playing ? '⏸ Pausar' : '▶ Transitorio'}
              </button>
              <button onClick={reset} className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600">↺</button>
              <button onClick={() => { setParams(p => ({ ...p, D: Math.min(params.muMax * 1.05, 1.5) })); reset() }}
                className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium">
                ⚠ Washout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-sage-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-forest-900">Análisis del Quimiostato</h3>
            {/* Transient X */}
            <div>
              <div className="text-xs text-sage-400 mb-1">Transitorio: X(t) → X_ss</div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                  <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={Xss} stroke="#2D6A4F" strokeDasharray="4 4" label={{ value: 'X_ss', fontSize: 9, fill: '#2D6A4F' }} />
                  <Line type="monotone" dataKey="X" stroke="#2D6A4F" strokeWidth={2} dot={false} isAnimationActive={false} name="X (g/L)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* D vs X_ss theory */}
            <div>
              <div className="text-xs mb-1 flex items-center gap-2">
                <span className="font-medium text-sage-600">Diagrama D vs X_ss / S_ss</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-500 font-medium">Zona roja = Washout (D &gt; µmax)</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={ssCurve} margin={{ top: 4, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                  {/* Washout zone shading */}
                  <ReferenceArea x1={params.muMax} x2={params.muMax * 1.25} fill="#ef4444" fillOpacity={0.12}
                    label={{ value: 'WASHOUT', position: 'insideTop', fontSize: 8, fill: '#ef4444' }} />
                  <XAxis dataKey="D" tick={{ fontSize: 9 }} stroke="#879186"
                    label={{ value: 'D (h⁻¹)', position: 'insideRight', offset: -5, fontSize: 9, fill: '#879186' }} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceLine x={params.muMax} stroke="#ef4444" strokeWidth={1.5}
                    label={{ value: 'D_crit', position: 'insideTopLeft', fontSize: 8, fill: '#ef4444' }} />
                  <ReferenceLine x={params.D} stroke={isWashout ? '#ef4444' : '#1B4965'} strokeDasharray="3 3"
                    label={{ value: 'D actual', fontSize: 8, fill: isWashout ? '#ef4444' : '#1B4965' }} />
                  <Line type="monotone" dataKey="Xss" stroke="#2D6A4F" strokeWidth={2.5} dot={false} name="X_ss (g/L)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Sss" stroke="#D4A017" strokeWidth={2.5} dot={false} name="S_ss (g/L)" isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
