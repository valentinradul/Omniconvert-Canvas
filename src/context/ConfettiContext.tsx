
import React, { createContext, useContext, useState } from 'react';
import Confetti from '../components/effects/Confetti';

type ConfettiContextType = {
  triggerConfetti: (options?: { duration?: number; particleCount?: number }) => void;
};

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined);

export const ConfettiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const [confettiOptions, setConfettiOptions] = useState<{
    duration: number;
    particleCount: number;
  }>({
    duration: 3000,
    particleCount: 200,
  });

  const triggerConfetti = (options?: { duration?: number; particleCount?: number }) => {
    setConfettiOptions({
      duration: options?.duration || 3000,
      particleCount: options?.particleCount || 200,
    });
    setConfettiKey(Date.now());
  };

  return (
    <ConfettiContext.Provider value={{ triggerConfetti }}>
      {children}
      {confettiKey && (
        <Confetti
          key={confettiKey}
          duration={confettiOptions.duration}
          particleCount={confettiOptions.particleCount}
        />
      )}
    </ConfettiContext.Provider>
  );
};

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (context === undefined) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
};
