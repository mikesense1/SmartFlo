import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Program ID (replace with your deployed program ID)
export const FREELANCE_ESCROW_PROGRAM_ID = new PublicKey("Your_Program_ID");

// USDC mint address on devnet
export const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Solana network configuration
export const SOLANA_NETWORK = "devnet";
export const connection = new Connection(
  SOLANA_NETWORK === "devnet" 
    ? "https://api.devnet.solana.com"
    : "http://localhost:8899"
);

// Contract interaction utilities
export class SolanaContractManager {
  private program: Program | null = null;
  private provider: AnchorProvider | null = null;

  constructor(wallet: any) {
    if (wallet && wallet.publicKey) {
      this.provider = new AnchorProvider(connection, wallet, {});
      // Initialize program when we have the IDL
    }
  }

  // Get contract account PDA
  getContractPDA(contractId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("contract"), Buffer.from(contractId)],
      FREELANCE_ESCROW_PROGRAM_ID
    );
  }

  // Get escrow account PDA
  getEscrowPDA(contractId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(contractId)],
      FREELANCE_ESCROW_PROGRAM_ID
    );
  }

  // Get milestone account PDA
  getMilestonePDA(contractPubkey: PublicKey, milestoneIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("milestone"),
        contractPubkey.toBuffer(),
        Buffer.from([milestoneIndex])
      ],
      FREELANCE_ESCROW_PROGRAM_ID
    );
  }

  // Create a new freelance contract on-chain
  async createContract(
    contractId: string,
    totalAmount: number,
    milestoneCount: number,
    clientPublicKey: PublicKey
  ) {
    if (!this.program || !this.provider) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    
    const tx = await this.program.methods
      .createContract(contractId, new BN(totalAmount * LAMPORTS_PER_SOL), milestoneCount)
      .accounts({
        contract: contractPDA,
        freelancer: this.provider.wallet.publicKey,
        client: clientPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      signature: tx,
      contractAddress: contractPDA.toString(),
    };
  }

  // Client deposits funds to escrow
  async depositFunds(contractId: string, amount: number) {
    if (!this.program || !this.provider) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    const [escrowPDA] = this.getEscrowPDA(contractId);
    
    // Get client's USDC token account
    const clientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      this.provider.wallet.publicKey
    );

    // Get escrow's USDC token account
    const escrowTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      escrowPDA,
      true
    );

    const tx = await this.program.methods
      .depositFunds(new BN(amount * Math.pow(10, 6))) // USDC has 6 decimals
      .accounts({
        contract: contractPDA,
        client: this.provider.wallet.publicKey,
        clientTokenAccount,
        escrowAccount: escrowPDA,
        escrowTokenAccount,
        usdcMint: USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { signature: tx };
  }

  // Freelancer submits milestone
  async submitMilestone(
    contractId: string,
    milestoneIndex: number,
    proofUri: string
  ) {
    if (!this.program || !this.provider) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    const [milestonePDA] = this.getMilestonePDA(contractPDA, milestoneIndex);

    const tx = await this.program.methods
      .submitMilestone(milestoneIndex, proofUri)
      .accounts({
        contract: contractPDA,
        milestone: milestonePDA,
        freelancer: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { signature: tx };
  }

  // Client approves milestone and releases payment
  async approveMilestone(
    contractId: string,
    milestoneIndex: number,
    freelancerPublicKey: PublicKey
  ) {
    if (!this.program || !this.provider) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    const [milestonePDA] = this.getMilestonePDA(contractPDA, milestoneIndex);
    const [escrowPDA] = this.getEscrowPDA(contractId);

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      escrowPDA,
      true
    );

    const freelancerTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      freelancerPublicKey
    );

    const tx = await this.program.methods
      .approveMilestone(milestoneIndex)
      .accounts({
        contract: contractPDA,
        milestone: milestonePDA,
        client: this.provider.wallet.publicKey,
        escrowAccount: escrowPDA,
        escrowTokenAccount,
        freelancerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return { signature: tx };
  }

  // Dispute contract and return funds to client
  async disputeContract(contractId: string, reason: string) {
    if (!this.program || !this.provider) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    const [escrowPDA] = this.getEscrowPDA(contractId);

    // Get token accounts
    const escrowTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      escrowPDA,
      true
    );

    const clientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      this.provider.wallet.publicKey
    );

    const tx = await this.program.methods
      .disputeContract(reason)
      .accounts({
        contract: contractPDA,
        client: this.provider.wallet.publicKey,
        escrowAccount: escrowPDA,
        escrowTokenAccount,
        clientTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return { signature: tx };
  }

  // Fetch contract data from on-chain
  async getContractData(contractId: string) {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    
    try {
      const contractData = await this.program.account.freelanceContract.fetch(contractPDA);
      return contractData;
    } catch (error) {
      console.error("Contract not found:", error);
      return null;
    }
  }

  // Fetch milestone data
  async getMilestoneData(contractId: string, milestoneIndex: number) {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    const [contractPDA] = this.getContractPDA(contractId);
    const [milestonePDA] = this.getMilestonePDA(contractPDA, milestoneIndex);
    
    try {
      const milestoneData = await this.program.account.milestone.fetch(milestonePDA);
      return milestoneData;
    } catch (error) {
      console.error("Milestone not found:", error);
      return null;
    }
  }

  // Listen to contract events
  addEventListener(eventName: string, callback: (event: any) => void) {
    if (!this.program) return;

    const listener = this.program.addEventListener(eventName, callback);
    return listener;
  }

  removeEventListener(listener: number) {
    if (!this.program) return;
    this.program.removeEventListener(listener);
  }
}

// Utility functions
export const formatSolanaAddress = (address: string, length = 8) => {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const formatUSDC = (amount: number) => {
  return (amount / Math.pow(10, 6)).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatSOL = (lamports: number) => {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
};

// Error handling for Solana transactions
export const handleSolanaError = (error: any) => {
  console.error("Solana error:", error);
  
  if (error.message?.includes("insufficient funds")) {
    return "Insufficient funds in wallet";
  }
  
  if (error.message?.includes("Transaction simulation failed")) {
    return "Transaction failed - please check your inputs";
  }
  
  if (error.message?.includes("User rejected")) {
    return "Transaction cancelled by user";
  }
  
  return error.message || "Transaction failed";
};