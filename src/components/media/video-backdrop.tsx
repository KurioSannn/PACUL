"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type VideoBackdropProps = {
  srcMp4?: string;
  srcWebm?: string;
  poster?: string;
  fallbackLabel: string;
  className?: string;
};

export function VideoBackdrop({ className, fallbackLabel, poster, srcMp4, srcWebm }: VideoBackdropProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hasVideoError, setHasVideoError] = useState(false);
  const canRenderVideo = Boolean(srcMp4 || srcWebm) && !prefersReducedMotion && !hasVideoError;

  return (
    <div className={cn("video-backdrop absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(46,158,99,0.42),transparent_34%),linear-gradient(135deg,#071f18_0%,#0b2f24_52%,#17643f_100%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(205,235,218,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(205,235,218,0.11)_1px,transparent_1px)] [background-size:42px_42px]" />
      {canRenderVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          preload="metadata"
          onError={() => setHasVideoError(true)}
        >
          {srcWebm ? <source src={srcWebm} type="video/webm" /> : null}
          {srcMp4 ? <source src={srcMp4} type="video/mp4" /> : null}
        </video>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,31,24,0.94)_0%,rgba(7,31,24,0.82)_50%,rgba(7,31,24,0.66)_100%)]" />
      <span className="sr-only">{fallbackLabel}</span>
    </div>
  );
}
