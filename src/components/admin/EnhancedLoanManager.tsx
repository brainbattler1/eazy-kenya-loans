import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Eye, 
  FileText, 
  Download, 
  Filter, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  MoreHorizontal,
  User,
  Calendar,
  Phone,
  MapPin,
  Briefcase,
  Target,
  AlertCircle
} from 'lucide-react';

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
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  first_name?: string;
  last_name?: string;
  applicant_phone?: string;
  applicant_address?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  dependents?: number;
  employer_name?: string;
  employment_duration?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  existing_loans_amount?: number;
  credit_score?: number;
  documents_uploaded?: boolean;
  id_document_front_url?: string;
  id_document_back_url?: string;
  proof_of_income_url?: string;
  bank_statement_url?: string;
  user_email?: string;
  user_full_name?: string;
  user_created_at?: string;
  risk_score?: number;
}

interface LoanStatistics {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  disbursed_applications: number;
  total_amount_requested: number;
  total_amount_approved: number;
  total_amount_disbursed: number;
  avg_approval_time: string;
  approval_rate: number;
}

interface EnhancedLoanManagerProps {
  currentUserId: string;
}

export function EnhancedLoanManager({ currentUserId }: EnhancedLoanManagerProps) {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [statistics, setStatistics] = useState<LoanStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [statusFilter, currentPage]);

  const fetchData = async () => {
    await Promise.all([fetchLoans(), fetchStatistics()]);
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? null : statusFilter;
      const offset = (currentPage - 1) * itemsPerPage;
      
      const { data: loansData, error } = await supabase.rpc('get_admin_loan_applications', {
        _status: status,
        _limit: itemsPerPage,
        _offset: offset
      });

      if (error) throw error;
      setLoans(loansData || []);
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

  const fetchStatistics = async () => {
    try {
      const { data: statsData, error } = await supabase.rpc('get_loan_statistics');
      if (error) throw error;
      if (statsData && statsData.length > 0) {
        const stats = statsData[0];
        setStatistics({
          ...stats,
          avg_approval_time: stats.avg_approval_time ? String(stats.avg_approval_time) : '0 days'
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
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

      if (action === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = currentUserId;
      } else if (action === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = currentUserId;
        if (reason) {
          updateData.rejection_reason = reason;
        }
      }

      console.log('Updating loan with data:', updateData);

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updateData)
        .eq('id', loanId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      toast({
        title: 'Success',
        description: `Loan ${action} successfully`
      });

      await fetchData();
      setRejectionReason('');
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: 'Error',
        description: `Failed to update loan status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'approved' | 'rejected', reason?: string) => {
    if (selectedLoans.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select loans to perform bulk action',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: result, error } = await supabase.rpc('bulk_update_loan_status', {
        _loan_ids: selectedLoans,
        _status: action,
        _rejection_reason: reason
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${result} loans ${action} successfully`
      });

      setSelectedLoans([]);
      await fetchData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'disbursed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 8) return 'text-red-600 dark:text-red-400';
    if (riskScore >= 6) return 'text-orange-600 dark:text-orange-400';
    if (riskScore >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredLoans = loans.filter(loan => {
    const searchMatch = 
      loan.user_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  const sortedLoans = filteredLoans.sort((a, b) => {
    let aValue = a[sortBy as keyof LoanApplication];
    let bValue = b[sortBy as keyof LoanApplication];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
  });

  const StatCard = ({ title, value, icon: Icon, trend, color = "text-primary" }: any) => (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-primary/60" />
        </div>
      </CardContent>
    </Card>
  );

  const DocumentViewer = ({ url, title }: { url: string; title: string }) => {
    const openDocument = () => {
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        const fullUrl = `https://xgghtqxrebhmdwisvnhj.supabase.co/storage/v1/object/public/loan-documents/${url}`;
        window.open(fullUrl, '_blank');
      }
    };

    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={openDocument}
        className="flex items-center gap-2"
      >
        <ExternalLink className="h-3 w-3" />
        {title}
      </Button>
    );
  };

  if (loading && loans.length === 0) {
    return (
      <Card className="shadow-card bg-gradient-card border-0">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={statistics.total_applications}
            icon={FileText}
            trend={`${statistics.pending_applications} pending`}
          />
          <StatCard
            title="Total Requested"
            value={formatCurrency(statistics.total_amount_requested)}
            icon={DollarSign}
            trend={`${statistics.approval_rate}% approval rate`}
          />
          <StatCard
            title="Amount Approved"
            value={formatCurrency(statistics.total_amount_approved)}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            title="Amount Disbursed"
            value={formatCurrency(statistics.total_amount_disbursed)}
            icon={CheckSquare}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Main Management Card */}
      <Card className="shadow-card bg-gradient-card border-0">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enhanced Loan Management
          </CardTitle>
          <CardDescription>
            Advanced loan application management with filtering, bulk operations, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Amount (High)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low)</SelectItem>
                <SelectItem value="risk_score-desc">Risk (High)</SelectItem>
                <SelectItem value="risk_score-asc">Risk (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedLoans.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedLoans.length} loans selected</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction('approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Bulk Approve
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        Bulk Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bulk Reject Applications</DialogTitle>
                        <DialogDescription>
                          Provide a reason for rejecting {selectedLoans.length} selected applications.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRejectionReason('')}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleBulkAction('rejected', rejectionReason)}
                          disabled={!rejectionReason.trim()}
                        >
                          Reject All
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Loans Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLoans.length === sortedLoans.filter(l => l.status === 'pending').length && sortedLoans.filter(l => l.status === 'pending').length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLoans(sortedLoans.filter(l => l.status === 'pending').map(l => l.id));
                        } else {
                          setSelectedLoans([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      {loan.status === 'pending' && (
                        <Checkbox
                          checked={selectedLoans.includes(loan.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLoans([...selectedLoans, loan.id]);
                            } else {
                              setSelectedLoans(selectedLoans.filter(id => id !== loan.id));
                            }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{loan.user_full_name || `${loan.first_name} ${loan.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{loan.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(loan.amount)}</p>
                        <p className="text-sm text-muted-foreground">{loan.tenure_days} days</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getRiskColor(loan.risk_score || 5)}`}>
                        {loan.risk_score}/10
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {loan.status === 'rejected' && loan.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={loan.rejection_reason}>
                            {loan.rejection_reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(loan.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Loan Application Details</DialogTitle>
                              <DialogDescription>
                                Complete information for {loan.user_full_name || loan.user_email}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid grid-cols-4 w-full">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="personal">Personal</TabsTrigger>
                                <TabsTrigger value="financial">Financial</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      User Information
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <p><span className="font-medium">Name:</span> {loan.user_full_name}</p>
                                      <p><span className="font-medium">Email:</span> {loan.user_email}</p>
                                      <p><span className="font-medium">User Since:</span> {loan.user_created_at ? formatDate(loan.user_created_at) : 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      Loan Summary
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <p><span className="font-medium">Amount:</span> {formatCurrency(loan.amount)}</p>
                                      <p><span className="font-medium">Interest:</span> {loan.interest_rate}% APR</p>
                                      <p><span className="font-medium">Tenure:</span> {loan.tenure_days} days</p>
                                      <p><span className="font-medium">Total Payment:</span> {formatCurrency(loan.total_payment)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                                  <AlertCircle className={`h-5 w-5 ${getRiskColor(loan.risk_score || 5)}`} />
                                  <div>
                                    <p className="font-medium">Risk Assessment</p>
                                    <p className="text-sm text-muted-foreground">
                                      Risk Score: <span className={getRiskColor(loan.risk_score || 5)}>{loan.risk_score}/10</span>
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="personal" className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-medium">Personal Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Full Name:</span> {loan.first_name} {loan.last_name}</p>
                                      <p><span className="font-medium">Date of Birth:</span> {loan.date_of_birth || 'N/A'}</p>
                                      <p><span className="font-medium">Gender:</span> {loan.gender || 'N/A'}</p>
                                      <p><span className="font-medium">Marital Status:</span> {loan.marital_status || 'N/A'}</p>
                                      <p><span className="font-medium">Dependents:</span> {loan.dependents || 0}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <h4 className="font-medium">Contact Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {loan.applicant_phone || 'N/A'}
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {loan.applicant_address || 'N/A'}
                                      </p>
                                      <p><span className="font-medium">Emergency Contact:</span> {loan.emergency_contact_name || 'N/A'}</p>
                                      <p><span className="font-medium">Emergency Phone:</span> {loan.emergency_contact_phone || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="financial" className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <Briefcase className="h-4 w-4" />
                                      Employment
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Status:</span> {loan.employment_status?.replace('_', ' ')}</p>
                                      <p><span className="font-medium">Employer:</span> {loan.employer_name || 'N/A'}</p>
                                      <p><span className="font-medium">Duration:</span> {loan.employment_duration?.replace('_', ' ') || 'N/A'}</p>
                                      <p><span className="font-medium">Monthly Income:</span> {formatCurrency(loan.monthly_income)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Loan Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Purpose:</span> {loan.purpose?.replace('_', ' ')}</p>
                                      <p><span className="font-medium">Existing Loans:</span> {formatCurrency(loan.existing_loans_amount || 0)}</p>
                                      <p><span className="font-medium">Credit Score:</span> {loan.credit_score || 'N/A'}</p>
                                      <p><span className="font-medium">Processing Fee:</span> {formatCurrency(loan.processing_fee)}</p>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="documents" className="space-y-4">
                                <h4 className="font-medium">Uploaded Documents</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {loan.id_document_front_url && (
                                    <DocumentViewer 
                                      url={loan.id_document_front_url} 
                                      title="ID Front" 
                                    />
                                  )}
                                  {loan.id_document_back_url && (
                                    <DocumentViewer 
                                      url={loan.id_document_back_url} 
                                      title="ID Back" 
                                    />
                                  )}
                                  {loan.proof_of_income_url && (
                                    <DocumentViewer 
                                      url={loan.proof_of_income_url} 
                                      title="Proof of Income" 
                                    />
                                  )}
                                  {loan.bank_statement_url && (
                                    <DocumentViewer 
                                      url={loan.bank_statement_url} 
                                      title="Bank Statement" 
                                    />
                                  )}
                                </div>
                                {!loan.id_document_front_url && !loan.id_document_back_url && !loan.proof_of_income_url && !loan.bank_statement_url && (
                                  <p className="text-muted-foreground">No documents uploaded</p>
                                )}
                              </TabsContent>
                            </Tabs>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sortedLoans.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No loan applications found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}