import React from 'react'
import { Activity, Beaker, Factory, Leaf, ArrowRight } from 'lucide-react'

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

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* ─── BENTO GRID PRINCIPAL ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* HERO BLOCK (Span 8) - Rompe la simetría */}
        <div className="md:col-span-8 bg-gradient-to-br from-white to-[#fafcfb] rounded-[2rem] p-10 md:p-14 shadow-[0_4px_40px_-10px_rgba(135,145,134,0.08)] relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#E6F7ED] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 transition-transform duration-700 group-hover:scale-150"></div>
          
          <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-6 flex items-center gap-4">
            <span className="w-8 h-px bg-[#879186]/30"></span> Módulo 1
          </p>
          
          <h2 className="text-4xl md:text-6xl font-light text-[#1a1a1a] tracking-tighter leading-[1.1] mb-8 relative z-10">
            Ingeniería de <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#1a1a1a] to-[#879186]">
              Fermentación.
            </span>
          </h2>
          
          <p className="text-[#879186] text-lg font-light leading-relaxed max-w-xl relative z-10">
            No es solo biología; es la orquestación de nanofábricas microbianas a escala industrial. Transformamos sustratos orgánicos en metabolitos de alto valor añadido mediante un control cinético riguroso.
          </p>
        </div>

        {/* STATS BLOCK (Span 4) - Contraste tipográfico extremo */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-white rounded-[2rem] p-10 shadow-[0_4px_40px_-10px_rgba(135,145,134,0.08)] flex flex-col justify-center">
            <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">Mercado Global</p>
            <h3 className="text-6xl font-light text-[#1a1a1a] tracking-tighter">$390<span className="text-3xl text-[#879186]">B</span></h3>
            <div className="w-full h-px bg-gradient-to-r from-[#E6F7ED] to-transparent my-6"></div>
            <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-2">CAGR (2024-2030)</p>
            <h3 className="text-4xl font-light text-[#1a1a1a] tracking-tighter">8.3<span className="text-xl text-[#879186]">%</span></h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* MICROORGANISMOS (Span 5) */}
        <div className="md:col-span-5 bg-white rounded-[2rem] p-10 shadow-[0_4px_40px_-10px_rgba(135,145,134,0.08)]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-medium text-[#1a1a1a] tracking-tight">Agentes Catalíticos</h4>
            <ArrowRight size={18} className="text-[#879186]" />
          </div>
          
          <div className="space-y-6">
            {MICROORGANISMS.map((mo, i) => (
              <div key={i} className="flex items-start gap-5 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-[#fafcfb] flex items-center justify-center text-xl shadow-inner border border-[#E6F7ED]/50 transition-all duration-300 group-hover:bg-[#E6F7ED]/30">
                  {mo.icon}
                </div>
                <div className="flex-1 border-b border-[#E6F7ED]/30 pb-4 group-last:border-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h5 className="font-medium text-[#1a1a1a]">{mo.name}</h5>
                    <span className="text-xs font-mono text-[#879186]">{mo.time}</span>
                  </div>
                  <p className="text-xs text-[#879186] font-light">{mo.uses}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* APLICACIONES (Span 7) - Visualización de datos de alta gama */}
        <div className="md:col-span-7 bg-[#1a1a1a] rounded-[2rem] p-10 shadow-[0_10px_50px_-15px_rgba(26,26,26,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E6F7ED] mix-blend-overlay filter blur-[100px] opacity-10 pointer-events-none"></div>
          
          <p className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase mb-8 text-white/50">Distribución Industrial</p>
          
          <div className="space-y-8 relative z-10">
            {APPLICATIONS.map((app, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-3">
                  <h5 className="text-white font-light tracking-wide">{app.sector}</h5>
                  <span className="text-white/60 font-mono text-sm">{app.pct}%</span>
                </div>
                {/* Progress bar ultra premium (línea muy fina con brillo) */}
                <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white relative shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `${app.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── CONCEPTOS CLAVE (Layout de revista científica) ─── */}
      <div className="bg-white rounded-[2rem] p-10 md:p-14 shadow-[0_4px_40px_-10px_rgba(135,145,134,0.08)] mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="md:col-span-1">
            <h4 className="text-2xl font-light text-[#1a1a1a] tracking-tight mb-4">Dogma del Bioproceso</h4>
            <p className="text-[#879186] text-sm font-light leading-relaxed">
              La transición de la bioquímica teórica a la viabilidad económica comercial.
            </p>
          </div>

          <div className="md:col-span-3 grid sm:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <span className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase block mb-3">01. Fermentación Aeróbica</span>
              <p className="text-[#1a1a1a] text-sm font-light leading-relaxed">
                El <strong className="font-medium">O₂</strong> actúa como aceptor final de electrones. Maximiza la producción de ATP (~36 mol/mol glucosa). Indispensable para alta densidad de biomasa.
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase block mb-3">02. Fermentación Anaeróbica</span>
              <p className="text-[#1a1a1a] text-sm font-light leading-relaxed">
                Rendimiento energético ínfimo (~2 ATP), pero fuerza al microorganismo a secretar metabolitos masivamente (etanol, lactato) para mantener el balance redox.
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase block mb-3">03. Cinética Microbiana</span>
              <p className="text-[#1a1a1a] text-sm font-light leading-relaxed">
                Traducción matemática de la biología. Modela la velocidad de crecimiento (<span className="font-mono text-xs">μ</span>) y el consumo de sustrato en función de termodinámica estricta.
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#879186] tracking-[0.2em] uppercase block mb-3">04. Ecuación de Monod</span>
              <p className="text-[#1a1a1a] text-sm font-light leading-relaxed">
                La piedra angular empírica (1949). Relación hiperbólica entre el sustrato limitante y la tasa específica de crecimiento. Análogo a Michaelis-Menten.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
