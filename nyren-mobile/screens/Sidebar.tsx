import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, BookOpen, GraduationCap, Dna, Cpu, 
  FlaskConical, LayoutGrid, FileText, Bot, 
  Award, Users, Briefcase, Settings, ChevronLeft 
} from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { name: 'Home', icon: Home, href: '/' },
  { name: 'My Learning', icon: BookOpen, href: '/my-learning' },
  { name: 'Programs', icon: GraduationCap, href: '/programs' },
  { name: 'Bioinformatics', icon: Dna, href: '/track/bioinformatics' },
  { name: 'AI Engineering', icon: Cpu, href: '/track/ai' },
  { name: 'Virtual Labs', icon: FlaskConical, href: '/labs' },
  { name: 'Research Hub', icon: LayoutGrid, href: '/research' },
  { name: 'AI Tutor', icon: Bot, href: '/tutor', highlight: true },
  { name: 'Certifications', icon: Award, href: '/certificates' },
  { name: 'Career Hub', icon: Briefcase, href: '/career' },
];

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "h-screen sticky top-0 bg-[#071226]/80 backdrop-blur-xl border-r border-cyan-500/20 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 animate-pulse" />
        {!collapsed && <span className="font-black text-xl tracking-tighter text-white">COLI ACADEMY</span>}
      </div>

      <nav className="mt-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                item.highlight && "text-purple-400 hover:text-purple-300"
              )}
            >
              <Icon size={20} className={cn(
                "transition-transform group-hover:scale-110",
                isActive && "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              )} />
              {!collapsed && <span className="text-sm font-semibold">{item.name}</span>}
              {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}