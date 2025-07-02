import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, 0.05, -0.01, 0.9]
    }
  }
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const stepCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.6, 0.05, -0.01, 0.9]
    }
  }
};

const Index = () => {
  const howItWorksRef = useRef(null);
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <Hero />
        
        {/* How it Works Section */}
        <section 
          ref={howItWorksRef}
          id="how-it-works" 
          className="py-20"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isHowItWorksInView ? "visible" : "hidden"}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                How Eazy Loan Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get started with our simple platform
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isHowItWorksInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  step: 1,
                  title: "Sign Up",
                  description: "Create your account with our simple registration process. Takes less than 2 minutes."
                },
                {
                  step: 2,
                  title: "Complete Profile",
                  description: "Add your personal information and verify your email address to get started."
                },
                {
                  step: 3,
                  title: "Access Dashboard",
                  description: "Use your personalized dashboard to manage your account and access our services."
                }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={stepCardVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-center space-y-4"
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto bg-gradient-hero rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;