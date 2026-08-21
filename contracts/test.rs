#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

#[test]
fn test_mark_attendance_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AttendanceContract);
    let client = AttendanceContractClient::new(&env, &contract_id);

    let student = symbol_short!("STU9812");
    let session = symbol_short!("CS401");

    let result = client.try_mark_attendance(&student, &session);
    assert!(result.is_ok());

    let is_present = client.get_attendance(&student, &session);
    assert_eq!(is_present, true);
}

#[test]
fn test_prevent_duplicate_checkin() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AttendanceContract);
    let client = AttendanceContractClient::new(&env, &contract_id);

    let student = symbol_short!("STU9812");
    let session = symbol_short!("CS401");

    // First check-in succeeds
    let _ = client.mark_attendance(&student, &session);

    // Second check-in must revert with AlreadyCheckedIn (Code 1)
    let duplicate_result = client.try_mark_attendance(&student, &session);
    assert!(duplicate_result.is_err());
}

#[test]
fn test_expired_session_revert() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AttendanceContract);
    let client = AttendanceContractClient::new(&env, &contract_id);

    let student = symbol_short!("STU9812");
    let expired_session = symbol_short!("EXPIRED");

    let result = client.try_mark_attendance(&student, &expired_session);
    assert!(result.is_err());
}

#[test]
fn test_inter_contract_badge_issuance() {
    let env = Env::default();
    
    // Register secondary Badge Contract
    let badge_contract_id = env.register_contract(None, StudentBadgeContract);
    
    // Register Attendance Contract
    let attendance_contract_id = env.register_contract(None, AttendanceContract);
    let attendance_client = AttendanceContractClient::new(&env, &attendance_contract_id);

    let admin = Address::generate(&env);
    
    // Initialize Attendance Contract with secondary Badge Contract address
    attendance_client.initialize(&admin, &badge_contract_id);

    let student = symbol_short!("STU1001");
    let session = symbol_short!("W3101");

    // Mark attendance -> Triggers Inter-Contract call to BadgeContract
    let badge_id = attendance_client.mark_attendance(&student, &session);
    assert!(badge_id > 0);
}
