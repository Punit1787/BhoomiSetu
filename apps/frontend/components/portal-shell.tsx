"use client";

import { Building2, ChevronRight, CircleUserRound, FileClock, Gauge, Home, Landmark, LogOut, Map, Menu, Scale, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { stageLabel } from "@/lib/demo-data";
import type { Role } from "@/lib/types";

const roleIcon = { landowner: Home, officer: ShieldCheck, authority: Building2, district_admin: Landmark, senior_admin: Gauge };

export function PortalShell({ role, title, subtitle, children }: { role: Role; title: string; subtitle: string; children: ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const demoMode = useAuthStore((state) => state.demoMode);
  const [open, setOpen] = useState(false);
  const Icon = roleIcon[role];
  const links = [
    { label: "Overview", icon: Gauge }, { label: "Cases", icon: FileClock },
    { label: role === "landowner" ? "Grievances" : "Operations", icon: Scale }, { label: "Parcel map", icon: Map },
  ];
  return (
    <div className="portalLayout">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sideBrand"><span className="brandMark">भू</span><div><strong>BhoomiSetu</strong><small>भूमि से विश्वास तक</small></div><button className="closeNav" onClick={() => setOpen(false)}><X /></button></div>
        <div className="rolePill"><Icon size={17} /><span><small>Active portal</small>{stageLabel(role)}</span></div>
        <nav className="sideNav" aria-label="Portal navigation">
          {links.map(({ label, icon: LinkIcon }, index) => <button className={index === 0 ? "active" : ""} key={label}><LinkIcon size={18} />{label}<ChevronRight size={15} /></button>)}
        </nav>
        <div className="sideFooter"><span><CircleUserRound size={18} /><span><strong>{user?.full_name ?? "Demo User"}</strong><small>{demoMode ? "Demo data mode" : "Live API"}</small></span></span><button aria-label="Log out" onClick={() => { logout(); router.push("/login"); }}><LogOut size={18} /></button></div>
      </aside>
      <main className="portalMain">
        <header className="portalHeader"><button className="menuButton" onClick={() => setOpen(true)}><Menu /></button><div><p>{stageLabel(role)} workspace</p><h1>{title}</h1><span>{subtitle}</span></div><div className={`livePill ${demoMode ? "demo" : ""}`}><i />{demoMode ? "Demo fallback" : "Live system"}</div></header>
        {children}
      </main>
    </div>
  );
}
