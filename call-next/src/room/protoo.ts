import qs from 'qs';

export function getProtooUrl(params: Record<string, unknown>): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  let protooPort = 4443;
  if (hostname === 'test.mediasoup.org') protooPort = 4444;

  const wsProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'ws' : 'wss';

  const query = qs.stringify(params);

  return `${wsProtocol}://${hostname}:${protooPort}/?${query}`;
}

