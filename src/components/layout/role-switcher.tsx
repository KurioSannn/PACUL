import Link from "next/link";

import { routes } from "@/lib/routes";

const roleItems = [
  { href: routes.dashboardHousehold, label: "Rumah Tangga" },
  { href: routes.dashboardCollector, label: "Pengepul" },
  { href: routes.dashboardIndustry, label: "Industri" },
];

export function RoleSwitcher() {
  return (
    <div className="flex flex-wrap gap-2">
      {roleItems.map((role) => (
        <Link key={role.href} href={role.href} className="button button-secondary inline-flex items-center justify-center">
          {role.label}
        </Link>
      ))}
    </div>
  );
}