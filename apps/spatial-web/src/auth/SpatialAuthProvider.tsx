"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { createContext, useContext, type ReactNode } from "react";

const AuthConfigured = createContext(false);
export const useSpatialAuthConfigured = () => useContext(AuthConfigured);

/** Client-boundary provider needs only the public instance key; web owns server auth. */
export function SpatialAuthProvider({
  publishableKey,
  children,
}: {
  publishableKey?: string;
  children: ReactNode;
}) {
  return (
    <AuthConfigured.Provider value={Boolean(publishableKey)}>
      {publishableKey ? (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/workspace">
          {children}
        </ClerkProvider>
      ) : (
        children
      )}
    </AuthConfigured.Provider>
  );
}
