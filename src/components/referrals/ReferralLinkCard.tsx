import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralLinkCardProps {
  referralCode: string;
}

export const ReferralLinkCard = ({ referralCode }: ReferralLinkCardProps) => {
  const referralLink = `https://eazy-loans.com/auth?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-primary text-lg sm:text-xl">Your Referral Link</CardTitle>
        <CardDescription className="text-sm">
          Share this link with friends to earn $50 for each successful referral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={referralLink}
            readOnly
            className="font-mono text-xs sm:text-sm flex-1"
          />
          <Button 
            onClick={copyReferralLink} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-primary mb-2 text-sm sm:text-base">How it works:</h4>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <li>1. Share your referral link with friends</li>
            <li>2. They sign up and complete their first loan application</li>
            <li>3. You both earn $50 when their loan is approved</li>
            <li>4. Rewards are paid out within 30 days</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};