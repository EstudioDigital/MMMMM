import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { getRules, createRule, updateRule, deleteRule } from '../api/client.js'

const TRIGGER_TYPES = [
  { value: 'keyword',    label: 'Contiene palabra' },
  { value: 'startsWith', label: 'Empieza con'      },
  { value: 'exact',      label: 'Mensaje exacto'   },
  { value: 'always',     label: 'Siempre (fallback)' },
]

const INPUT    = 'w-full bg-sidebar border border-card-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors'
const BTN_PRIMARY = 'flex-1 px-4 py-2 text-sm text-white bg-accent rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50'
const BTN_GHOST   = 'flex-1 px-4 py-2 text-sm text-text-secondary border border-card-border rounded-md hover:bg-white/[0.04] transition-colors'

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-card-border'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

function RuleModal({ rule, onClose, onSave, isPending }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const triggerType = f.get('triggerType')
    onSave({
      trigger:  { type: triggerType, value: triggerType === 'always' ? '' : f.get('triggerValue') },
      response: { type: 'text', body: f.get('response') },
      priority: parseInt(f.get('priority'), 10) || 10,
      active:   true,
    })
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="font-semibold text-text-primary">{rule?.id ? 'Editar regla' : 'Nueva regla'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Tipo de trigger</label>
            <select name="triggerType" defaultValue={rule?.trigger?.type ?? 'keyword'} className={INPUT}>
              {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Palabra / frase</label>
            <input name="triggerValue" defaultValue={rule?.trigger?.value ?? ''} placeholder="Ej: hola, precio, turno..." className={INPUT} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Respuesta automática *</label>
            <textarea name="response" rows={3} required defaultValue={rule?.response?.body ?? ''}
              placeholder="Mensaje que enviará el bot cuando se active esta regla"
              className={`${INPUT} resize-none`} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Prioridad (menor = antes)</label>
            <input name="priority" type="number" defaultValue={rule?.priority ?? 10} className={INPUT} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Rules() {
  useEffect(() => { document.title = 'Reglas — MateBot' }, [])
  const account = useStore((s) => s.account)
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: rules = [] } = useQuery({
    queryKey: ['rules', account?.id],
    queryFn: () => getRules(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => modal?.id ? updateRule(account.id, modal.id, data) : createRule(account.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rules', account.id] }); setModal(null) },
  })

  const { mutate: remove } = useMutation({
    mutationFn: (rid) => deleteRule(account.id, rid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules', account.id] }),
  })

  const toggle = (rule) =>
    updateRule(account.id, rule.id, { active: !rule.active }).then(() =>
      qc.invalidateQueries({ queryKey: ['rules', account.id] }),
    )

  const movePriority = (rule, delta) =>
    updateRule(account.id, rule.id, { priority: rule.priority + delta }).then(() =>
      qc.invalidateQueries({ queryKey: ['rules', account.id] }),
    )

  if (!account) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Reglas automáticas</h2>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors">
          <Plus size={15} /> Nueva regla
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-card border border-card-border rounded-lg p-4 flex items-start gap-3">
            {/* Priority arrows */}
            <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0">
              <button onClick={() => movePriority(rule, -1)} className="text-text-secondary hover:text-text-primary p-0.5 rounded">
                <ArrowUp size={13} weight="bold" />
              </button>
              <span className="text-xs text-text-secondary tabular-nums w-5 text-center">{rule.priority}</span>
              <button onClick={() => movePriority(rule, 1)} className="text-text-secondary hover:text-text-primary p-0.5 rounded">
                <ArrowDown size={13} weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-card-border px-2 py-0.5 rounded text-text-secondary">
                  {TRIGGER_TYPES.find((t) => t.value === rule.trigger?.type)?.label ?? rule.trigger?.type}
                </span>
                {rule.trigger?.value && (
                  <span className="text-sm font-medium text-text-primary">"{rule.trigger.value}"</span>
                )}
              </div>
              <p className="text-sm text-text-secondary truncate">
                {rule.response?.body ?? JSON.stringify(rule.response)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Toggle checked={rule.active} onChange={() => toggle(rule)} />
              <button onClick={() => setModal(rule)} className="p-1.5 text-text-secondary hover:text-text-primary rounded">
                <PencilSimple size={13} />
              </button>
              <button onClick={() => remove(rule.id)} className="p-1.5 text-text-secondary hover:text-red-400 rounded">
                <Trash size={13} />
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="bg-card border border-card-border rounded-lg p-10 text-center text-sm text-text-secondary">
            Sin reglas configuradas. Creá una para empezar.
          </div>
        )}
      </div>

      {modal !== null && (
        <RuleModal rule={modal} onClose={() => setModal(null)} onSave={save} isPending={isPending} />
      )}
    </div>
  )
}
