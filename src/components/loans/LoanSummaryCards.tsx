import { Card, CardContent } from '@/components/ui/card';
import { FileText, CreditCard, DollarSign } from 'lucide-react';

interface LoanSummaryCardsProps {
  totalApplications: number;
  activeLoans: number;
  totalBorrowed: string;
}

export const LoanSummaryCards = ({
  totalApplications,
  activeLoans,
  totalBorrowed
}: LoanSummaryCardsProps) => {
  const cards = [
    {
      title: 'Total Applications',
      value: totalApplications,
      icon: FileText,
      description: 'All time'
    },
    {
      title: 'Active Loans',
      value: activeLoans,
      icon: CreditCard,
      description: 'Currently disbursed'
    },
    {
      title: 'Total Borrowed',
      value: totalBorrowed,
      icon: DollarSign,
      description: 'Lifetime amount'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="shadow-card bg-gradient-card border-0">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-primary">{card.value}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{card.description}</p>
                </div>
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};