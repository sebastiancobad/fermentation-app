import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Solver ──────────────────────────────────────────────────────────────────
function monodMu(S, muMax, Ks) { return muMax * Math.max(0, S) / (Ks + Math.max(0, S)) }

function feedRate(t, strategy, p) {
  const { F0, muSet, deltaTpulse } = p
  switch (strategy) {
    case 'exp':    return F0 * Math.exp(muSet * t)
    case 'linear': return F0 * (1 + t)
    case 'pulse':  return (t % deltaTpulse < 1) ? F0 * 5 : 0
    case 'pid': {
      // Simplified: F proportional to error between muSet and mu
      return Math.max(0, F0 + (muSet - p._lastMu) * 2)
    }
    default: return F0
  }
}

function solveFedBatch(p, strategy) {
  const dt = 0.1, steps = Math.ceil(p.tf / dt)
  let y = [p.X0, p.S0, p.V0], t = 0
  let lastMu = monodMu(p.S0, p.muMax, p.Ks)
  const out = [{
    t: 0, X: p.X0, S: p.S0, V: p.V0,
    F: feedRate(0, strategy, { ...p, _lastMu: lastMu }),
    Prod: p.X0 * p.V0,   // Productividad = X·V (g de biomasa total)
  }]
  for (let i = 1; i <= steps; i++) {
    const [X, S, V] = y
    const mu = monodMu(S, p.muMax, p.Ks)
    const pState = { ...p, _lastMu: mu }
    const F = feedRate(t, strategy, pState)
    lastMu = mu
    const dXdt = mu * X - (F / V) * X
    const dSdt = -mu * X / p.Yxs + F * p.Sfeed / V - (F / V) * S
    const dVdt = F
    y = [
      Math.max(0, X + dt * dXdt),
      Math.max(0, S + dt * dSdt),
      Math.max(p.V0 * 0.1, V + dt * dVdt),
    ]
    t += dt
    if (i % 2 === 0) {
      const newF = feedRate(t, strategy, { ...p, _lastMu: lastMu })
      out.push({
        t: +t.toFixed(1), X: +y[0].toFixed(3), S: +y[1].toFixed(3),
        V: +y[2].toFixed(3), F: +newF.toFixed(4),
        Prod: +(y[0] * y[2]).toFixed(3),   // g de biomasa total en el reactor
      })
    }
  }
  return out
}

// ─── 3D Components ───────────────────────────────────────────────────────────
function Bubbles({ active }) {
  const ref = useRef()
  const n = 25
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i*3] = (Math.random()-.5)*1.5; a[i*3+1] = Math.random()*2-1; a[i*3+2] = (Math.random()-.5)*1.5
    }
    return a
  }, [])
  useFrame(() => {
    if (!active || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] += 0.018
      if (a[i*3+1] > 1.3) { a[i*3+1] = -1; a[i*3] = (Math.random()-.5)*1.5; a[i*3+2] = (Math.random()-.5)*1.5 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="white" size={0.06} transparent opacity={0.7} />
    </points>
  )
}

function InletParticles({ active, F, feedColor }) {
  const ref = useRef()
  const n = 15
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i*3] = -0.3; a[i*3+1] = 1.5 + Math.random(); a[i*3+2] = 0 }
    return a
  }, [])
  useFrame(() => {
    if (!active || !ref.current || F < 0.001) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] -= 0.03 * Math.min(F * 10, 3)
      if (a[i*3+1] < 0.8) { a[i*3+1] = 1.5 + Math.random() * 0.5 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color={feedColor} size={0.08} transparent opacity={0.8} />
    </points>
  )
}

function Impeller({ active }) {
  const ref = useRef()
  useFrame(() => { if (ref.current) ref.current.rotation.y += (active ? 0.12 : 0.03) })
  return (
    <group ref={ref} position={[0, -0.4, 0]}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 2.8, 8]} /><meshStandardMaterial color="#666" /></mesh>
      {[0,60,120,180,240,300].map(d => (
        <mesh key={d} rotation={[0, d*Math.PI/180, 0]} position={[0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.18]} /><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function FedBatchReactor({ biomassRatio, liquidLevel, active, F }) {
  const liquidColor = useMemo(() => {
    const c = new THREE.Color()
    c.setHSL(0.28 - biomassRatio * 0.05, 0.65, 0.82 - biomassRatio * 0.45)
    return c
  }, [biomassRatio])
  const lvl = Math.min(1, Math.max(0.15, liquidLevel))
  const liquidH = lvl * 2.8
  const liquidY = -1.4 + liquidH / 2

  return (
    <group>
      {/* Glass walls */}
      <mesh>
        <cylinderGeometry args={[1, 1, 3, 48, 1, true]} />
        <meshPhongMaterial color="#d4eaff" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.5, 0]}><torusGeometry args={[1, 0.03, 8, 48]} /><meshStandardMaterial color="#aaa" metalness={0.7} /></mesh>
      <mesh position={[0, -1.5, 0]}><circleGeometry args={[1, 48]} /><meshPhongMaterial color="#b8d4cc" transparent opacity={0.4} /></mesh>
      {/* Liquid (rising) */}
      <mesh position={[0, liquidY, 0]}>
        <cylinderGeometry args={[0.94, 0.94, liquidH, 48]} />
        <meshPhongMaterial color={liquidColor} transparent opacity={0.75} />
      </mesh>
      {/* Inlet pipe */}
      <mesh position={[-0.3, 2.0, 0]} rotation={[0, 0, Math.PI/4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#888" metalness={0.6} />
      </mesh>
      <InletParticles active={active} F={F} feedColor="#fcd34d" />
      <Impeller active={active} />
      <Bubbles active={active} />
    </group>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const STRATEGY_INFO = {
  exp:    { label: 'Exponencial', desc: 'F(t) = F₀·e^(µset·t)', color: '#2D6A4F' },
  linear: { label: 'Lineal',      desc: 'F(t) = F₀·(1+t)',       color: '#1B4965' },
  pulse:  { label: 'Pulsos',      desc: 'F cada Δt horas',        color: '#7B2D8E' },
  pid:    { label: 'Control PID', desc: 'µ → µset (feedback)',    color: '#D4A017' },
}
const SPEED_OPTIONS = [1, 5, 10, 50]

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

export default function FedBatchSimulator() {
  const [params, setParams] = useState({ muMax: 0.4, Ks: 0.1, Yxs: 0.5, X0: 0.5, S0: 5, V0: 5, F0: 0.05, Sfeed: 400, muSet: 0.15, tf: 48, deltaTpulse: 4, _lastMu: 0 })
  const [strategy, setStrategy] = useState('exp')
  const [speed, setSpeed] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [tIdx, setTIdx] = useState(0)

  const set = k => v => setParams(p => ({ ...p, [k]: v }))
  const trajectory = useMemo(() => solveFedBatch({ ...params }, strategy), [params, strategy])
  const current = trajectory[Math.min(tIdx, trajectory.length - 1)] || trajectory[0]
  const maxV = useMemo(() => Math.max(...trajectory.map(d => d.V)), [trajectory])
  const maxX = useMemo(() => Math.max(...trajectory.map(d => d.X)), [trajectory])
  const chartData = trajectory.slice(0, tIdx + 1)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTIdx(i => { if (i >= trajectory.length - 1) { setPlaying(false); return i }; return i + speed })
    }, 100)
    return () => clearInterval(id)
  }, [playing, speed, trajectory.length])

  const reset = useCallback(() => { setPlaying(false); setTIdx(0) }, [])
  const exportCSV = () => {
    const rows = ['t,X,S,V,F,Prod', ...trajectory.map(d => `${d.t},${d.X},${d.S},${d.V},${d.F},${d.Prod}`)].join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(rows)
    a.download = 'fedbatch_sim.csv'; a.click()
  }

  const liquidLevel = current ? current.V / maxV : params.V0 / maxV
  const biomassRatio = current && maxX > 0 ? current.X / maxX : 0

  return (
    <div className="space-y-6">
      <SectionHeader tag="SIMULADOR 2 · PROCESO FED-BATCH" title="Alimentación Controlada con 4 Estrategias"
        sub="Sistema semi-abierto con entrada continua de sustrato. Volumen creciente y 4 estrategias de alimentación." />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* 3D */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 overflow-hidden">
          <div className="p-3 border-b border-sage-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-forest-700">Reactor Fed-Batch 3D</span>
            <span className="text-xs font-mono text-sage-400">V = {current?.V?.toFixed(2) ?? params.V0} L</span>
          </div>
          <div className="h-72 lg:h-[360px]">
            <Canvas camera={{ position: [3, 1.5, 3], fov: 45 }} gl={{ antialias: true }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} />
              <pointLight position={[-3, 3, -3]} intensity={0.4} color="#c7e8ff" />
              <FedBatchReactor biomassRatio={biomassRatio} liquidLevel={liquidLevel} active={playing} F={current?.F ?? 0} />
              <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} />
            </Canvas>
          </div>
          {current && (
            <div className="grid grid-cols-3 divide-x divide-sage-100 border-t border-sage-100 text-center">
              {[
                { label: 'X', val: current.X.toFixed(3), unit: 'g/L', color: '#2D6A4F' },
                { label: 'V', val: current.V.toFixed(2), unit: 'L', color: '#1B4965' },
                { label: 'F', val: current.F.toFixed(3), unit: 'L/h', color: '#D4A017' },
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

        {/* Controls + Charts */}
        <div className="lg:col-span-3 space-y-4">
          {/* Strategy selector */}
          <div className="bg-white rounded-xl border border-sage-200 p-4">
            <h3 className="text-sm font-semibold text-forest-900 mb-3">Estrategia de Alimentación</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {Object.entries(STRATEGY_INFO).map(([key, s]) => (
                <button key={key} onClick={() => { setStrategy(key); reset() }}
                  className={`p-2 rounded-lg border text-left transition-all ${strategy === key ? 'border-forest-600 bg-forest-50' : 'border-sage-200 hover:border-sage-300'}`}>
                  <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
                  <div className="text-xs text-sage-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Slider label="F₀" unit="L/h" min={0.01} max={0.5} step={0.01} value={params.F0} onChange={set('F0')} color="#D4A017" />
              <Slider label="S_feed" unit="g/L" min={100} max={500} step={10} value={params.Sfeed} onChange={set('Sfeed')} color="#D4A017" />
              <Slider label="µset (objetivo)" unit="h⁻¹" min={0.05} max={0.3} step={0.01} value={params.muSet} onChange={set('muSet')} color="#7B2D8E" />
              <Slider label="V₀" unit="L" min={1} max={10} step={0.5} value={params.V0} onChange={set('V0')} color="#1B4965" />
              <Slider label="X₀" unit="g/L" min={0.1} max={2} step={0.1} value={params.X0} onChange={set('X0')} color="#2D6A4F" />
              <Slider label="Tiempo" unit="h" min={10} max={100} step={2} value={params.tf} onChange={set('tf')} color="#1B4965" />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-sage-100">
              <div className="flex gap-1 mr-2">
                {SPEED_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${speed === s ? 'bg-forest-600 text-white' : 'bg-sage-100 text-sage-500'}`}>{s}x</button>
                ))}
              </div>
              <button onClick={() => { if (tIdx >= trajectory.length - 1) reset(); setPlaying(p => !p) }}
                className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors">
                {playing ? '⏸ Pausar' : '▶ Iniciar'}
              </button>
              <button onClick={reset} className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600">↺</button>
              <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg text-sm bg-sage-100 text-sage-600">⬇ CSV</button>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-xl border border-sage-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-forest-900">Evolución del Proceso</h3>
            {[
              { key1: 'X', name1: 'X (g/L)', c1: '#2D6A4F', key2: 'S', name2: 'S (g/L)', c2: '#D4A017', title: 'Biomasa & Sustrato' },
              { key1: 'V', name1: 'V (L)', c1: '#1B4965', key2: 'F', name2: 'F (L/h)', c2: '#ef4444', title: 'Volumen & Caudal de alimentación' },
            ].map(ch => (
              <div key={ch.title}>
                <div className="text-xs text-sage-400 mb-1 font-medium">{ch.title}</div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                    <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" label={{ value: 'h', position: 'insideRight', offset: -5, fontSize: 9, fill: '#879186' }} />
                    <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey={ch.key1} name={ch.name1} stroke={ch.c1} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey={ch.key2} name={ch.name2} stroke={ch.c2} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
            {/* Productivity chart */}
            <div>
              <div className="text-xs mb-1 font-medium" style={{ color: '#7B2D8E' }}>
                Productividad total — X·V (g biomasa en reactor)
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={chartData} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                  <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#879186" label={{ value: 'h', position: 'insideRight', offset: -5, fontSize: 9, fill: '#879186' }} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [`${v} g`, 'X·V']} />
                  <Line type="monotone" dataKey="Prod" name="X·V (g)" stroke="#7B2D8E" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
