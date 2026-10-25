import { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE, { getCurrentServerUrl, setCustomServerUrl } from '../services/apiConfig';

const INITIAL_GRACE_PERIOD_MS = 2500; // If server responds within 2.5s, don't show waiting screen
const POLL_INTERVAL_MS = 2500;
const TYPICAL_COLD_START_SECS = 45;

export default function useServerWakeupDetector() {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'waking' | 'ready' | 'failed'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [serverUrl, setServerUrl] = useState(() => getCurrentServerUrl());

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  // Calculate realistic progress percentage & current step
  const calculateProgress = useCallback((seconds) => {
    if (seconds <= 0) return 5;
    if (seconds >= TYPICAL_COLD_START_SECS) {
      // asymptotically approach 95% while waiting
      return Math.min(95, 90 + Math.floor((seconds - TYPICAL_COLD_START_SECS) / 5));
    }
    return Math.min(90, Math.floor((seconds / TYPICAL_COLD_START_SECS) * 85) + 5);
  }, []);

  const pingServerEndpoint = useCallback(async (signal) => {
    try {
      const url = `${API_BASE}`.replace(/\/+$/, '');
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });
      // 200 OK means backend Express server is running and answered
      return res.ok && res.status < 400;
    } catch {
      return false;
    }
  }, []);

  const handleServerReady = useCallback(() => {
    if (!isMountedRef.current) return;
    setStatus('ready');
    setProgress(100);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearTimeout(pollRef.current);

    // Notify any listening components
    window.dispatchEvent(new CustomEvent('sheba:server_awake'));

    // Smooth transition delay so user sees success confirmation
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsWakingUp(false);
        setStatus('idle');
      }
    }, 900);
  }, []);

  const startPolling = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(secs);
        setProgress(calculateProgress(secs));
      }, 1000);
    }

    const check = async () => {
      if (!isMountedRef.current) return;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const ok = await pingServerEndpoint(controller.signal);
      clearTimeout(timeoutId);

      if (ok) {
        handleServerReady();
      } else {
        if (isMountedRef.current) {
          pollRef.current = setTimeout(check, POLL_INTERVAL_MS);
        }
      }
    };

    check();
  }, [calculateProgress, handleServerReady, pingServerEndpoint]);

  const initCheck = useCallback(() => {
    startTimeRef.current = Date.now();
    let isInitialCompleted = false;

    // Grace timer: if server doesn't respond in 2.5s, show the waiting screen
    const graceTimer = setTimeout(() => {
      if (!isInitialCompleted && isMountedRef.current) {
        setIsWakingUp(true);
        setStatus('waking');
        startPolling();
      }
    }, INITIAL_GRACE_PERIOD_MS);

    const controller = new AbortController();
    pingServerEndpoint(controller.signal)
      .then((ok) => {
        isInitialCompleted = true;
        clearTimeout(graceTimer);
        if (ok) {
          // Server was already awake, no need to show screen
          if (isMountedRef.current) {
            setIsWakingUp(false);
            setStatus('idle');
          }
        } else {
          // Received fast response but with error (e.g. 502/503 from Render)
          if (isMountedRef.current) {
            setIsWakingUp(true);
            setStatus('waking');
            startPolling();
          }
        }
      })
      .catch(() => {
        isInitialCompleted = true;
        clearTimeout(graceTimer);
        if (isMountedRef.current) {
          setIsWakingUp(true);
          setStatus('waking');
          startPolling();
        }
      });
  }, [pingServerEndpoint, startPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    initCheck();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [initCheck]);

  const retry = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearTimeout(pollRef.current);
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    setProgress(5);
    setStatus('waking');
    startPolling();
  }, [startPolling]);

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearTimeout(pollRef.current);
    setIsWakingUp(false);
  }, []);

  const changeServer = useCallback((newUrl) => {
    setCustomServerUrl(newUrl);
    setServerUrl(getCurrentServerUrl());
  }, []);

  return {
    isWakingUp,
    status,
    elapsedSeconds,
    progress,
    serverUrl,
    retry,
    skip,
    changeServer,
  };
}
