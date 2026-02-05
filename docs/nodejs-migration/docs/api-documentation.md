# SIMRS ZEN - API Documentation

## Overview

REST API for SIMRS ZEN Hospital Information System. All endpoints require authentication unless otherwise specified.

**Base URL:** `https://api.your-hospital.com/api`

**Authentication:** Bearer Token (JWT)

```
Authorization: Bearer <your_access_token>
```

---

## Authentication

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@hospital.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@hospital.com",
      "fullName": "Dr. John Doe",
      "roles": ["doctor"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800
  }
}
```

### POST /auth/refresh

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### POST /auth/logout

Logout current user.

### GET /auth/me

Get current user information.

---

## Patients

### GET /patients

List patients with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| search | string | Search by name, MRN, or NIK |
| status | string | Filter by status |

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### POST /patients

Create new patient.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "identityType": "ktp",
  "identityNumber": "1234567890123456",
  "phone": "081234567890",
  "address": "Jl. Example No. 123",
  "bloodType": "O+",
  "allergies": ["Penicillin"]
}
```

### GET /patients/:id

Get patient details.

### PUT /patients/:id

Update patient.

### DELETE /patients/:id

Soft delete patient (admin only).

### GET /patients/:id/visits

Get patient visit history.

### GET /patients/:id/medical-records

Get patient medical records.

---

## Visits

### GET /visits

List visits with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| date | string | Filter by date (YYYY-MM-DD) |
| doctorId | uuid | Filter by doctor |
| departmentId | uuid | Filter by department |
| status | string | Filter by status |
| visitType | string | outpatient, inpatient, emergency |

### POST /visits

Register new visit.

**Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "departmentId": "uuid",
  "visitType": "outpatient",
  "paymentType": "bpjs",
  "chiefComplaint": "Demam 3 hari",
  "insuranceNumber": "0001234567890"
}
```

### GET /visits/:id

Get visit details with medical records.

### PATCH /visits/:id/status

Update visit status.

---

## Billing

### GET /billing

List billing records.

### POST /billing

Create new billing.

**Request Body:**
```json
{
  "visitId": "uuid",
  "patientId": "uuid",
  "paymentType": "umum",
  "items": [
    {
      "itemName": "Konsultasi Dokter Spesialis",
      "itemType": "service",
      "quantity": 1,
      "unitPrice": 150000
    }
  ],
  "discount": 0,
  "tax": 0
}
```

### GET /billing/:id

Get billing details with items.

### POST /billing/:id/pay

Process payment.

**Request Body:**
```json
{
  "paymentMethod": "cash",
  "amountPaid": 500000
}
```

### GET /billing/:id/receipt

Generate receipt PDF.

---

## Pharmacy

### GET /pharmacy/prescriptions

List prescriptions.

### POST /pharmacy/prescriptions

Create prescription.

### PATCH /pharmacy/prescriptions/:id/dispense

Dispense medication.

### GET /pharmacy/inventory

Get medicine inventory.

### POST /pharmacy/inventory/adjust

Adjust stock.

---

## Laboratory

### GET /lab/orders

List lab orders.

### POST /lab/orders

Create lab order.

**Request Body:**
```json
{
  "visitId": "uuid",
  "patientId": "uuid",
  "tests": [
    { "testId": "uuid", "priority": "routine" }
  ],
  "clinicalNotes": "Suspect anemia"
}
```

### POST /lab/orders/:id/results

Submit lab results.

### GET /lab/orders/:id

Get order with results.

---

## BPJS Integration

### GET /bpjs/peserta/:noKartu

Check BPJS membership.

### POST /bpjs/sep

Create SEP (Surat Eligibilitas Peserta).

### GET /bpjs/referensi/diagnosa/:keyword

Search ICD-10 diagnosis codes.

### GET /bpjs/referensi/poli

Get clinic/department reference.

### POST /bpjs/eclaim/klaim

Submit e-claim.

---

## SATU SEHAT Integration

### GET /satusehat/status

Check SATU SEHAT connection status.

### POST /satusehat/patient

Create/update patient resource.

### POST /satusehat/encounter

Submit encounter bundle.

### POST /satusehat/condition

Submit diagnosis/condition.

### POST /satusehat/observation

Submit observation (vital signs, lab results).

---

## Emergency (IGD)

### GET /emergency/dashboard

Emergency department dashboard.

### POST /emergency/triage

Register emergency patient with triage.

### GET /emergency/queue

Get emergency queue sorted by triage priority.

### PATCH /emergency/:id/assign

Assign doctor to case.

### POST /emergency/:id/disposition

Set case disposition (admit, discharge, transfer).

---

## ICU

### GET /icu/dashboard

ICU dashboard with bed status.

### POST /icu/admissions

Admit patient to ICU.

### GET /icu/patients

List current ICU patients.

### POST /icu/:admissionId/vitals

Record vital signs.

### POST /icu/:admissionId/ventilator

Record ventilator settings.

### POST /icu/:admissionId/discharge

Discharge from ICU.

---

## Surgery

### GET /surgery/dashboard

Surgery department dashboard.

### POST /surgery/schedule

Schedule surgery.

### GET /surgery/schedule

Get surgery schedule.

### PATCH /surgery/:id/start

Start surgery.

### POST /surgery/:id/complete

Complete surgery.

### POST /surgery/:id/anesthesia-record

Add anesthesia record.

### GET /surgery/operating-rooms

Get OR status.

---

## Radiology

### GET /radiology/dashboard

Radiology dashboard.

### POST /radiology/orders

Create radiology order.

### GET /radiology/worklist

Get radiology worklist.

### POST /radiology/orders/:id/result

Submit interpretation.

---

## Inpatient

### GET /inpatient/dashboard

Inpatient dashboard with BOR.

### GET /inpatient/beds

Get bed availability.

### POST /inpatient/admissions

Admit patient.

### POST /inpatient/:admissionId/transfer

Transfer patient.

### POST /inpatient/:admissionId/discharge

Discharge patient.

---

## Human Resources

### GET /hr/employees

List employees.

### POST /hr/attendance

Record attendance.

### GET /hr/leave-requests

List leave requests.

### POST /hr/payroll/calculate

Calculate payroll.

---

## Inventory

### GET /inventory/stock

Get inventory stock.

### POST /inventory/purchase-orders

Create purchase order.

### POST /inventory/transactions

Record stock transaction.

---

## Reports

### GET /reports/rl1

Generate RL1 report (bed statistics).

### GET /reports/rl3

Generate RL3 report (morbidity).

### GET /reports/rl4

Generate RL4 report (services).

### GET /reports/rl5

Generate RL5 report (visitors).

### GET /reports/financial

Generate financial reports.

---

## WebSocket Events

Connect to: `wss://api.your-hospital.com`

### Client Events (Emit)

| Event | Description | Payload |
|-------|-------------|---------|
| chat:join_room | Join chat room | `{ roomId }` |
| chat:send_message | Send message | `{ roomId, content, messageType }` |
| chat:typing | User is typing | `roomId` |
| queue:subscribe | Subscribe to queue updates | `departmentId` |
| queue:call_next | Call next patient | `{ departmentId, counterId }` |
| department:join | Join department channel | `departmentCode` |
| emergency:alert | Broadcast emergency alert | `{ type, message, patientId }` |

### Server Events (Listen)

| Event | Description |
|-------|-------------|
| chat:new_message | New chat message received |
| chat:user_typing | User is typing indicator |
| notification:new | New notification |
| queue:patient_called | Patient called in queue |
| queue:announce | Queue announcement for TTS |
| emergency:broadcast | Emergency alert broadcast |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Invalid data format |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- Report endpoints: 20 requests per hour

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
