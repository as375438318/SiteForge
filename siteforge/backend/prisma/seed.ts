import { PrismaClient, UserRole, SiteStatus, PageType, PageStatus, CollectionType, ContentStatus, LeadStatus, BuildJobStatus, LicenseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 1. 创建管理员
  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    const hash = await bcrypt.hash('Admin12345', 12);
    await prisma.user.create({
      data: { username: 'admin', email: 'admin@siteforge.local', passwordHash: hash, role: UserRole.ADMIN },
    });
    console.log('✅ 管理员创建: admin / Admin12345');
  } else {
    console.log('⚠️ 用户已存在，跳过');
  }

  // 2. 创建默认站点
  const existingSite = await prisma.site.findFirst();
  if (!existingSite) {
    const site = await prisma.site.create({
      data: {
        domain: 'www.zhiyun-tech.com',
        name: '智云科技',
        status: SiteStatus.ACTIVE,
        themeConfig: { primaryColor: '#4f46e5', font: 'system' },
        seoConfig: { title: '智云科技 - 企业数字化转型专家', description: '专注企业数字化转型与AI应用' },
        geoConfig: { allowAiCrawlers: true, llmsTxtAutoUpdate: true },
      },
    });
    console.log('✅ 站点创建: 智云科技');

    // 3. 创建页面
    const pages = [
      { slug: '/', title: '首页', type: PageType.HOME, sortOrder: 0 },
      { slug: '/products', title: '产品服务', type: PageType.PRODUCTS, sortOrder: 1 },
      { slug: '/cases', title: '成功案例', type: PageType.CASES, sortOrder: 2 },
      { slug: '/about', title: '关于我们', type: PageType.ABOUT, sortOrder: 3 },
      { slug: '/contact', title: '联系我们', type: PageType.CONTACT, sortOrder: 4 },
    ];

    for (const p of pages) {
      const page = await prisma.page.create({
        data: { siteId: site.id, slug: p.slug, title: p.title, type: p.type, status: PageStatus.PUBLISHED, sortOrder: p.sortOrder, seoMeta: { title: `${p.title} - 智云科技`, description: `智云科技 - ${p.title}` } },
      });

      // 给首页加区块
      if (p.slug === '/') {
        await prisma.block.create({ data: { pageId: page.id, type: 'hero', props: { title: '智云科技', subtitle: '专注企业数字化转型与AI应用', cta: '了解更多' }, sortOrder: 0 } });
        await prisma.block.create({ data: { pageId: page.id, type: 'feature_grid', props: { title: '核心优势', items: [{ icon: '⚡', title: '高效建站', desc: '10分钟完成建站' }, { icon: '🔍', title: 'SEO优化', desc: '搜索引擎排名提升' }, { icon: '🤖', title: 'GEO优化', desc: 'AI搜索引用提升' }] }, sortOrder: 1 } });
        await prisma.block.create({ data: { pageId: page.id, type: 'cta', props: { title: '联系我们', button: '立即咨询' }, sortOrder: 2 } });
      } else {
        await prisma.block.create({ data: { pageId: page.id, type: 'page_header', props: { title: p.title }, sortOrder: 0 } });
      }
    }
    console.log('✅ 5个页面 + 区块创建');

    // 4. 创建内容集合 + 内容
    const productCol = await prisma.collection.create({ data: { siteId: site.id, type: CollectionType.PRODUCT, name: '产品', slug: 'products', fieldsSchema: { fields: [{ name: 'price', label: '价格', type: 'text' }, { name: 'spec', label: '规格', type: 'text' }] } } });
    const caseCol = await prisma.collection.create({ data: { siteId: site.id, type: CollectionType.CASE, name: '案例', slug: 'cases', fieldsSchema: {} } });
    const postCol = await prisma.collection.create({ data: { siteId: site.id, type: CollectionType.POST, name: '文章', slug: 'posts', fieldsSchema: {} } });

    await prisma.content.create({ data: { collectionId: productCol.id, slug: 'crm-system', title: '智能CRM系统', fields: { summary: '企业级客户关系管理系统', price: '¥999/年', spec: '支持100人团队' }, status: ContentStatus.PUBLISHED, seoMeta: { title: '智能CRM系统', description: '企业级CRM' }, author: 'admin', publishedAt: new Date() } });
    await prisma.content.create({ data: { collectionId: productCol.id, slug: 'analytics-platform', title: '数据分析平台', fields: { summary: '实时数据分析与可视化', price: '¥1999/年', spec: '支持百万级数据' }, status: ContentStatus.PUBLISHED, seoMeta: { title: '数据分析平台' }, author: 'admin', publishedAt: new Date() } });
    await prisma.content.create({ data: { collectionId: caseCol.id, slug: 'manufacturing-case', title: '某制造企业数字化转型', fields: { summary: '帮助制造企业实现全面数字化', industry: '制造业', result: '效率提升47%' }, status: ContentStatus.PUBLISHED, author: 'admin', publishedAt: new Date() } });
    await prisma.content.create({ data: { collectionId: postCol.id, slug: 'geo-guide', title: '企业官网如何提升AI搜索排名', fields: { summary: '2025年GEO优化完全指南' }, status: ContentStatus.PUBLISHED, seoMeta: { title: 'GEO优化指南', description: 'AI搜索排名提升方法' }, author: '张明', publishedAt: new Date() } });
    await prisma.content.create({ data: { collectionId: postCol.id, slug: 'seo-vs-geo', title: 'SEO与GEO的区别', fields: { summary: '传统SEO与生成式引擎优化的对比' }, status: ContentStatus.DRAFT, author: '张明' } });
    console.log('✅ 3个集合 + 5篇内容创建');

    // 5. 创建导航
    await prisma.navigation.create({ data: { siteId: site.id, location: 'main', items: [{ label: '首页', url: '/' }, { label: '产品服务', url: '/products' }, { label: '成功案例', url: '/cases' }, { label: '关于我们', url: '/about' }, { label: '联系我们', url: '/contact' }] } });
    console.log('✅ 导航创建');

    // 6. 创建表单
    const form = await prisma.form.create({ data: { siteId: site.id, name: '在线咨询', fields: [{ name: 'name', label: '姓名', type: 'text', required: true }, { name: 'phone', label: '电话', type: 'tel', required: true }, { name: 'message', label: '需求', type: 'textarea', required: false }], settings: { placement: 'contact', popup: false, floatingButton: true } } });
    console.log('✅ 表单创建');

    // 7. 创建线索
    await prisma.lead.create({ data: { siteId: site.id, formId: form.id, data: { name: '王先生', phone: '138****8888', email: 'wang@example.com', message: '想了解CRM系统' }, sourcePage: '/contact', status: LeadStatus.NEW } });
    await prisma.lead.create({ data: { siteId: site.id, formId: form.id, data: { name: '李女士', phone: '159****6666', email: 'li@example.com', message: '数据分析平台多少钱' }, sourcePage: '/products', status: LeadStatus.READ } });
    await prisma.lead.create({ data: { siteId: site.id, formId: form.id, data: { name: '张总', phone: '186****1234', email: 'zhang@example.com', message: '安排demo演示' }, sourcePage: '/contact', status: LeadStatus.REPLIED } });
    await prisma.lead.create({ data: { siteId: site.id, formId: form.id, data: { name: '陈先生', phone: '137****5555', email: 'chen@example.com', message: '已签约，谢谢' }, sourcePage: '/contact', status: LeadStatus.ARCHIVED } });
    console.log('✅ 4条线索创建');

    // 8. 创建 License
    await prisma.license.create({ data: { machineId: 'seed-machine-id', domain: 'www.zhiyun-tech.com', status: LicenseStatus.ACTIVE, licenseData: { edition: 'standard', expireAt: '2026-07-01' }, verifiedAt: new Date(), expireAt: new Date('2026-07-01') } }).catch(() => {});
    console.log('✅ License创建');
  }

  console.log('\n🎉 种子数据初始化完成！');
  console.log('登录账号: admin / Admin12345');
}

main()
  .catch((e) => { console.error('种子数据错误:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
