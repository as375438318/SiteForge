import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { ToastContainer } from '@/components/ui'
import { useAuthStore } from '@/stores/auth'

// Pages - lazy loaded
import { lazy, Suspense, type ReactNode } from 'react'
const Loading = () => <div className="p-8 text-muted-foreground">加载中...</div>

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Parse = lazy(() => import('@/pages/Parse'))
const Templates = lazy(() => import('@/pages/Templates'))
const Editor = lazy(() => import('@/pages/Editor'))
const CmsList = lazy(() => import('@/pages/CmsList'))
const CmsEdit = lazy(() => import('@/pages/CmsEdit'))
const CmsPages = lazy(() => import('@/pages/CmsPages'))
const FormsDesigner = lazy(() => import('@/pages/FormsDesigner'))
const Leads = lazy(() => import('@/pages/Leads'))
const LeadsDetail = lazy(() => import('@/pages/LeadsDetail'))
const SeoSettings = lazy(() => import('@/pages/SeoSettings'))
const SeoHealth = lazy(() => import('@/pages/SeoHealth'))
const GeoLlmsTxt = lazy(() => import('@/pages/GeoLlmsTxt'))
const GeoCitationTest = lazy(() => import('@/pages/GeoCitationTest'))
const SystemDeploy = lazy(() => import('@/pages/SystemDeploy'))
const SystemLicense = lazy(() => import('@/pages/SystemLicense'))
const SystemBackup = lazy(() => import('@/pages/SystemBackup'))
const SystemLlm = lazy(() => import('@/pages/SystemLlm'))
const AnalyticsTraffic = lazy(() => import('@/pages/AnalyticsTraffic'))
const AnalyticsSeoGeo = lazy(() => import('@/pages/AnalyticsSeoGeo'))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <ProtectedRoute>
              <AppLayout>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/parse" element={<Parse />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/editor" element={<Editor />} />
                    <Route path="/cms/list" element={<CmsList />} />
                    <Route path="/cms/edit" element={<CmsEdit />} />
                    <Route path="/cms/pages" element={<CmsPages />} />
                    <Route path="/forms/designer" element={<FormsDesigner />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/leads/detail" element={<LeadsDetail />} />
                    <Route path="/seo/settings" element={<SeoSettings />} />
                    <Route path="/seo/health" element={<SeoHealth />} />
                    <Route path="/geo/llms-txt" element={<GeoLlmsTxt />} />
                    <Route path="/geo/citation-test" element={<GeoCitationTest />} />
                    <Route path="/system/deploy" element={<SystemDeploy />} />
                    <Route path="/system/license" element={<SystemLicense />} />
                    <Route path="/system/backup" element={<SystemBackup />} />
                    <Route path="/system/llm" element={<SystemLlm />} />
                    <Route path="/analytics/traffic" element={<AnalyticsTraffic />} />
                    <Route path="/analytics/seo-geo" element={<AnalyticsSeoGeo />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
