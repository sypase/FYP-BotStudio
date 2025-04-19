import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from './PaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { serverURL } from '@/utils/utils';
import axios from 'axios';

interface CreditPackage {
  id: string;
  amount: number;
  price: number;
}

export default function CreditShop() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${serverURL}/credits/packages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credit packages',
        variant: 'destructive',
      });
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    try {
      setIsLoading(true);
      setSelectedPackage(pkg);
      setIsCustomAmount(false);
      
      const token = getAuthToken();
      // Create payment intent
      const response = await fetch(`${serverURL}/credits/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPurchase = async () => {
    try {
      const amount = parseInt(customAmount);
      if (isNaN(amount) || amount < 1) {
        toast({
          title: 'Error',
          description: 'Please enter a valid amount',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      const price = amount * 0.1; // $0.1 per credit
      setSelectedPackage({ id: 'custom', amount, price });
      setIsCustomAmount(true);
      
      const token = getAuthToken();
      // Create payment intent
      const response = await fetch(`${serverURL}/credits/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ customAmount: amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setSelectedPackage(null);
    setClientSecret(null);
    setCustomAmount('');
    setIsCustomAmount(false);
    
    // Refresh user's credit balance
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await axios.get(`${serverURL}/credits/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Dispatch a custom event to notify other components about the credit update
      const event = new CustomEvent('creditsUpdated', { 
        detail: { credits: response.data.credits } 
      });
      window.dispatchEvent(event);
      
      toast({
        title: 'Success',
        description: `Successfully added ${selectedPackage?.amount} credits to your account!`,
      });
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Credit Shop</h1>
      
      {/* Custom Amount Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
          <CardDescription>Enter your desired credit amount ($0.1 per credit)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="customAmount">Number of Credits</Label>
              <Input
                id="customAmount"
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <Button 
              onClick={handleCustomPurchase}
              disabled={isLoading || !customAmount}
              className="text-black"
            >
              {isLoading ? 'Processing...' : 'Purchase Custom Amount'}
            </Button>
          </div>
          {customAmount && !isNaN(parseInt(customAmount)) && (
            <div className="mt-4 text-sm text-muted-foreground">
              Total payable: {formatPrice(parseInt(customAmount) * 0.1)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predefined Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <CardTitle>{pkg.amount} Credits</CardTitle>
              <CardDescription>{formatPrice(pkg.price)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Purchase {pkg.amount} credits to use with our services
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handlePurchase(pkg)}
                className="w-full text-black"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Purchase'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedPackage} onOpenChange={() => {
        setSelectedPackage(null);
        setClientSecret(null);
        setCustomAmount('');
        setIsCustomAmount(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Purchase {selectedPackage?.amount} Credits
              {isCustomAmount && ` (Custom Amount)`}
            </DialogTitle>
            <DialogDescription>
              Total payable: {selectedPackage && formatPrice(selectedPackage.price)}
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          {clientSecret && (
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 