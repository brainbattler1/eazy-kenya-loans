import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, AlertTriangle, Users, Power } from 'lucide-react';

interface MaintenanceMode {
  id: string;
  is_enabled: boolean;
  message: string;
  enabled_by?: string;
  enabled_at?: string;
  updated_at?: string;
}

interface SystemManagerProps {
  currentUserId: string;
}

export function SystemManager({ currentUserId }: SystemManagerProps) {
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_mode')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMaintenance(data);
        setMaintenanceMessage(data.message);
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch maintenance status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async (enable: boolean) => {
    setActionLoading(true);
    try {
      // First check if maintenance_mode record exists
      const { data: existing } = await supabase
        .from('maintenance_mode')
        .select('*')
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('maintenance_mode')
          .update({
            is_enabled: enable,
            message: maintenanceMessage,
            enabled_by: enable ? currentUserId : null,
            enabled_at: enable ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('maintenance_mode')
          .insert({
            is_enabled: enable,
            message: maintenanceMessage,
            enabled_by: enable ? currentUserId : null,
            enabled_at: enable ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Send notifications to all users
      if (enable) {
        const { data: profiles } = await supabase.from('profiles').select('user_id');
        if (profiles) {
          for (const profile of profiles) {
            await supabase.from('notifications').insert({
              user_id: profile.user_id,
              title: 'Maintenance Mode Enabled',
              message: maintenanceMessage,
              type: 'warning'
            });
          }
        }
      } else {
        const { data: profiles } = await supabase.from('profiles').select('user_id');
        if (profiles) {
          for (const profile of profiles) {
            await supabase.from('notifications').insert({
              user_id: profile.user_id,
              title: 'Maintenance Complete',
              message: 'The system is now back online. Thank you for your patience.',
              type: 'success'
            });
          }
        }
      }

      toast({
        title: 'Success',
        description: `Maintenance mode ${enable ? 'enabled' : 'disabled'} successfully`
      });

      fetchMaintenanceStatus();
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle maintenance mode',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
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
    <div className="space-y-6">
      {/* Maintenance Mode Control */}
      <Card className="shadow-card bg-gradient-card border-0">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Control system-wide maintenance mode for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
            <div className="space-y-1">
              <h3 className="font-medium flex items-center gap-2">
                <Power className="h-4 w-4" />
                Maintenance Mode
              </h3>
              <p className="text-sm text-muted-foreground">
                {maintenance?.is_enabled 
                  ? 'System is currently in maintenance mode' 
                  : 'System is operating normally'
                }
              </p>
              {maintenance?.is_enabled && maintenance?.enabled_at && (
                <p className="text-xs text-muted-foreground">
                  Enabled on: {new Date(maintenance.enabled_at).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                maintenance?.is_enabled ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <Switch
                checked={maintenance?.is_enabled || false}
                onCheckedChange={(checked) => {
                  if (checked || !maintenance?.is_enabled) {
                    // Show confirmation dialog for both enabling and disabling
                    const dialog = document.querySelector('[data-maintenance-dialog]') as HTMLButtonElement;
                    if (dialog) dialog.click();
                  }
                }}
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Maintenance Message</label>
            <Textarea
              placeholder="Enter message to display to users during maintenance..."
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button data-maintenance-dialog className="hidden">Hidden Trigger</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {maintenance?.is_enabled ? 'Disable' : 'Enable'} Maintenance Mode
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {maintenance?.is_enabled 
                    ? 'Are you sure you want to disable maintenance mode? Users will regain full access to the system.'
                    : 'Are you sure you want to enable maintenance mode? This will restrict access for all regular users and notify them of the maintenance.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => toggleMaintenanceMode(!maintenance?.is_enabled)}
                  className={maintenance?.is_enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {maintenance?.is_enabled ? 'Disable' : 'Enable'} Maintenance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {maintenance?.is_enabled && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">System in Maintenance Mode</span>
              </div>
              <p className="text-sm text-orange-700">
                Regular users are currently unable to access the system. 
                Only administrators can use the application during maintenance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Statistics */}
      <Card className="shadow-card bg-gradient-card border-0">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system status and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-medium mb-1">System Status</h3>
              <p className={`text-sm ${maintenance?.is_enabled ? 'text-orange-600' : 'text-green-600'}`}>
                {maintenance?.is_enabled ? 'Under Maintenance' : 'Operational'}
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg">
              <h3 className="font-medium mb-1">Last Updated</h3>
              <p className="text-sm text-muted-foreground">
                {maintenance?.updated_at 
                  ? new Date(maintenance.updated_at).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}