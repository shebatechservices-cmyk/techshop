import React from 'react';

// Tech gadget SVG icon placeholder for products without images
export default function GadgetIconPlaceholder({ name = '', category = '' }) {
  const text = (name + ' ' + category).toLowerCase();
  let emoji = '📦';
  let label = 'TECH GEAR';

  if (text.includes('camera') || text.includes('cctv') || text.includes('ip') || text.includes('dahua') || text.includes('hikvision')) {
    emoji = '📹';
    label = 'CCTV CAMERA';
  } else if (text.includes('router') || text.includes('wifi') || text.includes('switch') || text.includes('onu') || text.includes('net')) {
    emoji = '🌐';
    label = 'NETWORKING';
  } else if (text.includes('cable') || text.includes('wire') || text.includes('patch')) {
    emoji = '🔌';
    label = 'CABLE & ACCESSORY';
  } else if (text.includes('power') || text.includes('adapter') || text.includes('supply') || text.includes('ups') || text.includes('battery')) {
    emoji = '⚡';
    label = 'POWER UNIT';
  } else if (text.includes('hdd') || text.includes('hard disk') || text.includes('memory') || text.includes('ssd')) {
    emoji = '💾';
    label = 'STORAGE';
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-4 select-none">
      <span className="text-4xl sm:text-5xl mb-2 drop-shadow-xs transition-transform group-hover:scale-110 duration-200">
        {emoji}
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}
