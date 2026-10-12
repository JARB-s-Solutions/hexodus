import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnrollmentLine, encodeTemplateUtf8, deliverEvent, validateEventPage, accessPresentation } from '../lib/biometric-protocol.mjs';

test('aviso de vencimiento mantiene permiso, pero recuperaciones y denegaciones nunca lo conceden', async () => {
  const data = { decision: 'permitido', motivo_codigo: 'proximo_vencer', motivo_texto: 'Tu membresía vence en 2 días' };
  assert.deepEqual(accessPresentation({ success: true, data }), { type: 'warning', message: data.motivo_texto, allowed: true });
  const recovered = accessPresentation({ success: true, data: { ...data, recovered: true } });
  assert.equal(recovered.type, 'warning'); assert.equal(recovered.allowed, false);
  const denied = accessPresentation({ success: true, data: { ...data, decision: 'denegado' } });
  assert.equal(denied.type, 'error'); assert.equal(denied.allowed, false);
  assert.equal(accessPresentation({ success: true, data: { ...data, motivo_codigo: 'ok' } }).type, 'success');
  let acked = false;
  const result = await deliverEvent({ eventId: 'warning', eventProof: 'proof' }, async () => ({ ok: true, payload: { success: true, data, receipt: 'receipt' } }), async () => { acked = true });
  assert.equal(acked, true); assert.equal(result.presentation.type, 'warning'); assert.equal(result.presentation.allowed, true);
});

test('XML se deserializa antes de extraerlo y se codifica UTF8 sin escapes JSON', () => {
  const xml = '<Fmd version="1">\n<Bytes>áéñ</Bytes>\n</Fmd>';
  const result = parseEnrollmentLine(JSON.stringify({ tipo: 'resultado', success: true, huellaTemplate: xml, enrollmentProof: 'signed-proof' }));
  assert.equal(result.template, xml);
  assert.equal(Buffer.from(encodeTemplateUtf8(result.template), 'base64').toString('utf8'), xml);
  assert.throws(() => parseEnrollmentLine(JSON.stringify({ success: false, code: 'HUELLA_DUPLICADA' })), /ya está registrada/);
  assert.throws(() => parseEnrollmentLine(JSON.stringify({ success: true, huellaTemplate: xml })), /comprobación/);
  assert.throws(() => parseEnrollmentLine('not-json'), /inválida/);
});

test('paginación de 65 eventos procesa todas las páginas sin avanzar a latestId', async () => {
  let cursor = 0; const seen = [];
  const all = Array.from({ length: 65 }, (_, i) => ({ id: i + 1, eventId: `event-${i}`, eventProof: `proof-${i}` }));
  while (cursor < 65) {
    const page = validateEventPage({ success: true, data: { latestId: 65, eventos: all.filter(e => e.id > cursor).slice(0, 20) } }, cursor);
    for (const event of page) {
      await deliverEvent(event, async () => ({ ok: true, status: 200, payload: { success: true, data: { decision: 'denegado' }, receipt: event.eventId } }), async receipt => seen.push(receipt));
      cursor = event.id;
    }
  }
  assert.equal(seen.length, 65); assert.equal(new Set(seen).size, 65);
  assert.throws(() => validateEventPage({ success: true, data: { eventos: [{ id: 2 }, { id: 1 }] } }, 0), /orden/);
});

test('fallo de red,401 y ACK fallido conservan el mismo evento para reintento', async () => {
  const event = { id: 1, eventId: 'same-event', eventProof: 'same-proof' };
  let ackCount = 0; const sent = [];
  const server = async body => { sent.push(body); return { ok: true, status: 200, payload: { success: true, data: { decision: 'permitido' }, receipt: 'signed-receipt' } }; };
  await assert.rejects(deliverEvent(event, async () => { throw new Error('offline'); }, () => ackCount++), /offline/);
  await assert.rejects(deliverEvent(event, async () => ({ ok: false, status: 401, payload: {} }), () => ackCount++), { status: 401 });
  await assert.rejects(deliverEvent(event, server, async () => { throw new Error('ack-offline'); }), /ack-offline/);
  await deliverEvent(event, server, async () => ackCount++);
  assert.deepEqual(sent, [{ eventProof: 'same-proof' }, { eventProof: 'same-proof' }]); assert.equal(ackCount, 1);
});

test('HTTP200 no equivale a permiso; denegaciones y recuperaciones nunca autorizan paso', async () => {
  assert.equal(accessPresentation({ success: true, data: { decision: 'denegado' } }).allowed, false);
  assert.equal(accessPresentation({ success: true, data: { decision: 'permitido', recovered: true } }).allowed, false);
  assert.equal(accessPresentation({ success: false }, true, false).type, 'error');
  assert.throws(() => accessPresentation({ success: true }), /decisión/);
  await assert.rejects(deliverEvent({ eventId: 'x', eventProof: 'p' }, async () => ({ ok: true, payload: { success: true, data: { decision: 'permitido' } } }), () => assert.fail('must not ACK')), /confirmación/);
  const replay = await deliverEvent({ eventId: 'old', eventProof: 'p', capturedAtUtc: new Date(Date.now() - 300000).toISOString() }, async () => ({ ok: true, payload: { success: true, data: { decision: 'permitido', recovered: false }, receipt: 'r' } }), async () => {});
  assert.equal(replay.presentation.allowed, false);
});


test('acepta el XML Fid que serializa DPUruNet y conserva bytes y prueba', () => {
  // Envelope reproduced with the installed SDK and synthetic bytes, not a real fingerprint.
  const xml = '<?xml version="1.0" encoding="UTF-8"?><Fid><Bytes>AQIDBA==</Bytes><Format>1769473</Format><Version>1.0</Version></Fid>';
  const parsed = parseEnrollmentLine(JSON.stringify({ success: true, huellaTemplate: xml, enrollmentProof: 'signed-proof' }));
  assert.equal(parsed.template, xml);
  assert.equal(parsed.proof, 'signed-proof');
  assert.equal(Buffer.from(encodeTemplateUtf8(parsed.template), 'base64').toString('utf8'), xml);
  for (const invalid of [xml.replace('</Fid>', '</Fmd>'), '<!DOCTYPE Fid>' + xml, xml + '\u0000', '<Other>data</Other>']) {
    assert.throws(() => parseEnrollmentLine(JSON.stringify({ success: true, huellaTemplate: invalid, enrollmentProof: 'signed-proof' })), /XML inv/);
  }
  assert.throws(() => parseEnrollmentLine(JSON.stringify({ success: true, huellaTemplate: xml })), /comprob/);
});
