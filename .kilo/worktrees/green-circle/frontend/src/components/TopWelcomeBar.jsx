import React, { useState, useEffect, useRef } from 'react';
import GlobalSearchBar from './GlobalSearchBar';
import RealtimeNotificationCenter from './RealtimeNotificationCenter';
import DeveloperConsoleModal from './DeveloperConsoleModal';

export default function TopWelcomeBar({ 
  shopName = 'Sheba Technology & Networking', 
  userName = 'Super Admin',
  branchName = 'Head Office - Dhaka',
  onQuickSale,
  onQuickPurchase,
  onQuickAddProduct,
  onQuickExpense,
  onQuickWarranty,
  onLogout,
  onNavigate
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isDevMode, setIsDevMode] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [devToast, setDevToast] = useState({ show: false, message: '', isDev: false });
  const [showCalc, setShowCalc] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [copied, setCopied] = useState(false);
  const calcRef = useRef(null);

  // Secret Developer Console Mode Toggle (Ctrl + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.code === 'KeyD')) {
        e.preventDefault();
        setIsDevMode((prev) => {
          const nextState = !prev;
          if (nextState) {
            setShowDevConsole(true);
            setDevToast({ show: true, message: '🛠️ Developer Console Mode Activated', isDev: true });
          } else {
            setShowDevConsole(false);
            setDevToast({ show: true, message: '👤 Switched to Standard User Mode', isDev: false });
          }
          setTimeout(() => setDevToast({ show: false, message: '', isDev: false }), 2500);
          return nextState;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close calculator when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (calcRef.current && !calcRef.current.contains(event.target)) {
        setShowCalc(false);
      }
    }
    if (showCalc) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalc]);

  const hours = currentDateTime.getHours();
  let greetingEn = 'Good Morning';
  let greetingBn = 'শুভ সকাল';
  let greetingIcon = '☀️';

  if (hours >= 12 && hours < 16) {
    greetingEn = 'Good Afternoon';
    greetingBn = 'শুভ দুপুর';
    greetingIcon = '🌤️';
  } else if (hours >= 16 && hours < 19) {
    greetingEn = 'Good Evening';
    greetingBn = 'শুভ অপরাহ্ন';
    greetingIcon = '🌅';
  } else if (hours >= 19 || hours < 5) {
    greetingEn = 'Welcome';
    greetingBn = 'শুভ রাত্রি';
    greetingIcon = '🌙';
  }

  // Time: 03:05:42 AM
  const timeString = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // English Date: Tuesday, 08 September 2026
  const dateStringEn = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });

  // Bengali Date: মঙ্গল, ৮ সেপ ২০২৬
  const dateStringBn = currentDateTime.toLocaleDateString('bn-BD', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Calculator safe evaluator
  const handleCalcPress = (val) => {
    setCopied(false);
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === 'DEL') {
      setCalcInput(prev => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        if (!calcInput.trim()) return;
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return;
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${sanitized})`)();
        const formatted = Number.isFinite(res) ? (Math.round(res * 100) / 100).toLocaleString() : 'Error';
        setCalcResult(formatted);
      } catch (err) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const handleCopyResult = () => {
    const textToCopy = calcResult || calcInput;
    if (textToCopy && textToCopy !== 'Error') {
      navigator.clipboard?.writeText(String(textToCopy).replace(/,/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      borderRadius: '12px',
      padding: '8px 14px',
      marginBottom: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px',
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
      border: '1px solid #334155',
      position: 'relative'
    }}>
      {/* 1. Left: Welcome Note & Dynamic Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0
        }}>
          {greetingIcon}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', letterSpacing: '0.2px' }}>
              {greetingEn}, {userName}!
            </span>
            <span style={{
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.66rem',
              fontWeight: '700'
            }}>
              {greetingBn}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#4ade80',
              fontSize: '0.66rem',
              fontWeight: '700'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}></span>
              Online
            </span>

            {/* Prominent Global Banner Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out from Sheba ERP"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                  transition: 'all 0.15s ease',
                  marginLeft: '4px'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.4)'; }}
              >
                <span>🚪</span>
                <span>লগআউট (Logout)</span>
              </button>
            )}

            {/* Developer Console Mode Controls (Hidden in User Mode, Appears on Ctrl + Shift + D) */}
            {isDevMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  type="button"
                  onClick={() => setShowDevConsole(true)}
                  title="Super Admin & Developer Console (Shortcut: Ctrl + Shift + D)"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.45) 100%)',
                    color: '#fca5a5',
                    border: '1px solid #ef4444',
                    padding: '1px 8px',
                    borderRadius: '6px',
                    fontSize: '0.66rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>🛠️</span>
                  <span>Dev Console</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDevMode(false);
                    setShowDevConsole(false);
                    setDevToast({ show: true, message: '👤 Switched to Standard User Mode', isDev: false });
                    setTimeout(() => setDevToast({ show: false, message: '', isDev: false }), 2500);
                  }}
                  title="Switch to User Mode (Ctrl + Shift + D)"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    fontSize: '0.64rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#ffffff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'; }}
                >
                  <span>✕</span>
                  <span>Exit Dev</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>🏢 <strong>{shopName}</strong></span>
            <span>•</span>
            <span>📍 {branchName}</span>
          </div>
        </div>
      </div>

      {/* 2. Middle-Left: Compact Global Search Bar */}
      <div style={{ minWidth: '220px', maxWidth: '280px', flex: '1 1 220px' }}>
        <GlobalSearchBar onNavigate={onNavigate} compact={true} />
      </div>

      {/* 3. Center: Emergency Small Quick Access Dock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flexWrap: 'wrap',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '3px 6px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Quick POS Sale */}
        <button
          type="button"
          onClick={onQuickSale}
          title="Emergency Quick POS / New Sale"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <span>⚡</span>
          <span>Sale</span>
        </button>

        {/* Quick Purchase */}
        <button
          type="button"
          onClick={onQuickPurchase}
          title="Stock In / New Purchase Order"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 5px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <span>🛒</span>
          <span>Buy</span>
        </button>

        {/* Quick Add Product */}
        <button
          type="button"
          onClick={onQuickAddProduct}
          title="Add New Inventory Product"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 5px rgba(2, 132, 199, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <span>＋</span>
          <span>Item</span>
        </button>

        {/* Quick Expense */}
        <button
          type="button"
          onClick={onQuickExpense}
          title="Daily Expense Entry"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 5px rgba(236, 72, 153, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <span>💸</span>
          <span>Exp</span>
        </button>

        {/* Quick Warranty */}
        <button
          type="button"
          onClick={onQuickWarranty}
          title="Warranty & Serial Claims"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 5px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <span>🛡️</span>
          <span>Warr</span>
        </button>

        {/* Mini Floating Cashier Calculator Button */}
        <div style={{ position: 'relative' }} ref={calcRef}>
          <button
            type="button"
            onClick={() => setShowCalc(!showCalc)}
            title="Cashier Quick Calculator"
            style={{
              background: showCalc ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
              color: showCalc ? '#0f172a' : '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '4px 7px',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🧮</span>
            <span>Calc</span>
          </button>

          {/* Mini Floating Cashier Calculator Dropdown */}
          {showCalc && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '230px',
              background: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 9999999,
              color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8' }}>
                  🧮 Retail Calculator
                </span>
                <button
                  type="button"
                  onClick={() => setShowCalc(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕
                </button>
              </div>

              {/* Calculator Screen */}
              <div style={{
                background: '#020617',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 10px',
                marginBottom: '10px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', minHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {calcInput || '0'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', minHeight: '26px' }}>
                  {calcResult || (calcInput ? '...' : '0')}
                </div>
              </div>

              {/* Copy & Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyResult}
                  disabled={!calcResult && !calcInput}
                  style={{
                    background: copied ? '#10b981' : '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy Result'}
                </button>
              </div>

              {/* Button Keypad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {['C', 'DEL', '/', '*'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcPress(key)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: 'none',
                      background: key === 'C' ? '#ef4444' : '#334155',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {key === 'DEL' ? '⌫' : key === '/' ? '÷' : key === '*' ? '×' : key}
                  </button>
                ))}

                {['7', '8', '9', '-'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcPress(key)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: 'none',
                      background: key === '-' ? '#334155' : '#1e293b',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {key}
                  </button>
                ))}

                {['4', '5', '6', '+'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcPress(key)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: 'none',
                      background: key === '+' ? '#334155' : '#1e293b',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {key}
                  </button>
                ))}

                {['1', '2', '3', '='].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcPress(key)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: 'none',
                      background: key === '=' ? '#10b981' : '#1e293b',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {key}
                  </button>
                ))}

                {['0', '00', '.'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCalcPress(key)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#1e293b',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {key}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleCalcPress('=')}
                  style={{
                    padding: '7px 0',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  =
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Trash Bin Link */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate({ section: 'trash' })}
          title="Recycle Bin & Data Recovery (ট্র্যাশ ও ডেটা পুনরুদ্ধার)"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#f87171'; }}
        >
          <span>🗑️</span>
          <span>Trash</span>
        </button>

        {/* Quick Reload */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          title="Sync & Refresh System Data"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '4px 7px',
            fontSize: '0.72rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          🔄
        </button>
      </div>

      {/* 4. Right: Compact Notification Bell, Digital Clock & Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Compact Notification Center */}
        <RealtimeNotificationCenter onNavigate={onNavigate} compact={true} />

        {/* Live Digital Clock */}
        <div style={{
          background: '#090d16',
          border: '1px solid #334155',
          borderRadius: '7px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ fontSize: '0.9rem' }}>⏰</span>
          <div>
            <span style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.92rem',
              fontWeight: '800',
              color: '#38bdf8',
              letterSpacing: '0.5px'
            }}>
              {timeString}
            </span>
            <small style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 'bold' }}>
              Dhaka GMT+6
            </small>
          </div>
        </div>

        {/* Live Date Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid #334155',
          borderRadius: '7px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ fontSize: '0.9rem' }}>📅</span>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
              {dateStringEn}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {dateStringBn}
            </div>
          </div>
        </div>
      </div>

      {/* Dev Mode Notification Toast */}
      {devToast.show && (
        <div style={{
          position: 'fixed',
          top: '52px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000000,
          background: devToast.isDev ? 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)' : '#0f172a',
          color: devToast.isDev ? '#fca5a5' : '#38bdf8',
          border: `1px solid ${devToast.isDev ? '#ef4444' : '#0284c7'}`,
          padding: '8px 20px',
          borderRadius: '30px',
          fontSize: '0.85rem',
          fontWeight: '700',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>{devToast.isDev ? '🛠️' : '👤'}</span>
          <span>{devToast.message}</span>
        </div>
      )}

      {/* Super Admin & Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={showDevConsole}
        onClose={() => setShowDevConsole(false)}
        onSwitchToUserMode={() => {
          setIsDevMode(false);
          setShowDevConsole(false);
          setDevToast({ show: true, message: '👤 Switched to Standard User Mode', isDev: false });
          setTimeout(() => setDevToast({ show: false, message: '', isDev: false }), 2500);
        }}
      />
    </div>
  );
}
