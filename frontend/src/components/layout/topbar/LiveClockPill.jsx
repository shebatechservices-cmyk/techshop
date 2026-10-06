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
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono select-none">
      <span className="text-gray-800 font-semibold">{dateString}</span>
      <span className="text-gray-300">|</span>
      <span className="text-sky-700 font-bold">{timeString}</span>
    </div>
  );
}
