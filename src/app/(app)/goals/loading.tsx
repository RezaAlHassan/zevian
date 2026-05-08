export default function GoalsLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', opacity: 0.6 }}>
      <div style={{ height: '40px', background: '#1e2330', borderRadius: '8px', width: '160px' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: '36px', background: '#1e2330', borderRadius: '8px', width: '100px' }} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ height: '72px', background: '#1e2330', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )
}
