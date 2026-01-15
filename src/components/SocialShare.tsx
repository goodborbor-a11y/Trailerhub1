import { Twitter, Facebook, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  title: string;
  url?: string;
}

export const SocialShare = ({ title, url }: SocialShareProps) => {
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Check out the trailer for ${title}!`);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Share:</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare("twitter")}
        className="h-8 w-8 text-muted-foreground hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare("facebook")}
        className="h-8 w-8 text-muted-foreground hover:text-[#4267B2] hover:bg-[#4267B2]/10"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare("whatsapp")}
        className="h-8 w-8 text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10"
        title="Share on WhatsApp"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
