import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, User, Clock, CheckCircle } from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user_email?: string;
}

interface TicketManagerProps {
  currentUserId: string;
}

export function TicketManager({ currentUserId }: TicketManagerProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Get user details for each ticket
      const ticketsWithUserInfo = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(ticket.user_id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', ticket.user_id)
              .single();

            return {
              ...ticket,
              user_email: authUser.user?.email,
              user_name: profile?.full_name
            };
          } catch (error) {
            console.error('Error fetching user info for ticket:', ticket.id, error);
            return ticket;
          }
        })
      );

      setTickets(ticketsWithUserInfo);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user details for each message
      const messagesWithUserInfo = await Promise.all(
        (messagesData || []).map(async (message) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(message.user_id);
            return {
              ...message,
              user_email: authUser.user?.email
            };
          } catch (error) {
            console.error('Error fetching user info for message:', message.id, error);
            return message;
          }
        })
      );

      setTicketMessages(messagesWithUserInfo);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ticket messages',
        variant: 'destructive'
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setActionLoading(ticketId);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() })
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ticket status updated successfully'
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: currentUserId,
          message: responseMessage,
          is_internal: false
        });

      if (error) throw error;

      // Send notification to the user
      await supabase.from('notifications').insert({
        user_id: selectedTicket.user_id,
        title: 'Support Response',
        message: `You have received a response for your ticket: ${selectedTicket.subject}`,
        type: 'info'
      });

      toast({
        title: 'Success',
        description: 'Response sent successfully'
      });

      setResponseMessage('');
      fetchTicketMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'Failed to send response',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <MessageSquare className="h-5 w-5" />
          Support Tickets Management
        </CardTitle>
        <CardDescription>
          Manage and respond to user support tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No support tickets found</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="border border-border/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{ticket.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {ticket.user_name || 'Unknown'} ({ticket.user_email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()} • Category: {ticket.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm mb-4 line-clamp-2">{ticket.description}</p>

                <div className="flex items-center gap-2">
                  {/* View Messages Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          fetchTicketMessages(ticket.id);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        View Messages
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Ticket: {selectedTicket?.subject}</DialogTitle>
                        <DialogDescription>
                          Conversation with {selectedTicket?.user_name || selectedTicket?.user_email}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
                        {/* Original ticket description */}
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{selectedTicket?.user_email}</span>
                            <Badge variant="outline">Original Request</Badge>
                          </div>
                          <p className="text-sm">{selectedTicket?.description}</p>
                        </div>

                        {/* Messages */}
                        {ticketMessages.map((message) => (
                          <div key={message.id} className={`p-3 rounded-lg ${
                            message.user_id === currentUserId ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{message.user_email}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                              {message.user_id === currentUserId && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))}
                      </div>

                      {/* Response box */}
                      <div className="border-t pt-4 space-y-3">
                        <Textarea
                          placeholder="Type your response..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-between">
                          <Select
                            value={selectedTicket?.status}
                            onValueChange={(value: any) => 
                              selectedTicket && updateTicketStatus(selectedTicket.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={sendResponse}
                            disabled={!responseMessage.trim()}
                          >
                            Send Response
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Quick Status Updates */}
                  {ticket.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                      disabled={actionLoading === ticket.id}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Start Work
                    </Button>
                  )}

                  {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                    <Button
                      size="sm"
                      onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                      disabled={actionLoading === ticket.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
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