# Quran App RN - Product Requirements (MVP)

## 1. Product Goal

Build a mobile app (React Native + Expo) that helps users:

1. Read Al-Quran by page (halaman) with swipe navigation.
2. Track reading progress locally.
3. See daily prayer times (solat schedule) that update based on user location.

Main navigation has exactly 3 menus:

1. Home
2. Quran
3. Settings

## 2. Primary User Stories

1. As a user, I can open Quran pages and swipe right to go to the next page.
2. As a user, I can continue reading from my last page.
3. As a user, I can see my reading progress from Home.
4. As a user, I can see prayer times for my current location.
5. As a user, I can manage app preferences in Settings.

## 3. MVP Scope

### In Scope

1. Tab navigation: Home, Quran, Settings.
2. Quran reading by page number (1-604).
3. Swipe right -> next page, swipe left -> previous page.
4. Quran page data fetched from API and cached locally for quick reopen.
5. Last read page and simple progress stored locally.
6. Prayer times fetched from location-based API.
7. Light and dark themes with Islamic green accents.

### Out of Scope (MVP)

1. User accounts / cloud sync.
2. Audio playback controls.
3. Tafsir deep features and advanced search.
4. Push notifications for adzan.

## 4. Information Architecture

## Home

Show:

1. Continue Reading card
2. Last read page number
3. Reading progress summary (for now, local-only)
4. Today's prayer schedule based on current location
5. Current location label and refresh action

## Quran

Show:

1. Quran page content from API (image/content from response kept as-is)
2. Current page number
3. Swipe gestures:
   - Swipe right: next page
   - Swipe left: previous page
4. Optional quick jump input (go to page)

On page change:

1. Save last read page locally.
2. Mark page as read in local progress cache.

## Settings

Show:

1. Theme mode: system / light / dark
2. Prayer calculation preferences (method defaults for Indonesia)
3. Location permission status and manual refresh
4. Data actions:
   - Clear reading progress
   - Clear cached Quran pages

## 5. API Integration

## Quran API (myQuran)

Reference: https://api.myquran.com/doc?utm_source=chatgpt.com#tag/Quran

Primary endpoint for MVP:

1. GET https://api.myquran.com/v3/quran/page/{number}

Notes:

1. number range is 1-604.
2. API returns page data per halaman.
3. Keep image/content rendering as provided by response (no transformation needed for MVP).

## Prayer Times API (AlAdhan)

Reference: https://aladhan.com/prayer-times-api#overview

Recommended endpoint for auto location:

1. GET https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lng}&method=20

Notes:

1. Use method=20 (KEMENAG Indonesia) as default.
2. date format: DD-MM-YYYY.
3. Fetch on app open, location change, and manual refresh.

## 6. Local Data and Caching

Storage target: local device storage.

Suggested keys:

1. reading.lastPage -> number
2. reading.readPages -> number[] or map
3. quran.page.{pageNumber} -> cached page payload
4. prayer.lastLocation -> { lat, lng, name }
5. prayer.today.{date}.{lat}.{lng} -> daily schedule cache
6. app.themeMode -> system | light | dark

Caching rules (MVP):

1. Quran page cache TTL: no expiry for now (clearable in Settings).
2. Prayer times cache TTL: valid for same date and same location.
3. If API fails, show latest cached data if available.

## 7. Theme and Visual Direction

## Light Mode

1. Background: white
2. Accent: Islamic green
3. Text: dark neutral for readability

## Dark Mode

1. Background: near-black
2. Accent: light green
3. Text: light neutral for readability

Design principles:

1. Calm, clean, respectful Quran reading experience.
2. Strong contrast and accessibility.
3. Keep Quran image display untouched.

## 8. Functional Requirements and Acceptance Criteria

1. Navigation
   - App has exactly three tabs: Home, Quran, Settings.
2. Quran page navigation
   - User can open a page and swipe right to the next page.
   - Page updates smoothly and saves the current page locally.
3. Reading progress
   - Home shows last read page and progress from local storage.
4. Prayer times by location
   - App requests location permission.
   - If granted, app fetches prayer times using location coordinates.
   - If denied, app shows clear fallback message and retry option.
5. Theme
   - App supports light and dark mode with requested color accents.
6. Offline resilience
   - Quran page and prayer schedule use cache when network is unavailable.

## 9. Non-Functional Requirements

1. Performance
   - Page transition should feel responsive on mid-range devices.
2. Reliability
   - App should not crash if API is unavailable or returns unexpected data.
3. Usability
   - Core actions (continue reading, see prayer times) accessible within one tap from Home.
4. Maintainability
   - API service layer separated by domain: Quran and Prayer.

## 10. Risks and Mitigations

1. API schema changes
   - Mitigation: validate response fields and provide graceful fallback UI.
2. Location permission denied
   - Mitigation: show guidance and allow manual refresh after permission update.
3. Inconsistent prayer methods by region
   - Mitigation: default to method 20 and expose method setting later.

## 11. Build Plan (Suggested)

1. Milestone 1: App structure
   - Set up tabs and base screens.
2. Milestone 2: Quran reader
   - Implement per-page fetch, render, swipe, and local progress.
3. Milestone 3: Prayer times
   - Integrate location permission and AlAdhan timings endpoint.
4. Milestone 4: Home dashboard
   - Show continue reading + prayer schedule widgets.
5. Milestone 5: Settings and polish
   - Theme controls, cache controls, error states.

## 12. Definition of Done (MVP)

1. User can read Quran by halaman with swipe navigation.
2. User progress is persisted locally and visible on Home.
3. Prayer schedule updates based on location.
4. Three main menus are complete: Home, Quran, Settings.
5. Theme behavior matches requested light/dark style.
