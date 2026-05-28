'use client'
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGithubSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glows */}
      <div className="ambient-glow" style={{ top: '20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(13, 15, 18, 0) 60%)' }}></div>
      <div className="ambient-glow" style={{ bottom: '-10%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(13, 15, 18, 0) 60%)' }}></div>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', zIndex: 1, position: 'relative' }}>
        
        {/* Logo/Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1rem', boxShadow: '0 8px 24px var(--accent-glow)' }}>
            C
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem' }}>Sign in to continue to CareerAI</p>
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={handleGoogleSignIn} className="btn-secondary" style={{ width: '100%', display: 'flex', gap: '0.75rem', background: 'var(--bg-surface-elevated)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <button onClick={handleGithubSignIn} className="btn-secondary" style={{ width: '100%', display: 'flex', gap: '0.75rem', background: 'var(--bg-surface-elevated)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        {/* Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Email address</label>
            <input type="email" placeholder="you@example.com" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              <span>Password</span>
              <a href="#" style={{ color: 'var(--accent-color)' }}>Forgot?</a>
            </label>
            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} />
          </div>
          
          <Link href="/" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', textDecoration: 'none' }}>
            Sign In
          </Link>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <a href="#" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Sign up</a>
        </p>

      </div>
    </div>
  );
}
