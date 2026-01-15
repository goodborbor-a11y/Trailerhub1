import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  is_admin?: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const result = await api.getAdminUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data) {
        // Map backend user format to frontend format
        const mappedUsers = result.data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          display_name: user.display_name || null,
          avatar_url: user.avatar_url || null,
          created_at: user.created_at,
          is_admin: user.is_admin || false,
        }));
        setUsers(mappedUsers);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load users', variant: 'destructive' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">View registered users</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users yet.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.display_name || 'No name set'}
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs">Admin</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded text-xs">User</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
