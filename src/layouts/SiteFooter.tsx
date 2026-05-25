import { SITE } from '@/constants/site';
import './SiteFooter.css';

/** 站点页脚 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__text">
        © {new Date().getFullYear()} {SITE.author} · {SITE.description}
      </p>
    </footer>
  );
}
