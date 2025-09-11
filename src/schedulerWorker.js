let timer = null;

self.onmessage = (ev) => {
  const data = ev.data || {};
  if (data.cmd === 'start') {
    const intervalMs = Math.max(10, Math.min(1000, Math.floor(data.intervalMs || 25)));
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      try { self.postMessage({ type: 'tick' }); } catch {}
    }, intervalMs);
  } else if (data.cmd === 'stop') {
    if (timer) clearInterval(timer);
    timer = null;
  }
};

