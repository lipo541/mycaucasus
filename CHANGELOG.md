# Changelog

ყველა მნიშვნელოვანი ცვლილება ამ პროექტში დოკუმენტირდება ამ ფაილში.
All notable changes to this project will be documented in this file.

## [Unreleased]
- (Planning) Add semantic `<fieldset>` / `<legend>` to Add Location form
- (Planning) Supabase cookie API update to remove warning
- (Planning) API route for persisting locations (images + metadata)

## [2025-09-13] Admin Dashboard & Add Location Expansion
### Added
- Superadmin-only admin dashboard confinement via `middleware.ts` (redirect logic to keep superadmin inside `/admin` and block others from auth routes once signed in).
- `AuthRedirectGuard` to prevent flash of login/register pages for already authenticated users.
- Mobile sidebar backdrop + outside click and ESC key support for better UX.
- Full screen (full-bleed) layout for Add Location authoring view (removed previous constrained card container).
- Extended Add Location form data model:
  - Hero image (required) & Card image
  - Slogan (H1) (required)
  - Main text body
  - Info Card (title + text)
  - Flight packages: standard / long / acro (description, info, price, discount)
  - Three location sections each with heading, body, multi-image upload
  - SEO description (planned validation) and tags (chip input)
- New components: `AdminRootWrapper`, `superadmin` specific widgets directory scaffold (future growth).

### Changed
- Removed previous base location meta fields (name, country, region, latitude, longitude) pending new slug/display strategy.
- Reorganized form structure (first attempt introduced JSX issues, then corrected) to stabilize extended fields.
- Hardened sign out and navigation handling; removed previously rogue injected Sign Out DOM element.
- Updated `package.json` where necessary (dependency adjustments or scripts—see diff in commit).

### Removed
- `scripts/createSuperadmin.ts` (deprecated after initial superadmin provisioning phase).

### Fixed
- Eliminated rogue dynamic "Sign Out" duplication by cleaning up residual injection logic.
- Corrected JSX structural errors from large refactor attempt of Add Location form.

### Pending / Next Steps
- Add Georgian helper text & numbered section legends for clearer content authoring flow.
- Implement Supabase server client cookie API (`getAll`/`setAll`) to silence warning logged at runtime.
- Add validation (numeric price, discount bounds, image type/size, SEO char count, empty section filtering).
- Introduce autosave (localStorage) + slug generation approach.

---

## Format
Entries use: Added | Changed | Removed | Fixed | Security | Pending.
Dates use YYYY-MM-DD.
