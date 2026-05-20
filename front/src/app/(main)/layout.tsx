import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { SiteFooter } from "@/components/home/SiteFooter";
import { UnreadCountProvider } from "@/contexts/UnreadCountContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnreadCountProvider>
      <div className="min-h-screen flex flex-col">
        <HomeNavbar />
        <main className="flex-1 pt-12 md:pt-20">{children}</main>
        <SiteFooter />
      </div>
    </UnreadCountProvider>
  );
}
