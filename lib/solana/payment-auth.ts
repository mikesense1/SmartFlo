import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { Program, AnchorProvider, web3, BN, Idl } from '@project-serum/anchor';

// Program ID for the payment authorization program
export const PAYMENT_AUTH_PROGRAM_ID = new PublicKey('SmartF1oPaymentAuth1111111111111111111111');

// USDC mint address (devnet)
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export interface PaymentAuthorization {
  client: PublicKey;
  contractId: string;
  freelancer: PublicKey;
  maxPerMilestone: BN;
  totalAuthorized: BN;
  totalSpent: BN;
  isActive: boolean;
  authorizedAt: BN;
  bump: number;
}

export interface CreateAuthorizationParams {
  contractId: string;
  freelancerAddress: string;
  maxPerMilestone: number; // in USDC (6 decimals)
  totalAuthorized: number; // in USDC (6 decimals)
}

export interface ProcessPaymentParams {
  contractId: string;
  milestoneId: string;
  amount: number; // in USDC (6 decimals)
  freelancerAddress: string;
}

export class PaymentAuthService {
  private connection: Connection;
  private program: Program | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Initialize the Anchor program
   */
  async initializeProgram(provider: AnchorProvider): Promise<void> {
    try {
      // In a real implementation, you would load the IDL from the deployed program
      const idl: Idl = {
        version: "0.1.0",
        name: "payment_auth",
        instructions: [
          {
            name: "createPaymentAuthorization",
            accounts: [
              { name: "paymentAuthorization", isMut: true, isSigner: false },
              { name: "client", isMut: true, isSigner: true },
              { name: "freelancer", isMut: false, isSigner: false },
              { name: "systemProgram", isMut: false, isSigner: false }
            ],
            args: [
              { name: "contractId", type: "string" },
              { name: "maxPerMilestone", type: "u64" },
              { name: "totalAuthorized", type: "u64" }
            ]
          },
          {
            name: "processMilestonePayment",
            accounts: [
              { name: "paymentAuthorization", isMut: true, isSigner: false },
              { name: "client", isMut: true, isSigner: true },
              { name: "freelancer", isMut: false, isSigner: false },
              { name: "clientTokenAccount", isMut: true, isSigner: false },
              { name: "freelancerTokenAccount", isMut: true, isSigner: false },
              { name: "tokenProgram", isMut: false, isSigner: false }
            ],
            args: [
              { name: "milestoneId", type: "string" },
              { name: "amount", type: "u64" }
            ]
          }
        ],
        accounts: [
          {
            name: "PaymentAuthorization",
            type: {
              kind: "struct",
              fields: [
                { name: "client", type: "publicKey" },
                { name: "contractId", type: "string" },
                { name: "freelancer", type: "publicKey" },
                { name: "maxPerMilestone", type: "u64" },
                { name: "totalAuthorized", type: "u64" },
                { name: "totalSpent", type: "u64" },
                { name: "isActive", type: "bool" },
                { name: "authorizedAt", type: "i64" },
                { name: "bump", type: "u8" }
              ]
            }
          }
        ],
        errors: []
      };

      this.program = new Program(idl, PAYMENT_AUTH_PROGRAM_ID, provider);
    } catch (error) {
      console.error('Error initializing payment auth program:', error);
      throw error;
    }
  }

  /**
   * Get the PDA for a payment authorization
   */
  getPaymentAuthorizationPDA(clientPubkey: PublicKey, contractId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('payment_auth'),
        clientPubkey.toBuffer(),
        Buffer.from(contractId)
      ],
      PAYMENT_AUTH_PROGRAM_ID
    );
  }

  /**
   * Create a payment authorization transaction
   */
  async createAuthorizationTransaction(
    clientPubkey: PublicKey,
    params: CreateAuthorizationParams
  ): Promise<Transaction> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const freelancerPubkey = new PublicKey(params.freelancerAddress);
    const [authorizationPDA, bump] = this.getPaymentAuthorizationPDA(clientPubkey, params.contractId);

    // Convert USDC amounts to proper decimals (USDC has 6 decimals)
    const maxPerMilestone = new BN(params.maxPerMilestone * 1_000_000);
    const totalAuthorized = new BN(params.totalAuthorized * 1_000_000);

    const instruction = await this.program.methods
      .createPaymentAuthorization(
        params.contractId,
        maxPerMilestone,
        totalAuthorized
      )
      .accounts({
        paymentAuthorization: authorizationPDA,
        client: clientPubkey,
        freelancer: freelancerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const transaction = new Transaction().add(instruction);
    
    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = clientPubkey;

    return transaction;
  }

  /**
   * Process milestone payment transaction
   */
  async processPaymentTransaction(
    clientPubkey: PublicKey,
    params: ProcessPaymentParams
  ): Promise<Transaction> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const freelancerPubkey = new PublicKey(params.freelancerAddress);
    const [authorizationPDA] = this.getPaymentAuthorizationPDA(clientPubkey, params.contractId);

    // Get associated token accounts
    const clientTokenAccount = await getAssociatedTokenAddress(USDC_MINT, clientPubkey);
    const freelancerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, freelancerPubkey);

    // Convert amount to proper decimals
    const amount = new BN(params.amount * 1_000_000);

    const transaction = new Transaction();

    // Check if freelancer token account exists, create if not
    try {
      await this.connection.getAccountInfo(freelancerTokenAccount);
    } catch {
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        clientPubkey, // payer
        freelancerTokenAccount, // ata
        freelancerPubkey, // owner
        USDC_MINT // mint
      );
      transaction.add(createATAInstruction);
    }

    const paymentInstruction = await this.program.methods
      .processMilestonePayment(
        params.milestoneId,
        amount
      )
      .accounts({
        paymentAuthorization: authorizationPDA,
        client: clientPubkey,
        freelancer: freelancerPubkey,
        clientTokenAccount,
        freelancerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    transaction.add(paymentInstruction);

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = clientPubkey;

    return transaction;
  }

  /**
   * Revoke authorization transaction
   */
  async revokeAuthorizationTransaction(
    clientPubkey: PublicKey,
    contractId: string
  ): Promise<Transaction> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const [authorizationPDA] = this.getPaymentAuthorizationPDA(clientPubkey, contractId);

    const instruction = await this.program.methods
      .revokeAuthorization()
      .accounts({
        paymentAuthorization: authorizationPDA,
        client: clientPubkey,
      })
      .instruction();

    const transaction = new Transaction().add(instruction);
    
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = clientPubkey;

    return transaction;
  }

  /**
   * Get payment authorization data
   */
  async getPaymentAuthorization(
    clientPubkey: PublicKey,
    contractId: string
  ): Promise<PaymentAuthorization | null> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    try {
      const [authorizationPDA] = this.getPaymentAuthorizationPDA(clientPubkey, contractId);
      const authorization = await this.program.account.paymentAuthorization.fetch(authorizationPDA);
      
      return authorization as PaymentAuthorization;
    } catch (error) {
      console.error('Error fetching payment authorization:', error);
      return null;
    }
  }

  /**
   * Monitor authorization status
   */
  async monitorAuthorization(
    clientPubkey: PublicKey,
    contractId: string,
    callback: (authorization: PaymentAuthorization | null) => void
  ): Promise<number> {
    const [authorizationPDA] = this.getPaymentAuthorizationPDA(clientPubkey, contractId);

    // Subscribe to account changes
    const subscriptionId = this.connection.onAccountChange(
      authorizationPDA,
      async (accountInfo) => {
        if (this.program && accountInfo.data) {
          try {
            const authorization = this.program.coder.accounts.decode(
              'PaymentAuthorization',
              accountInfo.data
            ) as PaymentAuthorization;
            callback(authorization);
          } catch (error) {
            console.error('Error decoding authorization data:', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      },
      'confirmed'
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe from authorization monitoring
   */
  async unsubscribeFromAuthorization(subscriptionId: number): Promise<void> {
    await this.connection.removeAccountChangeListener(subscriptionId);
  }

  /**
   * Get USDC balance for an address
   */
  async getUSDCBalance(address: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, address);
      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
      
      return accountInfo.value.uiAmount || 0;
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return 0;
    }
  }

  /**
   * Validate authorization parameters
   */
  validateAuthorizationParams(params: CreateAuthorizationParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.contractId || params.contractId.length === 0) {
      errors.push('Contract ID is required');
    }

    if (!params.freelancerAddress) {
      errors.push('Freelancer address is required');
    } else {
      try {
        new PublicKey(params.freelancerAddress);
      } catch {
        errors.push('Invalid freelancer address');
      }
    }

    if (params.maxPerMilestone <= 0) {
      errors.push('Max per milestone must be greater than 0');
    }

    if (params.totalAuthorized <= 0) {
      errors.push('Total authorized must be greater than 0');
    }

    if (params.maxPerMilestone > params.totalAuthorized) {
      errors.push('Max per milestone cannot exceed total authorized amount');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export utility functions
export const formatUSDC = (amount: BN): string => {
  return (amount.toNumber() / 1_000_000).toFixed(2);
};

export const parseUSDC = (amount: string): BN => {
  return new BN(parseFloat(amount) * 1_000_000);
};