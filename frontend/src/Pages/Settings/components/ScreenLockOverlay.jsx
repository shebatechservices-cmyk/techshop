import React from 'react';

export default function ScreenLockOverlay({
  isLocked,
  unlockPin,
  setUnlockPin,
  pinError,
  setPinError,
  handleUnlock,
}) {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999999] flex flex-col items-center justify-center text-white p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
        <div className="text-5xl mb-2">🔒</div>
        <h2 className="text-xl font-bold text-white mb-1">POS Terminal Locked</h2>
        <p className="text-slate-400 text-xs mb-5">
          Enter terminal PIN passcode to unlock (Default: 1234)
        </p>

        {/* PIN Input */}
        <input
          type="password"
          maxLength={6}
          placeholder="PIN"
          value={unlockPin}
          onChange={(e) => {
            setUnlockPin(e.target.value);
            if (setPinError) setPinError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUnlock();
          }}
          className={`w-full py-2.5 px-3 rounded-lg bg-slate-950 text-white text-center text-2xl tracking-[8px] outline-none transition mb-2.5 ${
            pinError
              ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          }`}
          autoFocus
        />

        {pinError && (
          <p className="text-red-400 text-xs mb-3 font-medium">
            Incorrect PIN code! Please try again (Default: 1234)
          </p>
        )}

        {/* Quick Keypad */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item === 'C') setUnlockPin('');
                else if (item === 'OK') handleUnlock();
                else setUnlockPin((prev) => (prev.length < 6 ? prev + item : prev));
              }}
              className={`py-2.5 rounded-lg text-base font-bold transition cursor-pointer ${
                item === 'OK'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleUnlock}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-md transition cursor-pointer"
        >
          Unlock Terminal
        </button>
      </div>
    </div>
  );
}
