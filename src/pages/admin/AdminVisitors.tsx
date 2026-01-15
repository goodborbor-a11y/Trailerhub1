import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Users, Eye, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface VisitorData {
  date: string;
  visitors: number;
  pageViews: number;
}

const AdminVisitors = () => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<VisitorData[]>([]);
  const [weeklyData, setWeeklyData] = useState<VisitorData[]>([]);
  const [monthlyData, setMonthlyData] = useState<VisitorData[]>([]);
  const [yearlyData, setYearlyData] = useState<VisitorData[]>([]);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    weekVisitors: 0,
    monthVisitors: 0,
    yearVisitors: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVisitorData();
  }, []);

  const fetchVisitorData = async () => {
    try {
      const result = await api.getAdminVisitors();
      if (result.error) {
        throw new Error(result.error);
      }
      setDailyData(result.data?.dailyData || []);
      setWeeklyData(result.data?.weeklyData || []);
      setMonthlyData(result.data?.monthlyData || []);
      setYearlyData(result.data?.yearlyData || []);
      setStats(result.data?.stats || {
        todayVisitors: 0,
        weekVisitors: 0,
        monthVisitors: 0,
        yearVisitors: 0,
      });
    } catch (error: any) {
      console.error('Error fetching visitor data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load visitor data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: { 
    title: string; 
    value: number; 
    icon: any;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Visitor Analytics</h1>
          <p className="text-muted-foreground">Track your website visitors and page views</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today"
            value={stats.todayVisitors}
            icon={Users}
            description="Unique visitors today"
          />
          <StatCard
            title="This Week"
            value={stats.weekVisitors}
            icon={Calendar}
            description="Unique visitors this week"
          />
          <StatCard
            title="This Month"
            value={stats.monthVisitors}
            icon={TrendingUp}
            description="Unique visitors this month"
          />
          <StatCard
            title="This Year"
            value={stats.yearVisitors}
            icon={Eye}
            description="Unique visitors this year"
          />
        </div>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        name="Unique Visitors"
                      />
                      <Area
                        type="monotone"
                        dataKey="pageViews"
                        stroke="hsl(var(--secondary))"
                        fill="hsl(var(--secondary) / 0.2)"
                        name="Page Views"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="weekly">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="visitors" fill="hsl(var(--primary))" name="Unique Visitors" />
                      <Bar dataKey="pageViews" fill="hsl(var(--secondary))" name="Page Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="monthly">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Unique Visitors"
                      />
                      <Line
                        type="monotone"
                        dataKey="pageViews"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        name="Page Views"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="yearly">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="visitors" fill="hsl(var(--primary))" name="Unique Visitors" />
                      <Bar dataKey="pageViews" fill="hsl(var(--secondary))" name="Page Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminVisitors;
