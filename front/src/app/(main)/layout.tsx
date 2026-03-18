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
      <main className="flex-1 pt-12 md:pt-20">{children}</main>
      <SiteFooter />
    </div>
  );
}
