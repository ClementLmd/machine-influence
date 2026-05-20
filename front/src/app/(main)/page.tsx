import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RecentListings } from "@/components/home/RecentListings";
import { FeaturedCandidates } from "@/components/home/FeaturedCandidates";

export default function Home() {
  return (
    <div className="-mt-12 md:-mt-20">
      <HeroSection />
      <HowItWorks />
      <RecentListings />
      <FeaturedCandidates />
    </div>
  );
}
