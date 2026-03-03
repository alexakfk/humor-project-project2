"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  MessageSquare,
  LogOut,
  Terminal,
} from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/images", label: "Images", icon: ImageIcon },
  { href: "/admin/captions", label: "Captions", icon: MessageSquare },
];

export function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#060a06] border-r border-[#1a3a1a]/40 flex flex-col z-50">
      <div className="p-5 border-b border-[#1a3a1a]/40">
        <div className="flex items-center gap-2.5 mb-1">
          <Terminal className="text-[#00ff41]" size={18} />
          <span className="text-[#00ff41] text-sm font-bold tracking-wider glow-text">
            HUMOR OPS
          </span>
        </div>
        <p className="text-[#1a3a1a] text-[9px] tracking-widest uppercase ml-[30px]">
          Command Center v2.0
        </p>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-0.5">
        <p className="px-3 mb-3 text-[#1a3a1a] text-[9px] uppercase tracking-[0.2em]">
          Navigation
        </p>
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all group ${
                isActive
                  ? "bg-[#00ff41]/[0.07] text-[#00ff41] border-l-2 border-[#00ff41]"
                  : "text-[#505050] hover:text-[#00ff41]/70 hover:bg-[#00ff41]/[0.03] border-l-2 border-transparent"
              }`}
            >
              <Icon
                size={14}
                className={
                  isActive
                    ? "text-[#00ff41]"
                    : "text-[#353535] group-hover:text-[#00ff41]/50"
                }
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1a3a1a]/40">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
          <p className="text-[#00ff41]/70 text-[11px] truncate">
            {profile.first_name || ""} {profile.last_name || ""}
          </p>
        </div>
        <p className="text-[#303030] text-[10px] truncate ml-3.5">
          {profile.email}
        </p>
        <button
          onClick={handleLogout}
          className="mt-3 flex items-center gap-2 text-[#404040] hover:text-[#ff0033] text-[10px] transition-colors uppercase tracking-wider"
        >
          <LogOut size={11} />
          <span>disconnect</span>
        </button>
      </div>
    </aside>
  );
}
