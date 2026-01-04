
import React from 'react';

interface SparklineProps {
  data: number[];
  color: string; // Hex or tailwind class mapping
  height?: number;
  width?: number;
  fill?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, height = 40, width = 120, fill = false }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Calculate points
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create fill path (close the loop at the bottom)
  const fillPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && (
        <polygon 
          points={fillPoints} 
          fill={color} 
          opacity={0.2} 
        />
      )}
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Blinking dot at the end */}
      <circle 
        cx={width} 
        cy={height - ((data[data.length - 1] - min) / range) * height} 
        r="3" 
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
};

export default Sparkline;
