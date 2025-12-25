# MetaPharm Connect - UAT Checklist by User Role

**Version:** 1.0
**Last Updated:** 2025-12-25

---

## How to Use This Checklist

1. Each role has a dedicated section with test scenarios
2. Execute each test in the order listed
3. Mark Pass/Fail in the Status column
4. Document any issues in the Notes column
5. Reference defect IDs for failed tests
6. Sign off when all critical/high tests pass

---

## 1. Pharmacist UAT Checklist

### 1.1 Authentication & Access

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-AUTH-001 | Login with username/password | 1. Navigate to login page 2. Enter credentials 3. Click login | Dashboard displayed | [ ] Pass [ ] Fail | | | |
| PH-AUTH-002 | MFA verification | 1. Login 2. Enter TOTP code | Access granted after MFA | [ ] Pass [ ] Fail | | | |
| PH-AUTH-003 | Password reset | 1. Click "Forgot password" 2. Enter email 3. Follow reset link | Password reset successfully | [ ] Pass [ ] Fail | | | |
| PH-AUTH-004 | Session timeout | 1. Login 2. Wait 2 hours (or configured time) | Automatic logout | [ ] Pass [ ] Fail | | | |
| PH-AUTH-005 | Logout | 1. Click logout button | Redirected to login page | [ ] Pass [ ] Fail | | | |

### 1.2 Dashboard

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-DASH-001 | Dashboard load | 1. Login 2. View dashboard | All widgets load within 3s | [ ] Pass [ ] Fail | | | |
| PH-DASH-002 | Pending prescriptions widget | 1. View dashboard | Shows count of pending Rx | [ ] Pass [ ] Fail | | | |
| PH-DASH-003 | Low inventory alerts | 1. View dashboard | Shows low stock items | [ ] Pass [ ] Fail | | | |
| PH-DASH-004 | Today's appointments | 1. View dashboard | Shows scheduled teleconsults | [ ] Pass [ ] Fail | | | |
| PH-DASH-005 | Quick actions | 1. Click quick action buttons | Navigates to correct pages | [ ] Pass [ ] Fail | | | |

### 1.3 Prescription Management

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-RX-001 | View prescription queue | 1. Navigate to Prescriptions 2. View list | All pending Rx displayed | [ ] Pass [ ] Fail | | | |
| PH-RX-002 | Search prescriptions | 1. Enter search term 2. Filter by status | Correct results returned | [ ] Pass [ ] Fail | | | |
| PH-RX-003 | View prescription details | 1. Click on prescription | Full details displayed | [ ] Pass [ ] Fail | | | |
| PH-RX-004 | Validate prescription | 1. Open Rx 2. Check medications 3. Verify doctor | Validation completes | [ ] Pass [ ] Fail | | | |
| PH-RX-005 | Drug interaction check | 1. Open Rx with interacting drugs | Interaction warning displayed | [ ] Pass [ ] Fail | | | |
| PH-RX-006 | Dispense prescription | 1. Validate Rx 2. Click Dispense 3. Print label | Status changes to Dispensed | [ ] Pass [ ] Fail | | | |
| PH-RX-007 | Reject prescription | 1. Open Rx 2. Click Reject 3. Enter reason | Status changes to Rejected, doctor notified | [ ] Pass [ ] Fail | | | |
| PH-RX-008 | Controlled substance handling | 1. Process controlled substance Rx | DEA verification required | [ ] Pass [ ] Fail | | | |
| PH-RX-009 | Print prescription label | 1. Click print 2. Select printer | Label prints correctly | [ ] Pass [ ] Fail | | | |
| PH-RX-010 | Prescription history | 1. Search patient 2. View history | Full history displayed | [ ] Pass [ ] Fail | | | |

### 1.4 Inventory Management

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-INV-001 | View inventory | 1. Navigate to Inventory | All products displayed | [ ] Pass [ ] Fail | | | |
| PH-INV-002 | Search products | 1. Enter product name | Correct results | [ ] Pass [ ] Fail | | | |
| PH-INV-003 | Filter by category | 1. Select category filter | Filtered list displayed | [ ] Pass [ ] Fail | | | |
| PH-INV-004 | Update stock level | 1. Edit product 2. Change quantity 3. Save | Stock level updated | [ ] Pass [ ] Fail | | | |
| PH-INV-005 | QR code scan | 1. Click scan 2. Scan product QR | Product identified | [ ] Pass [ ] Fail | | | |
| PH-INV-006 | Low stock alert | 1. Set reorder level 2. Reduce stock below | Alert triggered | [ ] Pass [ ] Fail | | | |
| PH-INV-007 | Expiry tracking | 1. View expiring products | Products near expiry highlighted | [ ] Pass [ ] Fail | | | |
| PH-INV-008 | Batch tracking | 1. View product batches | All batches displayed | [ ] Pass [ ] Fail | | | |
| PH-INV-009 | Generate inventory report | 1. Click export 2. Select format | Report downloads | [ ] Pass [ ] Fail | | | |
| PH-INV-010 | Reorder product | 1. Click reorder 2. Enter quantity 3. Submit | Order placed with supplier | [ ] Pass [ ] Fail | | | |

### 1.5 Teleconsultation

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-TC-001 | View appointments | 1. Navigate to Teleconsultation | All appointments listed | [ ] Pass [ ] Fail | | | |
| PH-TC-002 | Join video call | 1. Click Join 2. Allow camera/mic | Video call starts | [ ] Pass [ ] Fail | | | |
| PH-TC-003 | Video quality | 1. During call 2. Observe video | Video is clear, no lag | [ ] Pass [ ] Fail | | | |
| PH-TC-004 | Audio quality | 1. During call 2. Test audio | Audio is clear, no echo | [ ] Pass [ ] Fail | | | |
| PH-TC-005 | Screen share | 1. Click screen share 2. Select screen | Screen visible to patient | [ ] Pass [ ] Fail | | | |
| PH-TC-006 | In-call chat | 1. Send message 2. Receive reply | Messages delivered | [ ] Pass [ ] Fail | | | |
| PH-TC-007 | End call | 1. Click End Call | Call terminates cleanly | [ ] Pass [ ] Fail | | | |
| PH-TC-008 | Post-call notes | 1. After call 2. Enter notes 3. Save | Notes saved to record | [ ] Pass [ ] Fail | | | |
| PH-TC-009 | Recording consent | 1. Start recording 2. Patient consent | Recording starts with consent | [ ] Pass [ ] Fail | | | |
| PH-TC-010 | Schedule new appointment | 1. Click schedule 2. Select date/time 3. Confirm | Appointment created | [ ] Pass [ ] Fail | | | |

### 1.6 Messaging

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PH-MSG-001 | View inbox | 1. Navigate to Messages | All messages displayed | [ ] Pass [ ] Fail | | | |
| PH-MSG-002 | Send message to doctor | 1. Compose 2. Select recipient 3. Send | Message delivered | [ ] Pass [ ] Fail | | | |
| PH-MSG-003 | Send message to patient | 1. Compose 2. Select patient 3. Send | Message delivered | [ ] Pass [ ] Fail | | | |
| PH-MSG-004 | Attach file | 1. Compose 2. Attach file 3. Send | Attachment delivered | [ ] Pass [ ] Fail | | | |
| PH-MSG-005 | Read receipt | 1. Send message 2. Wait for read | Read receipt shown | [ ] Pass [ ] Fail | | | |
| PH-MSG-006 | Search messages | 1. Enter search term | Correct results | [ ] Pass [ ] Fail | | | |
| PH-MSG-007 | Message encryption | 1. Send sensitive message | Message encrypted (verify in logs) | [ ] Pass [ ] Fail | | | |
| PH-MSG-008 | Voice transcription | 1. Send voice message | Transcription generated | [ ] Pass [ ] Fail | | | |

---

## 2. Doctor UAT Checklist

### 2.1 Authentication & Access

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DR-AUTH-001 | Login with HIN e-ID | 1. Click HIN login 2. Complete HIN auth | Dashboard displayed | [ ] Pass [ ] Fail | | | |
| DR-AUTH-002 | Login with username/password | 1. Enter credentials 2. Complete MFA | Access granted | [ ] Pass [ ] Fail | | | |
| DR-AUTH-003 | Session management | 1. Login 2. Check session duration | Session valid for configured time | [ ] Pass [ ] Fail | | | |

### 2.2 Prescription Creation

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DR-RX-001 | Create new prescription | 1. Select patient 2. Add medications 3. Sign 4. Send | Rx sent to pharmacy | [ ] Pass [ ] Fail | | | |
| DR-RX-002 | Drug search | 1. Type medication name | Autocomplete suggestions | [ ] Pass [ ] Fail | | | |
| DR-RX-003 | Dosage selection | 1. Select medication 2. Choose dosage | Dosage options displayed | [ ] Pass [ ] Fail | | | |
| DR-RX-004 | Drug interaction warning | 1. Add interacting medications | Warning displayed | [ ] Pass [ ] Fail | | | |
| DR-RX-005 | Allergy alert | 1. Add medication patient allergic to | Alert displayed | [ ] Pass [ ] Fail | | | |
| DR-RX-006 | Electronic signature | 1. Sign prescription | Signature applied | [ ] Pass [ ] Fail | | | |
| DR-RX-007 | Renew prescription | 1. Find existing Rx 2. Click renew 3. Confirm | Renewal sent | [ ] Pass [ ] Fail | | | |
| DR-RX-008 | Controlled substance Rx | 1. Create controlled substance Rx | DEA number required | [ ] Pass [ ] Fail | | | |
| DR-RX-009 | Select pharmacy | 1. Choose patient's preferred pharmacy | Pharmacy selected | [ ] Pass [ ] Fail | | | |
| DR-RX-010 | View sent prescriptions | 1. Navigate to Sent Rx | List of sent Rx displayed | [ ] Pass [ ] Fail | | | |

### 2.3 Patient Records

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DR-PAT-001 | Search patients | 1. Enter patient name | Search results displayed | [ ] Pass [ ] Fail | | | |
| DR-PAT-002 | View patient profile | 1. Select patient | Full profile displayed | [ ] Pass [ ] Fail | | | |
| DR-PAT-003 | View medication history | 1. Open patient 2. View medications | Full history displayed | [ ] Pass [ ] Fail | | | |
| DR-PAT-004 | View allergies | 1. Open patient 2. View allergies | Allergies displayed prominently | [ ] Pass [ ] Fail | | | |
| DR-PAT-005 | View lab results | 1. Open patient 2. View labs | Lab results accessible | [ ] Pass [ ] Fail | | | |
| DR-PAT-006 | Add clinical note | 1. Open patient 2. Add note 3. Save | Note saved to record | [ ] Pass [ ] Fail | | | |

### 2.4 Communication

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DR-COM-001 | Message pharmacist | 1. Compose 2. Select pharmacist 3. Send | Message delivered | [ ] Pass [ ] Fail | | | |
| DR-COM-002 | Receive pharmacy response | 1. Wait for reply | Reply notification received | [ ] Pass [ ] Fail | | | |
| DR-COM-003 | Teleconsultation with patient | 1. Schedule 2. Join 3. Conduct | Call completes successfully | [ ] Pass [ ] Fail | | | |

---

## 3. Nurse UAT Checklist

### 3.1 Authentication & Access

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| NR-AUTH-001 | Login | 1. Enter credentials 2. Verify | Dashboard displayed | [ ] Pass [ ] Fail | | | |
| NR-AUTH-002 | Role permissions | 1. Login 2. Verify accessible features | Only nurse features accessible | [ ] Pass [ ] Fail | | | |

### 3.2 Patient Management

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| NR-PAT-001 | View assigned patients | 1. Navigate to Patients | Assigned patients displayed | [ ] Pass [ ] Fail | | | |
| NR-PAT-002 | View patient details | 1. Select patient | Patient info displayed | [ ] Pass [ ] Fail | | | |
| NR-PAT-003 | View medication list | 1. Open patient 2. View medications | Current medications listed | [ ] Pass [ ] Fail | | | |
| NR-PAT-004 | View allergies | 1. Open patient 2. Check allergies | Allergies clearly displayed | [ ] Pass [ ] Fail | | | |
| NR-PAT-005 | View medication history | 1. Open patient 2. View history | Full history accessible | [ ] Pass [ ] Fail | | | |

### 3.3 Medication Ordering

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| NR-ORD-001 | Create medication order | 1. Select patient 2. Select medications 3. Submit | Order sent to pharmacy | [ ] Pass [ ] Fail | | | |
| NR-ORD-002 | Select pharmacy | 1. Choose pharmacy from list | Pharmacy selected | [ ] Pass [ ] Fail | | | |
| NR-ORD-003 | Add delivery instructions | 1. Enter special instructions | Instructions saved | [ ] Pass [ ] Fail | | | |
| NR-ORD-004 | View order status | 1. Navigate to Orders | Order statuses displayed | [ ] Pass [ ] Fail | | | |
| NR-ORD-005 | Receive order confirmation | 1. Wait for pharmacy confirmation | Notification received | [ ] Pass [ ] Fail | | | |

### 3.4 Delivery Tracking

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| NR-DEL-001 | Track delivery | 1. Open order 2. View tracking | Real-time location displayed | [ ] Pass [ ] Fail | | | |
| NR-DEL-002 | Delivery status updates | 1. Monitor order | Status changes reflected | [ ] Pass [ ] Fail | | | |
| NR-DEL-003 | Delivery confirmation | 1. Wait for delivery | Confirmation received | [ ] Pass [ ] Fail | | | |

### 3.5 Communication

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| NR-COM-001 | Message pharmacy | 1. Compose 2. Send | Message delivered | [ ] Pass [ ] Fail | | | |
| NR-COM-002 | Receive pharmacy response | 1. Wait for reply | Reply received | [ ] Pass [ ] Fail | | | |

---

## 4. Delivery Personnel UAT Checklist

### 4.1 Mobile App Access

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DL-APP-001 | App launch | 1. Open mobile app | App loads correctly | [ ] Pass [ ] Fail | | | |
| DL-APP-002 | Login | 1. Enter credentials 2. Authenticate | Dashboard displayed | [ ] Pass [ ] Fail | | | |
| DL-APP-003 | Biometric login | 1. Use fingerprint/face | Login successful | [ ] Pass [ ] Fail | | | |
| DL-APP-004 | Logout | 1. Click logout | Session terminated | [ ] Pass [ ] Fail | | | |

### 4.2 Delivery Management

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DL-DEL-001 | View delivery queue | 1. Navigate to Deliveries | All assigned deliveries shown | [ ] Pass [ ] Fail | | | |
| DL-DEL-002 | View delivery details | 1. Tap on delivery | Full details displayed | [ ] Pass [ ] Fail | | | |
| DL-DEL-003 | Start delivery | 1. Tap Start | Status changes to In Progress | [ ] Pass [ ] Fail | | | |
| DL-DEL-004 | Navigate to address | 1. Tap Navigate | Maps opens with directions | [ ] Pass [ ] Fail | | | |
| DL-DEL-005 | GPS tracking | 1. During delivery | Location tracked in real-time | [ ] Pass [ ] Fail | | | |
| DL-DEL-006 | Route optimization | 1. View route 2. Check optimization | Optimal route displayed | [ ] Pass [ ] Fail | | | |

### 4.3 Proof of Delivery

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DL-POD-001 | Scan QR code | 1. Tap Scan 2. Scan package QR | Package verified | [ ] Pass [ ] Fail | | | |
| DL-POD-002 | Capture signature | 1. Request signature 2. Customer signs | Signature saved | [ ] Pass [ ] Fail | | | |
| DL-POD-003 | Take photo | 1. Tap Photo 2. Capture | Photo uploaded | [ ] Pass [ ] Fail | | | |
| DL-POD-004 | Complete delivery | 1. All POD steps done 2. Confirm | Status changes to Delivered | [ ] Pass [ ] Fail | | | |
| DL-POD-005 | Failed delivery | 1. Tap Failed 2. Select reason 3. Add notes | Failure logged | [ ] Pass [ ] Fail | | | |

### 4.4 Special Handling

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DL-SPL-001 | Cold chain delivery | 1. View cold chain order | Temperature requirements displayed | [ ] Pass [ ] Fail | | | |
| DL-SPL-002 | Log temperature | 1. Scan temp logger 2. Record | Temperature logged | [ ] Pass [ ] Fail | | | |
| DL-SPL-003 | Controlled substance | 1. View controlled substance order | Special instructions displayed | [ ] Pass [ ] Fail | | | |
| DL-SPL-004 | ID verification | 1. Verify customer ID | Verification logged | [ ] Pass [ ] Fail | | | |

### 4.5 Offline Mode

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| DL-OFF-001 | Enter offline mode | 1. Disable network | App continues to function | [ ] Pass [ ] Fail | | | |
| DL-OFF-002 | Complete delivery offline | 1. Complete all POD steps offline | Data saved locally | [ ] Pass [ ] Fail | | | |
| DL-OFF-003 | Sync when online | 1. Enable network | Data syncs to server | [ ] Pass [ ] Fail | | | |

---

## 5. Patient UAT Checklist

### 5.1 Registration & Authentication

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-AUTH-001 | Register new account | 1. Click Register 2. Fill form 3. Verify email | Account created | [ ] Pass [ ] Fail | | | |
| PT-AUTH-002 | Login with password | 1. Enter credentials | Dashboard displayed | [ ] Pass [ ] Fail | | | |
| PT-AUTH-003 | Password reset | 1. Forgot password 2. Reset | Password changed | [ ] Pass [ ] Fail | | | |
| PT-AUTH-004 | Profile update | 1. Edit profile 2. Save | Changes saved | [ ] Pass [ ] Fail | | | |

### 5.2 Prescription Management

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-RX-001 | View prescriptions | 1. Navigate to Prescriptions | All Rx displayed | [ ] Pass [ ] Fail | | | |
| PT-RX-002 | Request refill | 1. Select Rx 2. Request refill | Refill requested | [ ] Pass [ ] Fail | | | |
| PT-RX-003 | Track refill status | 1. View pending refills | Status displayed | [ ] Pass [ ] Fail | | | |
| PT-RX-004 | Upload prescription image | 1. Take photo 2. Upload | Image uploaded for processing | [ ] Pass [ ] Fail | | | |
| PT-RX-005 | View medication info | 1. Tap medication | Full info displayed | [ ] Pass [ ] Fail | | | |

### 5.3 Appointments & Teleconsultation

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-APT-001 | Book teleconsultation | 1. Select pharmacist 2. Choose time 3. Confirm | Appointment booked | [ ] Pass [ ] Fail | | | |
| PT-APT-002 | View appointments | 1. Navigate to Appointments | All appointments listed | [ ] Pass [ ] Fail | | | |
| PT-APT-003 | Join video call | 1. Click Join 2. Allow camera/mic | Video call starts | [ ] Pass [ ] Fail | | | |
| PT-APT-004 | Video quality | 1. During call | Video clear, no lag | [ ] Pass [ ] Fail | | | |
| PT-APT-005 | Audio quality | 1. During call | Audio clear | [ ] Pass [ ] Fail | | | |
| PT-APT-006 | End call | 1. Click End | Call terminates | [ ] Pass [ ] Fail | | | |
| PT-APT-007 | Cancel appointment | 1. Select apt 2. Cancel | Appointment cancelled | [ ] Pass [ ] Fail | | | |
| PT-APT-008 | Reschedule appointment | 1. Select apt 2. Reschedule | New time confirmed | [ ] Pass [ ] Fail | | | |

### 5.4 E-Commerce (OTC Products)

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-EC-001 | Browse products | 1. Navigate to Shop | Products displayed | [ ] Pass [ ] Fail | | | |
| PT-EC-002 | Search products | 1. Enter search term | Results displayed | [ ] Pass [ ] Fail | | | |
| PT-EC-003 | Filter by category | 1. Select category | Filtered results | [ ] Pass [ ] Fail | | | |
| PT-EC-004 | Add to cart | 1. Click Add to Cart | Item added | [ ] Pass [ ] Fail | | | |
| PT-EC-005 | View cart | 1. Click Cart | Cart displayed | [ ] Pass [ ] Fail | | | |
| PT-EC-006 | Update quantity | 1. Change quantity 2. Update | Cart updated | [ ] Pass [ ] Fail | | | |
| PT-EC-007 | Remove item | 1. Click Remove | Item removed | [ ] Pass [ ] Fail | | | |
| PT-EC-008 | Checkout | 1. Click Checkout 2. Enter details 3. Pay | Order placed | [ ] Pass [ ] Fail | | | |
| PT-EC-009 | Payment processing | 1. Enter card details 2. Confirm | Payment successful | [ ] Pass [ ] Fail | | | |
| PT-EC-010 | Order confirmation | 1. Complete checkout | Confirmation email received | [ ] Pass [ ] Fail | | | |

### 5.5 Delivery Tracking

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-DEL-001 | View orders | 1. Navigate to Orders | Order history displayed | [ ] Pass [ ] Fail | | | |
| PT-DEL-002 | Track delivery | 1. Select order 2. View tracking | Real-time location shown | [ ] Pass [ ] Fail | | | |
| PT-DEL-003 | Delivery ETA | 1. View tracking | ETA displayed | [ ] Pass [ ] Fail | | | |
| PT-DEL-004 | Delivery notification | 1. Wait for delivery | Notification received | [ ] Pass [ ] Fail | | | |

### 5.6 VIP Program (Golden MetaPharm)

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-VIP-001 | View VIP status | 1. Navigate to VIP | Tier and points displayed | [ ] Pass [ ] Fail | | | |
| PT-VIP-002 | Earn points | 1. Complete purchase | Points added | [ ] Pass [ ] Fail | | | |
| PT-VIP-003 | View benefits | 1. View tier benefits | Benefits listed | [ ] Pass [ ] Fail | | | |
| PT-VIP-004 | Redeem points | 1. Select reward 2. Redeem | Points deducted, reward applied | [ ] Pass [ ] Fail | | | |
| PT-VIP-005 | Tier upgrade | 1. Reach tier threshold | Tier upgraded | [ ] Pass [ ] Fail | | | |

### 5.7 Medical Records & GDPR

| ID | Test Scenario | Steps | Expected Result | Status | Notes | Tester | Date |
|----|---------------|-------|-----------------|--------|-------|--------|------|
| PT-MED-001 | View medical records | 1. Navigate to Records | Records displayed | [ ] Pass [ ] Fail | | | |
| PT-MED-002 | Export data (GDPR) | 1. Request export 2. Download | Data exported | [ ] Pass [ ] Fail | | | |
| PT-MED-003 | Delete account (GDPR) | 1. Request deletion 2. Confirm | Account deleted | [ ] Pass [ ] Fail | | | |
| PT-MED-004 | Manage consent | 1. View consent settings 2. Update | Preferences saved | [ ] Pass [ ] Fail | | | |

---

## Sign-Off Section

### Role Sign-Off

| Role | Tester Name | Total Tests | Passed | Failed | Sign-Off Date | Signature |
|------|-------------|-------------|--------|--------|---------------|-----------|
| Pharmacist | | | | | | |
| Doctor | | | | | | |
| Nurse | | | | | | |
| Delivery | | | | | | |
| Patient | | | | | | |

### Overall UAT Sign-Off

| Name | Role | Approval | Date | Signature |
|------|------|----------|------|-----------|
| | UAT Lead | [ ] Approved [ ] Not Approved | | |
| | Product Owner | [ ] Approved [ ] Not Approved | | |
| | Development Lead | [ ] Approved [ ] Not Approved | | |
| | QA Lead | [ ] Approved [ ] Not Approved | | |

---

*End of UAT Checklist*
