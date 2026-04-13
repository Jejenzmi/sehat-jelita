import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 max-w-screen-2xl">
          {children}
          <footer className="mt-8 py-4 border-t border-border text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} PT Zen Multimedia Indonesia. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
