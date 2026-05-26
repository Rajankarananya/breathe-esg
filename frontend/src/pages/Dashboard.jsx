import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

const containerStyle = {
  padding: '40px',
  background: '#070a13',
  minHeight: 'calc(100vh - 73px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
}

const filterCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 32px',
  background: '#0f1524',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  flexWrap: 'wrap',
  gap: '20px',
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '24px',
}

const statCardStyle = (glowColor) => ({
  background: '#0f1524',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.3)`,
  transition: 'all 0.3s ease',
  position: 'relative',
})

const dotStyle = (color, pulse = false) => ({
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: color,
  boxShadow: `0 0 10px ${color}`,
  animation: pulse ? 'statusPulse 2s infinite' : 'none',
})

const actionButtonStyle = (bgColor, textColor, hoverGlow) => ({
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  background: bgColor,
  color: textColor,
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '700',
  fontFamily: 'var(--font-heading)',
  transition: 'all 0.2s ease',
  boxShadow: 'none',
})

// Styles for custom visual drawer
const drawerStyle = {
  background: '#0f1524',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '28px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const codeBlockStyle = {
  background: '#070a13',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  padding: '16px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: '#c9d1d9',
  overflowX: 'auto',
  maxHeight: '220px',
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [sourceType, setSourceType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const fetchRecords = async () => {
    const params = new URLSearchParams()
    params.append('tenant_id', '1')
    params.append('page', String(page))
    if (statusFilter) {
      params.append('status', statusFilter)
    }
    if (sourceType) {
      params.append('source_type', sourceType)
    }

    const response = await client.get(`/api/records/?${params.toString()}`)
    return response.data
  }

  const { data, isLoading } = useQuery({
    queryKey: ['records', page, sourceType, statusFilter],
    queryFn: fetchRecords,
  })

  const mutation = useMutation({
    mutationFn: ({ recordId, status }) =>
      client.patch(`/api/records/${recordId}/`, { status }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      // Update selected record preview if it was updated
      if (selectedRecord && selectedRecord.id === response.data.id) {
        setSelectedRecord(response.data)
      }
    },
  })

  const records = data?.results || []

  // High-fidelity calculations from loaded records
  const stats = useMemo(() => {
    const total = records.length
    const pending = records.filter((r) => r.status === 'PENDING').length
    const approved = records.filter((r) => r.status === 'APPROVED').length
    const flagged = records.filter((r) => r.status === 'FLAGGED').length
    
    // Live Dynamic sums by scopes
    let scope1Sum = 0
    let scope2Sum = 0
    let scope3Sum = 0
    records.forEach((r) => {
      const val = Number(r.quantity) || 0
      if (r.scope === 'SCOPE_1') scope1Sum += val
      else if (r.scope === 'SCOPE_2') scope2Sum += val
      else if (r.scope === 'SCOPE_3') scope3Sum += val
    })

    return { total, pending, approved, flagged, scope1Sum, scope2Sum, scope3Sum }
  }, [records])

  const handleAction = (recordId, status, e) => {
    e.stopPropagation() // Prevent row click opening drawer
    mutation.mutate({ recordId, status })
  }

  const goNext = () => {
    if (data?.next) {
      setPage((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  const totalEmissionsShare = Math.max(1, stats.scope1Sum + stats.scope2Sum + stats.scope3Sum)
  const pct1 = Math.round((stats.scope1Sum / totalEmissionsShare) * 100)
  const pct2 = Math.round((stats.scope2Sum / totalEmissionsShare) * 100)
  const pct3 = Math.round((stats.scope3Sum / totalEmissionsShare) * 100)

  return (
    <div style={containerStyle}>
      {/* Styles Injection for Animation */}
      <style>{`
        @keyframes statusPulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .row-hover {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .row-hover:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .select-glow:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Audit Dashboard</h1>
          <p style={{ marginTop: '4px' }}>Real-time corporate carbon footprint auditing and record verification.</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.85rem' }}>
          <span style={{ color: '#64748b' }}>Active Tenant:</span> 
          <span style={{ fontWeight: '600', color: '#10b981' }}>Global Enterprise (ID: 1)</span>
        </div>
      </div>

      {/* Dynamic ESG Scope Summary Grid */}
      <div style={statsGridStyle}>
        {/* Scope 1 */}
        <div style={statCardStyle('#a855f7')} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#a855f7', letterSpacing: '0.05em' }}>Scope 1 • Direct Fuel</span>
            <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>SAP Ingestion</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.scope1Sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Total fuel parsed (Liters / kg)</p>
          </div>
        </div>

        {/* Scope 2 */}
        <div style={statCardStyle('#10b981')} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.05em' }}>Scope 2 • Indirect Utility</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>Utility Meters</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.scope2Sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Electricity parsed (kWh)</p>
          </div>
        </div>

        {/* Scope 3 */}
        <div style={statCardStyle('#6366f1')} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#6366f1', letterSpacing: '0.05em' }}>Scope 3 • Travel & Logistics</span>
            <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>Business Trips</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.scope3Sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Travel distance logged (km)</p>
          </div>
        </div>
      </div>

      {/* Scope Share Glowing Visual Indicator */}
      <div style={{ ...filterCardStyle, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
          <span>Carbon Footprint Distribution (Records Ingested)</span>
          <span>{pct1 || 0}% Scope 1  |  {pct2 || 0}% Scope 2  |  {pct3 || 0}% Scope 3</span>
        </div>
        <div style={{ display: 'flex', height: '10px', background: '#070a13', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${pct1 || 0}%`, background: '#a855f7', transition: 'all 0.5s ease' }} />
          <div style={{ width: `${pct2 || 0}%`, background: '#10b981', transition: 'all 0.5s ease' }} />
          <div style={{ width: `${pct3 || 0}%`, background: '#6366f1', transition: 'all 0.5s ease' }} />
        </div>
      </div>

      {/* Advanced Interactive Filter panel */}
      <div style={filterCardStyle}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label>Source Pipeline</label>
            <select
              value={sourceType}
              onChange={(e) => {
                setPage(1)
                setSourceType(e.target.value)
              }}
              style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', padding: '8px 16px', outline: 'none', cursor: 'pointer' }}
              className="select-glow"
            >
              <option value="">ALL PIPELINES</option>
              <option value="SAP">SAP ERP</option>
              <option value="UTILITY">UTILITY METERS</option>
              <option value="TRAVEL">BUSINESS TRAVEL</option>
            </select>
          </div>

          <div>
            <label>Verification Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
              style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', padding: '8px 16px', outline: 'none', cursor: 'pointer' }}
              className="select-glow"
            >
              <option value="">ALL STATUSES</option>
              <option value="PENDING">PENDING REVIEW</option>
              <option value="APPROVED">APPROVED & LOCKED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="FLAGGED">FLAGGED ANOMALIES</option>
            </select>
          </div>
        </div>

        {/* Real-time Validation Summary badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#94a3b8' }}>Verified:</span> <strong style={{ color: '#10b981' }}>{stats.approved}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#94a3b8' }}>Unverified:</span> <strong style={{ color: '#f59e0b' }}>{stats.pending}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#94a3b8' }}>Flagged:</span> <strong style={{ color: '#f43f5e' }}>{stats.flagged}</strong>
          </span>
        </div>
      </div>

      {/* Main Container: Records Table & Collapsible Audit Detail Drawer */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Table Container */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '16px' }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading secure ESG records...</div>
            ) : records.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records match the active query.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Activity Date</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Source</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Scope</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Quantity</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Unit</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</th>
                    <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const isSelected = selectedRecord?.id === record.id
                    return (
                      <tr 
                        key={record.id} 
                        onClick={() => setSelectedRecord(record)}
                        className="row-hover"
                        style={{ 
                          background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                          transition: 'background 0.2s ease',
                          borderBottom: '1px solid rgba(255,255,255,0.03)'
                        }}
                      >
                        <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: '500' }}>{record.activity_date}</td>
                        <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                          <span style={{ 
                            background: record.source_type === 'SAP' ? 'rgba(168, 85, 247, 0.08)' : record.source_type === 'UTILITY' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                            color: record.source_type === 'SAP' ? '#c084fc' : record.source_type === 'UTILITY' ? '#34d399' : '#818cf8',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {record.source_type}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '0.875rem', color: '#94a3b8' }}>{record.scope}</td>
                        <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: '600' }}>{Number(record.quantity).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>{record.unit}</td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge badge-${record.status.toLowerCase()}`}>
                            {record.status === 'APPROVED' ? (
                              <span style={dotStyle('#10b981')}></span>
                            ) : record.status === 'PENDING' ? (
                              <span style={dotStyle('#f59e0b', true)}></span>
                            ) : record.status === 'FLAGGED' ? (
                              <span style={dotStyle('#f59e0b', true)}></span>
                            ) : (
                              <span style={dotStyle('#f43f5e')}></span>
                            )}
                            {record.is_locked ? '🔒 ' : ''}
                            {record.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              style={actionButtonStyle('rgba(16, 185, 129, 0.1)', '#10b981', 'rgba(16, 185, 129, 0.3)')}
                              disabled={record.is_locked || mutation.isPending}
                              onClick={(e) => handleAction(record.id, 'APPROVED', e)}
                              onMouseEnter={(e) => { e.target.style.background = '#10b981'; e.target.style.color = '#ffffff' }}
                              onMouseLeave={(e) => { e.target.style.background = 'rgba(16, 185, 129, 0.1)'; e.target.style.color = '#10b981' }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              style={actionButtonStyle('rgba(244, 63, 94, 0.08)', '#f43f5e', 'rgba(244, 63, 94, 0.2)')}
                              disabled={record.is_locked || mutation.isPending}
                              onClick={(e) => handleAction(record.id, 'REJECTED', e)}
                              onMouseEnter={(e) => { e.target.style.background = '#f43f5e'; e.target.style.color = '#ffffff' }}
                              onMouseLeave={(e) => { e.target.style.background = 'rgba(244, 63, 94, 0.08)'; e.target.style.color = '#f43f5e' }}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              style={actionButtonStyle('rgba(245, 158, 11, 0.08)', '#f59e0b', 'rgba(245, 158, 11, 0.2)')}
                              disabled={record.is_locked || mutation.isPending}
                              onClick={(e) => handleAction(record.id, 'FLAGGED', e)}
                              onMouseEnter={(e) => { e.target.style.background = '#f59e0b'; e.target.style.color = '#ffffff' }}
                              onMouseLeave={(e) => { e.target.style.background = 'rgba(245, 158, 11, 0.08)'; e.target.style.color = '#f59e0b' }}
                            >
                              Flag
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f1524', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Page: <strong>{page}</strong></span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={goPrev} 
                style={actionButtonStyle(page === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', '#f8fafc')} 
                disabled={page === 1}
              >
                Previous
              </button>
              <button 
                type="button" 
                onClick={goNext} 
                style={actionButtonStyle(!data?.next ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', '#f8fafc')} 
                disabled={!data?.next}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Audit Details Panel (Drawer component) */}
        <div style={{ flex: '1 1 340px', position: 'sticky', top: '120px' }}>
          {selectedRecord ? (
            <div style={drawerStyle} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Record Diagnostics</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Record Reference ID: #{selectedRecord.id}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Status & Properties */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Record Status:</span>
                  <span className={`badge badge-${selectedRecord.status.toLowerCase()}`}>{selectedRecord.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Date of Activity:</span>
                  <span style={{ color: '#f8fafc', fontWeight: '500' }}>{selectedRecord.activity_date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Lock Protection:</span>
                  <span style={{ color: selectedRecord.is_locked ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                    {selectedRecord.is_locked ? '🛡️ PROTECTED / LOCKED' : '🔓 OPEN FOR EDITS'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Audit Log Count:</span>
                  <span style={{ color: '#f8fafc', fontWeight: '600' }}>{selectedRecord.audit_entries_count ?? 0} updates</span>
                </div>
              </div>

              {/* Raw Ingestion Data Details */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span> Ingested Metadata properties
                </h4>
                <div style={codeBlockStyle}>
                  {JSON.stringify(selectedRecord.extra, null, 2)}
                </div>
              </div>

              {/* Ingestion Source Audit Trace */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚙️</span> Raw parsed line fields
                </h4>
                <div style={codeBlockStyle}>
                  {JSON.stringify(selectedRecord.raw_record, null, 2)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...drawerStyle, padding: '40px 24px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} className="glass-panel">
              <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>📊</div>
              <h3 style={{ fontSize: '1rem', marginTop: '16px', color: '#f8fafc' }}>No Record Selected</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Click any record row in the table to display diagnostic details, trace logs, and metadata properties.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
