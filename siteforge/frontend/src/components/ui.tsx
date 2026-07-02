import React from 'react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/stores/toast'

// ========== Button ==========
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type BtnSize = 'sm' | 'md' | 'lg'

export function Button({
  variant = 'primary', size = 'md', className, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-muted',
    ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
  }
  const sizes: Record<BtnSize, string> = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-base',
  }
  return (
    <button className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

// ========== Card ==========
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-border bg-card p-5', className)} {...props}>{children}</div>
}
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between mb-4', className)} {...props}>{children}</div>
}
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold', className)} {...props}>{children}</h3>
}

// ========== Input ==========
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('h-9 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-9 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20', className)} {...props}>{children}</select>
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block mb-1.5 text-xs font-medium text-muted-foreground', className)} {...props}>{children}</label>
}

// ========== Badge ==========
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
export function Badge({ variant = 'default', className, children }: { variant?: BadgeVariant; className?: string; children: React.ReactNode }) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success border border-success/30',
    warning: 'bg-warning/10 text-warning border border-warning/30',
    danger: 'bg-destructive/10 text-destructive border border-destructive/30',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/30',
    primary: 'bg-primary/10 text-primary border border-primary/30',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium', variants[variant], className)}>{children}</span>
}

// ========== Table ==========
export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm">{children}</table></div>
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('text-left px-4 py-3 bg-muted font-semibold text-muted-foreground whitespace-nowrap', className)}>{children}</th>
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 border-t border-border', className)}>{children}</td>
}

// ========== Alert ==========
type AlertType = 'info' | 'success' | 'warning' | 'danger'
export function Alert({ type = 'info', className, children }: { type?: AlertType; className?: string; children: React.ReactNode }) {
  const types: Record<AlertType, string> = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
  }
  return <div className={cn('rounded-lg border p-3 text-sm flex gap-2', types[type], className)}>{children}</div>
}

// ========== Progress Bar ==========
export function Progress({ value, className, color = 'primary' }: { value: number; className?: string; color?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const colors = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive' }
  return <div className={cn('h-2 rounded-full bg-muted overflow-hidden', className)}><div className={cn('h-full rounded-full transition-all duration-500', colors[color])} style={{ width: `${Math.min(100, value)}%` }} /></div>
}

// ========== Score Bar (GEO dimensions) ==========
export function ScoreBar({ name, score, max }: { name: string; score: number; max: number }) {
  const pct = (score / max) * 100
  const color = score / max >= 0.8 ? 'bg-success' : score / max >= 0.6 ? 'bg-warning' : 'bg-destructive'
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 text-xs flex-shrink-0">{name}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold">{score}/{max}</span>
    </div>
  )
}

// ========== Score Card ==========
export function ScoreCard({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="text-center p-6 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
      <div className="text-5xl font-extrabold" style={{ color }}>{score}</div>
      <div className="text-sm mt-2 text-muted-foreground">{label}</div>
    </div>
  )
}

// ========== Stat Card ==========
export function StatCard({ label, value, delta, deltaType }: { label: string; value: string | number; delta?: string; deltaType?: 'up' | 'down' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {delta && <div className={cn('text-xs mt-1', deltaType === 'up' ? 'text-success' : 'text-destructive')}>{deltaType === 'up' ? '↑' : '↓'} {delta}</div>}
    </div>
  )
}

// ========== Code Block ==========
export function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <pre className={cn('bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed', className)}>{children}</pre>
}

// ========== Tabs ==========
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-border mb-5">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={cn('px-4 py-2.5 text-sm border-b-2 transition-colors', active === t.key ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ========== Empty State ==========
export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {icon && <div className="flex justify-center mb-4 opacity-50">{icon}</div>}
      <div className="font-medium text-foreground">{title}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ========== Toggle Switch ==========
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted')}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

// ========== Modal ==========
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 p-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

// ========== Toast Container ==========
export function ToastContainer() {
  const { toasts } = useToastStore()
  const colors = { success: 'bg-success', error: 'bg-destructive', info: 'bg-blue-500', warning: 'bg-warning' }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
  return (
    <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn('flex items-center gap-2 rounded-lg px-5 py-3 text-sm text-white shadow-lg', colors[t.type])}>
          {icons[t.type]} {t.message}
        </div>
      ))}
    </div>
  )
}
