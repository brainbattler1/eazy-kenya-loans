import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { Menu, UserPlus, Copy, Mail, DollarSign, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');

  useEffect(() => {
    if (user) {
      fetchReferrals();
      generateMyReferralCode();
    }
  }, [user]);

  const generateMyReferralCode = async () => {
    try {
      // Generate a unique referral code for the user
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

  const sendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: user?.id,
          referral_code: myReferralCode,
          email: email,
          status: 'pending',
          reward_amount: 50 // $50 reward for successful referrals
        });

      if (error) throw error;

      toast.success('Referral invitation sent successfully!');
      setEmail('');
      fetchReferrals();
    } catch (error) {
      console.error('Error sending referral:', error);
      toast.error('Failed to send referral invitation');
    } finally {
      setSending(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `https://eazy-loan.com/auth?ref=${myReferralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalEarned = referrals
    .filter(r => r.status === 'completed' && r.reward_paid)
    .reduce((sum, r) => sum + r.reward_amount, 0);

  const pendingEarnings = referrals
    .filter(r => r.status === 'completed' && !r.reward_paid)
    .reduce((sum, r) => sum + r.reward_amount, 0);

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
                  <h1 className="text-xl font-semibold text-primary">Referral Program</h1>
                  <p className="text-sm text-muted-foreground">Earn rewards by referring friends</p>
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                        <p className="text-2xl font-bold text-primary">{referrals.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Successful</p>
                        <p className="text-2xl font-bold text-primary">
                          {referrals.filter(r => r.status === 'completed').length}
                        </p>
                      </div>
                      <UserPlus className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                        <p className="text-2xl font-bold text-primary">${totalEarned}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-primary">${pendingEarnings}</p>
                      </div>
                      <Gift className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Link Section */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="text-primary">Your Referral Link</CardTitle>
                  <CardDescription>
                    Share this link with friends to earn $50 for each successful referral
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={`https://eazy-loan.com/auth?ref=${myReferralCode}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyReferralLink} variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Share your referral link with friends</li>
                      <li>2. They sign up and complete their first loan application</li>
                      <li>3. You both earn $50 when their loan is approved</li>
                      <li>4. Rewards are paid out within 30 days</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Send Referral Form */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="text-primary">Send Referral Invitation</CardTitle>
                  <CardDescription>
                    Invite friends directly via email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={sendReferral} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="email">Friend's Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="friend@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="submit" 
                          disabled={sending}
                          className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {sending ? 'Sending...' : 'Send Invite'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Referrals List */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="text-primary">Your Referrals</CardTitle>
                  <CardDescription>
                    Track the status of your referral invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReferrals ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : referrals.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start referring friends to earn rewards
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals.map((referral) => (
                        <Card key={referral.id} className="border border-border/50">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">
                                  {referral.email || 'Anonymous Referral'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Code: {referral.referral_code}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(referral.status)}>
                                  {referral.status.toUpperCase()}
                                </Badge>
                                {referral.reward_amount > 0 && (
                                  <Badge variant="secondary">
                                    ${referral.reward_amount}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Sent: {formatDate(referral.created_at)}</span>
                              {referral.completed_at && (
                                <span>Completed: {formatDate(referral.completed_at)}</span>
                              )}
                              {referral.status === 'completed' && (
                                <span className={`font-medium ${referral.reward_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {referral.reward_paid ? 'Reward Paid' : 'Payment Pending'}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Referrals;