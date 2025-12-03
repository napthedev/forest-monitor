"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TreePine,
  LayoutGrid,
  Sun,
  PersonStanding,
  Cloud,
  Flame,
  Droplets,
  Volume2,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    href: "/light",
    label: "Light",
    icon: <Sun className="w-5 h-5" />,
  },
  {
    href: "/motion",
    label: "Motion",
    icon: <PersonStanding className="w-5 h-5" />,
  },
  {
    href: "/gas",
    label: "Gas",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    href: "/flame",
    label: "Flame",
    icon: <Flame className="w-5 h-5" />,
  },
  {
    href: "/soil-moisture",
    label: "Soil Moisture",
    icon: <Droplets className="w-5 h-5" />,
  },
  {
    href: "/sound",
    label: "Sound",
    icon: <Volume2 className="w-5 h-5" />,
  },
];

// Route-based color configuration
const getRouteColors = (pathname: string) => {
  if (pathname === "/light") {
    return {
      border: "border-orange-100",
      logoIcon: "text-orange-600",
      logoGradient: "from-orange-700 via-amber-600 to-yellow-600",
      activeBg: "bg-orange-100",
      activeText: "text-orange-700",
      hoverBg: "hover:bg-orange-50",
      hoverText: "hover:text-orange-600",
    };
  }
  if (pathname === "/motion") {
    return {
      border: "border-blue-100",
      logoIcon: "text-blue-600",
      logoGradient: "from-blue-700 via-sky-600 to-cyan-600",
      activeBg: "bg-blue-100",
      activeText: "text-blue-700",
      hoverBg: "hover:bg-blue-50",
      hoverText: "hover:text-blue-600",
    };
  }
  if (pathname === "/gas") {
    return {
      border: "border-gray-200",
      logoIcon: "text-gray-600",
      logoGradient: "from-gray-700 via-slate-600 to-zinc-600",
      activeBg: "bg-gray-100",
      activeText: "text-gray-700",
      hoverBg: "hover:bg-gray-50",
      hoverText: "hover:text-gray-600",
    };
  }
  if (pathname === "/flame") {
    return {
      border: "border-red-100",
      logoIcon: "text-red-600",
      logoGradient: "from-red-700 via-rose-600 to-orange-600",
      activeBg: "bg-red-100",
      activeText: "text-red-700",
      hoverBg: "hover:bg-red-50",
      hoverText: "hover:text-red-600",
    };
  }
  if (pathname === "/soil-moisture") {
    return {
      border: "border-amber-100",
      logoIcon: "text-amber-700",
      logoGradient: "from-amber-800 via-yellow-700 to-amber-600",
      activeBg: "bg-amber-100",
      activeText: "text-amber-800",
      hoverBg: "hover:bg-amber-50",
      hoverText: "hover:text-amber-700",
    };
  }
  if (pathname === "/sound") {
    return {
      border: "border-cyan-100",
      logoIcon: "text-cyan-600",
      logoGradient: "from-cyan-700 via-sky-600 to-teal-600",
      activeBg: "bg-cyan-100",
      activeText: "text-cyan-700",
      hoverBg: "hover:bg-cyan-50",
      hoverText: "hover:text-cyan-600",
    };
  }
  // Default: green theme for dashboard
  return {
    border: "border-emerald-100",
    logoIcon: "text-emerald-600",
    logoGradient: "from-emerald-700 via-green-600 to-teal-600",
    activeBg: "bg-emerald-100",
    activeText: "text-emerald-700",
    hoverBg: "hover:bg-emerald-50",
    hoverText: "hover:text-emerald-600",
  };
};

export default function Header() {
  const pathname = usePathname();
  const colors = getRouteColors(pathname);

  return (
    <header
      className={`relative z-20 bg-white/80 backdrop-blur-sm border-b ${colors.border}`}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <TreePine
              className={`w-8 h-8 ${colors.logoIcon} group-hover:scale-110 transition-transform`}
            />
            <span
              className={`text-xl font-bold text-transparent bg-clip-text bg-linear-to-r ${colors.logoGradient}`}
            >
              Forest Monitor
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `${colors.activeBg} ${colors.activeText}`
                      : `text-gray-600 ${colors.hoverBg} ${colors.hoverText}`
                  }`}
                >
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
