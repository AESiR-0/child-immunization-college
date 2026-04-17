# Shared Backend API Contract

## Purpose

This document defines a cleaner backend contract for supporting both:

- Android app
- Web app

It is based on the current project, but fixes the weak areas in the existing implementation:

- web-specific auth/session assumptions
- missing admin role enforcement
- unsafe trust of client-provided IDs
- public document URL exposure
- hardcoded vaccine schedule data in frontend

## Design Goals

- one backend for Android and web
- token-based auth
- role-based authorization
- predictable JSON responses
- secure document access
- vaccine schedule controlled by backend

## Base Conventions

### Base URL

Example:

`https://api.example.com/v1`

### Content Type

- JSON for standard requests
- `multipart/form-data` for file uploads

### Time Format

- ISO 8601 UTC timestamps
- example: `2026-04-17T10:30:00Z`

### ID Format

- UUID strings

### Standard Success Envelope

```json
{
  "success": true,
  "data": {}
}
```

### Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {}
  }
}
```

## Auth Model

### Recommended Approach

- access token: short-lived JWT
- refresh token: long-lived, revocable
- Android stores tokens securely
- web can use secure cookies or token flow

### Roles

- `parent`
- `admin`
- `staff`

`admin` and `staff` can verify documents and vaccine proof.

## Auth Endpoints

### `POST /auth/signup`

Creates a parent account.

Request:

```json
{
  "name": "Asha Patel",
  "email": "asha@example.com",
  "phone": "+919876543210",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Asha Patel",
      "email": "asha@example.com",
      "phone": "+919876543210",
      "role": "parent",
      "emailVerified": false,
      "createdAt": "2026-04-17T10:30:00Z"
    },
    "requiresEmailVerification": true
  }
}
```

Validation:

- unique email
- password minimum length
- valid phone format

### `POST /auth/login`

Authenticates a user.

Request:

```json
{
  "email": "asha@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "name": "Asha Patel",
      "email": "asha@example.com",
      "phone": "+919876543210",
      "role": "parent",
      "emailVerified": true
    }
  }
}
```

Errors:

- `401 INVALID_CREDENTIALS`
- `403 EMAIL_NOT_VERIFIED`

### `POST /auth/refresh`

Issues a new access token.

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt",
    "expiresIn": 3600
  }
}
```

### `POST /auth/logout`

Revokes refresh token/session.

Request:

```json
{
  "refreshToken": "refresh-token"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "message": "Logged out"
  }
}
```

### `GET /auth/me`

Returns current authenticated user.

Headers:

- `Authorization: Bearer <accessToken>`

Response `200`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Asha Patel",
    "email": "asha@example.com",
    "phone": "+919876543210",
    "role": "parent",
    "emailVerified": true
  }
}
```

### `POST /auth/verify-email/request`

Creates and sends a verification email.

Request:

```json
{
  "email": "asha@example.com"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "message": "Verification email sent"
  }
}
```

### `POST /auth/verify-email/confirm`

Verifies email using token or OTP.

Request:

```json
{
  "token": "verification-token"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "message": "Email verified"
  }
}
```

## User Profile Endpoints

### `GET /users/profile`

Returns profile details for current user.

### `PATCH /users/profile`

Updates editable parent fields.

Request:

```json
{
  "name": "Asha P.",
  "phone": "+919876543210"
}
```

## Children Endpoints

All children endpoints use the authenticated user from token. Client must not send `userId`.

### `GET /children`

Returns all children for current parent.

Response `200`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Baby One",
        "dateOfBirth": "2025-10-02",
        "birthCertificate": {
          "status": "pending",
          "fileId": "uuid",
          "uploadedAt": "2026-04-10T09:00:00Z"
        },
        "nextVaccineDeadline": {
          "vaccineName": "BCG",
          "milestoneKey": "birth",
          "dueDate": "2025-10-02",
          "daysRemaining": -3
        },
        "createdAt": "2026-04-10T09:00:00Z"
      }
    ]
  }
}
```

### `POST /children`

Creates a child profile.

Request:

```json
{
  "name": "Baby One",
  "dateOfBirth": "2025-10-02"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Baby One",
    "dateOfBirth": "2025-10-02",
    "birthCertificate": {
      "status": "not_uploaded"
    },
    "createdAt": "2026-04-17T11:00:00Z"
  }
}
```

### `GET /children/{childId}`

Returns child details.

Response includes:

- child basics
- verification status
- summary stats
- latest schedule status

### `PATCH /children/{childId}`

Editable fields:

- `name`
- `dateOfBirth`

Important:

- changing DOB may require recalculation of schedule deadlines

### `POST /children/{childId}/birth-certificate`

Uploads birth certificate.

Request:

- `multipart/form-data`
- field: `file`

Response `200`:

```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "status": "pending",
    "uploadedAt": "2026-04-17T11:10:00Z"
  }
}
```

Rules:

- allowed file types: jpg, jpeg, png, webp, pdf
- max size: 5 MB
- uploading new file can mark previous file as superseded

## Vaccine Schedule Endpoints

The schedule should come from backend, not from hardcoded Android/web code.

### `GET /vaccine-schedule`

Returns master vaccine schedule.

Response `200`:

```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "key": "birth",
        "label": "At Birth",
        "minAgeWeeks": 0,
        "displayOrder": 1,
        "vaccines": [
          {
            "key": "bcg",
            "name": "BCG",
            "description": "At birth or as early as possible till one year of age",
            "sequenceOrder": 1
          }
        ]
      }
    ]
  }
}
```

Use this for:

- Android timeline rendering
- web timeline rendering
- deadline calculation
- future schedule updates without app release

### `GET /children/{childId}/vaccines`

Returns child vaccine progress merged with schedule.

Response `200`:

```json
{
  "success": true,
  "data": {
    "childId": "uuid",
    "progressPercent": 35,
    "milestones": [
      {
        "key": "birth",
        "label": "At Birth",
        "unlocked": true,
        "completedCount": 2,
        "totalCount": 3,
        "items": [
          {
            "recordId": "uuid",
            "vaccineKey": "bcg",
            "vaccineName": "BCG",
            "status": "taken",
            "takenDate": "2025-10-03",
            "proof": {
              "status": "verified",
              "fileId": "uuid"
            },
            "dueDate": "2025-10-02",
            "overdue": false,
            "locked": false
          }
        ]
      }
    ]
  }
}
```

### `POST /children/{childId}/vaccines`

Creates a vaccine record for a child.

Request:

```json
{
  "vaccineKey": "bcg",
  "status": "taken",
  "takenDate": "2025-10-03"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "recordId": "uuid",
    "status": "taken",
    "takenDate": "2025-10-03",
    "proof": {
      "status": "not_uploaded"
    }
  }
}
```

Behavior:

- backend validates vaccine belongs to known schedule
- backend checks child ownership
- backend calculates lock/unlock permissions

### `PATCH /vaccine-records/{recordId}`

Updates vaccine status.

Request:

```json
{
  "status": "pending",
  "takenDate": null
}
```

Use cases:

- revert from taken to pending
- update taken date
- mark skipped if product supports it

### `POST /vaccine-records/{recordId}/proof`

Uploads vaccine proof file.

Request:

- `multipart/form-data`
- field: `file`

Response `200`:

```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "status": "pending_verification",
    "uploadedAt": "2026-04-17T11:20:00Z"
  }
}
```

Rules:

- uploading replacement proof resets proof verification to pending
- only parent owner can upload

## Dashboard Endpoints

### `GET /dashboard`

Returns summary data for current parent.

Response `200`:

```json
{
  "success": true,
  "data": {
    "counts": {
      "totalChildren": 2,
      "verifiedChildren": 1,
      "pendingChildren": 1
    },
    "nextDeadline": {
      "childId": "uuid",
      "childName": "Baby One",
      "vaccineName": "BCG",
      "milestoneKey": "birth",
      "dueDate": "2025-10-02",
      "daysRemaining": -3,
      "urgency": "overdue"
    },
    "children": []
  }
}
```

This prevents Android/web from recalculating everything on dashboard startup unless you want a local fallback.

## Map / Center Finder Endpoints

You have two options.

### Option A: Backend-wrapped map search

Recommended if you want:

- rate limiting
- API key protection
- consistent search behavior

#### `GET /centers/nearby?lat=..&lng=..&radiusKm=10`

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "provider-id",
        "name": "Community Hospital",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "address": "New Delhi",
        "distanceKm": 2.4,
        "type": "hospital"
      }
    ]
  }
}
```

#### `GET /centers/search-by-pincode?pincode=110001`

Returns:

- pincode geocode result
- nearby centers

### Option B: Client-side third-party map APIs

Android/web directly call map providers.

Less recommended because:

- exposes API patterns
- harder to control limits
- logic duplicated across platforms

## Admin Verification Endpoints

These require `admin` or `staff`.

### `GET /admin/pending/birth-certificates`

Returns queue of child documents awaiting review.

### `POST /admin/children/{childId}/birth-certificate/decision`

Request:

```json
{
  "decision": "approved",
  "remarks": "Document is clear"
}
```

or

```json
{
  "decision": "rejected",
  "remarks": "Document unreadable"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "childId": "uuid",
    "status": "approved",
    "reviewedBy": "uuid",
    "reviewedAt": "2026-04-17T12:00:00Z"
  }
}
```

### `GET /admin/pending/vaccine-proofs`

Returns vaccine proof review queue.

### `POST /admin/vaccine-records/{recordId}/proof/decision`

Request:

```json
{
  "decision": "approved",
  "remarks": "Vaccination card is valid"
}
```

Response updates proof status.

## Notification Endpoints

Optional but useful for Android.

### `POST /devices/register`

Registers device token for push notifications.

Request:

```json
{
  "platform": "android",
  "pushToken": "fcm-token"
}
```

### `GET /notifications`

Returns in-app reminders and system notifications.

## File Access Design

Do not return permanent public URLs for sensitive files.

Recommended pattern:

- documents stored in private storage
- backend returns short-lived signed URL or streams file

### `GET /files/{fileId}/access-url`

Response:

```json
{
  "success": true,
  "data": {
    "url": "signed-url",
    "expiresAt": "2026-04-17T12:30:00Z"
  }
}
```

Authorization:

- parent can access own child/proof files
- admin/staff can access review files

## Suggested Database Additions

Current schema is close, but this contract works better with these additions.

### `user_roles` or `users.role`

- `parent`
- `staff`
- `admin`

### `files`

- `id`
- `bucket`
- `path`
- `mime_type`
- `size_bytes`
- `owner_user_id`
- `created_at`

### `birth_certificate_reviews`

- `id`
- `child_id`
- `file_id`
- `status`
- `remarks`
- `reviewed_by`
- `reviewed_at`

### `vaccine_proof_reviews`

- `id`
- `vaccine_record_id`
- `file_id`
- `status`
- `remarks`
- `reviewed_by`
- `reviewed_at`

### `vaccine_schedule_groups`

- `id`
- `key`
- `label`
- `min_age_weeks`
- `display_order`

### `vaccine_schedule_items`

- `id`
- `group_id`
- `key`
- `name`
- `description`
- `sequence_order`
- `active`

### `refresh_tokens`

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `revoked_at`

## Authorization Rules

### Parent

Can:

- manage own profile
- create and view own children
- upload documents for own children
- view vaccine records for own children
- update own child vaccine progress

Cannot:

- verify birth certificates
- verify vaccine proofs
- access another user’s data

### Staff/Admin

Can:

- review and verify documents
- access verification queues
- view protected submitted proof for review

## Status Enums

### Child birth certificate status

- `not_uploaded`
- `pending`
- `approved`
- `rejected`

### Vaccine record status

- `pending`
- `taken`
- `skipped`

### Proof status

- `not_uploaded`
- `pending_verification`
- `verified`
- `rejected`

### Notification urgency

- `normal`
- `urgent`
- `overdue`

## HTTP Status Codes

- `200 OK`
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Unprocessable Entity`
- `500 Internal Server Error`

## Security Requirements

- never trust `userId` from client body/query if auth token exists
- all protected endpoints require auth middleware
- role checks for admin/staff actions
- store password as strong salted hash
- store refresh tokens hashed
- documents in private storage
- signed URL expiry for document viewing
- audit log for approvals/rejections
- rate limit login, signup, and verify-email endpoints

## Android Integration Notes

Android client should:

- call `/auth/login` and store tokens securely
- use `/auth/refresh` on token expiry
- call `/dashboard` for home screen
- call `/children` for child list
- call `/children/{id}/vaccines` for timeline
- use multipart upload for documents
- avoid business-rule duplication unless needed for offline UX

If offline support is added:

- cache schedule and child data locally
- sync status changes when connection returns
- keep backend as final authority for verification and schedule validity

## Recommended Implementation Order

1. Auth endpoints with JWT + refresh
2. Child CRUD endpoints
3. Private file upload/access layer
4. Backend vaccine schedule tables and endpoints
5. Child vaccine progress endpoints
6. Dashboard summary endpoint
7. Admin review flows
8. Notification/device registration
9. Map service wrapper

## Final Recommendation

Use this contract as the shared API baseline for both Android and web.

If you rebuild the backend around this contract, both clients will be simpler, safer, and easier to maintain than the current web-specific setup.

