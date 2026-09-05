# Play Console "Data safety" section — answers to enter

This is an interactive form inside Play Console (App content → Data safety)
that only you can fill in, since it's tied to your developer account. Here
are the exact answers based on what Declare actually collects and does.

## Does your app collect or share any of the required user data types?
**Yes**

## Data types collected

### Personal info
- **Name** — collected, used for App functionality, NOT shared with third parties (beyond the processors below), NOT optional (required to create an account)
- **Email address** — collected, used for App functionality + Account management, NOT shared, NOT optional
- **Phone number** — collected, used for App functionality, NOT shared, NOT optional (required during onboarding)

### Photos
- **Photos** (profile picture, only if signing in with Google) — collected, used for App functionality, NOT shared, optional (only present if the user signs in via Google)

### App activity
- **Other user-generated content** (messages sent to teammates within the app) — collected, used for App functionality, NOT shared, NOT optional

## Is all of the user data collected by your app encrypted in transit?
**Yes**

## Do you provide a way for users to request that their data be deleted?
**Yes** — link to `https://declare-cyan.vercel.app/privacy` (contact email listed there: markkevinalberto@gmail.com)

## Data processors to mention (not "third parties" in the ad/sharing sense — these process data only to provide app functionality on your behalf)
- **Supabase** — database hosting + authentication
- **Resend** — transactional email delivery
- **Your own SMS gateway** (AkeriusSMS, self-operated) — SMS delivery

None of these sell data, use it for advertising, or use it for any purpose beyond delivering Declare's own functionality — so when the form asks "is this data shared with third parties," the honest answer is **No** for sharing (a processor acting only on your instructions isn't "sharing" in Play Console's definition), but make sure the privacy policy URL is entered wherever the form asks for it either way.

## Security practices
- Data encrypted in transit: **Yes**
- Data encrypted at rest: **Yes** (Supabase/Postgres encrypts at rest)
- Users can request data deletion: **Yes**
