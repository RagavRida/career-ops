import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            C
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>CareerAI</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <Link href="#" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', fontWeight: '500' }}>
            Pipeline
          </Link>
          <Link href="#" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
            Applications Tracker
          </Link>
          <Link href="#" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
            Digital Twin (CV)
          </Link>
          <Link href="#" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
            Analytics
          </Link>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Available Tokens</p>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>842</h3>
            <button className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>Upgrade Plan</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="ambient-glow"></div>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Good Morning, Raghavendra</h1>
            <p style={{ color: 'var(--text-secondary)' }}>You have 3 high-match roles waiting in your pipeline today.</p>
          </div>
          <button className="btn-primary">+ Scan Portals</button>
        </header>

        {/* Pipeline List */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Action Required</h2>
            <Link href="#" style={{ fontSize: '0.875rem' }}>View all →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Job Card 1 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '50%', width: '64px', height: '64px', color: 'var(--success)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>4.5</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Match</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>AI Product Manager</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bland AI • San Francisco, CA (Remote) • Estimated $150k-$200k</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>Agentic Workflows</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>Voice AI</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary">View Report</button>
                <button className="btn-primary">Auto-Apply ✨</button>
              </div>
            </div>

            {/* Job Card 2 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '50%', width: '64px', height: '64px', color: 'var(--accent-color)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>4.4</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Match</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>AI-Native Builder</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pocket FM • Remote • Estimated $130k-$160k</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>LLMs</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>Rapid Prototyping</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary">View Report</button>
                <button className="btn-primary">Auto-Apply ✨</button>
              </div>
            </div>

            {/* Job Card 3 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '50%', width: '64px', height: '64px', color: 'var(--warning)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>3.8</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Match</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Generative AI Trainee</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Infrabeat • Remote • Overqualified</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-tertiary)' }}>Entry Level</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary">View Report</button>
                <button className="btn-secondary" style={{ opacity: 0.5 }}>Skip</button>
              </div>
            </div>
            
          </div>
        </section>
      </main>
    </div>
  );
}
