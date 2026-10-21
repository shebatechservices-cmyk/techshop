import { useState, useEffect, useRef, useCallback } from 'react';

export default function useMobileCameraScanner({ isOpen, onScan, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scanningRef = useRef(false);

  // Stop video stream
  const stopStream = useCallback(() => {
    scanningRef.current = false;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start Camera
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    let isMounted = true;
    scanningRef.current = true;

    async function startCamera() {
      try {
        setCameraError('');
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(() => {});
        }

        // Check torch support
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      } catch (err) {
        if (isMounted) {
          setCameraError('ক্যামেরা পারমিশন পাওয়া যায়নি বা ক্যামেরা সংযোগে সমস্যা হয়েছে। ম্যানুয়ালি কোড লিখুন।');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [isOpen, stopStream]);

  // Continuous Barcode Scanning using BarcodeDetector if available
  useEffect(() => {
    if (!isOpen || !stream || !window.BarcodeDetector) return;

    let detector = null;
    try {
      detector = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
      });
    } catch {
      return;
    }

    let intervalId = null;
    const scanFrame = async () => {
      if (!scanningRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code) {
            scanningRef.current = false;
            stopStream();
            onScan(code);
            onClose();
          }
        }
      } catch {
        // detection cycle error ignore
      }
    };

    intervalId = setInterval(scanFrame, 250);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, stream, onScan, onClose, stopStream]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const next = !isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: next }] });
        setIsTorchOn(next);
      } catch {
        // ignore
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = manualBarcode.trim();
    if (code) {
      stopStream();
      onScan(code);
      onClose();
    }
  };

  return {
    videoRef,
    cameraError,
    manualBarcode,
    setManualBarcode,
    hasTorch,
    isTorchOn,
    toggleTorch,
    handleManualSubmit,
    stopStream,
  };
}
