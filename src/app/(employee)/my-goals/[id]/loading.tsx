export default function MyGoalDetailLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.6 }}>
      <div style={{ height: '56px', background: '#1e2330', borderRadius: '8px', width: '300px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: '100px', background: '#1e2330', borderRadius: '16px' }} />)}
      </div>
      <div style={{ height: '400px', background: '#1e2330', borderRadius: '16px' }} />
    </div>
  )
}
