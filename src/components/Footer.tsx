import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import type { Variants } from 'framer-motion';

const footerVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.6, 0.05, -0.01, 0.9],
      staggerChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, 0.05, -0.01, 0.9]
    }
  }
};

const Footer = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.footer
      ref={ref}
      variants={footerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="bg-primary text-primary-foreground"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          variants={footerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold">Eazy Loan</span>
            </motion.div>
            <motion.p 
              variants={itemVariants}
              className="text-primary-foreground/80 text-sm leading-relaxed"
            >
              Quick, reliable loans for Kenyans. Licensed and regulated for your security and peace of mind.
            </motion.p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <motion.h3 
              variants={itemVariants}
              className="font-semibold mb-4"
            >
              Quick Links
            </motion.h3>
            <motion.ul variants={itemVariants} className="space-y-2 text-sm">
              {[
                { href: "#calculator", text: "Loan Calculator" },
                { href: "#how-it-works", text: "How it Works" },
                { href: "#apply", text: "Apply Now" },
                { href: "#support", text: "Support" }
              ].map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a 
                    href={link.href} 
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.text}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <motion.h3 
              variants={itemVariants}
              className="font-semibold mb-4"
            >
              Legal
            </motion.h3>
            <motion.ul variants={itemVariants} className="space-y-2 text-sm">
              {[
                { href: "#privacy", text: "Privacy Policy" },
                { href: "#terms", text: "Terms of Service" },
                { href: "#rates", text: "Interest Rates" },
                { href: "#complaints", text: "Complaints" }
              ].map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a 
                    href={link.href} 
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.text}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <motion.h3 
              variants={itemVariants}
              className="font-semibold mb-4"
            >
              Contact Us
            </motion.h3>
            <motion.ul variants={itemVariants} className="space-y-2 text-sm text-primary-foreground/80">
              {[
                "📧 support@eazyloan.co.ke",
                "📞 +254 700 000 000",
                "🕒 Mon-Fri: 8AM-6PM",
                "📍 Nairobi, Kenya"
              ].map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 5 }}
                  className="cursor-default"
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60"
        >
          <motion.p variants={itemVariants}>
            &copy; 2024 Eazy Loan. All rights reserved. Licensed by Central Bank of Kenya.
          </motion.p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;