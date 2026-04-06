import { prisma } from '../config/database.js';
import { satuSehat } from '../services/satusehat.service.js';

export async function processSatuSehatJob(job) {
  console.log(`Processing SATUSEHAT background job ${job.id}: ${job.name}`);

  if (job.name === 'bulk-sync-patients') {
    const patients = await prisma.patients.findMany({
      where: { satusehat_id: null },
      take: 100
    });

    let synced = 0;
    let failed = 0;

    for (const patient of patients) {
      try {
        const payload = {
          nik: patient.nik,
          name: patient.full_name,
          birthDate: patient.birth_date,
          gender: patient.gender === 'L' ? 'male' : 'female'
        };

        const result = await satuSehat.upsertPatient(payload);
        
        if (result && result.id) {
          await prisma.patients.update({
            where: { id: patient.id },
            data: { satusehat_id: result.id }
          });
          synced++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Failed to sync patient ${patient.id}:`, err.message);
        failed++;
      }
    }

    return { synced, failed, total: patients.length };
  }
}
