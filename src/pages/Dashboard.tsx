import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { User, CreditCard, Menu } from 'lucide-react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
};

interface Profile {
  full_name: string;
  email_verified: boolean;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email_verified')
        .eq('user_id', user?.id)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Loading...
      </motion.div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <motion.div 
        className="min-h-screen flex w-full bg-gradient-subtle"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          {/* Dashboard Header */}
          <motion.header 
            className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            variants={headerVariants}
          >
            <div className="flex h-16 items-center justify-between px-6">
              <motion.div 
                className="flex items-center gap-4"
                variants={contentVariants}
              >
                <SidebarTrigger className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || 'Guest'}!</p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-4"
                variants={contentVariants}
              >
                <NotificationCenter />
                <ProfileDropdown />
              </motion.div>
            </div>
          </motion.header>
          
          <motion.main 
            className="flex-1 p-6"
            variants={contentVariants}
          >
            <motion.div 
              className="mb-8"
              variants={contentVariants}
            >
              <h1 className="text-3xl font-bold text-primary mb-2">
                Welcome back, {profile?.full_name || 'Guest'}!
              </h1>
              <p className="text-muted-foreground">
                Manage your profile and account settings from your dashboard.
              </p>
            </motion.div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Account
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="overview" className="space-y-6">
                  <motion.div 
                    className="grid gap-6 md:grid-cols-2"
                    variants={contentVariants}
                  >
                    <motion.div variants={cardVariants}>
                      <Card className="shadow-card bg-gradient-card border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Email Status</CardTitle>
                          <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">
                            {profile?.email_verified ? 'Verified' : 'Pending'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={cardVariants}>
                      <Card className="shadow-card bg-gradient-card border-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
                              onClick={() => window.location.href = '/profile'}
                            >
                              Edit Profile
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                  <motion.div variants={cardVariants}>
                    <Card className="shadow-card bg-gradient-card border-0">
                      <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your current account details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <motion.div 
                          className="grid gap-4"
                          variants={contentVariants}
                        >
                          <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <p className="text-muted-foreground">{profile?.full_name || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <p className="text-muted-foreground">{user.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email Verified</label>
                            <p className="text-muted-foreground">
                              {profile?.email_verified ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
                            onClick={() => window.location.href = '/profile'}
                          >
                            Update Profile
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.main>
        </div>
      </motion.div>
    </SidebarProvider>
  );
};

export default Dashboard;