import { useState, useEffect } from "react";
import { Film } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";
import api from "@/lib/api";

export const Footer = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [copyrightText, setCopyrightText] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const result = await api.getSiteSettings();
      if (result.data?.settings) {
        if (result.data.settings.footer_logo_url) {
          setLogoUrl(result.data.settings.footer_logo_url);
        }
        if (result.data.settings.copyright_text) {
          setCopyrightText(result.data.settings.copyright_text);
        }
      }
    } catch (error) {
      console.error('Failed to fetch footer settings:', error);
    }
  };

  return (
    <footer className="border-t border-border bg-card/50 py-10">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Logo & Info */}
          <div className="flex flex-col gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="TrailersHub"
                className="h-10 max-w-[150px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <span className="font-display text-xl tracking-wide">
                  TRAILERS<span className="text-primary">HUB</span>
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground max-w-xs">
              Discover the latest movie trailers from around the world. Your destination for cinema entertainment.
            </p>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2 lg:max-w-md lg:ml-auto">
            <NewsletterSignup />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {copyrightText || `© ${new Date().getFullYear()} TrailersHub. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};
