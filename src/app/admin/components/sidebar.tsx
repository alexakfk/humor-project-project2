"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  MessageSquare,
  Inbox,
  BookOpen,
  Sparkles,
  Layers,
  Sliders,
  Cpu,
  Server,
  Link2,
  FileText,
  Book,
  Globe,
  Mail,
  LogOut,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const navSections: { label: string | null; links: NavLink[] }[] = [
  {
    label: null,
    links: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/images", label: "Images", icon: ImageIcon },
      { href: "/admin/captions", label: "Captions", icon: MessageSquare },
      { href: "/admin/caption-requests", label: "Requests", icon: Inbox },
      { href: "/admin/caption-examples", label: "Examples", icon: BookOpen },
    ],
  },
  {
    label: "Humor",
    links: [
      { href: "/admin/humor-flavors", label: "Flavors", icon: Sparkles },
      { href: "/admin/humor-flavor-steps", label: "Steps", icon: Layers },
      { href: "/admin/humor-mix", label: "Mix", icon: Sliders },
    ],
  },
  {
    label: "LLM",
    links: [
      { href: "/admin/llm-models", label: "Models", icon: Cpu },
      { href: "/admin/llm-providers", label: "Providers", icon: Server },
      { href: "/admin/llm-prompt-chains", label: "Chains", icon: Link2 },
      { href: "/admin/llm-responses", label: "Responses", icon: FileText },
    ],
  },
  {
    label: "Reference",
    links: [{ href: "/admin/terms", label: "Terms", icon: Book }],
  },
  {
    label: "Access",
    links: [
      { href: "/admin/allowed-domains", label: "Domains", icon: Globe },
      { href: "/admin/whitelisted-emails", label: "Emails", icon: Mail },
    ],
  },
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
      <div className="p-5 border-b border-[#1a3a1a]/40 shrink-0">
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

      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-3 mb-1 mt-3 text-[#1a3a1a] text-[8px] uppercase tracking-[0.2em]">
                {section.label}
              </p>
            )}
            {section.links.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] transition-all group ${
                    isActive
                      ? "bg-[#00ff41]/[0.07] text-[#00ff41] border-l-2 border-[#00ff41]"
                      : "text-[#505050] hover:text-[#00ff41]/70 hover:bg-[#00ff41]/[0.03] border-l-2 border-transparent"
                  }`}
                >
                  <Icon
                    size={13}
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
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1a3a1a]/40 shrink-0">
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
