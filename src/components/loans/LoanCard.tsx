import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, User, Building, FileText, Download, Image as ImageIcon } from 'lucide-react';
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

interface LoanCardProps {
  loan: LoanApplication;
}

export const LoanCard = ({ loan }: LoanCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const viewDocument = async (url: string) => {
    try {
      const { data } = await supabase.storage
        .from('loan-documents')
        .getPublicUrl(url);
      
      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  return (
    <Card className="border border-border/50">
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
          <div className="mb-2 sm:mb-0">
            <h3 className="font-semibold text-base sm:text-lg">
              {formatCurrency(loan.amount)} Loan
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize">
              {loan.purpose.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge className={`${getStatusColor(loan.status)} text-xs`}>
              {loan.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Daily Payment</p>
            <p className="font-medium text-sm sm:text-base">{formatCurrency(loan.monthly_payment)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Interest Rate</p>
            <p className="font-medium text-sm sm:text-base">{loan.interest_rate}% APR</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tenure</p>
            <p className="font-medium text-sm sm:text-base">{loan.tenure_days} days</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Applied On</p>
            <p className="font-medium text-sm sm:text-base">{formatDate(loan.created_at)}</p>
          </div>
        </div>

        {loan.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-red-800">
              <strong>Rejection Reason:</strong> {loan.rejection_reason}
            </p>
          </div>
        )}

        <Collapsible open={isExpanded}>
          <CollapsibleContent className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
            {/* Personal Information */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-primary flex items-center gap-2 text-sm sm:text-base">
                <User className="h-4 w-4" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                {loan.first_name && loan.last_name && (
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2">{loan.first_name} {loan.last_name}</span>
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
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-primary flex items-center gap-2 text-sm sm:text-base">
                <Building className="h-4 w-4" />
                Employment Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 capitalize">{loan.employment_status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="ml-2">{formatCurrency(loan.monthly_income)}</span>
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
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-primary flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4" />
                Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {loan.id_document_front_url && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>ID Document (Front)</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewDocument(loan.id_document_front_url!)}
                        className="p-1 h-auto"
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadDocument(loan.id_document_front_url!, 'id-front.jpg')}
                        className="p-1 h-auto"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {loan.id_document_back_url && (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>ID Document (Back)</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewDocument(loan.id_document_back_url!)}
                        className="p-1 h-auto"
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadDocument(loan.id_document_back_url!, 'id-back.jpg')}
                        className="p-1 h-auto"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};