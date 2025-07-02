import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, AlertTriangle, Users, Power } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenanceMode {
  id: string;
  is_enabled: boolean;
  message: string | null;
  enabled_by: string | null;
  enabled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SystemAccess {
  access_status: 'granted' | 'maintenance';
  maintenance_message: string | null;
}

interface SystemManagerProps {
  currentUserId: string;
}

export function SystemManager({ currentUserId }: SystemManagerProps) {
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null);
  const [systemAccess, setSystemAccess] = useState<SystemAccess | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchMaintenanceStatus();

    // Set up realtime subscription for maintenance mode updates
    const channel = supabase
      .channel('maintenance-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_maintenance'
      }, () => {
        fetchMaintenanceStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      // First check system access status
      const { data: accessData, error: accessError } = await supabase
        .from('system_access')
        .select('*')
        .single();

      if (accessError) throw accessError;

      if (accessData) {
        setSystemAccess({
          access_status: accessData.access_status as 'granted' | 'maintenance',
          maintenance_message: accessData.maintenance_message
        });
      }

      // Then get maintenance details
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('system_maintenance')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (maintenanceError) throw maintenanceError;

      if (maintenanceData) {
        setMaintenance(maintenanceData);
        setMaintenanceMessage(maintenanceData.message || '');
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch maintenance status. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async (enable: boolean) => {
    if (!isAdmin) {
      toast({
        title: 'Error',
        description: 'You do not have permission to toggle maintenance mode.',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('toggle_maintenance_mode', {
          enable_maintenance: enable,
          maintenance_message: maintenanceMessage || 'System is currently under maintenance. Please try again later.'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Maintenance mode ${enable ? 'enabled' : 'disabled'} successfully`
      });

      // No need to call fetchMaintenanceStatus here as the realtime subscription will handle it
    } catch (error: any) {
      console.error('Error toggling maintenance mode:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle maintenance mode. Please try again.',
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
                  // Show confirmation dialog for both enabling and disabling
                  const dialog = document.querySelector('[data-maintenance-dialog]') as HTMLButtonElement;
                  if (dialog) dialog.click();
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
              <h3 className="font-medium mb-1">System Access</h3>
              <p className={`text-sm ${systemAccess?.access_status === 'maintenance' ? 'text-orange-600' : 'text-green-600'}`}>
                {systemAccess?.access_status === 'maintenance' ? 'Under Maintenance' : 'Operational'}
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