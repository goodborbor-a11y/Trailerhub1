import { Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  categoriesCount?: number;
  moviesCount?: number;
}

export const Hero = ({ categoriesCount = 0, moviesCount = 0 }: HeroProps) => {
  const scrollToContent = () => {
    const element = document.getElementById("categories");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  // Round down to nearest 10 for display
  const roundedMovies = Math.floor(moviesCount / 10) * 10;

  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />

      <div className="container relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center">
        {/* Play icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <Play className="h-10 w-10 fill-primary text-primary" />
        </div>

        {/* Main title */}
        <h1 className="font-display text-5xl tracking-wider text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          TRAILER<span className="text-primary">HUB</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
          Discover the latest movie trailers from around the world.{" "}
          <span className="text-primary">Hollywood</span>,{" "}
          <span className="text-primary">Nollywood</span>,{" "}
          <span className="text-primary">Bollywood</span>,{" "}
          <span className="text-primary">K-Drama</span>, and more.
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Button 
            variant="hero" 
            size="xl" 
            className="gap-3"
            onClick={scrollToContent}
          >
            Explore Trailers
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 flex items-center gap-0">
          <div className="px-8 text-center">
            <div className="font-display text-4xl text-primary sm:text-5xl">{categoriesCount}+</div>
            <div className="mt-1 text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="px-8 text-center">
            <div className="font-display text-4xl text-primary sm:text-5xl">{roundedMovies}+</div>
            <div className="mt-1 text-sm text-muted-foreground">Trailers</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="px-8 text-center">
            <div className="font-display text-4xl text-primary sm:text-5xl">HD</div>
            <div className="mt-1 text-sm text-muted-foreground">Quality</div>
          </div>
        </div>
      </div>
    </section>
  );
};
