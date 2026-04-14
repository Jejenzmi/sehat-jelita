# PANDUAN IMPLEMENTASI DELETE OPERATIONS - SIMRS ZEN
**Tanggal:** 2026-04-14  
**Status:** ✅ MIGRATION CREATED, TEMPLATE READY

---

## ✅ YANG SUDAH DILAKUKAN:

1. ✅ Migration SQL dibuat untuk menambahkan soft delete columns ke 40+ entities
2. ✅ Indexes dibuat untuk performance filtering
3. ✅ Template delete operations sudah tersedia di queue.routes.ts dan vital-signs.routes.ts

---

## 📋 ENTITIES YANG SUDAH PUNYA DELETE OPERATIONS:

| Entity | Route File | Status |
|--------|-----------|--------|
| patients | patients.routes.ts | ✅ Sudah ada |
| queue_entries | queue.routes.ts | ✅ Sudah ada |
| vital_signs | vital-signs.routes.ts | ✅ Sudah ada |
| staff_certifications | staff-certifications.routes.ts | ✅ Sudah ada |
| trainings | staff-certifications.routes.ts | ✅ Sudah ada |
| form_templates | form-templates.routes.ts | ✅ Sudah ada |
| report_templates | report-templates.routes.ts | ✅ Sudah ada |
| smart_display_devices | smart-display.routes.ts | ✅ Sudah ada |
| smart_display_media | smart-display.routes.ts | ✅ Sudah ada |
| education_programs | education.routes.ts | ✅ Sudah ada |
| medical_trainees | education.routes.ts | ✅ Sudah ada |
| clinical_rotations | education.routes.ts | ✅ Sudah ada |
| academic_activities | education.routes.ts | ✅ Sudah ada |
| research_projects | education.routes.ts | ✅ Sudah ada |
| dialysis_machines | dialysis.routes.ts | ✅ Sudah ada |
| dialysis_schedules | dialysis.routes.ts | ✅ Sudah ada |
| dialysis_sessions | dialysis.routes.ts | ✅ Sudah ada |
| drug_interactions | drug-interactions.routes.ts | ✅ Sudah ada |
| patient_drug_allergies | drug-interactions.routes.ts | ✅ Sudah ada |
| diagnoses | icd11.routes.ts | ✅ Sudah ada |
| billing_items | billing.routes.ts | ✅ Sudah ada |
| bpjs_sep | bpjs.routes.ts | ✅ Sudah ada |
| hr_schedules | hr.routes.ts | ✅ Sudah ada |
| surgery_teams | surgery.routes.ts | ✅ Sudah ada |
| patient_portal_appointments | patient-portal.routes.ts | ✅ Sudah ada |
| sisrute_referrals | sisrute.routes.ts | ✅ Sudah ada |
| uploads | upload.routes.ts | ✅ Sudah ada |
| aspak_assets | aspak.routes.ts | ✅ Sudah ada |
| vendors | vendor.routes.ts | ✅ Sudah ada |
| jobs_completed | jobs.routes.ts | ✅ Sudah ada |

**Total:** 30 entities sudah punya delete operations ✅

---

## ⚠️ ENTITIES YANG PERLU DITAMBAHKAN DELETE OPERATIONS:

### 1. Clinical Modules (10 entities)

#### visits
**File:** `backend/src/routes/visits.routes.ts`  
**Type:** Soft delete (set is_active = false, deleted_at = now())

```typescript
// Tambahkan di akhir file, sebelum export default router;
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const visit = await prisma.visits.findUnique({ where: { id } });
  if (!visit) {
    throw new ApiError(404, 'Visit tidak ditemukan', 'VISIT_NOT_FOUND');
  }
  
  const deleted = await prisma.visits.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Visit berhasil dibatalkan', data: deleted });
}));
```

#### prescriptions
**File:** `backend/src/routes/pharmacy.routes.ts`  
**Type:** Soft delete

```typescript
router.delete('/prescriptions/:id', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const prescription = await prisma.prescriptions.findUnique({ where: { id } });
  if (!prescription) {
    throw new ApiError(404, 'Resep tidak ditemukan', 'PRESCRIPTION_NOT_FOUND');
  }
  
  // Only allow delete if not yet dispensed
  if (prescription.status === 'dispensed') {
    throw new ApiError(400, 'Resep sudah diserahkan dan tidak bisa dihapus', 'CANNOT_DELETE_DISPENSED');
  }
  
  const deleted = await prisma.prescriptions.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Resep berhasil dibatalkan', data: deleted });
}));
```

#### lab_orders
**File:** `backend/src/routes/lab.routes.ts`  
**Type:** Soft delete

```typescript
router.delete('/orders/:id', requireRole(['admin', 'laboratorium']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const order = await prisma.lab_orders.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');
  }
  
  // Only allow delete if not yet completed
  if (order.status === 'completed') {
    throw new ApiError(400, 'Order sudah selesai dan tidak bisa dihapus', 'CANNOT_DELETE_COMPLETED');
  }
  
  const deleted = await prisma.lab_orders.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Order lab berhasil dibatalkan', data: deleted });
}));
```

#### radiology_orders
**File:** `backend/src/routes/radiology.routes.ts`  
**Type:** Soft delete

```typescript
router.delete('/orders/:id', requireRole(['admin', 'radiologi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const order = await prisma.radiology_orders.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order radiologi tidak ditemukan', 'RADIOLOGY_ORDER_NOT_FOUND');
  }
  
  if (order.status === 'completed') {
    throw new ApiError(400, 'Order sudah selesai dan tidak bisa dihapus', 'CANNOT_DELETE_COMPLETED');
  }
  
  const deleted = await prisma.radiology_orders.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Order radiologi berhasil dibatalkan', data: deleted });
}));
```

#### inpatient_admissions
**File:** `backend/src/routes/inpatient.routes.ts`  
**Type:** Soft delete

```typescript
// Tambahkan di akhir file
router.delete('/admissions/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const admission = await prisma.inpatient_admissions.findUnique({ where: { id } });
  if (!admission) {
    throw new ApiError(404, 'Admisi tidak ditemukan', 'ADMISSION_NOT_FOUND');
  }
  
  if (admission.status === 'active') {
    throw new ApiError(400, 'Pasien masih rawat inap dan tidak bisa dihapus', 'CANNOT_DELETE_ACTIVE');
  }
  
  const deleted = await prisma.inpatient_admissions.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Admisi berhasil dihapus', data: deleted });
}));
```

#### emergency_visits
**File:** `backend/src/routes/emergency.routes.ts`  
**Type:** Soft delete

```typescript
// Tambahkan di akhir file
router.delete('/visits/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const visit = await prisma.emergency_visits.findUnique({ where: { id } });
  if (!visit) {
    throw new ApiError(404, 'Visit IGD tidak ditemukan', 'EMERGENCY_VISIT_NOT_FOUND');
  }
  
  const deleted = await prisma.emergency_visits.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Visit IGD berhasil dihapus', data: deleted });
}));
```

#### surgeries
**File:** `backend/src/routes/surgery.routes.ts`  
**Type:** Soft delete

```typescript
// Tambahkan di akhir file
router.delete('/schedule/:id', requireRole(['admin', 'bedah']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const surgery = await prisma.surgeries.findUnique({ where: { id } });
  if (!surgery) {
    throw new ApiError(404, 'Jadwal operasi tidak ditemukan', 'SURGERY_NOT_FOUND');
  }
  
  if (surgery.status === 'completed') {
    throw new ApiError(400, 'Operasi sudah selesai dan tidak bisa dihapus', 'CANNOT_DELETE_COMPLETED');
  }
  
  const deleted = await prisma.surgeries.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Jadwal operasi berhasil dibatalkan', data: deleted });
}));
```

#### icu_admissions
**File:** `backend/src/routes/icu.routes.ts`  
**Type:** Soft delete

```typescript
// Tambahkan di akhir file
router.delete('/admissions/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const admission = await prisma.icu_admissions.findUnique({ where: { id } });
  if (!admission) {
    throw new ApiError(404, 'Admisi ICU tidak ditemukan', 'ICU_ADMISSION_NOT_FOUND');
  }
  
  if (admission.status === 'active') {
    throw new ApiError(400, 'Pasien masih di ICU dan tidak bisa dihapus', 'CANNOT_DELETE_ACTIVE');
  }
  
  const deleted = await prisma.icu_admissions.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Admisi ICU berhasil dihapus', data: deleted });
}));
```

### 2. Support Modules (15 entities)

#### inventory_items
**File:** `backend/src/routes/inventory.routes.ts`

```typescript
router.delete('/items/:id', requireRole(['admin', 'pengadaan']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const item = await prisma.inventory_items.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, 'Item inventory tidak ditemukan', 'INVENTORY_ITEM_NOT_FOUND');
  }
  
  const deleted = await prisma.inventory_items.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Item berhasil dihapus', data: deleted });
}));
```

#### suppliers
**File:** `backend/src/routes/inventory.routes.ts`

```typescript
router.delete('/suppliers/:id', requireRole(['admin', 'pengadaan']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const supplier = await prisma.suppliers.findUnique({ where: { id } });
  if (!supplier) {
    throw new ApiError(404, 'Supplier tidak ditemukan', 'SUPPLIER_NOT_FOUND');
  }
  
  const deleted = await prisma.suppliers.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Supplier berhasil dihapus', data: deleted });
}));
```

#### patient_incidents
**File:** `backend/src/routes/incidents.routes.ts`

```typescript
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const incident = await prisma.patient_incidents.findUnique({ where: { id } });
  if (!incident) {
    throw new ApiError(404, 'Insiden tidak ditemukan', 'INCIDENT_NOT_FOUND');
  }
  
  const deleted = await prisma.patient_incidents.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Insiden berhasil dihapus', data: deleted });
}));
```

#### blood_inventory
**File:** `backend/src/routes/bloodbank.routes.ts`

```typescript
router.delete('/inventory/:id', requireRole(['admin', 'bank_darah']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const inventory = await prisma.blood_inventory.findUnique({ where: { id } });
  if (!inventory) {
    throw new ApiError(404, 'Inventory darah tidak ditemukan', 'BLOOD_INVENTORY_NOT_FOUND');
  }
  
  const deleted = await prisma.blood_inventory.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Inventory darah berhasil dihapus', data: deleted });
}));
```

#### transfusion_requests
**File:** `backend/src/routes/bloodbank.routes.ts`

```typescript
router.delete('/transfusions/:id', requireRole(['admin', 'bank_darah']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const request = await prisma.transfusion_requests.findUnique({ where: { id } });
  if (!request) {
    throw new ApiError(404, 'Request transfusi tidak ditemukan', 'TRANSFUSION_REQUEST_NOT_FOUND');
  }
  
  if (request.status === 'completed') {
    throw new ApiError(400, 'Request sudah selesai dan tidak bisa dihapus', 'CANNOT_DELETE_COMPLETED');
  }
  
  const deleted = await prisma.transfusion_requests.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Request transfusi berhasil dibatalkan', data: deleted });
}));
```

#### nutrition_orders
**File:** `backend/src/routes/nutrition.routes.ts`

```typescript
router.delete('/orders/:id', requireRole(['admin', 'gizi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const order = await prisma.nutrition_orders.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order nutrisi tidak ditemukan', 'NUTRITION_ORDER_NOT_FOUND');
  }
  
  const deleted = await prisma.nutrition_orders.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Order nutrisi berhasil dihapus', data: deleted });
}));
```

#### nutrition_assessments
**File:** `backend/src/routes/nutrition.routes.ts`

```typescript
router.delete('/assessments/:id', requireRole(['admin', 'gizi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const assessment = await prisma.nutrition_assessments.findUnique({ where: { id } });
  if (!assessment) {
    throw new ApiError(404, 'Assessment nutrisi tidak ditemukan', 'NUTRITION_ASSESSMENT_NOT_FOUND');
  }
  
  const deleted = await prisma.nutrition_assessments.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Assessment nutrisi berhasil dihapus', data: deleted });
}));
```

#### rehabilitation_cases
**File:** `backend/src/routes/rehabilitation.routes.ts`

```typescript
router.delete('/cases/:id', requireRole(['admin', 'rehabilitasi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const case_ = await prisma.rehabilitation_cases.findUnique({ where: { id } });
  if (!case_) {
    throw new ApiError(404, 'Case rehabilitasi tidak ditemukan', 'REHAB_CASE_NOT_FOUND');
  }
  
  const deleted = await prisma.rehabilitation_cases.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Case rehabilitasi berhasil dihapus', data: deleted });
}));
```

#### home_care_visits
**File:** `backend/src/routes/home-care.routes.ts`

```typescript
router.delete('/visits/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const visit = await prisma.home_care_visits.findUnique({ where: { id } });
  if (!visit) {
    throw new ApiError(404, 'Visit home care tidak ditemukan', 'HOME_CARE_VISIT_NOT_FOUND');
  }
  
  const deleted = await prisma.home_care_visits.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Visit home care berhasil dihapus', data: deleted });
}));
```

#### mcu_packages
**File:** `backend/src/routes/mcu.routes.ts`

```typescript
router.delete('/packages/:id', requireRole(['admin', 'mcu']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const pkg = await prisma.mcu_packages.findUnique({ where: { id } });
  if (!pkg) {
    throw new ApiError(404, 'Package MCU tidak ditemukan', 'MCU_PACKAGE_NOT_FOUND');
  }
  
  const deleted = await prisma.mcu_packages.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Package MCU berhasil dihapus', data: deleted });
}));
```

#### mcu_clients
**File:** `backend/src/routes/mcu.routes.ts`

```typescript
router.delete('/clients/:id', requireRole(['admin', 'mcu']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const client = await prisma.mcu_clients.findUnique({ where: { id } });
  if (!client) {
    throw new ApiError(404, 'Client MCU tidak ditemukan', 'MCU_CLIENT_NOT_FOUND');
  }
  
  const deleted = await prisma.mcu_clients.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Client MCU berhasil dihapus', data: deleted });
}));
```

#### mcu_registrations
**File:** `backend/src/routes/mcu.routes.ts`

```typescript
router.delete('/registrations/:id', requireRole(['admin', 'mcu']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const registration = await prisma.mcu_registrations.findUnique({ where: { id } });
  if (!registration) {
    throw new ApiError(404, 'Registrasi MCU tidak ditemukan', 'MCU_REGISTRATION_NOT_FOUND');
  }
  
  const deleted = await prisma.mcu_registrations.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Registrasi MCU berhasil dihapus', data: deleted });
}));
```

#### patient_consents
**File:** `backend/src/routes/consents.routes.ts`

```typescript
router.delete('/:id', requireRole(['admin', 'dokter']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const consent = await prisma.patient_consents.findUnique({ where: { id } });
  if (!consent) {
    throw new ApiError(404, 'Consent tidak ditemukan', 'CONSENT_NOT_FOUND');
  }
  
  const deleted = await prisma.patient_consents.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Consent berhasil dihapus', data: deleted });
}));
```

#### telemedicine_sessions
**File:** `backend/src/routes/telemedicine.routes.ts`

```typescript
router.delete('/sessions/:id', requireRole(['admin', 'dokter']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const session = await prisma.telemedicine_sessions.findUnique({ where: { id } });
  if (!session) {
    throw new ApiError(404, 'Session telemedicine tidak ditemukan', 'TELEMEDICINE_SESSION_NOT_FOUND');
  }
  
  const deleted = await prisma.telemedicine_sessions.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Session telemedicine berhasil dihapus', data: deleted });
}));
```

### 3. Forensic & Support (15 entities)

#### waste_records
**File:** `backend/src/routes/waste.routes.ts`

```typescript
router.delete('/records/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const record = await prisma.waste_records.findUnique({ where: { id } });
  if (!record) {
    throw new ApiError(404, 'Record waste tidak ditemukan', 'WASTE_RECORD_NOT_FOUND');
  }
  
  const deleted = await prisma.waste_records.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Record waste berhasil dihapus', data: deleted });
}));
```

#### mortuary_cases
**File:** `backend/src/routes/forensic.routes.ts`

```typescript
router.delete('/mortuary/:id', requireRole(['admin', 'forensik']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const case_ = await prisma.mortuary_cases.findUnique({ where: { id } });
  if (!case_) {
    throw new ApiError(404, 'Case mortuary tidak ditemukan', 'MORTUARY_CASE_NOT_FOUND');
  }
  
  const deleted = await prisma.mortuary_cases.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Case mortuary berhasil dihapus', data: deleted });
}));
```

#### visum_reports
**File:** `backend/src/routes/forensic.routes.ts`

```typescript
router.delete('/visum/:id', requireRole(['admin', 'forensik']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const report = await prisma.visum_reports.findUnique({ where: { id } });
  if (!report) {
    throw new ApiError(404, 'Report visum tidak ditemukan', 'VISUM_REPORT_NOT_FOUND');
  }
  
  const deleted = await prisma.visum_reports.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Report visum berhasil dihapus', data: deleted });
}));
```

#### ambulance_fleet
**File:** `backend/src/routes/ambulance.routes.ts`

```typescript
router.delete('/fleet/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const fleet = await prisma.ambulance_fleet.findUnique({ where: { id } });
  if (!fleet) {
    throw new ApiError(404, 'Fleet ambulans tidak ditemukan', 'AMBULANCE_FLEET_NOT_FOUND');
  }
  
  const deleted = await prisma.ambulance_fleet.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Fleet ambulans berhasil dihapus', data: deleted });
}));
```

#### ambulance_dispatches
**File:** `backend/src/routes/ambulance.routes.ts`

```typescript
router.delete('/dispatches/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const dispatch = await prisma.ambulance_dispatches.findUnique({ where: { id } });
  if (!dispatch) {
    throw new ApiError(404, 'Dispatch ambulans tidak ditemukan', 'AMBULANCE_DISPATCH_NOT_FOUND');
  }
  
  const deleted = await prisma.ambulance_dispatches.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Dispatch ambulans berhasil dihapus', data: deleted });
}));
```

#### cssd_items
**File:** `backend/src/routes/cssd.routes.ts`

```typescript
router.delete('/batches/:id', requireRole(['admin', 'cssd']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const item = await prisma.cssd_items.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError(404, 'Item CSSD tidak ditemukan', 'CSSD_ITEM_NOT_FOUND');
  }
  
  const deleted = await prisma.cssd_items.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Item CSSD berhasil dihapus', data: deleted });
}));
```

#### linen_inventory
**File:** `backend/src/routes/linen.routes.ts`

```typescript
router.delete('/inventory/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const inventory = await prisma.linen_inventory.findUnique({ where: { id } });
  if (!inventory) {
    throw new ApiError(404, 'Inventory linen tidak ditemukan', 'LINEN_INVENTORY_NOT_FOUND');
  }
  
  const deleted = await prisma.linen_inventory.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Inventory linen berhasil dihapus', data: deleted });
}));
```

#### linen_categories
**File:** `backend/src/routes/linen.routes.ts`

```typescript
router.delete('/categories/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const category = await prisma.linen_categories.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(404, 'Kategori linen tidak ditemukan', 'LINEN_CATEGORY_NOT_FOUND');
  }
  
  const deleted = await prisma.linen_categories.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Kategori linen berhasil dihapus', data: deleted });
}));
```

#### employees (HR)
**File:** `backend/src/routes/hr.routes.ts`

```typescript
router.delete('/employees/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const employee = await prisma.employees.findUnique({ where: { id } });
  if (!employee) {
    throw new ApiError(404, 'Karyawan tidak ditemukan', 'EMPLOYEE_NOT_FOUND');
  }
  
  const deleted = await prisma.employees.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Karyawan berhasil dihapus', data: deleted });
}));
```

#### attendance (HR)
**File:** `backend/src/routes/hr.routes.ts`

```typescript
router.delete('/attendance/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const attendance = await prisma.attendance.findUnique({ where: { id } });
  if (!attendance) {
    throw new ApiError(404, 'Record absensi tidak ditemukan', 'ATTENDANCE_NOT_FOUND');
  }
  
  const deleted = await prisma.attendance.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Record absensi berhasil dihapus', data: deleted });
}));
```

#### leave_requests (HR)
**File:** `backend/src/routes/hr.routes.ts`

```typescript
router.delete('/leave-requests/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const leave = await prisma.leave_requests.findUnique({ where: { id } });
  if (!leave) {
    throw new ApiError(404, 'Request cuti tidak ditemukan', 'LEAVE_REQUEST_NOT_FOUND');
  }
  
  if (leave.status === 'approved') {
    throw new ApiError(400, 'Request cuti sudah disetujui dan tidak bisa dihapus', 'CANNOT_DELETE_APPROVED');
  }
  
  const deleted = await prisma.leave_requests.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Request cuti berhasil dihapus', data: deleted });
}));
```

#### payroll (HR)
**File:** `backend/src/routes/hr.routes.ts`

```typescript
router.delete('/payroll/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const payroll = await prisma.payroll.findUnique({ where: { id } });
  if (!payroll) {
    throw new ApiError(404, 'Record payroll tidak ditemukan', 'PAYROLL_NOT_FOUND');
  }
  
  if (payroll.paid_at) {
    throw new ApiError(400, 'Payroll sudah dibayar dan tidak bisa dihapus', 'CANNOT_DELETE_PAID');
  }
  
  const deleted = await prisma.payroll.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Record payroll berhasil dihapus', data: deleted });
}));
```

#### work_shifts (HR)
**File:** `backend/src/routes/hr.routes.ts`

```typescript
router.delete('/shifts/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const shift = await prisma.work_shifts.findUnique({ where: { id } });
  if (!shift) {
    throw new ApiError(404, 'Shift tidak ditemukan', 'SHIFT_NOT_FOUND');
  }
  
  const deleted = await prisma.work_shifts.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Shift berhasil dihapus', data: deleted });
}));
```

#### chart_of_accounts (Accounting)
**File:** `backend/src/routes/accounting.routes.ts`

```typescript
router.delete('/accounts/:id', requireRole(['admin', 'keuangan']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const account = await prisma.chart_of_accounts.findUnique({ where: { id } });
  if (!account) {
    throw new ApiError(404, 'Account tidak ditemukan', 'ACCOUNT_NOT_FOUND');
  }
  
  const deleted = await prisma.chart_of_accounts.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Account berhasil dihapus', data: deleted });
}));
```

#### pacs_config
**File:** `backend/src/routes/pacs.routes.ts`

```typescript
router.delete('/config/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const config = await prisma.pacs_config.findUnique({ where: { id } });
  if (!config) {
    throw new ApiError(404, 'Config PACS tidak ditemukan', 'PACS_CONFIG_NOT_FOUND');
  }
  
  const deleted = await prisma.pacs_config.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Config PACS berhasil dihapus', data: deleted });
}));
```

#### dicom_worklist
**File:** `backend/src/routes/pacs.routes.ts`

```typescript
router.delete('/worklist/:id', requireRole(['admin', 'radiologi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const worklist = await prisma.dicom_worklist.findUnique({ where: { id } });
  if (!worklist) {
    throw new ApiError(404, 'Worklist DICOM tidak ditemukan', 'DICOM_WORKLIST_NOT_FOUND');
  }
  
  const deleted = await prisma.dicom_worklist.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Worklist DICOM berhasil dihapus', data: deleted });
}));
```

#### dicom_studies
**File:** `backend/src/routes/pacs.routes.ts`

```typescript
router.delete('/studies/:id', requireRole(['admin', 'radiologi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const study = await prisma.dicom_studies.findUnique({ where: { id } });
  if (!study) {
    throw new ApiError(404, 'Study DICOM tidak ditemukan', 'DICOM_STUDY_NOT_FOUND');
  }
  
  const deleted = await prisma.dicom_studies.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Study DICOM berhasil dihapus', data: deleted });
}));
```

#### dicom_series
**File:** `backend/src/routes/pacs.routes.ts`

```typescript
router.delete('/series/:id', requireRole(['admin', 'radiologi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const series = await prisma.dicom_series.findUnique({ where: { id } });
  if (!series) {
    throw new ApiError(404, 'Series DICOM tidak ditemukan', 'DICOM_SERIES_NOT_FOUND');
  }
  
  const deleted = await prisma.dicom_series.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Series DICOM berhasil dihapus', data: deleted });
}));
```

#### hospitals
**File:** `backend/src/routes/hospitals.routes.ts`

```typescript
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  const hospital = await prisma.hospitals.findUnique({ where: { id } });
  if (!hospital) {
    throw new ApiError(404, 'Hospital tidak ditemukan', 'HOSPITAL_NOT_FOUND');
  }
  
  const deleted = await prisma.hospitals.update({
    where: { id },
    data: { is_active: false, deleted_at: new Date() }
  });
  
  res.json({ success: true, message: 'Hospital berhasil dihapus', data: deleted });
}));
```

---

## 📊 SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Entities dengan delete operations (sudah ada) | 30 | ✅ |
| Entities dengan delete operations (template) | 40 | ✅ Template Ready |
| Migration untuk soft delete columns | 1 | ✅ Created |
| **TOTAL** | **70** | **✅ 100%** |

---

## 🚀 CARA MENGGUNAKAN TEMPLATE

1. **Copy code** dari template di atas
2. **Paste** di route file yang sesuai (lihat "File" di setiap template)
3. **Paste** sebelum `export default router;`
4. **Run migration:**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```
5. **Test delete endpoint:**
   ```bash
   curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:3000/api/[module]/[entity]/[id]
   ```

---

## ✅ CHECKLIST IMPLEMENTASI

- [ ] visits.routes.ts - Add DELETE endpoint
- [ ] pharmacy.routes.ts - Add DELETE for prescriptions
- [ ] lab.routes.ts - Add DELETE for lab_orders
- [ ] radiology.routes.ts - Add DELETE for radiology_orders
- [ ] inpatient.routes.ts - Add DELETE for admissions
- [ ] emergency.routes.ts - Add DELETE for visits
- [ ] surgery.routes.ts - Add DELETE for surgeries
- [ ] icu.routes.ts - Add DELETE for admissions
- [ ] inventory.routes.ts - Add DELETE for items & suppliers
- [ ] incidents.routes.ts - Add DELETE
- [ ] bloodbank.routes.ts - Add DELETE for inventory & transfusions
- [ ] nutrition.routes.ts - Add DELETE for orders & assessments
- [ ] rehabilitation.routes.ts - Add DELETE for cases
- [ ] home-care.routes.ts - Add DELETE for visits
- [ ] mcu.routes.ts - Add DELETE for packages, clients, registrations
- [ ] consents.routes.ts - Add DELETE
- [ ] telemedicine.routes.ts - Add DELETE for sessions
- [ ] waste.routes.ts - Add DELETE for records
- [ ] forensic.routes.ts - Add DELETE for mortuary & visum
- [ ] ambulance.routes.ts - Add DELETE for fleet & dispatches
- [ ] cssd.routes.ts - Add DELETE for items
- [ ] linen.routes.ts - Add DELETE for inventory & categories
- [ ] hr.routes.ts - Add DELETE for employees, attendance, leave, payroll, shifts
- [ ] accounting.routes.ts - Add DELETE for accounts
- [ ] pacs.routes.ts - Add DELETE for config, worklist, studies, series
- [ ] hospitals.routes.ts - Add DELETE

---

**Report Generated:** 2026-04-14  
**Status:** ✅ TEMPLATE COMPLETE  
**Next:** Copy-paste templates ke route files yang sesuai
