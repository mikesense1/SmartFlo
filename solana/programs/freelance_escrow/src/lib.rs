use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Your_Program_ID");

#[program]
pub mod freelance_escrow {
    use super::*;

    // Initialize a new freelance contract
    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_id: String,
        total_amount: u64,
        milestone_count: u8,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        contract.contract_id = contract_id;
        contract.freelancer = ctx.accounts.freelancer.key();
        contract.client = ctx.accounts.client.key();
        contract.total_amount = total_amount;
        contract.milestone_count = milestone_count;
        contract.completed_milestones = 0;
        contract.amount_released = 0;
        contract.escrow_balance = 0;
        contract.is_active = false;
        contract.is_completed = false;
        contract.is_disputed = false;
        contract.dispute_reason = String::new();
        contract.created_at = Clock::get()?.unix_timestamp;
        contract.completed_at = 0;
        Ok(())
    }

    // Client deposits funds to escrow
    pub fn deposit_funds(
        ctx: Context<DepositFunds>,
        amount: u64,
    ) -> Result<()> {
        // Transfer USDC from client to escrow account
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update contract state
        let contract = &mut ctx.accounts.contract;
        contract.is_active = true;
        contract.escrow_balance += amount;
        
        emit!(FundsDeposited {
            contract_id: contract.contract_id.clone(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Freelancer submits milestone for approval
    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        milestone_index: u8,
        proof_uri: String,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.is_active, ErrorCode::ContractNotActive);
        require!(milestone_index < contract.milestone_count, ErrorCode::InvalidMilestone);
        
        // Record milestone submission
        let milestone = &mut ctx.accounts.milestone;
        milestone.contract = contract.key();
        milestone.index = milestone_index;
        milestone.submitted_at = Clock::get()?.unix_timestamp;
        milestone.approved_at = 0;
        milestone.proof_uri = proof_uri;
        milestone.is_approved = false;
        milestone.payment_amount = 0;
        
        emit!(MilestoneSubmitted {
            contract_id: contract.contract_id.clone(),
            milestone_index,
            timestamp: milestone.submitted_at,
        });
        
        Ok(())
    }

    // Client approves milestone and triggers payment
    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let milestone = &mut ctx.accounts.milestone;
        
        require!(contract.is_active, ErrorCode::ContractNotActive);
        require!(!milestone.is_approved, ErrorCode::MilestoneAlreadyApproved);
        
        // Calculate payment amount for this milestone
        let milestone_amount = contract.total_amount / contract.milestone_count as u64;
        
        // Transfer from escrow to freelancer
        let seeds = &[
            b"escrow",
            contract.contract_id.as_bytes(),
            &[ctx.bumps.escrow_account],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.freelancer_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, milestone_amount)?;
        
        // Update state
        milestone.is_approved = true;
        milestone.approved_at = Clock::get()?.unix_timestamp;
        milestone.payment_amount = milestone_amount;
        
        contract.completed_milestones += 1;
        contract.amount_released += milestone_amount;
        contract.escrow_balance -= milestone_amount;
        
        // Check if contract is complete
        if contract.completed_milestones == contract.milestone_count {
            contract.is_completed = true;
            contract.completed_at = Clock::get()?.unix_timestamp;
        }
        
        emit!(MilestoneApproved {
            contract_id: contract.contract_id.clone(),
            milestone_index,
            amount: milestone_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Emergency dispute resolution (funds returned to client)
    pub fn dispute_contract(
        ctx: Context<DisputeContract>,
        reason: String,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        require!(contract.is_active && !contract.is_completed, ErrorCode::InvalidContractState);
        
        // Return remaining escrow balance to client
        let remaining_balance = contract.escrow_balance;
        if remaining_balance > 0 {
            let seeds = &[
                b"escrow",
                contract.contract_id.as_bytes(),
                &[ctx.bumps.escrow_account],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.client_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, remaining_balance)?;
            
            contract.escrow_balance = 0;
        }
        
        contract.is_disputed = true;
        contract.dispute_reason = reason;
        
        emit!(ContractDisputed {
            contract_id: contract.contract_id.clone(),
            reason,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// Context structures for each instruction
#[derive(Accounts)]
#[instruction(contract_id: String)]
pub struct CreateContract<'info> {
    #[account(
        init,
        payer = freelancer,
        space = 8 + FreelanceContract::INIT_SPACE,
        seeds = [b"contract", contract_id.as_bytes()],
        bump
    )]
    pub contract: Account<'info, FreelanceContract>,
    #[account(mut)]
    pub freelancer: Signer<'info>,
    /// CHECK: Client public key for the contract
    pub client: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = client,
        seeds = [b"escrow", contract.contract_id.as_bytes()],
        bump,
        space = 8 + 32
    )]
    pub escrow_account: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = client,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    /// CHECK: USDC mint address
    pub usdc_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct SubmitMilestone<'info> {
    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
    #[account(
        init,
        payer = freelancer,
        space = 8 + Milestone::INIT_SPACE,
        seeds = [b"milestone", contract.key().as_ref(), &[milestone_index]],
        bump
    )]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)]
    pub freelancer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct ApproveMilestone<'info> {
    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
    #[account(mut)]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", contract.contract_id.as_bytes()],
        bump
    )]
    pub escrow_account: SystemAccount<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, FreelanceContract>,
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", contract.contract_id.as_bytes()],
        bump
    )]
    pub escrow_account: SystemAccount<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// Account structures
#[account]
#[derive(InitSpace)]
pub struct FreelanceContract {
    #[max_len(64)]
    pub contract_id: String,
    pub freelancer: Pubkey,
    pub client: Pubkey,
    pub total_amount: u64,
    pub milestone_count: u8,
    pub completed_milestones: u8,
    pub amount_released: u64,
    pub escrow_balance: u64,
    pub is_active: bool,
    pub is_completed: bool,
    pub is_disputed: bool,
    #[max_len(500)]
    pub dispute_reason: String,
    pub created_at: i64,
    pub completed_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Milestone {
    pub contract: Pubkey,
    pub index: u8,
    pub submitted_at: i64,
    pub approved_at: i64,
    #[max_len(200)]
    pub proof_uri: String,
    pub is_approved: bool,
    pub payment_amount: u64,
}

// Events for monitoring
#[event]
pub struct FundsDeposited {
    pub contract_id: String,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneSubmitted {
    pub contract_id: String,
    pub milestone_index: u8,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneApproved {
    pub contract_id: String,
    pub milestone_index: u8,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ContractDisputed {
    pub contract_id: String,
    pub reason: String,
    pub timestamp: i64,
}

// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Contract is not active")]
    ContractNotActive,
    #[msg("Invalid milestone index")]
    InvalidMilestone,
    #[msg("Milestone already approved")]
    MilestoneAlreadyApproved,
    #[msg("Invalid contract state for this operation")]
    InvalidContractState,
}