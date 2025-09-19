import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Missing.css';

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

interface MissingProps {
  data: RouteData[];
  onBack: () => void;
}

interface FleetMissingData {
  fleeName: string;
  missingCount: number;
  uniqueParcels: Set<string>;
  parcels: string[];
  percentage: number;
}

interface SummaryStats {
  totalMissing: number;
  totalUniqueFleets: number;
  totalUniqueParcels: number;
  avgMissingPerFleet: number;
}

const Missing: React.FC<MissingProps> = ({ data, onBack }) => {
  const [fleetData, setFleetData] = useState<FleetMissingData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalMissing: 0,
    totalUniqueFleets: 0,
    totalUniqueParcels: 0,
    avgMissingPerFleet: 0
  });
  const [selectedFleet, setSelectedFleet] = useState<string>('all');
  const [expandedFleets, setExpandedFleets] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Process missing data by FleeName and TrackingNo
    const fleetMap = new Map<string, FleetMissingData>();
    const allUniqueParcels = new Set<string>();
    
    data.forEach(item => {
      const fleeName = item.FleeName || 'Unknown';
      const trackingNo = item.TrackingNo || 'No Tracking';
      
      if (!fleetMap.has(fleeName)) {
        fleetMap.set(fleeName, {
          fleeName,
          missingCount: 0,
          uniqueParcels: new Set(),
          parcels: [],
          percentage: 0
        });
      }
      
      const fleetInfo = fleetMap.get(fleeName)!;
      fleetInfo.missingCount++;
      fleetInfo.uniqueParcels.add(trackingNo);
      fleetInfo.parcels.push(trackingNo);
      allUniqueParcels.add(trackingNo);
    });

    // Convert to array and calculate percentages
    const totalMissing = data.length;
    const fleetArray = Array.from(fleetMap.values()).map(fleet => ({
      ...fleet,
      percentage: totalMissing > 0 ? (fleet.missingCount / totalMissing) * 100 : 0
    }));

    // Calculate summary statistics
    const stats: SummaryStats = {
      totalMissing,
      totalUniqueFleets: fleetArray.length,
      totalUniqueParcels: allUniqueParcels.size,
      avgMissingPerFleet: fleetArray.length > 0 ? totalMissing / fleetArray.length : 0
    };

    setFleetData(fleetArray.sort((a, b) => b.missingCount - a.missingCount));
    setSummaryStats(stats);
  }, [data]);

  const getFilteredData = () => {
    let filtered = selectedFleet === 'all' 
      ? fleetData 
      : fleetData.filter(f => f.fleeName === selectedFleet);

    // Always sort by count in descending order
    filtered.sort((a, b) => b.missingCount - a.missingCount);

    return filtered;
  };

  const getChartData = () => {
    return getFilteredData().slice(0, 10).map(fleet => ({
      name: fleet.fleeName.length > 15 ? fleet.fleeName.substring(0, 15) + '...' : fleet.fleeName,
      count: fleet.missingCount,
      percentage: fleet.percentage
    }));
  };

  const getPieData = () => {
    const top5 = getFilteredData().slice(0, 5);
    const others = getFilteredData().slice(5);
    
    const pieData = top5.map(fleet => ({
      name: fleet.fleeName,
      value: fleet.missingCount
    }));
    
    if (others.length > 0) {
      const othersCount = others.reduce((sum, fleet) => sum + fleet.missingCount, 0);
      pieData.push({ name: 'Others', value: othersCount });
    }
    
    return pieData;
  };

  const COLORS = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const exportData = () => {
    const csvContent = [
      ['Fleet Name', 'Missing Count', 'Percentage'],
      ...getFilteredData().map(fleet => [
        fleet.fleeName,
        fleet.missingCount,
        fleet.percentage.toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing_data_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleFleetExpansion = (fleeName: string) => {
    const newExpanded = new Set(expandedFleets);
    if (newExpanded.has(fleeName)) {
      newExpanded.delete(fleeName);
    } else {
      newExpanded.add(fleeName);
    }
    setExpandedFleets(newExpanded);
  };

  return (
    <div className="missing-data-container">
      <div className="missing-header">
        <h1 className="missing-title">📦 Missing Status Analysis</h1>
        <div className="header-actions">
          {/* Fleet selector moved here */}
          <select 
            value={selectedFleet} 
            onChange={(e) => setSelectedFleet(e.target.value)}
            className="fleet-filter-header"
          >
            <option value="all">All Fleets</option>
            {fleetData.map(fleet => (
              <option key={fleet.fleeName} value={fleet.fleeName}>
                {fleet.fleeName} ({fleet.missingCount})
              </option>
            ))}
          </select>
          <button onClick={exportData} className="export-btn">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats - removed UNIQUE PARCELS card */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">🚫</div>
          <div className="summary-content">
            <div className="summary-label">Total Missing</div>
            <div className="summary-value">{summaryStats.totalMissing.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">🚚</div>
          <div className="summary-content">
            <div className="summary-label">Fleets</div>
            <div className="summary-value">{summaryStats.totalUniqueFleets}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-label">Avg per Fleet</div>
            <div className="summary-value">{Math.round(summaryStats.avgMissingPerFleet).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Removed Controls Bar */}

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-box">
          <h3 className="chart-heading">Top Missing Data by Fleet</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="url(#colorGradient)" 
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#667eea" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#764ba2" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3 className="chart-heading">Distribution Overview</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={getPieData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getPieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table - removed UNIQUE PARCELS and SAMPLE TRACKING NUMBERS columns */}
      <div className="detail-table-container">
        <h3 className="table-heading">Fleet Missing Data Details</h3>
        <div className="table-scroll">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Fleet Name</th>
                <th>Missing Count</th>
                <th>Percentage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData().map((fleet, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="fleet-cell">{fleet.fleeName}</td>
                    <td className="count-cell">{fleet.missingCount.toLocaleString()}</td>
                    <td>
                      <div className="percentage-cell">
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill"
                            style={{ width: `${fleet.percentage}%` }}
                          />
                        </div>
                        <span className="percentage-text">{fleet.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`view-btn ${expandedFleets.has(fleet.fleeName) ? 'expanded' : ''}`}
                        onClick={() => toggleFleetExpansion(fleet.fleeName)}
                      >
                        {expandedFleets.has(fleet.fleeName) ? '▼ Hide Details' : '▶ View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedFleets.has(fleet.fleeName) && (
                    <tr className="expanded-row">
                      <td colSpan={4}>
                        <div className="expanded-content">
                          <div className="expanded-header">
                            <h4>All Tracking Numbers for {fleet.fleeName}</h4>
                            <span className="tracking-count">Total: {fleet.uniqueParcels.size} parcels</span>
                          </div>
                          <div className="tracking-grid">
                            {Array.from(fleet.uniqueParcels).map((tracking, idx) => (
                              <div key={idx} className="tracking-item">
                                <span className="tracking-number">{tracking}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Missing;