import { useState } from 'react'
import { Card, CardHeader, CardTitle, Input, Label, Badge, Button } from '@/components/ui'
import { GripVertical, Plus } from 'lucide-react'

const pages = [
  { name: '首页', slug: '/', level: 0 },
  { name: '产品服务', slug: '/products', level: 0 },
  { name: 'CRM系统', slug: '/products/crm', level: 1 },
  { name: '成功案例', slug: '/cases', level: 0 },
  { name: '关于我们', slug: '/about', level: 0 },
  { name: '联系我们', slug: '/contact', level: 0 },
]

const navItems = ['首页', '产品服务', '成功案例', '关于我们', '联系我们']

export default function CmsPages() {
  const [selected, setSelected] = useState(0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">页面与导航</h1><p className="text-sm text-muted-foreground">管理站点页面结构和导航菜单</p></div>
        <Button><Plus className="w-4 h-4" /> 新建页面</Button>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-5">
        {/* Left: Page Tree */}
        <Card>
          <CardHeader><CardTitle>页面树</CardTitle></CardHeader>
          <div className="space-y-1">
            {pages.map((p, i) => (
              <div key={i} onClick={() => setSelected(i)} className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm ${selected === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`} style={{ paddingLeft: `${12 + p.level * 20}px` }}>
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1">{p.name}</span>
                <Badge variant="default">{p.slug}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Page Properties */}
        <Card>
          <CardHeader><CardTitle>页面属性</CardTitle></CardHeader>
          <div className="space-y-4">
            <div><Label>页面名称</Label><Input defaultValue={pages[selected].name} /></div>
            <div><Label>URL Slug</Label><Input defaultValue={pages[selected].slug} /></div>
            <div><Label>SEO 标题</Label><Input placeholder="SEO标题" /></div>
            <div><Label>SEO 描述</Label><Input placeholder="SEO描述" /></div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">配置 SEO</Button>
              <Button variant="secondary" size="sm">配置 GEO</Button>
              <Button variant="danger" size="sm">删除页面</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Config */}
      <Card className="mt-5">
        <CardHeader><CardTitle>导航菜单配置</CardTitle><Button size="sm" variant="secondary"><Plus className="w-3.5 h-3.5" /> 添加导航项</Button></CardHeader>
        <div className="space-y-2">
          {navItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="flex-1">{item}</span>
              <Button variant="ghost" size="sm">编辑</Button>
              <Button variant="ghost" size="sm">删除</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
