"use client";

import { Camera, ScanLine, SwitchCamera, Upload, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWasteClassifier } from "@/hooks/use-waste-classifier";
import type { WasteClassificationResult } from "@/lib/ai/waste-ai-taxonomy";
import { wasteClassLabel } from "@/lib/ai/waste-ai-taxonomy";
import { captureVideoFrame } from "@/lib/ai/waste-classifier-client";
import { cn } from "@/lib/utils";

type WasteCameraScannerProps = {
  onResult?: (result: WasteClassificationResult, file?: File) => void;
  onPreviewChange?: (previewUrl: string | null) => void;
  compact?: boolean;
};

export function WasteCameraScanner({ onResult, onPreviewChange, compact = false }: WasteCameraScannerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const { isModelLoading, isClassifying, modelError, result, classifyFile, classifyElement, reset } =
    useWasteClassifier();

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [cameraOn, setCameraOn] = useState(false);
  const [liveScan, setLiveScan] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const updatePreview = useCallback(
    (url: string | null) => {
      setPreviewUrl(url);
      onPreviewChange?.(url);
    },
    [onPreviewChange],
  );

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setLiveScan(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setMode("camera");
      updatePreview(null);
    } catch {
      setCameraError("Akses kamera ditolak atau tidak tersedia. Gunakan unggah foto.");
      setMode("upload");
    }
  }, [facingMode, stopCamera, updatePreview]);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when camera facing changes
  }, [facingMode]);

  const runScan = useCallback(async () => {
    if (isModelLoading || isClassifying) return;

    if (mode === "camera" && videoRef.current && cameraOn) {
      const frame = captureVideoFrame(videoRef.current);
      const next = await classifyElement(frame);
      const blob = await new Promise<Blob | null>((resolve) => frame.toBlob(resolve, "image/jpeg", 0.92));
      const file = blob ? new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }) : undefined;
      updatePreview(frame.toDataURL("image/jpeg"));
      onResult?.(next, file);
      return;
    }

    if (previewUrl && mode === "upload") {
      const img = document.createElement("img");
      img.src = previewUrl;
      await new Promise((r) => {
        img.onload = r;
      });
      const next = await classifyElement(img);
      onResult?.(next);
    }
  }, [cameraOn, classifyElement, isClassifying, isModelLoading, mode, onResult, previewUrl, updatePreview]);

  useEffect(() => {
    if (!liveScan || !cameraOn || mode !== "camera") {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      return;
    }

    scanTimerRef.current = window.setInterval(() => {
      void runScan();
    }, 2000);

    return () => {
      if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    };
  }, [liveScan, cameraOn, mode, runScan]);

  const handleFile = async (file: File) => {
    reset();
    stopCamera();
    setMode("upload");
    updatePreview(URL.createObjectURL(file));
    const next = await classifyFile(file);
    onResult?.(next, file);
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className={cn("space-y-4", compact ? "" : "")}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("camera");
            void startCamera();
            reset();
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            mode === "camera" ? "bg-[var(--color-leaf-600)] text-white" : "border",
          )}
        >
          <Video className="mr-1 inline size-4" />
          Kamera Live
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setMode("upload");
            reset();
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            mode === "upload" ? "bg-[var(--color-leaf-600)] text-white" : "border",
          )}
        >
          <Upload className="mr-1 inline size-4" />
          Unggah Foto
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-zinc-900">
        <div className="relative aspect-[4/3] w-full">
          {mode === "camera" && cameraOn ? (
            <>
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/40" />
              {liveScan ? (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-[var(--color-mint-400)]" />
              ) : null}
            </>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Pratinjau sampah" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-white/70">
              <Camera className="size-10" />
              <p className="text-sm">Arahkan kamera ke sampah atau unggah foto.</p>
            </div>
          )}

          {(isModelLoading || isClassifying) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <p className="rounded-full bg-black/70 px-4 py-2 font-mono text-xs font-bold tracking-widest text-[var(--color-mint-200)]">
                {isModelLoading ? "MEMUAT MODEL..." : "MENGANALISIS PIXEL..."}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] bg-white p-3">
          {mode === "camera" ? (
            <>
              <button type="button" onClick={() => void startCamera()} className="rounded-full border px-3 py-2 text-sm font-semibold">
                {cameraOn ? "Refresh Kamera" : "Nyalakan Kamera"}
              </button>
              <button
                type="button"
                onClick={() => setFacingMode((f) => (f === "environment" ? "user" : "environment"))}
                className="rounded-full border px-3 py-2 text-sm font-semibold"
              >
                <SwitchCamera className="mr-1 inline size-4" />
                Flip
              </button>
              <button
                type="button"
                onClick={() => setLiveScan((v) => !v)}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold",
                  liveScan ? "bg-[var(--color-forest-900)] text-white" : "border",
                )}
              >
                {liveScan ? <VideoOff className="mr-1 inline size-4" /> : <Video className="mr-1 inline size-4" />}
                {liveScan ? "Stop Live Scan" : "Live Scan (2 dtk)"}
              </button>
              <button
                type="button"
                disabled={!cameraOn || isClassifying || isModelLoading}
                onClick={() => void runScan()}
                className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <ScanLine className="mr-1 inline size-4" />
                Scan Sekarang
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-[var(--color-leaf-600)] px-4 py-2 text-sm font-semibold text-white"
              >
                Pilih Foto
              </button>
            </>
          )}
        </div>
      </div>

      {cameraError ? <p className="text-sm text-[var(--color-amber-600)]">{cameraError}</p> : null}
      {modelError ? <p className="rounded-xl bg-[var(--color-red-50)] px-4 py-3 text-sm text-[var(--color-red-700)]">{modelError}</p> : null}

      {result ? (
        <div className="rounded-xl bg-[var(--color-mint-100)] p-4">
          <p className="text-xs font-bold uppercase text-[var(--color-leaf-700)]">
            Hasil TensorFlow.js · {result.model_version}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-forest-900)]">
            {wasteClassLabel(result.top_class)}
          </p>
          <p className="text-sm text-[var(--color-ink-600)]">
            Kelas: {result.top_class} · Keyakinan: {confidencePct}% · {result.inference_time_ms} ms
          </p>
          {result.top_k.length > 1 ? (
            <ul className="mt-3 space-y-1 text-xs text-[var(--color-ink-600)]">
              {result.top_k.map((item) => (
                <li key={item.class}>
                  {item.label}: {Math.round(item.confidence * 100)}%
                  {item.evidence ? ` (${item.evidence})` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-[var(--color-ink-500)]">
            Model MobileNet v2 menganalisis pixel foto secara langsung (bukan dummy hash). Akurasi tergantung pencahayaan dan sudut foto.
          </p>
        </div>
      ) : null}

      {!isModelLoading && !result ? (
        <p className="text-xs text-[var(--color-ink-500)]">
          {mode === "camera"
            ? "Gunakan Live Scan untuk deteksi otomatis setiap 2 detik, atau Scan Sekarang untuk satu kali analisis."
            : "Pilih foto sampah yang jelas dan terang untuk hasil terbaik."}
        </p>
      ) : null}
    </div>
  );
}
