import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Mail, Phone } from 'lucide-react';

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

const Contact = () => {
  const heroRef = useRef(null);
  const contactRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { once: true });
  const isContactInView = useInView(contactRef, { once: true });

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
                Contact Us
              </h1>
              <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto">
                Get in touch with our support team. We're here to help you with any questions or concerns.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section 
          ref={contactRef}
          className="py-20"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Quick Contact Options */}
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isContactInView ? "visible" : "hidden"}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
                Get Instant Support
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Contact us directly through WhatsApp or phone for immediate assistance with your loan application or account.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isContactInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
            >
              {/* WhatsApp Contact */}
              <motion.div variants={fadeUpVariants}>
                <Card className="shadow-premium bg-gradient-card border-0 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-green-500 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-4">WhatsApp Support</h3>
                    <p className="text-muted-foreground mb-6">
                      Get instant responses to your questions through WhatsApp. Our team is ready to help you.
                    </p>
                    <div className="space-y-4">
                      <p className="text-lg font-semibold">+1 (872) 329-8624</p>
                      <motion.a
                        href="https://wa.me/18723298624"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200"
                      >
                        Chat on WhatsApp
                      </motion.a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Phone Contact */}
              <motion.div variants={fadeUpVariants}>
                <Card className="shadow-premium bg-gradient-card border-0 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center mb-6">
                      <Phone className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-4">Phone Support</h3>
                    <p className="text-muted-foreground mb-6">
                      Speak directly with our customer service team for personalized assistance with your account.
                    </p>
                    <div className="space-y-4">
                      <p className="text-lg font-semibold">+254 794 105 975</p>
                      <motion.a
                        href="tel:+254794105975"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200"
                      >
                        Call Now
                      </motion.a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Contact Information Grid */}
            <motion.div 
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isContactInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            >
              {/* Support Hours */}
              <motion.div variants={fadeUpVariants}>
                <Card className="shadow-card bg-gradient-card border-0 h-full">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-4">Support Hours</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span className="font-medium">8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span className="font-medium">9:00 AM - 2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="font-medium">Closed</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        All times in East Africa Time (EAT)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeUpVariants}>
                <Card className="shadow-card bg-gradient-card border-0 h-full">
                  <CardContent className="p-6 text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-4">Email Support</h3>
                    <p className="text-muted-foreground mb-4">
                      Send us detailed inquiries and we'll respond within 24 hours.
                    </p>
                    <a 
                      href="mailto:support@eazyloan.co.ke"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      support@eazyloan.co.ke
                    </a>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Location */}
              <motion.div variants={fadeUpVariants}>
                <Card className="shadow-card bg-gradient-card border-0 h-full">
                  <CardContent className="p-6 text-center">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-4">Location</h3>
                    <p className="text-muted-foreground">
                      Nairobi, Kenya
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Serving customers across Kenya
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div 
              variants={fadeUpVariants}
              initial="hidden"
              animate={isContactInView ? "visible" : "hidden"}
              className="text-center"
            >
              <Card className="shadow-premium bg-gradient-subtle border-0">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Quick answers to common questions about our loan services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {[
                      {
                        question: "How quickly can I get my loan approved?",
                        answer: "Most loans are approved within minutes using our AI-powered system. Once approved, funds are disbursed within hours."
                      },
                      {
                        question: "What documents do I need?",
                        answer: "You need a valid Kenyan National ID or Passport, active phone number, and a bank account or M-Pesa for disbursement."
                      },
                      {
                        question: "What are the interest rates?",
                        answer: "Our interest rates are competitive and transparent, starting from 12.5% per year. Use our calculator to see exact costs."
                      },
                      {
                        question: "How do I repay my loan?",
                        answer: "You can repay through M-Pesa, bank transfer, or other convenient payment methods. We'll send you reminders before due dates."
                      }
                    ].map((faq, index) => (
                      <div key={index} className="p-4 bg-gradient-card rounded-lg border border-border/50">
                        <h4 className="font-semibold text-primary mb-2">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Contact;