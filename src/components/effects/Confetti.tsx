
import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  duration?: number;
  colors?: string[];
  particleCount?: number;
}

const Confetti: React.FC<ConfettiProps> = ({
  duration = 3000,
  colors = ['#9b87f5', '#7E69AB', '#E5DEFF', '#D946EF', '#F97316', '#0EA5E9'],
  particleCount = 200
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, duration);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [duration]);

  if (!showConfetti) {
    return null;
  }

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      colors={colors}
      numberOfPieces={particleCount}
      recycle={false}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
    />
  );
};

export default Confetti;
