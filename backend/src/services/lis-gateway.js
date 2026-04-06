/**
 * SIMRS ZEN - Lab Analyzer Interface (HL7/ASTM Gateway)
 * 
 * Receives results from lab analyzers via:
 *   - ASTM E1381/E1394 (serial/TCP)
 *   - HL7 v2.x (MLLP over TCP)
 * 
 * Supported analyzers: Mindray, Sysmex, Roche, ABX, etc.
 * Results are auto-submitted to the lab module via internal API.
 */

import net from 'net';
import { prisma } from '../config/database.js';
import { logger } from '../middleware/logger.js';

// ── ASTM Protocol Constants ──────────────────────────────────────────────────
const ASTM = {
  ENQ: 0x05,    // Enquiry
  ACK: 0x06,    // Acknowledge
  NAK: 0x15,    // Negative Acknowledge
  STX: 0x02,    // Start of Text
  ETX: 0x03,    // End of Text
  EOT: 0x04,    // End of Transmission
  ETB: 0x17,    // End of Transmission Block
  CR:  0x0D,    // Carriage Return
  LF:  0x0A,    // Line Feed
};

// ── HL7 MLLP Constants ───────────────────────────────────────────────────────
const HL7 = {
  VT:  0x0B,    // Vertical Tab (start block)
  FS:  0x1C,    // File Separator (end block)
  CR:  0x0D,    // Carriage Return
};

// ── Analyzer Mappings ────────────────────────────────────────────────────────
// Maps analyzer test codes → SIMRS test codes
const defaultMappings = {
  // Hematology (Mindray BC-5390 / Sysmex XS-800i)
  'WBC':   { test_code: 'CBC_WBC',   test_name: 'White Blood Cell',    unit: '10³/µL' },
  'RBC':   { test_code: 'CBC_RBC',   test_name: 'Red Blood Cell',      unit: '10⁶/µL' },
  'HGB':   { test_code: 'CBC_HGB',   test_name: 'Hemoglobin',          unit: 'g/dL' },
  'HCT':   { test_code: 'CBC_HCT',   test_name: 'Hematokrit',          unit: '%' },
  'PLT':   { test_code: 'CBC_PLT',   test_name: 'Trombosit',           unit: '10³/µL' },
  'MCV':   { test_code: 'CBC_MCV',   test_name: 'Mean Corp. Volume',   unit: 'fL' },
  'MCH':   { test_code: 'CBC_MCH',   test_name: 'Mean Corp. Hgb',      unit: 'pg' },
  'MCHC':  { test_code: 'CBC_MCHC',  test_name: 'MCHC',                unit: 'g/dL' },
  // Chemistry (Mindray BS-240 / Roche Cobas c111)
  'GLU':   { test_code: 'CHEM_GLU',  test_name: 'Glukosa',             unit: 'mg/dL' },
  'CHOL':  { test_code: 'CHEM_CHOL', test_name: 'Kolesterol Total',    unit: 'mg/dL' },
  'TRIG':  { test_code: 'CHEM_TRIG', test_name: 'Trigliserida',        unit: 'mg/dL' },
  'HDL':   { test_code: 'CHEM_HDL',  test_name: 'HDL Kolesterol',      unit: 'mg/dL' },
  'LDL':   { test_code: 'CHEM_LDL',  test_name: 'LDL Kolesterol',      unit: 'mg/dL' },
  'UREA':  { test_code: 'CHEM_UREA', test_name: 'Ureum',               unit: 'mg/dL' },
  'CREA':  { test_code: 'CHEM_CREA', test_name: 'Kreatinin',           unit: 'mg/dL' },
  'SGOT':  { test_code: 'CHEM_SGOT', test_name: 'SGOT/AST',            unit: 'U/L' },
  'SGPT':  { test_code: 'CHEM_SGPT', test_name: 'SGPT/ALT',            unit: 'U/L' },
  'TBIL':  { test_code: 'CHEM_TBIL', test_name: 'Bilirubin Total',     unit: 'mg/dL' },
  'UA':    { test_code: 'CHEM_UA',   test_name: 'Asam Urat',           unit: 'mg/dL' },
  // Urinalysis
  'UGLU':  { test_code: 'URIN_GLU',  test_name: 'Glukosa Urin',        unit: '' },
  'UPRO':  { test_code: 'URIN_PRO',  test_name: 'Protein Urin',        unit: '' },
  'UPH':   { test_code: 'URIN_PH',   test_name: 'pH Urin',             unit: '' },
};

// ── State Management ─────────────────────────────────────────────────────────
let analyzerMappings = { ...defaultMappings };
let lisServer = null;
let hl7Server = null;
const connectionStatus = {
  astm: { active: false, lastConnect: null, clientCount: 0, messagesReceived: 0 },
  hl7:  { active: false, lastConnect: null, clientCount: 0, messagesReceived: 0 },
};

// ── ASTM Message Parser ──────────────────────────────────────────────────────

function parseASTMMessage(frames) {
  const records = { header: null, patient: null, orders: [], results: [] };

  for (const frame of frames) {
    const type = frame.charAt(0);
    const fields = frame.split('|');

    switch (type) {
      case 'H': // Header record
        records.header = {
          sender: fields[4] || '',
          receiver: fields[9] || '',
          timestamp: fields[13] || '',
        };
        break;
      case 'P': // Patient record
        records.patient = {
          id: fields[2] || '',
          name: fields[5] || '',
          dob: fields[7] || '',
          gender: fields[8] || '',
        };
        break;
      case 'O': // Order record
        records.orders.push({
          order_id: fields[2] || '',
          sample_id: fields[3] || '',
          test_id: fields[4]?.replace(/\^/g, '') || '',
          priority: fields[5] || '',
        });
        break;
      case 'R': // Result record
        const testIdRaw = fields[2]?.replace(/\^/g, '') || '';
        const testId = testIdRaw.split('^').pop() || testIdRaw;
        records.results.push({
          test_id: testId.toUpperCase().trim(),
          value: fields[3] || '',
          unit: fields[4] || '',
          reference_range: fields[5] || '',
          flag: fields[6] || '',
          status: fields[8] || 'F',
          timestamp: fields[12] || '',
        });
        break;
      case 'L': // Terminator record
        break;
    }
  }

  return records;
}

// ── HL7 v2.x Message Parser ─────────────────────────────────────────────────

function parseHL7Message(rawMessage) {
  const segments = rawMessage.split('\r').filter(s => s.length > 0);
  const records = { header: null, patient: null, orders: [], results: [] };

  for (const segment of segments) {
    const fields = segment.split('|');
    const segType = fields[0];

    switch (segType) {
      case 'MSH':
        records.header = {
          sender: fields[2] || '',
          receiver: fields[4] || '',
          timestamp: fields[6] || '',
          message_type: fields[8] || '',
          control_id: fields[9] || '',
        };
        break;
      case 'PID':
        records.patient = {
          id: fields[3]?.split('^')[0] || '',
          name: fields[5]?.replace(/\^/g, ' ') || '',
          dob: fields[7] || '',
          gender: fields[8] || '',
        };
        break;
      case 'OBR':
        records.orders.push({
          order_id: fields[2]?.split('^')[0] || '',
          sample_id: fields[3]?.split('^')[0] || '',
          test_id: fields[4]?.split('^')[0] || '',
          order_datetime: fields[6] || '',
        });
        break;
      case 'OBX':
        const obxId = fields[3]?.split('^')[0] || '';
        records.results.push({
          test_id: obxId.toUpperCase().trim(),
          value: fields[5] || '',
          unit: fields[6]?.split('^')[0] || '',
          reference_range: fields[7] || '',
          flag: fields[8] || '',
          status: fields[11] || 'F',
        });
        break;
    }
  }

  return records;
}

// ── Result Processing ────────────────────────────────────────────────────────

async function processAnalyzerResults(records, protocol = 'ASTM') {
  const processed = [];
  const errors = [];

  for (const result of records.results) {
    const mapping = analyzerMappings[result.test_id];
    if (!mapping) {
      errors.push({ test_id: result.test_id, error: 'No mapping found' });
      continue;
    }

    // Try to find matching lab order by patient ID or sample ID
    let labOrder = null;
    
    // Search by patient MRN
    if (records.patient?.id) {
      labOrder = await prisma.lab_orders.findFirst({
        where: {
          status: { in: ['pending', 'in_progress'] },
          patients: { medical_record_number: records.patient.id },
        },
        orderBy: { order_date: 'desc' },
        include: { lab_results: true },
      }).catch(() => null);
    }

    // Search by order number
    if (!labOrder && records.orders?.[0]?.order_id) {
      labOrder = await prisma.lab_orders.findFirst({
        where: {
          order_number: { contains: records.orders[0].order_id },
          status: { in: ['pending', 'in_progress'] },
        },
        include: { lab_results: true },
      }).catch(() => null);
    }

    if (labOrder) {
      // Upsert result into existing order
      try {
        await prisma.lab_results.upsert({
          where: { order_id_test_code: { order_id: labOrder.id, test_code: mapping.test_code } },
          create: {
            order_id: labOrder.id,
            test_code: mapping.test_code,
            test_name: mapping.test_name,
            result_value: result.value,
            unit: mapping.unit || result.unit,
            reference_range: result.reference_range,
            flag: result.flag === 'H' ? 'high' : result.flag === 'L' ? 'low' : result.flag === 'C' ? 'critical' : null,
            result_date: new Date(),
            source: `analyzer_${protocol.toLowerCase()}`,
          },
          update: {
            result_value: result.value,
            unit: mapping.unit || result.unit,
            reference_range: result.reference_range,
            flag: result.flag === 'H' ? 'high' : result.flag === 'L' ? 'low' : result.flag === 'C' ? 'critical' : null,
            result_date: new Date(),
            source: `analyzer_${protocol.toLowerCase()}`,
          },
        });

        processed.push({
          test_id: result.test_id,
          test_code: mapping.test_code,
          value: result.value,
          order_id: labOrder.id,
          order_number: labOrder.order_number,
        });

        // Update order status if all results are in
        const pending = await prisma.lab_results.count({
          where: { order_id: labOrder.id, result_value: null },
        });
        if (pending === 0) {
          await prisma.lab_orders.update({
            where: { id: labOrder.id },
            data: { status: 'completed' },
          });
        }
      } catch (e) {
        errors.push({ test_id: result.test_id, error: e.message });
      }
    } else {
      // Log unmatched result
      errors.push({
        test_id: result.test_id,
        value: result.value,
        error: 'No matching lab order found',
        patient_id: records.patient?.id,
      });
    }
  }

  // Log to analyzer_logs table
  await prisma.system_settings.upsert({
    where: { setting_key: 'last_analyzer_receive' },
    update: { setting_value: new Date().toISOString() },
    create: { setting_key: 'last_analyzer_receive', setting_value: new Date().toISOString() },
  }).catch(() => {});

  logger.info(`LIS Gateway: ${protocol} processed ${processed.length} results, ${errors.length} errors`);

  return { processed, errors, patient: records.patient };
}

// ── TCP Servers ──────────────────────────────────────────────────────────────

export function startASTMServer(port = 9001) {
  if (lisServer) return;

  lisServer = net.createServer((socket) => {
    connectionStatus.astm.active = true;
    connectionStatus.astm.lastConnect = new Date();
    connectionStatus.astm.clientCount++;

    let frames = [];
    let buffer = '';

    logger.info(`LIS Gateway: ASTM client connected from ${socket.remoteAddress}`);

    socket.on('data', async (data) => {
      for (const byte of data) {
        if (byte === ASTM.ENQ) {
          socket.write(Buffer.from([ASTM.ACK]));
        } else if (byte === ASTM.EOT) {
          // End of transmission — process collected frames
          connectionStatus.astm.messagesReceived++;
          if (frames.length > 0) {
            try {
              const records = parseASTMMessage(frames);
              await processAnalyzerResults(records, 'ASTM');
            } catch (e) {
              logger.error('ASTM processing error', { error: e.message });
            }
          }
          frames = [];
          buffer = '';
        } else if (byte === ASTM.STX) {
          buffer = '';
        } else if (byte === ASTM.ETX || byte === ASTM.ETB) {
          // Remove frame number prefix and checksum
          const frame = buffer.replace(/^\d/, '').trim();
          if (frame) frames.push(frame);
          buffer = '';
          socket.write(Buffer.from([ASTM.ACK]));
        } else if (byte !== ASTM.CR && byte !== ASTM.LF) {
          buffer += String.fromCharCode(byte);
        }
      }
    });

    socket.on('close', () => {
      connectionStatus.astm.clientCount = Math.max(0, connectionStatus.astm.clientCount - 1);
      if (connectionStatus.astm.clientCount === 0) connectionStatus.astm.active = false;
    });

    socket.on('error', (err) => {
      logger.warn('ASTM socket error', { error: err.message });
    });
  });

  lisServer.listen(port, () => {
    logger.info(`LIS Gateway: ASTM server listening on port ${port}`);
  });

  lisServer.on('error', (err) => {
    logger.error('ASTM server error', { error: err.message });
  });
}

export function startHL7Server(port = 9002) {
  if (hl7Server) return;

  hl7Server = net.createServer((socket) => {
    connectionStatus.hl7.active = true;
    connectionStatus.hl7.lastConnect = new Date();
    connectionStatus.hl7.clientCount++;

    let buffer = '';

    logger.info(`LIS Gateway: HL7 client connected from ${socket.remoteAddress}`);

    socket.on('data', async (data) => {
      buffer += data.toString();

      // MLLP framing: <VT> message <FS><CR>
      while (true) {
        const start = buffer.indexOf(String.fromCharCode(HL7.VT));
        const end = buffer.indexOf(String.fromCharCode(HL7.FS));
        if (start === -1 || end === -1 || end < start) break;

        const message = buffer.substring(start + 1, end);
        buffer = buffer.substring(end + 2);

        connectionStatus.hl7.messagesReceived++;

        try {
          const records = parseHL7Message(message);
          await processAnalyzerResults(records, 'HL7');

          // Send HL7 ACK
          const ackMsg = buildHL7ACK(records.header);
          socket.write(Buffer.from([HL7.VT]));
          socket.write(ackMsg);
          socket.write(Buffer.from([HL7.FS, HL7.CR]));
        } catch (e) {
          logger.error('HL7 processing error', { error: e.message });
        }
      }
    });

    socket.on('close', () => {
      connectionStatus.hl7.clientCount = Math.max(0, connectionStatus.hl7.clientCount - 1);
      if (connectionStatus.hl7.clientCount === 0) connectionStatus.hl7.active = false;
    });

    socket.on('error', (err) => {
      logger.warn('HL7 socket error', { error: err.message });
    });
  });

  hl7Server.listen(port, () => {
    logger.info(`LIS Gateway: HL7 server listening on port ${port}`);
  });
}

function buildHL7ACK(header) {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  return [
    `MSH|^~\\&|SIMRS_ZEN|HOSPITAL|${header?.sender || ''}||${ts}||ACK^R01|${ts}|P|2.3.1`,
    `MSA|AA|${header?.control_id || ''}`,
  ].join('\r');
}

// ── Management API ───────────────────────────────────────────────────────────

export function getStatus() {
  return connectionStatus;
}

export function getMappings() {
  return analyzerMappings;
}

export function updateMapping(analyzerCode, mapping) {
  analyzerMappings[analyzerCode] = mapping;
}

export function stopServers() {
  if (lisServer) { lisServer.close(); lisServer = null; }
  if (hl7Server) { hl7Server.close(); hl7Server = null; }
  connectionStatus.astm.active = false;
  connectionStatus.hl7.active = false;
}
