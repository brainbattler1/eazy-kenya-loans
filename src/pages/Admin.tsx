import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { NotificationManager } from '@/components/admin/NotificationManager';
import { UserManager } from '@/components/admin/UserManager';
import { LoanManager } from '@/components/admin/LoanManager';
import { TicketManager } from '@/components/admin/TicketManager';
import { SystemManager } from '@/components/admin/SystemManager';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Menu, Users, Shield, Bell, MessageSquare, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const Admin = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      
      // Set up realtime subscription for user updates
      const channel = supabase
        .channel('admin-user-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          fetchUsers(); // Refresh users when profiles change
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        }, () => {
          fetchUsers(); // Refresh users when roles change
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      // Use the new database function to get all users with proper admin access
      const { data: allUsers, error } = await supabase.rpc('get_all_users_for_admin');
      
      if (error) throw error;

      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Panel
                  </h1>
                  <p className="text-sm text-muted-foreground">Manage users, loans, and notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-primary">{users.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Admins</p>
                        <p className="text-2xl font-bold text-primary">
                          {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Banned Users</p>
                        <p className="text-2xl font-bold text-primary">
                          {users.filter(u => u.banned).length}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Management Tabs */}
              <Tabs defaultValue="notifications" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="loans">Loans</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications">
                  <NotificationManager users={users} />
                </TabsContent>

                <TabsContent value="users">
                  <UserManager users={users} onRefresh={fetchUsers} />
                </TabsContent>

                <TabsContent value="loans">
                  <LoanManager currentUserId={user.id} />
                </TabsContent>

                <TabsContent value="tickets">
                  <TicketManager currentUserId={user.id} />
                </TabsContent>

                <TabsContent value="system">
                  <SystemManager currentUserId={user.id} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;