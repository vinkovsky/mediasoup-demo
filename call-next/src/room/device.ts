export type PeerDevice = {
  flag: 'chrome' | 'firefox' | 'safari' | 'opera' | 'edge' | 'unknown';
  name: string;
  version?: string;
};

function extractVersion(ua: string, marker: RegExp): string | undefined {
  const match = ua.match(marker);
  return match?.[1];
}

export function getPeerDevice(): PeerDevice {
  if (typeof navigator === 'undefined') {
    return { flag: 'unknown', name: 'unknown' };
  }

  const ua = navigator.userAgent;

  // Edge.
  if (/\sEdg\//.test(ua)) {
    return { flag: 'edge', name: 'Microsoft Edge', version: extractVersion(ua, /Edg\/([0-9.]+)/) };
  }

  // Opera.
  if (/\sOPR\//.test(ua)) {
    return { flag: 'opera', name: 'Opera', version: extractVersion(ua, /OPR\/([0-9.]+)/) };
  }

  // Firefox.
  if (/\sFirefox\//.test(ua)) {
    return { flag: 'firefox', name: 'Firefox', version: extractVersion(ua, /Firefox\/([0-9.]+)/) };
  }

  // Safari (but not Chrome).
  const isSafari = /\sSafari\//.test(ua) && !/\sChrome\//.test(ua) && !/\sChromium\//.test(ua);
  if (isSafari) {
    return { flag: 'safari', name: 'Safari', version: extractVersion(ua, /Version\/([0-9.]+)/) };
  }

  // Chrome/Chromium.
  if (/\sChrome\//.test(ua) || /\sChromium\//.test(ua)) {
    return { flag: 'chrome', name: 'Chrome', version: extractVersion(ua, /Chrome\/([0-9.]+)/) };
  }

  return { flag: 'unknown', name: ua };
}

