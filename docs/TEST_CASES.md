# CCEval v2.1.0 - Test Cases Document

## About This Document

This document contains all test cases for testing the CCEval (Call Center Evaluation) platform version 2.1.0. CCEval is an AI-powered voice evaluation system for call center candidates that assesses their communication skills, product knowledge, and customer handling abilities.

### What You Will Test

The platform has two main user interfaces:

1. **Evaluator Portal** - Used by HR/recruitment teams to:
   - Create batches and add candidates
   - Monitor live evaluations
   - View results and provide feedback
   - Configure evaluation scenarios

2. **Candidate Portal** - Used by job candidates to:
   - Login with an access code
   - Complete a 6-phase voice evaluation with an AI interviewer named "Eva"
   - Take a typing test

---

## Before You Begin

### Test Environment Information

| Setting | Value |
|---------|-------|
| **Application URL** | https://cceval.pragyaa.ai/v2 |
| **Your Browser** | _________________________ |
| **Browser Version** | _________________________ |
| **Operating System** | _________________________ |
| **Tester Name** | _________________________ |
| **Test Date** | _________________________ |

### Prerequisites

Before starting testing, ensure you have:

- [ ] A computer with a working microphone and speakers
- [ ] Google Chrome browser (recommended) or Firefox
- [ ] A valid Google account for Evaluator portal login
- [ ] Stable internet connection
- [ ] Access to the test environment URL
- [ ] Permission granted to use microphone in browser

### How to Use This Document

1. **Read each test case carefully** before executing
2. **Follow the steps exactly** as written
3. **Compare actual results** with expected results
4. **Mark the result** as PASS or FAIL
5. **Add notes** for any unexpected behavior or failures
6. **Take screenshots** of any errors encountered

### Result Marking Guide

- **PASS** - The feature works exactly as described in "Expected Result"
- **FAIL** - The feature does not work as expected, produces errors, or behaves differently

---

# PART 1: EVALUATOR PORTAL TESTS

The Evaluator Portal is where HR teams manage candidates and view evaluation results.

---

## TEST 1.1: Accessing the Evaluator Portal

**Purpose:** Verify that evaluators can access and login to the portal.

### Test 1.1.1: Navigate to Evaluator Login

**Steps:**
1. Open your web browser
2. Go to: `https://cceval.pragyaa.ai/v2`
3. You should see the main landing page with three cards: "Evaluator", "Candidate", and "Continuous Learner"
4. Click on the **"Evaluator"** card

**Expected Result:**
- A login page appears with a "Sign in with Google" button
- The page should have CCEval branding

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.1.2: Login with Google Account

**Steps:**
1. On the Evaluator login page, click **"Sign in with Google"**
2. Select your Google account (or enter credentials if prompted)
3. Allow any permissions requested
4. Wait for the page to redirect

**Expected Result:**
- After successful login, you are redirected to the Evaluator Dashboard
- You should see tabs like "Batches", "Candidates", "Evaluation", "Results", "Scenarios"

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.1.3: Verify Session Persistence

**Purpose:** Ensure you stay logged in when refreshing or reopening the page.

**Steps:**
1. After logging in successfully, close the browser tab
2. Open a new tab
3. Go to: `https://cceval.pragyaa.ai/v2`
4. Click on "Evaluator" card again

**Expected Result:**
- You should still be logged in (not asked to login again)
- Dashboard should appear directly

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.1.4: Logout Function

**Steps:**
1. While logged in, look for a logout button (usually in the header or profile area)
2. Click the logout button
3. Confirm logout if prompted

**Expected Result:**
- You are logged out
- You are redirected to the login page or main landing page

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 1.2: Managing Batches

**Purpose:** Batches are groups of candidates. Each evaluation session is organized into batches.

### Test 1.2.1: View Batches List

**Steps:**
1. Login to Evaluator Portal
2. Click on the **"Batches"** tab in the navigation

**Expected Result:**
- You see a list of existing batches (or an empty state message if no batches exist)
- Each batch shows: Name, creation date, number of candidates

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.2.2: Create a New Batch

**Steps:**
1. On the Batches tab, click **"Create Batch"** or **"+ New Batch"** button
2. Enter a batch name, for example: `Test Batch - January 2026`
3. Click **"Create"** or **"Save"**

**Expected Result:**
- A success message appears
- The new batch appears in the batches list
- The batch shows 0 candidates initially

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.2.3: Select a Batch to Work With

**Steps:**
1. From the batches list, click on a batch name or the "Select" button

**Expected Result:**
- The batch details panel opens
- You can see tabs for this batch: Candidates, Evaluation, Results

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 1.3: Managing Candidates

**Purpose:** Candidates are the people who will take the evaluation. Each candidate gets a unique access code.

### Test 1.3.1: View Candidates Tab

**Steps:**
1. Select a batch (from Test 1.2.3)
2. Click on the **"Candidates"** tab

**Expected Result:**
- You see a table with columns: Name, Email, Phone, Access Code, Use Case, Reading Passage, Scenario, Status
- If no candidates exist, you see an "Add Candidate" option

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.3.2: Add a New Candidate (PV Sales Use Case)

**Purpose:** Test adding a candidate for "PV Sales" (Passenger Vehicle Sales) evaluation.

**Steps:**
1. Click **"Add Candidate"** button
2. Fill in the form:
   - **Name:** `John Test PV`
   - **Email:** `john.pv@test.com`
   - **Phone:** `9876543210`
   - **Use Case:** Select **"PV Sales"** from dropdown
3. Observe that the Reading Passage dropdown updates
4. **Reading Passage:** Select **"Safety & ADAS Features"**
5. **Scenario:** Select **"Beginner"** (Bolero Neo inquiry)
6. Click **"Add"** or **"Save"**

**Expected Result:**
- Success message appears
- Candidate appears in the table
- A **4-digit access code** is automatically generated (e.g., "4821")
- Status shows "pending"

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

**Access Code Generated:** ____________ (Note this for candidate testing)

---

### Test 1.3.3: Add a New Candidate (EV Sales Use Case)

**Purpose:** Test that changing use case updates available passages.

**Steps:**
1. Click **"Add Candidate"** button
2. Fill in:
   - **Name:** `Jane Test EV`
   - **Email:** `jane.ev@test.com`
   - **Phone:** `9876543211`
   - **Use Case:** Select **"EV Sales"** from dropdown
3. Check the Reading Passage dropdown options

**Expected Result:**
- Reading Passage dropdown now shows EV-specific options:
  - "EV Fast Charging"
  - "EV Battery Technology"
- PV Sales passages should NOT appear

4. Select **"EV Fast Charging"** as the passage
5. Select **"Experienced"** as the scenario (XUV400 EV concerns)
6. Click **"Add"**

**Expected Result:**
- Candidate added successfully with EV Sales configuration

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

**Access Code Generated:** ____________

---

### Test 1.3.4: Add a New Candidate (Service Use Case)

**Steps:**
1. Add another candidate with:
   - **Name:** `Bob Test Service`
   - **Email:** `bob.service@test.com`
   - **Use Case:** **"Service"**
   - **Reading Passage:** **"Connected Car Technology"**
   - **Scenario:** **"Moderate"**

**Expected Result:**
- Candidate added with Service use case
- Unique 4-digit access code generated

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

**Access Code Generated:** ____________

---

### Test 1.3.5: Edit an Existing Candidate

**Steps:**
1. In the candidates table, find a candidate you added
2. Click the **Edit** icon (pencil icon) on that row
3. Change the candidate's name to add "- Edited" at the end
4. Click **Save**

**Expected Result:**
- Changes are saved
- Updated name appears in the table
- Access code remains unchanged

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.3.6: Delete a Candidate

**Steps:**
1. Add a test candidate (name: "Delete Test")
2. Click the **Delete** icon (trash icon) on that row
3. Confirm deletion when prompted

**Expected Result:**
- Candidate is removed from the table
- Confirmation message appears

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 1.4: Viewing Evaluation Results

**Purpose:** After candidates complete evaluations, results appear here.

### Test 1.4.1: View Results Tab

**Prerequisites:** At least one candidate has completed an evaluation.

**Steps:**
1. Select a batch that has completed evaluations
2. Click on the **"Results"** tab

**Expected Result:**
- Table displays with columns matching Candidate Management:
  - Name
  - Use Case
  - Reading Passage
  - Scenario
  - Status
  - Overall Score
- Completed candidates show scores

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.4.2: View Individual Evaluation Details

**Steps:**
1. In the Results tab, click on a completed candidate's row
2. A detailed view/modal should open

**Expected Result:**
The detail view shows:
- **Candidate Information:** Name, assigned use case, passage, scenario
- **Overall Score:** Numerical score out of 5
- **Individual Scores:** 8 parameters (clarity_pace, product_knowledge, empathy, customer_understanding, handling_pressure, confidence, process_accuracy, closure_quality)
- **Voice Analysis:** Clarity, Volume, Pace, Tone scores
- **Transcript:** Full conversation Q&A
- **Typing Test Results:** WPM, Accuracy (if applicable)

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.4.3: Results Column Consistency Check

**Purpose:** Verify that Results tab columns match Candidate Management columns.

**Steps:**
1. Open Candidates tab, note the columns displayed
2. Open Results tab, compare columns

**Expected Result:**
- Both tabs show: Use Case, Reading Passage, Scenario columns
- Data matches what was assigned to the candidate

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 1.5: Feedback and Calibration

**Purpose:** Evaluators can provide feedback on AI scores to improve future evaluations.

### Test 1.5.1: Provide Score Feedback

**Steps:**
1. Open a completed evaluation's detail view
2. Find a score parameter (e.g., "empathy")
3. Click the feedback button/icon next to the score
4. Select whether the AI scored "Too High", "Too Low", or "Accurate"
5. Add a comment explaining your feedback
6. Save the feedback

**Expected Result:**
- Feedback is saved
- Visual indicator shows feedback was provided

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.5.2: Recalibrate an Evaluation

**Prerequisites:** Feedback has been provided on at least one score.

**Steps:**
1. In the evaluation detail view, find the **"Recalibrate"** button
2. Click Recalibrate
3. Confirm when prompted

**Expected Result:**
- System recalculates scores based on feedback
- Updated scores appear
- Calibration history is recorded

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.5.3: Add Manager Decision

**Steps:**
1. In evaluation details, find the "Manager Decision" or "HR Decision" section
2. Select a decision: **"Hire"**, **"Don't Hire"**, or **"Needs Improvement"**
3. Add comments explaining the decision
4. Save

**Expected Result:**
- Decision is saved and displayed
- Decision appears in the results summary

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 1.6: Scenarios Configuration

**Purpose:** The Scenarios tab allows customization of evaluation content.

### Test 1.6.1: Access Scenarios Tab

**Steps:**
1. From the Evaluator Dashboard, click the **"Scenarios"** tab
2. You should see sub-tabs: Use Cases, Reading Passages, Call Scenarios, Scoring Metrics, Voice Quality

**Expected Result:**
- Scenarios configuration interface loads
- Sub-tabs are visible and clickable

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.6.2: View Use Cases

**Steps:**
1. Click on **"Use Cases"** sub-tab

**Expected Result:**
- Three use cases displayed:
  - **PV Sales** (Passenger Vehicle Sales)
  - **EV Sales** (Electric Vehicle Sales)
  - **Service** (Service Support)
- Each shows a description

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.6.3: View Reading Passages

**Steps:**
1. Click on **"Reading Passages"** sub-tab
2. Select a use case filter (e.g., "PV Sales")

**Expected Result:**
- Passages filtered by use case
- Each passage shows: Title, Use Case, Word Count, Full Text
- PV Sales passages: "Safety & ADAS Features", "SUV Performance & Capability"

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.6.4: View Call Scenarios

**Steps:**
1. Click on **"Call Scenarios"** sub-tab

**Expected Result:**
- Scenarios organized by difficulty level:
  - **Beginner:** Bolero Neo price inquiry
  - **Moderate:** XUV700 vs Alcazar comparison
  - **Experienced:** XUV400 EV concerns (frustrated customer)
- Each shows: Level, Vehicle, Customer Persona, Opening Script

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.6.5: View Scoring Metrics

**Steps:**
1. Click on **"Scoring Metrics"** sub-tab

**Expected Result:**
- 8 scoring parameters displayed:
  1. clarity_pace
  2. product_knowledge
  3. empathy
  4. customer_understanding
  5. handling_pressure
  6. confidence
  7. process_accuracy
  8. closure_quality
- Each shows description and 1-5 scoring criteria

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 1.6.6: View Voice Quality Metrics

**Steps:**
1. Click on **"Voice Quality"** sub-tab

**Expected Result:**
- Voice analysis parameters displayed:
  - **Clarity:** How clear and articulate the speech is
  - **Volume:** Appropriate loudness level
  - **Pace:** Speaking speed (words per minute)
  - **Tone:** Emotional quality of voice
- Each shows measurement method and thresholds

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

# PART 2: CANDIDATE PORTAL TESTS

The Candidate Portal is where job candidates complete their AI-powered evaluation.

**Important:** You will need a valid access code from the Evaluator Portal to complete these tests.

---

## TEST 2.1: Candidate Login

### Test 2.1.1: Access Candidate Portal

**Steps:**
1. Open browser and go to: `https://cceval.pragyaa.ai/v2`
2. Click on the **"Candidate"** card

**Expected Result:**
- Access code entry screen appears
- Input field for 4-digit code
- "Submit" or "Enter" button visible

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.1.2: Login with Valid Access Code

**Steps:**
1. Enter a valid 4-digit access code (from Test 1.3.2, 1.3.3, or 1.3.4)
2. Click Submit

**Expected Result:**
- Login successful
- Welcome screen appears with candidate's name displayed
- Shows assigned evaluation details (Use Case, Reading Passage, Scenario)

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.1.3: Login with Invalid Access Code

**Steps:**
1. Enter an invalid code: `0000`
2. Click Submit

**Expected Result:**
- Error message appears: "Invalid access code" or similar
- User remains on login screen
- Can try again

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.2: Evaluation - Welcome & Start

### Test 2.2.1: View Welcome Screen

**Prerequisites:** Successfully logged in with valid access code.

**Steps:**
1. After login, observe the welcome screen

**Expected Result:**
- Welcome message with candidate's name
- Brief overview of evaluation phases
- Shows assigned:
  - Reading Passage title
  - Scenario level
- "Begin Evaluation" button visible

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.2.2: Start Evaluation & Grant Microphone Permission

**Steps:**
1. Click **"Begin Evaluation"** button
2. Browser will ask for microphone permission
3. Click **"Allow"** to grant microphone access

**Expected Result:**
- Microphone permission granted
- Evaluation interface loads
- Connection to AI voice agent (Eva) is established
- You hear Eva's greeting

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.3: Evaluation Phase 1 - Personal Questions

**Purpose:** Eva asks introductory questions to assess communication skills.

### Test 2.3.1: Eva's Introduction

**Steps:**
1. Listen to Eva after starting evaluation

**Expected Result:**
- Eva introduces herself: "Namaste! I am Eva, your AI evaluation agent for Mahindra Call Center..."
- Eva asks for your name
- Professional, friendly tone

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.3.2: Answer Personal Questions

**Steps:**
1. When Eva asks for your name, respond naturally
2. Answer follow-up questions about:
   - Why you want to work in automotive customer experience
   - A challenging customer situation you handled
   - What you know about Mahindra's vehicle lineup
   - Your comfort with lead generation targets

**Expected Result:**
- Eva acknowledges each response
- Conversation flows naturally
- Questions appear in the transcript panel on the left

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.3.3: Verify Transcript Display

**Steps:**
1. During the conversation, observe the left panel

**Expected Result:**
- Transcript shows Q&A exchange
- Your responses appear in green bubbles
- Eva's questions appear in gray bubbles
- Updates in real-time

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.4: Evaluation Phase 2 - Reading Task

**Purpose:** Candidate reads a passage aloud for voice analysis. The passage is displayed on screen.

### Test 2.4.1: Phase Transition to Reading Task

**Steps:**
1. After completing personal questions, Eva will announce the reading task

**Expected Result:**
- Eva says something like: "Now let's move to the reading assessment"
- Phase progress indicator updates to show "Reading Task" as current

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.4.2: Reading Passage Panel Appears (KEY TEST)

**This is a critical test for the new visual reading feature.**

**Steps:**
1. When reading task begins, observe the RIGHT side of the screen

**Expected Result:**
- A **Reading Task Panel** appears on the right side
- Panel contains:
  - Header with "Reading Task" title and book icon
  - **Passage title** (e.g., "Safety & ADAS Features")
  - **Yellow instruction banner** saying "Please read the following paragraph aloud when prompted by Eva"
  - **The full paragraph text** in a dark box
  - **Word count** at the bottom (e.g., "63 words")
  - Tip: "Read clearly & naturally"

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.4.3: Eva Directs to On-Screen Passage (KEY TEST)

**Steps:**
1. Listen to what Eva says about the reading task

**Expected Result:**
- Eva says: **"Please look at the right side of your screen where the reading passage is displayed"**
- Eva does **NOT** read the paragraph text aloud herself
- Eva does **NOT** include any "bot script" or instructions in the passage

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.4.4: Read the Passage Aloud

**Steps:**
1. Read the passage displayed on screen clearly and naturally
2. Maintain a steady pace
3. When finished, wait silently

**Expected Result:**
- Eva listens silently while you read
- After you finish, Eva provides brief feedback on your voice quality
- Comments like "Your voice clarity and pace are excellent" or suggestions for improvement

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.5: Evaluation Phase 3 - Call Scenario

**Purpose:** Eva role-plays as a customer, and you respond as a call center agent.

### Test 2.5.1: Phase Transition to Call Scenario

**Steps:**
1. After reading task feedback, listen for Eva's announcement

**Expected Result:**
- Eva says: "Now let's move forward to the call scenario simulation"
- Eva transforms into a customer persona
- Reading panel disappears from screen (no longer in reading phase)

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.5.2: Handle Customer Inquiry

**Steps:**
1. Eva (as customer) presents a scenario matching your assigned level:
   - **Beginner:** Price inquiry about Bolero Neo
   - **Moderate:** Comparing XUV700 with competition
   - **Experienced:** EV concerns (frustrated customer)
2. Respond professionally as a call center agent
3. Answer follow-up questions

**Expected Result:**
- Eva responds naturally based on your answers
- Conversation simulates a real customer call
- Multiple exchanges before moving to next phase

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.6: Evaluation Phase 4 - Empathy Scenario

**Purpose:** Tests ability to handle an upset customer with empathy.

### Test 2.6.1: Angry Customer Scenario

**Steps:**
1. Eva announces the empathy challenge
2. Eva presents an angry customer scenario: "My service bill is too high! No one explained anything..."
3. Try to calm the customer using empathy and solutions

**Expected Result:**
- Eva expresses frustration convincingly
- If you show empathy ("I understand your frustration..."), Eva gradually calms down
- If you struggle, Eva maintains frustration to test your limits

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.7: Evaluation Phase 5 - Typing Test

**Purpose:** Tests written communication through a call summary.

### Test 2.7.1: Typing Test Screen Appears

**Steps:**
1. After empathy scenario, the typing test screen should appear

**Expected Result:**
- Full-screen typing interface appears
- Shows a prompt asking you to summarize the call
- Timer displays (5:00 countdown)
- Text input area is visible
- Word count shows "0 words"

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.7.2: Type Call Summary

**Steps:**
1. Click in the text area to start
2. Type a summary of the customer interaction (minimum 50 words)
3. Include: customer's concern, what you discussed, next steps

**Expected Result:**
- Word count updates as you type
- Timer counts down
- Text is saved as you type

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.7.3: Submit Typing Test

**Steps:**
1. After typing 50+ words, click **"Submit Summary"**

**Expected Result:**
- Summary is submitted
- Confirmation appears
- Evaluation continues to closure phase

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.8: Evaluation Phase 6 - Closure Task

### Test 2.8.1: Deliver Professional Closure

**Steps:**
1. Eva asks you to deliver a professional call closure
2. Summarize the call, confirm next steps, thank the customer

**Expected Result:**
- Eva listens to your closure
- Eva provides acknowledgment
- Eva thanks you and ends the evaluation

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.8.2: Evaluation Completion

**Steps:**
1. After closure, wait for Eva's final message

**Expected Result:**
- Eva says: "Thank you, [Name]. That completes your evaluation..."
- Completion screen appears
- Message indicates evaluation is complete

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 2.9: Edge Cases & Error Handling

### Test 2.9.1: Resume Incomplete Evaluation

**Purpose:** Test that candidates can resume if disconnected.

**Steps:**
1. Start a new evaluation with a fresh candidate
2. Complete Phase 1 (personal questions)
3. **Close the browser tab** during Phase 2 (reading task)
4. Open a new tab and go to: `https://cceval.pragyaa.ai/v2`
5. Click "Candidate" and enter the same access code
6. Click "Begin Evaluation"

**Expected Result:**
- Evaluation resumes (not starts from scratch)
- Console may show "Resuming existing evaluation"
- Phase progress should be preserved

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

### Test 2.9.2: End Evaluation Early

**Steps:**
1. During an evaluation, click the **"End Evaluation"** button (red button)
2. Confirm when prompted

**Expected Result:**
- Evaluation ends gracefully
- Data collected so far is saved
- Candidate status updates to reflect partial completion

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

# PART 3: CROSS-FEATURE VALIDATION

These tests verify that data flows correctly between Evaluator and Candidate portals.

---

## TEST 3.1: End-to-End Flow Verification

**Steps:**
1. As Evaluator: Create a new batch
2. As Evaluator: Add a candidate with specific use case/passage/scenario
3. Note the access code
4. As Candidate: Login and complete full evaluation
5. As Evaluator: Check Results tab

**Expected Result:**
- Completed evaluation appears in Results
- Use Case, Reading Passage, Scenario match what was assigned
- All scores and transcript are recorded

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

## TEST 3.2: Live Monitoring (If Testing with Two Devices)

**Steps:**
1. Device 1 (Evaluator): Open Evaluation tab for the batch
2. Device 2 (Candidate): Start evaluation
3. Monitor Device 1 while evaluation proceeds

**Expected Result:**
- Real-time transcript updates on Evaluator screen
- Scores populate as AI evaluates
- Phase progress is visible

**Actual Result:** _________________________________________________

| Result | Notes |
|--------|-------|
| [ ] PASS  [ ] FAIL | |

---

# TEST SUMMARY

## Completion Status

| Section | Total Tests | Passed | Failed | Not Tested |
|---------|-------------|--------|--------|------------|
| 1.1 Evaluator Auth | 4 | | | |
| 1.2 Batch Management | 3 | | | |
| 1.3 Candidate Management | 6 | | | |
| 1.4 Results | 3 | | | |
| 1.5 Feedback & Calibration | 3 | | | |
| 1.6 Scenarios Config | 6 | | | |
| 2.1 Candidate Login | 3 | | | |
| 2.2 Welcome & Start | 2 | | | |
| 2.3 Personal Questions | 3 | | | |
| 2.4 Reading Task | 4 | | | |
| 2.5 Call Scenario | 2 | | | |
| 2.6 Empathy Scenario | 1 | | | |
| 2.7 Typing Test | 3 | | | |
| 2.8 Closure & Completion | 2 | | | |
| 2.9 Edge Cases | 2 | | | |
| 3.1-3.2 Cross-Feature | 2 | | | |
| **TOTAL** | **49** | | | |

---

## Critical Issues Found

| # | Test ID | Issue Description | Severity | Screenshot? |
|---|---------|-------------------|----------|-------------|
| 1 | | | High / Medium / Low | Yes / No |
| 2 | | | High / Medium / Low | Yes / No |
| 3 | | | High / Medium / Low | Yes / No |
| 4 | | | High / Medium / Low | Yes / No |
| 5 | | | High / Medium / Low | Yes / No |

---

## General Observations

_Write any general feedback about the application here:_

______________________________________________________________________________

______________________________________________________________________________

______________________________________________________________________________

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*Document Version: 1.0*  
*Application Version: CCEval v2.1.0*  
*Last Updated: January 2026*
