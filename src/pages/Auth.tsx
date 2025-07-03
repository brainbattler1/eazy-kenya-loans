import { useState, useEffect } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import eazyLoanLogo from '@/assets/eazy-loan-logo.jpg';
import { supabase } from '@/integrations/supabase/client';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
};

const formFieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2
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

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const Auth = () => {
  const { user, signUp, signIn, verifyOtp, resendOtp, resetPassword } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [searchParams] = useSearchParams();
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Check for navigation state to auto-switch to signup tab
  useEffect(() => {
    if (location.state?.defaultTab === 'signup') {
      setActiveTab('signup');
    }
  }, [location.state]);

  // Check for referral code in URL
  useEffect(() => {
    const fetchReferrerInfo = async () => {
      const refCode = searchParams.get('ref');
      if (refCode) {
        setActiveTab('signup');
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('referral_code', refCode)
            .single();
          
          if (data) {
            setReferrerName(data.full_name);
            toast({
              title: `You were invited by ${data.full_name}`,
              description: 'Sign up now to get started!',
              duration: 5000
            });
          }
        } catch (error) {
          console.error('Error fetching referrer info:', error);
        }
      }
    };

    fetchReferrerInfo();
  }, [searchParams, toast]);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  if (user && user.email_confirmed_at) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    console.log('🎯 HandleSignUp called with:', { 
      email: values.email, 
      fullName: values.fullName,
      passwordLength: values.password.length 
    });
    
    setLoading(true);
    
    try {
      const { error } = await signUp(values.email, values.password, values.fullName);
      
      console.log('🔄 SignUp returned:', { error });
      
      if (error) {
        console.error('💥 Detailed signup error:', {
          message: error.message,
          name: error.name,
          fullError: error
        });
        
        toast({
          title: 'Error',
          description: `Signup failed: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
      } else {
        // Store referral info for later tracking in profile creation
        const refCode = searchParams.get('ref');
        if (refCode) {
          localStorage.setItem('pendingReferralCode', refCode);
        }

        setPendingEmail(values.email);
        setOtpStep(true);
        toast({
          title: 'Check your email',
          description: 'We sent you a 6-digit verification code.'
        });
      }
    } catch (unexpectedError) {
      console.error('🚨 Unexpected error in handleSignUp:', unexpectedError);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during signup.',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    const { error } = await signIn(values.email, values.password);
    
    if (error) {
      if (error.message.includes('Email not confirmed') || error.name === 'EmailNotConfirmed') {
        setPendingEmail(values.email);
        setOtpStep(true);
        toast({
          title: 'Email verification required',
          description: 'Please verify your email with the code we sent you, or click the confirmation link in your email.'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(pendingEmail, otpValue);
    
    if (error) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Email verified successfully!'
      });
      setOtpStep(false);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const { error } = await resendOtp(pendingEmail);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Code sent',
        description: 'A new verification code has been sent to your email.'
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);
    const { error } = await resetPassword(values.email);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Reset Email Sent',
        description: 'Please check your email for password reset instructions.'
      });
      setForgotPasswordStep(false);
    }
    setLoading(false);
  };

  if (forgotPasswordStep) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <motion.div 
          className="w-full max-w-md"
          variants={itemVariants}
        >
          <Card className="shadow-card bg-gradient-card border-0">
            <CardHeader className="text-center space-y-4">
              <motion.div variants={itemVariants} className="flex flex-col items-center space-y-4">
                <motion.img 
                  src={eazyLoanLogo} 
                  alt="Eazy Loan" 
                  className="w-16 h-16 rounded-lg shadow-soft"
                  variants={itemVariants}
                />
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-primary">
                    Forgot Password
                  </CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send you a link to reset your password
                  </CardDescription>
                </div>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <motion.div variants={formFieldVariants}>
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
                    >
                      Send Reset Email
                    </Button>
                  </motion.div>
                </form>
              </Form>
              
              <Button 
                variant="ghost" 
                onClick={() => setForgotPasswordStep(false)}
                className="flex items-center gap-2 mx-auto text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {otpStep ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOtpStep(false)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                Enter the verification code sent to {pendingEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputOTP
                value={otpValue}
                onChange={setOtpValue}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot
                        key={index}
                        char={slot.char}
                        hasFakeCaret={slot.hasFakeCaret}
                        isActive={slot.isActive}
                      />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <div className="flex flex-col gap-2">
                <motion.div variants={buttonVariants}>
                  <Button
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpValue.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </Button>
                </motion.div>
                <motion.div variants={buttonVariants}>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Resend Code'}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          <motion.div className="w-full max-w-md" variants={itemVariants}>
            <Card className="shadow-card bg-gradient-card border-0">
              <CardHeader className="text-center space-y-4">
                <motion.div variants={itemVariants} className="flex flex-col items-center space-y-4">
                  <motion.img 
                    src={eazyLoanLogo} 
                    alt="Eazy Loan" 
                    className="w-20 h-20 rounded-xl shadow-soft"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                      Eazy Loan
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Quick & Easy Loans for Kenya
                    </CardDescription>
                    <CardDescription className="text-sm text-muted-foreground">
                      Sign in to your account or create a new one
                    </CardDescription>
                  </div>
                </motion.div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <Form {...signInForm}>
                      <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signInForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Enter your password"
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
                          >
                            Sign In
                          </Button>
                        </motion.div>
                      </form>
                    </Form>

                    <motion.div
                      variants={itemVariants}
                      className="mt-4 text-center"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setForgotPasswordStep(true)}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Forgot Password?
                      </Button>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signUpForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Create a password"
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants}>
                          <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirm your password"
                                      {...field}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>

                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
                          >
                            Create Account
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Auth;