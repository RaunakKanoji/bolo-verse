import type { Metadata } from "next";
import "./globals.css";
import { SpatialAuthProvider } from "../auth/SpatialAuthProvider";

export const metadata: Metadata = {
  title: "Spatial workspace · Shape Studio",
  description: "Compose project assets in your shared spatial scene.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SpatialAuthProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          {children}
        </SpatialAuthProvider>
      </body>
    </html>
  );
}
