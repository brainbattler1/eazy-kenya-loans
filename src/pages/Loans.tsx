import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { Menu, CreditCard, Calendar, DollarSign, FileText, User, Phone, MapPin, Building, Eye, ChevronDown, ChevronUp, Download, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  // Enhanced fields
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
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set());

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleLoanExpansion = (loanId: string) => {
    setExpandedLoans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(loanId)) {
        newSet.delete(loanId);
      } else {
        newSet.add(loanId);
      }
      return newSet;
    });
  };

  const downloadDocument = async (url: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('loan-documents')
        .download(url);
      
      if (error) throw error;
      
      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

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
                  <h1 className="text-xl font-semibold text-primary">My Loans</h1>
                  <p className="text-sm text-muted-foreground">Track your loan applications and active loans</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Applications</p>
                        <p className="text-2xl font-bold text-primary">{loans.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Loans</p>
                        <p className="text-2xl font-bold text-primary">
                          {loans.filter(l => l.status === 'disbursed').length}
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Borrowed</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(
                            loans
                              .filter(l => l.status === 'disbursed' || l.status === 'completed')
                              .reduce((sum, l) => sum + l.amount, 0)
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loans List */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="text-primary">Loan Applications</CardTitle>
                  <CardDescription>
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
                        onClick={() => window.location.href = '/apply'}
                      >
                        Apply for Loan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loans.map((loan) => {
                        const isExpanded = expandedLoans.has(loan.id);
                        return (
                          <Card key={loan.id} className="border border-border/50">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {formatCurrency(loan.amount)} Loan
                                  </h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {loan.purpose.replace('_', ' ')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(loan.status)}>
                                    {loan.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleLoanExpansion(loan.id)}
                                    className="p-2"
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Daily Payment</p>
                                  <p className="font-medium">{formatCurrency(loan.monthly_payment)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                                  <p className="font-medium">{loan.interest_rate}% APR</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tenure</p>
                                  <p className="font-medium">{loan.tenure_days} days</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Applied On</p>
                                  <p className="font-medium">{formatDate(loan.created_at)}</p>
                                </div>
                              </div>

                              {loan.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                                  <p className="text-sm text-red-800">
                                    <strong>Rejection Reason:</strong> {loan.rejection_reason}
                                  </p>
                                </div>
                              )}

                              <Collapsible open={isExpanded}>
                                <CollapsibleContent className="space-y-4 mt-4 pt-4 border-t">
                                  {/* Personal Information */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-primary flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Personal Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                      {loan.applicant_address && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">Address:</span>
                                          <span>{loan.applicant_address}</span>
                                        </div>
                                      )}
                                      {loan.applicant_phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">Phone:</span>
                                          <span>{loan.applicant_phone}</span>
                                        </div>
                                      )}
                                      {loan.date_of_birth && (
                                        <div>
                                          <span className="text-muted-foreground">Date of Birth:</span>
                                          <span className="ml-2">{formatDate(loan.date_of_birth)}</span>
                                        </div>
                                      )}
                                      {loan.gender && (
                                        <div>
                                          <span className="text-muted-foreground">Gender:</span>
                                          <span className="ml-2 capitalize">{loan.gender}</span>
                                        </div>
                                      )}
                                      {loan.marital_status && (
                                        <div>
                                          <span className="text-muted-foreground">Marital Status:</span>
                                          <span className="ml-2 capitalize">{loan.marital_status}</span>
                                        </div>
                                      )}
                                      {loan.dependents !== undefined && (
                                        <div>
                                          <span className="text-muted-foreground">Dependents:</span>
                                          <span className="ml-2">{loan.dependents}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Employment Information */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-primary flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      Employment Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="ml-2 capitalize">{loan.employment_status.replace('_', ' ')}</span>
                                      </div>
                                      {loan.employer_name && (
                                        <div>
                                          <span className="text-muted-foreground">Employer:</span>
                                          <span className="ml-2">{loan.employer_name}</span>
                                        </div>
                                      )}
                                      {loan.employment_duration && (
                                        <div>
                                          <span className="text-muted-foreground">Duration:</span>
                                          <span className="ml-2">{loan.employment_duration}</span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-muted-foreground">Monthly Income:</span>
                                        <span className="ml-2">{formatCurrency(loan.monthly_income)}</span>
                                      </div>
                                      {loan.existing_loans_amount !== undefined && (
                                        <div>
                                          <span className="text-muted-foreground">Existing Loans:</span>
                                          <span className="ml-2">{formatCurrency(loan.existing_loans_amount)}</span>
                                        </div>
                                      )}
                                      {loan.credit_score && (
                                        <div>
                                          <span className="text-muted-foreground">Credit Score:</span>
                                          <span className="ml-2">{loan.credit_score}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Emergency Contact */}
                                  {(loan.emergency_contact_name || loan.emergency_contact_phone) && (
                                    <div className="space-y-3">
                                      <h4 className="font-medium text-primary flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Emergency Contact
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {loan.emergency_contact_name && (
                                          <div>
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="ml-2">{loan.emergency_contact_name}</span>
                                          </div>
                                        )}
                                        {loan.emergency_contact_phone && (
                                          <div>
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span className="ml-2">{loan.emergency_contact_phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Uploaded Documents */}
                                  <div className="space-y-3">
                                    <h4 className="font-medium text-primary flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Uploaded Documents
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {loan.id_document_front_url && (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <Image className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">ID Document (Front)</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => downloadDocument(loan.id_document_front_url!, 'id_front.jpg')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                      {loan.id_document_back_url && (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <Image className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">ID Document (Back)</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => downloadDocument(loan.id_document_back_url!, 'id_back.jpg')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                      {loan.bank_statement_url && (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Bank Statement</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => downloadDocument(loan.bank_statement_url!, 'bank_statement.pdf')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                      {loan.proof_of_income_url && (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Proof of Income</span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => downloadDocument(loan.proof_of_income_url!, 'proof_of_income.pdf')}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    {!loan.id_document_front_url && !loan.id_document_back_url && !loan.bank_statement_url && !loan.proof_of_income_url && (
                                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  Total Amount: {formatCurrency(loan.total_payment)}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleLoanExpansion(loan.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                  </Button>
                                  {loan.status === 'pending' && (
                                    <Button variant="outline" size="sm">
                                      Upload Documents
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
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