export default function OrganizationLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', opacity: 0.6 }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '36px', background: '#1e2330', borderRadius: '8px', width: '110px' }} />)}
      </div>
      <div style={{ height: '200px', background: '#1e2330', borderRadius: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ height: '260px', background: '#1e2330', borderRadius: '16px' }} />
        <div style={{ height: '260px', background: '#1e2330', borderRadius: '16px' }} />
      </div>
    </div>
  )
}
