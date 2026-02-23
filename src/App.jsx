"use client";
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FlaskConical, Activity, Calculator, Beaker, BarChart2 } from 'lucide-react';

export default function BioprocesosApp() {
  const [activeTab, setActiveTab] = useState('teoria');
  
  // Estado para el modelo de Monod y Haldane
  const [muMax, setMuMax] = useState(0.8);
  const [ks, setKs] = useState(2.0);
  const [ki, setKi] = useState(15.0); // Constante de inhibición para Haldane
  const [showHaldane, setShowHaldane] = useState(true);

  // Estado para la calculadora con réplicas (Diseño Experimental)
  const [calcData, setCalcData] = useState({ 
    x0: 1, 
    t: 10, 
    s0: 20, 
    s: 5,
    rep1: 4.9,
    rep2: 5.1,
    rep3: 5.0
  });

  // Generador de datos para Monod vs Haldane
  const generateKineticsData = () => {
    const data = [];
    for(let s = 0; s <= 40; s += 1) {
      const monod = (muMax * s) / (ks + s);
      // Ecuación de Haldane: inhibición por exceso de sustrato
      const haldane = (muMax * s) / (ks + s + (s * s) / ki);
      data.push({ 
        Sustrato: s, 
        Monod: parseFloat(monod.toFixed(3)),
        Haldane: parseFloat(haldane.toFixed(3))
      });
    }
    return data;
  };

  const calcularEstadisticasYCinetica = () => {
    // Media de las réplicas
    const reps = [calcData.rep1, calcData.rep2, calcData.rep3];
    const meanX = reps.reduce((a, b) => a + b, 0) / reps.length;
    
    // Desviación Estándar (Muestral)
    const variance = reps.reduce((a, b) => a + Math.pow(b - meanX, 2), 0) / (reps.length - 1);
    const sdX = Math.sqrt(variance);

    // Cinética usando la media
    const mu = Math.log(meanX / calcData.x0) / calcData.t;
    const td = Math.LN2 / mu;
    const yxs = (meanX - calcData.x0) / (calcData.s0 - calcData.s);
    
    return { meanX, sdX, mu, td, yxs };
  };

  const results = calcularEstadisticasYCinetica();

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans text-slate-800 selection:bg-teal-200">
      {/* Header Estilo D2C (Limpio, degradado sutil) */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-teal-600 tracking-tight">
              Bioprocesos & Cinética
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Simulador Avanzado de Fermentación</p>
          </div>
          
          {/* Navegación tipo "Píldora" */}
          <nav className="flex bg-slate-100 p-1 rounded-full shadow-inner">
            {[
              { id: 'teoria', icon: FlaskConical, label: 'Fundamentos' },
              { id: 'monod', icon: Activity, label: 'Modelado' },
              { id: 'calculadora', icon: Calculator, label: 'Análisis de Datos' },
              { id: 'biorreactor', icon: Beaker, label: 'Escalado' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-900 shadow-sm' 
                    : 'text-slate-500 hover:text-blue-700 hover:bg-slate-200/50'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Contenido Principal con estilo Glassmorphism (Tarjetas blancas con sombra suave) */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-12 transition-all">
          
          {/* PESTAÑA: TEORÍA */}
          {activeTab === 'teoria' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-blue-950 mb-6">El Motor de la Biotecnología</h2>
                  <p className="text-slate-600 leading-relaxed mb-6 text-lg">
                    La fermentación industrial trasciende la mera definición bioquímica. Es el proceso de ingeniería donde microorganismos operan como nanofábricas para sintetizar metabolitos a gran escala.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['Fármacos', 'Biocombustibles', 'Enzimas Recombinantes', 'Alimentos'].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-bold border border-teal-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-10 -translate-y-10"></div>
                  <h3 className="text-xl font-bold text-blue-900 mb-6 relative z-10">Dinámica de Fases</h3>
                  <ul className="space-y-4 relative z-10">
                    <li className="flex gap-4 items-start"><span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">1</span><p className="text-slate-700"><strong className="text-blue-900">Lag:</strong> Adaptación metabólica e inducción enzimática.</p></li>
                    <li className="flex gap-4 items-start"><span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">2</span><p className="text-slate-700"><strong className="text-teal-900">Exponencial:</strong> Máxima síntesis de metabolitos primarios.</p></li>
                    <li className="flex gap-4 items-start"><span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">3</span><p className="text-slate-700"><strong className="text-orange-900">Estacionaria:</strong> Limitación de sustrato; metabolitos secundarios (ej. antibióticos).</p></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: MODELADO (MONOD Y HALDANE) */}
          {activeTab === 'monod' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-blue-950 mb-2">Cinética de Crecimiento</h2>
                  <p className="text-slate-500 text-lg">Comparativa de modelos: Saturación vs. Inhibición por Sustrato.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700">Mostrar Modelo Haldane</span>
                  <input type="checkbox" checked={showHaldane} onChange={(e) => setShowHaldane(e.target.checked)} className="w-5 h-5 accent-teal-600 rounded" />
                </label>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-slate-700">Tasa Máx (μ_max)</label>
                      <span className="text-sm text-blue-600 font-mono">{muMax} h⁻¹</span>
                    </div>
                    <input type="range" min="0.1" max="1.5" step="0.05" value={muMax} onChange={(e) => setMuMax(parseFloat(e.target.value))} className="w-full accent-blue-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-bold text-slate-700">Afinidad (Ks)</label>
                      <span className="text-sm text-teal-600 font-mono">{ks} g/L</span>
                    </div>
                    <input type="range" min="0.5" max="10.0" step="0.5" value={ks} onChange={(e) => setKs(parseFloat(e.target.value))} className="w-full accent-teal-600" />
                  </div>
                  {showHaldane && (
                    <div className="pt-4 border-t border-slate-200 animate-in fade-in">
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-bold text-slate-700">Inhibición (Ki)</label>
                        <span className="text-sm text-red-500 font-mono">{ki} g/L</span>
                      </div>
                      <input type="range" min="5" max="50" step="1" value={ki} onChange={(e) => setKi(parseFloat(e.target.value))} className="w-full accent-red-500" />
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Valores bajos de Ki indican alta toxicidad del sustrato a altas concentraciones.</p>
                    </div>
                  )}
                </div>
                
                <div className="lg:col-span-3 h-[400px] w-full bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateKineticsData()} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="Sustrato" label={{ value: 'Concentración de Sustrato (g/L)', position: 'bottom', offset: 0 }} stroke="#64748b" />
                      <YAxis label={{ value: 'Tasa Específica μ (h⁻¹)', angle: -90, position: 'insideLeft', offset: -10 }} stroke="#64748b" domain={[0, muMax + 0.2]} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="Monod" name="Modelo Monod" stroke="#0ea5e9" strokeWidth={4} dot={false} />
                      {showHaldane && (
                        <Line type="monotone" dataKey="Haldane" name="Modelo Haldane (Inhibición)" stroke="#f43f5e" strokeWidth={4} dot={false} strokeDasharray="5 5" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: ANÁLISIS DE DATOS Y CALCULADORA */}
          {activeTab === 'calculadora' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-blue-950 mb-2">Análisis de Datos Experimentales</h2>
                <p className="text-slate-500 text-lg">Ingresa las réplicas para evaluar la varianza y calcular parámetros integrados en fase exponencial.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4"><BarChart2 size={20} /> Entradas del Biorreactor</h3>
                    
                    <div className="grid grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Biomasa Inicial (X₀)</label>
                        <input type="number" step="0.1" value={calcData.x0} onChange={e => setCalcData({...calcData, x0: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiempo Exp. (t)</label>
                        <input type="number" value={calcData.t} onChange={e => setCalcData({...calcData, t: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sustrato Inic. (S₀)</label>
                        <input type="number" step="0.1" value={calcData.s0} onChange={e => setCalcData({...calcData, s0: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sustrato Final (S)</label>
                        <input type="number" step="0.1" value={calcData.s} onChange={e => setCalcData({...calcData, s: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700" />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-4">Réplicas Experimentales (Biomasa Final X)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <input type="number" step="0.1" value={calcData.rep1} onChange={e => setCalcData({...calcData, rep1: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700 text-center" placeholder="R1" />
                        <input type="number" step="0.1" value={calcData.rep2} onChange={e => setCalcData({...calcData, rep2: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700 text-center" placeholder="R2" />
                        <input type="number" step="0.1" value={calcData.rep3} onChange={e => setCalcData({...calcData, rep3: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono text-slate-700 text-center" placeholder="R3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel de Resultados */}
                <div className="bg-[#0f172a] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
                  
                  <h3 className="text-xl font-light text-slate-300 mb-8 border-b border-slate-700 pb-4">Reporte de Parámetros</h3>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Media Biomásica (X̄) ± DE</span>
                      <span className="text-xl font-mono text-white">{results.meanX.toFixed(2)} ± <span className="text-slate-400 text-lg">{results.sdX.toFixed(2)} g/L</span></span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Tasa de Crecimiento (μ)</span>
                      <span className="text-2xl font-mono text-teal-400">{results.mu.toFixed(4)} <span className="text-sm text-teal-600">h⁻¹</span></span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Tiempo de Duplicación (td)</span>
                      <span className="text-2xl font-mono text-blue-400">{results.td.toFixed(2)} <span className="text-sm text-blue-600">h</span></span>
                    </div>
                    <div className="flex justify-between items-baseline pt-4 border-t border-slate-800">
                      <span className="text-slate-400 font-bold">Rendimiento (Yx/s)</span>
                      <span className="text-3xl font-mono text-emerald-400">{results.yxs.toFixed(3)} <span className="text-sm text-emerald-600">g/g</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: ESCALADO */}
          {activeTab === 'biorreactor' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold text-blue-950 mb-4">Ingeniería de Biorreactores</h2>
                <p className="text-slate-600 text-lg">Del matraz de Erlenmeyer a la planta de 100,000L. La geometría y la dinámica de fluidos determinan la viabilidad comercial.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 font-bold">B</div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">Lote (Batch)</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">Sistema estático. Acumulación rápida de biomasa, pero sujeto a inhibición por sustrato inicial alto y tiempos muertos prolongados entre ciclos.</p>
                </div>
                
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl p-8 shadow-xl shadow-teal-500/20 text-white transform md:-translate-y-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 font-bold backdrop-blur-sm">FB</div>
                  <h3 className="font-bold text-xl mb-3 flex items-center gap-2">Fed-Batch <span className="px-2 py-1 bg-white/20 rounded text-[10px] uppercase tracking-wider">Estándar</span></h3>
                  <p className="text-teal-50 leading-relaxed text-sm">Alimentación programada de nutrientes. Evita la toxicidad por sustrato (Efecto Crabtree), extendiendo la fase exponencial para maximizar la densidad celular.</p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600 font-bold">C</div>
                  <h3 className="font-bold text-xl text-slate-800 mb-3">Continuo (Quimiostato)</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">Alimentación y purga simultáneas. Alcanza un estado estacionario ideal para la investigación cinética, limitado en la industria por alto riesgo de contaminación.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
