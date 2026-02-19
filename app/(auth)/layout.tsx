import type { Metadata } from "next";

/**
 * Auth route group layout.
 * Login / register pages should not be indexed — they provide no SEO value
 * and expose application internals to indexers.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
