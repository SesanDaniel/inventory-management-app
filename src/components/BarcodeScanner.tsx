import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const containerId = 'barcode-scanner-region';

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    let isActive = true;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (isActive) {
            isActive = false;
            onScan(decodedText);
          }
        },
        () => { /* fires constantly while no barcode is in frame, ignore */ }
      )
      .catch(err => console.error('Failed to start barcode scanner:', err));

    return () => {
      isActive = false;
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ScanLine className="w-4 h-4 text-indigo-400" />
            Scan Barcode
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div id={containerId} className="w-full aspect-square bg-black" />
        <p className="text-center text-xs text-slate-500 p-3">Point your camera at the item's barcode</p>
      </div>
    </div>
  );
}
