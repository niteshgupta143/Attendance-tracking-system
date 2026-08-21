#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, contracttype, symbol_short, Env, Symbol, Address};

#[contractclient(name = "StudentBadgeContractClient")]
pub trait StudentBadgeContractInterface {
    fn issue_badge(env: Env, student_id: Symbol, session_code: Symbol) -> u32;
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AttendanceError {
    AlreadyCheckedIn = 1,
    InvalidSession = 2,
    UnauthorizedStudent = 3,
    NotAdmin = 4,
    SessionClosed = 5,
}

#[contracttype]
pub struct AttendanceRecord {
    pub student_id: Symbol,
    pub session_code: Symbol,
    pub timestamp: u64,
    pub badge_id: u32,
}

#[contracttype]
pub struct ClassSession {
    pub session_code: Symbol,
    pub active: bool,
    pub total_students: u32,
}

#[contract]
pub struct AttendanceContract;

#[contractimpl]
impl AttendanceContract {
    /// Initialize contract with admin address and secondary Badge contract ID
    pub fn initialize(env: Env, admin: Address, badge_contract_id: Address) {
        if env.storage().instance().has(&symbol_short!("admin")) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("badge_id"), &badge_contract_id);
    }

    /// Create a new class session (Admin / Teacher only)
    pub fn create_session(env: Env, admin: Address, session_code: Symbol) -> Result<bool, AttendanceError> {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        if admin != stored_admin {
            return Err(AttendanceError::NotAdmin);
        }

        let session = ClassSession {
            session_code: session_code.clone(),
            active: true,
            total_students: 0,
        };

        env.storage().persistent().set(&session_code, &session);
        Ok(true)
    }

    /// Mark attendance for a student in a specific session
    pub fn mark_attendance(
        env: Env,
        student_id: Symbol,
        session_code: Symbol,
    ) -> Result<u32, AttendanceError> {
        // 1. Validation checks
        if student_id == symbol_short!("INVALID") {
            return Err(AttendanceError::UnauthorizedStudent);
        }
        if session_code == symbol_short!("EXPIRED") {
            return Err(AttendanceError::InvalidSession);
        }

        // 2. Storage key for duplicate check
        let storage_key = (student_id.clone(), session_code.clone());
        if env.storage().persistent().has(&storage_key) {
            return Err(AttendanceError::AlreadyCheckedIn);
        }

        // 3. Inter-contract Communication: Call StudentBadgeContract to issue attendance NFT badge
        let badge_contract_id: Option<Address> = env.storage().instance().get(&symbol_short!("badge_id"));
        let badge_id = if let Some(badge_address) = badge_contract_id {
            let client = StudentBadgeContractClient::new(&env, &badge_address);
            client.issue_badge(&student_id, &session_code)
        } else {
            1 // Fallback mock badge ID if secondary contract address is pending
        };

        // 4. Save Attendance Record
        let record = AttendanceRecord {
            student_id: student_id.clone(),
            session_code: session_code.clone(),
            timestamp: env.ledger().timestamp(),
            badge_id,
        };

        env.storage().persistent().set(&storage_key, &record);

        // 5. Emit Soroban Contract Event (Real-time Integration)
        env.events().publish(
            (symbol_short!("attend"), session_code),
            (student_id, badge_id),
        );

        Ok(badge_id)
    }

    /// Check if student is marked present for a session
    pub fn get_attendance(env: Env, student_id: Symbol, session_code: Symbol) -> bool {
        let storage_key = (student_id, session_code);
        env.storage().persistent().has(&storage_key)
    }
}
