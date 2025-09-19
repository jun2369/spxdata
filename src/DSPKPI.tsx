import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import './DSPKPI.css';

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

interface DSPKPIProps {
  data: RouteData[];
  onBack: () => void;
}

interface KPIData {
  fleeName: string;
  statusCounts: { [key: string]: number };
  total: number;
  successRate: number;
  attemptRate: number;
  failureRate: number;
}

interface TimeSeriesData {
  date: string;
  delivered: number;
  attempted: number;
  failed: number;
  total: number;
}

const DSPKPI: React.FC<DSPKPIProps> = ({ data, onBack }) => {
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [selectedFlee, setSelectedFlee] = useState<string>('all');
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [viewType, setViewType] = useState<'overview' | 'details'>('overview');
  const [sortConfig, setSortConfig] = useState<{
    key: 'fleeName' | 'total' | 'successRate';
    direction: 'asc' | 'desc';
  }>({ key: 'total', direction: 'desc' });

  useEffect(() => {
    // Process KPI data by FleeName
    const fleeMap = new Map<string, { [key: string]: number }>();
    const dateMap = new Map<string, { [key: string]: number }>();
    
    data.forEach(item => {
      const fleeName = item.FleeName || 'Unknown';
      if (!fleeMap.has(fleeName)) {
        fleeMap.set(fleeName, {});
      }
      
      const statusCounts = fleeMap.get(fleeName)!;
      // Only count FinalStatus with values, no default values
      if (item.FinalStatus && item.FinalStatus.trim() !== '') {
        const status = item.FinalStatus;
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Process time series data
        if (item.CompleteTime) {
          const date = item.CompleteTime.split(' ')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, {});
          }
          const dateCounts = dateMap.get(date)!;
          dateCounts[status] = (dateCounts[status] || 0) + 1;
        }
      }
    });

    // Calculate KPI metrics
    const kpiResults: KPIData[] = Array.from(fleeMap.entries()).map(([fleeName, statusCounts]) => {
      const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      const delivered = statusCounts['DELIVERED'] || 0;
      // Dynamically calculate other failure types
      const failedAttempt = statusCounts['FAILED_ATTEMPT'] || 0;
      const misSortReturn = statusCounts['MIS_SORT_RETURN'] || 0;
      const returnedSortCenter = statusCounts['RETURNED_SORT_CENTER'] || 0;
      const otherFailed = failedAttempt + misSortReturn + returnedSortCenter;
      
      return {
        fleeName,
        statusCounts,
        total,
        successRate: total > 0 ? (delivered / total) * 100 : 0,
        attemptRate: 0, // No longer using ATTEMPTED
        failureRate: total > 0 ? (otherFailed / total) * 100 : 0
      };
    });

    // Process time series
    const timeResults: TimeSeriesData[] = Array.from(dateMap.entries())
      .map(([date, counts]) => {
        const delivered = counts['DELIVERED'] || 0;
        const failedAttempt = counts['FAILED_ATTEMPT'] || 0;
        const misSortReturn = counts['MIS_SORT_RETURN'] || 0;
        const returnedSortCenter = counts['RETURNED_SORT_CENTER'] || 0;
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        
        return {
          date,
          delivered,
          attempted: 0, // No longer used
          failed: failedAttempt + misSortReturn + returnedSortCenter,
          total
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    setKpiData(kpiResults.sort((a, b) => b.total - a.total));
    setTimeSeriesData(timeResults);
  }, [data]);

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'DELIVERED': '#10b981',
      'FAILED_ATTEMPT': '#ef4444',
      'MIS_SORT_RETURN': '#f59e0b',
      'RETURNED_SORT_CENTER': '#8b5cf6',
      'PENDING': '#6b7280',
      'IN_TRANSIT': '#3b82f6'
    };
    // Use default color for undefined statuses
    return colors[status] || '#94a3b8';
  };

  const getOverallStats = () => {
    const allData = selectedFlee === 'all' 
      ? kpiData 
      : kpiData.filter(k => k.fleeName === selectedFlee);
    
    const totalPackages = allData.reduce((sum, item) => sum + item.total, 0);
    const totalDelivered = allData.reduce((sum, item) => sum + (item.statusCounts['DELIVERED'] || 0), 0);
    
    // Dynamically count all non-DELIVERED statuses
    const allStatuses: { [key: string]: number } = {};
    allData.forEach(item => {
      Object.entries(item.statusCounts).forEach(([status, count]) => {
        if (status !== 'DELIVERED') {
          allStatuses[status] = (allStatuses[status] || 0) + count;
        }
      });
    });
    
    const totalOtherStatuses = Object.values(allStatuses).reduce((sum, count) => sum + count, 0);
    
    return {
      totalPackages,
      totalDelivered,
      totalOtherStatuses,
      allStatuses,
      overallSuccessRate: totalPackages > 0 ? (totalDelivered / totalPackages) * 100 : 0
    };
  };

  const getPieChartData = () => {
    const selectedData = selectedFlee === 'all' 
      ? kpiData 
      : kpiData.filter(k => k.fleeName === selectedFlee);
    
    const aggregatedStatus: { [key: string]: number } = {};
    selectedData.forEach(item => {
      Object.entries(item.statusCounts).forEach(([status, count]) => {
        aggregatedStatus[status] = (aggregatedStatus[status] || 0) + count;
      });
    });
    
    return Object.entries(aggregatedStatus).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const { totalPackages, totalDelivered, totalOtherStatuses, allStatuses, overallSuccessRate } = getOverallStats();

  // Get top two non-DELIVERED statuses for display
  const topOtherStatuses = Object.entries(allStatuses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  // Sorting functionality
  const handleSort = (key: 'fleeName' | 'total' | 'successRate') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sorted data
  const getSortedData = () => {
    const dataToSort = selectedFlee === 'all' ? kpiData : kpiData.filter(k => k.fleeName === selectedFlee);
    
    return [...dataToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch(sortConfig.key) {
        case 'fleeName':
          aValue = a.fleeName.toLowerCase();
          bValue = b.fleeName.toLowerCase();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.01) return null; // Don't show labels for less than 1%
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Distance of labels from pie chart
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#2d3748" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 500 }}
      >
        {`${name}: ${(percent * 100).toFixed(2)}%`}
      </text>
    );
  };

  return (
    <div className="dsp-kpi-container">
      <div className="kpi-header">
        <h1 className="kpi-title">📊 Delivery Performance Dashboard</h1>
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewType === 'overview' ? 'active' : ''}`}
              onClick={() => setViewType('overview')}
            >
              Overview
            </button>
            <button 
              className={`toggle-btn ${viewType === 'details' ? 'active' : ''}`}
              onClick={() => setViewType('details')}
            >
              Details
            </button>
          </div>
          <select 
            value={selectedFlee} 
            onChange={(e) => setSelectedFlee(e.target.value)}
            className="flee-select"
          >
            <option value="all">🚚 All Fleets</option>
            {kpiData.map(kpi => (
              <option key={kpi.fleeName} value={kpi.fleeName}>
                {kpi.fleeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-label">Total Packages</div>
            <div className="stat-value">{totalPackages.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{totalDelivered.toLocaleString()}</div>
            <div className="stat-percentage">{overallSuccessRate.toFixed(2)}%</div>
          </div>
        </div>
        
        {/* Dynamically show all non-DELIVERED statuses */}
        {Object.entries(allStatuses)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4) // Show maximum 4 other status cards
          .map(([status, count], index) => (
            <div key={status} className={`stat-card ${
              status === 'FAILED_ATTEMPT' ? 'danger' : 
              status === 'MIS_SORT_RETURN' ? 'warning' :
              status === 'RETURNED_SORT_CENTER' ? 'warning' : 
              'default'
            }`}>
              <div className="stat-icon">
                {status === 'FAILED_ATTEMPT' ? '❌' : 
                 status === 'MIS_SORT_RETURN' ? '↩️' :
                 status === 'RETURNED_SORT_CENTER' ? '🏭' : 
                 '⚠️'}
              </div>
              <div className="stat-content">
                <div className="stat-label">{status.replace(/_/g, ' ')}</div>
                <div className="stat-value">{count.toLocaleString()}</div>
              </div>
            </div>
          ))
        }
      </div>

      {viewType === 'overview' ? (
        <>
          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: '#8884d8',
                      strokeWidth: 1,
                    }}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Top Fleet Performance</h3>
              <div style={{ padding: '20px', height: '600px', overflowY: 'auto' }}>
                {kpiData
                  .slice(0, 10)
                  .sort((a, b) => b.successRate - a.successRate)
                  .map((item, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '140px', 
                          fontSize: '11px', 
                          color: '#4a5568',
                          textAlign: 'right',
                          paddingRight: '10px',
                          flexShrink: 0,
                          fontWeight: '600'
                        }}>
                          {item.fleeName}
                        </div>
                        <div style={{ 
                          flex: 1, 
                          height: '30px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${item.successRate}%`,
                            backgroundColor: item.successRate >= 90 ? '#10b981' : '#f59e0b',
                            borderRadius: '0 8px 8px 0',
                            transition: 'width 0.5s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px'
                          }}>
                          </div>
                          <span style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#2d3748'
                          }}>
                            {item.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginTop: '30px',
                  paddingLeft: '150px',
                  gap: '20px',
                  fontSize: '11px',
                  color: '#718096'
                }}>
                  <span>0%</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                  <span>20%</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                  <span>40%</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                  <span>60%</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                  <span>80%</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Chart */}
          {timeSeriesData.length > 0 && (
            <div className="chart-card full-width">
              <h3 className="chart-title">Delivery Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Delivered" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Other Status" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        /* Details Table */
        <div className="table-container">
          <h3 className="table-title">Fleet Performance Details</h3>
          <div className="table-wrapper">
            <table className="kpi-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('fleeName')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Fleet Name 
                    {sortConfig.key === 'fleeName' && (
                      <span style={{ marginLeft: '5px' }}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    onClick={() => handleSort('total')}
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                  >
                    Total
                    {sortConfig.key === 'total' && (
                      <span style={{ marginLeft: '5px' }}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th style={{ textAlign: 'center' }}>Delivered</th>
                  {/* Dynamically generate column headers for other statuses */}
                  {Array.from(new Set(
                    kpiData.flatMap(kpi => Object.keys(kpi.statusCounts))
                  ))
                    .filter(status => status !== 'DELIVERED')
                    .sort()
                    .slice(0, 4) // Show maximum 4 other statuses
                    .map(status => (
                      <th key={status} style={{ textAlign: 'center' }}>{status.replace(/_/g, ' ')}</th>
                    ))
                  }
                  <th 
                    onClick={() => handleSort('successRate')}
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                  >
                    Success Rate
                    {sortConfig.key === 'successRate' && (
                      <span style={{ marginLeft: '5px' }}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedData()
                  .map((kpi, index) => {
                    // Get all non-DELIVERED statuses
                    const otherStatuses = Array.from(new Set(
                      kpiData.flatMap(k => Object.keys(k.statusCounts))
                    ))
                      .filter(status => status !== 'DELIVERED')
                      .sort()
                      .slice(0, 4);
                    
                    return (
                      <tr key={index}>
                        <td className="fleet-name">{kpi.fleeName}</td>
                        <td style={{ textAlign: 'center' }}>{kpi.total.toLocaleString()}</td>
                        <td className="success-text" style={{ textAlign: 'center' }}>{(kpi.statusCounts['DELIVERED'] || 0).toLocaleString()}</td>
                        {/* Dynamically show data for other statuses */}
                        {otherStatuses.map(status => (
                          <td key={status} className={
                            status === 'FAILED_ATTEMPT' ? 'danger-text' : 
                            status === 'MIS_SORT_RETURN' ? 'warning-text' :
                            status === 'RETURNED_SORT_CENTER' ? 'warning-text' : 
                            'danger-text'
                          } style={{ textAlign: 'center' }}>
                            {(kpi.statusCounts[status] || 0).toLocaleString()}
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`rate-badge ${kpi.successRate >= 90 ? 'excellent' : kpi.successRate >= 70 ? 'good' : 'poor'}`}>
                            {kpi.successRate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSPKPI;