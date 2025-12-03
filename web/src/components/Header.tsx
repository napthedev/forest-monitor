"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    href: "/light",
    label: "Light Sensor",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7M12 2L14.39 5.42C13.65 5.15 12.84 5 12 5S10.35 5.15 9.61 5.42L12 2M3.34 7L7.5 6.65C6.9 7.16 6.36 7.78 5.94 8.5C5.5 9.24 5.25 10 5.11 10.79L3.34 7M3.36 17L5.12 13.23C5.26 14 5.53 14.78 5.95 15.5C6.37 16.24 6.91 16.86 7.5 17.37L3.36 17M20.65 7L18.88 10.79C18.74 10 18.47 9.23 18.05 8.5C17.63 7.78 17.1 7.15 16.5 6.64L20.65 7M20.64 17L16.5 17.36C17.09 16.85 17.62 16.22 18.04 15.5C18.46 14.77 18.73 14 18.87 13.21L20.64 17M12 22L9.59 18.56C10.33 18.83 11.14 19 12 19S13.66 18.83 14.4 18.56L12 22Z" />
      </svg>
    ),
  },
  {
    href: "/motion",
    label: "Motion Sensor",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
      </svg>
    ),
  },
  {
    href: "/gas",
    label: "Gas Sensor",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.35,10.04C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.04C2.34,8.36 0,10.91 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.04Z" />
      </svg>
    ),
  },
  {
    href: "/flame",
    label: "Flame Sensor",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5Z" />
      </svg>
    ),
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
              className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${colors.logoGradient}`}
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
