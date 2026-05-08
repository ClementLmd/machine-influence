import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RecentListings } from "@/components/home/RecentListings";
import { FeaturedCandidates } from "@/components/home/FeaturedCandidates";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="-mt-12 md:-mt-20">
      <HeroSection isAuthenticated={!!user} />
      <HowItWorks />
      <RecentListings />
      <FeaturedCandidates />
    </div>
  );
}
