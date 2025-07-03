import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Calculator, User, Building, Phone, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  // Basic loan info
  amount: string;
  purpose: string;
  tenure_days: string;
  employment_status: string;
  monthly_income: string;
  
  // Personal information
  first_name: string;
  last_name: string;
  applicant_address: string;
  applicant_phone: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  dependents: string;
  
  // Employment details
  employer_name: string;
  employment_duration: string;
  existing_loans_amount: string;
  credit_score: string;
  
  // Emergency contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  
  // Calculated fields
  interest_rate: number;
  processing_fee: number;
  monthly_payment: number;
  total_payment: number;
}

interface DocumentUploads {
  id_document_front: File | null;
  id_document_back: File | null;
  bank_statement: File | null;
  proof_of_income: File | null;
}

export function EnhancedLoanApplicationForm() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    purpose: '',
    tenure_days: '',
    employment_status: '',
    monthly_income: '',
    first_name: '',
    last_name: '',
    applicant_address: '',
    applicant_phone: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    dependents: '0',
    employer_name: '',
    employment_duration: '',
    existing_loans_amount: '0',
    credit_score: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    interest_rate: 12.5,
    processing_fee: 0,
    monthly_payment: 0,
    total_payment: 0
  });

  const [documents, setDocuments] = useState<DocumentUploads>({
    id_document_front: null,
    id_document_back: null,
    bank_statement: null,
    proof_of_income: null
  });

  const calculateLoan = () => {
    const amount = parseFloat(formData.amount);
    const days = parseInt(formData.tenure_days);
    const dailyRate = formData.interest_rate / 100 / 365;
    
    if (amount && days && dailyRate) {
      const totalInterest = amount * dailyRate * days;
      const totalPayment = amount + totalInterest;
      const processingFee = amount * 0.025;
      
      setFormData(prev => ({
        ...prev,
        monthly_payment: totalPayment / days, // Daily payment
        total_payment: totalPayment,
        processing_fee: processingFee
      }));
    }
  };

  const uploadDocument = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${path}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;
    return fileName;
  };

  const handleFileUpload = (documentType: keyof DocumentUploads, file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setUploading(true);

    try {
      // Upload documents
      const documentUrls: Partial<Record<string, string>> = {};
      
      if (documents.id_document_front) {
        documentUrls.id_document_front_url = await uploadDocument(documents.id_document_front, 'id_front');
      }
      if (documents.id_document_back) {
        documentUrls.id_document_back_url = await uploadDocument(documents.id_document_back, 'id_back');
      }
      if (documents.bank_statement) {
        documentUrls.bank_statement_url = await uploadDocument(documents.bank_statement, 'bank_statement');
      }
      if (documents.proof_of_income) {
        documentUrls.proof_of_income_url = await uploadDocument(documents.proof_of_income, 'proof_of_income');
      }

      setUploading(false);

      // Submit loan application
      const { error } = await supabase
        .from('loan_applications')
        .insert({
          user_id: user!.id,
          amount: parseFloat(formData.amount),
          interest_rate: formData.interest_rate,
          tenure_days: parseInt(formData.tenure_days),
          monthly_payment: formData.monthly_payment,
          total_payment: formData.total_payment,
          processing_fee: formData.processing_fee,
          purpose: formData.purpose,
          employment_status: formData.employment_status,
          monthly_income: parseFloat(formData.monthly_income),
          first_name: formData.first_name,
          last_name: formData.last_name,
          applicant_address: formData.applicant_address,
          applicant_phone: formData.applicant_phone,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          marital_status: formData.marital_status,
          dependents: parseInt(formData.dependents),
          employer_name: formData.employer_name,
          employment_duration: formData.employment_duration,
          existing_loans_amount: parseFloat(formData.existing_loans_amount),
          credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          ...documentUrls
        });

      if (error) throw error;

      toast.success('Loan application submitted successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        purpose: '',
        tenure_days: '',
        employment_status: '',
        monthly_income: '',
        first_name: '',
        last_name: '',
        applicant_address: '',
        applicant_phone: '',
        date_of_birth: '',
        gender: '',
        marital_status: '',
        dependents: '0',
        employer_name: '',
        employment_duration: '',
        existing_loans_amount: '0',
        credit_score: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        interest_rate: 12.5,
        processing_fee: 0,
        monthly_payment: 0,
        total_payment: 0
      });
      setDocuments({
        id_document_front: null,
        id_document_back: null,
        bank_statement: null,
        proof_of_income: null
      });
      setCurrentStep('personal');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit loan application');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Enhanced Loan Application
        </CardTitle>
        <CardDescription>
          Complete application with personal details and document uploads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="personal" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Personal</span>
              <span className="sm:hidden">1</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Building className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Employment</span>
              <span className="sm:hidden">2</span>
            </TabsTrigger>
            <TabsTrigger value="loan" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Loan Details</span>
              <span className="sm:hidden">3</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">4</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="Enter your first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Enter your last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={formData.applicant_address}
                  onChange={(e) => setFormData({ ...formData, applicant_address: e.target.value })}
                  required
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={formData.applicant_phone}
                  onChange={(e) => setFormData({ ...formData, applicant_phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={formData.marital_status} onValueChange={(value) => setFormData({ ...formData, marital_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependents">Number of Dependents</Label>
                <Select value={formData.dependents} onValueChange={(value) => setFormData({ ...formData, dependents: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-primary flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergency_name">Contact Name</Label>
                  <Input
                    id="emergency_name"
                    placeholder="Emergency contact name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    placeholder="Emergency contact phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep('employment')}>
                Next: Employment Details
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status *</Label>
                <Select 
                  value={formData.employment_status} 
                  onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_name">Employer/Company Name</Label>
                <Input
                  id="employer_name"
                  placeholder="Enter employer or company name"
                  value={formData.employer_name}
                  onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_duration">Employment Duration</Label>
                <Select value={formData.employment_duration} onValueChange={(value) => setFormData({ ...formData, employment_duration: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_than_6_months">Less than 6 months</SelectItem>
                    <SelectItem value="6_months_to_1_year">6 months to 1 year</SelectItem>
                    <SelectItem value="1_to_2_years">1 to 2 years</SelectItem>
                    <SelectItem value="2_to_5_years">2 to 5 years</SelectItem>
                    <SelectItem value="more_than_5_years">More than 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Income ($) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="existing_loans">Existing Loans Amount ($)</Label>
                <Input
                  id="existing_loans"
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.existing_loans_amount}
                  onChange={(e) => setFormData({ ...formData, existing_loans_amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_score">Credit Score (optional)</Label>
                <Input
                  id="credit_score"
                  type="number"
                  placeholder="e.g., 750"
                  value={formData.credit_score}
                  onChange={(e) => setFormData({ ...formData, credit_score: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('personal')} className="w-full sm:w-auto">
                Previous
              </Button>
              <Button onClick={() => setCurrentStep('loan')} className="w-full sm:w-auto">
                Next: Loan Details
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="loan" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 10000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onBlur={calculateLoan}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenure">Loan Tenure (Days) *</Label>
                <Select 
                  value={formData.tenure_days} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, tenure_days: value });
                    setTimeout(calculateLoan, 100);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="21">21 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="purpose">Loan Purpose *</Label>
                <Select 
                  value={formData.purpose} 
                  onValueChange={(value) => setFormData({ ...formData, purpose: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Use</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="home_improvement">Home Improvement</SelectItem>
                    <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                    <SelectItem value="medical">Medical Expenses</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.monthly_payment > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Payment</p>
                      <p className="text-lg font-semibold">${formData.monthly_payment.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold">${formData.total_payment.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-semibold">{formData.interest_rate}% APR</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processing Fee</p>
                      <p className="text-lg font-semibold">${formData.processing_fee.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('employment')} className="w-full sm:w-auto">
                Previous
              </Button>
              <Button onClick={() => setCurrentStep('documents')} className="w-full sm:w-auto">
                Next: Upload Documents
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 md:space-y-6">
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-primary">Required Documents</h4>
                <p className="text-sm text-muted-foreground">
                  Please upload clear photos or scans of the following documents:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id_front">ID Document (Front) *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      id="id_front"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('id_document_front', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label htmlFor="id_front" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">
                        {documents.id_document_front ? documents.id_document_front.name : 'Click to upload ID front'}
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_back">ID Document (Back) *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      id="id_back"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('id_document_back', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label htmlFor="id_back" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">
                        {documents.id_document_back ? documents.id_document_back.name : 'Click to upload ID back'}
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_statement">Bank Statement (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      id="bank_statement"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('bank_statement', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label htmlFor="bank_statement" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                       <p className="text-sm">
                         {documents.bank_statement ? documents.bank_statement.name : 'Click to upload bank statement (optional)'}
                       </p>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof_income">Proof of Income (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      id="proof_income"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('proof_of_income', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label htmlFor="proof_income" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                       <p className="text-sm">
                         {documents.proof_of_income ? documents.proof_of_income.name : 'Click to upload proof of income (optional)'}
                       </p>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('loan')} className="w-full sm:w-auto">
                  Previous
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={
                    submitting || 
                    !formData.amount || 
                    !formData.purpose || 
                    !formData.employment_status ||
                    !formData.first_name ||
                    !formData.last_name ||
                    !formData.applicant_address ||
                    !formData.applicant_phone ||
                    !documents.id_document_front ||
                    !documents.id_document_back
                  }
                  className="bg-gradient-hero hover:shadow-glow transition-all duration-300 w-full sm:w-auto"
                >
                  {uploading ? 'Uploading Documents...' : submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}