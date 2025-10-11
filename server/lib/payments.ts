import Stripe from 'stripe';
import { storage } from '../storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil'
});

/**
 * Process an authorized payment for a milestone
 * Captures payment from the authorized payment method
 */
export async function processAuthorizedPayment(
  milestone: any,
  authorization: any,
  contract: any
): Promise<{ id: string; amount: number; status: string }> {
  try {
    // Get payment method details
    const paymentMethod = await storage.getPaymentMethod(authorization.paymentMethodId);
    
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Check payment method type and process accordingly
    if (paymentMethod.type === 'stripe_card' || paymentMethod.type === 'stripe_ach') {
      return await processStripePayment(milestone, paymentMethod, contract);
    } else if (paymentMethod.type === 'usdc_wallet') {
      return await processUSDCPayment(milestone, paymentMethod, contract);
    } else {
      throw new Error(`Unsupported payment method type: ${paymentMethod.type}`);
    }
  } catch (error: any) {
    console.error('Error processing authorized payment:', error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}

/**
 * Process Stripe payment (card or ACH)
 */
async function processStripePayment(
  milestone: any,
  paymentMethod: any,
  contract: any
): Promise<{ id: string; amount: number; status: string }> {
  try {
    // Get the user (customer) for Stripe
    const user = await storage.getUser(paymentMethod.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id.toString()
        }
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await storage.updateUser(user.id, {
        stripeCustomerId: customerId
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(milestone.amount) * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.stripePaymentMethodId,
      off_session: true, // Authorize offline payment
      confirm: true, // Immediately confirm
      metadata: {
        milestoneId: milestone.id,
        contractId: contract.id,
        contractTitle: contract.title
      },
      description: `Payment for milestone: ${milestone.title} - ${contract.title}`
    });

    // Log the payment
    await storage.createActivity({
      contractId: contract.id,
      action: 'payment_processed',
      actorEmail: `user_${user.id}`,
      details: JSON.stringify({
        milestoneId: milestone.id,
        amount: milestone.amount,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        paymentMethod: paymentMethod.type
      })
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status
    };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    
    // Log failed payment
    await storage.createActivity({
      contractId: contract.id,
      action: 'payment_failed',
      actorEmail: 'system',
      details: JSON.stringify({
        milestoneId: milestone.id,
        amount: milestone.amount,
        error: error.message,
        paymentMethod: paymentMethod.type
      })
    });
    
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
}

/**
 * Process USDC cryptocurrency payment
 * Note: This is a simplified version - full implementation would interact with Solana blockchain
 */
async function processUSDCPayment(
  milestone: any,
  paymentMethod: any,
  contract: any
): Promise<{ id: string; amount: number; status: string }> {
  try {
    // In production, this would:
    // 1. Connect to Solana blockchain
    // 2. Transfer USDC from wallet to escrow
    // 3. Wait for confirmation
    // 4. Return transaction signature
    
    // For now, create a simulated transaction
    const txId = `usdc_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the payment
    await storage.createActivity({
      contractId: contract.id,
      action: 'payment_processed',
      actorEmail: `wallet_${paymentMethod.walletAddress}`,
      details: JSON.stringify({
        milestoneId: milestone.id,
        amount: milestone.amount,
        transactionId: txId,
        walletAddress: paymentMethod.walletAddress,
        walletType: paymentMethod.walletType,
        paymentMethod: 'usdc'
      })
    });

    return {
      id: txId,
      amount: parseFloat(milestone.amount),
      status: 'succeeded'
    };
  } catch (error: any) {
    console.error('USDC payment error:', error);
    
    // Log failed payment
    await storage.createActivity({
      contractId: contract.id,
      action: 'payment_failed',
      actorEmail: 'system',
      details: JSON.stringify({
        milestoneId: milestone.id,
        amount: milestone.amount,
        error: error.message,
        paymentMethod: 'usdc'
      })
    });
    
    throw new Error(`USDC payment failed: ${error.message}`);
  }
}

/**
 * Process refund for a payment
 */
export async function processRefund(
  paymentId: string,
  amount?: number
): Promise<{ id: string; amount: number; status: string }> {
  try {
    // Check if it's a Stripe payment
    if (paymentId.startsWith('pi_')) {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });
      
      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    }
    
    // Handle USDC refunds (would interact with blockchain)
    throw new Error('USDC refunds not yet implemented');
  } catch (error: any) {
    console.error('Refund error:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
}
