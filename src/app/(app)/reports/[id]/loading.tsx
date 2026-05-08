export default function ReportDetailLoading() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', opacity: 0.6 }}>
      <div style={{ height: '40px', background: '#1e2330', borderRadius: '8px', width: '240px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '160px', background: '#1e2330', borderRadius: '16px' }} />
          <div style={{ height: '300px', background: '#1e2330', borderRadius: '16px' }} />
        </div>
        <div style={{ height: '480px', background: '#1e2330', borderRadius: '16px' }} />
      </div>
    </div>
  )
}
