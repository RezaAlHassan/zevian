export default function ProjectDetailLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.6 }}>
      <div style={{ height: '56px', background: '#1e2330', borderRadius: '8px', width: '280px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '90px', background: '#1e2330', borderRadius: '16px' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div style={{ height: '360px', background: '#1e2330', borderRadius: '16px' }} />
        <div style={{ height: '360px', background: '#1e2330', borderRadius: '16px' }} />
      </div>
    </div>
  )
}
