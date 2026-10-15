import React, { useState, useEffect } from 'react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * CountdownTimer Component
 * =========================================================================
 * 
 * Displays a real-time countdown to the hotel's inaugural launch date.
 * The target date is read directly from `POLARIS_CONFIG.targetLaunchDate`.
 * If the countdown ends or is invalid, it smoothly displays "IN PROGRESS".
 */
export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    hasLaunched: false,
  });

  useEffect(() => {
    function calculateTime() {
      const difference = new Date(POLARIS_CONFIG.targetLaunchDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00', hasLaunched: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        hasLaunched: false,
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-full">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-6 max-w-xl w-full">
        {timeUnits.map((unit, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center p-2 sm:p-4 md:p-5 rounded-xl glass-panel relative overflow-hidden group transition-all"
          >
            {/* Top accent hairline */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent group-hover:via-amber-600 transition-all" />

            {/* Numerical Digit */}
            <span className="font-mono text-xl sm:text-4xl md:text-5xl font-normal sm:font-light text-stone-900 tracking-tight sm:tracking-wider">
              {unit.value}
            </span>

            {/* Unit Label */}
            <span className="text-[9px] sm:text-xs tracking-tight sm:tracking-wider uppercase text-[#8A661C] font-bold mt-1 sm:mt-2 font-sans truncate">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
