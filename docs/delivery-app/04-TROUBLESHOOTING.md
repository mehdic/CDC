# Delivery App - Troubleshooting Guide

This guide helps you solve common issues you might encounter while using the MetaPharm Delivery App.

## Table of Contents

1. [GPS & Navigation Issues](#gps--navigation-issues)
2. [Camera & Permissions Issues](#camera--permissions-issues)
3. [Network & Sync Issues](#network--sync-issues)
4. [Login & Authentication Issues](#login--authentication-issues)
5. [QR Code Scanning Issues](#qr-code-scanning-issues)
6. [Proof of Delivery Issues](#proof-of-delivery-issues)
7. [App Crashes & Performance](#app-crashes--performance)
8. [Earnings & Payment Issues](#earnings--payment-issues)
9. [Contacting Support](#contacting-support)

---

## GPS & Navigation Issues

### Problem: GPS Not Working or Location Service Disabled

**Symptoms:**
- GPS location won't turn on
- Navigation screen shows "Waiting for GPS location..."
- Location shows as inaccurate or jumping around
- "Location permission required" error message

**Solutions:**

1. **Check Device Location Services**
   - **iOS**: Settings > Privacy > Location Services
     - Toggle Location Services ON
     - Scroll to "MetaPharm Delivery"
     - Select "While Using App" or "Always"

   - **Android**: Settings > Location
     - Toggle Location ON
     - Select "High Accuracy" mode
     - Ensure MetaPharm Delivery has permission

2. **Ensure App Has Permission**
   - **iOS**: Settings > MetaPharm Delivery > Location
     - Select "While Using" or "Always Allow"

   - **Android**: Settings > Apps > MetaPharm Delivery > Permissions > Location
     - Ensure Location permission is granted

3. **Improve GPS Signal**
   - Move to an open outdoor area
   - Away from tall buildings or trees
   - Away from tunnels (GPS can't penetrate)
   - Wait 30-60 seconds for GPS lock

4. **If Still Not Working**
   - Restart your device
   - Close and reopen the app
   - If persists, contact support

### Problem: Navigation Distance Seems Incorrect

**Symptoms:**
- Distance to next delivery is very far
- Estimated time seems too long
- Route doesn't match actual road distance

**Causes & Solutions:**

1. **Different Route Calculation**
   - App calculates driving distance (following roads)
   - Not straight-line distance through air
   - Traffic and road conditions affect time estimates
   - This is normal behavior

2. **Your Location Not Accurate**
   - GPS accuracy varies (typically 5-50 meters error)
   - In urban areas, tall buildings affect accuracy
   - Move to an open area for better signal
   - GPS signal improves over time (30-60 seconds)

3. **Server Data Outdated**
   - If offline, uses cached location data
   - Go online for real-time distance calculation
   - Tap "Recalculate Route" when online

4. **Wrong Delivery Selected**
   - Verify you're looking at correct delivery
   - Check delivery address matches
   - Confirm delivery ID on app

### Problem: Map Not Showing or Loading Slowly

**Symptoms:**
- Map shows blank/white screen
- Map loads very slowly
- Markers not appearing on map

**Solutions:**

1. **Check Internet Connection**
   - Maps require internet connection
   - Switch to WiFi if on cellular with weak signal
   - Check that you're not in airplane mode

2. **Clear App Cache**
   - **iOS**: Settings > General > iPhone Storage > MetaPharm Delivery > Offload App
     - Reinstall app from App Store

   - **Android**: Settings > Apps > MetaPharm Delivery > Storage > Clear Cache
     - Don't clear data (that deletes login)

3. **Restart the App**
   - Close the app completely
   - Wait 10 seconds
   - Reopen the app
   - Wait for map to fully load

4. **Check Device Storage**
   - Ensure you have at least 100 MB free storage
   - Delete unneeded apps or files if needed
   - Maps require space for offline cache

### Problem: Route Recalculation Not Working

**Symptoms:**
- "Recalculate Route" button doesn't respond
- Route stays the same after recalculation
- New route not showing

**Solutions:**

1. **Ensure You're Online**
   - Route recalculation requires internet connection
   - Check WiFi or cellular signal
   - Try again when online

2. **Confirm Active Delivery**
   - You must have an active delivery selected
   - Route must have valid waypoints
   - Try selecting delivery again

3. **Retry the Operation**
   - Tap "Recalculate Route" again
   - Wait 5-10 seconds for processing
   - Don't interrupt (don't press back)

4. **If Still Not Working**
   - Restart the app
   - Go back to delivery list
   - Select delivery again
   - Then recalculate

---

## Camera & Permissions Issues

### Problem: Camera Won't Open or Appears Blank

**Symptoms:**
- Camera shows black/blank screen
- Camera permission error
- "Camera access required" message

**Solutions:**

1. **Grant Camera Permission**
   - **iOS**: Settings > MetaPharm Delivery > Camera
     - Ensure "Allow" is selected

   - **Android**: Settings > Apps > MetaPharm Delivery > Permissions > Camera
     - Enable Camera permission

2. **Check If Another App is Using Camera**
   - Other apps might have camera open
   - Close any other camera or video apps
   - Close FaceTime, WhatsApp, etc.

3. **Ensure Good Lighting**
   - QR scanning works best in good lighting
   - Avoid direct sunlight (creates glare)
   - Use app's built-in flash if available
   - Try under a light in low conditions

4. **Restart Camera**
   - Go back from camera screen
   - Wait 10 seconds
   - Tap to use camera again

5. **Restart Device**
   - Turn device off
   - Turn back on
   - Open app and try camera again

### Problem: Camera Is Pointing Wrong Direction

**Symptoms:**
- Rear camera (back) opens when you need front
- Front camera (selfie) opens when you need rear
- Can't flip camera orientation

**Solutions:**

1. **For Proof of Delivery Photos**
   - Make sure rear/back camera is selected
   - Photo quality is better with rear camera
   - Use front camera only if rear not available

2. **For QR Code Scanning**
   - Must use rear camera to scan QR codes
   - QR scanner automatically selects rear
   - If not working, restart app

3. **For Signature Capture**
   - Signature uses on-device drawing (no camera)
   - No camera switching needed

4. **If Camera Still Wrong**
   - Close the app completely
   - Restart device
   - Reopen app and try again

### Problem: Photos Are Blurry or Poor Quality

**Symptoms:**
- Photos appear blurry or out of focus
- Quality too poor for proof of delivery
- Image is grainy or dark

**Solutions:**

1. **Ensure Steady Hand**
   - Hold device steady while taking photo
   - Lean against wall or object for stability
   - Avoid moving during capture

2. **Improve Lighting**
   - Take photo in well-lit area
   - Use app's flash if available
   - Avoid shadows on subject
   - Natural sunlight works best

3. **Increase Focus Distance**
   - Camera auto-focuses at 6-12 inches
   - Ensure package/subject is in this range
   - Too close or too far causes blur

4. **Clean Camera Lens**
   - Dust or dirt on lens causes blur
   - Gently wipe rear camera lens with soft cloth
   - Don't use water

5. **Retake Photo**
   - Tap "Clear" or "Retake"
   - Move to better lighting
   - Take another photo

---

## Network & Sync Issues

### Problem: Cannot Connect to Internet or App Shows "Offline"

**Symptoms:**
- "Offline" badge appears on screen
- Can't accept new deliveries
- Earnings and bonuses won't load
- Can't upload proof of delivery

**Causes & Solutions:**

1. **Check Your Internet Connection**
   - Is WiFi enabled? Settings > WiFi
   - Is cellular data enabled? Settings > Cellular
   - Try switching between WiFi and cellular
   - Check signal strength (bars in top corner)

2. **WiFi Connection Issues**
   - If WiFi weak, try connecting to different network
   - Restart WiFi router if possible
   - Forget network and reconnect:
     - iOS: Settings > WiFi > i icon > "Forget This Network"
     - Android: Settings > WiFi > Long press network > Forget

3. **Cellular Data Issues**
   - Check with carrier if data plan is active
   - Restart airplane mode (toggle off/on)
   - Restart device

4. **Restart the App**
   - Close app completely
   - Wait 30 seconds
   - Reopen app
   - App should reconnect automatically

5. **If Still Offline**
   - Continue with current deliveries
   - Proof will upload when online
   - Go online regularly to sync

### Problem: Proof of Delivery Won't Upload

**Symptoms:**
- Submitted proof shows as "Pending Upload"
- Stuck in uploading state
- Upload never completes
- Error message about upload failure

**Solutions:**

1. **Check Internet Connection**
   - Must be online to upload
   - Switch to stable WiFi if possible
   - Cellular data should work but WiFi is faster
   - Check you have adequate data plan

2. **Retry Upload Manually**
   - Some versions have "Retry Upload" button
   - Tap if available
   - Wait 1-2 minutes for upload to complete

3. **Wait for Automatic Upload**
   - App retries automatically every 5 minutes
   - Keep app running in background
   - Don't force close the app
   - Can be delayed during outages (up to 24 hours)

4. **Check File Size**
   - If photos are very large, upload takes longer
   - Normal proof usually uploads in 5-30 seconds
   - 4K photos take longer
   - This is normal

5. **If Long Delay**
   - Leave app running when possible
   - Don't restart phone if upload pending
   - Upload should complete within 24 hours
   - Contact support if still pending after 24 hours

### Problem: Delivery List Won't Refresh

**Symptoms:**
- Pull-to-refresh doesn't work
- Delivery list shows old deliveries
- New available deliveries don't appear
- Last refresh time doesn't update

**Solutions:**

1. **Check Internet Connection**
   - Refresh requires internet connection
   - Verify you're online
   - Switch to WiFi for faster refresh

2. **Retry Refresh**
   - Pull down on delivery list
   - Hold until loading spinner appears
   - Release and wait 10 seconds
   - List should update

3. **Restart the App**
   - Close app completely
   - Wait 5 seconds
   - Reopen app
   - Delivery list will refresh on load

4. **Check Service Area**
   - Deliveries appear only in your service area
   - If no deliveries available, that's normal
   - Not an error, just no demand at that time
   - Check back later

---

## Login & Authentication Issues

### Problem: Cannot Log In - "Invalid Credentials"

**Symptoms:**
- "Invalid credentials" error when logging in
- "Login failed" message
- Email and password seem correct

**Solutions:**

1. **Verify Your Email**
   - Check spelling carefully
   - Email should be lowercase
   - No extra spaces before/after
   - Format: delivery@metapharm.ch

2. **Verify Your Password**
   - Passwords are case-sensitive
   - Check CAPS LOCK is off
   - No extra spaces
   - Password must not contain special characters (except standard ones)

3. **Reset Your Password**
   - Tap "Forgot Password?" on login screen
   - Enter your email address
   - Check email for reset link
   - Create new password
   - Log in with new password

4. **Verify Account Status**
   - Contact your pharmacy manager
   - Confirm your account is activated
   - Confirm you're not suspended
   - Check if registration is complete

5. **Try Again Later**
   - Wait 5 minutes
   - Server might be temporarily unavailable
   - Try again

### Problem: HIN e-ID Login Not Working

**Symptoms:**
- HIN e-ID button doesn't respond
- Stuck at authentication screen
- Authentication times out

**Solutions:**

1. **Check Internet Connection**
   - HIN e-ID authentication requires internet
   - Switch to stable WiFi
   - Check signal strength

2. **Use Regular Email/Password Instead**
   - HIN e-ID is optional authentication method
   - You can log in with email/password instead
   - Tap back and use normal login

3. **Try Again Later**
   - HIN e-ID provider might be down
   - Wait 30 minutes
   - Try authentication again

4. **Verify Your HIN e-ID**
   - Ensure your HIN e-ID is valid
   - Contact HIN provider if not valid
   - Ensure your account is linked to HIN e-ID

5. **Contact Support**
   - If persists, contact app support
   - Provide details of error
   - May need to reconfigure HIN e-ID

### Problem: Session Expired - Logged Out Unexpectedly

**Symptoms:**
- Suddenly logged out
- See login screen without warning
- App shows "Session expired" message

**Causes & Solutions:**

1. **This is Normal**
   - Sessions expire for security
   - Usually after 8-24 hours of inactivity
   - Logged out when you kill the app

2. **Just Log Back In**
   - Return to login screen
   - Enter your credentials again
   - Continue using the app

3. **Prevent Frequent Logouts**
   - Keep app open while delivering
   - Don't close app between deliveries
   - Use minimal other apps
   - Restart your device periodically

4. **Avoid Forced Logouts**
   - Don't log out intentionally
   - Only close app when finished for the day
   - Idle timeout is for security

---

## QR Code Scanning Issues

### Problem: QR Code Won't Scan

**Symptoms:**
- Camera opens but code won't scan
- Scanning hangs or doesn't complete
- "Failed to scan" message appears

**Solutions:**

1. **Position Code Correctly**
   - Hold device 6-12 inches from QR code
   - Keep code inside crosshair area
   - Code should be straight on (not at angle)
   - Ensure entire code is visible

2. **Improve Lighting**
   - QR scanning requires good lighting
   - Avoid direct sunlight (creates glare)
   - Use app's flash in low light
   - Move away from shadows
   - Stand under a light at night

3. **Check Code Quality**
   - Ensure QR code isn't damaged
   - Avoid faded or scratched codes
   - If code is damaged, use manual entry instead
   - Ask pharmacy for replacement label if needed

4. **Steady Your Hand**
   - Avoid shaking while scanning
   - Lean against something stable
   - Ask someone to help stabilize
   - Take your time

5. **Try Manual Entry**
   - If scanning fails, use manual entry
   - Tap "Type Code" button
   - Enter code manually
   - This always works as backup

### Problem: Scanned Code Shows Wrong Information

**Symptoms:**
- Scanned code doesn't match delivery
- Package verification fails
- Wrong patient or address shown

**Solutions:**

1. **Verify You Scanned Correct Code**
   - Scan again carefully
   - Ensure you're scanning the delivery code (not something else)
   - Check package label before scanning

2. **Code May Be For Different Delivery**
   - Each delivery has unique code
   - Don't mix codes from different packages
   - Each package has separate code

3. **Report the Mismatch**
   - Don't ignore code mismatches
   - Alert pharmacy staff immediately
   - Document the issue in app notes
   - Never deliver wrong package

4. **Get Clarification**
   - Ask pharmacy to verify codes
   - Request replacement labels if codes wrong
   - Don't proceed if uncertain
   - Better to delay than deliver incorrectly

---

## Proof of Delivery Issues

### Problem: Cannot Take Photo or Photo Fails to Save

**Symptoms:**
- Photo button unresponsive
- Photo taken but won't save
- "Failed to save photo" error

**Solutions:**

1. **Check Device Storage**
   - Ensure you have at least 200 MB free space
   - Delete old photos/videos if needed
   - Restart device to free up RAM

2. **Verify Camera Permission**
   - Ensure camera permission is granted
   - Settings > MetaPharm Delivery > Camera > Allow
   - Restart app after changing permissions

3. **Try Again**
   - Go back from camera
   - Wait 5 seconds
   - Tap photo button again
   - Try taking photo again

4. **Restart App**
   - Close app completely
   - Wait 10 seconds
   - Reopen and try again

5. **Try Different Photo**
   - Different angle or position may work
   - Ensure good lighting
   - Take multiple attempts if needed

### Problem: Recipient Name Not Accepted

**Symptoms:**
- Error message about recipient name
- "Name field required" even though filled
- Won't submit proof

**Solutions:**

1. **Ensure Name is Filled**
   - Click in recipient name field
   - Type the recipient's full name
   - Name cannot be blank

2. **Check Name Format**
   - Use letters (a-z, A-Z) and spaces only
   - No numbers or special characters in name
   - At least 2 characters (e.g., "Jo")
   - Maximum 100 characters

3. **Match ID if Required**
   - If ID verification required, name must match ID
   - Check ID carefully
   - Spell name exactly as shown on ID
   - Copy from ID if possible

4. **Clear and Retype**
   - Select all text (triple-tap)
   - Delete
   - Retype carefully
   - Check for typos

### Problem: GPS Location Not Captured

**Symptoms:**
- GPS location shows "Waiting for location..."
- Submit button disabled
- "Location required" error

**Solutions:**

1. **Enable Location Services**
   - Settings > Location Services > ON
   - Ensure MetaPharm Delivery permission is set
   - Select "While Using App" or "Always"

2. **Wait for GPS Lock**
   - GPS takes 30-60 seconds to lock
   - Be outdoors for better signal
   - Wait patiently, don't close app

3. **Move Outdoors**
   - GPS doesn't work well indoors
   - Go outside the building
   - Move away from obstacles
   - Open sky view helps

4. **Retry**
   - Go back from proof screen
   - Return to proof of delivery
   - GPS may lock while you're away

### Problem: Cannot Submit Proof of Delivery

**Symptoms:**
- Submit button is grayed out/disabled
- "Submit" button doesn't respond
- Error message prevents submission

**Solutions:**

1. **Verify All Required Fields**
   - Recipient name: Must be filled
   - Delivery photo: Must be taken
   - GPS location: Must be active
   - Check if signature required (fill if needed)

2. **Check Internet Connection**
   - Submission requires internet connection
   - Go online before submitting
   - Use WiFi for faster submission
   - Can submit later when online

3. **Review for Errors**
   - Recipient name spelled correctly?
   - Photo is clear and saved?
   - GPS showing active (blue dot on map)?
   - All required fields filled?

4. **Retry Submission**
   - Ensure all fields complete
   - Tap "Complete Delivery" button
   - Wait for processing (5-30 seconds)
   - Don't interrupt or press back

5. **If Still Fails**
   - Try restarting the app
   - Go back and come back to proof
   - Try submitting again

---

## App Crashes & Performance

### Problem: App Keeps Crashing

**Symptoms:**
- App closes unexpectedly
- Returns to home screen
- Crashes on opening app or specific feature

**Solutions:**

1. **Force Close and Restart**
   - **iOS**: Swipe up from bottom (on home screen)
   - **Android**: Long press app > Close app
   - Wait 10 seconds
   - Reopen app

2. **Restart Your Device**
   - Turn off device completely
   - Wait 30 seconds
   - Turn back on
   - Open app

3. **Free Up Device Memory**
   - Close other apps running in background
   - Restart device (clears RAM)
   - Delete unused apps or files
   - Ensure at least 200 MB free storage

4. **Update the App**
   - Check App Store/Google Play for updates
   - Install latest version
   - Crashes often fixed in updates

5. **Reinstall the App**
   - Delete the app from your device
   - Restart your device
   - Reinstall from App Store/Google Play
   - Log in again with your credentials

6. **Contact Support**
   - If crashes persist, contact support
   - Note what causes crash (if specific action)
   - Provide device model and iOS/Android version

### Problem: App Runs Slowly or Freezes

**Symptoms:**
- App takes long time to respond
- Buttons don't respond immediately
- List scrolling is sluggish
- Screen freezes temporarily

**Solutions:**

1. **Close Background Apps**
   - **iOS**: Swipe up from bottom > Swipe up on app
   - **Android**: Recent apps > Swipe app away
   - Close other apps not needed

2. **Restart the App**
   - Close app completely
   - Wait 10 seconds
   - Reopen app

3. **Restart Your Device**
   - Turn off completely
   - Wait 30 seconds
   - Turn back on
   - Clears RAM and improves performance

4. **Clear App Cache**
   - **iOS**: Settings > General > iPhone Storage > MetaPharm Delivery > Offload App
   - **Android**: Settings > Apps > MetaPharm Delivery > Storage > Clear Cache
   - Don't clear data (that deletes login)

5. **Free Up Storage**
   - Ensure at least 200 MB free storage
   - Delete large video/photo files
   - Offload unused apps

6. **Update the App**
   - Check App Store/Google Play for updates
   - Performance improvements often in updates

7. **Check Internet Speed**
   - Slow internet slows app response
   - Switch to WiFi if on cellular
   - Move closer to WiFi router

---

## Earnings & Payment Issues

### Problem: Earnings Not Updated or Showing Zero

**Symptoms:**
- Earnings show as $0
- Earnings not updating after completion
- Previous earnings disappeared
- Can't view earnings

**Solutions:**

1. **Refresh Earnings Screen**
   - Go back from earnings
   - Return to earnings tab
   - Check if updated

2. **Change Time Period**
   - Try different period (Today, Week, Month)
   - Earnings might be in different period
   - Your current period might have no completed deliveries

3. **Check Delivery Status**
   - Verify deliveries show as "Delivered"
   - Pending or failed deliveries don't count
   - Earnings only count completed deliveries

4. **Wait for Sync**
   - After completing delivery, wait 1-2 minutes
   - Earnings sync to server
   - Can show delayed on app

5. **Go Online**
   - Earnings require internet to display
   - Ensure you're connected
   - Refresh screen after going online

6. **Restart App**
   - Close app completely
   - Wait 10 seconds
   - Reopen and check earnings

### Problem: Cannot Export Earnings Report

**Symptoms:**
- Export button doesn't respond
- CSV/PDF buttons disabled
- Export fails with error

**Solutions:**

1. **Ensure Internet Connection**
   - Export requires internet connection
   - Check WiFi or cellular signal
   - Switch to WiFi for faster export

2. **Check Available Data**
   - Ensure period selected has data
   - If period shows zero earnings, nothing to export
   - Select different period if needed

3. **Try Different Format**
   - If PDF fails, try CSV
   - If CSV fails, try PDF
   - One might work if other is having issues

4. **Retry Export**
   - Wait 10 seconds
   - Tap export button again
   - Sometimes temporary glitches

5. **Contact Support**
   - If export consistently fails
   - Provide period you're trying to export
   - Screenshots of error if available

### Problem: Payment Not Received

**Symptoms:**
- Earnings show but payment delayed
- Money not in account
- Payment failed notification

**Solutions:**

1. **Allow Time for Processing**
   - Payments process weekly (usually Fridays)
   - Takes 1-3 business days to appear in bank
   - Not immediate, this is normal

2. **Verify Payment Method**
   - Ensure bank account information is correct
   - Check in account settings
   - Update if details changed

3. **Check Delivery Status**
   - Only completed deliveries pay
   - Verify deliveries show as "Delivered"
   - Failed or pending deliveries don't pay

4. **Account Hold or Issues**
   - Some violations trigger payment hold
   - Check app notifications for messages
   - Contact support if account flagged

5. **Contact Your Bank**
   - If expected payment not arrived
   - Check bank account for deposits
   - Ask bank about pending transfers
   - Provide dates you expect payment

6. **Contact Support**
   - If payment missing after 5 business days
   - Provide delivery dates
   - Support can trace payment

---

## Contacting Support

### When to Contact Support

Contact support if:
- Issue not resolved by troubleshooting
- Crashes that won't stop
- Payment issues
- Account access problems
- Persistent technical issues
- Unusual app behavior

### How to Contact Support

**In-App Support:**
1. Go to Settings (if available)
2. Tap "Help" or "Contact Support"
3. Fill out support form
4. Describe issue and steps you've tried
5. Submit and wait for response

**Email Support:**
- Email: support@metapharm.ch
- Subject: "Delivery App Support Request"
- Include:
  - Device model (iPhone 13, Samsung Galaxy S21, etc.)
  - iOS/Android version (Settings > About Phone)
  - App version (In app > Settings > About)
  - Description of issue
  - Steps you've tried
  - Screenshots if applicable

**Phone Support:**
- Hours: Monday-Friday 9 AM - 6 PM Swiss Time
- Call pharmacy manager who can connect you
- Have app version ready

### Information to Provide

When contacting support, have ready:
- Device type and model
- Operating system version
- App version number
- Description of issue
- When issue started
- Steps you've already tried
- Error messages (screenshots helpful)
- Your email/account

### Expected Response Times

- **Critical issues** (can't complete deliveries): 1-2 hours
- **Important issues** (app crashes): 2-4 hours
- **Standard issues** (account/payment): 24 hours
- **General questions**: 24-48 hours

### Common Support Solutions

Most issues resolved by:
1. Restarting the app
2. Restarting your device
3. Updating the app
4. Clearing app cache
5. Checking internet connection
6. Allowing sufficient time for sync

Try these before contacting support to save time.

---

## Prevention Tips

**To Avoid Common Issues:**

1. **Keep App Updated**
   - Check App Store/Google Play weekly
   - Install updates immediately
   - Updates fix bugs and improve performance

2. **Maintain Device Storage**
   - Keep at least 200 MB free space
   - Delete old photos/videos
   - Offload unused apps

3. **Secure Your Login**
   - Never share credentials
   - Use strong unique password
   - Use HIN e-ID if available
   - Change password every 3 months

4. **Maintain Internet Connection**
   - Have decent cellular plan
   - Use WiFi when available
   - Enable WiFi and cellular together
   - Monitor signal strength

5. **Manage Device Battery**
   - Charge before shift
   - Carry power bank for long shifts
   - GPS drains battery faster
   - Turn off unnecessary features

6. **Regular Device Maintenance**
   - Restart device weekly
   - Clear cache monthly
   - Keep OS updated
   - Remove unused apps

---

For additional help, check the [FAQ](05-FAQ.md) section or contact support using information above.
