import { useState, Component } from 'react'

class TabErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">⚠</div>
          <div>
            <h2 className="text-lg font-semibold text-forest-900 mb-1">Error al cargar este módulo</h2>
            <p className="text-sm text-sage-500 mb-3 max-w-md">{this.state.error.message}</p>
            <button onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-forest-600 text-white text-sm rounded-lg hover:bg-forest-700 transition-colors">
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
import Dashboard from './components/Dashboard'
import GrowthCurve from './components/GrowthCurve'
import KineticCalculator from './components/KineticCalculator'
import MonodSimulator from './components/MonodSimulator'
import BioreactorModule from './components/BioreactorModule'
import CaseStudies from './components/CaseStudies'
import PracticalExercises from './components/PracticalExercises'
import References from './components/References'
import BatchSimulator from './components/BatchSimulator'
import FedBatchSimulator from './components/FedBatchSimulator'
import ContinuousSimulator from './components/ContinuousSimulator'
import PHControlSimulator from './components/PHControlSimulator'
import OxygenScalingSimulator from './components/OxygenScalingSimulator'
import IntegratedSimulator from './components/IntegratedSimulator'

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
    group: 'Simulaciones 3D',
    tabs: [
      { id: 'sim-integrated', label: 'Diseño Integrado',    short: 'Integrado' },
      { id: 'sim-batch',    label: 'Batch (Monod)',         short: 'Batch'   },
      { id: 'sim-fedbatch', label: 'Fed-Batch',             short: 'F-Batch' },
      { id: 'sim-cont',     label: 'Continuo',              short: 'Cont.'   },
      { id: 'sim-ph',       label: 'Control pH',            short: 'pH'      },
      { id: 'sim-o2',       label: 'O₂ + Escalado',         short: 'O₂/Esc.' },
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
  dashboard:    <Dashboard />,
  growth:       <GrowthCurve />,
  calculator:   <KineticCalculator />,
  monod:        <MonodSimulator />,
  bioreactor:   <BioreactorModule />,
  'sim-integrated': <IntegratedSimulator />,
  'sim-batch':    <BatchSimulator />,
  'sim-fedbatch': <FedBatchSimulator />,
  'sim-cont':     <ContinuousSimulator />,
  'sim-ph':       <PHControlSimulator />,
  'sim-o2':       <OxygenScalingSimulator />,
  cases:        <CaseStudies />,
  exercises:    <PracticalExercises />,
  references:   <References />,
}

const GROUP_COLORS = {
  'Simulaciones 3D': 'text-plum-600 border-plum-400',
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const currentIdx = ALL_TABS.findIndex(t => t.id === activeTab)
  const prevTab = currentIdx > 0 ? ALL_TABS[currentIdx - 1] : null
  const nextTab = currentIdx < ALL_TABS.length - 1 ? ALL_TABS[currentIdx + 1] : null
  const is3D = activeTab.startsWith('sim-')

  return (
    <div className="min-h-screen bg-warm-white text-forest-900">
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
          <div className="flex items-center gap-2">
            {is3D && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-plum-50 text-plum-600 border border-plum-200 rounded-full px-2 py-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-plum-500 animate-pulse" /> 3D
              </span>
            )}
            <span className="hidden sm:block text-xs text-sage-400">v3.0 · Simuladores 3D</span>
          </div>
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
                {/* Group label for 3D section */}
                {group.group === 'Simulaciones 3D' && (
                  <li className="flex items-center px-1" role="presentation">
                    <span className="text-xs font-semibold text-plum-400 px-1 whitespace-nowrap hidden lg:block">3D</span>
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
                          ? group.group === 'Simulaciones 3D'
                            ? 'border-plum-500 text-plum-600'
                            : 'border-forest-600 text-forest-700'
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
        <TabErrorBoundary key={activeTab}>{COMPONENTS[activeTab]}</TabErrorBoundary>

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
