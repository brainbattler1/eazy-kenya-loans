import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';

const LoanCalculator = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState([50000]);
  const [tenure, setTenure] = useState([30]);
  const [interestRate] = useState(12.5); // Fixed rate for demo
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    calculateLoan();
  }, [amount, tenure]);

  const calculateLoan = () => {
    const principal = amount[0];
    const tenureDays = tenure[0];
    const rate = interestRate / 100;
    
    // Simple interest calculation for short-term loans
    const interest = (principal * rate * tenureDays) / 365;
    const total = principal + interest;
    const monthly = total / (tenureDays / 30);
    
    setMonthlyPayment(monthly);
    setTotalPayment(total);
    setTotalInterest(interest);
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="w-full"
    >
      <Card className="shadow-premium bg-gradient-card border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">
              Loan Calculator
            </CardTitle>
          </div>
          <CardDescription>
            Calculate your loan payments and see what you can afford
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loan Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Loan Amount</Label>
              <span className="text-lg font-bold text-primary">
                KES {amount[0].toLocaleString()}
              </span>
            </div>
            <Slider
              value={amount}
              onValueChange={setAmount}
              min={1000}
              max={500000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>KES 1,000</span>
              <span>KES 500,000</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Loan Tenure</Label>
              <span className="text-lg font-bold text-primary">
                {tenure[0]} days
              </span>
            </div>
            <Slider
              value={tenure}
              onValueChange={setTenure}
              min={7}
              max={90}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>7 days</span>
              <span>90 days</span>
            </div>
          </div>

          {/* Interest Rate Display */}
          <div className="bg-accent/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Interest Rate</Label>
              <span className="text-lg font-bold text-primary">
                {interestRate}% per year
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Competitive fixed rate for all approved loans
            </p>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-success/10 rounded-lg p-4 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Monthly Payment</span>
              </div>
              <p className="text-xl font-bold text-success">
                KES {monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-gradient-secondary/10 rounded-lg p-4 border border-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium text-secondary">Total Payment</span>
              </div>
              <p className="text-xl font-bold text-secondary">
                KES {totalPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-gradient-premium/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Total Interest</span>
              </div>
              <p className="text-xl font-bold text-primary">
                KES {totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Apply Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300 text-lg py-6"
              onClick={() => navigate('/auth', { state: { defaultTab: 'signup' } })}
            >
              Apply for This Loan
            </Button>
          </motion.div>

          <p className="text-center text-sm text-muted-foreground">
            * This is an estimate. Final terms may vary based on credit assessment.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoanCalculator;