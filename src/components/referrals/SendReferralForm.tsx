import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SendReferralFormProps {
  myReferralCode: string;
  onReferralSent: () => void;
}

export const SendReferralForm = ({ myReferralCode, onReferralSent }: SendReferralFormProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

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
          reward_amount: 50
        });

      if (error) throw error;

      toast.success('Referral invitation sent successfully!');
      setEmail('');
      onReferralSent();
    } catch (error) {
      console.error('Error sending referral:', error);
      toast.error('Failed to send referral invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-primary text-lg sm:text-xl">Send Referral Invitation</CardTitle>
        <CardDescription className="text-sm">
          Invite friends directly via email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={sendReferral} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email" className="text-sm">Friend's Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                disabled={sending}
                className="w-full sm:w-auto bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};