# Android App Analysis: Native Child Immunization Tracker

## Purpose

This document defines the Android app as a **native Android application**, not a wrapper around the current web backend APIs.

That means:

- do not reuse the web app route handlers
- do not depend on Next.js API routes
- do not model the Android app around web session flows
- implement features natively in Android
- use Android-native SDKs and direct service integrations where needed

## Product Scope

The Android app is centered on one user type: **parent**.

Parent can:

- sign up and log in
- add one or more children
- store child details
- upload child documents
- view vaccine schedule
- track vaccine progress
- upload vaccine proof after taking vaccines
- check due and overdue vaccines
- use location access and Google Maps to find nearby healthcare centers

There is no:

- admin flow
- external verifier
- proof approval workflow
- child verification gate

## Native Android Approach

The app should be built natively with:

- Kotlin
- Jetpack Compose
- Android location APIs
- Google Maps SDK
- Google Places API or nearby places search
- direct database/auth/storage integration from Android

Instead of using web APIs, Android should use one of these patterns:

### Preferred

- Android app connects directly to backend services like:
  - Supabase Auth
  - Supabase Database / Postgres access layer
  - Supabase Storage
  - Google Maps / Places SDK

### Alternative

- Android app uses Firebase if you choose to redesign the stack for Android-first development

For staying aligned with the current project data model, **Supabase is the cleaner choice**.

## Recommended Native Stack

### Core

- Language: Kotlin
- UI: Jetpack Compose
- Architecture: MVVM
- Dependency Injection: Hilt
- Local storage: Room + DataStore / EncryptedSharedPreferences
- Coroutines + Flow

### Auth / Data / Storage

- Supabase Auth for signup/login/session
- Supabase Postgres tables for app data
- Supabase Storage for child documents and vaccine proof files

### Maps / Location

- Fused Location Provider for location access
- Google Maps SDK for Android
- Google Places API for nearby healthcare centers

## Core App Modules

### 1. Authentication

Implement natively in Android.

Features:

- signup
- login
- session persistence
- logout

Recommended approach:

- use Supabase Auth from Android
- store session/token securely
- restore session on app startup

Parent fields:

- `id`
- `name`
- `email`
- `phone`

If Supabase Auth is used:

- auth identity can be stored in Supabase Auth
- profile data like name/phone can live in a `profiles` or `users` table

## 2. Parent Dashboard

Features:

- show parent name
- list children
- show nearest due vaccine across all children
- quick add child
- quick open map screen

All dashboard data should be assembled natively from direct DB queries or cached local state, not from a web dashboard endpoint.

## 3. Child Registration

Features:

- add child name
- add child date of birth
- optional upload of birth certificate / child document

Behavior:

- child is immediately available after save
- no verification step

Android implementation:

- Compose form
- document picker
- upload file directly to storage
- save returned document path/URL in database

## 4. Child Document Storage

Purpose:

- store birth certificate or child-related document as a parent reference record

Implementation:

- pick file from Android document picker
- upload directly to Supabase Storage
- store storage path in child record

Accepted files:

- JPG
- PNG
- WebP
- PDF

Recommended limit:

- 5 MB

## 5. Vaccination Schedule

Features:

- milestone-based schedule
- due date display
- pending/taken status
- overdue highlighting
- progress tracking

Current schedule in the web project:

- At Birth
  - BCG
  - Hepatitis B - Birth dose
  - OPV-0
- 6-14 Weeks
  - OPV 1, 2 & 3
  - Pentavalent 1, 2 & 3
  - Rotavirus
  - IPV
- 9-12 Months
  - Measles / MR 1st Dose
  - JE - 1
  - Vitamin A (1st dose)
- 16-24 Months
  - DPT Booster-1
  - Measles / MR 2nd Dose
  - OPV Booster
  - JE-2
  - Vitamin A (2nd to 9th dose)
- 5-6 Years
  - DPT Booster-2
- 10-16 Years
  - TT

Important logic from the existing project:

- first milestone is open by default
- later milestone opens when child is old enough and previous milestone is sufficiently complete
- vaccines in the same milestone are sequential
- overdue vaccines remain actionable

Native Android recommendation:

- keep vaccine schedule in local structured data first for MVP
- later move it to a table/config source if you want remote updates

For MVP, Android can define:

- `VaccineMilestone`
- `VaccineItem`

as Kotlin data models and use them directly in app logic.

## 6. Vaccine Tracking

Features:

- mark vaccine as pending
- mark vaccine as taken
- record taken date
- show progress for each child
- show history of completed vaccines

Native implementation:

- vaccine records stored in database directly from Android
- each child has related vaccine records
- UI computes progress and due states locally

Suggested table/data model:

- child id
- vaccine name
- vaccine category / milestone
- status
- taken date
- proof path
- sequence order

## 7. Vaccine Proof Upload

Features:

- after vaccine is taken, parent can upload proof
- proof is stored as child vaccine history
- no one else verifies it

Android implementation:

- choose image/PDF from picker
- upload directly to storage
- save storage path in vaccine record

Suggested UX:

- mark taken
- offer "Upload Proof"
- show "Proof Uploaded" badge if file exists

## 8. Deadline Logic

Features:

- find next due vaccine for a child
- find nearest deadline across all children
- show overdue warnings

Implementation should be local in Android:

- use child DOB
- calculate milestone date offsets
- compare to today
- derive nearest pending record

This does not need a web API.

## 9. Nearby Healthcare Centers

This should be fully native on Android.

Required features:

- request location permission
- access current location
- open Google Map
- show nearby healthcare centers

Recommended native Android services:

- FusedLocationProviderClient
- Google Maps SDK
- Google Places API

Flow:

1. Ask for location permission
2. Get parent’s current latitude/longitude
3. Display Google Map centered on user
4. Fetch nearby hospitals/clinics/healthcare centers
5. Show markers

Fallback:

- if permission denied, show message and optionally manual map search later

## Suggested Native Data Model

### Parent Profile

- `id`
- `name`
- `email`
- `phone`
- `createdAt`

### Child

- `id`
- `parentId`
- `name`
- `dateOfBirth`
- `documentPath`
- `createdAt`
- `updatedAt`

### Vaccine Record

- `id`
- `childId`
- `vaccineName`
- `milestoneKey`
- `status`
- `takenDate`
- `proofPath`
- `sequenceOrder`
- `createdAt`
- `updatedAt`

## Recommended Supabase Structure

If using Supabase natively from Android:

### Auth

- Supabase Auth handles session and identity

### Tables

- `profiles`
- `children`
- `vaccine_records`

### Storage Buckets

- `child-documents`
- `vaccine-proofs`

Suggested file paths:

- child doc: `{parentId}/children/{childId}/{filename}`
- proof: `{parentId}/children/{childId}/vaccines/{recordId}/{filename}`

## Local Android Architecture

### Suggested packages

- `auth`
- `dashboard`
- `children`
- `vaccines`
- `maps`
- `profile`
- `core`
- `data`

### Suggested layers

- `ui`
- `viewmodel`
- `repository`
- `local`
- `remote`
- `model`

### Example repositories

- `AuthRepository`
- `ChildRepository`
- `VaccineRepository`
- `StorageRepository`
- `LocationRepository`
- `HealthcareCenterRepository`

## Screen List

- Splash / restore session
- Login
- Signup
- Dashboard
- Add Child
- Child Detail
- Vaccine Timeline
- Upload Proof
- Nearby Healthcare Centers Map
- Profile

## Important Scope Decisions

### 1. No web route dependency

Do not use:

- `/api/users/signup`
- `/api/users/login`
- `/api/children`
- `/api/vaccines`
- any Next.js route from this web project

Those are web implementation details, not Android app architecture.

### 2. No verification workflow

Do not build:

- birth certificate verification
- proof verification
- approval queue
- admin tools

### 3. Business logic should live in Android app for MVP

For this native version, keep these locally in Android:

- vaccine milestone structure
- due date calculation
- progress calculation
- unlock sequencing

Later, if needed, these can be moved to a centralized backend config.

### 4. Storage should still be secure

Even though Android is native, documents should not be treated casually.

Recommended:

- private storage bucket rules
- parent can access only their own children’s files

## MVP Build Order

1. Project setup with Compose, Hilt, navigation
2. Supabase Auth integration
3. Parent profile persistence
4. Child CRUD screens
5. Child document upload
6. Vaccine schedule/timeline UI
7. Vaccine record persistence
8. Vaccine proof upload
9. Dashboard deadline summary
10. Location permission + Google Maps + nearby centers

## Final Recommendation

Build the Android app as a proper native product, not as a consumer of the current web app APIs.

Use the current project only for:

- feature understanding
- vaccine schedule reference
- entity structure reference

Do not reuse:

- Next.js API routes
- web session/auth approach
- web map implementation

Use native Android integrations instead:

- Supabase Auth / DB / Storage
- Kotlin app logic
- Google Maps and Places
- Android location APIs

