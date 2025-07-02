
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAdminCheck } from './useAdminCheck';

export const useAdminNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();

  const navigateToAdmin = () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to admin panel when implemented
    toast({
      title: 'Admin Panel',
      description: 'Admin functionality will be available soon.',
      variant: 'default'
    });
  };

  return { navigateToAdmin, isAdmin };
};
