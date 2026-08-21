#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Vec, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Badge {
    pub badge_id: u32,
    pub student_id: Symbol,
    pub title: Symbol,
    pub issued_at: u64,
}

#[contract]
pub struct StudentBadgeContract;

#[contractimpl]
impl StudentBadgeContract {
    /// Issue an Attendance Proof Badge NFT to a student
    pub fn issue_badge(env: Env, student_id: Symbol, session_code: Symbol) -> u32 {
        let mut count: u32 = env.storage().instance().get(&symbol_short!("count")).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&symbol_short!("count"), &count);

        let badge = Badge {
            badge_id: count,
            student_id: student_id.clone(),
            title: session_code.clone(),
            issued_at: env.ledger().timestamp(),
        };

        // Key: (student_id, badge_id)
        let key = (student_id.clone(), count);
        env.storage().persistent().set(&key, &badge);

        // Emit Soroban Contract Event for Inter-Contract Badge Issuance
        env.events().publish(
            (symbol_short!("badge"), session_code),
            (student_id, count),
        );

        count
    }

    /// Get total badges issued by contract
    pub fn get_total_badges(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("count")).unwrap_or(0)
    }
}
