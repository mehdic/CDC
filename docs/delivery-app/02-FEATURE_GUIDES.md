# Delivery App - Feature Guides

This document provides detailed guides for each major feature in the MetaPharm Delivery App.

## Table of Contents

1. [Delivery List & Filtering](#delivery-list--filtering)
2. [GPS Navigation & Tracking](#gps-navigation--tracking)
3. [QR Code Scanning](#qr-code-scanning)
4. [Proof of Delivery Capture](#proof-of-delivery-capture)
5. [Special Handling Alerts](#special-handling-alerts)
6. [Earnings Dashboard](#earnings-dashboard)
7. [Offline Mode Operation](#offline-mode-operation)

---

## Delivery List & Filtering

The Delivery List is your main hub for finding and managing deliveries.

### Accessing the Delivery List

1. **After Login**
   - You arrive automatically at the Delivery List screen
   - The list shows all available deliveries by default

2. **From Other Screens**
   - Tap the "Deliveries" tab in the bottom navigation
   - Or navigate back from any delivery detail screen

### Understanding the Delivery Card

Each delivery card displays:

| Element | What It Shows |
|---------|---------------|
| **Patient Name** | Name of the person receiving the delivery |
| **Address** | Street, city, and postal code |
| **Status Badge** | Current state (Pending, Assigned, Accepted, In Transit, Delivered) |
| **Distance** | How far the delivery address is from you (in km) |
| **Est. Time** | Estimated minutes to complete the delivery |
| **Priority Badge** | URGENT (red), HIGH (orange), MEDIUM (yellow), LOW (gray) |
| **Special Instructions** | Any special notes from the pharmacy |

### Filtering Deliveries

#### Available vs. My Deliveries

**Available Deliveries Tab (Default)**
- Shows all unclaimed deliveries in your service area
- Sorted by proximity and priority
- Tap any card to accept the delivery

**My Deliveries Tab**
- Shows only deliveries you've accepted
- Lists all active and pending deliveries
- Tap to view details, navigate, or complete

To switch tabs: Tap either "Available" or "My Deliveries" button at the top of the screen.

#### Searching

1. **Use the Search Box**
   - Located below the filter tabs
   - Type patient name (e.g., "John Smith")
   - Type city name (e.g., "Geneva")
   - Results update as you type

2. **Clear Search**
   - Tap the X button in the search box
   - All deliveries reappear

#### Refreshing the List

1. **Pull to Refresh**
   - Swipe down on the delivery list
   - The loading spinner appears while updating
   - Release to refresh

2. **Automatic Refresh**
   - The app refreshes automatically every 60 seconds
   - Ensures you always see the latest available deliveries

### Delivery Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **Pending** | Yellow | Not yet assigned to anyone |
| **Assigned** | Blue-Gray | Assigned but not yet accepted |
| **Accepted** | Blue | You've accepted this delivery |
| **In Transit** | Purple | You're on your way to deliver |
| **Arrived** | Orange | You're at the delivery location |
| **Delivered** | Green | Delivery completed |
| **Failed** | Red | Delivery could not be completed |
| **Returned** | Gray | Delivery was returned to pharmacy |

### Delivery Priority

Plan your route based on priority:

- **URGENT** (Red): Time-critical medications. Deliver immediately.
- **HIGH** (Orange): Important but not immediate. Deliver within 2 hours if possible.
- **MEDIUM** (Yellow): Standard deliveries. Deliver within 4 hours.
- **LOW** (Gray): Non-urgent supplies. Deliver within 8 hours.

---

## GPS Navigation & Tracking

The GPS Navigation feature helps you get to each delivery address efficiently.

### Starting Navigation

1. **From Delivery List**
   - Open the delivery you want to deliver
   - Tap **"Navigate to Delivery"** button

2. **From Delivery Detail Screen**
   - Scroll down to the navigation section
   - Tap **"Start Navigation"**

### Navigation Screen Layout

The Navigation screen is divided into two parts:

**Upper Section: Map View**
- Shows your current location (blue marker)
- Shows the next delivery location (red marker)
- Shows remaining deliveries (orange markers)
- Route is highlighted in color:
  - **Blue line**: Direct path to next delivery
  - **Green dashed line**: Remaining route after next delivery

**Lower Section: Navigation Info Panel**
- **Next Stop**: Shows which stop number and delivery ID
- **Distance**: Distance to the next delivery location
- **Estimated Time**: Time to reach the next delivery
- **Estimated Arrival**: What time you should arrive

### Navigation Metrics

The app displays important navigation information:

| Metric | What It Means |
|--------|---------------|
| **Distance** | Kilometers to the next delivery address |
| **Est. Time** | Minutes to reach the next delivery (includes 5 min stop time) |
| **Route Progress** | Percentage of deliveries completed |
| **Progress Bar** | Visual representation of route completion |

### Handling Special Constraints

During navigation, special handling alerts appear:

- **Cold Chain Required**: Keep packages in insulated bag
- **Controlled Substance**: Will require ID verification at delivery
- **ID Verification Required**: Be prepared to verify patient ID
- **Time Sensitive**: Deliver within the specified time window

### Recalculating Your Route

If you take a wrong turn or situation changes:

1. Tap **"Recalculate Route"** button
2. The app re-routes from your current position
3. New estimated time is calculated
4. Navigation updates automatically

### Marking Arrival

When you reach the delivery address:

1. **App Detection**
   - The app automatically detects you've arrived (within ~100 meters)
   - A notification appears

2. **Manual Confirmation**
   - Tap **"I've Arrived"** button at the bottom of the screen
   - Confirm the address in the popup

3. **Next Step**
   - After arriving, you'll proceed to QR scanning or proof of delivery

### GPS Accuracy & Troubleshooting

**If GPS is Inaccurate:**
- Ensure Location Services is enabled in device settings
- Move to an open area (GPS works poorly indoors)
- Restart the app
- Restart your device if issues persist

**If Distance Seems Wrong:**
- The app calculates driving distance, not straight-line distance
- Real roads may be longer than direct path
- Traffic and road conditions affect actual time

---

## QR Code Scanning

QR code scanning verifies you have the correct packages before delivery.

### When to Scan

QR scanning is optional but recommended:
- When picking up packages at the pharmacy
- To verify package contents and destination
- For additional tracking and compliance

### Starting the QR Scanner

1. **From Delivery Detail Screen**
   - Tap **"Scan Packages"** button
   - Or after arriving at the delivery address

2. **Scanner Screen Opens**
   - Camera view shows the QR code scanner interface
   - Crosshair indicator shows where to position the code

### How to Scan

1. **Position the QR Code**
   - Hold your device 6-12 inches from the QR code
   - Keep the code inside the crosshair area
   - Ensure good lighting for best results

2. **Automatic Scanning**
   - The app scans automatically (no button to press)
   - When code is detected, it beeps
   - Verification result appears

3. **Scan Multiple Packages**
   - Scan each package's QR code
   - The app maintains a scan history
   - You can scan the same code multiple times

### QR Scan Results

After scanning, the app shows:

**Success**
- Package details appear
- Contents and destination verified
- Scan is recorded in history

**Failure/Mismatch**
- Alert appears if code doesn't match delivery
- You can rescan or type the code manually
- Contact pharmacy if codes don't match

### Manual Code Entry

If you can't scan (damaged QR code, poor lighting):

1. Tap **"Type Code"** button at the top
2. Enter the code manually
3. The app will verify the code
4. Proceed to next package or delivery

### Viewing Scan History

1. **During Scanning**
   - Tap **"History (X)"** button (shows count of scans)
   - See all codes scanned for this delivery

2. **In Scan History Screen**
   - View date and time of each scan
   - See verification status (verified/failed)
   - Clear history if needed for a fresh start

### Permissions Required

The QR scanner requires:
- **Camera permission**: Enabled on device
- **Sufficient lighting**: Avoid direct sunlight or dark areas
- **Steady hand**: Keep device steady while scanning

### Troubleshooting QR Scans

| Problem | Solution |
|---------|----------|
| **Camera won't open** | Check camera permissions in device settings |
| **Code not detected** | Ensure code is within crosshair, improve lighting |
| **Wrong code detected** | Double-check package label, rescan carefully |
| **Code damaged/faded** | Use manual code entry option |

---

## Proof of Delivery Capture

Proof of delivery documents that you've successfully delivered packages.

### Starting Proof of Delivery

1. **After Arriving**
   - You're prompted to complete proof of delivery
   - Or tap **"Complete Delivery"** from delivery details

2. **Proof Screen Opens**
   - Shows all required and optional fields
   - Fields marked with * are required

### Required Fields

#### Recipient Name

**What to do:**
1. Enter the name of the person receiving the delivery
2. This should match ID verification if required
3. Must not be empty

**Example:** "Marie Dupont"

#### Delivery Photo

**What to do:**
1. Tap **"Take Photo"** button
2. Position package in the camera view
3. Take a clear photo showing:
   - Package clearly visible
   - Delivery address or patient info
   - Any special handling equipment (cooler bags, etc.)
4. Review the photo
5. Confirm to use the photo

**Note:** Photo must be clear and show the actual delivery.

#### GPS Location

**What to do:**
1. Ensure location services are enabled
2. The app automatically captures your GPS coordinates
3. Location is displayed on the proof form
4. Location accuracy: Typically within 10-50 meters

**Important:** You cannot submit proof of delivery without a valid GPS location.

### Optional Fields

#### Signature Capture

**When needed:** If signature is required by delivery instructions

**How to capture:**
1. Tap **"Capture Signature"**
2. Sign in the white area with your finger
3. Review your signature
4. Tap "Save" to accept or "Clear" to start over

**Tips for good signatures:**
- Use a steady hand
- Keep signature legible
- Sign similar to how you normally sign

#### ID Photo

**When needed:** If patient ID verification is required

**How to capture:**
1. Tap **"Capture ID Photo"**
2. Position ID document in camera view
3. Ensure all information is visible and legible
4. Take the photo
5. Review and confirm

**Privacy note:** Sensitive ID information is encrypted and protected.

#### Delivery Notes

**Purpose:** Add any special information about this delivery

**Examples:**
- "Package left in mailbox as requested"
- "Recipient requested afternoon appointment scheduling"
- "Weather delayed delivery by 15 minutes"

**Character limit:** 500 characters

### Verifying the Form

Before submitting:

1. **Check Required Fields**
   - Recipient name: Filled
   - Delivery photo: Taken
   - GPS location: Active

2. **Review Optional Fields**
   - Signature: If required
   - ID photo: If required
   - Notes: If adding details

3. **Confirm Information Accuracy**
   - Recipient name matches identification
   - Photo clearly shows the delivery
   - All details are correct

### Submitting Proof of Delivery

1. **Final Review**
   - Review all information one last time
   - Ensure nothing is missing

2. **Submit**
   - Tap **"Complete Delivery"** button
   - The app will show a loading spinner

3. **Confirmation**
   - Success message appears
   - Delivery is marked as completed
   - You're returned to the delivery list

4. **Offline Queuing**
   - If you're offline, proof is queued
   - It uploads automatically when online
   - You'll see "proof will be uploaded when online" message

### What Happens After Submission

- Pharmacy receives the proof of delivery
- Your payment is processed
- Delivery is removed from your active list
- Statistics and earnings are updated

---

## Special Handling Alerts

Special handling alerts indicate important requirements for specific deliveries.

### Types of Special Handling

#### Cold Chain Maintenance

**Alert**: Delivery requires temperature control

**Requirements:**
- Keep between 2-8°C (refrigerated)
- Monitor temperature logs if thermometer provided
- Minimize time outside refrigeration
- Report any temperature excursions immediately

**Your Responsibilities:**
- Use insulated delivery bags with ice packs
- Check temperature before accepting delivery
- Minimize delays during transport
- Alert pharmacy immediately if temperatures exceeded

**Why It Matters:**
- Some medications lose effectiveness if too warm
- Vaccines and biologics are especially temperature-sensitive

#### Controlled Substances

**Alert**: Package contains controlled medications

**Requirements:**
- Age verification (18+) at delivery
- Photo ID verification at delivery
- Signature required from recipient
- Special documentation may be needed
- Patient must be present to sign

**Your Responsibilities:**
- Check recipient's ID photo matches delivery name
- Only deliver to recipient (not family unless authorized)
- Obtain signature on delivery app
- Never leave unattended or with other residents

**Why It Matters:**
- Legal and regulatory compliance
- Prevents medication misuse
- Protects patient privacy and safety

#### Signature Required

**Alert**: Recipient must sign for this delivery

**Requirements:**
- Obtain recipient signature
- Have photo ID ready for verification
- Document recipient name clearly
- Take proof of delivery photo

**Your Responsibilities:**
- Ask recipient to sign on the app
- Verify signature legibility
- Take photo of delivery
- Keep professional during interaction

**Why It Matters:**
- Confirms delivery to correct person
- Creates legally binding proof
- Protects both patient and pharmacy

#### ID Verification Required

**Alert**: Patient identification must be verified

**Requirements:**
- Verify patient photo ID matches delivery name
- Record ID type and number
- Photograph ID for documentation
- Keep confidential per privacy regulations

**Your Responsibilities:**
- Check ID carefully matches delivery name
- Take photo of ID (front side) if required
- Note any discrepancies
- Protect ID information confidentiality
- Never share ID details with others

**Why It Matters:**
- Ensures medication reaches correct patient
- Complies with healthcare privacy laws
- Prevents medication errors

#### Time-Sensitive Delivery

**Alert**: Delivery has specific time requirements

**Requirements:**
- Deliver within scheduled time window
- Prioritize this delivery in your route
- Notify pharmacy of any delays
- Document actual delivery time

**Your Responsibilities:**
- Check delivery time window
- Plan route to deliver on time
- Alert pharmacy if you'll be late
- Note time delivered in app

**Why It Matters:**
- Some medications are time-critical
- Patient may be waiting for medication
- Ensures optimal therapeutic timing

### Acknowledgment Process

**Before Accepting Delivery:**

1. **Review All Alerts**
   - Each special handling alert displays on the delivery card
   - Tap for full details and requirements

2. **Acknowledge Each Alert**
   - Check the checkbox for each requirement type
   - You must acknowledge before proceeding
   - Acknowledgment is timestamped for compliance

3. **Ask Questions**
   - If you don't understand, ask pharmacy staff
   - Never proceed without full understanding
   - Don't be shy - safety is priority

### During Delivery

**Remember to:**
- Follow all acknowledged requirements
- Refer to app if you forget specifics
- Contact pharmacy for clarification
- Document everything properly

### Reporting Issues

If you can't meet a special requirement:

1. **Contact the Pharmacy**
   - Call or message using the app
   - Explain the situation
   - Ask for guidance

2. **Examples of Issues**
   - Recipient not available for signature
   - Cooler bag temperature exceeded limit
   - ID mismatch (name doesn't match)
   - Delivery address unreachable

3. **Resolution**
   - Pharmacy may reschedule
   - May provide alternative instructions
   - Some issues may require return to pharmacy

---

## Earnings Dashboard

Track your delivery statistics, earnings, and bonus opportunities.

### Accessing Earnings

1. **From Main Menu**
   - Tap the "Earnings" tab in bottom navigation

2. **Screen Layout**
   - Header with title and current period
   - Period filter buttons
   - Earnings summary card
   - Delivery statistics
   - Active bonuses
   - Export options

### Period Selection

Choose the time period to view:

| Period | Time Range | Best For |
|--------|-----------|----------|
| **Today** | Last 24 hours | Daily check-in |
| **Week** | Last 7 days | Weekly planning |
| **Month** | Last 30 days | Monthly review |
| **Year** | Last 365 days | Annual summary |

To change period: Tap the period button (Today, Week, Month, Year).

### Earnings Summary

**What You See:**

- **Gross Earnings**: Total money earned in this period
  - Includes all completed deliveries
  - Base payment plus bonuses

- **Platform Fees**: Amount deducted for platform services
  - Usually 15% of gross
  - Covers app, support, insurance, etc.

- **Net Earnings**: Money you actually receive
  - Gross minus platform fees
  - This is what gets paid to you

- **Comparison**: How this period compares to previous period
  - Shows trend (up/down/flat)
  - Helps you see if you're earning more

### Delivery Statistics

**Key Metrics:**

| Statistic | What It Shows |
|-----------|---------------|
| **Deliveries Count** | Total deliveries completed |
| **Total Distance** | Kilometers traveled for deliveries |
| **Avg. Time** | Average minutes per delivery |
| **On-Time Rate** | Percentage of on-time deliveries |

**Use This To:**
- Track your productivity
- Identify efficiency improvements
- Monitor on-time performance
- Plan your workload

### Bonus Opportunities

**Active Bonuses:**

Each bonus shows:
- **Title**: What the bonus is for
- **Progress**: How close you are to completing it
- **Reward**: Money you'll earn for completing
- **Expiration**: When the bonus expires

**Bonus Examples:**

- **Delivery Sprint**: "Complete 10 deliveries" → Earn $25
- **Distance Challenge**: "Cover 50 km in a week" → Earn $15
- **Perfect Rating**: "Maintain 95% on-time rate" → Earn $50

**How Bonuses Work:**

1. **Check Active Bonuses** regularly
2. **Work Toward Targets** by completing deliveries
3. **Monitor Progress** on the dashboard
4. **Earn Reward** automatically when target is reached
5. **New Bonuses** appear as previous ones are completed

### Export Earnings Report

**Generate Reports:**

**CSV Format (Comma-Separated Values)**
- Opens in Excel or Sheets
- Good for spreadsheet analysis
- Includes detailed transaction list

**PDF Format**
- Printable professional report
- Good for tax records
- Formatted and easy to read

**How to Export:**

1. Select desired period (Today, Week, Month, Year)
2. Tap **"CSV"** or **"PDF"** button
3. Choose action:
   - Share via email
   - Save to device
   - Print

**Use Cases:**
- Tax preparation: Keep monthly/yearly reports
- Income verification: For loans or rental applications
- Personal records: Track earnings over time
- Business analysis: Review performance trends

### Earnings Tips

**Maximize Your Earnings:**

1. **Accept High-Priority Deliveries**
   - Urgent deliveries may pay more
   - Complete them on time

2. **Complete Bonuses**
   - Monitor available bonuses
   - Plan deliveries to achieve bonus targets

3. **Maintain On-Time Rate**
   - On-time bonuses add up
   - Plan routes efficiently

4. **Check Regularly**
   - Earnings dashboard updates daily
   - Monitor progress toward bonuses

---

## Offline Mode Operation

The MetaPharm Delivery App works offline for essential functions.

### What Works Offline

**Delivery Operations:**
- View accepted deliveries (cached from last online session)
- View delivery details and addresses
- GPS navigation continues (uses device GPS)
- Proof of delivery capture (signature, photos, GPS)
- QR code scanning (limited)

**App Functions:**
- Viewing your profile
- Reading app help/FAQs
- Accessing previously loaded screens

### What Doesn't Work Offline

- Accepting new deliveries (requires server connection)
- Searching available deliveries
- Refreshing delivery list
- Checking real-time earnings
- Viewing bonus opportunities
- Uploading earnings reports

### Using Offline Mode

#### When You Go Offline

1. **Offline Indicator**
   - App shows "Offline" badge at top of screen
   - Yellow offline banner appears on some screens

2. **Continue with Current Work**
   - Complete deliveries already accepted
   - Use GPS for navigation
   - Capture proof of delivery normally

#### Submitting Proof Offline

1. **Proof of Delivery Screen**
   - Shows "📡 You're offline" message
   - Explain that proof will upload when online

2. **Complete the Proof**
   - Fill all required fields normally
   - Take photos and signature as usual
   - Submit as you normally would

3. **Queuing for Upload**
   - App queues proof locally
   - When online, automatic upload begins
   - You'll see notification when uploaded

#### Accepting New Deliveries While Offline

**Cannot Accept**: The app blocks new acceptances offline

**Workaround:**
1. Go online (find WiFi or cellular signal)
2. Accept deliveries while online
3. Accept multiple deliveries if needed
4. Then can go offline to deliver

#### Checking Your Location

**GPS Works Offline**: Device GPS doesn't need internet

- Navigation continues to function
- Distance and arrival time update normally
- No internet required for GPS

### Coming Back Online

#### Automatic Reconnection

1. **App Detects Connection**
   - When internet becomes available
   - App automatically recognizes connection

2. **Syncing Begins**
   - Queued proof of deliveries upload
   - Delivery status updates sync
   - Earnings recalculate

3. **Notifications**
   - You'll be notified of successful uploads
   - Any sync errors appear as alerts
   - Offline banner disappears

#### Manual Reconnection

If auto-sync doesn't work:

1. Restart the app
2. Check your internet connection
3. Wait 30 seconds for automatic sync
4. Contact support if issues persist

### Offline Mode Best Practices

**Before Going Offline:**

- Accept all deliveries you plan to make
- Download maps for your delivery areas
- Have recent delivery information

**While Offline:**

- Avoid closing the app (kills cached data)
- Use GPS navigation for routing
- Complete deliveries normally
- Keep phone charged (GPS uses battery)

**After Going Online:**

- Wait for automatic sync to complete
- Check that all proofs uploaded successfully
- Monitor notifications for any issues

### Offline Limitations Summary

| Function | Offline | Online |
|----------|---------|--------|
| View accepted deliveries | Yes | Yes |
| Accept new deliveries | No | Yes |
| Navigation & GPS | Yes | Yes |
| Proof of delivery | Yes (queued) | Yes |
| QR scanning | Yes | Yes |
| Check earnings | No | Yes |
| View available deliveries | No | Yes |
| Refresh delivery list | No | Yes |

---

## Next Steps

- Review the [Troubleshooting](04-TROUBLESHOOTING.md) section for help with issues
- Check [FAQ](05-FAQ.md) for answers to common questions
- Contact support if you need additional assistance
