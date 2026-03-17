/**
 * (auth) layout — centered, minimal shell for login/signup.
 * No sidebar or header. Full-page gradient background.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--color-bg)',
      // Subtle radial glow behind auth card
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,127,255,0.08), transparent)',
    }}>
      {children}
    </div>
  )
}
