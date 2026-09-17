import React, { useRef, useState, useEffect } from 'react';
import { Upload, Database, FileText, BarChart2, History, FileSpreadsheet, FileType } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const loadingMessages = [
  "Parsing CSV Schema...",
  "Extracting Categories & Dates...",
  "Calculating KPIs & Trends...",
  "Generating AI Diagnostic Insights..."
];

const demoDatasets = [
  { name: "E-Commerce Sales", rows: "50,000", desc: "Orders, revenue, categories", icon: <Database size={18}/> },
  { name: "Healthcare Records", rows: "1.2M", desc: "Patients, departments, costs", icon: <FileText size={18}/> },
  { name: "Global Logistics", rows: "300,000", desc: "Shipments, origins, weights", icon: <BarChart2 size={18}/> },
];

// Floating elements data
const floatingItems = [
  // Icons — visible on light background
  { type: 'icon', content: 'csv', x: '6%', y: '18%', duration: 7, delay: 0, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { type: 'icon', content: 'xlsx', x: '88%', y: '22%', duration: 8, delay: 1, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { type: 'icon', content: 'chart', x: '78%', y: '72%', duration: 6.5, delay: 0.5, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { type: 'icon', content: 'db', x: '10%', y: '78%', duration: 8.5, delay: 1.5, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { type: 'icon', content: 'pdf', x: '92%', y: '50%', duration: 7.5, delay: 0.5, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { type: 'icon', content: 'csv', x: '4%', y: '48%', duration: 9, delay: 2, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  // Keywords — user requested these exact words
  { type: 'keyword', content: 'CSV', x: '15%', y: '28%', duration: 5.5, delay: 0, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { type: 'keyword', content: 'EXCEL', x: '82%', y: '35%', duration: 6.5, delay: 1.5, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { type: 'keyword', content: 'PDF', x: '68%', y: '14%', duration: 5, delay: 0.5, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { type: 'keyword', content: 'SQL', x: '20%', y: '65%', duration: 6, delay: 1, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { type: 'keyword', content: 'DATA', x: '75%', y: '58%', duration: 7, delay: 2, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { type: 'keyword', content: 'ANALYTICS', x: '30%', y: '88%', duration: 8, delay: 0.5, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { type: 'keyword', content: 'AI', x: '55%', y: '10%', duration: 4.5, delay: 0.5, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { type: 'keyword', content: 'KPI', x: '90%', y: '80%', duration: 5.5, delay: 1.2, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
  // Code snippets
  { type: 'snippet', content: 'SELECT * FROM', x: '5%', y: '42%', duration: 9, delay: 1.5, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { type: 'snippet', content: 'GROUP BY category', x: '72%', y: '88%', duration: 7.5, delay: 0.5, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { type: 'snippet', content: 'SUM(revenue)', x: '48%', y: '6%', duration: 6.5, delay: 1, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { type: 'snippet', content: 'ORDER BY date', x: '25%', y: '55%', duration: 8.5, delay: 2, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { type: 'snippet', content: 'AVG(cost)', x: '85%', y: '45%', duration: 7, delay: 0.5, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
];

const FloatingIcon = ({ content }: { content: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    csv: <FileText size={20} />,
    xlsx: <FileSpreadsheet size={20} />,
    chart: <BarChart2 size={20} />,
    db: <Database size={20} />,
    pdf: <FileType size={20} />,
  };
  return <div className="floating-icon">{iconMap[content] || <FileText size={20} />}</div>;
};

const Home: React.FC<HomeProps> = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('recentDatasets');
    if (saved) {
      try { setRecentFiles(JSON.parse(saved)); } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (file: File) => {
    const newRecent = [file.name, ...recentFiles.filter(f => f !== file.name)].slice(0, 3);
    setRecentFiles(newRecent);
    localStorage.setItem('recentDatasets', JSON.stringify(newRecent));
    onFileSelect(file);
  };

  const loadDemoDataset = (name: string) => {
    let csvContent = "";
    if (name === "E-Commerce Sales") {
      csvContent = "order_id,product_category,revenue,date\n1,Electronics,1200,2024-01-01\n2,Clothing,80,2024-01-02\n3,Electronics,950,2024-01-02\n4,Home,300,2024-01-03\n5,Clothing,120,2024-01-03\n6,Electronics,2100,2024-01-04";
    } else if (name === "Healthcare Records") {
      csvContent = "patient_id,department,cost,admission_date\n101,Cardiology,5000,2024-02-01\n102,Neurology,8000,2024-02-01\n103,Orthopedics,3000,2024-02-02\n104,Emergency,1200,2024-02-03";
    } else {
      csvContent = "shipment_id,origin,destination,weight_kg,cost\nS1,NY,LA,500,1200\nS2,TX,CHI,200,400\nS3,MIA,SEA,800,2100\nS4,NY,TX,450,900";
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], `${name.replace(/ /g, '_').toLowerCase()}.csv`, { type: 'text/csv' });
    processFile(file);
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
    }}>

      {/* Floating Background Elements */}
      {mounted && floatingItems.map((item, i) => (
        <div
          key={i}
          className={`floating-element ${mounted ? 'visible' : ''}`}
          style={{
            left: item.x,
            top: item.y,
            '--float-duration': `${item.duration}s`,
            '--float-delay': `${item.delay}s`,
            '--float-color': item.color,
            '--float-bg': item.bg,
            animationDelay: `${item.delay}s`,
          } as React.CSSProperties}
        >
          {item.type === 'icon' && <FloatingIcon content={item.content} />}
          {item.type === 'keyword' && <span className="floating-keyword">{item.content}</span>}
          {item.type === 'snippet' && <span className="floating-snippet">{item.content}</span>}
        </div>
      ))}

      {/* Main Content */}
      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px', width: '100%', maxWidth: '760px', padding: '40px 24px' }}>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{
            fontSize: '44px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #f1f5f9, #a78bfa, #6366f1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            Enterprise Data Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
            Upload your CSV to generate beautiful dashboards, uncover AI insights, and query data naturally.
          </p>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          whileHover={!isLoading ? { y: -6, scale: 1.01 } : {}}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`glass upload-card ${isDragging ? 'dragging' : ''}`}
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 1 }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.15)', borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Processing Dataset...</div>
                <motion.div
                  key={loadingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
                >
                  {loadingMessages[loadingStep]}
                </motion.div>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
                padding: '20px', borderRadius: '50%', zIndex: 1
              }}>
                <Upload size={36} color="var(--accent-tertiary)" />
              </div>
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {isDragging ? 'Drop your file here' : 'Click or drag CSV to upload'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                  Supports up to 500MB • Secure local processing
                </p>
              </div>
            </>
          )}
          <input
            type="file" ref={fileInputRef} style={{ display: 'none' }}
            accept=".csv" onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
            disabled={isLoading}
          />
        </motion.div>

        {/* Bottom Grid: Recent + Demos */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', width: '100%' }}
          >
            {/* Recent Files */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{
                margin: '0 0 14px 0', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <History size={14}/> Recent
              </h4>
              {recentFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentFiles.map((file, i) => (
                    <div key={i} style={{
                      fontSize: '13px', color: 'var(--text-secondary)', padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                      {file}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No recent datasets</p>
              )}
            </div>

            {/* Demo Datasets */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{
                margin: '0 0 14px 0', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Database size={14}/> Try a Demo
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {demoDatasets.map((demo, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => loadDemoDataset(demo.name)}
                    className="demo-card"
                  >
                    <div style={{ color: 'var(--accent-tertiary)', marginBottom: '10px' }}>{demo.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{demo.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{demo.desc}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', opacity: 0.6 }}>{demo.rows} rows</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Home;
