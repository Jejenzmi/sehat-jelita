/**
 * SIMRS ZEN - Hospital Profile Routes
 * Endpoint for hospital setup (insert/update/get)
 * Uses the 'hospitals' table + system_settings for setup_completed flag
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// NOTE: These routes do NOT require admin role so they work during first-time setup.
// After setup_completed = true is written to system_settings, further access can be
// guarded by role checks in the admin routes.

/**
 * GET /api/admin/hospital-profile
 * Get hospital profile (from hospitals table + system_settings)
 */
router.get('/', asyncHandler(async (req, res) => {
  const hospital = await prisma.hospitals.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'asc' }
  });

  // Also fetch extended settings
  const settings = await prisma.system_settings.findMany({
    where: { setting_key: { startsWith: 'hospital_' } }
  });

  const settingsMap = Object.fromEntries(settings.map(s => [s.setting_key, s.setting_value]));

  res.json({
    success: true,
    data: hospital
      ? {
          ...hospital,
          hospital_name: settingsMap['hospital_name'] || hospital.name,
          hospital_code: settingsMap['hospital_code'] || '',
          hospital_type: settingsMap['hospital_type'] || '',
          facility_level: settingsMap['facility_level'] || 'C',
          city: settingsMap['hospital_city'] || '',
          province: settingsMap['hospital_province'] || '',
          postal_code: settingsMap['hospital_postal_code'] || '',
          phone: settingsMap['hospital_phone'] || '',
          email: settingsMap['hospital_email'] || '',
          website: settingsMap['hospital_website'] || '',
          accreditation_status: settingsMap['hospital_accreditation'] || 'belum',
          bed_count_total: parseInt(settingsMap['hospital_bed_count'] || '0', 10),
          is_teaching_hospital: settingsMap['hospital_is_teaching'] === 'true',
          director_name: settingsMap['hospital_director'] || '',
          organization_id: settingsMap['hospital_org_id'] || '',
        }
      : null
  });
}));

/**
 * POST /api/admin/hospital-profile
 * Upsert hospital profile and mark setup as completed in system_settings
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    hospital_name,
    hospital_code,
    hospital_type,
    facility_level,
    address,
    city,
    province,
    postal_code,
    phone,
    email,
    website,
    accreditation_status,
    bed_count_total,
    is_teaching_hospital,
    npwp,
    director_name,
    organization_id,
  } = req.body;

  if (!hospital_name) {
    return res.status(400).json({ success: false, error: 'hospital_name wajib diisi' });
  }

  // Upsert hospital record
  const existing = await prisma.hospitals.findFirst({ where: { is_active: true } });

  let hospital;
  if (existing) {
    hospital = await prisma.hospitals.update({
      where: { id: existing.id },
      data: {
        name: hospital_name,
        address: address || existing.address || '',
        is_active: true,
      }
    });
  } else {
    hospital = await prisma.hospitals.create({
      data: {
        name: hospital_name,
        address: address || '',
        is_active: true,
      }
    });
  }

  // Persist all extended settings to system_settings
  const settingsToSave = [
    ['hospital_name',        hospital_name],
    ['hospital_code',        hospital_code        || ''],
    ['hospital_type',        hospital_type        || facility_level || 'C'],
    ['facility_level',       facility_level       || 'C'],
    ['hospital_address',     address              || ''],
    ['hospital_city',        city                 || ''],
    ['hospital_province',    province             || ''],
    ['hospital_postal_code', postal_code          || ''],
    ['hospital_phone',       phone                || ''],
    ['hospital_email',       email                || ''],
    ['hospital_website',     website              || ''],
    ['hospital_accreditation', accreditation_status || 'belum'],
    ['hospital_bed_count',   String(bed_count_total   || 0)],
    ['hospital_is_teaching', String(is_teaching_hospital || false)],
    ['hospital_npwp',        npwp                 || ''],
    ['hospital_director',    director_name        || ''],
    ['hospital_org_id',      organization_id      || ''],
    ['setup_completed',      'true'],
  ];

  await Promise.all(
    settingsToSave.map(([key, value]) =>
      prisma.system_settings.upsert({
        where:  { setting_key: key },
        update: { setting_value: value },
        create: { setting_key: key, setting_value: value },
      })
    )
  );

  res.status(200).json({
    success: true,
    data: {
      ...hospital,
      hospital_name,
      hospital_code,
      facility_level,
      city,
      province,
      phone,
      email,
    },
    message: 'Setup rumah sakit berhasil disimpan',
  });
}));

/**
 * PUT /api/admin/hospital-profile/:id
 * Update hospital record by id
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hospital_name, address } = req.body;

  const hospital = await prisma.hospitals.update({
    where: { id },
    data: {
      ...(hospital_name ? { name: hospital_name } : {}),
      ...(address !== undefined ? { address } : {}),
    }
  });

  // Sync name to system_settings as well
  if (hospital_name) {
    await prisma.system_settings.upsert({
      where:  { setting_key: 'hospital_name' },
      update: { setting_value: hospital_name },
      create: { setting_key: 'hospital_name', setting_value: hospital_name },
    });
  }

  res.json({ success: true, data: hospital });
}));

export default router;
