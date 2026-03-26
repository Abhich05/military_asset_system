import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DemandForecastChart({ history, forecast }) {
  const data = useMemo(() => {
    const historyPoints = Array.isArray(history) ? history : [];
    const forecastPoints = Array.isArray(forecast) ? forecast : [];

    const labels = [
      ...historyPoints.map(p => p.date),
      ...forecastPoints.map(p => p.date)
    ];

    const historyValues = historyPoints.map(p => Number(p.value));
    const forecastValues = forecastPoints.map(p => Number(p.value));

    return {
      labels,
      datasets: [
        {
          label: 'History (net demand proxy)',
          data: historyValues.concat(Array(forecastValues.length).fill(null)),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          spanGaps: true,
          tension: 0.25
        },
        {
          label: 'Forecast',
          data: Array(historyValues.length).fill(null).concat(forecastValues),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          spanGaps: true,
          tension: 0.25
        }
      ]
    };
  }, [history, forecast]);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Forecast vs History</h3>
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }}
      />
    </div>
  );
}

