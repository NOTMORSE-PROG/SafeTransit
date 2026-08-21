/**
 * Legal Documents - Terms of Service and Privacy Policy
 *
 * ⚠️ IMPORTANT: These documents are templates for a personal project.
 * Before public launch or production use, have a lawyer review and customize
 * these documents to ensure legal compliance with applicable laws.
 *
 * Version: 1.0.0
 * Effective Date: February 15, 2026
 * Legal Framework: Philippine Data Privacy Act
 */

export const LEGAL_DOCUMENTS = {
  termsOfService: {
    version: '1.0.0',
    effectiveDate: '2026-02-15',
    title: 'Terms of Service',
    content: `# Terms of Service

**Effective Date:** February 15, 2026
**Version:** 1.0.0

## 1. Acceptance of Terms

By creating an account or using SafeTransit, you agree to these Terms of Service and our Privacy Policy.

## 2. Service Description

SafeTransit is a personal safety mobile application that:
- Provides safety alerts for danger zones
- Offers safe route planning and navigation
- Enables emergency contact notification via panic button
- Allows family location sharing for safety

⚠️ **IMPORTANT:** SafeTransit is a supplementary safety tool. It does not replace emergency services (911). For immediate danger, call emergency services.

## 3. Account Responsibilities

You agree to:
- Provide accurate information during registration
- Keep your password secure
- Not share your account with others
- Notify us of unauthorized access

You must be at least 13 years old to use SafeTransit.

## 4. Location Data Collection

By using SafeTransit, you consent to:
- **Foreground location tracking** when the app is open
- **Background location tracking** (OPTIONAL) for continuous danger zone monitoring
- Storage of your location history for 90 days
- Analysis of location patterns to improve recommendations

You can disable background tracking at any time in Settings.

## 5. Emergency Features

**Panic Button:**
- When activated, your real-time location is shared with emergency contacts via SMS
- Location sharing continues until you cancel the alert
- We are not liable for delayed or failed notifications due to network issues

**Emergency Contacts:**
- You are responsible for obtaining consent from emergency contacts before adding them
- Contacts will receive SMS alerts when you trigger the panic button
- We do not charge for this service, but SMS fees may apply

## 6. Family Location Sharing

- When you enable Family Location Sharing, your real-time GPS coordinates are visible to invited family members
- You are responsible for obtaining consent from family members before inviting them
- Either party can disable location sharing at any time
- We are not liable for misuse of shared location data

## 7. Third-Party Services

SafeTransit uses third-party APIs:
- Google Maps (map rendering)
- LocationIQ (driving routes)
- OpenRouteService (walking/cycling routes)
- Nominatim (address lookup)
- UploadThing (image hosting)

These services have their own terms and privacy policies. We are not responsible for their practices.

## 8. Community Content

**Safety Tips & Forum Posts:**
- You retain ownership of content you post
- You grant us a license to display and distribute your content
- Do not post illegal, harmful, or misleading content
- We reserve the right to remove content that violates these terms

## 9. Limitation of Liability

**SafeTransit is provided "AS IS" without warranties.**

We are NOT liable for:
- Inaccurate danger zone data
- Failed emergency alerts
- Route safety or accuracy
- Injuries or damages resulting from app use
- Third-party service failures

**Maximum Liability:** Our total liability shall not exceed the amount you paid to use SafeTransit (currently $0, as the app is free).

## 10. Governing Law

These Terms are governed by the laws of the Republic of the Philippines. Disputes shall be resolved in Philippine courts.

## 11. Changes to Terms

We may update these Terms from time to time. Material changes will require re-acceptance. Continued use after changes constitutes acceptance.

## 12. Account Termination

**You may delete your account at any time:** Profile → Data & Privacy → Delete Account

**We may terminate accounts for:**
- Violation of these Terms
- Fraudulent activity
- Abuse of community features

## 13. Contact Information

For questions or concerns:
- Email: privacy@safetransit.app
- App: Profile → Data & Privacy → "Contact Support"

**Last Updated:** February 2, 2026`
  },

  privacyPolicy: {
    version: '1.0.0',
    effectiveDate: '2026-02-15',
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Effective Date:** February 15, 2026
**Version:** 1.0.0

## Introduction

SafeTransit ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

⚠️ **IMPORTANT:** By using SafeTransit, you consent to the data practices described in this policy.

## Information We Collect

### 1. Location Data

- **Foreground Location**: Your real-time GPS coordinates when the app is open
- **Background Location** (OPTIONAL): Continuous GPS monitoring even when the app is closed, used to alert you of danger zones
- **Location History**: We store your location searches, route selections, and navigation actions for 90 days to provide personalized recommendations
- **Inferred Locations**: We may infer your home and work addresses based on frequent visit patterns

### 2. Personal Information

- Full name
- Email address
- Phone number (optional)
- Profile photo (stored on UploadThing CDN)
- Emergency contact names and phone numbers

### 3. Family Location Sharing

- When you enable Family Location Sharing, your real-time GPS coordinates are visible to family members you invite
- You can disable this feature at any time in Family Settings

### 4. Usage Data

- App feature usage (which screens you visit, buttons clicked)
- Safety tips viewed and submitted
- Forum posts and comments

## How We Use Your Information

1. **Safety Alerts**: Monitor your location against danger zones and send warnings
2. **Navigation**: Provide safe route planning and directions
3. **Emergency Response**: Share your location with emergency contacts when you activate the panic button
4. **Personalization**: Suggest safe routes based on your location history
5. **Service Improvement**: Analyze usage patterns to improve SafeTransit

## Third-Party Services

We share data with the following third parties to provide our service:

- **Google Maps** - Map rendering and geocoding (receives your coordinates)
- **LocationIQ** - Driving route calculations (receives start/end coordinates)
- **OpenRouteService** - Walking/cycling routes (receives route coordinates)
- **Nominatim (OpenStreetMap)** - Converting coordinates to addresses
- **UploadThing** - Profile image storage (images stored on their CDN)
- **Vercel** - Backend hosting (processes all API requests)
- **Neon PostgreSQL** - Database hosting (stores all user data, encrypted at rest)

⚠️ **We never sell your personal data to advertisers or third parties.**

## Data Retention

- **Location History**: Automatically deleted after 90 days
- **Account Data**: Retained until you delete your account
- **Deleted Accounts**: All data permanently removed within 30 days

## Your Rights

Under the Philippine Data Privacy Act, you have the right to:

1. **Access Your Data** - Export all your data in JSON format
2. **Rectify Your Data** - Edit your profile information
3. **Erase Your Data** - Permanently delete your account
4. **Data Portability** - Download your data
5. **Object to Processing** - Disable background location tracking
6. **Withdraw Consent** - Manage consents in Settings

**To exercise these rights:** Go to Profile → Data & Privacy

## Data Security

We implement industry-standard security measures:
- JWT authentication
- HTTPS encryption for data in transit
- Encrypted database storage (Neon PostgreSQL)
- Regular security updates

However, no method of transmission over the Internet is 100% secure. Use SafeTransit at your own risk.

## Children's Privacy

SafeTransit is not intended for users under 13 years old. We do not knowingly collect data from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will require re-acceptance. You'll be notified via the app.

## Contact Us

For privacy concerns or questions:
- Email: privacy@safetransit.app
- App: Profile → Data & Privacy → "Contact Support"

**Last Updated:** February 2, 2026`
  }
};

// Consent type constants for consistency across the app
export const CONSENT_TYPES = {
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
  DATA_PROCESSING: 'data_processing',
  BACKGROUND_LOCATION: 'background_location',
  EMERGENCY_SHARING: 'emergency_sharing',
  FAMILY_SHARING: 'family_sharing',
} as const;

export type ConsentType = typeof CONSENT_TYPES[keyof typeof CONSENT_TYPES];

// Consent method constants
export const CONSENT_METHODS = {
  SIGNUP: 'signup',
  ONBOARDING: 'onboarding',
  SETTINGS: 'settings',
  FEATURE_ACTIVATION: 'feature_activation',
} as const;

export type ConsentMethod = typeof CONSENT_METHODS[keyof typeof CONSENT_METHODS];
