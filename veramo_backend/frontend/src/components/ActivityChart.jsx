import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ActivityChart({ data, title }) {
  const chartData = {
    labels: data?.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Homologações',
        data: data?.values || [12, 19, 3, 5, 2, 3],
        borderColor: '#bfa15a',
        backgroundColor: 'rgba(191, 161, 90, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#23281a',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#23281a',
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-[#1a2a1a] mb-4">{title}</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}