import React, { useRef, useState, useEffect } from 'react';
import { Upload, Database, FileText, Link as LinkIcon, History, BarChart2 } from 'lucide-react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
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
  { name: "E-Commerce Sales", rows: "50,000", icon: <Database size={16}/> },
  { name: "Healthcare Records", rows: "1.2M", icon: <FileText size={16}/> },
  { name: "Global Logistics", rows: "300,000", icon: <BarChart2 size={16}/> },
];

const Home: React.FC<HomeProps> = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [init, setInit] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });

    const saved = localStorage.getItem('recentDatasets');
    if (saved) {
      try { setRecentFiles(JSON.parse(saved)); } catch (e) {}
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
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
    const file = new File([blob], `${name.replace(' ', '_').toLowerCase()}.csv`, { type: 'text/csv' });
    processFile(file);
  };

  return (
    <div className="home-view" style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto', overflowX: 'hidden'
    }}>
      
      {/* 3D Particle Background */}
      {init && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.4 }}>
          <Particles
            id="tsparticles"
            options={{
              background: { color: { value: "transparent" } },
              fpsLimit: 60,
              particles: {
                color: { value: "#8b5cf6" },
                links: { color: "#3b82f6", distance: 150, enable: true, opacity: 0.2, width: 1 },
                move: { enable: true, speed: 0.8 },
                number: { density: { enable: true }, value: 80 },
                opacity: { value: 0.3 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 3 } },
              },
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '800px', padding: '40px 20px', margin: 'auto' }}>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 16px 0', color: '#ffffff', lineHeight: '1.2' }}>
            Enterprise Data Intelligence
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            Upload your CSV to instantly generate beautiful dashboards, uncover AI insights, and query your data naturally.
          </p>
        </div>

        {/* Upload Area */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className="glass"
          style={{
            border: `2px dashed ${isDragging ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
            padding: '48px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            cursor: isLoading ? 'default' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isDragging ? '0 0 40px rgba(139, 92, 246, 0.2)' : 'none'
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <div className="spinner" style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Processing Dataset...</span>
                <motion.span 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
                >
                  {loadingMessages[loadingStep]}
                </motion.span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '50%' }}>
                <Upload size={40} color="#8b5cf6" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '600', margin: '0 0 8px 0' }}>{isDragging ? 'Drop it like it\'s hot!' : 'Click or drag CSV to upload'}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Supports up to 500MB • Secure local processing</p>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <LinkIcon size={14}/> URL
                </button>
                <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Database size={14}/> DB Connect
                </button>
              </div>
            </>
          )}
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} disabled={isLoading} />
        </div>

        {/* Bottom Bento Box (History & Demos) */}
        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', width: '100%' }}>
            
            {/* Recent Files */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><History size={16}/> Recent</h4>
              {recentFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentFiles.map((file, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#fff', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                      {file}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>No recent datasets</p>
              )}
            </div>

            {/* Demo Datasets */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={16}/> Demo Datasets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {demoDatasets.map((demo, i) => (
                  <div key={i} onClick={() => loadDemoDataset(demo.name)} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <div style={{ color: '#a5b4fc', marginBottom: '8px' }}>{demo.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{demo.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{demo.rows} rows</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
