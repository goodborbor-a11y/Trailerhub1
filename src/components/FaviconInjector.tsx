import { Helmet } from 'react-helmet-async';
import { getImageUrl } from '@/lib/api';

interface FaviconInjectorProps {
  faviconUrls?: Record<string, string> | null;
}

/**
 * Robust Favicon Injector using react-helmet-async
 */
export const FaviconInjector = ({ faviconUrls }: FaviconInjectorProps) => {
  // If no dynamic favicons configured, use the static favicon.jpg
  if (!faviconUrls || Object.keys(faviconUrls).length === 0) {
    return (
      <Helmet>
        <link rel="icon" type="image/jpeg" href="/favicon.jpg?v=3" />
      </Helmet>
    );
  }

  // Get URLs for specific roles with fallback logic
  const icon16 = faviconUrls['16x16'];
  const icon32 = faviconUrls['32x32'] || icon16;
  const icon48 = faviconUrls['48x48'] || icon32;
  const appleTouchIcon = faviconUrls['256x256'] || faviconUrls['128x128'] || faviconUrls['64x64'];

  const getFullUrl = (path: string) => getImageUrl(path) || path;

  return (
    <Helmet>
      {/* Primary favicon for modern browsers */}
      {icon32 && (
        <link rel="icon" type="image/png" sizes="32x32" href={getFullUrl(icon32)} />
      )}

      {/* Small favicon fallback */}
      {icon16 && (
        <link rel="icon" type="image/png" sizes="16x16" href={getFullUrl(icon16)} />
      )}

      {/* Medium favicon fallback */}
      {icon48 && (
        <link rel="icon" type="image/png" sizes="48x48" href={getFullUrl(icon48)} />
      )}

      {/* Apple Touch Icon */}
      {appleTouchIcon && (
        <link rel="apple-touch-icon" sizes="180x180" href={getFullUrl(appleTouchIcon)} />
      )}

      {/* Legacy shortcut icon - essential for some browsers to refresh the tab */}
      {icon32 && (
        <link rel="shortcut icon" href={getFullUrl(icon32)} />
      )}
    </Helmet>
  );
};
