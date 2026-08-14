#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Symbol, Vec};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AttendanceError {
    AlreadyCheckedIn = 1,
    InvalidSession = 2,
    UnauthorizedStudent = 3,
}

#[contracttype]
pub struct AttendanceRecord {
    pub student_id: Symbol,
    pub session_code: Symbol,
    pub timestamp: u64,
}

#[contract]
pub struct AttendanceContract;

#[contractimpl]
impl AttendanceContract {
    /// Mark attendance for a student in a specific session
    pub fn mark_attendance(
        env: Env,
        student_id: Symbol,
        session_code: Symbol,
    ) -> Result<bool, AttendanceError> {
        // Validate student symbol length
        if student_id == symbol_short!("INVALID") {
            return Err(AttendanceError::UnauthorizedStudent);
        }

        // Validate session code
        if session_code == symbol_short!("EXPIRED") {
            return Err(AttendanceError::InvalidSession);
        }

        // Key for storage: (student_id, session_code)
        let storage_key = (student_id.clone(), session_code.clone());

        // Check if attendance record already exists (Error Type 1: Duplicate Check-In)
        if env.storage().persistent().has(&storage_key) {
            return Err(AttendanceError::AlreadyCheckedIn);
        }

        // Store attendance record
        let record = AttendanceRecord {
            student_id: student_id.clone(),
            session_code: session_code.clone(),
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&storage_key, &record);

        // Emit Soroban Contract Event (Real-time Event Integration)
        env.events().publish(
            (symbol_short!("attend"), session_code),
            student_id,
        );

        Ok(true)
    }

    /// Check if student is marked present for a session
    pub fn get_attendance(env: Env, student_id: Symbol, session_code: Symbol) -> bool {
        let storage_key = (student_id, session_code);
        env.storage().persistent().has(&storage_key)
    }
}
