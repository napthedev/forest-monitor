"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { usePathname } from "next/navigation";
import { getRouteColor } from "@/lib/route-colors";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const color = getRouteColor(pathname);

  return (
    <ProgressProvider
      height="3px"
      color={color}
      options={{ showSpinner: false }}
      shallowRouting
      disableSameURL
    >
      {children}
    </ProgressProvider>
  );
}
