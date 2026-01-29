

## Fix: RevenueCat "Invalid API" Error in Local Xcode Simulator

### Problem Identified
The RevenueCat API key (`VITE_REVENUECAT_API_KEY`) is stored in Lovable secrets, but this is **not accessible when building locally**. When you run `npm run build` on your machine, Vite looks for environment variables in a local `.env` file, which doesn't exist with the key.

### Solution
You need to create a local `.env` file on your machine with the RevenueCat API key so that Vite can embed it during the local build process.

---

## Steps to Fix (On Your Local Machine)

### Step 1: Create a Local .env File
In your project's root directory (where `package.json` is located), create a file named `.env` with the following content:

```text
VITE_REVENUECAT_API_KEY=appl_YOUR_ACTUAL_KEY_HERE
```

Replace `appl_YOUR_ACTUAL_KEY_HERE` with your actual RevenueCat iOS public API key.

### Step 2: Rebuild and Sync
Run these commands from your project directory:

```bash
npm run build
npx cap sync ios
```

### Step 3: Clean Xcode Build Folder
In Xcode:
1. Go to **Product** -> **Clean Build Folder** (or press `Cmd+Shift+K`)
2. Run the app again in the simulator

---

## Why This Happens

```text
+------------------+     +------------------+     +------------------+
|  Lovable Cloud   |     |  Local Machine   |     |  iOS Simulator   |
|  (has secrets)   |     |  (no secrets)    |     |  (runs app)      |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        |  Build in Lovable:     |                        |
        |  Key IS embedded       |                        |
        +----------------------->|                        |
                                 |                        |
        |  Build locally:        |                        |
        |  Key is MISSING        |  No VITE_REVENUECAT_   |
        |  (no .env file)        |  API_KEY = "Invalid API"|
        +------------------------+----------------------->|
```

- **Lovable Cloud builds** have access to secrets you configure in the Lovable UI
- **Local builds** (npm run build on your machine) use a local `.env` file
- Without the local `.env` file, the API key is `undefined`, causing the "Invalid API" error

---

## Security Note
The `.env` file should already be in your `.gitignore` (it is by default). This means:
- Your API key won't be committed to GitHub
- Each developer needs their own local `.env` file
- This is the standard secure practice for environment variables

---

## Technical Details

No code changes are required. The current implementation in `src/lib/revenuecat.ts` correctly reads from `import.meta.env.VITE_REVENUECAT_API_KEY`, which works with both Lovable secrets (cloud) and local `.env` files.

