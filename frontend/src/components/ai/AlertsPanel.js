import React from 'react';

export default function AlertsPanel({ alerts }) {
  const list = Array.isArray(alerts) ? alerts : [];
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>AI-Style Alerts</h3>
      {list.length === 0 ? (
        <div style={{ color: '#555' }}>No alerts generated for the current filters.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px' }}>Severity</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px' }}>Type</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px' }}>Date</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a, idx) => {
              const bg = a.severity === 'high' ? '#ffe5e5' : a.severity === 'medium' ? '#fff4e5' : '#eef7ff';
              const border = a.severity === 'high' ? '#ffb3b3' : a.severity === 'medium' ? '#ffd89b' : '#bcdcff';
              return (
                <tr key={`${a.type}-${a.date}-${idx}`}>
                  <td style={{ padding: '10px 6px', background: bg, borderTop: `1px solid ${border}` }}>
                    <b>{a.severity}</b>
                  </td>
                  <td style={{ padding: '10px 6px', borderTop: '1px solid #eee' }}>{a.type}</td>
                  <td style={{ padding: '10px 6px', borderTop: '1px solid #eee' }}>{a.date}</td>
                  <td style={{ padding: '10px 6px', borderTop: '1px solid #eee' }}>{a.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

