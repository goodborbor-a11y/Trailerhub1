import { useState, useEffect } from "react";
import { Film, Menu, X, ChevronRight, Tv, Flame, Calendar, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { ZoomControls } from "@/components/ZoomControls";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { categories, tvSeriesCategory } from "@/data/movies";
import api from "@/lib/api";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
}

export const Header = ({ searchQuery, onSearchChange, onSearchClear }: HeaderProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const result = await api.getSiteSettings();
      if (result.data?.settings?.header_logo_url) {
        setLogoUrl(result.data.settings.header_logo_url);
      }
    } catch (error) {
      console.error('Failed to fetch header logo:', error);
    }
  };

  const scrollToCategory = (categoryId: string) => {
    onSearchClear();
    if (location.pathname === '/') {
      setTimeout(() => {
        const element = document.getElementById(categoryId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(categoryId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-2 px-3 md:gap-4 md:px-6">
        {/* Logo */}
        <NavLink to="/" className="flex shrink-0 items-center gap-2 hover:opacity-80 transition-opacity">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="TrailersHub"
              className="h-10 max-w-[150px] object-contain"
            />
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 md:h-10 md:w-10">
                <Film className="h-4 w-4 text-primary md:h-5 md:w-5" />
              </div>
              <span className="hidden font-display text-2xl tracking-wide sm:inline">
                TRAILERS<span className="text-primary">HUB</span>
              </span>
            </>
          )}
        </NavLink>

        {/* Navigation Links - Hidden on mobile, shown on medium+ screens */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLink
            to="/trending"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-primary/10"
            activeClassName="text-foreground bg-primary/10"
          >
            <Flame className="h-4 w-4 inline mr-1.5" />
            <span className="hidden lg:inline">Trending</span>
          </NavLink>
          <NavLink
            to="/upcoming"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-primary/10"
            activeClassName="text-foreground bg-primary/10"
          >
            <Calendar className="h-4 w-4 inline mr-1.5" />
            <span className="hidden lg:inline">Upcoming</span>
          </NavLink>
          <NavLink
            to="/movies"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-primary/10"
            activeClassName="text-foreground bg-primary/10"
          >
            <Film className="h-4 w-4 inline mr-1.5" />
            <span className="hidden lg:inline">Movies</span>
          </NavLink>
          <NavLink
            to="/categories"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-primary/10"
            activeClassName="text-foreground bg-primary/10"
          >
            <Grid3x3 className="h-4 w-4 inline mr-1.5" />
            <span className="hidden lg:inline">Categories</span>
          </NavLink>
        </nav>

        {/* Search Bar */}
        <div className="flex-1 px-1 md:px-8">
          <SearchBar value={searchQuery} onChange={onSearchChange} onClear={onSearchClear} />
        </div>

        {/* Right side controls */}
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {/* Zoom Controls - hide on small screens */}
          <div className="hidden md:block">
            <ZoomControls />
          </div>

          <ThemeToggle />

          {/* User Menu - hide on small screens */}
          <div className="hidden sm:block">
            <UserMenu />
          </div>

          {/* Menu button with Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-primary bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary md:h-10 md:w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-l border-border bg-background p-0">
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <span className="font-display text-xl tracking-wide">
                  MENU
                </span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>

              {/* User menu for mobile */}
              <div className="border-b border-border px-4 py-3 sm:hidden">
                <UserMenu />
              </div>

              <nav className="flex flex-col py-4">
                {/* Main Navigation Links */}
                <SheetClose asChild>
                  <NavLink
                    to="/trending"
                    className="flex items-center gap-3 px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    activeClassName="bg-primary/10 text-primary"
                  >
                    <Flame className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">Trending</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/upcoming"
                    className="flex items-center gap-3 px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    activeClassName="bg-primary/10 text-primary"
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">Upcoming</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/movies"
                    className="flex items-center gap-3 px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    activeClassName="bg-primary/10 text-primary"
                  >
                    <Film className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">Movies</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/categories"
                    className="flex items-center gap-3 px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    activeClassName="bg-primary/10 text-primary"
                  >
                    <Grid3x3 className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">Categories</span>
                  </NavLink>
                </SheetClose>

                <div className="my-2 mx-6 border-t border-border/50" />

                <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Browse by Category
                </div>

                {/* TV Series at the top */}
                <SheetClose asChild>
                  <button
                    onClick={() => scrollToCategory(tvSeriesCategory.id)}
                    className="flex items-center justify-between px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <span className="flex items-center gap-3 text-lg font-medium">
                      <Tv className="h-5 w-5 text-primary" />
                      {tvSeriesCategory.name}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </SheetClose>

                <div className="my-2 mx-6 border-t border-border/50" />

                {categories.map((category) => (
                  <SheetClose key={category.id} asChild>
                    <button
                      onClick={() => scrollToCategory(category.id)}
                      className="flex items-center justify-between px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <span className="text-lg font-medium">{category.name}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
