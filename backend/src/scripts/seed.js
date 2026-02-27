/**
 * SIMRS ZEN - Database Seeder
 * Seeds initial admin user and required system data
 *
 * Usage: npm run db:seed
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Admin User
  // ============================================
  const adminEmail = 'multimediazen@gmail.com';
  const adminPassword = 'admin123';

  const existing = await prisma.profiles.findUnique({
    where: { email: adminEmail }
  });

  if (existing) {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const userId = crypto.randomUUID();

    const profile = await prisma.profiles.create({
      data: {
        user_id: userId,
        email: adminEmail,
        full_name: 'Administrator',
        password_hash: passwordHash,
        is_active: true
      }
    });

    await prisma.user_roles.create({
      data: {
        user_id: profile.user_id,
        role: 'admin'
      }
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
  }

  // ============================================
  // System Settings (upsert to avoid duplicates)
  // ============================================
  const settings = [
    { setting_key: 'hospital_name', setting_value: 'SIMRS ZEN Hospital', setting_type: 'string', description: 'Nama Rumah Sakit' },
    { setting_key: 'hospital_code', setting_value: 'ZEN001', setting_type: 'string', description: 'Kode Rumah Sakit' },
    { setting_key: 'hospital_address', setting_value: 'Jl. Kesehatan No. 1', setting_type: 'string', description: 'Alamat RS' },
    { setting_key: 'hospital_phone', setting_value: '021-12345678', setting_type: 'string', description: 'Telepon RS' },
    { setting_key: 'allow_registration', setting_value: 'false', setting_type: 'boolean', description: 'Izinkan registrasi user baru' },
    { setting_key: 'bpjs_enabled', setting_value: 'true', setting_type: 'boolean', description: 'Aktifkan integrasi BPJS' },
    { setting_key: 'satusehat_enabled', setting_value: 'true', setting_type: 'boolean', description: 'Aktifkan integrasi SATU SEHAT' }
  ];

  for (const setting of settings) {
    await prisma.system_settings.upsert({
      where: { setting_key: setting.setting_key },
      update: {},
      create: setting
    });
  }

  console.log('✅ System settings seeded');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
