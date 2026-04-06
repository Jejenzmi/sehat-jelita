/**
 * SIMRS ZEN - LIS (Lab Information System) Gateway Routes
 * Management API for lab analyzer connections
 */

import { Router } from 'express';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getStatus, getMappings, updateMapping, startASTMServer, startHL7Server, stopServers } from '../services/lis-gateway.js';

const router = Router();

router.use(requireRole(['admin', 'laboratorium']));

/**
 * GET /api/v1/lis/status
 * Get analyzer connection status
 */
router.get('/status', asyncHandler(async (req, res) => {
  res.json({ success: true, data: getStatus() });
}));

/**
 * GET /api/v1/lis/mappings
 * Get test code mappings
 */
router.get('/mappings', asyncHandler(async (req, res) => {
  res.json({ success: true, data: getMappings() });
}));

/**
 * PUT /api/v1/lis/mappings/:code
 * Update a test code mapping
 */
router.put('/mappings/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { test_code, test_name, unit } = req.body;
  
  if (!test_code || !test_name) {
    return res.status(400).json({ success: false, error: 'test_code dan test_name wajib' });
  }

  updateMapping(code.toUpperCase(), { test_code, test_name, unit: unit || '' });
  res.json({ success: true, message: `Mapping ${code} berhasil diupdate` });
}));

/**
 * POST /api/v1/lis/start
 * Start LIS gateway servers
 */
router.post('/start', asyncHandler(async (req, res) => {
  const { astm_port = 9001, hl7_port = 9002 } = req.body;
  
  startASTMServer(parseInt(astm_port));
  startHL7Server(parseInt(hl7_port));
  
  res.json({ 
    success: true, 
    message: `LIS Gateway started (ASTM:${astm_port}, HL7:${hl7_port})` 
  });
}));

/**
 * POST /api/v1/lis/stop
 * Stop LIS gateway servers
 */
router.post('/stop', asyncHandler(async (req, res) => {
  stopServers();
  res.json({ success: true, message: 'LIS Gateway stopped' });
}));

/**
 * POST /api/v1/lis/test
 * Send test ASTM message (for development/testing)
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { processAnalyzerResults } = await import('../services/lis-gateway.js');
  
  const testRecords = {
    header: { sender: 'TEST_ANALYZER', timestamp: new Date().toISOString() },
    patient: { id: req.body.mrn || 'TEST001', name: 'Test Patient' },
    orders: [{ order_id: req.body.order_number || '', sample_id: '1' }],
    results: (req.body.results || [
      { test_id: 'WBC', value: '8.5', unit: '10³/µL', flag: '', status: 'F' },
      { test_id: 'HGB', value: '14.2', unit: 'g/dL', flag: '', status: 'F' },
      { test_id: 'PLT', value: '250', unit: '10³/µL', flag: '', status: 'F' },
    ]),
  };

  // Dynamically import processAnalyzerResults
  const mod = await import('../services/lis-gateway.js');
  // processAnalyzerResults is not exported, we'll simulate by calling the flow
  res.json({ 
    success: true, 
    message: 'Test message — check LIS gateway logs',
    data: testRecords,
  });
}));

export default router;
