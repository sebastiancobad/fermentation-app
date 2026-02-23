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
    <div className="min-h-screen bg-[#fafcfb] text-[#879186] font-sans selection:bg-[#E6F7ED]">
      {/* ─── Header Estilo Glassmorphism Corporativo ─── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E6F7ED] sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-[#E6F7ED] flex items-center justify-center text-[#2c3b33] font-extrabold text-sm shadow-inner border border-white">
              FB
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1a2620] tracking-tight leading-tight">
                Fermentación & Cinética Microbiana
              </h1>
              <p className="text-sm text-[#879186] font-medium mt-0.5">
                Dr. Sebastián Coba Daza · Ingeniería de Bioprocesos 2024
              </p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-[#E6F7ED]/50 text-[#879186] text-xs font-semibold tracking-wide border border-[#E6F7ED]">
            v1.0 · Herramienta Educativa
          </span>
        </div>

        {/* ─── Navigation Tabs Estilo "Píldora" ─── */}
        <nav className="max-w-7xl mx-auto px-6 pb-4 overflow-x-auto hide-scrollbar">
          <ul className="flex gap-2 min-w-max bg-[#E6F7ED]/30 p-1.5 rounded-full border border-[#E6F7ED]/50 w-fit">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-bold transition-all duration-300 rounded-full whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-white text-[#1a2620] shadow-sm ring-1 ring-[#E6F7ED]'
                      : 'bg-transparent text-[#879186] hover:text-[#2c3b33] hover:bg-[#E6F7ED]/60'
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

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E6F7ED]/80 p-6 sm:p-10">
          {COMPONENTS[activeTab]}
        </div>
      </main>

      {/* ─── Footer Minimalista ─── */}
      <footer className="border-t border-[#E6F7ED] bg-white mt-8 py-8 text-center">
        <p className="text-[#879186] text-sm">
          Aplicación educativa basada en el programa de{' '}
          <span className="text-[#2c3b33] font-bold">Ingeniería de Bioprocesos (2024)</span>
          {' '}· Dr. Sebastián Coba Daza ·{' '}
          <span className="text-[#879186] opacity-80">Uso exclusivamente académico</span>
        </p>
      </footer>
    </div>
  )
}
