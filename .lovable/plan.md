
# Link Terms of Use to Apple's Standard EULA

## Summary
Change the "Terms of Use" link on the Pricing page to point to Apple's Standard EULA as required for App Store compliance on iOS apps.

## What I'll Change

**File: `src/pages/Pricing.tsx`**

Update line 350 from:
```tsx
<Link to="/terms" className="text-primary hover:underline">
  Terms of Use
</Link>
```

To:
```tsx
<a 
  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" 
  target="_blank" 
  rel="noopener noreferrer"
  className="text-primary hover:underline"
>
  Terms of Use
</a>
```

## Why This Change
- Apple requires apps with In-App Purchases to link to their Standard EULA
- The link will open in a new tab/external browser
- This helps satisfy App Store Review Guidelines for subscription apps

## Technical Details
- Replace React Router's `Link` component with a standard `<a>` tag for external URLs
- Add `target="_blank"` to open in new tab
- Add `rel="noopener noreferrer"` for security best practices
