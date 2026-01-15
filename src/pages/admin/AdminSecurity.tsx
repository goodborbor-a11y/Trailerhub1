import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Shield, 
  UserX, 
  UserCheck, 
  Search,
  Key,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserWithSecurity {
  id: string;
  display_name: string | null;
  created_at: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  has_2fa: boolean;
}

const AdminSecurity = () => {
  const [users, setUsers] = useState<UserWithSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithSecurity | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const result = await api.getSecurityUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      setUsers(result.data?.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      const result = await api.suspendUser(selectedUser.id, suspensionReason);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({ title: 'Success', description: 'User has been suspended' });
      setSuspendDialogOpen(false);
      setSuspensionReason('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to suspend user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      const result = await api.unsuspendUser(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({ title: 'Success', description: 'User has been unsuspended' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error unsuspending user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to unsuspend user', variant: 'destructive' });
    }
  };

  const openSuspendDialog = (user: UserWithSecurity) => {
    setSelectedUser(user);
    setSuspendDialogOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suspendedCount = users.filter(u => u.is_suspended).length;
  const with2FACount = users.filter(u => u.has_2fa).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">Manage user security settings and suspensions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card className={suspendedCount > 0 ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Suspended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{suspendedCount}</div>
            </CardContent>
          </Card>
          <Card className={with2FACount > 0 ? 'border-green-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                2FA Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{with2FACount}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Security Management
                </CardTitle>
                <CardDescription>Suspend users and manage 2FA status</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={user.is_suspended ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.display_name || 'No name set'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_suspended ? (
                            <div>
                              <Badge variant="destructive" className="gap-1">
                                <UserX className="h-3 w-3" />
                                Suspended
                              </Badge>
                              {user.suspension_reason && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                                  {user.suspension_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.has_2fa ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                              <Key className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.is_suspended ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnsuspendUser(user.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unsuspend
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openSuspendDialog(user)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend User Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Suspend User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to suspend <strong>{selectedUser?.display_name || 'this user'}</strong>. 
                They will not be able to access the platform until unsuspended.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reason">Suspension Reason</Label>
                <Textarea
                  id="reason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleSuspendUser}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Suspend User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurity;
