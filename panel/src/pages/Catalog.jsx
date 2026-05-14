import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/client.js'

function formatPrice(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-card-border'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ProductModal({ product, onClose, onSave, isPending }) {
  const isEdit = !!product?.id
  const handleSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    onSave({
      name:        f.get('name'),
      description: f.get('description') || null,
      price:       parseFloat(f.get('price')),
      unit:        f.get('unit') || null,
      available:   f.get('available') === 'on',
    })
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="font-semibold text-text-primary">
            {isEdit ? 'Editar producto' : 'Agregar producto'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Nombre *">
            <input name="name" defaultValue={product?.name ?? ''} required
              className={INPUT} placeholder="Ej: Tomate" />
          </Field>
          <Field label="Descripción">
            <input name="description" defaultValue={product?.description ?? ''}
              className={INPUT} placeholder="Ej: Tomate redondo fresco" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio *">
              <input name="price" type="number" step="0.01" defaultValue={product?.price ?? ''}
                required className={INPUT} placeholder="1800" />
            </Field>
            <Field label="Unidad">
              <input name="unit" defaultValue={product?.unit ?? ''}
                className={INPUT} placeholder="kg, unidad, hora..." />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="available" type="checkbox" defaultChecked={product?.available ?? true}
              className="w-4 h-4 rounded border-card-border accent-accent" />
            <span className="text-sm text-text-primary">Disponible</span>
          </label>
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

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-secondary block mb-1">{label}</label>
      {children}
    </div>
  )
}

const INPUT    = 'w-full bg-sidebar border border-card-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors'
const BTN_PRIMARY = 'flex-1 px-4 py-2 text-sm text-white bg-accent rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50'
const BTN_GHOST   = 'flex-1 px-4 py-2 text-sm text-text-secondary border border-card-border rounded-md hover:bg-white/[0.04] transition-colors'

export default function Catalog() {
  useEffect(() => { document.title = 'Catálogo — MateBot' }, [])
  const account = useStore((s) => s.account)
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | {} (new) | product (edit)

  const { data: products = [] } = useQuery({
    queryKey: ['products', account?.id],
    queryFn: () => getProducts(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) =>
      modal?.id
        ? updateProduct(account.id, modal.id, data)
        : createProduct(account.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', account.id] }); setModal(null) },
  })

  const { mutate: remove } = useMutation({
    mutationFn: (pid) => deleteProduct(account.id, pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', account.id] }),
  })

  const toggleAvailable = (p) =>
    updateProduct(account.id, p.id, { available: !p.available }).then(() =>
      qc.invalidateQueries({ queryKey: ['products', account.id] }),
    )

  if (!account) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Catálogo</h2>
        <button onClick={() => setModal({})} className="flex items-center gap-2 px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors">
          <Plus size={15} /> Agregar producto
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              {['Producto', 'Precio', 'Unidad', 'Disponible', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-card-border/40 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{p.name}</p>
                  {p.description && <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>}
                </td>
                <td className="px-4 py-3 text-text-primary font-mono text-sm">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-text-secondary">{p.unit ?? '—'}</td>
                <td className="px-4 py-3">
                  <Toggle checked={p.available} onChange={() => toggleAvailable(p)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setModal(p)} className="p-1.5 text-text-secondary hover:text-text-primary rounded">
                      <PencilSimple size={13} />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-text-secondary hover:text-red-400 rounded">
                      <Trash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-text-secondary">Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <ProductModal
          product={modal}
          onClose={() => setModal(null)}
          onSave={save}
          isPending={isPending}
        />
      )}
    </div>
  )
}
