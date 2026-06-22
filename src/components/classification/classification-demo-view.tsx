"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Maximize, Scan, ScanLine, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { routes } from "@/lib/routes";
import { wasteCategoryLabels } from "@/lib/constants";

export function ClassificationDemoView() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{ category: string; confidence: number } | null>(null);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    // Simulate AI scanning process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          // Fake result for demo
          setScanResult({
            category: "plastic_pet",
            confidence: 94.5,
          });
        }, 500);
      }
    }, 100);
  };

  const resetScan = () => {
    setScanResult(null);
    setScanProgress(0);
    setIsScanning(false);
  };

  return (
    <div className="page-shell grow py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={routes.listingsNew} className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)]">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Kembali</span>
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">AI Core Feature</p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-2xl">Klasifikasi Cerdas</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-black shadow-[var(--shadow-panel)]">
          
          {/* Camera Viewport (Simulated) */}
          <div className="relative aspect-[3/4] sm:aspect-video w-full bg-zinc-900">
            {/* Fake camera feed image */}
            <img 
              src="https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Kamera view" 
              className={`h-full w-full object-cover transition-all duration-700 ${isScanning ? 'blur-[2px] brightness-75 grayscale-[20%]' : 'brightness-100'} ${scanResult ? 'brightness-50' : ''}`}
            />

            {/* UI Overlays */}
            <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
              {/* Top Bar */}
              <div className="flex justify-between items-center text-white/80">
                <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                  Kamera Belakang
                </div>
                <button className="flex size-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                  <Maximize className="size-4" />
                </button>
              </div>

              {/* Scanning Reticle */}
              {!scanResult && (
                <div className="relative flex-1 flex items-center justify-center pointer-events-none">
                  <div className={`relative size-48 sm:size-64 border-2 transition-colors duration-300 ${isScanning ? 'border-[var(--color-mint-400)]' : 'border-white/50'}`}>
                    <div className="absolute -left-1 -top-1 size-4 border-l-4 border-t-4 border-white" />
                    <div className="absolute -right-1 -top-1 size-4 border-r-4 border-t-4 border-white" />
                    <div className="absolute -bottom-1 -left-1 size-4 border-b-4 border-l-4 border-white" />
                    <div className="absolute -bottom-1 -right-1 size-4 border-b-4 border-r-4 border-white" />
                    
                    {/* Scan Line Animation */}
                    {isScanning && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-mint-400)] shadow-[0_0_8px_var(--color-mint-400)] animate-[scan_2s_ease-in-out_infinite]" />
                    )}
                  </div>
                </div>
              )}

              {/* Result Overlay */}
              {scanResult && (
                <div className="absolute inset-0 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur-lg">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--color-mint-100)] text-[var(--color-leaf-600)] mb-4">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink-500)] uppercase tracking-wider">Hasil Analisis</p>
                    <h2 className="mt-1 text-2xl font-bold text-[var(--color-forest-900)]">
                      {wasteCategoryLabels[scanResult.category as keyof typeof wasteCategoryLabels] ?? "Tidak Dikenali"}
                    </h2>
                    
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="h-2 w-full max-w-[120px] rounded-full bg-[var(--color-sage-50)] overflow-hidden">
                        <div className="h-full bg-[var(--color-leaf-500)] rounded-full" style={{ width: `${scanResult.confidence}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[var(--color-forest-900)]">{scanResult.confidence}% Cocok</span>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <button onClick={() => router.push(`${routes.listingsNew}?category=${scanResult.category}`)} className="flex w-full items-center justify-center rounded-xl bg-[var(--color-forest-900)] py-3 font-semibold text-white hover:bg-[var(--color-forest-800)]">
                        Gunakan Hasil Ini
                      </button>
                      <button onClick={resetScan} className="flex w-full items-center justify-center rounded-xl bg-[var(--color-sage-50)] py-3 font-semibold text-[var(--color-forest-900)] hover:bg-[var(--color-mint-100)]">
                        Pindai Ulang
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Controls */}
              {!scanResult && (
                <div className="mt-auto flex flex-col items-center pb-4">
                  {isScanning ? (
                    <div className="flex flex-col items-center gap-4">
                      <p className="font-mono text-sm font-bold text-[var(--color-mint-400)] tracking-widest bg-black/50 px-4 py-1 rounded-full backdrop-blur-md">
                        ANALYZING... {scanProgress}%
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-sm font-medium text-white/80 bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
                        Arahkan kamera ke sampah
                      </p>
                      <button 
                        onClick={startScan}
                        className="flex size-16 items-center justify-center rounded-full border-4 border-white/30 bg-white hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                      >
                        <ScanLine className="size-6 text-black" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
          
          {/* Info bar at the bottom */}
          <div className="bg-white p-4 text-center sm:p-5">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle className="size-5 shrink-0 text-[var(--color-amber-500)] mt-0.5" />
              <p className="text-xs text-[var(--color-ink-600)] leading-relaxed">
                <strong>Mode Demo:</strong> Fitur ini mensimulasikan integrasi model <i>Machine Learning</i> (seperti TensorFlow.js atau AWS Rekognition) untuk mendeteksi material secara otomatis sebelum membuat *listing*.
              </p>
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
