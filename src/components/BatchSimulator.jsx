import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── RK4 Solver ─────────────────────────────────────────────────────────────
function monodMu(S, muMax, Ks) { return muMax * S / (Ks + S) }

function rk4Step(t, y, dt, p) {
  const f = (t, y) => {
    const [X, S] = y
    const mu = monodMu(Math.max(0, S), p.muMax, p.Ks)
    return [mu * X, -(mu * X) / p.Yxs]
  }
  const k1 = f(t, y)
  const k2 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k1[i]))
  const k3 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k2[i]))
  const k4 = f(t + dt,     y.map((v, i) => v + dt       * k3[i]))
  return y.map((v, i) => Math.max(0, v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])))
}

function solveBatch(p) {
  const dt = 0.1, steps = Math.ceil(p.tf / dt)
  let y = [p.X0, p.S0], t = 0
  const out = [{ t: 0, X: p.X0, S: p.S0, mu: monodMu(p.S0, p.muMax, p.Ks) }]
  for (let i = 1; i <= steps; i++) {
    y = rk4Step(t, y, dt, p)
    t += dt
    if (i % 2 === 0)
      out.push({ t: +t.toFixed(1), X: +y[0].toFixed(4), S: +y[1].toFixed(4), mu: +monodMu(y[1], p.muMax, p.Ks).toFixed(4) })
  }
  return out
}

// ─── 3D Components ──────────────────────────────────────────────────────────
function Bubbles({ active }) {
  const ref = useRef()
  const n = 30
  const positions = useMemo(() => {
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 1.6
      arr[i * 3 + 1] = Math.random() * 2.4 - 1.2
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.6
    }
    return arr
  }, [])

  useFrame(() => {
    if (!active || !ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      arr[i * 3 + 1] += 0.018
      if (arr[i * 3 + 1] > 1.3) {
        arr[i * 3 + 1] = -1.2
        arr[i * 3]     = (Math.random() - 0.5) * 1.6
        arr[i * 3 + 2] = (Math.random() - 0.5) * 1.6
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={n} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.06} transparent opacity={0.75} />
    </points>
  )
}

function Impeller({ rpm, active }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += (active ? rpm : 20) / 60 * 0.08
  })
  return (
    <group ref={ref} position={[0, -0.3, 0]}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 3.0, 8]} /><meshStandardMaterial color="#666" /></mesh>
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <mesh key={deg} rotation={[0, deg * Math.PI / 180, 0]} position={[0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.18]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Reactor3D({ biomassRatio, active, rpm }) {
  const liquidColor = useMemo(() => {
    const c = new THREE.Color()
    c.setHSL(0.28 - biomassRatio * 0.05, 0.65, 0.82 - biomassRatio * 0.45)
    return c
  }, [biomassRatio])

  return (
    <group>
      {/* Outer glass walls */}
      <mesh>
        <cylinderGeometry args={[1, 1, 3, 48, 1, true]} />
        <meshPhongMaterial color="#d4eaff" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[1, 0.03, 8, 48]} />
        <meshStandardMaterial color="#aaa" metalness={0.7} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -1.5, 0]}>
        <circleGeometry args={[1, 48]} />
        <meshPhongMaterial color="#b8d4cc" transparent opacity={0.4} />
      </mesh>
      {/* Liquid */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.94, 0.94, 2.7, 48]} />
        <meshPhongMaterial color={liquidColor} transparent opacity={0.75} />
      </mesh>
      {/* Baffles */}
      {[0, 90, 180, 270].map(deg => (
        <mesh key={deg} rotation={[0, deg * Math.PI / 180, 0]} position={[0.92, 0, 0]}>
          <boxGeometry args={[0.05, 2.8, 0.1]} />
          <meshStandardMaterial color="#999" />
        </mesh>
      ))}
      <Impeller rpm={rpm} active={active} />
      <Bubbles active={active} />
      {/* pH sensor */}
      <mesh position={[0.6, 0.5, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
      </mesh>
      {/* pO2 sensor */}
      <mesh position={[-0.6, 0.3, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

// ─── Controls UI ─────────────────────────────────────────────────────────────
function Slider({ label, unit, value, min, max, step, onChange, color = '#2D6A4F', hint }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-sage-500 font-medium">{label}</label>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full" style={{ accentColor: color }} />
      {hint && <div className="text-xs text-sage-400 mt-0.5">{hint}</div>}
    </div>
  )
}

const SPEED_OPTIONS = [1, 5, 10, 50]
const COLORS = { X: '#2D6A4F', S: '#D4A017', mu: '#1B4965' }

const PRESETS = {
  typical:  { label: 'Caso típico',       muMax: 0.50, Ks: 0.10, Yxs: 0.50, S0: 20, X0: 0.10, tf: 48, desc: 'E. coli estándar' },
  fast:     { label: 'Alta productividad', muMax: 1.20, Ks: 0.05, Yxs: 0.60, S0: 40, X0: 0.50, tf: 24, desc: 'µmax alto, S₀ rico' },
  limited:  { label: 'Limitación S',      muMax: 0.30, Ks: 0.50, Yxs: 0.40, S0: 5,  X0: 0.05, tf: 80, desc: 'Sustrato limitante' },
}

// Detect phase boundaries from trajectory
function detectPhases(trajectory, muMax) {
  const thr = { exp: 0.5, stat: 0.1 }
  let expStart = 0, statStart = trajectory.length - 1, deathStart = trajectory.length - 1
  for (let i = 1; i < trajectory.length; i++) {
    if (trajectory[i].mu >= muMax * thr.exp && expStart === 0) expStart = i
    if (trajectory[i].mu < muMax * thr.stat && statStart === trajectory.length - 1) statStart = i
  }
  return {
    lag:  { t1: 0,                              t2: trajectory[expStart]?.t ?? 0 },
    exp:  { t1: trajectory[expStart]?.t ?? 0,   t2: trajectory[statStart]?.t ?? trajectory[trajectory.length-1]?.t },
    stat: { t1: trajectory[statStart]?.t ?? 0,  t2: trajectory[trajectory.length-1]?.t ?? 0 },
  }
}

export default function BatchSimulator() {
  const [params, setParams] = useState({ muMax: 0.5, Ks: 0.1, Yxs: 0.5, S0: 20, X0: 0.1, tf: 48 })
  const [speed, setSpeed] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [tIdx, setTIdx] = useState(0)

  const set = (key) => (v) => setParams(p => ({ ...p, [key]: v }))

  const trajectory = useMemo(() => solveBatch(params), [params])
  const current = trajectory[Math.min(tIdx, trajectory.length - 1)]
  const maxX = useMemo(() => Math.max(...trajectory.map(d => d.X)), [trajectory])
  const biomassRatio = current ? current.X / maxX : 0
  const chartData = trajectory.slice(0, tIdx + 1)
  const phases = useMemo(() => detectPhases(trajectory, params.muMax), [trajectory, params.muMax])

  const applyPreset = useCallback((key) => {
    const { label, desc, ...p } = PRESETS[key]
    reset()
    setParams(p)
  }, [reset])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTIdx(i => {
        if (i >= trajectory.length - 1) { setPlaying(false); return i }
        return i + speed
      })
    }, 100)
    return () => clearInterval(id)
  }, [playing, speed, trajectory.length])

  const reset = useCallback(() => { setPlaying(false); setTIdx(0) }, [])
  const exportCSV = () => {
    const rows = ['t,X,S,mu', ...trajectory.map(d => `${d.t},${d.X},${d.S},${d.mu}`)].join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(rows)
    a.download = 'batch_sim.csv'; a.click()
  }

  const rpm = playing ? 200 + biomassRatio * 100 : 60

  return (
    <div className="space-y-6">
      <SectionHeader tag="SIMULADOR 1 · PROCESO BATCH" title="Cinética Batch con Modelo de Monod"
        sub="Simulación de crecimiento microbiano en sistema cerrado. Resolver sistema de EDOs con Runge-Kutta 4." />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* ─── 3D Reactor ─── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 overflow-hidden">
          <div className="p-3 border-b border-sage-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-forest-700">Reactor 3D Interactivo</span>
            <div className="flex gap-2 text-xs text-sage-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> pH
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> pO₂
            </div>
          </div>
          <div className="h-72 lg:h-[420px]">
            <Canvas camera={{ position: [3, 2, 3], fov: 45 }} gl={{ antialias: true }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} />
              <pointLight position={[-3, 3, -3]} intensity={0.4} color="#c7e8ff" />
              <Reactor3D biomassRatio={biomassRatio} active={playing} rpm={rpm} />
              <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} />
            </Canvas>
          </div>
          {/* Live stats under reactor */}
          {current && (
            <div className="grid grid-cols-3 divide-x divide-sage-100 border-t border-sage-100 text-center">
              {[
                { label: 'X', val: current.X.toFixed(3), unit: 'g/L', color: COLORS.X },
                { label: 'S', val: current.S.toFixed(3), unit: 'g/L', color: COLORS.S },
                { label: 'µ', val: current.mu.toFixed(4), unit: 'h⁻¹', color: COLORS.mu },
              ].map(s => (
                <div key={s.label} className="py-2 px-1">
                  <div className="text-xs text-sage-400">{s.label}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs text-sage-400">{s.unit}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Controls + Charts ─── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-sage-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-forest-900">Parámetros del Proceso</h3>
              <div className="flex gap-1">
                {SPEED_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${speed === s ? 'bg-forest-600 text-white' : 'bg-sage-100 text-sage-500'}`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            {/* Preset scenarios */}
            <div className="flex gap-2 mb-3 pb-2 border-b border-sage-100">
              <span className="text-xs text-sage-400 self-center">Presets:</span>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  title={p.desc}
                  className="px-2 py-1 text-xs rounded-lg border border-sage-200 text-sage-600 hover:border-forest-400 hover:text-forest-700 transition-all">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Slider label="µmax" unit="h⁻¹" min={0.1} max={2.0} step={0.05} value={params.muMax} onChange={set('muMax')} color={COLORS.X} />
              <Slider label="Ks" unit="g/L" min={0.01} max={1.0} step={0.01} value={params.Ks} onChange={set('Ks')} color={COLORS.S} />
              <Slider label="YX/S" unit="g/g" min={0.3} max={0.7} step={0.05} value={params.Yxs} onChange={set('Yxs')} color="#7B2D8E" />
              <Slider label="S₀" unit="g/L" min={1} max={50} step={1} value={params.S0} onChange={set('S0')} color={COLORS.S} />
              <Slider label="X₀" unit="g/L" min={0.01} max={1} step={0.01} value={params.X0} onChange={set('X0')} color={COLORS.X} />
              <Slider label="Tiempo simulación" unit="h" min={10} max={100} step={2} value={params.tf} onChange={set('tf')} color={COLORS.mu} />
            </div>
            {/* Playback buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-sage-100">
              <button onClick={() => { if (tIdx >= trajectory.length - 1) reset(); setPlaying(p => !p) }}
                className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors">
                {playing ? '⏸ Pausar' : tIdx > 0 ? '▶ Continuar' : '▶ Iniciar'}
              </button>
              <button onClick={reset}
                className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600 hover:bg-sage-200 transition-colors">
                ↺
              </button>
              <button onClick={exportCSV}
                className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600 hover:bg-sage-200 transition-colors"
                title="Exportar CSV">
                ⬇ CSV
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-xl border border-sage-200 p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-forest-900">Evolución Temporal</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded" style={{ background: '#9ca3af22' }}>LAG</span>
                <span className="px-1.5 py-0.5 rounded" style={{ background: '#2D6A4F22', color: '#2D6A4F' }}>EXP</span>
                <span className="px-1.5 py-0.5 rounded" style={{ background: '#1B496522', color: '#1B4965' }}>STAT</span>
                <span className="text-sage-400">t = {current?.t ?? 0} h</span>
              </div>
            </div>
            {[
              { dataKey: 'X', name: 'Biomasa X (g/L)', color: COLORS.X, domain: ['auto', 'auto'] },
              { dataKey: 'S', name: 'Sustrato S (g/L)', color: COLORS.S, domain: [0, params.S0] },
              { dataKey: 'mu', name: 'µ (h⁻¹)', color: COLORS.mu, domain: [0, params.muMax] },
            ].map(ch => (
              <div key={ch.dataKey}>
                <div className="text-xs mb-1 font-medium" style={{ color: ch.color }}>{ch.name}</div>
                <ResponsiveContainer width="100%" height={85}>
                  <LineChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                    {/* Phase background zones */}
                    <ReferenceArea x1={phases.lag.t1}  x2={phases.lag.t2}  fill="#9ca3af" fillOpacity={0.12} />
                    <ReferenceArea x1={phases.exp.t1}  x2={phases.exp.t2}  fill="#2D6A4F" fillOpacity={0.08} />
                    <ReferenceArea x1={phases.stat.t1} x2={phases.stat.t2} fill="#1B4965" fillOpacity={0.08} />
                    <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" />
                    <YAxis domain={ch.domain} tick={{ fontSize: 9 }} stroke="#879186" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey={ch.dataKey} stroke={ch.color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equations */}
      <div className="bg-white rounded-xl border border-sage-200 p-4">
        <h3 className="font-serif font-bold text-forest-900 mb-3 text-sm">Modelo Matemático (Runge-Kutta 4°)</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { label: 'Biomasa', eq: 'dX/dt = µ · X', color: COLORS.X },
            { label: 'Sustrato', eq: 'dS/dt = -(µ · X) / Yx/s', color: COLORS.S },
            { label: 'Monod', eq: 'µ = µmax · S / (Ks + S)', color: COLORS.mu },
          ].map(e => (
            <div key={e.label} className="bg-warm-code rounded-lg p-3 border border-sage-200">
              <div className="text-sage-400 mb-1">{e.label}</div>
              <div className="font-bold" style={{ color: e.color }}>{e.eq}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
