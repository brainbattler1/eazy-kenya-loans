import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const stepCardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8
    }
  }
};

const HowItWorks = () => {
  const heroRef = useRef(null);
  const stepsRef = useRef(null);
  const requirementsRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { once: true });
  const isStepsInView = useInView(stepsRef, { once: true });
  const isRequirementsInView = useInView(requirementsRef, { once: true });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="pt-24 pb-12 bg-gradient-hero"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isHeroInView ? "visible" : "hidden"}
              className="text-center text-white"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                How Eazy Loan Works
              </h1>
              <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto">
                Get your loan in 3 simple steps. Our streamlined process makes borrowing quick, easy, and transparent.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Steps Section */}
        <section 
          ref={stepsRef}
          className="py-20"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isStepsInView ? "visible" : "hidden"}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Simple 3-Step Process
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From application to approval to receiving funds - we've made it as simple as possible.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isStepsInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            >
              {[
                {
                  step: 1,
                  title: "Apply Online",
                  description: "Fill out our simple application form with your basic information. The entire process takes just 5 minutes and can be completed from your phone or computer.",
                  icon: "📝",
                  details: [
                    "Complete online application",
                    "Upload required documents",
                    "Verify your identity",
                    "Submit for review"
                  ]
                },
                {
                  step: 2,
                  title: "Get Instant Approval",
                  description: "Our AI-powered system reviews your application instantly. Get approval decisions in minutes, not days, with transparent criteria and fair assessment.",
                  icon: "✅",
                  details: [
                    "Instant credit assessment",
                    "Real-time verification",
                    "Transparent decision process",
                    "Immediate notification"
                  ]
                },
                {
                  step: 3,
                  title: "Receive Funds",
                  description: "Once approved, funds are transferred directly to your M-Pesa or bank account within hours. No waiting, no paperwork, no hassles.",
                  icon: "💰",
                  details: [
                    "Direct M-Pesa transfer",
                    "Bank account deposit",
                    "Instant notifications",
                    "24/7 processing"
                  ]
                }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={stepCardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <div className="bg-gradient-card rounded-2xl p-8 shadow-premium border border-border/50 h-full">
                    <motion.div 
                      className="w-20 h-20 mx-auto bg-gradient-hero rounded-2xl flex items-center justify-center text-white text-2xl font-bold relative mb-6"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      {item.step}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-lg">
                        {item.icon}
                      </div>
                    </motion.div>
                    
                    <h3 className="text-2xl font-semibold text-primary mb-4 text-center">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 text-center">
                      {item.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {item.details.map((detail, index) => (
                        <li key={index} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Connection line for desktop */}
                  {item.step < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-y-1/2 z-10" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Requirements Section */}
        <section 
          ref={requirementsRef}
          className="py-20 bg-gradient-subtle"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isRequirementsInView ? "visible" : "hidden"}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                What You Need
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Simple requirements to get started with your loan application.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isRequirementsInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                {
                  title: "Valid ID",
                  description: "Kenyan National ID or Passport",
                  icon: "🆔"
                },
                {
                  title: "Phone Number",
                  description: "Active mobile number for verification",
                  icon: "📱"
                },
                {
                  title: "Bank Account",
                  description: "M-Pesa or bank account for disbursement",
                  icon: "🏦"
                },
                {
                  title: "Age 18+",
                  description: "Must be 18 years or older to apply",
                  icon: "👤"
                }
              ].map((req, index) => (
                <motion.div
                  key={index}
                  variants={fadeUpVariants}
                  className="text-center p-6 bg-gradient-card rounded-xl shadow-card border border-border/50"
                >
                  <div className="text-4xl mb-4">{req.icon}</div>
                  <h3 className="text-lg font-semibold text-primary mb-2">{req.title}</h3>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
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

export default HowItWorks;