import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { Menu, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoanSummaryCards } from '@/components/loans/LoanSummaryCards';
import { LoanCard } from '@/components/loans/LoanCard';

interface LoanApplication {
  id: string;
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
  first_name?: string;
  last_name?: string;
  applicant_address?: string;
  applicant_phone?: string;
  id_document_front_url?: string;
  id_document_back_url?: string;
  bank_statement_url?: string;
  proof_of_income_url?: string;
  employer_name?: string;
  employment_duration?: string;
  credit_score?: number;
  existing_loans_amount?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  dependents?: number;
}

const Loans = () => {
  const { user, loading } = useAuth();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoadingLoans(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const activeLoans = loans.filter(l => l.status === 'disbursed').length;
  const totalBorrowed = formatCurrency(
    loans
      .filter(l => l.status === 'disbursed' || l.status === 'completed')
      .reduce((sum, l) => sum + l.amount, 0)
  );

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
                  <h1 className="text-lg sm:text-xl font-semibold text-primary">My Loans</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Track your loan applications and active loans</p>
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
              <LoanSummaryCards
                totalApplications={loans.length}
                activeLoans={activeLoans}
                totalBorrowed={totalBorrowed}
              />

              {/* Loans List */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-primary text-lg sm:text-xl">Loan Applications</CardTitle>
                  <CardDescription className="text-sm">
                    View all your loan applications and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLoans ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : loans.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No loan applications found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Apply for a loan to get started
                      </p>
                      <Button 
                        className="mt-4 bg-gradient-hero hover:shadow-glow transition-all duration-300"
                        onClick={() => window.location.href = '/loan-application'}
                      >
                        Apply for Loan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {loans.map((loan) => (
                        <LoanCard key={loan.id} loan={loan} />
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

export default Loans;