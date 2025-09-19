import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './FileUpload';
import DSPKPI from './DSPKPI';
import Missing from './Missing';

export interface RouteData {
  POE: string;
  Route: string;
  Sequence: number;
  Address: string;
  Unit: string;
  ZipCode: string;
  TrackingNo: string;
  RecipientName: string;
  RecipientPhone: string;
  Status: string;
  FinalStatus: string;
  CompleteTime: string;
  Weight: number;
  WeightType: string;
  CourierCode: string;
  DspName: string;
  FleeName: string;
  DriverName: string;
  TransitMark: string;
  TransitTime: number;
  customerAccountId: number;
  customerAccountCode: string;
}

type PageView = 'upload' | 'kpi' | 'missing';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('upload');
  const [allData, setAllData] = useState<RouteData[]>([]);
  const [dataWithStatus, setDataWithStatus] = useState<RouteData[]>([]);
  const [dataWithoutStatus, setDataWithoutStatus] = useState<RouteData[]>([]);

  // Force override styles for proper width
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .main-content {
        max-width: 1850px !important;
        width: 100% !important;
        padding: 2rem !important;
        margin: 0 auto !important;
      }
      
      .dsp-kpi-container,
      .missing-data-container {
        max-width: 1850px !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      
      /* Ensure all child elements take full width */
      .kpi-header,
      .missing-header,
      .stats-grid,
      .summary-grid,
      .charts-grid,
      .charts-row,
      .controls-bar,
      .table-container,
      .detail-table-container {
        max-width: 100% !important;
        width: 100% !important;
      }
      
      /* Prevent body from having any restrictions */
      body {
        max-width: 100% !important;
        overflow-x: auto !important;
      }
      
      #root {
        max-width: 100% !important;
        width: 100% !important;
      }
      
      .App {
        max-width: 100% !important;
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleFileUpload = (data: RouteData[]) => {
    // Save all data
    setAllData(data);
    
    // Separate data: with and without FinalStatus
    const withStatus = data.filter(item => item.FinalStatus && item.FinalStatus.trim() !== '');
    const withoutStatus = data.filter(item => !item.FinalStatus || item.FinalStatus.trim() === '');
    
    setDataWithStatus(withStatus);
    setDataWithoutStatus(withoutStatus);
    
    console.log(`Data loaded - Total: ${data.length}, With Status: ${withStatus.length}, Without Status: ${withoutStatus.length}`);
    
    // Default to KPI page
    setCurrentPage('kpi');
  };

  const handleNavigation = (page: PageView) => {
    if (page !== 'upload' && allData.length === 0) {
      alert('Please upload a file first!');
      return;
    }
    setCurrentPage(page);
  };

  const handleReset = () => {
    setAllData([]);
    setDataWithStatus([]);
    setDataWithoutStatus([]);
    setCurrentPage('upload');
  };

  return (
    <div className="App">
      {/* Navigation Bar - only show when data exists and not on upload page */}
      {allData.length > 0 && currentPage !== 'upload' && (
        <nav className="nav-bar">
          <div className="nav-left">
            <h2 className="app-title">KPI Dashboard System</h2>
          </div>
          <div className="nav-center">
            <button 
              className={`nav-btn ${currentPage === 'kpi' ? 'active' : ''}`}
              onClick={() => handleNavigation('kpi')}
            >
              📊 Delivery KPI
              {dataWithStatus.length > 0 && (
                <span className="nav-badge">{dataWithStatus.length.toLocaleString()}</span>
              )}
            </button>
            <button 
              className={`nav-btn ${currentPage === 'missing' ? 'active' : ''}`}
              onClick={() => handleNavigation('missing')}
            >
              📦 Missing Data Analysis
              {dataWithoutStatus.length > 0 && (
                <span className="nav-badge">{dataWithoutStatus.length.toLocaleString()}</span>
              )}
            </button>
          </div>
          <div className="nav-right">
            <button className="nav-btn reset-btn" onClick={handleReset}>
              🔄 Upload New File
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {currentPage === 'upload' && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}
        
        {currentPage === 'kpi' && (
          <DSPKPI 
            data={dataWithStatus} 
            onBack={() => handleNavigation('missing')}
          />
        )}
        
        {currentPage === 'missing' && (
          <Missing
            data={dataWithoutStatus}
            onBack={() => handleNavigation('kpi')}
          />
        )}
      </main>

      {/* Footer - only show on upload page */}
      {currentPage === 'upload' && (
        <footer className="app-footer">
          <p>© 2024 KPI Dashboard System | Powered by React & TypeScript</p>
        </footer>
      )}
    </div>
  );
}

export default App;