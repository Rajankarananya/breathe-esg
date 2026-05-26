import { useState } from 'react'
import client from '../api/client'

const containerStyle = {
  padding: '40px',
  background: '#070a13',
  minHeight: 'calc(100vh - 73px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '32px',
}

const cardStyle = {
  background: '#0f1524',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '20px',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
  position: 'relative',
}

const fileDropzoneStyle = (isDragging, fileSelected) => ({
  border: isDragging ? '2px dashed #6366f1' : fileSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px dashed rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '24px',
  background: fileSelected ? 'rgba(16, 185, 129, 0.02)' : isDragging ? 'rgba(99, 102, 241, 0.03)' : '#070a13',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
})

const buttonStyle = {
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#ffffff',
  fontWeight: '600',
  fontFamily: 'var(--font-heading)',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
}

const UploadSection = ({ title, description, endpoint, dataSourceId, color, sampleFields }) => {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tenant_id', '1')
    formData.append('data_source_id', String(dataSourceId))

    try {
      const response = await client.post(endpoint, formData)
      setResult(response.data)
    } catch (error) {
      setResult({ error: error?.response?.data || 'Upload failed' })
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div style={cardStyle} className="glass-panel">
      {/* Title & Description */}
      <div>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: color }}>●</span> {title}
        </h3>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '4px' }}>{description}</p>
      </div>

      {/* Styled Drag & Drop Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${dataSourceId}`).click()}
        style={fileDropzoneStyle(dragActive, !!file)}
        onMouseEnter={(e) => {
          if (!file) {
            e.currentTarget.style.borderColor = color
            e.currentTarget.style.boxShadow = `0 0 15px rgba(255, 255, 255, 0.02)`
          }
        }}
        onMouseLeave={(e) => {
          if (!file) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <input 
          id={`file-input-${dataSourceId}`}
          type="file" 
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {/* Upload Icon */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V8M12 8L9 11M12 8L15 11M20 15V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V15" stroke={file ? '#10b981' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {file ? (
          <div>
            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>✓ File Attached</div>
            <div style={{ color: '#f8fafc', fontSize: '0.75rem', marginTop: '2px', wordBreak: 'break-all' }}>{file.name}</div>
          </div>
        ) : (
          <div>
            <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.85rem' }}>Drag & drop file here</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>or click to browse local folders</div>
          </div>
        )}
      </div>

      {/* Recommended Fields Guideline */}
      <div style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Expected Columns</div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{sampleFields}</p>
      </div>

      {/* Action Button */}
      <button 
        type="button" 
        style={{
          ...buttonStyle,
          background: loading ? 'rgba(255,255,255,0.04)' : file ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.04)',
          color: file ? '#ffffff' : '#64748b',
          boxShadow: file ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
          cursor: file ? 'pointer' : 'not-allowed'
        }} 
        onClick={handleUpload} 
        disabled={loading || !file}
        onMouseEnter={(e) => {
          if (file && !loading) e.target.style.opacity = 0.95
        }}
        onMouseLeave={(e) => {
          if (file && !loading) e.target.style.opacity = 1
        }}
      >
        {loading ? 'Uploading Data...' : 'Process Dataset'}
      </button>

      {/* Ingestion Audit Results Visual Panel */}
      {result ? (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
          {result.error ? (
            <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.8rem' }}>
              <strong>Error Processing File:</strong>
              <div style={{ marginTop: '4px', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {JSON.stringify(result.error)}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem' }}>
                <span style={{ color: '#a7f3d0', fontWeight: '600' }}>Rows Ingested:</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>{result.row_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: result.error_count > 0 ? 'rgba(244, 63, 94, 0.06)' : 'rgba(255,255,255,0.03)', border: result.error_count > 0 ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem' }}>
                <span style={{ color: result.error_count > 0 ? '#fca5a5' : '#94a3b8', fontWeight: '600' }}>Validation Errors:</span>
                <span style={{ color: result.error_count > 0 ? '#f43f5e' : '#f8fafc', fontWeight: '700' }}>{result.error_count}</span>
              </div>
              
              {result.errors?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Audit Error Log Trace</div>
                  <div style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', maxHeight: '140px', overflowY: 'auto' }}>
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.75rem', color: '#f43f5e', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {result.errors.map((error, index) => (
                        <li key={index} style={{ wordBreak: 'break-all' }}>
                          Row {error.row ?? 'unknown'}: {error.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function Upload() {
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem' }}>Ingestion Center</h1>
        <p style={{ marginTop: '4px' }}>Upload raw corporate spreadsheets to validate, normalize, and load carbon records.</p>
      </div>

      <div style={gridStyle}>
        <UploadSection 
          title="SAP Direct Fuel" 
          description="Direct Scope 1 fuel logs. Parses date columns, fuel types, and standardizes volume and mass indices."
          endpoint="/api/ingest/sap/" 
          dataSourceId={1} 
          color="#a855f7"
          sampleFields="Buchungsdatum, Werk, Material, Menge, Mengeneinheit"
        />
        <UploadSection
          title="Utility Meter Energy"
          description="Indirect Scope 2 electricity logs. Parses meter indices, Account, and applies electric tariff scales."
          endpoint="/api/ingest/utility/"
          dataSourceId={2}
          color="#10b981"
          sampleFields="BillDate, MeterID, Consumption, Unit, PlantCode"
        />
        <UploadSection
          title="Travel & Logistics"
          description="Scope 3 corporate travel records. Parses travel class, trip modes, and computes geodesic distances."
          endpoint="/api/ingest/travel/"
          dataSourceId={3}
          color="#6366f1"
          sampleFields="TravelDate, Category, Origin, Destination, DistanceKM"
        />
      </div>
    </div>
  )
}
