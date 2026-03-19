# Firestore rules – fix "Missing or insufficient permissions"

The app uses Firestore security rules so that:

- **Owners** can read/write their own `owners` doc, their `employees`, and their `layouts` and `layouts/{id}/plots`.
- **Employees** can read their own `employees` doc (by `loginEmail`), and read **only** the layouts and plots that belong to their owner (via the `employeesByAuthUid` mapping).

## Deploy the rules

1. **If you use Firebase CLI**  
   Copy or use the rules in `firestore.rules` and deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (Ensure `firebase.json` has `"firestore": { "rules": "firestore.rules" }`.)

2. **If you manage rules in the Firebase Console**  
   Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database** → **Rules**, and replace the rules with the contents of `firestore.rules`.

## After deploying

- **New employees** added from the owner’s “Employees” page will get the correct `ownerId` and an `employeesByAuthUid` doc, so they can read layouts and plots without permission errors.
- **Existing employees** (added before this change) do not have an `employeesByAuthUid` doc, so they will still get “Missing or insufficient permissions” when reading layouts/plots. Re-adding them (same email) does not create the mapping because the auth user already exists. To fix them you need to backfill: e.g. a Cloud Function that, for each employee doc, looks up the Firebase Auth user by `loginEmail`, gets their `uid`, then creates `employeesByAuthUid/{uid}` with `{ ownerId: employee.ownerId }`.
