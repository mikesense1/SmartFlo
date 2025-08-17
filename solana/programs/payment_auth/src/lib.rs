use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Transfer};

declare_id!("SmartF1oPaymentAuth1111111111111111111111");

#[program]
pub mod payment_auth {
    use super::*;

    /// Create a payment authorization for a freelance contract
    pub fn create_payment_authorization(
        ctx: Context<CreateAuth>,
        contract_id: String,
        max_per_milestone: u64,
        total_authorized: u64,
    ) -> Result<()> {
        let auth = &mut ctx.accounts.payment_authorization;
        let clock = Clock::get()?;

        // Validate inputs
        require!(max_per_milestone > 0, ErrorCode::InvalidAmount);
        require!(total_authorized > 0, ErrorCode::InvalidAmount);
        require!(max_per_milestone <= total_authorized, ErrorCode::ExceedsTotal);

        // Initialize payment authorization
        auth.client = ctx.accounts.client.key();
        auth.contract_id = contract_id;
        auth.freelancer = ctx.accounts.freelancer.key();
        auth.max_per_milestone = max_per_milestone;
        auth.total_authorized = total_authorized;
        auth.total_spent = 0;
        auth.is_active = true;
        auth.authorized_at = clock.unix_timestamp;
        auth.bump = *ctx.bumps.get("payment_authorization").unwrap();

        msg!("Payment authorization created: {} USDC authorized", total_authorized);
        Ok(())
    }

    /// Process a milestone payment without additional client signature
    pub fn process_milestone_payment(
        ctx: Context<ProcessPayment>,
        milestone_id: String,
        amount: u64,
    ) -> Result<()> {
        let auth = &mut ctx.accounts.payment_authorization;

        // Validate authorization is active
        require!(auth.is_active, ErrorCode::AuthorizationInactive);

        // Check payment limits
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(amount <= auth.max_per_milestone, ErrorCode::ExceedsPerMilestone);
        require!(auth.total_spent + amount <= auth.total_authorized, ErrorCode::ExceedsTotal);

        // Verify participants
        require!(auth.client == ctx.accounts.client.key(), ErrorCode::UnauthorizedClient);
        require!(auth.freelancer == ctx.accounts.freelancer.key(), ErrorCode::UnauthorizedFreelancer);

        // Transfer USDC from client to freelancer
        let cpi_accounts = Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.freelancer_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;

        // Update authorization state
        auth.total_spent += amount;

        msg!("Milestone payment processed: {} USDC paid for milestone {}", amount, milestone_id);
        Ok(())
    }

    /// Revoke payment authorization
    pub fn revoke_authorization(ctx: Context<RevokeAuth>) -> Result<()> {
        let auth = &mut ctx.accounts.payment_authorization;

        // Verify only client can revoke
        require!(auth.client == ctx.accounts.client.key(), ErrorCode::UnauthorizedClient);

        auth.is_active = false;

        msg!("Payment authorization revoked for contract {}", auth.contract_id);
        Ok(())
    }

    /// Update authorization limits (client only)
    pub fn update_authorization(
        ctx: Context<UpdateAuth>,
        new_max_per_milestone: Option<u64>,
        additional_authorized: Option<u64>,
    ) -> Result<()> {
        let auth = &mut ctx.accounts.payment_authorization;

        // Verify only client can update
        require!(auth.client == ctx.accounts.client.key(), ErrorCode::UnauthorizedClient);
        require!(auth.is_active, ErrorCode::AuthorizationInactive);

        // Update per-milestone limit if provided
        if let Some(new_max) = new_max_per_milestone {
            require!(new_max > 0, ErrorCode::InvalidAmount);
            require!(new_max <= auth.total_authorized - auth.total_spent, ErrorCode::ExceedsTotal);
            auth.max_per_milestone = new_max;
        }

        // Add additional authorized amount if provided
        if let Some(additional) = additional_authorized {
            require!(additional > 0, ErrorCode::InvalidAmount);
            auth.total_authorized += additional;
        }

        msg!("Payment authorization updated for contract {}", auth.contract_id);
        Ok(())
    }

    /// Emergency freeze authorization (admin only)
    pub fn freeze_authorization(ctx: Context<FreezeAuth>) -> Result<()> {
        let auth = &mut ctx.accounts.payment_authorization;
        
        // In production, verify admin authority here
        auth.is_active = false;

        msg!("Payment authorization frozen for contract {}", auth.contract_id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(contract_id: String)]
pub struct CreateAuth<'info> {
    #[account(
        init,
        payer = client,
        space = PaymentAuthorization::LEN,
        seeds = [b"payment_auth", client.key().as_ref(), contract_id.as_bytes()],
        bump
    )]
    pub payment_authorization: Account<'info, PaymentAuthorization>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: Freelancer public key, verified in instruction
    pub freelancer: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [b"payment_auth", client.key().as_ref(), payment_authorization.contract_id.as_bytes()],
        bump = payment_authorization.bump
    )]
    pub payment_authorization: Account<'info, PaymentAuthorization>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: Freelancer public key, verified against authorization
    pub freelancer: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RevokeAuth<'info> {
    #[account(
        mut,
        seeds = [b"payment_auth", client.key().as_ref(), payment_authorization.contract_id.as_bytes()],
        bump = payment_authorization.bump
    )]
    pub payment_authorization: Account<'info, PaymentAuthorization>,
    
    #[account(mut)]
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAuth<'info> {
    #[account(
        mut,
        seeds = [b"payment_auth", client.key().as_ref(), payment_authorization.contract_id.as_bytes()],
        bump = payment_authorization.bump
    )]
    pub payment_authorization: Account<'info, PaymentAuthorization>,
    
    #[account(mut)]
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct FreezeAuth<'info> {
    #[account(
        mut,
        seeds = [b"payment_auth", payment_authorization.client.as_ref(), payment_authorization.contract_id.as_bytes()],
        bump = payment_authorization.bump
    )]
    pub payment_authorization: Account<'info, PaymentAuthorization>,
    
    /// CHECK: Admin authority, would verify against known admin keys in production
    pub admin: Signer<'info>,
}

#[account]
pub struct PaymentAuthorization {
    pub client: Pubkey,
    pub contract_id: String,
    pub freelancer: Pubkey,
    pub max_per_milestone: u64,
    pub total_authorized: u64,
    pub total_spent: u64,
    pub is_active: bool,
    pub authorized_at: i64,
    pub bump: u8,
}

impl PaymentAuthorization {
    pub const LEN: usize = 8 + // discriminator
        32 + // client
        4 + 64 + // contract_id (string with length prefix)
        32 + // freelancer
        8 + // max_per_milestone
        8 + // total_authorized
        8 + // total_spent
        1 + // is_active
        8 + // authorized_at
        1; // bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Amount exceeds per-milestone limit")]
    ExceedsPerMilestone,
    #[msg("Amount exceeds total authorized")]
    ExceedsTotal,
    #[msg("Payment authorization is inactive")]
    AuthorizationInactive,
    #[msg("Unauthorized client")]
    UnauthorizedClient,
    #[msg("Unauthorized freelancer")]
    UnauthorizedFreelancer,
}