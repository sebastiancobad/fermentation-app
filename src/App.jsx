import { useState } from 'react'
import Dashboard from './components/Dashboard'
import GrowthCurve from './components/GrowthCurve'
import KineticCalculator from './components/KineticCalculator'
import MonodSimulator from './components/MonodSimulator'
import BioreactorModule from './components/BioreactorModule'
import CaseStudies from './components/CaseStudies'
import PracticalExercises from './components/PracticalExercises'
import References from './components/References'

const TABS = [
  { id: 'dashboard',    label: 'Introducción',       short: 'Intro'    },
  { id: 'growth',       label: 'Curva de Crecimiento', short: 'Crecim.' },
  { id: 'calculator',   label: 'Calculadora Cinética', short: 'Calc.'  },
  { id: 'monod',        label: 'Modelo de Monod',    short: 'Monod'    },
  { id: 'bioreactor',   label: 'Biorreactores',      short: 'Reactor'  },
  { id: 'cases',        label: 'Casos Industriales', short: 'Casos'    },
  { id: 'exercises',    label: 'Ejercicios Resueltos', short: 'Ejerc.' },
  { id: 'references',   label: 'Bibliografía',       short: 'Refs.'    },
]

const COMPONENTS = {
  dashboard:  <Dashboard />,
  growth:     <GrowthCurve />,
  calculator: <KineticCalculator />,
  monod:      <MonodSimulator />,
  bioreactor: <BioreactorModule />,
  cases:      <CaseStudies />,
  exercises:  <PracticalExercises />,
  references: <References />,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#fafcfb] relative font-sans text-[#1a1a1a] selection:bg-[#E6F7ED] selection:text-[#1a1a1a]">
      
      {/* ─── CAPA DE PROFUNDIDAD (Fondo Técnico y Luces) ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Cuadrícula de puntos de ingeniería */}
        <div 
          className="absolute inset-0 opacity-[0.25]" 
          style={{ 
            backgroundImage: 'radial-gradient(#879186 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        ></div>
        
        {/* Esferas de luz ambiental difuminadas */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#E6F7ED] mix-blend-multiply filter blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#E6F7ED] mix-blend-multiply filter blur-[150px] opacity-50"></div>
      </div>

      {/* ─── CONTENIDO PRINCIPAL (Elevado sobre el fondo) ─── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header Glassmorphism */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_rgba(135,145,134,0.08)] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-[#E6F7ED]/50 flex items-center justify-center text-[#2c3b33] font-bold text-lg shadow-[inset_0_1px_4px_rgba(255,255,255,0.8),0_4px_10px_rgba(135,145,134,0.1)] border border-white">
                IQ
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a] mb-0.5 drop-shadow-sm">
                  Fermentación & Cinética Microbiana
                </h1>
                <p className="text-sm font-medium text-[#879186] tracking-wide">
                  Dr. Sebastián Coba Daza <span className="mx-2 text-[#E6F7ED]">|</span> Ingeniería de Bioprocesos
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#2c3b33] tracking-widest uppercase px-4 py-2 bg-white/50 border border-white rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#879186] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#879186]"></span>
              </span>
              Simulador Activo
            </div>
          </div>

          {/* Navegación Flotante */}
          <nav className="max-w-7xl mx-auto px-6 overflow-x-auto hide-scrollbar pb-4 pt-2">
            <ul className="flex gap-2 min-w-max">
              {TABS.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-xl whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'bg-white text-[#1a1a1a] shadow-[0_2px_15px_rgba(135,145,134,0.15)] ring-1 ring-white/50 transform scale-105'
                        : 'bg-transparent text-[#879186] hover:bg-white/40 hover:text-[#1a1a1a]'
                      }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Contenedor Dinámico */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(135,145,134,0.15)] border border-white p-6 sm:p-10 lg:p-14">
            {COMPONENTS[activeTab]}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-white/40 backdrop-blur-sm border-t border-white/60 py-8 text-center">
          <p className="text-[#879186] text-sm font-medium tracking-wide">
            Programa de <span className="text-[#1a1a1a] font-semibold">Ingeniería de Bioprocesos</span>
          </p>
          <p className="text-[#879186] text-xs mt-1.5 opacity-70">
            Uso exclusivamente académico · 2024
          </p>
        </footer>

      </div>
    </div>
  )
}
