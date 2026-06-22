import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { SidebarNav, type NavSection } from "./sidebar-nav";

type DashboardShellProps = {
  activeHref?: string;
  sections: NavSection[];
  roleLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function DashboardShell({ activeHref, children, roleLabel, sections, subtitle, title }: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      <div className="page-shell dashboard-shell">
        <div className="dashboard-layout">
          <SidebarNav activeHref={activeHref} sections={sections} />
          <div className="shell-content">
            <header className="shell-hero shell-card">
              <div className="dashboard-meta">
                <Badge tone="green">{roleLabel}</Badge>
                <span className="eyebrow">Dashboard shell</span>
              </div>
              <h1 className="page-title">{title}</h1>
              <p className="shell-lead">{subtitle}</p>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}