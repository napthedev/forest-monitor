"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
            <svg
              className={`w-8 h-8 ${colors.logoIcon} group-hover:scale-110 transition-transform`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C17.31 7 20 9.69 20 13C20 15.21 18.79 17.14 17 18.19V22H7V18.19C5.21 17.14 4 15.21 4 13C4 9.69 6.69 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2M10 9C7.79 9 6 10.79 6 13C6 14.59 6.85 15.97 8.15 16.67L9 17.14V20H15V17.14L15.85 16.67C17.15 15.97 18 14.59 18 13C18 10.79 16.21 9 14 9H10Z" />
            </svg>
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
