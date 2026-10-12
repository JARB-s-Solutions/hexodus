/** One audio engine per document; authorization is never assumed from localStorage. */
export function createKioskAudio({ createContext, loadSuccess, activationTimeoutMs = 2000 }) {
  let context = null, successBuffer = null, loading = false, activating = null, source = null
  let state = "blocked"
  const listeners = new Set()
  const publish = value => { state = value; for (const listener of listeners) listener(value) }
  const stop = () => {
    if (source) { try { source.stop() } catch {} }
    source = null
  }
  const refresh = () => publish(context?.state === "running" ? "ready" : "blocked")

  const activate = () => {
    if (activating) return activating
    // Also called on load in the dedicated kiosk browser with autoplay permitted.
    // When invoked by a gesture, resume remains synchronous before any fetch/await.
    let resume
    try {
      if (!context || context.state === "closed") {
        context = createContext()
        if (!context) { publish("unavailable"); return Promise.resolve(false) }
        context.onstatechange = refresh
      }
      resume = context.resume()
    } catch { publish("unavailable"); return Promise.resolve(false) }
    publish("activating")
    let timer
    activating = Promise.race([
      Promise.resolve(resume),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("audio-activation-timeout")), activationTimeoutMs) }),
    ]).then(() => {
      refresh()
      if (context.state === "running" && !successBuffer && !loading) {
        loading = true
        // While the original success sound loads, a short confirmation tone is available.
        void Promise.resolve().then(() => loadSuccess(context))
          .then(buffer => { successBuffer = buffer }).catch(() => {})
          .finally(() => { loading = false })
      }
      return context.state === "running"
    }).catch(() => { refresh(); return false })
      .finally(() => { clearTimeout(timer); activating = null })
    return activating
  }

  const play = type => {
    // Never queue old access sounds or try to unlock audio from a fingerprint/SSE event.
    if (!context || context.state !== "running") { refresh(); return false }
    stop()
    let gain
    try {
      const now = context.currentTime
      const node = type === "success" && successBuffer ? context.createBufferSource() : context.createOscillator()
      source = node
      gain = context.createGain()
      node.connect(gain)
      gain.connect(context.destination)
      node.onended = () => {
        node.disconnect(); gain.disconnect()
        if (source === node) source = null
      }
      if (type === "success" && successBuffer) {
        node.buffer = successBuffer
        node.start()
      } else {
        const warning = type === "warning", success = type === "success"
        const duration = success ? 0.25 : warning ? 0.5 : 0.8
        node.type = warning || success ? "sine" : "sawtooth"
        node.frequency.setValueAtTime(success ? 880 : warning ? 523.25 : 330, now)
        if (warning) node.frequency.setValueAtTime(659.25, now + 0.2)
        if (!warning && !success) node.frequency.exponentialRampToValueAtTime(261, now + duration)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.linearRampToValueAtTime(0, now + duration)
        node.start(now); node.stop(now + duration)
      }
      return true
    } catch {
      stop(); gain?.disconnect(); publish("blocked"); return false
    }
  }

  return {
    activate, play, stop,
    getState: () => state,
    subscribe(listener) { listeners.add(listener); listener(state); return () => { listeners.delete(listener) } },
  }
}

/** Local lifecycle recovery only: no HTTP polling and no replay of old access sounds. */
export function attachKioskAudioRecovery(audio, browserWindow, page, intervalMs = 15000) {
  let everReady = audio.getState() === "ready"
  const unsubscribe = audio.subscribe(state => { if (state === "ready") everReady = true })
  const recover = () => {
    if (page.visibilityState !== "hidden" && audio.getState() !== "ready") void audio.activate()
  }
  const gesture = event => { if (event.isTrusted) recover() }
  browserWindow.addEventListener("click", gesture)
  browserWindow.addEventListener("keydown", gesture)
  browserWindow.addEventListener("focus", recover)
  browserWindow.addEventListener("pageshow", recover)
  page.addEventListener("visibilitychange", recover)
  // Retry interrupted audio that already worked. A browser policy block at first
  // load remains visible instead of generating an endless series of rejected resumes.
  const timer = setInterval(() => { if (everReady) recover() }, intervalMs)
  recover()
  return () => {
    clearInterval(timer); unsubscribe()
    browserWindow.removeEventListener("click", gesture)
    browserWindow.removeEventListener("keydown", gesture)
    browserWindow.removeEventListener("focus", recover)
    browserWindow.removeEventListener("pageshow", recover)
    page.removeEventListener("visibilitychange", recover)
  }
}

export function getKioskAudio() {
  const key = "__hexodusKioskAudioV1"
  if (!window[key]) window[key] = createKioskAudio({
    createContext: () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      return AudioContextClass ? new AudioContextClass() : null
    },
    loadSuccess: async context => {
      const response = await fetch("/sounds/success.wav", { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error("audio-file-unavailable")
      return context.decodeAudioData(await response.arrayBuffer())
    },
  })
  return window[key]
}
