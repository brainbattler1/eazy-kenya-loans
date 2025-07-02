import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import LoanCalculator from '@/components/LoanCalculator';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const Calculator = () => {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

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
                Loan Calculator
              </h1>
              <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto">
                Calculate your loan payments instantly. See exactly what you'll pay with our transparent calculator.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Smart Loan Calculator
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Use our advanced calculator to estimate your loan payments. 
                Adjust the amount and tenure to find the perfect loan for your needs.
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              <LoanCalculator />
            </div>

            {/* Features */}
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
            >
              {[
                {
                  title: "Instant Calculations",
                  description: "Get real-time loan estimates as you adjust the parameters",
                  icon: "⚡"
                },
                {
                  title: "No Hidden Fees",
                  description: "Transparent pricing with all costs displayed upfront",
                  icon: "💎"
                },
                {
                  title: "Flexible Terms",
                  description: "Choose from 7 to 90 days to match your repayment schedule",
                  icon: "🎯"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeUpVariants}
                  className="text-center p-6 bg-gradient-card rounded-xl shadow-card border border-border/50"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
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

export default Calculator;