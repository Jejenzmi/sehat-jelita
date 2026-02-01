import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// BPJS Antrean API Configuration
const BPJS_ANTREAN_BASE_URL = Deno.env.get("BPJS_ANTREAN_BASE_URL") || "https://apijkn.bpjs-kesehatan.go.id/antreanrs";
const BPJS_CONS_ID = Deno.env.get("BPJS_CONS_ID") || "";
const BPJS_SECRET_KEY = Deno.env.get("BPJS_SECRET_KEY") || "";
const BPJS_USER_KEY = Deno.env.get("BPJS_USER_KEY") || "";

// Generate timestamp and signature for BPJS API
function generateSignature(): { timestamp: string; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const data = BPJS_CONS_ID + "&" + timestamp;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(BPJS_SECRET_KEY);
  const messageData = encoder.encode(data);
  
  // HMAC-SHA256 signature (simplified - in production use proper crypto)
  const signature = btoa(data); // Placeholder - real implementation needs proper HMAC
  
  return { timestamp, signature };
}

// Get BPJS Antrean headers
function getBPJSHeaders(): Record<string, string> {
  const { timestamp, signature } = generateSignature();
  return {
    "Content-Type": "application/json",
    "x-cons-id": BPJS_CONS_ID,
    "x-timestamp": timestamp,
    "x-signature": signature,
    "user_key": BPJS_USER_KEY,
  };
}

// API call helper
async function callBPJSAntreanAPI(endpoint: string, method: string = "GET", body?: any) {
  const url = `${BPJS_ANTREAN_BASE_URL}${endpoint}`;
  const headers = getBPJSHeaders();
  
  console.log(`[BPJS Antrean] ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  console.log(`[BPJS Antrean] Response:`, JSON.stringify(data).substring(0, 500));
  
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {};
    const { action, ...params } = { ...Object.fromEntries(url.searchParams), ...body };

    console.log(`[BPJS Antrean] Action: ${action}, Params:`, params);

    let result;

    switch (action) {
      // ============================================
      // REFERENSI (Reference Data)
      // ============================================
      
      case "ref_poli":
        // GET /ref/poli - Reference Poli
        result = await callBPJSAntreanAPI("/ref/poli");
        break;
        
      case "ref_dokter":
        // GET /ref/dokter - Reference Dokter
        result = await callBPJSAntreanAPI("/ref/dokter");
        break;
        
      case "ref_jadwal_dokter":
        // GET /jadwaldokter/kodepoli/{kodePoli}/tanggal/{tanggal}
        const { kodePoli, tanggal } = params;
        if (!kodePoli || !tanggal) {
          throw new Error("kodePoli dan tanggal harus diisi");
        }
        result = await callBPJSAntreanAPI(`/jadwaldokter/kodepoli/${kodePoli}/tanggal/${tanggal}`);
        break;
        
      case "ref_poli_fp":
        // GET /ref/poli/fp - Reference Poli Fingerprint
        result = await callBPJSAntreanAPI("/ref/poli/fp");
        break;
        
      case "ref_pasien_fp":
        // GET /ref/pasien/fp/identitas/{jenis}/noidentitas/{noIdentitas}
        const { jenisIdentitas, noIdentitas } = params;
        if (!jenisIdentitas || !noIdentitas) {
          throw new Error("jenisIdentitas dan noIdentitas harus diisi");
        }
        result = await callBPJSAntreanAPI(`/ref/pasien/fp/identitas/${jenisIdentitas}/noidentitas/${noIdentitas}`);
        break;

      // ============================================
      // JADWAL DOKTER (Doctor Schedule)
      // ============================================
      
      case "update_jadwal_dokter":
        // POST /jadwaldokter/updatejadwaldokter
        const jadwalData = {
          kodepoli: params.kodePoli,
          kodesubspesialis: params.kodeSubspesialis,
          kodedokter: params.kodeDokter,
          jadwal: params.jadwal, // Array of { hari, buka, tutup }
        };
        result = await callBPJSAntreanAPI("/jadwaldokter/updatejadwaldokter", "POST", jadwalData);
        break;

      // ============================================
      // ANTREAN (Queue Management)
      // ============================================
      
      case "add_antrean":
        // POST /antrean/add - Tambah Antrean
        const antreanData = {
          kodebooking: params.kodeBooking,
          jenispasien: params.jenisPasien, // JKN / NON JKN
          nomorkartu: params.nomorKartu || "",
          nik: params.nik,
          nohp: params.noHp,
          kodepoli: params.kodePoli,
          namapoli: params.namaPoli,
          pasienbaru: params.pasienBaru ? 1 : 0,
          norm: params.norm,
          tanggalperiksa: params.tanggalPeriksa,
          kodedokter: params.kodeDokter,
          namadokter: params.namaDokter,
          jampraktek: params.jamPraktek,
          jeniskunjungan: params.jenisKunjungan, // 1=Rujukan FKTP, 2=Internal, 3=Kontrol, 4=Antar RS
          nomorreferensi: params.nomorReferensi || "",
          nomorantrean: params.nomorAntrean,
          angkaantrean: params.angkaAntrean,
          estimasidilayani: params.estimasiDilayani, // timestamp ms
          sisakuotajkn: params.sisaKuotaJKN,
          kuotajkn: params.kuotaJKN,
          sisakuotanonjkn: params.sisaKuotaNonJKN,
          kuotanonjkn: params.kuotaNonJKN,
          keterangan: params.keterangan || "",
        };
        result = await callBPJSAntreanAPI("/antrean/add", "POST", antreanData);
        break;
        
      case "add_antrean_farmasi":
        // POST /antrean/farmasi/add - Tambah Antrean Farmasi
        const farmData = {
          kodebooking: params.kodeBooking,
          jenisresep: params.jenisResep, // racikan / non racikan
          nomorantrean: params.nomorAntrean,
          keterangan: params.keterangan || "",
        };
        result = await callBPJSAntreanAPI("/antrean/farmasi/add", "POST", farmData);
        break;
        
      case "update_waktu_antrean":
        // POST /antrean/updatewaktu - Update Waktu Antrean
        const updateData = {
          kodebooking: params.kodeBooking,
          taskid: params.taskId,
          waktu: params.waktu, // timestamp ms
          jenisresep: params.jenisResep, // optional: Tidak ada/Racikan/Non racikan
        };
        result = await callBPJSAntreanAPI("/antrean/updatewaktu", "POST", updateData);
        break;
        
      case "batal_antrean":
        // POST /antrean/batal - Batal Antrean
        const batalData = {
          kodebooking: params.kodeBooking,
          keterangan: params.keterangan,
        };
        result = await callBPJSAntreanAPI("/antrean/batal", "POST", batalData);
        break;
        
      case "get_list_task":
        // POST /antrean/getlisttask - List Waktu Task ID
        const taskData = {
          kodebooking: params.kodeBooking,
        };
        result = await callBPJSAntreanAPI("/antrean/getlisttask", "POST", taskData);
        break;

      // ============================================
      // DASHBOARD
      // ============================================
      
      case "dashboard_tanggal":
        // GET /dashboard/waktutunggu/tanggal/{tanggal}/waktu/{waktu}
        const { tanggalDashboard, waktuJenis } = params;
        if (!tanggalDashboard || !waktuJenis) {
          throw new Error("tanggal dan waktu harus diisi");
        }
        result = await callBPJSAntreanAPI(`/dashboard/waktutunggu/tanggal/${tanggalDashboard}/waktu/${waktuJenis}`);
        break;
        
      case "dashboard_bulan":
        // GET /dashboard/waktutunggu/bulan/{bulan}/tahun/{tahun}/waktu/{waktu}
        const { bulan, tahun, waktuType } = params;
        if (!bulan || !tahun || !waktuType) {
          throw new Error("bulan, tahun, dan waktu harus diisi");
        }
        result = await callBPJSAntreanAPI(`/dashboard/waktutunggu/bulan/${bulan}/tahun/${tahun}/waktu/${waktuType}`);
        break;

      // ============================================
      // ANTREAN PENDAFTARAN (Registration Queue)
      // ============================================
      
      case "antrean_per_tanggal":
        // GET /antrean/pendaftaran/tanggal/{tanggal}
        if (!params.tanggal) {
          throw new Error("tanggal harus diisi");
        }
        result = await callBPJSAntreanAPI(`/antrean/pendaftaran/tanggal/${params.tanggal}`);
        break;
        
      case "antrean_per_kodebooking":
        // GET /antrean/pendaftaran/kodebooking/{kodebooking}
        if (!params.kodeBooking) {
          throw new Error("kodeBooking harus diisi");
        }
        result = await callBPJSAntreanAPI(`/antrean/pendaftaran/kodebooking/${params.kodeBooking}`);
        break;
        
      case "antrean_aktif":
        // GET /antrean/pendaftaran/aktif
        result = await callBPJSAntreanAPI("/antrean/pendaftaran/aktif");
        break;
        
      case "antrean_per_poli_dokter":
        // GET /antrean/pendaftaran/kodepoli/{}/kodedokter/{}/hari/{}/jampraktek/{}
        const { kodePoliFilter, kodeDokterFilter, hari, jamPraktek } = params;
        if (!kodePoliFilter || !kodeDokterFilter || !hari || !jamPraktek) {
          throw new Error("kodePoli, kodeDokter, hari, dan jamPraktek harus diisi");
        }
        result = await callBPJSAntreanAPI(
          `/antrean/pendaftaran/kodepoli/${kodePoliFilter}/kodedokter/${kodeDokterFilter}/hari/${hari}/jampraktek/${encodeURIComponent(jamPraktek)}`
        );
        break;

      // ============================================
      // PELAYANAN OBAT (Drug Service)
      // ============================================
      
      case "hapus_pelayanan_obat":
        // DELETE /pelayanan/obat/hapus/
        const hapusObatData = {
          nosepapotek: params.noSepApotek,
          noresep: params.noResep,
          kodeobat: params.kodeObat,
          tipeobat: params.tipeObat,
        };
        result = await callBPJSAntreanAPI("/pelayanan/obat/hapus/", "DELETE", hapusObatData);
        break;
        
      case "daftar_pelayanan_obat":
        // GET /obat/daftar/{noKunjungan}
        if (!params.noKunjungan) {
          throw new Error("noKunjungan harus diisi");
        }
        result = await callBPJSAntreanAPI(`/obat/daftar/${params.noKunjungan}`);
        break;
        
      case "riwayat_pelayanan_obat":
        // GET /riwayatobat/{tglAwal}/{tglAkhir}/{noKartu}
        const { tglAwal, tglAkhir, noKartu } = params;
        if (!tglAwal || !tglAkhir || !noKartu) {
          throw new Error("tglAwal, tglAkhir, dan noKartu harus diisi");
        }
        result = await callBPJSAntreanAPI(`/riwayatobat/${tglAwal}/${tglAkhir}/${noKartu}`);
        break;

      // ============================================
      // RESEP (Prescription)
      // ============================================
      
      case "simpan_resep":
        // POST /sjpresep/v3/insert
        const resepData = {
          TGLSJP: params.tglSJP,
          REFASALSJP: params.refAsalSJP,
          POLIRSP: params.poliRSP,
          KDJNSOBAT: params.kdJnsObat, // 1=PRB, 2=Kronis Blm Stabil, 3=Kemoterapi
          NORESEP: params.noResep,
          IDUSERSJP: params.idUserSJP,
          TGLRSP: params.tglRSP,
          TGLPELRSP: params.tglPelRSP,
          KdDokter: params.kdDokter,
          iterasi: params.iterasi || "0", // 0=Non Iterasi, 1=Iterasi
        };
        result = await callBPJSAntreanAPI("/sjpresep/v3/insert", "POST", resepData);
        break;
        
      case "hapus_resep":
        // DELETE /hapusresep
        const hapusResepData = {
          nosjp: params.noSJP,
          refasalsjp: params.refAsalSJP,
          noresep: params.noResep,
        };
        result = await callBPJSAntreanAPI("/hapusresep", "DELETE", hapusResepData);
        break;
        
      case "daftar_resep":
        // POST /daftarresep
        const daftarResepData = {
          kdppk: params.kdPPK,
          KdJnsObat: params.kdJnsObat,
          JnsTgl: params.jnsTgl, // TGLPELSJP, TGLRSP
          TglMulai: params.tglMulai,
          TglAkhir: params.tglAkhir,
        };
        result = await callBPJSAntreanAPI("/daftarresep", "POST", daftarResepData);
        break;

      // ============================================
      // SEP
      // ============================================
      
      case "cari_sep":
        // GET /sep/{noSep}
        if (!params.noSep) {
          throw new Error("noSep harus diisi");
        }
        result = await callBPJSAntreanAPI(`/sep/${params.noSep}`);
        break;

      // ============================================
      // MONITORING
      // ============================================
      
      case "monitoring_klaim":
        // GET /monitoring/klaim/{bulan}/{tahun}/{jnsObat}/{status}
        const { bulanKlaim, tahunKlaim, jnsObat, statusKlaim } = params;
        if (!bulanKlaim || !tahunKlaim || jnsObat === undefined || !statusKlaim) {
          throw new Error("bulan, tahun, jnsObat, dan status harus diisi");
        }
        result = await callBPJSAntreanAPI(`/monitoring/klaim/${bulanKlaim}/${tahunKlaim}/${jnsObat}/${statusKlaim}`);
        break;

      // ============================================
      // REKAP PESERTA PRB
      // ============================================
      
      case "rekap_peserta_prb":
        // GET /Prb/rekappeserta/tahun/{tahun}/bulan/{bulan}
        const { tahunPRB, bulanPRB } = params;
        if (!tahunPRB || !bulanPRB) {
          throw new Error("tahun dan bulan harus diisi");
        }
        result = await callBPJSAntreanAPI(`/Prb/rekappeserta/tahun/${tahunPRB}/bulan/${bulanPRB}`);
        break;

      // ============================================
      // RS ENDPOINTS (Called by Mobile JKN)
      // ============================================
      
      case "rs_get_token":
        // This endpoint is called BY Mobile JKN to RS
        // RS needs to provide token to Mobile JKN
        result = {
          response: {
            token: generateRSToken(),
          },
          metadata: {
            message: "Ok",
            code: 200,
          },
        };
        break;
        
      case "rs_status_antrean":
        // Status antrean per poli (called by Mobile JKN)
        result = await getRSStatusAntrean(params);
        break;
        
      case "rs_ambil_antrean":
        // Ambil antrean (called by Mobile JKN)
        result = await getRSAmbilAntrean(params);
        break;
        
      case "rs_sisa_antrean":
        // Sisa antrean (called by Mobile JKN)
        result = await getRSSisaAntrean(params);
        break;
        
      case "rs_batal_antrean":
        // Batal antrean dari Mobile JKN
        result = await getRSBatalAntrean(params);
        break;
        
      case "rs_checkin":
        // Check in pasien
        result = await getRSCheckin(params);
        break;
        
      case "rs_info_pasien_baru":
        // Info pasien baru dari Mobile JKN
        result = await getRSInfoPasienBaru(params);
        break;
        
      case "rs_jadwal_operasi_rs":
        // Jadwal operasi RS
        result = await getRSJadwalOperasiRS(params);
        break;
        
      case "rs_jadwal_operasi_pasien":
        // Jadwal operasi pasien
        result = await getRSJadwalOperasiPasien(params);
        break;
        
      case "rs_ambil_antrean_farmasi":
        // Ambil antrean farmasi
        result = await getRSAmbilAntreanFarmasi(params);
        break;
        
      case "rs_status_antrean_farmasi":
        // Status antrean farmasi
        result = await getRSStatusAntreanFarmasi(params);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[BPJS Antrean] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        metaData: {
          code: "500",
          message: errorMessage,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// ============================================
// RS HELPER FUNCTIONS (For Mobile JKN access)
// ============================================

function generateRSToken(): string {
  // Generate token for Mobile JKN access
  const timestamp = Date.now();
  return btoa(`RS_TOKEN_${timestamp}`);
}

async function getRSStatusAntrean(params: any) {
  // Get queue status per poli from local database
  const { kodePoli, kodeDokter, tanggalPeriksa, jamPraktek } = params;
  
  // TODO: Query local database for queue status
  // This is a mock response
  return {
    response: {
      namapoli: "Poli Anak",
      namadokter: "Dr. Example",
      totalantrean: 20,
      sisaantrean: 10,
      antreanpanggil: "A-010",
      sisakuotajkn: 5,
      kuotajkn: 30,
      sisakuotanonjkn: 5,
      kuotanonjkn: 30,
      keterangan: "Peserta harap datang 30 menit lebih awal",
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSAmbilAntrean(params: any) {
  // Create queue ticket for patient from Mobile JKN
  const { nomorKartu, nik, noHp, kodePoli, norm, tanggalPeriksa, kodeDokter, jamPraktek, jenisKunjungan, nomorReferensi } = params;
  
  // Check if patient exists (has norm)
  if (!norm) {
    // Patient baru - return code 202
    return {
      metadata: {
        message: "Pasien Baru",
        code: 202,
      },
    };
  }
  
  // TODO: Create queue in local database
  // Mock response for now
  const kodeBooking = `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}A${Date.now().toString().slice(-4)}`;
  
  return {
    response: {
      nomorantrean: "A-001",
      angkaantrean: 1,
      kodebooking: kodeBooking,
      norm: norm,
      namapoli: "Poli Anak",
      namadokter: "Dr. Example",
      estimasidilayani: Date.now() + 3600000, // 1 hour from now
      sisakuotajkn: 5,
      kuotajkn: 30,
      sisakuotanonjkn: 5,
      kuotanonjkn: 30,
      keterangan: "Peserta harap datang 30 menit lebih awal",
      pasienbaru: 0,
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSSisaAntrean(params: any) {
  // Get remaining queue for patient
  const { kodeBooking } = params;
  
  // TODO: Query local database
  return {
    response: {
      nomorantrean: "A-001",
      namapoli: "Poli Anak",
      namadokter: "Dr. Example",
      sisaantrean: 5,
      antreanpanggil: "A-095",
      waktutunggu: 1800, // seconds (SPM * (sisaantrean-1))
      keterangan: "",
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSBatalAntrean(params: any) {
  // Cancel queue from Mobile JKN
  const { kodeBooking, keterangan } = params;
  
  // TODO: Update queue status in local database
  return {
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSCheckin(params: any) {
  // Check in patient
  const { kodeBooking, waktu } = params;
  
  // TODO: Update checkin time in local database
  return {
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSInfoPasienBaru(params: any) {
  // Receive new patient info from Mobile JKN
  const { nomorKartu, nik, nomorKK, nama, jenisKelamin, tanggalLahir, noHp, alamat } = params;
  
  // TODO: Create new patient in local database
  const newNorm = `RM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  
  return {
    response: {
      norm: newNorm,
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSJadwalOperasiRS(params: any) {
  // Get hospital surgery schedule
  const { tanggalAwal, tanggalAkhir } = params;
  
  // TODO: Query surgery schedule from local database
  return {
    response: {
      list: [
        {
          kodebooking: "OP-001",
          tanggaloperasi: "2021-03-24",
          jenistindakan: "Appendectomy",
          kodepoli: "BED",
          namapoli: "Bedah",
          terlaksana: 0,
          nopeserta: "0000000000123",
          namapeserta: "John Doe",
        },
      ],
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSJadwalOperasiPasien(params: any) {
  // Get patient surgery schedule
  const { noPeserta } = params;
  
  // TODO: Query patient surgery schedule from local database
  return {
    response: {
      list: [
        {
          kodebooking: "OP-001",
          tanggaloperasi: "2021-03-24",
          jenistindakan: "Appendectomy",
          kodepoli: "BED",
          namapoli: "Bedah",
          terlaksana: 0,
        },
      ],
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSAmbilAntreanFarmasi(params: any) {
  // Get pharmacy queue
  const { kodeBooking } = params;
  
  // TODO: Get pharmacy queue from local database
  return {
    response: {
      nomorantrean: "F-001",
      jenisresep: "non racikan",
      estimasidilayani: Date.now() + 1800000, // 30 min
      keterangan: "",
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}

async function getRSStatusAntreanFarmasi(params: any) {
  // Get pharmacy queue status
  const { kodeBooking } = params;
  
  // TODO: Get pharmacy queue status from local database
  return {
    response: {
      nomorantrean: "F-001",
      jenisresep: "non racikan",
      sisaantrean: 3,
      antreanpanggil: "F-098",
      keterangan: "",
    },
    metadata: {
      message: "Ok",
      code: 200,
    },
  };
}
