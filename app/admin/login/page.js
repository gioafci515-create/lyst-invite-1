import { redirect } from 'next/navigation';
import { checkPassword, isAdmin, startSession } from '../../../lib/auth';

export const metadata = { title: 'Admin sign in — LYST / 06', robots: { index: false } };

async function login(formData) {
  'use server';
  if (checkPassword(formData.get('password'))) {
    await startSession();
    redirect('/admin');
  }
  redirect('/admin/login?error=1');
}

export default async function LoginPage({ searchParams }) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;

  return (
    <main className="admin admin--login">
      <form className="admin__login" action={login}>
        <p className="footer__mark">LYST / admin</p>
        <h1>Sign in</h1>
        <label>
          Password
          <input type="password" name="password" required autoFocus autoComplete="current-password" />
        </label>
        {error && <p className="admin__error" role="alert">Wrong password.</p>}
        <button className="pill" type="submit">Enter</button>
      </form>
    </main>
  );
}
