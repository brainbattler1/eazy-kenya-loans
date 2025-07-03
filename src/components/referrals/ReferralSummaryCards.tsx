import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, DollarSign, Gift } from 'lucide-react';

interface ReferralSummaryCardsProps {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarned: number;
  pendingEarnings: number;
}

export const ReferralSummaryCards = ({
  totalReferrals,
  successfulReferrals,
  totalEarned,
  pendingEarnings
}: ReferralSummaryCardsProps) => {
  const cards = [
    {
      title: 'Total Referrals',
      value: totalReferrals,
      icon: Users,
      description: 'Friends invited'
    },
    {
      title: 'Successful',
      value: successfulReferrals,
      icon: UserPlus,
      description: 'Completed signups'
    },
    {
      title: 'Total Earned',
      value: `$${totalEarned}`,
      icon: DollarSign,
      description: 'Total rewards'
    },
    {
      title: 'Pending',
      value: `$${pendingEarnings}`,
      icon: Gift,
      description: 'Awaiting payment'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="shadow-card bg-gradient-card border-0">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-primary">{card.value}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{card.description}</p>
                </div>
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60 self-end sm:self-auto" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};