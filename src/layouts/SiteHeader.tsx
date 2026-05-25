import { NavLink } from 'react-router-dom';
import { ThemeSettingsButton } from '@/components/common/ThemeSettingsButton';
import { NAV_LINKS, SITE } from '@/constants/site';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import './SiteHeader.css';

/** 站点顶栏导航 */
export function SiteHeader() {
  const { header } = usePageHeader();
  const tagline =
    header?.section && header.action
      ? `${header.section} · ${header.action}`
      : SITE.tagline;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__brand">
          <span className="site-header__logo">{SITE.name}</span>
          <span className="site-header__tagline">{tagline}</span>
        </NavLink>
        <div className="site-header__actions">
          <nav className="site-header__nav">
            {NAV_LINKS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `site-header__link ${isActive ? 'site-header__link--active' : ''}`
                }
                end={path === '/'}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <ThemeSettingsButton />
        </div>
      </div>
    </header>
  );
}
