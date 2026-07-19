"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QrCodeProps {
  data: string;
  size?: number;
}

export default function QrCode({ data, size = 200 }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
    });
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="mx-auto rounded-lg border border-gray-200"
    />
  );
}
