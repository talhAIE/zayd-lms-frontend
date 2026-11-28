import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronRight, Menu } from 'lucide-react';
import Logo from '../../assets/zayd-logo.png';
import { ARABIC_ACTIVITY_TITLES, arabicActivityPath } from './presentation';
import type { ArabicActivityId } from '../../types/arabic-reading.contract';
import './arabic-reading.css';

/** Visual Zayd shell only. Deliberately has no StudentLayout, API, analytics or auth effects. */
export function ArabicReadingShell({children}: {children: ReactNode}) {
  const [menu, setMenu] = useState(false), location = useLocation();
  useEffect(() => { setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const previous = document.title; document.title = 'القراءة العربية | زيد';
    return () => { document.title = previous; };
  }, []);
  return <div className="arabic-reading" lang="ar" dir="rtl">
    <a className="ar-skip" href="#arabic-main">انتقل إلى المحتوى</a>
    <header className="ar-topbar">
      <Link to="/student/arabic-reading" className="ar-brand" aria-label="زيد، اختيار نص القراءة العربية"><img src={Logo} alt="شعار زيد" /></Link>
      <span className="ar-topbar-title">القراءة العربية</span>
      <span className="ar-badge">نسخة تجريبية</span>
      <button type="button" className="ar-icon ar-menu" aria-label="قائمة النصوص" aria-expanded={menu} aria-controls="arabic-navigation" onClick={() => setMenu(!menu)}><Menu aria-hidden="true" /></button>
    </header>
    <div className="ar-layout">
      <nav id="arabic-navigation" className={`ar-sidebar ${menu ? 'ar-sidebar-open' : ''}`} aria-label="التنقل في القراءة العربية">
        <p className="ar-eyebrow">مساحة القراءة</p>
        <Link className={`ar-navlink ${location.pathname === '/student/arabic-reading' ? 'ar-nav-active' : ''}`} aria-current={location.pathname === '/student/arabic-reading' ? 'page' : undefined} to="/student/arabic-reading"><BookOpen aria-hidden="true" /> اختيار النص</Link>
        {(Object.entries(ARABIC_ACTIVITY_TITLES) as [ArabicActivityId, string][]).map(([id, title]) => <Link key={id} to={arabicActivityPath(id)}
          className={`ar-navlink ${location.pathname === arabicActivityPath(id) ? 'ar-nav-active' : ''}`} aria-current={location.pathname === arabicActivityPath(id) ? 'page' : undefined}><ChevronRight aria-hidden="true" />{title}</Link>)}
        <p className="ar-sidebar-note">تجربة مستقلة داخل زيد</p>
      </nav>
      <main id="arabic-main" className="ar-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  </div>;
}
