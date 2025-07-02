import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Eye, FileText, Download } from 'lucide-react';

interface LoanApplication {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  tenure_days: number;
  monthly_payment: number;
  total_payment: number;
  processing_fee: number;
  purpose: string;
  employment_status: string;
  monthly_income: number;
  status: string;
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  user_email?: string;
  user_name?: string;
  documents?: string[];
  first_name?: string;
  last_name?: string;
}

interface LoanManagerProps {
  currentUserId: string;
}

export function LoanManager({ currentUserId }: LoanManagerProps) {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { data: loansData, error: loansError } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      // Get user details for each loan
      const loansWithUserInfo = await Promise.all(
        (loansData || []).map(async (loan) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(loan.user_id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', loan.user_id)
              .single();

            return {
              ...loan,
              user_email: authUser.user?.email,
              user_name: profile?.full_name
            };
          } catch (error) {
            console.error('Error fetching user info for loan:', loan.id, error);
            return loan;
          }
        })
      );

      setLoans(loansWithUserInfo);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch loan applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoanAction = async (loanId: string, action: 'approved' | 'rejected' | 'disbursed', reason?: string) => {
    setActionLoading(loanId);
    try {
      const updateData: any = {
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId
      };

      if (action === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', loanId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Loan ${action} successfully`
      });

      fetchLoans();
      setRejectionReason('');
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update loan status',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'disbursed': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="shadow-card bg-gradient-card border-0">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Loan Applications Management
        </CardTitle>
        <CardDescription>
          Review, approve, and manage all loan applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No loan applications found</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div key={loan.id} className="border border-border/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {formatCurrency(loan.amount)} Loan Application
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {loan.user_name || 'Unknown'} ({loan.user_email})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User ID: {loan.user_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied: {new Date(loan.created_at).toLocaleDateString()}
                      </p>
                      {loan.first_name && loan.last_name && (
                        <p className="text-xs text-muted-foreground">
                          Name: {loan.first_name} {loan.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(loan.status)}>
                    {loan.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Purpose</p>
                    <p className="font-medium capitalize">{loan.purpose.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Income</p>
                    <p className="font-medium">{formatCurrency(loan.monthly_income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.interest_rate}% APR</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tenure</p>
                    <p className="font-medium">{loan.tenure_days} days</p>
                  </div>
                </div>

                {loan.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {loan.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* View Details Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Loan Application Details</DialogTitle>
                        <DialogDescription>
                          Complete information for {loan.user_name || loan.user_email}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">User Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="font-medium">User ID</label>
                                <p className="text-muted-foreground">{loan.user_id}</p>
                              </div>
                              <div>
                                <label className="font-medium">Email</label>
                                <p className="text-muted-foreground">{loan.user_email}</p>
                              </div>
                              {loan.first_name && (
                                <div>
                                  <label className="font-medium">First Name</label>
                                  <p className="text-muted-foreground">{loan.first_name}</p>
                                </div>
                              )}
                              {loan.last_name && (
                                <div>
                                  <label className="font-medium">Last Name</label>
                                  <p className="text-muted-foreground">{loan.last_name}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Loan Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p>{formatCurrency(loan.amount)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Monthly Payment</label>
                                <p>{formatCurrency(loan.monthly_payment)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Total Payment</label>
                                <p>{formatCurrency(loan.total_payment)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Processing Fee</label>
                                <p>{formatCurrency(loan.processing_fee)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Employment Status</label>
                                <p className="capitalize">{loan.employment_status.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Purpose</label>
                                <p className="capitalize">{loan.purpose.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Action Buttons */}
                  {loan.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleLoanAction(loan.id, 'approved')}
                        disabled={actionLoading === loan.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === loan.id}
                            onClick={() => setSelectedLoan(loan)}
                          >
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Loan Application</DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejecting this loan application.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectionReason('');
                                  setSelectedLoan(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => selectedLoan && handleLoanAction(selectedLoan.id, 'rejected', rejectionReason)}
                                disabled={!rejectionReason.trim()}
                              >
                                Reject Application
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {loan.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleLoanAction(loan.id, 'disbursed')}
                      disabled={actionLoading === loan.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Mark as Disbursed
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}