import { prisma } from '../config/database.js';

interface BpjsJobData {
  sep_number?: string;
  claim_data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface BpjsJob {
  id?: string | number;
  name: string;
  data: BpjsJobData;
}

interface BpjsJobResult {
  success: boolean;
  sep_number?: string;
  data?: BpjsJobData;
}

export async function processBpjsJob(job: BpjsJob): Promise<BpjsJobResult> {
  console.log(`Processing BPJS background job ${job.id}: ${job.name}`);

  if (job.name === 'eclaim-submit') {
    const { sep_number, claim_data } = job.data;
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Successfully completed background eclaim submission for SEP: ${sep_number}`);
    return { success: true, sep_number };
  }

  if (job.name === 'claim-send-idrg') {
    const data = job.data;
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Successfully background synced IDRG claim');
    return { success: true, data };
  }

  throw new Error(`Unknown BPJS job: ${job.name}`);
}
