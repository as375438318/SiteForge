import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Table, Th, Td, Badge, Tabs, Input, Select } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

const mockData = {
  product: [
    { title: '智能CRM系统', category: 'SaaS', score: 78, status: '已发布', date: '2025-06-28' },
    { title: '数据分析平台', category: 'SaaS', score: 65, status: '已发布', date: '2025-06-25' },
    { title: '企业官网模板', category: '模板', score: 82, status: '草稿', date: '2025-06-20' },
  ],
  case: [
    { title: '某制造企业数字化转型', category: '制造业', score: 71, status: '已发布', date: '2025-06-22' },
    { title: '某零售品牌官网搭建', category: '零售', score: 85, status: '已发布', date: '2025-06-18' },
  ],
  post: [
    { title: '企业官网如何提升AI搜索排名', category: 'GEO', score: 92, status: '已发布', date: '2025-07-01' },
    { title: 'SEO vs GEO：有什么区别', category: 'SEO', score: 68, status: '已发布', date: '2025-06-30' },
    { title: 'llms.txt 完全指南', category: 'GEO', score: 74, status: '草稿', date: '2025-06-27' },
  ],
}

export default function CmsList() {
  const [tab, setTab] = useState('product')
  const navigate = useNavigate()
  const items = mockData[tab as keyof typeof mockData] || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">内容管理</h1><p className="text-sm text-muted-foreground">管理产品、案例、文章内容</p></div>
        <Button onClick={() => navigate('/cms/edit')}><Plus className="w-4 h-4" /> 新建</Button>
      </div>

      <Tabs tabs={[{ key: 'product', label: '产品' }, { key: 'case', label: '案例' }, { key: 'post', label: '文章' }]} active={tab} onChange={setTab} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索内容..." />
        </div>
        <Select className="w-40"><option>全部分类</option><option>SaaS</option><option>模板</option><option>GEO</option></Select>
        <Select className="w-32"><option>全部状态</option><option>已发布</option><option>草稿</option></Select>
      </div>

      <Table>
        <thead><tr><Th>标题</Th><Th>分类</Th><Th>可引用性</Th><Th>更新时间</Th><Th>状态</Th><Th>操作</Th></tr></thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-muted/50">
              <Td className="font-medium">{item.title}</Td>
              <Td><Badge>{item.category}</Badge></Td>
              <Td><Badge variant={item.score >= 80 ? 'success' : item.score >= 60 ? 'warning' : 'danger'}>{item.score}</Badge></Td>
              <Td className="text-muted-foreground">{item.date}</Td>
              <Td><Badge variant={item.status === '已发布' ? 'success' : 'default'}>{item.status}</Badge></Td>
              <Td><Button variant="link" size="sm" onClick={() => navigate('/cms/edit')}>编辑</Button></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
