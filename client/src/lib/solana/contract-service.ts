import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC on mainnet
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // USDC on devnet

export interface MilestoneStatus {
  index: number;
  title: string;
  submitted: boolean;
  approved: boolean;
  amount: number;
  submittedAt?: Date;
  approvedAt?: Date;
  paymentTx?: string;
}

export interface ContractData {
  contractId: string;
  freelancer: PublicKey;
  client: PublicKey;
  totalAmount: number;
  milestoneCount: number;
  completedMilestones: number;
  amountReleased: number;
  escrowBalance: number;
  isActive: boolean;
  isCompleted: boolean;
  isDisputed: boolean;
  createdAt: Date;
}

export class FreelanceContractService {
  private program: Program;
  private provider: AnchorProvider;
  private isDevnet: boolean;

  constructor(provider: AnchorProvider, programId: PublicKey, isDevnet = true) {
    this.provider = provider;
    this.isDevnet = isDevnet;
    // Note: In production, load IDL and create program instance here
    // this.program = new Program(idl, programId, provider);
  }

  private get usdcMint(): PublicKey {
    return this.isDevnet ? USDC_MINT_DEVNET : USDC_MINT;
  }

  async createContract(
    contractId: string,
    clientWallet: PublicKey,
    freelancerWallet: PublicKey,
    totalAmount: number,
    milestones: string[]
  ) {
    // Generate PDA for contract account
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      this.program.programId
    );

    // Generate escrow token account PDA
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('escrow'), Buffer.from(contractId)],
      this.program.programId
    );

    const escrowTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      escrowPDA,
      true // allowOwnerOffCurve for PDA
    );

    // Create contract instruction
    const tx = await this.program.methods
      .createContract(contractId, new BN(totalAmount * 1e6), milestones.length)
      .accounts({
        contract: contractPDA,
        freelancer: freelancerWallet,
        client: clientWallet,
        escrowAccount: escrowPDA,
        escrowTokenAccount,
        tokenMint: this.usdcMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return {
      transactionId: tx,
      contractAddress: contractPDA.toString(),
      escrowAddress: escrowTokenAccount.toString(),
    };
  }

  async depositFunds(contractId: string, amount: number) {
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      this.program.programId
    );

    // Get client's USDC token account
    const clientTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      this.provider.wallet.publicKey
    );

    const escrowTokenAccount = await this.getEscrowTokenAccount(contractId);

    const tx = await this.program.methods
      .depositFunds(new BN(amount * 1e6))
      .accounts({
        contract: contractPDA,
        client: this.provider.wallet.publicKey,
        clientTokenAccount,
        escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  async submitMilestone(
    contractId: string,
    milestoneIndex: number,
    proofUri: string
  ) {
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      this.program.programId
    );

    const [milestonePDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('milestone'),
        contractPDA.toBuffer(),
        Buffer.from([milestoneIndex]),
      ],
      this.program.programId
    );

    const tx = await this.program.methods
      .submitMilestone(milestoneIndex, proofUri)
      .accounts({
        contract: contractPDA,
        milestone: milestonePDA,
        freelancer: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async approveMilestone(
    contractId: string,
    milestoneIndex: number,
    freelancerWallet: PublicKey
  ) {
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      this.program.programId
    );

    const [milestonePDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('milestone'),
        contractPDA.toBuffer(),
        Buffer.from([milestoneIndex]),
      ],
      this.program.programId
    );

    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('escrow'), Buffer.from(contractId)],
      this.program.programId
    );

    const escrowTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      escrowPDA,
      true
    );

    const freelancerTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      freelancerWallet
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

    return tx;
  }

  private async getEscrowTokenAccount(contractId: string): Promise<PublicKey> {
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('escrow'), Buffer.from(contractId)],
      this.program.programId
    );

    return await getAssociatedTokenAddress(
      this.usdcMint,
      escrowPDA,
      true
    );
  }
}

// Helper functions for the UI
export async function checkMilestoneStatus(
  program: Program,
  contractId: string,
  milestoneIndex: number
): Promise<MilestoneStatus | null> {
  try {
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      program.programId
    );

    const [milestonePDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('milestone'),
        contractPDA.toBuffer(),
        Buffer.from([milestoneIndex]),
      ],
      program.programId
    );

    const milestone = await program.account.milestone.fetch(milestonePDA);
    
    return {
      index: milestone.index,
      title: `Milestone ${milestone.index + 1}`,
      submitted: milestone.submittedAt.toNumber() > 0,
      approved: milestone.isApproved,
      amount: milestone.paymentAmount.toNumber() / 1e6,
      submittedAt: milestone.submittedAt.toNumber() > 0 
        ? new Date(milestone.submittedAt.toNumber() * 1000) 
        : undefined,
      approvedAt: milestone.approvedAt.toNumber() > 0 
        ? new Date(milestone.approvedAt.toNumber() * 1000) 
        : undefined,
    };
  } catch (error) {
    console.error('Failed to check milestone status:', error);
    return null;
  }
}

export async function getContractBalance(
  program: Program,
  contractId: string
): Promise<number> {
  try {
    const [contractPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('contract'), Buffer.from(contractId)],
      program.programId
    );

    const contract = await program.account.freelanceContract.fetch(contractPDA);
    return contract.escrowBalance.toNumber() / 1e6;
  } catch (error) {
    console.error('Failed to get contract balance:', error);
    return 0;
  }
}

// Format helpers
export const formatUSDCAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
};

export const formatSolanaAddress = (address: string, length = 8): string => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const shortenTransactionSignature = (signature: string, length = 12): string => {
  if (!signature) return '';
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
};