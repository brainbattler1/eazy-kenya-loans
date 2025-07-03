import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReferralSummaryCards } from '@/components/referrals/ReferralSummaryCards';
import { ReferralLinkCard } from '@/components/referrals/ReferralLinkCard';
import { SendReferralForm } from '@/components/referrals/SendReferralForm';
import { ReferralsList } from '@/components/referrals/ReferralsList';

interface Referral {
  id: string;
  referral_code: string;
  email?: string;
  status: string;
  reward_amount: number;
  reward_paid: boolean;
  created_at: string;
  completed_at?: string;
}

const Referrals = () => {
  const { user, loading } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [myReferralCode, setMyReferralCode] = useState('');

  useEffect(() => {
    if (user) {
      fetchReferrals();
      generateMyReferralCode();
    }
  }, [user]);

  const generateMyReferralCode = async () => {
    try {
      const { data } = await supabase.rpc('generate_referral_code');
      setMyReferralCode(data || `REF${user?.id?.slice(0, 8).toUpperCase()}`);
    } catch (error) {
      console.error('Error generating referral code:', error);
      setMyReferralCode(`REF${user?.id?.slice(0, 8).toUpperCase()}`);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/auth" replace />;
  }

  const totalEarned = referrals
    .filter(r => r.status === 'completed' && r.reward_paid)
    .reduce((sum, r) => sum + r.reward_amount, 0);

  const pendingEarnings = referrals
    .filter(r => r.status === 'completed' && !r.reward_paid)
    .reduce((sum, r) => sum + r.reward_amount, 0);

  const successfulReferrals = referrals.filter(r => r.status === 'completed').length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-primary">Referral Program</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Earn rewards by referring friends</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <NotificationCenter />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Cards */}
              <ReferralSummaryCards
                totalReferrals={referrals.length}
                successfulReferrals={successfulReferrals}
                totalEarned={totalEarned}
                pendingEarnings={pendingEarnings}
              />

              {/* Referral Link Section */}
              <ReferralLinkCard referralCode={myReferralCode} />

              {/* Send Referral Form */}
              <SendReferralForm 
                myReferralCode={myReferralCode}
                onReferralSent={fetchReferrals}
              />

              {/* Referrals List */}
              <ReferralsList 
                referrals={referrals}
                loading={loadingReferrals}
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Referrals;