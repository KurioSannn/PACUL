import { Camera, ScanLine, Package, Handshake } from "lucide-react";

import { mockWorkflowSteps } from "@/data/mock-landing";

const iconMap: Record<string, typeof Camera> = {
  camera: Camera,
  scan: ScanLine,
  package: Package,
  handshake: Handshake,
};

export function WorkflowSection() {
  return (
    <section className="border-t border-border bg-[var(--color-forest-900)]" id="alur" aria-labelledby="workflow-title">
      <div className="landing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.09em] text-[#a9dfbd]">
            Alur kerja PACUL
          </p>
          <h2
            id="workflow-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Empat langkah dari sampah terpilah ke bahan baku industri.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockWorkflowSteps.map((step) => {
            const Icon = iconMap[step.icon] ?? Camera;
            return (
              <article
                key={step.id}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[var(--color-leaf-600)] text-white">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                    Langkah {step.step}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
