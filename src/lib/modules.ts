/**
 * SIMRS ZEN — Shared Module Definitions
 * Single source of truth for module metadata and applicability per hospital type.
 * Used by: SetupWizard, ModuleConfigurationTab, Sidebar (useModuleVisibility)
 */

export type HospitalType = 'A' | 'B' | 'C' | 'D' | 'FKTP';

export interface ModuleDefinition {
  module_code: string;
  module_name: string;
  module_category: string;
  module_path: string;
  module_icon: string | null;
  display_order: number;
  is_core_module: boolean;
  applicable_types: HospitalType[];
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { module_code: 'pendaftaran',   module_name: 'Pendaftaran',        module_category: 'core',        module_path: '/pendaftaran',        module_icon: null, display_order: 1,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'pasien',        module_name: 'Data Pasien',        module_category: 'core',        module_path: '/pasien',             module_icon: null, display_order: 2,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'antrian',       module_name: 'Antrian',            module_category: 'core',        module_path: '/antrian',            module_icon: null, display_order: 3,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'rawat_jalan',   module_name: 'Rawat Jalan',        module_category: 'clinical',    module_path: '/rawat-jalan',        module_icon: null, display_order: 4,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'rekam_medis',   module_name: 'Rekam Medis',        module_category: 'core',        module_path: '/rekam-medis',        module_icon: null, display_order: 5,  is_core_module: true,  applicable_types: ['A','B','C','D'] },
  { module_code: 'farmasi',       module_name: 'Farmasi',            module_category: 'support',     module_path: '/farmasi',            module_icon: null, display_order: 6,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'billing',       module_name: 'Billing & Kasir',    module_category: 'admin',       module_path: '/billing',            module_icon: null, display_order: 7,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'laporan',       module_name: 'Laporan',            module_category: 'reporting',   module_path: '/laporan',            module_icon: null, display_order: 8,  is_core_module: true,  applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'rawat_inap',    module_name: 'Rawat Inap',         module_category: 'clinical',    module_path: '/rawat-inap',         module_icon: null, display_order: 9,  is_core_module: false, applicable_types: ['A','B','C','D'] },
  { module_code: 'igd',           module_name: 'IGD',                module_category: 'clinical',    module_path: '/igd',                module_icon: null, display_order: 10, is_core_module: false, applicable_types: ['A','B','C','D'] },
  { module_code: 'laboratorium',  module_name: 'Laboratorium',       module_category: 'support',     module_path: '/laboratorium',       module_icon: null, display_order: 11, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'radiologi',     module_name: 'Radiologi',          module_category: 'support',     module_path: '/radiologi',          module_icon: null, display_order: 12, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'kamar_operasi', module_name: 'Kamar Operasi',      module_category: 'clinical',    module_path: '/kamar-operasi',      module_icon: null, display_order: 13, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'icu',           module_name: 'ICU/NICU/PICU',      module_category: 'clinical',    module_path: '/icu',                module_icon: null, display_order: 14, is_core_module: false, applicable_types: ['A','B'] },
  { module_code: 'hemodialisa',   module_name: 'Hemodialisa',        module_category: 'support',     module_path: '/hemodialisa',        module_icon: null, display_order: 15, is_core_module: false, applicable_types: ['A','B'] },
  { module_code: 'bank_darah',    module_name: 'Bank Darah',         module_category: 'support',     module_path: '/bank-darah',         module_icon: null, display_order: 16, is_core_module: false, applicable_types: ['A','B'] },
  { module_code: 'gizi',          module_name: 'Gizi',               module_category: 'support',     module_path: '/gizi',               module_icon: null, display_order: 17, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'rehabilitasi',  module_name: 'Rehabilitasi',       module_category: 'support',     module_path: '/rehabilitasi',       module_icon: null, display_order: 18, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'mcu',           module_name: 'Medical Check Up',   module_category: 'support',     module_path: '/mcu',                module_icon: null, display_order: 19, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'forensik',      module_name: 'Forensik',           module_category: 'support',     module_path: '/forensik',           module_icon: null, display_order: 20, is_core_module: false, applicable_types: ['A','B'] },
  { module_code: 'home_care',     module_name: 'Home Care',          module_category: 'clinical',    module_path: '/home-care',          module_icon: null, display_order: 21, is_core_module: false, applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'ambulance',     module_name: 'Ambulance Center',   module_category: 'clinical',    module_path: '/ambulance-center',   module_icon: null, display_order: 22, is_core_module: false, applicable_types: ['A','B','C','D'] },
  { module_code: 'bpjs',          module_name: 'BPJS Kesehatan',     module_category: 'integration', module_path: '/bpjs',               module_icon: null, display_order: 23, is_core_module: false, applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'satu_sehat',    module_name: 'SATU SEHAT',         module_category: 'integration', module_path: '/satu-sehat',         module_icon: null, display_order: 24, is_core_module: false, applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'asuransi',      module_name: 'Asuransi Lain',      module_category: 'integration', module_path: '/asuransi',           module_icon: null, display_order: 25, is_core_module: false, applicable_types: ['A','B','C','D'] },
  { module_code: 'akuntansi',     module_name: 'Akuntansi',          module_category: 'admin',       module_path: '/akuntansi',          module_icon: null, display_order: 26, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'inventory',     module_name: 'Inventory',          module_category: 'admin',       module_path: '/inventory',          module_icon: null, display_order: 27, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'sdm',           module_name: 'SDM / HRD',          module_category: 'admin',       module_path: '/sdm',                module_icon: null, display_order: 28, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'pendidikan',    module_name: 'Pendidikan',         module_category: 'education',   module_path: '/pendidikan',         module_icon: null, display_order: 29, is_core_module: false, applicable_types: ['A','B'] },
  { module_code: 'mutu',          module_name: 'Mutu & Akreditasi',  module_category: 'quality',     module_path: '/mutu',               module_icon: null, display_order: 30, is_core_module: false, applicable_types: ['A','B','C'] },
  { module_code: 'telemedicine',  module_name: 'Telemedicine',       module_category: 'clinical',    module_path: '/telemedicine',       module_icon: null, display_order: 31, is_core_module: false, applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'jadwal_dokter', module_name: 'Jadwal Dokter',      module_category: 'core',        module_path: '/jadwal-dokter',      module_icon: null, display_order: 32, is_core_module: false, applicable_types: ['A','B','C','D','FKTP'] },
  { module_code: 'dashboard_exec',module_name: 'Dashboard Executive',module_category: 'reporting',   module_path: '/dashboard-executive',module_icon: null, display_order: 33, is_core_module: false, applicable_types: ['A','B','C','D'] },
  { module_code: 'laporan_kemenkes',module_name:'Laporan Kemenkes',  module_category: 'reporting',   module_path: '/laporan-kemenkes',   module_icon: null, display_order: 34, is_core_module: false, applicable_types: ['A','B','C','D'] },
];

/** Return modules applicable for the given hospital type */
export function getModulesForType(type: HospitalType): ModuleDefinition[] {
  return MODULE_DEFINITIONS
    .filter(m => m.applicable_types.includes(type))
    .sort((a, b) => a.display_order - b.display_order);
}

/** Return the set of paths applicable for the given hospital type */
export function getPathsForType(type: HospitalType): Set<string> {
  return new Set(getModulesForType(type).map(m => m.module_path));
}

/** Find module by path */
export function getModuleByPath(path: string): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS.find(m => m.module_path === path);
}
