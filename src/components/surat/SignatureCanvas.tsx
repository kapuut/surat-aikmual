"use client";

import { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';

interface SignatureCanvasProps {
  onChange: (signature: string) => void;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({ onChange, width = 500, height = 200 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current);
      padRef.current.addEventListener("endStroke", () => {
        onChange(padRef.current?.toDataURL() || '');
      });
    }
  }, [onChange]);

  const clear = () => {
    padRef.current?.clear();
    onChange('');
  };

  return (
    <div className="signature-container border rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded touch-none"
      />
      <button 
        onClick={clear}
        className="btn btn-sm btn-outline mt-2"
      >
        Clear
      </button>
    </div>
  );
}
