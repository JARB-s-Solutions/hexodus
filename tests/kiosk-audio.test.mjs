import test from 'node:test';
import assert from 'node:assert/strict';
import { createKioskAudio, attachKioskAudioRecovery } from '../lib/kiosk-audio.mjs';

function fixture(options = {}) {
  let created = 0, played = 0, resumed = 0;
  const parameter = { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const context = {
    state: 'suspended', currentTime: 0, destination: {},
    resume() { resumed++; this.state = 'running'; this.onstatechange?.(); return Promise.resolve(); },
    createOscillator() { return { frequency: parameter, connect() {}, disconnect() {}, start() { played++; }, stop() {} }; },
    createBufferSource() { return this.createOscillator(); },
    createGain() { return { gain: parameter, connect() {}, disconnect() {} }; },
  };
  const audio = createKioskAudio({ createContext: () => { created++; return context; }, loadSuccess: async () => ({}), activationTimeoutMs: 20, ...options });
  return { audio, context, counts: () => ({ created, played, resumed }) };
}

test('lecturas previas al clic no crean audio bloqueado ni se reproducen más tarde', async () => {
  const { audio, counts } = fixture();
  for (const type of ['success', 'warning', 'error']) assert.equal(audio.play(type), false);
  assert.deepEqual(counts(), { created: 0, played: 0, resumed: 0 });
  assert.equal(await audio.activate(), true);
  assert.equal(counts().played, 0);
  assert.equal(audio.play('warning'), true);
  assert.equal(counts().played, 1);
});

test('reutiliza el contexto y permite recuperar sonido suspendido sin cerrar pestaña', async () => {
  const { audio, context, counts } = fixture();
  const states = []; const unsubscribe = audio.subscribe(s => states.push(s));
  await audio.activate();
  for (const type of ['success', 'warning', 'error']) assert.equal(audio.play(type), true);
  context.state = 'suspended'; context.onstatechange();
  assert.equal(audio.getState(), 'blocked'); assert.equal(audio.play('success'), false);
  await audio.activate(); assert.equal(audio.play('success'), true);
  assert.equal(counts().created, 1); assert.equal(counts().played, 4);
  unsubscribe(); const before = states.length;
  context.state = 'suspended'; context.onstatechange(); assert.equal(states.length, before);
  // Fast Refresh remounts subscriptions; the document engine remains ready/recoverable.
  await audio.activate(); let next; audio.subscribe(s => { next = s }); assert.equal(next, 'ready');
});

test('un bloqueo rechazado o pendiente deja reintentar; un archivo faltante conserva el tono', async () => {
  const { audio, context } = fixture({ loadSuccess: async () => { throw new Error('missing'); } });
  const resume = context.resume;
  context.resume = () => Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
  assert.equal(await audio.activate(), false); assert.equal(audio.getState(), 'blocked');
  context.resume = () => new Promise(() => {});
  assert.equal(await audio.activate(), false); assert.equal(audio.getState(), 'blocked');
  context.resume = resume;
  assert.equal(await audio.activate(), true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(audio.play('success'), true);
});

test('crea y reanuda directamente en el gesto, comparte activaciones y recrea contexto cerrado', async () => {
  const { audio, context, counts } = fixture();
  const first = audio.activate(); const second = audio.activate();
  assert.equal(first, second); assert.equal(counts().resumed, 1);
  await first;
  context.state = 'closed'; context.onstatechange();
  await audio.activate(); assert.equal(counts().created, 2);
});

test('arranque automático y recuperación al volver a la pestaña sin reproducir registros antiguos', async () => {
  const { audio, context, counts } = fixture();
  const browserWindow = new EventTarget(), page = new EventTarget(); page.visibilityState = 'visible';
  const cleanup = attachKioskAudioRecovery(audio, browserWindow, page, 10);
  try {
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(audio.getState(), 'ready'); assert.equal(counts().played, 0);
    context.state = 'suspended'; context.onstatechange();
    browserWindow.dispatchEvent(new Event('focus'));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(audio.getState(), 'ready');
    context.state = 'suspended'; context.onstatechange();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(audio.getState(), 'ready'); assert.equal(counts().created, 1);
  } finally { cleanup(); }
  const before = counts().resumed;
  context.state = 'suspended'; context.onstatechange(); browserWindow.dispatchEvent(new Event('focus'));
  await new Promise(resolve => setTimeout(resolve, 25)); assert.equal(counts().resumed, before);
});
