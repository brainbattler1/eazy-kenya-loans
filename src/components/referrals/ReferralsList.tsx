import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';

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

interface ReferralsListProps {
  referrals: Referral[];
  loading: boolean;
}

export const ReferralsList = ({ referrals, loading }: ReferralsListProps) => {
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

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-primary text-lg sm:text-xl">Your Referrals</CardTitle>
        <CardDescription className="text-sm">
          Track the status of your referral invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
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
          <div className="space-y-3 sm:space-y-4">
            {referrals.map((referral) => (
              <Card key={referral.id} className="border border-border/50">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {referral.email || 'Anonymous Referral'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Code: {referral.referral_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Badge className={`${getStatusColor(referral.status)} text-xs`}>
                        {referral.status.toUpperCase()}
                      </Badge>
                      {referral.reward_amount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ${referral.reward_amount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-0">
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
  );
};