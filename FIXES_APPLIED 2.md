# Fixes Applied & Remaining

> **Total TypeScript errors at time of audit: 361 errors across 55 files**
> **Backend directory:** `/Users/jejenjaenudin/Documents/sehat-jelita/backend`

---

## COMPLETED FIXES (Automated)

The following fixes were applied by prior agents (visible in git history):

| Commit | What Was Fixed |
|--------|---------------|
| `edc81c2` (latest) | Redesigned dashboard and sidebar to match LMS style visual guidelines |
| `f3f3a13` | Fixed ICU syntax errors, schema relation issues, bed relationships using database joins, corrected unawaited backend API paths |
| `ed345bd` | Comprehensive 4-round deep audit: resolved 80+ bugs including Prisma field mismatches, missing models, FRONTEND_URL localhost fix, JWT security, auth issues, missing environment variables |
| `60ca397` | Complete SIMRS ZEN security hardening and feature completion |

---

## REMAINING FIXES (Manual -- Search & Replace)

All remaining fixes are **search-and-replace operations** that can be done in VS Code using **Ctrl+Shift+H** (global search-replace). Each category below provides exact patterns.

**Estimated time to complete all remaining fixes: 2-3 hours**

---

### 1. Relation Name Fixes (`patient` -> `patients`, `department` -> `departments`, etc.)

Prisma generates relation names matching the model name (plural), not singular. Every include/select that uses the singular form must be changed.

#### 1a. `patient:` -> `patients:` in includes/selects

**Search:** `{ patient:`
**Replace:** `{ patients:`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/billing.controller.ts` | 147, 191, 226, 267, 436 |
| `src/controllers/lab.controller.ts` | 139, 175, 228, 360 |
| `src/controllers/pharmacy.controller.ts` | 126, 226, 302 |
| `src/controllers/visits.controller.ts` | 135, 181, 243, 309 |
| `src/routes/bpjs.routes.ts` | 159 |

#### 1b. `department:` -> `departments:` in includes/selects

**Search:** `{ department:`
**Replace:** `{ departments:`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/patients.controller.ts` | 187, 437 |

#### 1c. `profiles:` -> `profile:` (user_roles include)

**Search:** `profiles: { select:`
**Replace:** `profile: { select:`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/admin.routes.ts` | 139 |

#### 1d. `medicine:` -> `medicines:` in prescription_items include

**Search:** `medicine: true`
**Replace:** `medicines: true`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 167 |

#### 1e. `medicine_a`/`medicine_b` relation access

The drug_interactions model uses relation fields `medicine_a`/`medicine_b` but the actual returned fields are `medicine_id_a`/`medicine_id_b` (or the relations are named differently).

**Search:** `.medicine_a.`
**Replace:** Check schema -- the relation may need to use proper include syntax. For now, access via `medicine_id_a` if no include.
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/pharmacy.routes.ts` | 371, 372, 854, 855 |
| `src/services/cds.service.ts` | 254, 255 |
| `src/routes/drug-interactions.routes.ts` | 78, 130, 180 |

#### 1f. `visits:` in radiology_orders include

**Search:** `visits: { select:`
**Replace:** Remove or use correct relation name
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 79 |
| `src/routes/pacs.routes.ts` | 161 |

#### 1g. `lab_order_items:` in lab_orders include

**Search:** `lab_order_items:`
**Replace:** Use correct nested relation or remove
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 288 |
| `src/routes/billing.routes.ts` | 776 |

#### 1h. `radiology_order_items:` in radiology_orders include

**Search:** `radiology_order_items:`
**Replace:** Use correct nested relation or remove
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/pacs.routes.ts` | 161 |

#### 1i. `journal_entry_items:` -> `journal_entry_lines:`

**Search:** `journal_entry_items`
**Replace:** `journal_entry_lines`
**Files affected:**

| File | Lines |
|------|-------|
| `src/services/export.service.ts` | 226, 259 |

#### 1j. `medicine_batches` relation in pharmacy include

**Search:** `medicine: true` in medicine_batches include
**Replace:** `medicines: true`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 399 |

---

### 2. Field Name Fixes

These are field names used in the code that do not match the Prisma schema.

#### 2a. `lab_number` -> `order_number`

The schema field is `order_number` not `lab_number`.

**Search:** `lab_number`
**Replace:** `order_number`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 93, 210, 372 |

#### 2b. `sample_collected_at` -> (field does not exist)

Remove or replace with correct field.
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 262 |

#### 2c. `order_item_id` -> (field does not exist in lab_results)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 299 |

#### 2d. `results_ready_at` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 329 |

#### 2e. `verified_at` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 355, 438 |

#### 2f. `discharge_status` -> (field does not exist; use `discharge_date`)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/analytics.routes.ts` | 49, 54, 58, 62 |
| `src/workers/report.worker.ts` | 225 |

#### 2g. `checkin_time` -> (field does not exist in visits)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/visits.controller.ts` | 348 |
| `src/routes/emergency.routes.ts` | 115, 268 |

#### 2h. `checkout_time` -> (field does not exist in visits)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/visits.controller.ts` | 379 |
| `src/routes/emergency.routes.ts` | 268 |
| `src/routes/inpatient.routes.ts` | 349 |

#### 2i. `schedule_date` -> `scheduled_date` (dialysis_schedules)

**Search:** `schedule_date`
**Replace:** `scheduled_date`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/dialysis.routes.ts` | 206, 230, 244 |

#### 2j. `machine_number` -> `machine_name` (dialysis_machines)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/dialysis.routes.ts` | 121, 141 |

#### 2k. `current_quantity` -> `quantity` (medicine_batches)

**Search:** `current_quantity`
**Replace:** `quantity`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 271, 357, 396 |

#### 2l. `name` -> `medicine_name` (medicines model)

**Search:** `{ name: 'asc' }` in medicines context
**Replace:** `{ medicine_name: 'asc' }`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 352 |
| `src/routes/report-templates.routes.ts` | 103 |
| `src/routes/analytics.routes.ts` | 366 |

#### 2m. `name` -> `medicine_name` in medicines select

**Search:** `name: true` (in medicines select context)
**Replace:** `medicine_name: true`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/pharmacy.routes.ts` | 363, 364, 838, 839 |
| `src/services/cds.service.ts` | 166, 167, 241, 242, 282 |
| `src/routes/drug-interactions.routes.ts` | 180 |
| `src/routes/analytics.routes.ts` | 368 |

#### 2n. `department_name` access on visits (should be via relation)

**Search:** `.departments?.department_name` or `.departments?.name`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/billing.routes.ts` | 800 |
| `src/routes/visits.routes.ts` | 349 |

#### 2o. `scheduled_start_time` -> `scheduled_time` (surgeries)

**Search:** `scheduled_start_time`
**Replace:** `scheduled_time`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/surgery.routes.ts` | 132, 160, 184, 328 |

#### 2p. `post_op_diagnosis` -> `post_diagnosis`

**Search:** `post_op_diagnosis`
**Replace:** `post_diagnosis`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/surgery.routes.ts` | 291 |

#### 2q. `pre_op_checkin_time` -> (field does not exist)

Remove or use correct field.
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/surgery.routes.ts` | 218 |

#### 2r. `surgical_team` -> (field does not exist as JSON)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/surgery.routes.ts` | 249 |

#### 2s. `autopsy_date` -> `autopsy_type` (typo in field)

**Search:** `autopsy_date: autopsyDate`
**Replace:** `autopsy_type: ...` (verify intent)
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/forensic.routes.ts` | 324 |

#### 2t. `actual_start_time` -> `actual_start` (rehabilitation_sessions)

**Search:** `actual_start_time`
**Replace:** `actual_start`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/rehabilitation.routes.ts` | 222 |

#### 2u. `completed_sessions` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/rehabilitation.routes.ts` | 238 |

#### 2v. `pain_level` -> (field does not exist in rehabilitation_sessions)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/rehabilitation.routes.ts` | 287 |

#### 2w. `examination_type` -> (field does not exist; use `modality` or `body_part`)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 120 |

#### 2x. `modality_type` -> `modality` (radiology_orders)

**Search:** `.modality_type`
**Replace:** `.modality`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 135, 248 |

#### 2y. `technician_id` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 159 |

#### 2z. `examination_end` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 186 |

#### 2aa. `recommendations` -> `recommendation`

**Search:** `recommendations,`
**Replace:** `recommendation,`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/radiology.routes.ts` | 215 |

#### 2ab. `discharge_type` -> `discharge_date` (inpatient_admissions)

**Search:** `discharge_type:`
**Replace:** `discharge_date:` or remove
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/inpatient.routes.ts` | 325 |

#### 2ac. `daily_rate` -> (field does not exist; use `room_rate` or similar)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/inpatient.routes.ts` | 384 |

#### 2ad. `room_number` -> (field does not exist; use `room_name`)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/surgery.routes.ts` | 127 |

#### 2ae. `attending_doctor_id` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/emergency.routes.ts` | 171 |

#### 2af. `bed_number` (emergency_visits) -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/emergency.routes.ts` | 348 |

#### 2ag. `treatment_start_time` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/emergency.routes.ts` | 377 |

#### 2ah. `released_to_relation` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/forensic.routes.ts` | 217 |

#### 2ai. `time_of_death` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/forensic.routes.ts` | 454 |

#### 2aj. `location_in`/`location_out` -> (fields do not exist in attendance)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/hr.routes.ts` | 165, 199 |

#### 2ak. `base_salary`/`allowances` -> `salary`

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/hr.routes.ts` | 358, 359 |

#### 2al. `description` -> (field does not exist in departments create)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/admin.routes.ts` | 64 |

#### 2am. `specialization` -> (field does not exist in employees create)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/admin.routes.ts` | 111 |

#### 2an. `queue_number` -> (field does not exist in visits)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/queue.routes.ts` | 136, 244 |
| `src/routes/visits.routes.ts` | 576 |

#### 2ao. `onset_date` -> (field does not exist in patient_drug_allergies)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/drug-interactions.routes.ts` | 192 |

#### 2ap. `medicine_a_id`/`medicine_b_id` -> relation-based queries

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 430 |
| `src/routes/drug-interactions.routes.ts` | 144, 145 |

#### 2aq. `blood_type_requested` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 298 |

#### 2ar. `units_transfused` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 418 |

#### 2as. `tested_at` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 354 |

#### 2at. `priority` in transfusion_requests orderBy -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 255 |

#### 2au. `urgency_level` -> (field does not exist in sisrute_referrals)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/sisrute.routes.ts` | 111 |

#### 2av. `notes` -> (field does not exist in sisrute_referrals update)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/sisrute.routes.ts` | 170 |

#### 2aw. `methodology` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/education.routes.ts` | 467 |

#### 2ax. `user_id` -> (field does not exist in activity_registrations)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/education.routes.ts` | 361, 372 |

#### 2ay. `evaluation_score` -> `evaluation_notes`

**Search:** `evaluation_score`
**Replace:** `evaluation_notes` (verify intent)
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/education.routes.ts` | 226 |

#### 2az. `category` -> (field does not exist in mcu_results)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/mcu.routes.ts` | 324, 346 |

#### 2ba. `completed_at` -> (field does not exist in mcu_registrations)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/mcu.routes.ts` | 300 |

#### 2bb. `discharge_destination` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/icu.routes.ts` | 421 |

#### 2bc. `allergies` -> (field does not exist; use `allergy_notes`)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/icu.routes.ts` | 112 |
| `src/routes/inpatient.routes.ts` | 102 |
| `src/routes/nutrition.routes.ts` | 67 |

#### 2bd. `completed_at` -> (field does not exist in queue_entries)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/visits.controller.ts` | 386 |

#### 2be. `shift` in dialysis_schedules orderBy -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/dialysis.routes.ts` | 207 |

#### 2bf. `total_uf_volume` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/dialysis.routes.ts` | 428 |

#### 2bg. `auto_reorder` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/inventory.routes.ts` | 422 |

#### 2bh. `suppliers` -> (relation does not exist on inventory_items)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/inventory.routes.ts` | 426 |

#### 2bi. `reorder_quantity` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/inventory.routes.ts` | 432 |

#### 2bj. `doctors` -> (relation does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/rehabilitation.routes.ts` | 77, 275 |

#### 2bk. `therapists` -> (relation does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/rehabilitation.routes.ts` | 157 |

#### 2bl. `source` -> (field does not exist in lab_results)

**Files affected:**

| File | Lines |
|------|-------|
| `src/services/lis-gateway.ts` | 306, 314 |

#### 2bm. `journal_date` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/services/export.service.ts` | 225, 251 |

#### 2bn. `journal_number` -> (field does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/services/export.service.ts` | 250 |

#### 2bo. `weight` -> (field does not exist in patients)

**Files affected:**

| File | Lines |
|------|-------|
| `src/services/cds.service.ts` | 100, 152 |

#### 2bp. `is_active` -> (field does not exist in patient_allergies)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/nutrition.routes.ts` | 279 |

#### 2bq. `status` -> (field does not exist in meal_plans update)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/nutrition.routes.ts` | 218 |

#### 2br. `nutrition_orders` -> (relation does not exist)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/nutrition.routes.ts` | 170, 190 |

#### 2bs. `admission_id` -> (field does not exist in meal_plans)

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/nutrition.routes.ts` | 189 |

#### 2bt. `created_by` -> (field does not exist in patients/prescriptions)

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/patients.controller.ts` | 244 |
| `src/controllers/pharmacy.controller.ts` | 212 |

#### 2bu. `date_of_birth` -> `birth_date`

**Search:** `date_of_birth`
**Replace:** `birth_date`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/patients.controller.ts` | 401 |

---

### 3. Enum Fixes

The Prisma enums use specific values. Code using uppercase or mismatched values must be updated.

#### 3a. BedStatus: UPPERCASE -> lowercase

The schema defines: `available`, `occupied`, `maintenance`, `reserved`

**Search:** `'AVAILABLE'`
**Replace:** `'available'`
**Search:** `'OCCUPIED'`
**Replace:** `'occupied'`
**Search:** `'CLEANING'`
**Replace:** (closest match: `'maintenance'` or add to schema if needed)
**Search:** `'MAINTENANCE'`
**Replace:** `'maintenance'`

**Files affected:**

| File | Lines | Pattern |
|------|-------|---------|
| `src/routes/icu.routes.ts` | 158, 186, 434, 481, 482, 483, 484 | AVAILABLE, OCCUPIED, CLEANING |
| `src/routes/inpatient.routes.ts` | 142, 170, 244, 256, 262, 341 | AVAILABLE, OCCUPIED, CLEANING |
| `src/routes/executive-dashboard.routes.ts` | 37, 177 | occupied, terisi |

#### 3b. BloodType: `"A+"` format -> `A_POSITIVE`

The schema uses mapped enum values: `A_POSITIVE @map("A+")`, `A_NEGATIVE @map("A-")`, etc.

**Search:** `"A+"` / `"A-"` / `"B+"` etc.
**Replace:** `A_POSITIVE` / `A_NEGATIVE` / `B_POSITIVE` etc.
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 177 |

#### 3c. BillingStatus: `"lunas"` -> valid status

Valid statuses: `pending`, `partial`, `paid`, `cancelled`, `refunded`

**Search:** `'lunas'`
**Replace:** `'paid'`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/executive-dashboard.routes.ts` | 34, 35, 80 |

#### 3d. PaymentType: `"umum"` -> valid type

Valid types: `cash`, `bpjs`, `insurance`, `corporate`, `credit_card`, `debit_card`

**Search:** `'umum'`
**Replace:** `'cash'`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/billing.controller.ts` | 253 |

#### 3e. BloodStatus: `"transfused"` -> valid status

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bloodbank.routes.ts` | 411 |

---

### 4. Decimal Arithmetic Fixes

Prisma Decimal fields cannot use native JS arithmetic operators (`+`, `-`, `*`, `/`). You must either:
- Convert to number first: `.toNumber()` or `Number()`
- Use Prisma Decimal arithmetic: `new Decimal('1').plus(2)`

#### 4a. `billing.subtotal + total_price` and similar operations

**Pattern:** `billing.subtotal +`, `billing.subtotal -`, `newSubtotal -`, etc.
**Fix:** Wrap Decimal values with `.toNumber()` or `Number()`
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/billing.controller.ts` | 322, 323, 367, 368, 409, 410 |
| `src/routes/icu.routes.ts` | 381, 385 |
| `src/routes/mcu.routes.ts` | 248 |
| `src/routes/analytics.routes.ts` | 318, 319, 320 |
| `src/routes/reports.routes.ts` | 234 |

#### 4b. `parseFloat()` on values that are already `number | string`

The issue is that some aggregated values return `string | number` not just `string`.

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/analytics.routes.ts` | 91, 92, 93, 94, 95, 96, 315, 375 |
| `src/routes/reports.routes.ts` | 253, 254, 255, 256, 257, 258 |

#### 4c. Decimal type casting on aggregate results

Aggregate `_sum` returns `Decimal`, not `number`. Casts need fixing.

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/analytics.routes.ts` | 144, 145, 146, 147, 150, 428, 432 |

#### 4d. `toFixed()` on `string | number`

**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/lab.controller.ts` | 455 |

---

### 5. JSON Null Assignment Fixes

Prisma requires `Prisma.JsonNull` or `Prisma.DbNull` instead of JavaScript `null` for JSON fields.

**Pattern:** When assigning `null` to a JSON column (e.g., `data_snapshot`, `payload`, `vital_signs`, `insurance_info`)
**Fix:** Use `Prisma.JsonNull` or `Prisma.NullTypes.JsonNull`

**Files affected:**

| File | Lines | Field |
|------|-------|-------|
| `src/services/notification.service.ts` | 160 | `payload` |
| `src/utils/queue.ts` | 93 | `payload` |
| `src/routes/aspak.routes.ts` | 190 | `data_snapshot` |

---

### 6. BPJS / SATU SEHAT Service Method Mapping

The routes call methods that do not exist on the services. These need to be mapped to the actual available methods.

#### 6a. BPJS VClaim Service

| Method Called in Route | Actual Method | File:Line |
|----------------------|---------------|-----------|
| `getPesertaByNoKartu` | `getPesertaByKartu` | `src/routes/bpjs.routes.ts:53` |
| `getRujukanByPeserta` | `getRujukanByKartu` | `src/routes/bpjs.routes.ts:274` |
| `searchDiagnosa` | `getDiagnosa` | `src/routes/bpjs.routes.ts:293` |
| `searchProsedur` | `getProsedur` | `src/routes/bpjs.routes.ts:308` |
| `searchPoli` | `getPoli` | `src/routes/bpjs.routes.ts:323` |
| `searchDokter` | (does not exist -- need to implement) | `src/routes/bpjs.routes.ts:338` |
| `searchFaskes` | `getFaskes` | `src/routes/bpjs.routes.ts:353` |
| `getMonitoringKunjungan` | (does not exist) | `src/routes/bpjs.routes.ts:378` |
| `getMonitoringKlaim` | (does not exist) | `src/routes/bpjs.routes.ts:393` |
| `updateSEP(noSep, updateData)` -- expects 1 arg | Fix signature or pass combined object | `src/routes/bpjs.routes.ts:104` |

#### 6b. SATU SEHAT Service

| Method Called in Route | Actual Method / Action | File:Line |
|----------------------|----------------------|-----------|
| `getPatientById` | `getPatientByIHS` | `src/routes/satusehat.routes.ts:117` |
| `getOrganizationById` | (does not exist -- need to implement or remove route) | `src/routes/satusehat.routes.ts:155` |
| `getLocationById` | (does not exist) | `src/routes/satusehat.routes.ts:174` |
| `createLocation` | (does not exist) | `src/routes/satusehat.routes.ts:189` |
| `getEncounterById` | (does not exist) | `src/routes/satusehat.routes.ts:242` |
| `createProcedure` | (does not exist) | `src/routes/satusehat.routes.ts:301` |
| `createMedicationDispense` | `createMedicationRequest` (verify intent) | `src/routes/satusehat.routes.ts:337` |
| `createComposition` | `createCondition` (or implement) | `src/routes/satusehat.routes.ts:357` |
| `createAllergyIntolerance` | (does not exist) | `src/routes/satusehat.routes.ts:377` |
| `createServiceRequest` | (does not exist) | `src/routes/satusehat.routes.ts:397` |
| `createSpecimen` | (does not exist) | `src/routes/satusehat.routes.ts:417` |
| `createDiagnosticReport` | (does not exist) | `src/routes/satusehat.routes.ts:437` |

#### 6c. SATU SEHAT Data Object Property Names

| Property Used | Correct Property | File:Line |
|-------------|-----------------|-----------|
| `patient_ihs_id` | `patientIHS` | `src/routes/satusehat.routes.ts:507, 548` |
| `encounter_id` | `encounterIHS` | `src/routes/satusehat.routes.ts:559` |

---

### 7. Private Member Access Fixes

The test/debug routes access private members of service classes. Add public getter methods or make them protected.

**Files affected:**

| File | Lines | Members |
|------|-------|---------|
| `src/routes/bpjs.routes.ts` | 680-683 | `consId`, `secretKey`, `userKey`, `baseUrl` |
| `src/routes/satusehat.routes.ts` | 661-664 | `clientId`, `clientSecret`, `orgId`, `env` |

**Recommended fix:** Add public getter methods to both services:
```typescript
// In bpjs-vclaim.service.ts
get config() { return { consId: this.consId, secretKey: this.secretKey, userKey: this.userKey, baseUrl: this.baseUrl }; }

// In satusehat.service.ts
get config() { return { clientId: this.clientId, clientSecret: this.clientSecret, orgId: this.orgId, env: this.env }; }
```
Then update the routes to use `.config.consId` instead of `.consId`.

---

### 8. Missing Imports / Exports

#### 8a. `resetBreaker` not exported from circuit-breaker

**Search:** `resetBreaker`
**Action:** Export it from `src/utils/circuit-breaker.ts` or remove import
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/admin.routes.ts` | 10 |

#### 8b. `enqueueJob` not exported from queue utils

**Search:** `enqueueJob`
**Action:** Export it from `src/utils/queue.ts` or use correct function name
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/admin.routes.ts` | 229 |

#### 8c. `getQueueStats` not exported from queue utils

**Search:** `getQueueStats`
**Action:** Export it from `src/utils/queue.ts`
**Files affected:**

| File | Lines |
|------|-------|
| `src/app.ts` | 175 |

---

### 9. Worker Job Interface Fixes

Workers expect named job objects but routes pass `{ data: ... }`.

**Pattern:** `w.processBpjsJob({ data: ... })` or `w.processSatuSehatJob({ data: ... })`
**Fix:** Add `name` property: `{ name: 'bpjs_vclaim', data: ... }` (verify expected name from worker interface)
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/bpjs.routes.ts` | 20 |
| `src/routes/eklaim-idrg.routes.ts` | 17 |
| `src/routes/satusehat.routes.ts` | 17 |

---

### 10. Missing Prisma Model Access

These Prisma models do not exist on the PrismaClient:

| Code Access | Likely Intent | Files:Lines |
|------------|--------------|-------------|
| `prisma.payments` | May need separate model or use `billings` | `src/controllers/billing.controller.ts:413` |
| `prisma.stock_transactions` | Model may not exist in schema | `src/controllers/pharmacy.controller.ts:279` |
| `prisma.lab_templates` | Check if model exists | `src/controllers/lab.controller.ts:396` |
| `prisma.lab_order_items` | Use `lab_orders` or check model name | `src/controllers/lab.controller.ts:311, 318` |
| `prisma.transfusion_records` | Model may not exist | `src/routes/bloodbank.routes.ts:394` |
| `prisma.inventory_transactions` | Model may not exist | `src/routes/inventory.routes.ts:158, 357` |
| `prisma.medicine_dosage_rules` | Model may not exist | `src/services/cds.service.ts:337` |
| `prisma.drug_contraindications` | Model may not exist | `src/services/cds.service.ts:410` |

**Fix:** Check `schema.prisma` for the exact model name, or remove/add the model.

---

### 11. `prisma.raw()` Usage

Prisma Client does not expose `.raw()` in the standard API. Use `$queryRaw` or `$executeRaw`.

**Search:** `prisma.raw(`
**Replace:** `prisma.$queryRaw\`...\`` or appropriate Prisma raw query
**Files affected:**

| File | Lines |
|------|-------|
| `src/controllers/pharmacy.controller.ts` | 343 |
| `src/routes/inventory.routes.ts` | 423 |

---

### 12. Nested orderBy with String Sort Order

Prisma requires `SortOrder` enum values (`'asc'` or `'desc'`), not bare strings, in certain contexts. The issue is typically in complex nested includes with orderBy.

**Pattern:** `orderBy: { field_name: 'asc' }` inside a nested include
**Fix:** Move orderBy to top level or use Prisma relation orderBy syntax
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/accounting.routes.ts` | 178, 193 (line_number) |
| `src/routes/inventory.routes.ts` | 70, 84 (expiry_date) |

---

### 13. Sort Order Type Mismatch

`orderBy` expects `SortOrder` enum, not plain string.

**Pattern:** `{ field_name: 'asc' }` where `'asc'` is inferred as string
**Fix:** Ensure TypeScript infers correctly; sometimes adding `as const` helps
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/accounting.routes.ts` | 178, 193 |

---

### 14. Type Assertion / Casting Issues

Various places have unsafe type casts that TypeScript rejects.

**Files affected:**

| File | Lines | Issue |
|------|-------|-------|
| `src/middleware/logger.ts` | 133 | `Error` to `Record<string, unknown>` |
| `src/routes/accounting.routes.ts` | 500, 704, 707, 711, 713 | Various unsafe casts |
| `src/workers/pdf.worker.ts` | 124 | Decimal to number cast |
| `src/workers/report.worker.ts` | 347 | Object to create input cast |
| `src/services/export.service.ts` | 150, 205, 279, 332 | Buffer type cast |

---

### 15. `created_by` / `updated_by` Fields

These fields do not exist on several models. Remove them or add to schema.

**Files affected:**

| File | Lines | Model |
|------|-------|-------|
| `src/controllers/patients.controller.ts` | 244 | patients |
| `src/controllers/pharmacy.controller.ts` | 212 | prescriptions |
| `src/routes/sisrute.routes.ts` | 148 | sisrute_referrals |
| `src/routes/visits.controller.ts` | 235 | visits |
| `src/routes/visits.routes.ts` | 317 | visits |

---

### 16. Education Routes -- Relation Includes on Non-existent Relations

Multiple includes reference relations that do not exist.

**Files affected:**

| File | Lines | Relation |
|------|-------|----------|
| `src/routes/education.routes.ts` | 42, 134, 195, 269, 412 | `departments` on clinical_rotations/academic_activities |
| `src/routes/staff-certifications.routes.ts` | 201, 242 | `employees`, `departments` |

---

### 17. ApiError Type Mismatches

Some `ApiError` constructors pass wrong types (string where number expected).

**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/consent.routes.ts` | 139 |
| `src/routes/upload.routes.ts` | 53 |

---

### 18. `Express.Multer.File` not found

**Search:** `Express.Multer.File`
**Fix:** Install `@types/multer` or import Multer types
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/upload.routes.ts` | 58 |

---

### 19. `err.code` on Error type

**Search:** `err.code`
**Fix:** Type guard: `(err as NodeJS.ErrnoException).code`
**Files affected:**

| File | Lines |
|------|-------|
| `src/routes/upload.routes.ts` | 107 |

---

## QUICK REFERENCE: VS Code Search & Replace Cheat Sheet

| # | Search | Replace | Category |
|---|--------|---------|----------|
| 1 | `{ patient:` | `{ patients:` | Relations |
| 2 | `{ department:` | `{ departments:` | Relations |
| 3 | `profiles: { select:` | `profile: { select:` | Relations |
| 4 | `lab_number` | `order_number` | Field names |
| 5 | `schedule_date` | `scheduled_date` | Field names |
| 6 | `current_quantity` | `quantity` | Field names |
| 7 | `scheduled_start_time` | `scheduled_time` | Field names |
| 8 | `post_op_diagnosis` | `post_diagnosis` | Field names |
| 9 | `actual_start_time` | `actual_start` | Field names |
| 10 | `autopsy_date: autopsyDate` | verify intent | Field names |
| 11 | `discharge_type:` | verify/remove | Field names |
| 12 | `'lunas'` | `'paid'` | Enums |
| 13 | `'umum'` | `'cash'` | Enums |
| 14 | `'AVAILABLE'` | `'available'` | Enums |
| 15 | `'OCCUPIED'` | `'occupied'` | Enums |
| 16 | `'MAINTENANCE'` | `'maintenance'` | Enums |
| 17 | `prisma.raw(` | `prisma.$queryRaw` | Raw queries |
| 18 | `journal_entry_items` | `journal_entry_lines` | Field names |
| 19 | `date_of_birth` | `birth_date` | Field names |
| 20 | `getPesertaByNoKartu` | `getPesertaByKartu` | BPJS methods |
| 21 | `searchDiagnosa` | `getDiagnosa` | BPJS methods |
| 22 | `searchProsedur` | `getProsedur` | BPJS methods |
| 23 | `searchPoli` | `getPoli` | BPJS methods |
| 24 | `searchFaskes` | `getFaskes` | BPJS methods |
| 25 | `getRujukanByPeserta` | `getRujukanByKartu` | BPJS methods |
| 26 | `getPatientById` | `getPatientByIHS` | SATU SEHAT methods |
| 27 | `patient_ihs_id` | `patientIHS` | SATU SEHAT data |
| 28 | `encounter_id:` | `encounterIHS:` | SATU SEHAT data |
| 29 | `name: true` (in medicines select) | `medicine_name: true` | Field names |
| 30 | `name: 'asc'` (in medicines orderBy) | `medicine_name: 'asc'` | Field names |
| 31 | `department_name` (on visits) | use relation | Field names |
| 32 | `.consId` / `.secretKey` / `.userKey` / `.baseUrl` | add public getter | Private access |
| 33 | `.clientId` / `.clientSecret` / `.orgId` / `.env` | add public getter | Private access |

---

## SUGGESTED ORDER OF OPERATIONS

1. **Enum fixes first** (categories 3a-3e) -- these are simple global search-replace
2. **Relation name fixes** (category 1) -- another simple search-replace pass
3. **Field name fixes** (category 2) -- verify each against schema before replacing
4. **BPJS/SATU SEHAT method mapping** (category 6) -- some methods need implementation
5. **Decimal arithmetic** (category 4) -- add `.toNumber()` or `Number()` wrappers
6. **Missing exports** (category 8) -- add exports to utility files
7. **Worker job interfaces** (category 9) -- add `name` property
8. **Private member access** (category 7) -- add getters to services
9. **JSON null assignments** (category 5) -- use `Prisma.JsonNull`
10. **Remaining type issues** (categories 13-19) -- handle individually

After completing all fixes, run `npx tsc --noEmit` in `/Users/jejenjaenudin/Documents/sehat-jelita/backend` to verify zero errors remain.
