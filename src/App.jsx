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
  { id: 'dashboard',    label: 'Introducción',      short: 'Intro'    },
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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* ─── Header ─── */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white font-bold text-sm">
              FB
            </div>
            <div>
              <h1 className="text-sm font-bold text-emerald-400 leading-tight">
                Fermentación & Cinética Microbiana
              </h1>
              <p className="text-xs text-slate-500">
                Dr. Sebastián Coba Daza · Ingeniería de Bioprocesos 2024
              </p>
            </div>
          </div>
          <span className="hidden sm:block text-xs text-slate-600 font-mono">
            v1.0 · Herramienta Educativa
          </span>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <nav className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <ul className="flex gap-0 min-w-max">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {COMPONENTS[activeTab]}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-12 py-6 text-center">
        <p className="text-slate-500 text-xs">
          Aplicación educativa basada en el programa de{' '}
          <span className="text-emerald-500 font-medium">Ingeniería de Bioprocesos (2024)</span>
          {' '}· Dr. Sebastián Coba Daza ·{' '}
          <span className="text-slate-600">Uso exclusivamente académico</span>
        </p>
      </footer>
    </div>
  )
}
