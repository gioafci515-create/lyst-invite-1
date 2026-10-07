import Link from 'next/link';
import { logout } from './actions';

const LINKS = [
  ['/admin', 'RSVPs'],
  ['/admin/content', 'Guest content'],
  ['/admin/updates', 'Updates & settings'],
];

export default function AdminNav({ current, title }) {
  return (
    <header className="admin__bar">
      <div>
        <p className="footer__mark">LYST / admin</p>
        <h1>{title}</h1>
        <nav className="admin__tabs" aria-label="Admin sections">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} aria-current={current === href ? 'page' : undefined}>{label}</Link>
          ))}
        </nav>
      </div>
      <div className="admin__actions">
        {current === '/admin' && <a className="pill" href="/api/admin/export">Export CSV</a>}
        <form action={logout}><button className="admin__ghost" type="submit">Sign out</button></form>
      </div>
    </header>
  );
}
