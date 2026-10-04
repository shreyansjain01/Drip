import React, { useEffect, useState } from 'react';

interface ConfettiDroplet {
  id: number;
  x: number; // percentage 0 - 100
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

interface Props {
  active: boolean;
  onComplete?: () => void;
}

export const ConfettiCelebration: React.FC<Props> = ({ active, onComplete }) => {
  const [droplets, setDroplets] = useState<ConfettiDroplet[]>([]);

  useEffect(() => {
    if (!active) {
      setDroplets([]);
      return;
    }

    const colors = ['#B8ACFA', '#D8D1FD', '#8E7DF0', '#FBF8EC', '#FFFFFF'];
    const count = 22; // 22 celebratory liquid droplets

    const newDroplets: ConfettiDroplet[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      size: 8 + Math.random() * 12,
      color: colors[i % colors.length],
      delay: Math.random() * 0.25,
      duration: 1.2 + Math.random() * 0.6,
      rotation: Math.random() * 360
    }));

    setDroplets(newDroplets);

    const timer = setTimeout(() => {
      setDroplets([]);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active || droplets.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {droplets.map((d) => (
        <div
          key={d.id}
          style={{
            left: `${d.x}%`,
            top: '-20px',
            width: `${d.size}px`,
            height: `${d.size * 1.4}px`,
            backgroundColor: d.color,
            borderRadius: `${d.size}px ${d.size}px ${d.size * 0.4}px ${d.size * 0.4}px`,
            animation: `dripFall ${d.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${d.delay}s`,
            transform: `rotate(${d.rotation}deg)`
          }}
          className="absolute shadow-sm opacity-95"
        />
      ))}

      <style>{`
        @keyframes dripFall {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) scale(1.1) rotate(240deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfettiCelebration;
