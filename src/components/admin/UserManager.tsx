import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Ban, Trash2, UserCheck } from 'lucide-react';

interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  full_name?: string;
  email_verified?: boolean;
  role?: string;
  banned?: boolean;
  avatar_url?: string;
  last_sign_in_at?: string;
  phone?: string;
}

interface UserManagerProps {
  users: User[];
  onRefresh: () => void;
}

export function UserManager({ users, onRefresh }: UserManagerProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      if (newRole === 'superadmin' || newRole === 'admin') {
        const { error } = await supabase.rpc('assign_admin_role', {
          _user_id: userId
        });
        if (error) throw error;
      } else {
        // Remove all existing roles first
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;
        
        // Insert the new user role
        const { error: insertError } = await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'user'
        });
        
        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: userId,
        ban_status: ban
      });
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${ban ? 'banned' : 'unbanned'} successfully`
      });
      onRefresh();
    } catch (error) {
      console.error('Error toggling ban:', error);
      toast({
        title: 'Error',
        description: `Failed to ${ban ? 'ban' : 'unban'} user`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const viewUserDocuments = async (userId: string) => {
    try {
      // Fetch user's loan applications with documents
      const { data: loanApps, error } = await supabase
        .from('loan_applications')
        .select('id, id_document_front_url, id_document_back_url, proof_of_income_url, bank_statement_url, created_at')
        .eq('user_id', userId);
      
      if (error) throw error;

      const documentCount = loanApps?.reduce((count, app) => {
        const docs = [app.id_document_front_url, app.id_document_back_url, app.proof_of_income_url, app.bank_statement_url];
        return count + docs.filter(Boolean).length;
      }, 0) || 0;

      toast({
        title: 'User Documents',
        description: `Found ${documentCount} documents across ${loanApps?.length || 0} loan applications`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user documents',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      // Delete user data in order
      await supabase.from('notifications').delete().eq('user_id', userId);
      await supabase.from('ticket_messages').delete().eq('user_id', userId);
      await supabase.from('tickets').delete().eq('user_id', userId);
      await supabase.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
      await supabase.from('loan_applications').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage user roles, ban/unban users, and delete accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{user.full_name || 'No name'}</h4>
                  <Badge className={getRoleColor(user.role || 'user')}>
                    {user.role || 'user'}
                  </Badge>
                  {user.banned && (
                    <Badge variant="destructive">
                      Banned
                    </Badge>
                  )}
                  {user.email_confirmed_at ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  {user.last_sign_in_at && (
                    <p className="text-xs text-muted-foreground">
                      Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </p>
                  )}
                  {user.phone && (
                    <p className="text-xs text-muted-foreground">Phone: {user.phone}</p>
                  )}
                </div>
                
                {/* User Documents Section */}
                <div className="mt-3 pt-2 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Uploaded Documents:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewUserDocuments(user.id)}
                      className="text-xs"
                    >
                      View Documents
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Role Assignment */}
                <Select
                  value={user.role || 'user'}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={actionLoading === user.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>

                {/* Ban/Unban Button */}
                <Button
                  size="sm"
                  variant={user.banned ? "outline" : "destructive"}
                  onClick={() => handleBanUser(user.id, !user.banned)}
                  disabled={actionLoading === user.id}
                >
                  {user.banned ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Unban
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-1" />
                      Ban
                    </>
                  )}
                </Button>

                {/* Delete User */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === user.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {user.email}? This action cannot be undone.
                        This will permanently delete their account and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}