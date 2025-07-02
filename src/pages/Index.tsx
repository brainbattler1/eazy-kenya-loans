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

        {/* Support Contact Section */}
        <section className="py-16 bg-gradient-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Need Help? We're Here for You
              </h2>
              <p className="text-lg text-muted-foreground">
                Get instant support through WhatsApp or phone call
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.a
                href="https://wa.me/18723298624"
                target="_blank"
                rel="noopener noreferrer"
                variants={stepCardVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl shadow-soft transition-all duration-300 hover:shadow-glow"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
                </svg>
                <div className="text-left">
                  <div className="font-semibold">WhatsApp Support</div>
                  <div className="text-sm opacity-90">+1 (872) 329-8624</div>
                </div>
              </motion.a>

              <motion.a
                href="tel:+254794105975"
                variants={stepCardVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-4 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl shadow-soft transition-all duration-300 hover:shadow-glow"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <div className="text-left">
                  <div className="font-semibold">Phone Support</div>
                  <div className="text-sm opacity-90">+254 794 105 975</div>
                </div>
              </motion.a>
            </motion.div>

            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <p className="text-muted-foreground">
                Available Monday - Friday, 8:00 AM - 6:00 PM EAT
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;