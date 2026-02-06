
# iOS App Store Migration - Complete Beginner's Guide

This guide will walk you through every step to get your Lover's Quarrel app running on your iPhone/simulator and ready for App Store submission.

---

## Prerequisites Checklist

Before we begin, make sure you have:

| Requirement | How to Check | How to Install |
|-------------|--------------|----------------|
| **Mac computer** | Required for iOS development | N/A |
| **Xcode** | Open "App Store" app, search "Xcode" | Install from Mac App Store (free, ~12GB) |
| **Node.js** | Open Terminal, type `node --version` | Download from nodejs.org |
| **CocoaPods** | Open Terminal, type `pod --version` | `sudo gem install cocoapods` |
| **Apple Developer Account** | developer.apple.com | $99/year enrollment required for App Store |
| **GitHub Account** | github.com | Free signup |

---

## Phase 1: Install Required Software

### Step 1.1 - Install Xcode
1. Open the **App Store** app on your Mac
2. Search for **"Xcode"**
3. Click **Get** then **Install** (this takes 20-45 minutes, it's a large download)
4. Once installed, open Xcode once to accept the license agreement
5. When prompted, click **"Install"** to install additional components

### Step 1.2 - Install CocoaPods
1. Open **Terminal** (press Cmd+Space, type "Terminal", press Enter)
2. Type this command and press Enter:
```bash
sudo gem install cocoapods
```
3. Enter your Mac password when prompted (you won't see characters as you type - that's normal)
4. Wait for installation to complete (1-2 minutes)
5. Verify by typing: `pod --version` - you should see a version number

---

## Phase 2: Export Project from Lovable to Your Computer

### Step 2.1 - Connect GitHub to Lovable
1. In Lovable, click **Settings** (gear icon)
2. Click **Connectors** → **GitHub**
3. Click **Connect GitHub** and authorize access
4. Click **Transfer to GitHub** to create a repository

### Step 2.2 - Download Project to Your Mac
1. Open **Terminal**
2. Navigate to where you want to store the project (we recommend a local folder, NOT iCloud):
```bash
cd ~/Developer
```
If the Developer folder doesn't exist, create it first:
```bash
mkdir ~/Developer
cd ~/Developer
```
3. Clone your project (replace URL with your GitHub repo URL):
```bash
git clone https://github.com/itskdotjdot89/lovers-quarrel.git
```
4. Enter the project folder:
```bash
cd lovers-quarrel
```

---

## Phase 3: Build the Web App

### Step 3.1 - Install Dependencies
While inside the `lovers-quarrel` folder in Terminal:
```bash
npm install
```
Wait for this to complete (1-3 minutes). You'll see a progress bar.

### Step 3.2 - Build the App
```bash
npm run build
```
This creates a `dist` folder containing your compiled app. Should take about 30 seconds.

---

## Phase 4: Create the iOS Project

### Step 4.1 - Add iOS Platform
```bash
npx cap add ios
```
This creates an `ios` folder in your project.

### Step 4.2 - Install iOS Dependencies with CocoaPods
```bash
cd ios/App
pod install
cd ../..
```
This installs the native iOS libraries (RevenueCat, etc.). Takes 1-2 minutes.

### Step 4.3 - Sync Your App to iOS
```bash
npx cap sync ios
```
This copies your web build into the iOS project.

### Step 4.4 - Open in Xcode
```bash
npx cap open ios
```
This opens your project in Xcode!

---

## Phase 5: Configure Xcode

### Step 5.1 - Set Your Team (Signing)
1. In Xcode, click on **"App"** in the left sidebar (the blue app icon at the top)
2. In the center panel, click the **"Signing & Capabilities"** tab
3. Check **"Automatically manage signing"**
4. Click the **Team** dropdown and select your Apple Developer account
5. If you see errors about Bundle ID, that's okay - we'll fix it

### Step 5.2 - Add In-App Purchase Capability
1. Still in **Signing & Capabilities**
2. Click the **"+ Capability"** button (top left of the center panel)
3. Search for **"In-App Purchase"**
4. Double-click it to add

### Step 5.3 - Set Minimum iOS Version
1. Still in the center panel, find **"Minimum Deployments"**
2. Set it to **iOS 14.0** or higher

---

## Phase 6: Create StoreKit Configuration (For Testing Purchases)

### Step 6.1 - Create StoreKit File
1. In Xcode, go to **File** → **New** → **File**
2. Search for **"StoreKit Configuration File"**
3. Select it and click **Next**
4. Name it **"Products"** and click **Create**

### Step 6.2 - Add Your Product
1. Click the **"+"** button at the bottom of the Products.storekit file
2. Select **"Add Auto-Renewable Subscription"**
3. Fill in:
   - **Reference Name**: Premium Monthly
   - **Product ID**: `lq_premium_monthly`
   - **Price**: $4.99
   - **Subscription Duration**: 1 Month
   - **Introductory Offer**: Free Trial, 7 Days

### Step 6.3 - Enable StoreKit for Testing
1. Go to **Product** → **Scheme** → **Edit Scheme** (or press Cmd+<)
2. Click **"Run"** in the left sidebar
3. Click the **"Options"** tab
4. Find **"StoreKit Configuration"**
5. Select **"Products.storekit"**
6. Click **Close**

---

## Phase 7: Run Your App

### Option A - Run on Simulator
1. At the top of Xcode, click the device dropdown (next to the "App" name)
2. Select a simulator like **"iPhone 15 Pro"**
3. Click the **Play button** (▶) or press **Cmd+R**
4. Wait for the build (first time takes 2-5 minutes)
5. The simulator will open with your app!

### Option B - Run on Your Physical iPhone
1. Connect your iPhone to your Mac with a cable
2. Trust the computer on your iPhone if prompted
3. In Xcode, select your iPhone from the device dropdown
4. Click **Play** (▶)
5. If prompted on iPhone, go to **Settings** → **General** → **VPN & Device Management** → Trust your developer certificate

---

## Quick Reference: Full Command Sequence

For future updates, here's the complete command sequence from start to finish:

```bash
# Navigate to project folder
cd ~/Developer/lovers-quarrel

# Get latest changes from Lovable
git pull

# Install any new dependencies
npm install

# Build the web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then in Xcode, press **Cmd+R** to run.

---

## Troubleshooting Tips

| Problem | Solution |
|---------|----------|
| "pod: command not found" | Run `sudo gem install cocoapods` |
| "No such file or directory" | Make sure you're in the project folder (`cd ~/Developer/lovers-quarrel`) |
| Xcode signing errors | Check that your Team is selected in Signing & Capabilities |
| Build fails | Try **Product** → **Clean Build Folder** (Cmd+Shift+K), then build again |
| Blank screen in simulator | Make sure `npm run build` completed successfully |

---

## Project Configuration Summary

Your app is already configured with:
- **Bundle ID**: `com.AcpcZnwlYJHI.LoversQuarrel`
- **App Name**: lovers-whispers-app
- **RevenueCat API Key**: Already configured
- **Product ID**: `lq_premium_monthly` ($4.99/month with 7-day trial)
- **Entitlement ID**: "Lovers Quarrel Pro"

---

## Next Steps After Running Successfully

Once the app runs on your device/simulator:
1. Test login and signup
2. Navigate to the Pricing page
3. Test the subscription purchase flow (uses sandbox/test mode)
4. Take screenshots for App Store Connect
5. Submit to App Store review

