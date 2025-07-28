// Vercel serverless function for pricing calculations
import { calculateTotalWithFees, formatCurrency, TRANSACTION_FEE_CONFIG } from '../shared/pricing.js';

export default function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { contractAmount, paymentMethod } = req.body;

      // Validate input
      if (!contractAmount || typeof contractAmount !== 'number' || contractAmount <= 0) {
        return res.status(400).json({
          error: 'Invalid contract amount. Must be a positive number.'
        });
      }

      if (!paymentMethod || !TRANSACTION_FEE_CONFIG[paymentMethod]) {
        return res.status(400).json({
          error: 'Invalid payment method. Must be one of: usdc, ach, card'
        });
      }

      // Calculate fees
      const pricing = calculateTotalWithFees(contractAmount, paymentMethod);
      
      return res.status(200).json({
        success: true,
        data: {
          ...pricing,
          contractAmountFormatted: formatCurrency(pricing.contractAmount),
          transactionFeeFormatted: formatCurrency(pricing.transactionFee),
          totalAmountFormatted: formatCurrency(pricing.totalAmount),
          paymentMethod,
          feeConfig: TRANSACTION_FEE_CONFIG[paymentMethod]
        }
      });

    } catch (error) {
      console.error('Pricing calculation error:', error);
      return res.status(500).json({
        error: 'Failed to calculate pricing',
        message: error.message
      });
    }
  }

  if (req.method === 'GET') {
    // Return fee configuration for display
    return res.status(200).json({
      success: true,
      data: {
        feeConfig: TRANSACTION_FEE_CONFIG,
        supportedMethods: Object.keys(TRANSACTION_FEE_CONFIG)
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}