import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { InteractiveBackground } from '@/components/common/InteractiveBackground';
import { PageHeaderProvider } from '@/contexts/PageHeaderContext';
import { SiteHeader } from '@/layouts/SiteHeader';
import { SiteFooter } from '@/layouts/SiteFooter';
import './MainLayout.css';

/** 主布局：顶栏 + 内容 + 底栏 */
export function MainLayout() {
  const { pathname, key: locationKey } = useLocation();
  const isFormPage =
    pathname.includes('/new') || pathname.endsWith('/edit') || pathname.includes('/draft/');

  return (
    <PageHeaderProvider>
      <div className={`main-layout ${isFormPage ? 'main-layout--form' : ''}`}>
        <InteractiveBackground />
        <SiteHeader />
        <main className={`main-layout__content ${isFormPage ? 'main-layout__content--form' : ''}`}>
          <ScrollRestoration />
          {/* key 强制随路由重挂载，避免 URL 变了但页面组件不更新 */}
          <Outlet key={`${pathname}-${locationKey}`} />
        </main>
        {!isFormPage && <SiteFooter />}
      </div>
    </PageHeaderProvider>
  );
}
