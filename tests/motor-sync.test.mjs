import test from 'node:test';
import * as biometricProtocol from '../lib/biometric-protocol.mjs';
import * as motorSse from '../lib/motor-sse.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual transport with a fake browser and fetch: no server, DB or USB.
const source = readFileSync(new URL('../lib/motor-huella.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function browser(push, openStream) {
  const notices = [], broadcasts = [], requests = [];
  const exports = {};
  const token = `test.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  const window = new EventTarget();
  window.addEventListener('hexodus:biometric-changed', event => notices.push(event.detail));
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
  vm.runInNewContext(compiled, {
    exports,
    require: name => {
      if (name === './biometric-protocol.mjs') return biometricProtocol;
      if (name === './motor-sse.mjs') return motorSse;
      assert.equal(name, './auth');
      return { AuthService: { getToken: () => token, clearAuthData: () => assert.fail('unexpected logout') } };
    },
    process: { env: { NEXT_PUBLIC_API_URL: 'https://backend.test/api', NEXT_PUBLIC_MOTOR_URL: 'http://localhost:4000' } },
    window, CustomEvent, Headers, Response, AbortController, TextDecoder, Uint8Array, atob,
    setTimeout, clearTimeout,
    BroadcastChannel: class {
      postMessage(message) { broadcasts.push(message); }
      close() {}
    },
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (url === 'https://backend.test/api/asistencia/huellas/sincronizar?kioskId=KIOSKO-HUELLA-01') {
        return json({ success: true, snapshot: 'signed-new-snapshot' });
      }
      if (url === 'https://backend.test/api/asistencia/huellas/sesion') {
        return json({ success: true, data: { motorToken: 'temporary-capability', expiresAtUtc: new Date(Date.now() + 600000).toISOString() } });
      }
      if (url === 'http://localhost:4000/cargar-cache') return push(init, json);
      if (url === 'http://localhost:4000/eventos/stream' && openStream) return openStream(init, json);
      assert.fail(`unexpected request: ${url}`);
    },
  });
  return { api: exports, notices, broadcasts, requests };
}

test('push waits for reader confirmation and announces completed sync without another invalidation', async () => {
  let confirm, started;
  const pushing = new Promise(resolve => { started = resolve; });
  const context = browser(async (init, json) => {
    assert.deepEqual(JSON.parse(init.body), { snapshot: 'signed-new-snapshot' });
    assert.equal(new Headers(init.headers).get('X-Motor-Token'), 'temporary-capability');
    started();
    return new Promise(resolve => { confirm = () => resolve(json({ success: true, totalCargadas: 601, revision: '12' })); });
  });
  assert.equal(context.requests.length, 0, 'import does not start requests');
  let finished = false;
  const pending = context.api.sincronizarCacheMotorHuella(undefined, { scope: 'enrollment' }).then(result => { finished = true; return result; });
  await pushing;
  assert.equal(finished, false);
  assert.equal(context.notices.length, 0, 'not ready before local confirmation');
  confirm();
  const result = await pending;
  assert.equal(result.totalCargadas, 601);
  assert.equal(context.requests.length, 3, 'one snapshot, capability and local push');
  assert.equal(context.notices.length, 1);
  assert.equal(context.broadcasts.length, 1);
  assert.equal(context.notices[0].type, 'synchronized');
  assert.equal(context.notices[0].totalCargadas, 601);
  assert.equal(context.broadcasts[0].snapshot, undefined, 'no templates in cross-tab notice');
});

test('SSE uses header authorization and passes frames without event polling', async () => {
  const frames = [];
  let streams = 0;
  const context = browser(() => assert.fail('no cache mutation'), (init, json) => {
    streams++;
    assert.equal(new Headers(init.headers).get('X-Motor-Token'), 'temporary-capability');
    assert.equal(new Headers(init.headers).get('Accept'), 'text/event-stream');
    if (streams === 1) return json({success:false}, 401);
    return new Response('event: ready\ndata: {"instanceId":"test"}\n\nevent: events\ndata: {"success":true,"data":{"eventos":[]}}\n\n', {headers:{'Content-Type':'text/event-stream'}});
  });
  assert.equal(context.api.MOTOR_SSE, true, 'SSE is the default transport');
  await context.api.consumirEventosMotorSse(async (type, payload) => frames.push({type,payload}));
  assert.deepEqual(frames.map(f=>f.type), ['ready','events']);
  assert.equal(streams, 2, '401 refreshes capability once');
  assert.equal(context.requests.filter(r=>r.url.includes('/huellas/sesion')).length, 2);
  assert.equal(context.requests.some(r=>r.url.includes('/eventos?') || r.url.includes('Token=')), false);
});

test('SSE cancellation interrupts an idle stream and releases its reader', async () => {
  const abort = new AbortController();
  let opened;
  const connected = new Promise(resolve=>{ opened=resolve; });
  const context = browser(() => assert.fail('no mutation'), init => {
    const body = new ReadableStream({ start(controller) {
      init.signal.addEventListener('abort',()=>controller.error(new DOMException('Aborted','AbortError')), {once:true});
      opened();
    }});
    return new Response(body, {headers:{'Content-Type':'text/event-stream'}});
  });
  const consuming = context.api.consumirEventosMotorSse(async()=>{}, {signal:abort.signal});
  await connected;
  abort.abort();
  await assert.rejects(consuming, {name:'AbortError'});
});

test('failed local push never reports the new member ready', async () => {
  const context = browser((_init, json) => json({ success: false, message: 'Lector no disponible' }, 503));
  await assert.rejects(context.api.sincronizarCacheMotorHuella(), /Lector no disponible/);
  assert.equal(context.notices.length, 0);
  assert.equal(context.broadcasts.length, 0);
  assert.equal(context.requests.length, 3, 'no periodic or infinite retry after failure');
});
