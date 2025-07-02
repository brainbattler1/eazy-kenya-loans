import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import NotificationCenter from '@/components/NotificationCenter';
import { Menu, MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution?: string;
}

const Support = () => {
  const { user, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user?.id,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent'
        });

      if (error) throw error;

      toast.success('Support ticket created successfully!');
      setFormData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium'
      });
      setShowCreateForm(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
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
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  <h1 className="text-xl font-semibold text-primary">Support Center</h1>
                  <p className="text-sm text-muted-foreground">Get help and support for your account</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
                <NotificationCenter />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Quick Contact Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Need Immediate Help?</h3>
                        <p className="text-sm text-muted-foreground">Get instant support through direct contact</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="https://wa.me/18723298624"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
                        </svg>
                        WhatsApp
                      </a>
                      <a
                        href="tel:+254794105975"
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        Call Now
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Support Hours</h3>
                        <p className="text-sm text-muted-foreground">We're here to help you</p>
                      </div>
                      <Clock className="h-8 w-8 text-primary/60" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span className="font-medium">8:00 AM - 6:00 PM EAT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span className="font-medium">9:00 AM - 2:00 PM EAT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tickets</p>
                        <p className="text-2xl font-bold text-primary">{tickets.length}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Open Tickets</p>
                        <p className="text-2xl font-bold text-primary">
                          {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                        <p className="text-2xl font-bold text-primary">
                          {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Create Ticket Form */}
              {showCreateForm && (
                <Card className="shadow-card bg-gradient-card border-0">
                  <CardHeader>
                    <CardTitle className="text-primary">Create New Support Ticket</CardTitle>
                    <CardDescription>
                      Describe your issue and we'll help you resolve it
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            placeholder="Brief description of your issue"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="account">Account Issues</SelectItem>
                              <SelectItem value="loan">Loan Applications</SelectItem>
                              <SelectItem value="payment">Payment Issues</SelectItem>
                              <SelectItem value="technical">Technical Support</SelectItem>
                              <SelectItem value="general">General Inquiry</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={formData.priority} 
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Please provide detailed information about your issue..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
                        >
                          {submitting ? 'Creating...' : 'Create Ticket'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Tickets List */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="text-primary">Your Support Tickets</CardTitle>
                  <CardDescription>
                    Track the status of your support requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTickets ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No support tickets found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create a ticket to get help with any issues
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <Card key={ticket.id} className="border border-border/50">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {ticket.category.replace('_', ' ')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority.toUpperCase()}
                                </Badge>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {ticket.description}
                            </p>

                            {ticket.resolution && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-800">
                                  <strong>Resolution:</strong> {ticket.resolution}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Created: {formatDate(ticket.created_at)}</span>
                              {ticket.resolved_at && (
                                <span>Resolved: {formatDate(ticket.resolved_at)}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
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

export default Support;