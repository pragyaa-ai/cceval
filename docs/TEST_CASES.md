# CCEval v2.1.0 - Test Cases Document

**Version:** 2.1.0  
**Date:** January 2026  
**Tester Name:** _______________________  
**Test Date:** _______________________  

---

## Instructions for Testers

1. Execute each test case in order within each section
2. Mark **PASS** or **FAIL** in the Result column
3. Add notes for any failures or unexpected behavior
4. For failed tests, capture screenshots and console errors if possible

---

## Test Environment

| Item | Value |
|------|-------|
| URL | https://cceval.pragyaa.ai/v2 |
| Browser | |
| Browser Version | |
| OS | |

---

## Section 1: Evaluator Portal - Authentication

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-AUTH-01 | Access Evaluator Login Page | 1. Navigate to /v2 <br> 2. Click "Evaluator" card | Login page with Google Sign-in button displayed | ☐ PASS ☐ FAIL | |
| E-AUTH-02 | Successful Google Login | 1. Click "Sign in with Google" <br> 2. Select Google account <br> 3. Complete authentication | Redirected to Evaluator Dashboard | ☐ PASS ☐ FAIL | |
| E-AUTH-03 | Session Persistence | 1. Login as evaluator <br> 2. Close browser tab <br> 3. Reopen same URL | User remains logged in | ☐ PASS ☐ FAIL | |
| E-AUTH-04 | Logout Functionality | 1. Click user profile/logout button <br> 2. Confirm logout | User logged out, redirected to login page | ☐ PASS ☐ FAIL | |

---

## Section 2: Evaluator Portal - Batch Management

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-BATCH-01 | View Batches Tab | 1. Login as evaluator <br> 2. Navigate to "Batches" tab | List of batches displayed (or empty state) | ☐ PASS ☐ FAIL | |
| E-BATCH-02 | Create New Batch | 1. Click "Create Batch" <br> 2. Enter batch name <br> 3. Submit | New batch created and appears in list | ☐ PASS ☐ FAIL | |
| E-BATCH-03 | Select Batch | 1. Click on a batch from list | Batch details panel opens | ☐ PASS ☐ FAIL | |
| E-BATCH-04 | View Batch Statistics | 1. Select a batch | Shows total candidates, completed, in-progress counts | ☐ PASS ☐ FAIL | |

---

## Section 3: Evaluator Portal - Candidate Management

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-CAND-01 | View Candidates Tab | 1. Select a batch <br> 2. View "Candidates" tab | Table with candidate list displayed | ☐ PASS ☐ FAIL | |
| E-CAND-02 | Add Single Candidate | 1. Click "Add Candidate" <br> 2. Fill name, email, phone <br> 3. Select Use Case <br> 4. Select Reading Passage <br> 5. Select Scenario <br> 6. Submit | Candidate added with auto-generated access code | ☐ PASS ☐ FAIL | |
| E-CAND-03 | Verify Access Code Generation | 1. Add a candidate <br> 2. Check Access Code column | 4-digit access code displayed | ☐ PASS ☐ FAIL | |
| E-CAND-04 | Use Case Selection | 1. Add candidate <br> 2. Select "PV Sales" use case | Passage and scenario options filter to PV Sales options | ☐ PASS ☐ FAIL | |
| E-CAND-05 | Use Case - EV Sales | 1. Add candidate <br> 2. Select "EV Sales" use case | Passage shows EV options (Fast Charging, Battery Tech) | ☐ PASS ☐ FAIL | |
| E-CAND-06 | Use Case - Service | 1. Add candidate <br> 2. Select "Service" use case | Passage shows Service options (Connected Car, Service Packages) | ☐ PASS ☐ FAIL | |
| E-CAND-07 | Bulk Upload Candidates | 1. Click "Upload CSV" <br> 2. Select valid CSV file <br> 3. Confirm upload | Multiple candidates added successfully | ☐ PASS ☐ FAIL | |
| E-CAND-08 | Edit Candidate Details | 1. Click edit icon on candidate row <br> 2. Modify details <br> 3. Save | Changes saved and reflected in table | ☐ PASS ☐ FAIL | |
| E-CAND-09 | Delete Candidate | 1. Click delete icon on candidate row <br> 2. Confirm deletion | Candidate removed from list | ☐ PASS ☐ FAIL | |
| E-CAND-10 | Candidate Status Display | 1. View candidates table | Status column shows: pending, in_progress, or completed | ☐ PASS ☐ FAIL | |

---

## Section 4: Evaluator Portal - Live Evaluation Monitoring

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-LIVE-01 | View Evaluation Tab | 1. Select a batch with in-progress evaluation <br> 2. Click "Evaluation" tab | Live evaluation view displayed | ☐ PASS ☐ FAIL | |
| E-LIVE-02 | Live Transcript Updates | 1. Start candidate evaluation <br> 2. Monitor evaluator dashboard | Real-time transcript updates appear | ☐ PASS ☐ FAIL | |
| E-LIVE-03 | Phase Progress Indicator | 1. Monitor live evaluation | Current phase highlighted, progress visible | ☐ PASS ☐ FAIL | |
| E-LIVE-04 | Voice Quality Metrics | 1. During reading task <br> 2. View voice analysis section | Voice metrics (clarity, volume, pace, tone) update | ☐ PASS ☐ FAIL | |
| E-LIVE-05 | Score Updates | 1. During evaluation <br> 2. Monitor scores section | Scores populate as AI evaluates | ☐ PASS ☐ FAIL | |

---

## Section 5: Evaluator Portal - Results Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-RES-01 | View Results Tab | 1. Select a batch <br> 2. Click "Results" tab | Results table displayed with columns: Name, Use Case, Reading Passage, Scenario, Status, Score | ☐ PASS ☐ FAIL | |
| E-RES-02 | View Completed Evaluation | 1. Click on completed candidate row | Full evaluation details modal opens | ☐ PASS ☐ FAIL | |
| E-RES-03 | Results Column Consistency | 1. Compare Results tab columns with Candidate Management | Use Case, Reading Passage, Scenario columns match | ☐ PASS ☐ FAIL | |
| E-RES-04 | View Transcript | 1. Open evaluation details <br> 2. Navigate to Transcript section | Full Q&A transcript displayed | ☐ PASS ☐ FAIL | |
| E-RES-05 | View Scores Breakdown | 1. Open evaluation details <br> 2. View scores section | All 8 parameters with scores and reasons displayed | ☐ PASS ☐ FAIL | |
| E-RES-06 | View Voice Analysis Report | 1. Open evaluation details <br> 2. View voice analysis section | Clarity, volume, pace, tone scores with recommendations | ☐ PASS ☐ FAIL | |
| E-RES-07 | View Typing Test Results | 1. Open evaluation with typing test <br> 2. View typing section | WPM, accuracy, content quality displayed | ☐ PASS ☐ FAIL | |
| E-RES-08 | Download/Export Results | 1. Click export button (if available) | Results exported as CSV/PDF | ☐ PASS ☐ FAIL | |

---

## Section 6: Evaluator Portal - Feedback & Calibration

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-CAL-01 | Provide Score Feedback | 1. Open completed evaluation <br> 2. Click feedback on a score <br> 3. Indicate AI scored too high/low <br> 4. Add comments | Feedback saved successfully | ☐ PASS ☐ FAIL | |
| E-CAL-02 | Recalibrate Evaluation | 1. Open evaluation with feedback <br> 2. Click "Recalibrate" <br> 3. Confirm | Scores recalculated based on feedback | ☐ PASS ☐ FAIL | |
| E-CAL-03 | View Calibration History | 1. Open evaluation <br> 2. View calibration section | History of calibration attempts shown | ☐ PASS ☐ FAIL | |
| E-CAL-04 | Manager Decision | 1. Open evaluation <br> 2. Select HR decision (Hire/Don't Hire/Needs Improvement) <br> 3. Add comments <br> 4. Save | Decision saved and displayed | ☐ PASS ☐ FAIL | |

---

## Section 7: Evaluator Portal - Scenarios Configuration

### 7.1 Use Cases Sub-Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-SC-UC-01 | View Use Cases | 1. Navigate to Scenarios tab <br> 2. Click "Use Cases" sub-tab | List of use cases displayed (PV Sales, EV Sales, Service) | ☐ PASS ☐ FAIL | |
| E-SC-UC-02 | Add New Use Case | 1. Click "Add Use Case" <br> 2. Enter name and description <br> 3. Save | New use case added to list | ☐ PASS ☐ FAIL | |
| E-SC-UC-03 | Edit Use Case | 1. Click edit on existing use case <br> 2. Modify details <br> 3. Save | Changes saved | ☐ PASS ☐ FAIL | |

### 7.2 Reading Passages Sub-Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-SC-RP-01 | View Reading Passages | 1. Click "Reading Passages" sub-tab | Passages grouped by use case displayed | ☐ PASS ☐ FAIL | |
| E-SC-RP-02 | Filter by Use Case | 1. Select use case filter | Only passages for that use case shown | ☐ PASS ☐ FAIL | |
| E-SC-RP-03 | Add New Passage | 1. Click "Add Passage" <br> 2. Select use case <br> 3. Enter title and text <br> 4. Save | Passage added with word count calculated | ☐ PASS ☐ FAIL | |
| E-SC-RP-04 | Edit Passage | 1. Click edit on passage <br> 2. Modify text <br> 3. Save | Changes saved, word count updated | ☐ PASS ☐ FAIL | |

### 7.3 Call Scenarios Sub-Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-SC-CS-01 | View Call Scenarios | 1. Click "Call Scenarios" sub-tab | Scenarios with difficulty levels displayed | ☐ PASS ☐ FAIL | |
| E-SC-CS-02 | Add New Scenario | 1. Click "Add Scenario" <br> 2. Select use case and difficulty <br> 3. Enter customer persona and script <br> 4. Save | Scenario created | ☐ PASS ☐ FAIL | |
| E-SC-CS-03 | Edit Scenario | 1. Click edit on scenario <br> 2. Modify details <br> 3. Save | Changes saved | ☐ PASS ☐ FAIL | |

### 7.4 Scoring Metrics Sub-Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-SC-SM-01 | View Scoring Metrics | 1. Click "Scoring Metrics" sub-tab | Metrics grouped by use case displayed | ☐ PASS ☐ FAIL | |
| E-SC-SM-02 | View Metric Details | 1. Expand a metric | Shows description, scoring criteria (1-5 scale) | ☐ PASS ☐ FAIL | |
| E-SC-SM-03 | Add New Metric | 1. Click "Add Metric" <br> 2. Select use case <br> 3. Enter name and description <br> 4. Save | Metric added | ☐ PASS ☐ FAIL | |
| E-SC-SM-04 | Edit Metric | 1. Click edit on metric <br> 2. Modify details <br> 3. Save | Changes saved | ☐ PASS ☐ FAIL | |

### 7.5 Voice Quality Metrics Sub-Tab

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| E-SC-VQ-01 | View Voice Metrics | 1. Click "Voice Quality" sub-tab | Voice parameters displayed (Clarity, Volume, Pace, Tone) | ☐ PASS ☐ FAIL | |
| E-SC-VQ-02 | View Metric Calculation | 1. Expand a voice metric | Shows calculation method and thresholds | ☐ PASS ☐ FAIL | |
| E-SC-VQ-03 | Edit Voice Metric Thresholds | 1. Click edit on metric <br> 2. Adjust threshold values <br> 3. Save | Thresholds updated | ☐ PASS ☐ FAIL | |
| E-SC-VQ-04 | Add Voice Metric | 1. Click "Add Metric" <br> 2. Enter name and measurement method <br> 3. Save | New voice metric added with suggestions | ☐ PASS ☐ FAIL | |

---

## Section 8: Candidate Portal - Authentication

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-AUTH-01 | Access Candidate Portal | 1. Navigate to /v2 <br> 2. Click "Candidate" card | Access code entry screen displayed | ☐ PASS ☐ FAIL | |
| C-AUTH-02 | Valid Access Code Login | 1. Enter valid 4-digit access code <br> 2. Submit | Candidate authenticated, welcome screen shown | ☐ PASS ☐ FAIL | |
| C-AUTH-03 | Invalid Access Code | 1. Enter incorrect 4-digit code <br> 2. Submit | Error message displayed | ☐ PASS ☐ FAIL | |
| C-AUTH-04 | Candidate Name Display | 1. Login with valid code | Candidate's name displayed in welcome screen | ☐ PASS ☐ FAIL | |

---

## Section 9: Candidate Portal - Evaluation Flow

### 9.1 Welcome & Start

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-EVAL-01 | View Welcome Screen | 1. Login as candidate | Welcome message with evaluation overview displayed | ☐ PASS ☐ FAIL | |
| C-EVAL-02 | View Assigned Passage/Scenario | 1. Check welcome screen | Shows assigned reading passage title and scenario | ☐ PASS ☐ FAIL | |
| C-EVAL-03 | Start Evaluation | 1. Click "Begin Evaluation" | Microphone permission requested, evaluation starts | ☐ PASS ☐ FAIL | |
| C-EVAL-04 | Microphone Permission | 1. Grant microphone access | Voice connection established with Eva | ☐ PASS ☐ FAIL | |

### 9.2 Phase 1: Personal Questions

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH1-01 | Eva Introduction | 1. Start evaluation | Eva greets and introduces herself | ☐ PASS ☐ FAIL | |
| C-PH1-02 | Name Collection | 1. Eva asks for name <br> 2. Respond with name | Eva acknowledges and proceeds | ☐ PASS ☐ FAIL | |
| C-PH1-03 | Personal Questions | 1. Answer each question | Eva asks about motivation, challenges, domain knowledge | ☐ PASS ☐ FAIL | |
| C-PH1-04 | Transcript Display | 1. During conversation | Q&A transcript appears in left panel | ☐ PASS ☐ FAIL | |
| C-PH1-05 | Phase Progress Update | 1. During personal questions | Progress indicator shows Phase 1 active | ☐ PASS ☐ FAIL | |

### 9.3 Phase 2: Reading Task

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH2-01 | Phase Transition | 1. Complete personal questions | Eva announces reading task | ☐ PASS ☐ FAIL | |
| C-PH2-02 | **Reading Panel Display** | 1. When reading task starts | **Reading passage panel appears on right side with full paragraph text** | ☐ PASS ☐ FAIL | |
| C-PH2-03 | Passage Title Display | 1. View reading panel | Passage title shown (e.g., "Safety & ADAS Features") | ☐ PASS ☐ FAIL | |
| C-PH2-04 | Word Count Display | 1. View reading panel | Word count shown at bottom | ☐ PASS ☐ FAIL | |
| C-PH2-05 | Eva Instruction | 1. Eva speaks | Eva says "Please look at the right side of your screen where the reading passage is displayed" | ☐ PASS ☐ FAIL | |
| C-PH2-06 | **Eva Does NOT Read Paragraph** | 1. Listen to Eva | **Eva does NOT speak/read the paragraph text itself** | ☐ PASS ☐ FAIL | |
| C-PH2-07 | Voice Analysis Active | 1. Read paragraph aloud | Voice analysis indicators show active collection | ☐ PASS ☐ FAIL | |
| C-PH2-08 | Reading Completion | 1. Finish reading | Eva provides brief feedback on voice quality | ☐ PASS ☐ FAIL | |

### 9.4 Phase 3: Call Scenario

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH3-01 | Phase Transition | 1. Complete reading task | Eva announces call scenario | ☐ PASS ☐ FAIL | |
| C-PH3-02 | Customer Persona | 1. Listen to Eva | Eva transforms into customer persona | ☐ PASS ☐ FAIL | |
| C-PH3-03 | Scenario Matches Assignment | 1. Conduct call simulation | Scenario matches assigned difficulty (Beginner/Moderate/Experienced) | ☐ PASS ☐ FAIL | |
| C-PH3-04 | Interactive Conversation | 1. Respond to customer queries | Eva responds naturally based on candidate answers | ☐ PASS ☐ FAIL | |
| C-PH3-05 | Phase Progress | 1. During call scenario | Progress indicator shows Phase 3 active | ☐ PASS ☐ FAIL | |

### 9.5 Phase 4: Empathy Scenario

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH4-01 | Phase Transition | 1. Complete call scenario | Eva announces empathy challenge | ☐ PASS ☐ FAIL | |
| C-PH4-02 | Angry Customer Persona | 1. Listen to Eva | Eva presents upset customer scenario | ☐ PASS ☐ FAIL | |
| C-PH4-03 | De-escalation Test | 1. Attempt to calm customer | Eva responds based on empathy shown | ☐ PASS ☐ FAIL | |

### 9.6 Phase 5: Typing Test

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH5-01 | Phase Transition | 1. Complete empathy scenario | Typing test screen appears | ☐ PASS ☐ FAIL | |
| C-PH5-02 | Prompt Display | 1. View typing screen | Summary prompt with hints displayed | ☐ PASS ☐ FAIL | |
| C-PH5-03 | Timer Display | 1. Before starting | Timer shows 5:00 countdown | ☐ PASS ☐ FAIL | |
| C-PH5-04 | Word Count Tracking | 1. Type in text area | Word count updates in real-time | ☐ PASS ☐ FAIL | |
| C-PH5-05 | Minimum Words Check | 1. Try to submit with < 50 words | Warning/error shown | ☐ PASS ☐ FAIL | |
| C-PH5-06 | Submit Summary | 1. Type 50+ words <br> 2. Click Submit | Summary submitted successfully | ☐ PASS ☐ FAIL | |

### 9.7 Phase 6: Closure Task

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-PH6-01 | Phase Transition | 1. Submit typing test | Eva requests closure statement | ☐ PASS ☐ FAIL | |
| C-PH6-02 | Closure Delivery | 1. Deliver professional closure | Eva acknowledges and evaluates | ☐ PASS ☐ FAIL | |
| C-PH6-03 | Evaluation Complete | 1. Finish closure | Eva thanks and ends session | ☐ PASS ☐ FAIL | |

### 9.8 Completion

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-COMP-01 | Completion Screen | 1. Evaluation ends | Completion message displayed | ☐ PASS ☐ FAIL | |
| C-COMP-02 | Candidate Status Update | 1. Check evaluator dashboard | Candidate status shows "completed" | ☐ PASS ☐ FAIL | |

---

## Section 10: Candidate Portal - Resume & Edge Cases

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| C-EDGE-01 | Resume Incomplete Evaluation | 1. Start evaluation <br> 2. Close browser mid-evaluation <br> 3. Login again with same code <br> 4. Click "Begin Evaluation" | Evaluation resumes from last phase | ☐ PASS ☐ FAIL | |
| C-EDGE-02 | Microphone Disconnect | 1. During evaluation, disconnect mic | Appropriate error/reconnection prompt | ☐ PASS ☐ FAIL | |
| C-EDGE-03 | End Evaluation Button | 1. During evaluation <br> 2. Click "End Evaluation" | Session ends gracefully, data saved | ☐ PASS ☐ FAIL | |
| C-EDGE-04 | Network Interruption | 1. During evaluation <br> 2. Simulate network drop | Reconnection attempted or error shown | ☐ PASS ☐ FAIL | |

---

## Section 11: Cross-Feature Validation

| ID | Test Case | Steps | Expected Result | Result | Notes |
|----|-----------|-------|-----------------|--------|-------|
| X-VAL-01 | End-to-End Flow | 1. Create batch <br> 2. Add candidate <br> 3. Complete evaluation <br> 4. View results | All data flows correctly through system | ☐ PASS ☐ FAIL | |
| X-VAL-02 | Score Consistency | 1. Complete evaluation <br> 2. Compare live scores with results | Scores match between live view and results | ☐ PASS ☐ FAIL | |
| X-VAL-03 | Use Case Data Integrity | 1. Assign specific use case <br> 2. Complete evaluation <br> 3. Check results | Use case, passage, scenario correctly recorded | ☐ PASS ☐ FAIL | |
| X-VAL-04 | Multiple Concurrent Evaluations | 1. Start evaluations for 2+ candidates simultaneously | Each evaluation independent, no data mixing | ☐ PASS ☐ FAIL | |

---

## Test Summary

| Section | Total Tests | Passed | Failed | Not Tested |
|---------|-------------|--------|--------|------------|
| 1. Evaluator Auth | 4 | | | |
| 2. Batch Management | 4 | | | |
| 3. Candidate Management | 10 | | | |
| 4. Live Evaluation | 5 | | | |
| 5. Results | 8 | | | |
| 6. Feedback & Calibration | 4 | | | |
| 7. Scenarios Configuration | 15 | | | |
| 8. Candidate Auth | 4 | | | |
| 9. Evaluation Flow | 28 | | | |
| 10. Edge Cases | 4 | | | |
| 11. Cross-Feature | 4 | | | |
| **TOTAL** | **90** | | | |

---

## Critical Issues Found

| Issue # | Test ID | Description | Severity | Status |
|---------|---------|-------------|----------|--------|
| 1 | | | ☐ Critical ☐ High ☐ Medium ☐ Low | ☐ Open ☐ Fixed |
| 2 | | | ☐ Critical ☐ High ☐ Medium ☐ Low | ☐ Open ☐ Fixed |
| 3 | | | ☐ Critical ☐ High ☐ Medium ☐ Low | ☐ Open ☐ Fixed |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| QA Lead | | | |
| Product Owner | | | |

---

*Note: Continuous Learning portal tests will be added in a future version.*
