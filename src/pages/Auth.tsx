import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Film, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SEOHead, SEO_CONFIG } from '@/components/SEOHead';
import { z } from 'zod';
import api from '@/lib/api';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');
    const details = searchParams.get('details');

    console.log('OAuth callback:', { token: !!token, error, provider, details });

    if (error) {
      const errorMessage = details
        ? decodeURIComponent(details)
        : (error === 'oauth_failed'
          ? 'Google authentication failed. Please try again.'
          : 'An error occurred during authentication.');

      toast({
        title: 'Authentication failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Clean URL immediately
      window.history.replaceState({}, '', '/auth');
      return;
    }

    if (token && provider === 'google') {
      console.log('Processing Google OAuth token...');

      // Clean URL immediately to prevent re-processing
      window.history.replaceState({}, '', '/auth');

      // Store token first
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');

      // Set token in API client
      if (api && typeof api.setToken === 'function') {
        api.setToken(token);
        console.log('Token set in API client');
      } else {
        console.error('api.setToken is not available', { api, setToken: api?.setToken });
        toast({
          title: 'Authentication failed',
          description: 'API client not properly initialized.',
          variant: 'destructive',
        });
        return;
      }

      // Small delay to ensure token is set, then fetch user data
      setTimeout(() => {
        if (api && typeof api.getCurrentUser === 'function') {
          console.log('Fetching user data...');
          api.getCurrentUser()
            .then((result) => {
              console.log('getCurrentUser result:', result);
              if (result.data?.user) {
                toast({
                  title: 'Welcome!',
                  description: 'Successfully signed in with Google.',
                });
                navigate('/', { replace: true });
              } else if (result.error) {
                console.error('getCurrentUser error:', result.error);
                toast({
                  title: 'Authentication failed',
                  description: result.error || 'Failed to fetch user data.',
                  variant: 'destructive',
                });
              }
            })
            .catch((error) => {
              console.error('Error fetching user data:', error);
              toast({
                title: 'Authentication failed',
                description: error.message || 'Failed to fetch user data. Please try again.',
                variant: 'destructive',
              });
            });
        } else {
          console.error('api.getCurrentUser is not available', { api, getCurrentUser: api?.getCurrentUser });
          toast({
            title: 'Authentication failed',
            description: 'API client not properly initialized.',
            variant: 'destructive',
          });
        }
      }, 100);
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Always use production URL - simple and reliable
    window.location.href = 'https://trailershub.org/auth/google';
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          if (error.message.includes('Invalid') || error.message.includes('credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else if (error.message.includes('Invalid response format')) {
            toast({
              title: 'Connection error',
              description: 'Unable to connect to server. Please check your connection and try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message || 'An error occurred. Please try again.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please log in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to TrailerHub!',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead
        title={SEO_CONFIG.auth.title}
        description={SEO_CONFIG.auth.description}
      />

      {/* Background glow effects */}
      <div className="edge-glow" aria-hidden="true" />
      <div className="edge-glow-extra" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Film className="h-8 w-8 text-primary" />
          <span className="font-display text-3xl tracking-wide">
            TRAILER<span className="text-primary">HUB</span>
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-card">
          <h1 className="font-display text-2xl text-center mb-6 tracking-wide">
            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-button hover:opacity-90 transition-opacity"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to TrailersHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
