import Link from "next/link";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarNavProps = {
  sections: NavSection[];
  activeHref?: string;
};

export function SidebarNav({ activeHref, sections }: SidebarNavProps) {
  return (
    <aside className="sidebar nav-panel">
      <div className="nav-group-heading">
        <div>
          <p className="eyebrow">PACUL</p>
          <h2>Role navigation</h2>
        </div>
      </div>
      {sections.map((section) => (
        <div key={section.title} className="nav-group">
          <div className="nav-group-heading">
            <p className="eyebrow">{section.title}</p>
          </div>
          <div className="nav-links">
            {section.items.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <Link key={item.href} href={item.href} data-active={isActive} className="route-link">
                  <span className="block text-sm font-semibold" style={{ color: "var(--color-forest-900)" }}>
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="block text-xs" style={{ color: "var(--color-ink-500)" }}>
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}