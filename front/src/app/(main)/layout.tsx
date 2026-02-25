import { HomeNavbar } from "@/components/layout/HomeNavbar";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
