import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bell } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface NotificationManagerProps {
  users: User[];
}

export function NotificationManager({ users }: NotificationManagerProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim() || !recipient) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      if (recipient === 'all_users') {
        // Send to all users
        const { data: profiles } = await supabase.from('profiles').select('user_id');
        if (profiles) {
          for (const profile of profiles) {
            await supabase.from('notifications').insert({
              user_id: profile.user_id,
              title,
              message,
              type: notificationType
            });
          }
        }
      } else if (recipient === 'all_admins') {
        // Send to all admins
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['admin', 'superadmin']);
        
        if (adminRoles) {
          for (const role of adminRoles) {
            await supabase.from('notifications').insert({
              user_id: role.user_id,
              title,
              message,
              type: notificationType
            });
          }
        }
      } else {
        // Send to specific user
        const { error } = await supabase.rpc('send_notification_to_user', {
          _user_id: recipient,
          _title: title,
          _message: message,
          _type: notificationType
        });
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Notification sent successfully'
      });

      // Reset form
      setTitle('');
      setMessage('');
      setRecipient('');
      setNotificationType('info');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card border-0">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Notifications
        </CardTitle>
        <CardDescription>
          Send notifications to users or admins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <Input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Message</label>
          <Textarea
            placeholder="Notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Recipient</label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_users">All Users</SelectItem>
              <SelectItem value="all_admins">All Admins</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSendNotification}
          disabled={sending}
          className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}