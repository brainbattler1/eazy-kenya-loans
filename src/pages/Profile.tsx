import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock, Upload, Camera, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  full_name: string;
  email_verified: boolean;
  avatar_url?: string;
}

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const formFieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98
  }
};

const Profile = () => {
  const { user, maintenanceMode, maintenanceMessage } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email_verified: false,
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email_verified, avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email_verified: data.email_verified || false,
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === 'P0001' && error.message?.includes('maintenance')) {
        toast.error('System is under maintenance. Profile updates are temporarily disabled.');
      } else {
        toast.error('Failed to update profile. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          const { error: removeError } = await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
          
          if (removeError) throw removeError;
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      if (error.code === 'P0001' && error.message?.includes('maintenance')) {
        toast.error('System is under maintenance. Profile updates are temporarily disabled.');
      } else {
        toast.error('Failed to upload profile picture. Please try again later.');
      }
      
      // Clean up uploaded file if profile update failed
      if (error.code === 'P0001') {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `avatar_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          await supabase.storage
            .from('avatars')
            .remove([filePath]);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
        }
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-subtle"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="container mx-auto px-4 py-8">
        {maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-warning bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <h3 className="font-medium">System Under Maintenance</h3>
                    <p className="text-sm text-muted-foreground">
                      {maintenanceMessage || 'Profile updates are temporarily disabled. Please try again later.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          className="flex items-center gap-4 mb-8"
          variants={headerVariants}
        >
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </motion.div>
          <motion.div variants={formFieldVariants}>
            <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-3"
          variants={cardVariants}
        >
          {/* Profile Picture Card */}
          <motion.div variants={cardVariants}>
            <Card className="shadow-card bg-gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Profile Picture</CardTitle>
                <CardDescription>Your profile avatar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="flex flex-col items-center space-y-4"
                  variants={formFieldVariants}
                >
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      {profile.avatar_url ? (
                        <AvatarImage 
                          src={profile.avatar_url} 
                          alt="Profile picture"
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                        {getInitials(profile.full_name || user?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </motion.div>
                  <p className="text-center text-sm text-muted-foreground">
                    Click the camera icon to upload a profile picture
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Information */}
          <motion.div 
            className="md:col-span-2"
            variants={cardVariants}
          >
            <Card className="shadow-card bg-gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-primary">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div 
                    className="space-y-2"
                    variants={formFieldVariants}
                  >
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      required
                    />
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    variants={formFieldVariants}
                  >
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">
                      Email verification status: {profile.email_verified ? 'Verified' : 'Pending'}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4"
                    variants={formFieldVariants}
                  >
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex-1"
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handlePasswordReset}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;