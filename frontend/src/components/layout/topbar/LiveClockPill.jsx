import React, { useState, useEffect } from 'react';

export default function LiveClockPill() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/90 border border-emerald-200/90 rounded-lg text-xs font-mono select-none shadow-2xs">
      <span className="text-emerald-950 font-semibold">{dateString}</span>
      <span className="text-emerald-300">|</span>
      <span className="text-emerald-700 font-bold">{timeString}</span>
    </div>
  );
}
