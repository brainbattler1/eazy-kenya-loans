import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroBanner from '@/assets/hero-banner.jpg';
import { motion, Variants } from 'framer-motion';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8
    }
  }
};

const Hero = () => {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-primary/5"
    >
      {/* Background Image */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={heroBanner} 
          alt="Modern financial services" 
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Trust Badge */}
          <motion.div variants={fadeIn}>
            <Badge className="mb-6 bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors">
              ✓ Licensed & Regulated in Kenya
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={fadeIn}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent leading-tight"
          >
            Quick Loans Made
            <br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-secondary"
            >
              Simple & Fast
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={fadeIn}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Get instant access to personal loans up to <span className="font-semibold text-primary">KES 500,000</span>.
            No paperwork, no long waits. Just quick, reliable financing when you need it most.
          </motion.p>

          {/* Key Benefits */}
          <motion.div 
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {[
              "📱 Mobile-First Experience",
              "⚡ 24-Hour Approval",
              "🔒 Bank-Level Security"
            ].map((benefit, index) => (
              <motion.div
                key={benefit}
                variants={scaleIn}
                custom={index}
              >
                <Badge variant="outline" className="py-2 px-4 text-sm border-primary/20">
                  {benefit}
                </Badge>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={fadeIn}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-hero hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 h-auto"
              >
                Apply for Loan Now
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 h-auto border-primary/20 hover:bg-primary/5"
              >
                Calculate Repayment
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            variants={staggerContainer}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "50K+", label: "Happy Customers" },
              { value: "KES 2B+", label: "Loans Disbursed" },
              { value: "24hrs", label: "Average Approval" },
              { value: "98%", label: "Approval Rate" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                custom={index}
                className="text-center"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.2 }}
                  className="text-2xl sm:text-3xl font-bold text-primary mb-2"
                >
                  {stat.value}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + index * 0.2 }}
                  className="text-sm text-muted-foreground"
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;