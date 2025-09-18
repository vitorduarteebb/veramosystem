import React from 'react';

export default function SimpleChart({ data, title }) {
  const maxValue = Math.max(...(data?.values || [1, 2, 3, 4, 5, 6]));
  const values = data?.values || [1, 2, 3, 4, 5, 6];
  const labels = data?.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-[#1a2a1a] mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-between gap-2">
        {values.map((value, index) => {
          const height = (value / maxValue) * 200; // Altura máxima de 200px
          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div 
                className="bg-gradient-to-t from-[#bfa15a] to-[#a68b4a] rounded-t-lg w-full transition-all duration-500 hover:from-[#a68b4a] hover:to-[#8b6f3a]"
                style={{ height: `${height}px` }}
                title={`${labels[index]}: ${value}`}
              ></div>
              <span className="text-xs text-[#23281a] font-medium">{labels[index]}</span>
              <span className="text-xs text-gray-600">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
