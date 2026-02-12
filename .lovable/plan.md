

# Fitur Auto-Discovery Modalitas DICOM

## Ringkasan
Menambahkan tab baru "Modalitas" di halaman Integrasi DICOM (`/integrasi-dicom`) yang memungkinkan tim IT rumah sakit untuk:
1. **Scan otomatis** semua modalitas (CT, MRI, X-Ray, dll) yang terdaftar di server PACS
2. **Test koneksi (C-ECHO)** ke setiap modalitas secara individual
3. **Tambah/Hapus modalitas** langsung dari antarmuka
4. Menampilkan **daftar modalitas** lengkap dengan status koneksi, AE Title, IP, dan port

## Perubahan yang Diperlukan

### 1. Edge Function `pacs-bridge` -- Tambah action `discover_modalities`
Menambahkan action baru yang melakukan:
- Memanggil `GET /modalities` untuk mendapatkan daftar nama modalitas
- Untuk setiap modalitas, memanggil `GET /modalities/{name}` untuk detail (AE Title, Host, Port)
- Untuk setiap modalitas, menjalankan `POST /modalities/{name}/echo` (C-ECHO) untuk cek status koneksi
- Mengembalikan daftar lengkap modalitas beserta status online/offline

### 2. Hook `usePACSIntegration.tsx` -- Tambah hook baru
- `useDiscoverModalities()` -- mutation yang memanggil action `discover_modalities`
- Hook `useAddModality` dan `useRemoveModality` sudah ada, tinggal dipakai

### 3. Halaman `DICOMIntegration.tsx` -- Tambah Tab "Modalitas"
Menambahkan tab ke-5 dengan ikon radar/wifi yang menampilkan:

- **Tombol "Scan Modalitas"** -- menjalankan discovery
- **Tabel hasil scan** dengan kolom: Nama, AE Title, Host, Port, Status (Online/Offline via C-ECHO)
- **Tombol C-ECHO** per modalitas untuk test individual
- **Form tambah modalitas baru** (Nama, AE Title, Host, Port)
- **Tombol hapus** per modalitas
- **Statistik ringkas**: total modalitas, yang online, yang offline

## Detail Teknis

### Action `discover_modalities` di Edge Function
```text
1. GET /modalities --> ["CT_SCANNER", "XRAY_UNIT", ...]
2. Untuk setiap nama:
   - GET /modalities/{name} --> { AET, Host, Port }
   - POST /modalities/{name}/echo --> success/fail
3. Return: [{ name, ae_title, host, port, status: "online"|"offline" }]
```

### Komponen UI Tab Modalitas
- Card "Scan & Discovery" dengan tombol scan dan indikator loading (progress animation saat scanning)
- Tabel modalitas dengan badge status hijau (Online) / merah (Offline)
- Dialog/form inline untuk menambah modalitas baru
- Konfirmasi sebelum menghapus modalitas

### File yang Diubah
| File | Perubahan |
|---|---|
| `supabase/functions/pacs-bridge/index.ts` | Tambah case `discover_modalities` |
| `src/hooks/usePACSIntegration.tsx` | Tambah `useDiscoverModalities()` hook |
| `src/pages/DICOMIntegration.tsx` | Tambah tab "Modalitas" dengan UI scan, tabel, form CRUD |

