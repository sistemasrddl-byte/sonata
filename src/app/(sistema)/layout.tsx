import { ReactNode } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SystemLayout from "@/components/layout/SystemLayout";

interface SistemaLayoutProps {
  children: ReactNode;
}

export default function SistemaLayout({
  children,
}: SistemaLayoutProps) {
  return (
    <ProtectedRoute>
      <SystemLayout>{children}</SystemLayout>
    </ProtectedRoute>
  );
}