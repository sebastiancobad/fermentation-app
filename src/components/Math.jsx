import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Render a LaTeX math expression using KaTeX.
 *
 * @param {string}  tex         – LaTeX source
 * @param {boolean} display     – true for display mode (centred block), false for inline
 * @param {string}  className   – extra CSS classes
 */
export default function Math({ tex, display = false, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: true,
      })
    } catch {
      return tex
    }
  }, [tex, display])

  if (display) {
    return (
      <div
        className={`formula-block ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <span
      className={`katex-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * A step-by-step derivation block with KaTeX formulas.
 * Each step = { label, tex, note? }
 */
export function Derivation({ steps, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, i) => (
        <div key={i} className="rounded-lg border border-sage-200 bg-warm-code p-4">
          <div className="text-xs font-semibold text-forest-600 mb-2">
            {step.label}
          </div>
          <Math tex={step.tex} display />
          {step.note && (
            <p className="text-xs text-sage-500 mt-2 leading-relaxed">
              {step.note}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
