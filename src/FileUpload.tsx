import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './FileUpload.css';

interface RouteData {
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

interface FileUploadProps {
  onFileUpload: (data: RouteData[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<RouteData>(worksheet);
      
      // Data validation
      if (jsonData.length === 0) {
        throw new Error('No data found in the file');
      }

      console.log(`Successfully loaded ${jsonData.length} records`);
      onFileUpload(jsonData);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please make sure it\'s a valid Excel file with data.');
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileRead(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleFileRead(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-card">
        <div className="upload-header">
          <h1 className="upload-title">
            <span className="title-icon">📊</span>
            KPI Dashboard System
          </h1>
          <p className="upload-subtitle">
            Upload your route parcel data to analyze delivery performance
          </p>
        </div>

        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${loading ? 'loading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Processing file...</p>
            </div>
          ) : (
            <>
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <div className="upload-text">
                <p className="upload-main-text">
                  Drag and drop your Excel file here
                </p>
                <p className="upload-or">OR</p>
                <button onClick={handleButtonClick} className="upload-button">
                  Browse Files
                </button>
              </div>

              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input"
                disabled={loading}
              />

              {fileName && (
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{fileName}</span>
                </div>
              )}

              <p className="upload-hint">
                Supported formats: .xlsx, .xls
              </p>
            </>
          )}
        </div>

        <div className="upload-footer">
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Delivery KPI Analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>Missing Data Detection</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;