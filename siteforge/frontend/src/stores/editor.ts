import { create } from 'zustand'

export type BlockType =
  | 'hero' | 'feature_grid' | 'cta' | 'page_header' | 'text_image'
  | 'contact_info' | 'form' | 'stats' | 'faq' | 'footer'
  | 'product_grid' | 'case_list' | 'team' | 'testimonial' | 'map' | 'product_list'

export interface Block {
  type: string
  props: Record<string, any>
  sortOrder: number
}

export type Viewport = 'desktop' | 'tablet' | 'mobile'

export const DEFAULT_PROPS: Record<string, Record<string, any>> = {
  hero: { title: '企业标语', subtitle: '一句话描述核心价值', cta: '了解更多' },
  feature_grid: {
    title: '核心优势',
    items: [
      { icon: '⚡', title: '优势1', desc: '描述' },
      { icon: '🛡️', title: '优势2', desc: '描述' },
      { icon: '📊', title: '优势3', desc: '描述' },
    ],
  },
  cta: { title: '联系我们', button: '立即咨询' },
  page_header: { title: '页面标题' },
  text_image: { title: '标题', content: '内容...' },
  contact_info: { phone: '电话', email: '邮箱', address: '地址' },
  form: { title: '在线咨询' },
  stats: {
    items: [
      { number: '200+', label: '客户' },
      { number: '98%', label: '满意度' },
    ],
  },
  faq: {
    title: '常见问题',
    items: [{ question: '问题1？', answer: '回答1' }],
  },
  footer: { companyName: '企业名称', description: '描述', phone: '', email: '' },
  product_grid: { title: '产品服务' },
  case_list: { title: '成功案例' },
  team: { title: '团队介绍' },
  testimonial: { quote: '客户评价', author: '客户', title: '职位' },
  map: {},
  product_list: { title: '产品' },
}

function makeBlock(type: string): Block {
  const props = DEFAULT_PROPS[type] ? JSON.parse(JSON.stringify(DEFAULT_PROPS[type])) : {}
  return { type, props, sortOrder: 0 }
}

const INITIAL_BLOCKS: Block[] = [
  { type: 'hero', props: { title: '智云科技', subtitle: '专注企业数字化转型', cta: '了解更多' }, sortOrder: 0 },
  {
    type: 'feature_grid',
    props: {
      title: '核心优势',
      items: [
        { icon: '⚡', title: '高效建站', desc: '10分钟完成' },
        { icon: '🔍', title: 'SEO优化', desc: '搜得到' },
        { icon: '🤖', title: 'GEO优化', desc: 'AI引得到' },
      ],
    },
    sortOrder: 1,
  },
  { type: 'cta', props: { title: '联系我们', button: '立即咨询' }, sortOrder: 2 },
].map((b, i) => ({ ...b, sortOrder: i }))

export interface EditorState {
  blocks: Block[]
  selectedBlockIndex: number | null
  viewport: Viewport
  saved: boolean
  saving: boolean
  addBlock: (type: string, atIndex?: number) => void
  removeBlock: (index: number) => void
  moveBlock: (from: number, to: number) => void
  reorderBlock: (from: number, to: number) => void
  updateBlockProps: (index: number, key: string, value: any) => void
  selectBlock: (index: number | null) => void
  setViewport: (vp: Viewport) => void
  setSaved: (saved: boolean) => void
  setSaving: (saving: boolean) => void
  markDirty: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: INITIAL_BLOCKS,
  selectedBlockIndex: 0,
  viewport: 'desktop',
  saved: true,
  saving: false,

  addBlock: (type, atIndex) => {
    const state = get()
    const newBlock = makeBlock(type)
    let blocks: Block[]
    if (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= state.blocks.length) {
      blocks = [...state.blocks]
      blocks.splice(atIndex, 0, newBlock)
    } else {
      blocks = [...state.blocks, newBlock]
    }
    blocks = blocks.map((b, i) => ({ ...b, sortOrder: i }))
    set({
      blocks,
      selectedBlockIndex: typeof atIndex === 'number' ? atIndex : blocks.length - 1,
      saved: false,
    })
  },

  removeBlock: (index) => {
    const state = get()
    if (index < 0 || index >= state.blocks.length) return
    const blocks = state.blocks
      .filter((_, i) => i !== index)
      .map((b, i) => ({ ...b, sortOrder: i }))
    let selectedBlockIndex = state.selectedBlockIndex
    if (selectedBlockIndex === index) selectedBlockIndex = null
    else if (selectedBlockIndex !== null && selectedBlockIndex > index) selectedBlockIndex -= 1
    set({ blocks, selectedBlockIndex, saved: false })
  },

  moveBlock: (from, to) => {
    const state = get()
    if (
      from < 0 || from >= state.blocks.length ||
      to < 0 || to >= state.blocks.length ||
      from === to
    ) return
    const blocks = [...state.blocks]
    const [moved] = blocks.splice(from, 1)
    blocks.splice(to, 0, moved)
    const reindexed = blocks.map((b, i) => ({ ...b, sortOrder: i }))
    let selectedBlockIndex = state.selectedBlockIndex
    if (selectedBlockIndex === from) selectedBlockIndex = to
    else if (selectedBlockIndex !== null) {
      if (from < selectedBlockIndex && to >= selectedBlockIndex) selectedBlockIndex -= 1
      else if (from > selectedBlockIndex && to <= selectedBlockIndex) selectedBlockIndex += 1
    }
    set({ blocks: reindexed, selectedBlockIndex, saved: false })
  },

  reorderBlock: (from, to) => get().moveBlock(from, to),

  updateBlockProps: (index, key, value) => {
    const state = get()
    if (index < 0 || index >= state.blocks.length) return
    const blocks = state.blocks.map((b, i) =>
      i === index ? { ...b, props: { ...b.props, [key]: value } } : b,
    )
    set({ blocks, saved: false })
  },

  selectBlock: (index) => set({ selectedBlockIndex: index }),

  setViewport: (vp) => set({ viewport: vp }),

  setSaved: (saved) => set({ saved }),
  setSaving: (saving) => set({ saving }),
  markDirty: () => set({ saved: false }),
}))
