import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
}

export const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  const fullTitle = title.includes('TrailersHub') ? title : `${title} | TrailersHub`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="TrailersHub" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "TrailersHub",
          "alternateName": ["TrailerHub"],
          "url": "https://trailershub.org",
          "description": "Discover the latest movie trailers from Hollywood, Nollywood, Bollywood, K-Dramas, and more in HD.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://trailershub.org/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};
export const SEO_CONFIG = {
  home: {
    title: "TrailersHub: Latest Movie Trailers Worldwide | Hollywood, Bollywood & More",
    description: "Discover the latest movie trailers from Hollywood, Nollywood, Bollywood, K-Dramas, and more in HD. Watch trending and upcoming trailers on TrailersHub."
  },
  latest: {
    title: "Latest Movie Trailers 2025 | Watch HD on TrailersHub",
    description: "Watch the newest movie trailers released in 2025. HD quality trailers from Hollywood, Bollywood, and global cinema updated daily."
  },
  trending: {
    title: "Trending Movie Trailers Now | Top Films on TrailersHub",
    description: "Discover what's trending now. Watch the most popular movie trailers that everyone is talking about on TrailersHub."
  },
  upcoming: {
    title: "Upcoming Movie Trailers 2026 | Release Dates & Notify | TrailersHub",
    description: "Get notified about upcoming movie trailers. See release dates and subscribe to alerts for the most anticipated films."
  },
  tvSeries: {
    title: "Best TV Series Trailers | New Seasons on TrailersHub",
    description: "Watch trailers for the best TV series and new seasons. From drama to comedy, find your next binge-worthy show."
  },
  hollywood: {
    title: "Hollywood Movie Trailers | Latest Blockbusters | TrailersHub",
    description: "Watch the latest Hollywood movie trailers. From superhero blockbusters to award-winning dramas, all in HD."
  },
  nollywood: {
    title: "Nollywood Trailers | Latest Nigerian Movies | TrailersHub",
    description: "Discover the best of Nigerian cinema. Watch Nollywood movie trailers featuring top actors and compelling stories."
  },
  bollywood: {
    title: "Bollywood Movie Trailers | New Hindi Films | TrailersHub",
    description: "Watch Bollywood movie trailers in HD. From romance to action, discover the latest Hindi cinema releases."
  },
  korean: {
    title: "K-Drama & Korean Movie Trailers | TrailersHub",
    description: "Watch Korean drama and movie trailers. Discover the best of K-content from romance to thriller genres."
  },
  animation: {
    title: "Animation Movie Trailers | Family & Kids | TrailersHub",
    description: "Watch animated movie trailers perfect for family viewing. From Disney to anime, find the best animation content."
  },
  thriller: {
    title: "Thriller Movie Trailers | Intense Previews | TrailersHub",
    description: "Watch gripping thriller movie trailers. Edge-of-your-seat previews of the most suspenseful films."
  },
  chinese: {
    title: "Chinese Movie Trailers | Latest Films | TrailersHub",
    description: "Discover Chinese cinema with the latest movie trailers. From action epics to heartfelt dramas."
  },
  watchlist: {
    title: "My Watchlist | TrailersHub",
    description: "Your personal watchlist of movies to watch. Keep track of trailers you want to see."
  },
  favorites: {
    title: "My Favorites | TrailersHub",
    description: "Your favorite movie trailers saved in one place. Quick access to the trailers you love."
  },
  reviews: {
    title: "My Reviews | TrailersHub",
    description: "Your movie reviews and ratings. Track what you've watched and share your opinions."
  },
  auth: {
    title: "Sign In | TrailersHub",
    description: "Sign in to TrailersHub to save favorites, create watchlists, and write reviews."
  },
};

// Helper function to get SEO config by category slug
export const getSEOByCategory = (slug: string): { title: string; description: string } => {
  // ...
  const formattedName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${formattedName} Movie Trailers | TrailersHub`,
    description: `Watch ${formattedName} movie trailers in HD. Discover the latest releases and upcoming films on TrailersHub.`
  };
};
