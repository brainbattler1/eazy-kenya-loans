import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const navItemVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.6
    }
  }
};

const logoVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.8
    }
  }
};

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-primary">Eazy Loan</span>
          </motion.div>

          {/* Navigation */}
          <motion.nav 
            className="hidden md:flex items-center space-x-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              { href: "#calculator", text: "Calculator" },
              { href: "#how-it-works", text: "How it Works" },
              { href: "#contact", text: "Contact" }
            ].map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                variants={navItemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {item.text}
              </motion.a>
            ))}
          </motion.nav>

          {/* Auth Buttons */}
          <AnimatePresence mode="wait">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {user ? (
                <>
                  <NotificationCenter />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/dashboard')}
                      className="hidden sm:inline-flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/auth')}
                      className="hidden sm:inline-flex"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => navigate('/auth')}
                      className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;