import test from 'node:test';
import assert from 'node:assert/strict';
import { readMotorSse, waitMotorRetry } from '../lib/motor-sse.mjs';

function stream(text) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({start(controller) {
    // Split inside UTF-8 characters and across CRLF/frame boundaries.
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  }});
}
test('SSE parses fragmented UTF8, comments and multiline JSON sequentially', async () => {
  const seen = []; let inFlight = false;
  await readMotorSse(stream(': heartbeat\r\nevent: events\r\ndata: {"codigo":\r\ndata: "\u00f1"}\r\n\r\nevent: status\ndata: {"ready":true}\n\n'), async (type, value) => {
    assert.equal(inFlight, false); inFlight = true;
    await new Promise(resolve => setTimeout(resolve, 1));
    seen.push({type,value}); inFlight = false;
  });
  assert.deepEqual(seen, [{type:'events',value:{codigo:'\u00f1'}},{type:'status',value:{ready:true}}]);
});
test('incomplete frame is not accepted; handler failures propagate for durable replay', async () => {
  let count = 0;
  await readMotorSse(stream('event: events\ndata: {"id":1}\n'), () => { count++; });
  assert.equal(count, 0);
  await assert.rejects(readMotorSse(stream('event: events\ndata: {"id":1}\n\n'), () => { throw new Error('ACK unavailable'); }), /ACK unavailable/);
});
test('oversized frames and invalid JSON are rejected', async () => {
  const oversized = new ReadableStream({start(c) { c.enqueue(new TextEncoder().encode('data: ' + 'x'.repeat(1024*1024+1))); c.close(); }});
  await assert.rejects(readMotorSse(oversized, () => {}), /grande/);
  await assert.rejects(readMotorSse(stream('data: nope\n\n'), () => {}), SyntaxError);
});
test('reconnect wait cancels on unmount without leaving a timer', async () => {
  const controller = new AbortController();
  const waiting = waitMotorRetry(30000, controller.signal);
  controller.abort();
  await waiting;
  await waitMotorRetry(30000, controller.signal);
});
