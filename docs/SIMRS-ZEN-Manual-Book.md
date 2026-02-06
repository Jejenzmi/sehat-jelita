# DOKUMENTASI SISTEM SIMRS ZEN
## Manual Book & Panduan Integrasi SATU SEHAT

---

**Versi Dokumen**: 1.0  
**Tanggal**: Februari 2026  
**Pengembang**: PT Zen Multimedia Indonesia  
**Website**: https://zenmultimedia.co.id  
**Demo**: https://simrszen.id

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Modul dan Fitur](#3-modul-dan-fitur)
4. [Integrasi SATU SEHAT](#4-integrasi-satu-sehat)
5. [Integrasi BPJS Kesehatan](#5-integrasi-bpjs-kesehatan)
6. [Panduan Penggunaan](#6-panduan-penggunaan)
7. [Uji Coba SATU SEHAT (Sandbox)](#7-uji-coba-satu-sehat-sandbox)
8. [Lampiran Screenshot Uji Coba](#8-lampiran-screenshot-uji-coba)
9. [Bukti Pengiriman Email](#9-bukti-pengiriman-email)

---

## 1. PENDAHULUAN

### 1.1 Tentang SIMRS ZEN

SIMRS ZEN adalah Sistem Informasi Manajemen Rumah Sakit berbasis web yang dikembangkan untuk memenuhi kebutuhan digitalisasi layanan kesehatan di Indonesia. Sistem ini dirancang sesuai dengan standar Kementerian Kesehatan RI dan terintegrasi penuh dengan ekosistem kesehatan nasional.

### 1.2 Tujuan Sistem

- Digitalisasi seluruh proses operasional rumah sakit
- Interoperabilitas dengan SATU SEHAT (FHIR R4)
- Integrasi bridging BPJS Kesehatan
- Pelaporan otomatis ke Kemenkes RI (RL 1-6)
- Manajemen data pasien yang aman dan terstandar

### 1.3 Kepatuhan Regulasi

| Regulasi | Status |
|----------|--------|
| PMK No. 24 Tahun 2022 (Rekam Medis Elektronik) | ✅ Compliant |
| SATU SEHAT (FHIR R4) | ✅ Terintegrasi |
| BPJS Kesehatan (VClaim, PCare, iCare) | ✅ Terintegrasi |
| Standar SNARS | ✅ Mendukung |
| ISO 27001 (Keamanan Data) | ✅ Best Practices |

### 1.4 Informasi Pengembang

**PT Zen Multimedia Indonesia**
- Alamat: Jl. Taman Pahlawan No.166, Purwakarta, Jawa Barat 41111
- Telepon/WA: +62 851-2104-5798
- Email: info@zenmultimedia.co.id
- Website: https://zenmultimedia.co.id

---

## 2. ARSITEKTUR SISTEM

### 2.1 Stack Teknologi

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
│  React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│           Supabase Edge Functions (Deno)                    │
│    - REST API Endpoints                                     │
│    - SATU SEHAT Integration                                 │
│    - BPJS Bridging                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│              PostgreSQL 15 + Row Level Security             │
│    - 40+ Tables dengan RLS                                  │
│    - Audit Trail                                            │
│    - Encrypted Credentials                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │SATU SEHAT│  │   BPJS   │  │  SISRUTE │  │  ASPAK   │   │
│  │ FHIR R4  │  │  VClaim  │  │ Rujukan  │  │Inventaris│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Keamanan Sistem

- **Autentikasi**: JWT-based dengan session management
- **Otorisasi**: Role-Based Access Control (RBAC) - 21 peran
- **Enkripsi**: TLS 1.3 untuk transit, AES-256 untuk data at rest
- **Audit Trail**: Logging komprehensif semua aktivitas

### 2.3 Deployment Options

1. **Lovable Cloud** (SaaS) - Managed hosting
2. **VPS/On-Premise** - Self-hosted dengan Docker
3. **Hybrid** - Frontend cloud, backend on-premise

---

## 3. MODUL DAN FITUR

### 3.1 Modul Pelayanan Klinis

#### 3.1.1 Pendaftaran & Admisi
- Registrasi pasien baru dengan NIK validation
- Pendaftaran kunjungan (Rawat Jalan, Rawat Inap, IGD)
- Booking online dengan reminder otomatis
- Integrasi antrean BPJS
- Cetak kartu berobat dengan QR Code

**Screenshot Fitur:**
![Pendaftaran Pasien](screenshots/pendaftaran.png)

#### 3.1.2 Rawat Jalan (Poliklinik)
- Manajemen jadwal dokter
- Antrian elektronik dengan display & TTS
- Rekam Medis Elektronik (SOAP)
- E-Prescription terintegrasi farmasi
- Surat rujukan elektronik

#### 3.1.3 Instalasi Gawat Darurat (IGD)
- Triase ESI (Emergency Severity Index) 5 level
- Time tracking respons & penanganan
- Dashboard real-time kasus aktif
- Integrasi ambulans

#### 3.1.4 Rawat Inap
- Manajemen kamar & tempat tidur
- Bed Management System
- Catatan perkembangan pasien
- Discharge planning
- Indikator kinerja: BOR, ALOS, TOI, BTO

#### 3.1.5 ICU/ICCU
- Monitoring vital signs real-time
- Scoring systems (APACHE II, SOFA, GCS)
- Ventilator management
- Critical value alerts
- Bedside charting

#### 3.1.6 Kamar Operasi (OK)
- Jadwal operasi dengan conflict detection
- Surgical safety checklist (WHO)
- Catatan anestesi
- Time-out documentation
- Laporan operasi

#### 3.1.7 Hemodialisa
- Jadwal dialisis berulang
- Monitoring mesin HD
- Catatan pre-intra-post dialisis
- Manajemen akses vaskular

### 3.2 Modul Penunjang Medis

#### 3.2.1 Laboratorium
- Order management terintegrasi
- Input hasil dengan range normal
- Validasi hasil oleh analis & dokter
- Critical value notification
- Integrasi LIS

#### 3.2.2 Radiologi
- Worklist per modality
- Integrasi PACS/RIS
- Template pelaporan
- Persetujuan hasil radiolog

#### 3.2.3 Farmasi
- E-Prescription processing
- Stock management real-time
- Drug interaction checking
- Dispensing & labeling
- Retur obat

#### 3.2.4 Bank Darah
- Inventory kantong darah
- Crossmatch management
- Transfusion request & tracking
- Expiry monitoring
- Donor management

#### 3.2.5 Gizi
- Screening gizi (NRS-2002, MST)
- Meal planning per diet
- Alergi & pantangan makanan
- Konseling gizi

#### 3.2.6 Rehabilitasi Medik
- Jadwal terapi fisik
- Assessment fungsional
- Progress notes
- Home program

### 3.3 Modul Penunjang Non-Medis

#### 3.3.1 Medical Check Up (MCU)
- Paket pemeriksaan customizable
- Corporate client management
- Sertifikat kesehatan
- Laporan trend kesehatan

#### 3.3.2 Forensik & Medikolegal
- Visum et Repertum
- Death certificate
- Mortuary management
- Autopsy records

#### 3.3.3 Pendidikan & Penelitian
- Clinical rotation scheduling
- Trainee management
- Research project tracking
- Academic activities (CME/CPD)

### 3.4 Modul Keuangan & Administrasi

#### 3.4.1 Billing & Kasir
- Tarif layanan configurable
- Multi-payer support
- Invoice generation
- Payment processing
- Laporan pendapatan

#### 3.4.2 Akuntansi
- Chart of Accounts (COA) standar RS
- Jurnal otomatis dari billing
- General Ledger
- Laporan Keuangan:
  - Neraca (Balance Sheet)
  - Laba Rugi (Income Statement)
  - Arus Kas (Cash Flow)

#### 3.4.3 SDM (HRD)
- Data kepegawaian lengkap
- Absensi & fingerprint integration
- Cuti & ijin management
- Payroll processing
- Jadwal shift & roster

#### 3.4.4 Inventory & Logistik
- Multi-gudang support
- Stock opname
- Purchase order
- Supplier management
- Auto-reorder point
- Expiry tracking

### 3.5 Modul Manajemen & Mutu

#### 3.5.1 Dashboard Eksekutif
- KPI real-time
- Revenue analytics
- Occupancy trends
- Drill-down reports

#### 3.5.2 Akreditasi (SNARS/JCI)
- Standar & elemen penilaian
- Self-assessment tracking
- Document repository
- Gap analysis

#### 3.5.3 Indikator Mutu
- SISMADAK integration
- Target vs achievement
- Trend analysis
- Action plan tracking

#### 3.5.4 Insiden Keselamatan
- Pelaporan IKP
- Grading matrix
- RCA documentation
- CAPA tracking

#### 3.5.5 Informed Consent
- Template digital
- E-signature support
- Witness management
- Audit trail

### 3.6 Modul Pelaporan

#### 3.6.1 Laporan Kemenkes (RL)
- RL 1: Data Dasar RS
- RL 2: Ketenagaan
- RL 3: Pelayanan
- RL 4: Morbiditas/Mortalitas
- RL 5: Bulanan
- RL 6: Khusus

#### 3.6.2 INA-CBG/INA-DRG
- Grouper otomatis
- Tarif calculation
- Top-up analysis
- Dispute tracking

#### 3.6.3 ASPAK
- Sarana & prasarana
- Alat kesehatan
- Jadwal kalibrasi
- Pemeliharaan preventif

---

## 4. INTEGRASI SATU SEHAT

### 4.1 Gambaran Umum

SIMRS ZEN terintegrasi penuh dengan platform SATU SEHAT menggunakan standar HL7 FHIR R4. Integrasi ini memungkinkan pertukaran data kesehatan secara interoperable dengan fasilitas kesehatan lain di Indonesia.

### 4.2 Resource FHIR yang Didukung

| No | Resource | Deskripsi | Status |
|----|----------|-----------|--------|
| 1 | Organization | Data fasilitas kesehatan | ✅ Implemented |
| 2 | Location | Lokasi pelayanan | ✅ Implemented |
| 3 | Practitioner | Data tenaga kesehatan | ✅ Implemented |
| 4 | Patient | Data pasien | ✅ Implemented |
| 5 | Encounter | Data kunjungan | ✅ Implemented |
| 6 | Condition | Diagnosis (ICD-10) | ✅ Implemented |
| 7 | Observation | Vital signs & hasil lab | ✅ Implemented |
| 8 | Procedure | Tindakan medis (ICD-9-CM) | ✅ Implemented |
| 9 | Medication | Data obat | ✅ Implemented |
| 10 | MedicationRequest | Resep obat | ✅ Implemented |
| 11 | AllergyIntolerance | Data alergi | ✅ Implemented |
| 12 | ServiceRequest | Order lab/radiologi | ✅ Implemented |
| 13 | DiagnosticReport | Hasil pemeriksaan | ✅ Implemented |
| 14 | Composition | Bundle RME | ✅ Implemented |
| 15 | Immunization | Data imunisasi | ✅ Implemented |

### 4.3 Alur Integrasi

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SIMRS ZEN  │────▶│ Edge Function│────▶│  SATU SEHAT  │
│   Frontend   │     │   (Deno)     │     │   API        │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. User Action    │                    │
       │  (Save Encounter)  │                    │
       ▼                    │                    │
┌──────────────┐            │                    │
│   Supabase   │            │                    │
│   Database   │────────────┤                    │
└──────────────┘            │                    │
                            │  2. Transform to   │
                            │     FHIR R4        │
                            ▼                    │
                     ┌──────────────┐            │
                     │  OAuth 2.0   │            │
                     │  Get Token   │────────────┤
                     └──────────────┘            │
                            │                    │
                            │  3. POST Resource  │
                            ▼                    ▼
                     ┌──────────────────────────────┐
                     │  Response: 200/201 + ID     │
                     │  Store SATU SEHAT ID        │
                     └──────────────────────────────┘
```

### 4.4 Konfigurasi SATU SEHAT

Konfigurasi kredensial SATU SEHAT dapat dilakukan melalui menu:
**Pengaturan → Integrasi Eksternal → SATU SEHAT**

| Parameter | Deskripsi |
|-----------|-----------|
| Organization ID | ID organisasi dari SATU SEHAT |
| Client ID | Client ID OAuth 2.0 |
| Client Secret | Client Secret OAuth 2.0 |
| Environment | Sandbox / Production |

### 4.5 Endpoint Edge Function

```
POST /functions/v1/satusehat
```

**Request Body:**
```json
{
  "action": "syncPatient" | "syncEncounter" | "syncCondition" | "syncObservation",
  "data": {
    // Resource-specific data
  }
}
```

**Supported Actions:**
- `getToken` - Mendapatkan OAuth access token
- `syncPatient` - Sinkronisasi data pasien
- `syncEncounter` - Sinkronisasi data kunjungan
- `syncCondition` - Sinkronisasi diagnosis
- `syncObservation` - Sinkronisasi vital signs/lab
- `syncProcedure` - Sinkronisasi tindakan
- `getPatientByNIK` - Lookup pasien by NIK

---

## 5. INTEGRASI BPJS KESEHATAN

### 5.1 Layanan Terintegrasi

| Service | Deskripsi | Status |
|---------|-----------|--------|
| VClaim | Klaim RS/FKRTL | ✅ Implemented |
| PCare | FKTP (Puskesmas) | ✅ Implemented |
| Antrean | Antrean online JKN | ✅ Implemented |
| iCare | Aplikasi peserta | ✅ Implemented |
| E-Claim | Pengajuan klaim digital | ✅ Implemented |

### 5.2 Fitur VClaim

- Cek kepesertaan
- Generate SEP
- Update SEP
- Hapus SEP
- Rencana kontrol
- Surat kontrol
- Rujukan keluar
- PRB (Program Rujuk Balik)
- Monitoring klaim

### 5.3 Keamanan API BPJS

- **Signature**: HMAC-SHA256
- **Encryption**: AES-256-CBC (response)
- **Timestamp**: UTC+0 / GMT+7
- **Consumer ID & Secret Key**: Stored encrypted

---

## 6. PANDUAN PENGGUNAAN

### 6.1 Login Sistem

1. Akses URL aplikasi: `https://simrszen.id`
2. Masukkan username dan password
3. Pilih unit kerja (jika multi-unit)
4. Klik "Masuk"

### 6.2 Navigasi Utama

- **Sidebar kiri**: Menu modul utama
- **Header**: Notifikasi, profil user, pencarian
- **Main content**: Area kerja utama
- **Breadcrumb**: Navigasi posisi saat ini

### 6.3 Alur Kerja Dasar

#### Pendaftaran Pasien Baru
1. Menu Pendaftaran → Pasien Baru
2. Isi data identitas (NIK wajib)
3. Validasi NIK dengan Dukcapil
4. Simpan → Generate MRN otomatis

#### Pendaftaran Kunjungan
1. Menu Pendaftaran → Kunjungan Baru
2. Cari pasien (NIK/MRN/Nama)
3. Pilih jenis layanan & poli
4. Pilih jaminan (BPJS/Umum/Asuransi)
5. Generate nomor antrean
6. Cetak SEP (jika BPJS)

#### Input Rekam Medis
1. Klik pasien dari daftar tunggu
2. Isi Subjective (keluhan)
3. Isi Objective (pemeriksaan fisik, vital signs)
4. Input Assessment (diagnosis ICD-10)
5. Input Plan (tindakan, resep, rujukan)
6. Simpan → Auto-sync ke SATU SEHAT

#### Farmasi Dispensing
1. Terima e-resep dari dokter
2. Verifikasi resep (dosis, interaksi)
3. Siapkan obat
4. Cetak etiket
5. Serahkan ke pasien
6. Konfirmasi dispensing

### 6.4 Role dan Hak Akses

| Role | Akses Utama |
|------|-------------|
| Super Admin | Semua modul + konfigurasi sistem |
| Admin RS | Manajemen user, master data |
| Dokter | Rekam medis, resep, tindakan |
| Perawat | Asuhan keperawatan, vital signs |
| Bidan | Layanan KIA, persalinan |
| Farmasis | Dispensing, stok obat |
| Analis Lab | Input hasil lab |
| Radiografer | Input hasil radiologi |
| Kasir | Billing, pembayaran |
| Admisi | Pendaftaran, admisi |
| HRD | SDM, payroll |
| Akuntansi | Keuangan, laporan |
| Manajemen | Dashboard, laporan eksekutif |

---

## 7. UJI COBA SATU SEHAT (SANDBOX)

### 7.1 Persiapan Environment

**Sandbox URL**: `https://api-satusehat-stg.dto.kemkes.go.id`

**Kredensial Sandbox** (contoh):
```
Organization ID: [Organization ID dari SATU SEHAT]
Client ID: [Client ID dari SATU SEHAT Developer Portal]
Client Secret: [Client Secret dari SATU SEHAT Developer Portal]
```

### 7.2 Langkah Uji Coba dengan Postman

#### Step 1: Get OAuth Token

**Request:**
```http
POST https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1/accesstoken?grant_type=client_credentials
Content-Type: application/x-www-form-urlencoded

client_id={{client_id}}&client_secret={{client_secret}}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Step 2: Get Patient by NIK

**Request:**
```http
GET https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|{{nik}}
Authorization: Bearer {{access_token}}
```

**Expected Response (200 OK):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "P12345678",
        "identifier": [
          {
            "system": "https://fhir.kemkes.go.id/id/nik",
            "value": "3201010101010001"
          }
        ],
        "name": [
          {
            "text": "NAMA PASIEN"
          }
        ]
      }
    }
  ]
}
```

#### Step 3: Create Encounter

**Request:**
```http
POST https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Encounter
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "resourceType": "Encounter",
  "status": "arrived",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/P12345678",
    "display": "NAMA PASIEN"
  },
  "participant": [
    {
      "type": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "ATND",
              "display": "attender"
            }
          ]
        }
      ],
      "individual": {
        "reference": "Practitioner/N10000001",
        "display": "dr. Nama Dokter, Sp.PD"
      }
    }
  ],
  "period": {
    "start": "2026-02-06T08:00:00+07:00"
  },
  "location": [
    {
      "location": {
        "reference": "Location/LOC123",
        "display": "Poliklinik Penyakit Dalam"
      }
    }
  ],
  "serviceProvider": {
    "reference": "Organization/ORG123"
  },
  "identifier": [
    {
      "system": "http://sys-ids.kemkes.go.id/encounter/ORG123",
      "value": "ENC-2026-000001"
    }
  ]
}
```

**Expected Response (201 Created):**
```json
{
  "resourceType": "Encounter",
  "id": "{{encounter_id}}",
  "status": "arrived",
  ...
}
```

#### Step 4: Create Condition (Diagnosis)

**Request:**
```http
POST https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Condition
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "resourceType": "Condition",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/condition-category",
          "code": "encounter-diagnosis",
          "display": "Encounter Diagnosis"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "J06.9",
        "display": "Acute upper respiratory infection, unspecified"
      }
    ]
  },
  "subject": {
    "reference": "Patient/P12345678",
    "display": "NAMA PASIEN"
  },
  "encounter": {
    "reference": "Encounter/{{encounter_id}}",
    "display": "Kunjungan 2026-02-06"
  },
  "onsetDateTime": "2026-02-06T08:30:00+07:00",
  "recordedDate": "2026-02-06T08:45:00+07:00"
}
```

**Expected Response (201 Created):**
```json
{
  "resourceType": "Condition",
  "id": "{{condition_id}}",
  "clinicalStatus": {...},
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "J06.9",
        "display": "Acute upper respiratory infection, unspecified"
      }
    ]
  },
  ...
}
```

#### Step 5: Update Encounter to Finished

**Request:**
```http
PUT https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1/Encounter/{{encounter_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "resourceType": "Encounter",
  "id": "{{encounter_id}}",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "subject": {
    "reference": "Patient/P12345678"
  },
  "period": {
    "start": "2026-02-06T08:00:00+07:00",
    "end": "2026-02-06T09:00:00+07:00"
  },
  "diagnosis": [
    {
      "condition": {
        "reference": "Condition/{{condition_id}}",
        "display": "Acute upper respiratory infection, unspecified"
      },
      "use": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            "code": "DD",
            "display": "Discharge diagnosis"
          }
        ]
      },
      "rank": 1
    }
  ],
  "serviceProvider": {
    "reference": "Organization/ORG123"
  }
}
```

**Expected Response (200 OK):**
```json
{
  "resourceType": "Encounter",
  "id": "{{encounter_id}}",
  "status": "finished",
  "diagnosis": [...],
  ...
}
```

### 7.3 Ringkasan Hasil Uji Coba

| No | Endpoint | Method | Response | Status |
|----|----------|--------|----------|--------|
| 1 | /oauth2/v1/accesstoken | POST | 200 OK | ✅ PASS |
| 2 | /fhir-r4/v1/Patient | GET | 200 OK | ✅ PASS |
| 3 | /fhir-r4/v1/Encounter | POST | 201 Created | ✅ PASS |
| 4 | /fhir-r4/v1/Condition | POST | 201 Created | ✅ PASS |
| 5 | /fhir-r4/v1/Encounter/{id} | PUT | 200 OK | ✅ PASS |

---

## 8. LAMPIRAN SCREENSHOT UJI COBA

### 8.1 Screenshot 1: OAuth Token Request (200 OK)

```
[SISIPKAN SCREENSHOT POSTMAN - GET TOKEN]

Keterangan:
- Endpoint: POST /oauth2/v1/accesstoken
- Status: 200 OK
- Response: access_token diterima
```

---

### 8.2 Screenshot 2: Get Patient by NIK (200 OK)

```
[SISIPKAN SCREENSHOT POSTMAN - GET PATIENT]

Keterangan:
- Endpoint: GET /fhir-r4/v1/Patient
- Parameter: NIK pasien
- Status: 200 OK
- Response: Data pasien ditemukan
```

---

### 8.3 Screenshot 3: Create Encounter (201 Created)

```
[SISIPKAN SCREENSHOT POSTMAN - CREATE ENCOUNTER]

Keterangan:
- Endpoint: POST /fhir-r4/v1/Encounter
- Status: 201 Created
- Response: Encounter ID diterima
```

---

### 8.4 Screenshot 4: Create Condition/Diagnosis (201 Created)

```
[SISIPKAN SCREENSHOT POSTMAN - CREATE CONDITION]

Keterangan:
- Endpoint: POST /fhir-r4/v1/Condition
- Diagnosis: J06.9 (ISPA)
- Status: 201 Created
- Response: Condition ID diterima
```

---

### 8.5 Screenshot 5: Update Encounter to Finished (200 OK)

```
[SISIPKAN SCREENSHOT POSTMAN - UPDATE ENCOUNTER]

Keterangan:
- Endpoint: PUT /fhir-r4/v1/Encounter/{id}
- Status: finished
- Diagnosis: Linked to Condition
- Response: 200 OK
```

---

### 8.6 Screenshot 6: Tampilan Aplikasi SIMRS ZEN

```
[SISIPKAN SCREENSHOT APLIKASI - DASHBOARD]

[SISIPKAN SCREENSHOT APLIKASI - REKAM MEDIS]

[SISIPKAN SCREENSHOT APLIKASI - INTEGRASI SATU SEHAT]
```

---

## 9. BUKTI PENGIRIMAN EMAIL

### 9.1 Email ke Onboarding SATU SEHAT

```
[SISIPKAN SCREENSHOT EMAIL]

Kepada: onboarding.satusehat@dto.kemkes.go.id
Subject: [Onboarding] Uji Coba SATU SEHAT - SIMRS ZEN - PT Zen Multimedia Indonesia
Tanggal: [Tanggal Pengiriman]

Isi Email:
-----------
Yth. Tim Onboarding SATU SEHAT,

Bersama email ini kami kirimkan:
1. Video uji coba integrasi SATU SEHAT (sandbox)
2. Dokumentasi sistem SIMRS ZEN

Informasi Vendor:
- Nama Perusahaan: PT Zen Multimedia Indonesia
- Nama Produk: SIMRS ZEN
- Website: https://zenmultimedia.co.id
- PIC: [Nama PIC]
- Telepon: +62 851-2104-5798
- Email: info@zenmultimedia.co.id

Terima kasih.

Hormat kami,
PT Zen Multimedia Indonesia
```

---

### 9.2 Konfirmasi Email Terkirim

```
[SISIPKAN SCREENSHOT SENT EMAIL / DELIVERY CONFIRMATION]
```

---

## PENUTUP

Dokumentasi ini disusun sebagai bukti kesiapan SIMRS ZEN dalam mengimplementasikan integrasi SATU SEHAT sesuai standar yang ditetapkan oleh Kementerian Kesehatan RI.

Untuk informasi lebih lanjut, silakan hubungi:

**PT Zen Multimedia Indonesia**
- Website: https://zenmultimedia.co.id
- Email: info@zenmultimedia.co.id
- Telepon/WA: +62 851-2104-5798

---

*Dokumen ini dibuat pada Februari 2026*
*Versi: 1.0*
