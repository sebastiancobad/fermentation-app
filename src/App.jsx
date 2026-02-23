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
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] selection:bg-[#E6F7ED] selection:text-[#1a1a1a]">
      {/* ─── Header Estilo D2C (Limpio, blanco puro, líneas finas) ─── */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#E6F7ED] sticky top-0 z-50">
        
        {/* Top Bar: Títulos y Logos */}
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-[#E6F7ED] flex items-center justify-center text-[#879186] font-light text-xl tracking-widest border border-[#879186]/20">
              IQ
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight text-[#1a1a1a] mb-1">
                Fermentación & Cinética Microbiana
              </h1>
              <p className="text-sm font-normal text-[#879186] tracking-wide">
                Dr. Sebastián Coba Daza <span className="mx-2 text-[#E6F7ED]">|</span> Ingeniería de Bioprocesos 2024
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#879186] tracking-widest uppercase px-4 py-2 border border-[#E6F7ED] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#E6F7ED] border border-[#879186]/30"></span>
            Plataforma Activa
          </div>
        </div>

        {/* Bottom Bar: Navegación Minimalista */}
        <nav className="max-w-7xl mx-auto px-6 overflow-x-auto hide-scrollbar">
          <ul className="flex gap-8 min-w-max border-t border-[#E6F7ED]/50 pt-2 pb-0">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm tracking-wide transition-all duration-300 border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-[#879186] text-[#1a1a1a] font-medium'
                      : 'border-transparent text-[#879186] hover:text-[#1a1a1a]'
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

      {/* ─── Main Content (Contenedor invisible para que resalten los componentes) ─── */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700">
        {COMPONENTS[activeTab]}
      </main>

      {/* ─── Footer Minimalista ─── */}
      <footer className="border-t border-[#E6F7ED] bg-white mt-12 py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[#879186] text-sm font-light tracking-wide">
            Programa de <span className="font-medium text-[#1a1a1a]">Ingeniería de Bioprocesos</span>
          </p>
          <p className="text-[#879186] text-xs mt-2 opacity-60">
            Uso exclusivamente académico · 2024
          </p>
        </div>
      </footer>
    </div>
  )
}
