import { Module, Controller, Get, Param } from '@nestjs/common'

const TEMPLATES = [
  { id: 'tpl_1', name: '简约商务', industry: '科技互联网', colors: ['#4f46e5', '#ffffff'], blocks: 12 },
  { id: 'tpl_2', name: '现代制造', industry: '制造业', colors: ['#0ea5e9', '#f8fafc'], blocks: 10 },
  { id: 'tpl_3', name: '活力服务', industry: '服务业', colors: ['#22c55e', '#ffffff'], blocks: 11 },
  { id: 'tpl_4', name: '优雅餐饮', industry: '餐饮', colors: ['#f97316', '#fffbeb'], blocks: 9 },
  { id: 'tpl_5', name: '专业教育', industry: '教育培训', colors: ['#8b5cf6', '#f5f3ff'], blocks: 13 },
  { id: 'tpl_6', name: '信赖医疗', industry: '医疗健康', colors: ['#06b6d4', '#ecfeff'], blocks: 10 },
  { id: 'tpl_7', name: '高端房产', industry: '房地产', colors: ['#1e293b', '#f1f5f9'], blocks: 12 },
  { id: 'tpl_8', name: '创意设计', industry: '设计创意', colors: ['#ec4899', '#fdf2f8'], blocks: 14 },
]

@Controller('templates')
class TemplatesController {
  @Get() list() { return TEMPLATES }
  @Get(':id') get(@Param('id') id: string) { return TEMPLATES.find(t => t.id === id) }
}

@Module({ controllers: [TemplatesController] })
export class TemplatesModule {}
