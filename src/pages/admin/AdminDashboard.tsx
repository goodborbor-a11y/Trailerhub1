import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Star, Mail, Users, ArrowLeft, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  movies: number;
  comments: number;
  subscribers: number;
  users: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    movies: 0,
    comments: 0,
    subscribers: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.getAdminStats();
        if (result.error) {
          console.error('Admin stats error:', result.error);
          toast({
            title: 'Error',
            description: result.error || 'Failed to load stats',
            variant: 'destructive'
          });
        } else if (result.data) {
          setStats(result.data);
        }
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load stats',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Movies', value: stats.movies, icon: Film, href: '/admin/movies', color: 'text-blue-500' },
    { title: 'Comments', value: stats.comments, icon: MessageSquare, href: '/admin/reviews', color: 'text-yellow-500' },
    { title: 'Subscribers', value: stats.subscribers, icon: Mail, href: '/admin/newsletter', color: 'text-green-500' },
    { title: 'Users', value: stats.users, icon: Users, href: '/admin/users', color: 'text-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your admin panel</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
