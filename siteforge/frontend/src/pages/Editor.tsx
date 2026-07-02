import { useState, useRef, useEffect, useCallback, DragEvent } from 'react'
import { Button, Input, Select, Label, Badge, Textarea } from '@/components/ui'
import { toast } from '@/stores/toast'
import { useEditorStore, Block, Viewport } from '@/stores/editor'
import {
  MousePointerClick, Save, Undo, Redo, Eye, Rocket,
  Trash2, ArrowUp, ArrowDown, Monitor, Tablet, Smartphone,
  Plus, GripVertical,
} from 'lucide-react'

interface ComponentDef {
  type: string
  label: string
}

const COMPONENTS: ComponentDef[] = [
  { type: 'hero', label: 'Hero 大图区' },
  { type: 'feature_grid', label: '特性网格' },
  { type: 'product_grid', label: '产品网格' },
  { type: 'case_list', label: '案例列表' },
  { type: 'page_header', label: '页面标题' },
  { type: 'text_image', label: '图文介绍' },
  { type: 'team', label: '团队介绍' },
  { type: 'cta', label: '行动号召' },
  { type: 'contact_info', label: '联系信息' },
  { type: 'form', label: '表单' },
  { type: 'stats', label: '数据统计' },
  { type: 'faq', label: '常见问答' },
  { type: 'testimonial', label: '客户评价' },
  { type: 'map', label: '地图' },
  { type: 'footer', label: '页脚' },
  { type: 'product_list', label: '产品列表' },
]

const VP_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const VP_ICONS: Record<Viewport, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

const SAVE_DEBOUNCE_MS = 30_000

export default function Editor() {
  const {
    blocks, selectedBlockIndex, viewport, saved, saving,
    addBlock, removeBlock, moveBlock, updateBlockProps, selectBlock,
    setViewport, setSaved, setSaving,
  } = useEditorStore()

  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [iframeKey, setIframeKey] = useState(0)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Drag state
  const dragFromLibrary = useRef<string | null>(null)
  const dragFromIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverCanvas, setDragOverCanvas] = useState(false)

  // ====== Preview rendering ======
  const buildSite = useCallback(() => ({
    name: '智云科技',
    domain: 'www.zhiyun-tech.com',
    description: '专注企业数字化转型',
    navigation: [{ label: '首页', url: '/' }],
  }), [])

  const buildPage = useCallback(() => ({
    url: '/',
    title: '首页',
    seoMeta: { title: '智云科技', description: '专注企业数字化转型' },
    blocks: blocks.map((b, i) => ({ ...b, sortOrder: i })),
  }), [blocks])

  const renderPreview = useCallback(async () => {
    try {
      const res = await fetch('/api/ssg/preview-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: buildSite(), page: buildPage() }),
      })
      if (!res.ok) {
        toast.error('预览失败')
        return
      }
      const data = await res.json()
      setPreviewHtml(data.html)
      setIframeKey((k) => k + 1)
    } catch {
      toast.error('预览失败')
    }
  }, [buildSite, buildPage])

  // Initial render
  useEffect(() => {
    renderPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render when blocks change (debounced)
  useEffect(() => {
    const t = setTimeout(() => renderPreview(), 400)
    return () => clearTimeout(t)
  }, [blocks, renderPreview])

  // ====== Save (manual + auto) ======
  const doSave = useCallback(async () => {
    setSaving(true)
    try {
      // Simulated save request — replace with real API when available
      await new Promise((r) => setTimeout(r, 400))
      setSaved(true)
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }, [setSaved, setSaving])

  const handleManualSave = useCallback(() => {
    doSave().then(() => toast.success('已保存'))
  }, [doSave])

  // Auto-save with debounce 30s after a change
  useEffect(() => {
    if (saved) return
    setIsAutoSaving(true)
    const t = setTimeout(() => {
      setIsAutoSaving(false)
      doSave()
    }, SAVE_DEBOUNCE_MS)
    return () => {
      clearTimeout(t)
      setIsAutoSaving(false)
    }
  }, [saved, doSave])

  // ====== Drag handlers (HTML5 DnD) ======
  const onLibraryDragStart = (e: DragEvent<HTMLDivElement>, type: string) => {
    dragFromLibrary.current = type
    dragFromIndex.current = null
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('text/plain', `library:${type}`)
  }

  const onBlockDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragFromLibrary.current = null
    dragFromIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `block:${index}`)
  }

  const onBlockDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = dragFromLibrary.current ? 'copy' : 'move'
    setDragOverIndex(index)
  }

  const onBlockDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    setDragOverCanvas(false)

    const libType = dragFromLibrary.current
    const fromIdx = dragFromIndex.current

    if (libType) {
      // Insert before the hovered block
      addBlock(libType, index)
    } else if (fromIdx !== null) {
      // Reorder
      let target = index
      if (fromIdx < index) target = index - 1 // shifted after removal
      if (fromIdx !== target) moveBlock(fromIdx, target)
    }

    dragFromLibrary.current = null
    dragFromIndex.current = null
  }

  const onCanvasDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!dragFromLibrary.current && dragFromIndex.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = dragFromLibrary.current ? 'copy' : 'move'
    setDragOverCanvas(true)
  }

  const onCanvasDrop = (e: DragEvent<HTMLDivElement>) => {
    // Drop on empty canvas area = append
    e.preventDefault()
    setDragOverIndex(null)
    setDragOverCanvas(false)

    const libType = dragFromLibrary.current
    const fromIdx = dragFromIndex.current

    if (libType) {
      addBlock(libType)
    } else if (fromIdx !== null && fromIdx !== blocks.length - 1) {
      moveBlock(fromIdx, blocks.length - 1)
    }

    dragFromLibrary.current = null
    dragFromIndex.current = null
  }

  const onDragEnd = () => {
    dragFromLibrary.current = null
    dragFromIndex.current = null
    setDragOverIndex(null)
    setDragOverCanvas(false)
  }

  // ====== Block operations ======
  const handleDelete = (index: number) => {
    removeBlock(index)
    toast.success('已删除区块')
  }
  const handleMoveUp = (index: number) => {
    if (index > 0) moveBlock(index, index - 1)
  }
  const handleMoveDown = (index: number) => {
    if (index < blocks.length - 1) moveBlock(index, index + 1)
  }

  // ====== Status text ======
  const statusText = saving
    ? '保存中...'
    : isAutoSaving
      ? `编辑中 · ${Math.round(SAVE_DEBOUNCE_MS / 1000)}s 后自动保存`
      : saved
        ? '已保存'
        : '未保存'

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      {/* ===== Left: Component Library ===== */}
      <div className="w-56 border-r border-border bg-card overflow-y-auto flex-shrink-0">
        <div className="p-3 text-xs font-semibold text-muted-foreground uppercase sticky top-0 bg-card z-10 border-b border-border">
          组件库 · 拖拽到画布
        </div>
        {COMPONENTS.map((c) => (
          <div
            key={c.type}
            draggable
            onDragStart={(e) => onLibraryDragStart(e, c.type)}
            onDragEnd={onDragEnd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-grab active:cursor-grabbing border-b border-border hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors select-none"
            title={`拖拽添加 ${c.label}`}
          >
            <GripVertical className="w-3.5 h-3.5 opacity-50" />
            <MousePointerClick className="w-4 h-4" />
            <span>{c.label}</span>
          </div>
        ))}
        <div className="p-3 text-xs text-muted-foreground/70 leading-relaxed">
          提示：按住组件拖到右侧画布即可添加。区块也支持拖拽排序。
        </div>
      </div>

      {/* ===== Center: Canvas ===== */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-card">
          <Select className="w-40" defaultValue="/">
            <option value="/">首页 /</option>
            <option value="/products">产品 /products</option>
            <option value="/about">关于 /about</option>
          </Select>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" title="撤销"><Undo className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" title="重做"><Redo className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-5 bg-border mx-1" />
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((vp) => {
            const Icon = VP_ICONS[vp]
            return (
              <Button
                key={vp}
                variant={viewport === vp ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewport(vp)}
                title={vp}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            )
          })}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={renderPreview}>
            <Eye className="w-3.5 h-3.5" /> 预览
          </Button>
          <Button size="sm" onClick={handleManualSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? '保存中' : '保存'}
          </Button>
          <Button size="sm" onClick={() => toast.success('发布中...')}>
            <Rocket className="w-3.5 h-3.5" /> 发布
          </Button>
        </div>

        {/* Save status bar */}
        <div className="h-7 px-4 border-b border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {blocks.length} 个区块</span>
          <span className={saved ? 'text-success' : 'text-warning'}>
            {saving ? '⏳ ' : saved ? '✅ ' : '✏️ '}{statusText}
          </span>
        </div>

        {/* Canvas body */}
        <div
          className="flex-1 overflow-auto p-6 flex justify-center"
          onDragOver={onCanvasDragOver}
          onDrop={onCanvasDrop}
          onDragLeave={(e) => {
            // Only clear when leaving canvas, not entering child
            if (e.currentTarget === e.target) setDragOverCanvas(false)
          }}
        >
          <div
            className={`relative bg-white rounded-lg shadow-md transition-all ${dragOverCanvas ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{ width: VP_WIDTHS[viewport], height: '100%', maxWidth: '100%' }}
          >
            {/* Block list overlay (left side, for selecting/reordering) */}
            <BlockOverlayList
              blocks={blocks}
              selectedIndex={selectedBlockIndex}
              dragOverIndex={dragOverIndex}
              onSelect={selectBlock}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onBlockDragStart={onBlockDragStart}
              onBlockDragOver={onBlockDragOver}
              onBlockDrop={onBlockDrop}
              onDragEnd={onDragEnd}
            />

            {/* Empty state */}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                <Plus className="w-10 h-10 mb-2 opacity-50" />
                <div className="text-sm">从左侧拖拽组件到此处</div>
              </div>
            )}

            {/* Iframe preview */}
            {previewHtml ? (
              <iframe
                key={iframeKey}
                srcDoc={previewHtml}
                className="w-full h-full rounded-lg"
                style={{ border: 'none', pointerEvents: 'none' }}
                title="preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                正在生成预览...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Right: Properties Panel ===== */}
      <PropertiesPanel
        block={selectedBlockIndex !== null ? blocks[selectedBlockIndex] : null}
        selectedIndex={selectedBlockIndex}
        onUpdate={(key, value) =>
          selectedBlockIndex !== null && updateBlockProps(selectedBlockIndex, key, value)
        }
      />
    </div>
  )
}

// ============================================================
// Block overlay list — absolutely positioned over the iframe
// to enable selection and reordering by HTML5 DnD.
// ============================================================
interface OverlayProps {
  blocks: Block[]
  selectedIndex: number | null
  dragOverIndex: number | null
  onSelect: (i: number) => void
  onDelete: (i: number) => void
  onMoveUp: (i: number) => void
  onMoveDown: (i: number) => void
  onBlockDragStart: (e: DragEvent<HTMLDivElement>, i: number) => void
  onBlockDragOver: (e: DragEvent<HTMLDivElement>, i: number) => void
  onBlockDrop: (e: DragEvent<HTMLDivElement>, i: number) => void
  onDragEnd: () => void
}

function BlockOverlayList({
  blocks, selectedIndex, dragOverIndex,
  onSelect, onDelete, onMoveUp, onMoveDown,
  onBlockDragStart, onBlockDragOver, onBlockDrop, onDragEnd,
}: OverlayProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      {blocks.map((b, i) => {
        const isSelected = selectedIndex === i
        const isDragOver = dragOverIndex === i
        return (
          <div
            key={i}
            draggable
            onDragStart={(e) => onBlockDragStart(e, i)}
            onDragOver={(e) => onBlockDragOver(e, i)}
            onDrop={(e) => onBlockDrop(e, i)}
            onDragEnd={onDragEnd}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(i)
            }}
            className={`pointer-events-auto relative border-2 m-0 transition-colors ${
              isSelected
                ? 'border-primary bg-primary/5'
                : isDragOver
                  ? 'border-primary/60 border-dashed bg-primary/5'
                  : 'border-transparent hover:border-primary/30 hover:bg-primary/5'
            }`}
            style={{ minHeight: 36 }}
          >
            {/* Block tag */}
            <div
              className={`absolute -top-3 left-2 px-2 py-0.5 text-[10px] rounded-full font-mono flex items-center gap-1 ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <GripVertical className="w-2.5 h-2.5" />
              #{i} · {b.type}
            </div>

            {/* Spacer to ensure clickable area; sized via min-height */}
            <div style={{ height: 32 }} />

            {/* Floating action toolbar */}
            {isSelected && (
              <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm p-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveUp(i) }}
                  disabled={i === 0}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                  title="上移"
                ><ArrowUp className="w-3 h-3" /></button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveDown(i) }}
                  disabled={i === blocks.length - 1}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                  title="下移"
                ><ArrowDown className="w-3 h-3" /></button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(i) }}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                  title="删除"
                ><Trash2 className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Properties Panel — dynamically renders forms based on block type
// ============================================================
interface PanelProps {
  block: Block | null
  selectedIndex: number | null
  onUpdate: (key: string, value: any) => void
}

function PropertiesPanel({ block, selectedIndex, onUpdate }: PanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">区块属性</div>
        {block && selectedIndex !== null ? (
          <BlockPropsForm block={block} index={selectedIndex} onUpdate={onUpdate} />
        ) : (
          <div className="text-sm text-muted-foreground">选择画布中的区块编辑属性</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">样式</div>
        <Label>主题色</Label>
        <div className="flex gap-2 mb-3">
          {['#4f46e5', '#0ea5e9', '#22c55e', '#f97316', '#ec4899'].map((c) => (
            <div
              key={c}
              className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-primary"
              style={{ background: c }}
            />
          ))}
        </div>
        <Label>字体</Label>
        <Select>
          <option>系统默认</option>
          <option>思源黑体</option>
          <option>鸿蒙字体</option>
        </Select>
      </div>
    </div>
  )
}

function BlockPropsForm({
  block, index, onUpdate,
}: { block: Block; index: number; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <Label>类型</Label>
      <div className="mb-3">
        <Badge variant="primary">{block.type}</Badge>
        <span className="ml-2 text-xs text-muted-foreground">#{index}</span>
      </div>
      {Object.entries(block.props).map(([key, val]) => (
        <PropField
          key={key}
          propKey={key}
          value={val}
          onChange={(v) => onUpdate(key, v)}
        />
      ))}
    </div>
  )
}

function PropField({
  propKey, value, onChange,
}: { propKey: string; value: any; onChange: (v: any) => void }) {
  if (value === null || value === undefined) return null

  // Array of objects (e.g., items list)
  if (Array.isArray(value)) {
    return (
      <ArrayField
        propKey={propKey}
        items={value}
        onChange={onChange}
      />
    )
  }

  if (typeof value === 'object') {
    return (
      <ObjectField propKey={propKey} obj={value} onChange={onChange} />
    )
  }

  // Primitive
  const isLong = typeof value === 'string' && value.length > 40
  return (
    <div className="mb-3">
      <Label>{propKey}</Label>
      {isLong ? (
        <Textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <Input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={(e) =>
            onChange(typeof value === 'number' ? Number(e.target.value) : e.target.value)
          }
        />
      )}
    </div>
  )
}

function ArrayField({
  propKey, items, onChange,
}: { propKey: string; items: any[]; onChange: (v: any[]) => void }) {
  const updateItem = (idx: number, key: string, v: any) => {
    const next = items.map((it, i) =>
      i === idx ? (typeof it === 'object' && it !== null ? { ...it, [key]: v } : v) : it,
    )
    onChange(next)
  }
  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }
  const addItem = () => {
    const sample = items[0]
    let newItem: any
    if (sample && typeof sample === 'object') {
      newItem = JSON.parse(JSON.stringify(sample))
      // clear string fields to encourage user editing
      Object.keys(newItem).forEach((k) => {
        if (typeof newItem[k] === 'string') newItem[k] = '新项目'
      })
    } else {
      newItem = ''
    }
    onChange([...items, newItem])
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <Label className="mb-0">{propKey}（{items.length}）</Label>
        <button
          onClick={addItem}
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
          title="新增项"
        >
          <Plus className="w-3 h-3" /> 新增
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="border border-border rounded-lg p-2 bg-background/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-mono">#{idx}</span>
              <button
                onClick={() => removeItem(idx)}
                className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {item && typeof item === 'object' ? (
              Object.entries(item).map(([k, v]) => (
                <div key={k} className="mb-1.5 last:mb-0">
                  <Label className="text-[10px] mb-0.5">{k}</Label>
                  <Input
                    value={String(v ?? '')}
                    onChange={(e) => updateItem(idx, k, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              ))
            ) : (
              <Input
                value={String(item ?? '')}
                onChange={(e) => updateItem(idx, '', e.target.value)}
                className="h-7 text-xs"
              />
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">暂无项目</div>
        )}
      </div>
    </div>
  )
}

function ObjectField({
  propKey, obj, onChange,
}: { propKey: string; obj: Record<string, any>; onChange: (v: Record<string, any>) => void }) {
  return (
    <div className="mb-3 border border-border rounded-lg p-2 bg-background/50">
      <Label>{propKey}</Label>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="mb-1.5 last:mb-0">
          <Label className="text-[10px] mb-0.5">{k}</Label>
          <Input
            value={String(v ?? '')}
            onChange={(e) => onChange({ ...obj, [k]: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
      ))}
    </div>
  )
}
