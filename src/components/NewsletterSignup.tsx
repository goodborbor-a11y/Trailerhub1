import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

export const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({
        title: 'Invalid email',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.subscribeNewsletter(email);

      if (response.error) {
        if (response.error.includes('already') || response.error.includes('unique')) {
          toast({
            title: 'Already subscribed',
            description: "You're already on our mailing list!",
          });
        } else {
          throw new Error(response.error);
        }
      } else {
        toast({
          title: 'Subscribed!',
          description: 'Thanks for subscribing to our newsletter.',
        });
        setEmail('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg tracking-wide">STAY UPDATED</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get the latest trailers and movie news delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting}
          className="bg-gradient-button hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
