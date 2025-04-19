import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";
import Credit from "../models/Credit.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get user's available credits
router.get("/available", validate, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ 
      credits: user.credits || 0,
      message: "Credits retrieved successfully" 
    });
  } catch (error) {
    console.error("Error getting user credits:", error);
    res.status(500).json({ error: "Failed to get user credits" });
  }
});

// Get credit packages
router.get("/packages", async (req, res) => {
    try {
        const packages = [
            { id: "credit-10", amount: 10, price: 1 },
            { id: "credit-50", amount: 50, price: 5 },
            { id: "credit-100", amount: 100, price: 10 },
            { id: "credit-500", amount: 500, price: 50 },
            { id: "credit-1000", amount: 1000, price: 100 }
        ];
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create payment intent
router.post("/create-payment-intent", validate, async (req, res) => {
    console.log(req.body);
    console.log(req.user);
    try {
        const { packageId, customAmount } = req.body;
        
        let amount, price;
        
        if (customAmount) {
            // Validate custom amount
            const numAmount = parseInt(customAmount);
            if (isNaN(numAmount) || numAmount < 1) {
                return res.status(400).json({ message: "Invalid custom amount" });
            }
            amount = numAmount;
            price = numAmount * 0.1; // $0.1 per credit
        } else {
            const packages = {
                "credit-10": { amount: 10, price: 1 },
                "credit-50": { amount: 50, price: 5 },
                "credit-100": { amount: 100, price: 10 },
                "credit-500": { amount: 500, price: 50 },
                "credit-1000": { amount: 1000, price: 100 }
            };

            const selectedPackage = packages[packageId];
            if (!selectedPackage) {
                return res.status(400).json({ message: "Invalid package selected" });
            }
            amount = selectedPackage.amount;
            price = selectedPackage.price;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100), // Stripe uses cents
            currency: "usd",
            metadata: {
                userId: req.user._id.toString(),
                packageId: customAmount ? `custom-${amount}` : packageId,
                credits: amount,
            },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Webhook to handle successful payments
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { userId, packageId, credits } = paymentIntent.metadata;

        try {
            // Create credit transaction record
            const credit = new Credit({
                userId,
                amount: parseInt(credits),
                price: paymentIntent.amount / 100,
                stripePaymentId: paymentIntent.id,
                status: "completed",
            });
            await credit.save();

            // Update user's credits
            await User.findByIdAndUpdate(userId, {
                $inc: { credits: parseInt(credits) },
            });

            res.json({ received: true });
        } catch (error) {
            console.error("Error processing payment:", error);
            res.status(500).json({ message: error.message });
        }
    }
});

// Get user's credit balance
router.get("/balance", validate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get credit purchase history
router.get("/history", validate, async (req, res) => {
    try {
        const credits = await Credit.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(credits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add verify-payment endpoint
router.post('/verify-payment', validate, async (req, res) => {
  try {
    console.log('Payment verification started');
    const { paymentIntentId } = req.body;
    const userId = req.user._id;
    
    console.log('Request data:', { paymentIntentId, userId });

    if (!paymentIntentId) {
      console.log('No payment intent ID provided');
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve the payment intent from Stripe
    console.log('Retrieving payment intent from Stripe');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      console.log('Payment not succeeded:', paymentIntent.status);
      return res.status(400).json({ error: 'Payment has not been completed' });
    }
    //see amount in paymaentIntent
    console.log('Payment succeeded:', paymentIntent.amount);

    // Check if credits were already added for this payment
    console.log('Checking for existing credit record');
    const existingCredit = await Credit.findOne({ 
      userId,
      paymentIntentId,
      status: 'completed'
    });

    if (existingCredit) {
      console.log('Credits already added for this payment');
      return res.status(200).json({ 
        message: 'Credits already added',
        credits: existingCredit.amount
      });
    }

    // Get the amount of credits from metadata
    console.log('Payment intent metadata:', paymentIntent.metadata);
    const creditAmount = parseInt(paymentIntent.metadata.credits);
    if (!creditAmount || isNaN(creditAmount)) {
      console.log('Invalid credit amount:', paymentIntent.metadata.credits);
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    // Create credit record
    console.log('Creating credit record');
    const credit = new Credit({
      userId,
      amount: creditAmount,
      type: 'purchase',
      paymentIntentId,
      stripePaymentId: paymentIntentId,
      price: paymentIntent.amount / 100, // Convert from cents to dollars
      status: 'completed'
    });
    await credit.save();
    console.log('Credit record created:', credit);

    // Update user's credit balance
    console.log('Updating user credit balance');
    await User.findByIdAndUpdate(userId, {
      $inc: { credits: creditAmount }
    });
    console.log('User credit balance updated');

    res.json({ 
      message: 'Credits added successfully',
      credits: creditAmount
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

export default router; 