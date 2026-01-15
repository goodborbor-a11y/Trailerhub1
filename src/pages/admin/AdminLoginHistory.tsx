import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, History, Search, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LoginEntry {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  ip_address: string | null;
  user_agent: string | null;
  login_at: string;
  success: boolean;
  location: string | null;
}

const AdminLoginHistory = () => {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchLoginHistory = async () => {
    try {
      const result = await api.getLoginHistory();
      if (result.error) {
        throw new Error(result.error);
      }
      setHistory(result.data?.history || []);
    } catch (error: any) {
      console.error('Error fetching login history:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load login history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const filteredHistory = history.filter(entry => 
    entry.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return { browser, os };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Login History</h1>
            <p className="text-muted-foreground">Track user login activity</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Logins
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No login history available yet.</p>
                <p className="text-sm">Login events will appear here as users sign in.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Browser/OS</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => {
                      const { browser, os } = parseUserAgent(entry.user_agent);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.success ? (
                              <Badge variant="outline" className="text-green-500 border-green-500/50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive border-destructive/50">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.user_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {entry.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.ip_address || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{browser}</p>
                              <p className="text-muted-foreground">{os}</p>
                            </div>
                          </TableCell>
                          <TableCell>{entry.location || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(entry.login_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLoginHistory;
