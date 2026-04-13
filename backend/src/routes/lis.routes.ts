/**
 * SIMRS ZEN - LIS (Lab Information System) Gateway Routes
 */

import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getStatus, getMappings, updateMapping, startASTMServer, startHL7Server, stopServers } from '../services/lis-gateway.js';

const router = Router();

router.use(requireRole(['admin', 'laboratorium']));

interface MappingBody {
  test_code?: string;
  test_name?: string;
  unit?: string;
}

interface StartBody {
  astm_port?: number;
  hl7_port?: number;
}

interface TestBody {
  mrn?: string;
  order_number?: string;
  results?: Array<Record<string, string>>;
}

// GET /api/v1/lis/status
router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: getStatus() });
}));

// GET /api/v1/lis/mappings
router.get('/mappings', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: getMappings() });
}));

// PUT /api/v1/lis/mappings/:code
router.put('/mappings/:code', asyncHandler(async (req: Request<{ code: string }>, res: Response) => {
  const { code } = req.params;
  const { test_code, test_name, unit } = req.body as MappingBody;

  if (!test_code || !test_name) {
    return res.status(400).json({ success: false, error: 'test_code dan test_name wajib' });
  }

  updateMapping(code.toUpperCase(), { test_code, test_name, unit: unit || '' });
  res.json({ success: true, message: `Mapping ${code} berhasil diupdate` });
}));

// POST /api/v1/lis/start
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { astm_port = 9001, hl7_port = 9002 } = req.body as StartBody;

  startASTMServer(parseInt(String(astm_port)));
  startHL7Server(parseInt(String(hl7_port)));

  res.json({
    success: true,
    message: `LIS Gateway started (ASTM:${astm_port}, HL7:${hl7_port})`
  });
}));

// POST /api/v1/lis/stop
router.post('/stop', asyncHandler(async (_req: Request, res: Response) => {
  stopServers();
  res.json({ success: true, message: 'LIS Gateway stopped' });
}));

// POST /api/v1/lis/test
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  const testRecords = {
    header: { sender: 'TEST_ANALYZER', timestamp: new Date().toISOString() },
    patient: { id: (req.body as TestBody).mrn || 'TEST001', name: 'Test Patient' },
    orders: [{ order_id: (req.body as TestBody).order_number || '', sample_id: '1' }],
    results: (req.body as TestBody).results || [
      { test_id: 'WBC', value: '8.5', unit: '10³/µL', flag: '', status: 'F' },
      { test_id: 'HGB', value: '14.2', unit: 'g/dL', flag: '', status: 'F' },
      { test_id: 'PLT', value: '250', unit: '10³/µL', flag: '', status: 'F' },
    ],
  };

  res.json({
    success: true,
    message: 'Test message — check LIS gateway logs',
    data: testRecords,
  });
}));

export default router;
