import { useState } from 'react'
import Dashboard from './components/Dashboard'
import GrowthCurve from './components/GrowthCurve'
import KineticCalculator from './components/KineticCalculator'
import MonodSimulator from './components/MonodSimulator'
import BioreactorModule from './components/BioreactorModule'
import CaseStudies from './components/CaseStudies'
import PracticalExercises from './components/PracticalExercises'
import References from './components/References'

const TAB_GROUPS = [
  {
    group: 'Fundamentos',
    tabs: [
      { id: 'dashboard', label: 'Introducción',         short: 'Intro'    },
      { id: 'growth',    label: 'Curva de Crecimiento',  short: 'Crecim.' },
      { id: 'monod',     label: 'Modelo de Monod',       short: 'Monod'   },
    ],
  },
  {
    group: 'Herramientas',
    tabs: [
      { id: 'calculator',  label: 'Calculadora Cinética', short: 'Calc.'   },
      { id: 'bioreactor',  label: 'Biorreactores',        short: 'Reactor' },
    ],
  },
  {
    group: 'Práctica',
    tabs: [
      { id: 'cases',     label: 'Casos Industriales',    short: 'Casos'   },
      { id: 'exercises', label: 'Ejercicios Resueltos',  short: 'Ejerc.'  },
    ],
  },
  {
    group: 'Referencia',
    tabs: [
      { id: 'references', label: 'Bibliografía', short: 'Refs.' },
    ],
  },
]

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs)

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

  // Sequential navigation
  const currentIdx = ALL_TABS.findIndex(t => t.id === activeTab)
  const prevTab = currentIdx > 0 ? ALL_TABS[currentIdx - 1] : null
  const nextTab = currentIdx < ALL_TABS.length - 1 ? ALL_TABS[currentIdx + 1] : null

  return (
    <div className="min-h-screen bg-warm-white text-forest-900">
      {/* ─── Skip to content (a11y) ─── */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-forest-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Saltar al contenido
      </a>

      {/* ─── Header ─── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sage-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-600 to-forest-700 flex items-center justify-center text-white font-bold text-sm">
              FB
            </div>
            <div>
              <h1 className="text-sm font-serif font-bold text-forest-700 leading-tight">
                Fermentación & Cinética Microbiana
              </h1>
              <p className="text-xs text-sage-400">
                Dr. Sebastián Coba Daza · Ingeniería de Bioprocesos 2024
              </p>
            </div>
          </div>
          <span className="hidden sm:block text-xs text-sage-400">
            v2.0 · Herramienta Educativa
          </span>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <nav className="max-w-7xl mx-auto px-4 overflow-x-auto" aria-label="Navegación principal">
          <ul className="flex gap-0 min-w-max" role="tablist">
            {TAB_GROUPS.map((group, gi) => (
              <li key={group.group} className="contents" role="presentation">
                {gi > 0 && (
                  <li className="flex items-center px-1" role="presentation">
                    <span className="w-px h-4 bg-sage-200" />
                  </li>
                )}
                {group.tabs.map(tab => (
                  <li key={tab.id} role="presentation">
                    <button
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-label={tab.label}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 border-b-2 whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'border-forest-600 text-forest-700'
                          : 'border-transparent text-sage-400 hover:text-forest-600 hover:border-sage-300'
                        }`}
                    >
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.short}</span>
                    </button>
                  </li>
                ))}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ─── Main Content ─── */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        {COMPONENTS[activeTab]}

        {/* ─── Sequential Navigation ─── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-sage-200">
          {prevTab ? (
            <button
              onClick={() => { setActiveTab(prevTab.id); window.scrollTo(0, 0) }}
              className="flex items-center gap-2 text-sm text-sage-500 hover:text-forest-600 transition-colors"
            >
              <span>←</span>
              <span>{prevTab.label}</span>
            </button>
          ) : <span />}
          {nextTab ? (
            <button
              onClick={() => { setActiveTab(nextTab.id); window.scrollTo(0, 0) }}
              className="flex items-center gap-2 text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors"
            >
              <span>{nextTab.label}</span>
              <span>→</span>
            </button>
          ) : <span />}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-sage-200 bg-white mt-12 py-6 text-center">
        <p className="text-sage-400 text-xs">
          Aplicación educativa basada en el programa de{' '}
          <span className="text-forest-600 font-medium">Ingeniería de Bioprocesos (2024)</span>
          {' '}· Dr. Sebastián Coba Daza ·{' '}
          <span className="text-sage-400">Uso exclusivamente académico</span>
        </p>
      </footer>
    </div>
  )
}
