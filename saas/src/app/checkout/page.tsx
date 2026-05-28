'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';

export default function Checkout() {
  const [utr, setUtr] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Replace with your actual UPI ID and Name
  const upiId = 'ragavrida@okicici'; 
  const payeeName = 'CareerAI Pro';
  const amount = '499.00'; 
  const currency = 'INR';

  // The standard UPI intent URL
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=${currency}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length < 12) {
      alert('Please enter a valid 12-digit UTR number');
      return;
    }
    // In production, send this UTR to Supabase DB to mark for manual verification
    setSubmitted(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glows */}
      <div className="ambient-glow" style={{ top: '20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(13, 15, 18, 0) 60%)' }}></div>
      <div className="ambient-glow" style={{ bottom: '-10%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(13, 15, 18, 0) 60%)' }}></div>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem 2.5rem', zIndex: 1, position: 'relative' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Upgrade to Pro</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem' }}>₹{amount} / month</p>
        </div>

        {!submitted ? (
          <>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <QRCode value={upiUrl} size={200} />
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Scan with GPay, PhonePe, or Paytm.<br/>0% Platform Fees.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Transaction ID (12-digit UTR)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 123456789012" 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }} 
                  required
                />
              </div>
              
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Verify Payment
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '2rem' }}>
              ✓
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Payment Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              We are verifying your transaction (UTR: {utr}). Your account will be upgraded shortly.
            </p>
            <Link href="/" className="btn-secondary">
              Return to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
