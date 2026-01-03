# MIGRATION_MAP (mediasoup-demo v3 → Next.js + oRPC/WS + Bun)

This document is the **Phase 0 source-of-truth map**. It lists the **exact signaling methods/events and lifecycle ordering** as implemented in this repository, and the **1:1 names** we will use in the new oRPC-over-WebSocket stack.

**Non-negotiable rule for this migration:** behavior and ordering come **only** from this repo (current workspace). No speculative mediasoup behavior is introduced.

---

## Canonical protocol definitions (authoritative list of names + payload shapes)

- [`server/src/signaling/protooMessages.ts`](server/src/signaling/protooMessages.ts)
  - Defines:
    - Client→Server **Requests** (`protoo.request(method, data)`)
    - Client→Server **Notifications** (`protoo.notify(method, data)`)
    - Server→Client **Notifications** (`peer.notify(method, data)`)
    - Server→Client **Requests** (`peer.request(method, data)`) — notably `newConsumer` / `newDataConsumer`

---

## A) Protoo requests → oRPC procedures (Client → Server)

**Policy:** keep method names **identical** in oRPC (minimal semantic/name change).  
So **new oRPC procedure name == old protoo request method**.

| Protoo request (C→S) | Demo references (client) | Demo references (server) | New oRPC procedure |
|---|---|---|---|
| `getRouterRtpCapabilities` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`_joinRoom`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getRouterRtpCapabilities` |
| `join` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`_joinRoom`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`), [`server/src/Room.ts`](server/src/Room.ts) (`peer.on('joined')`) | `join` |
| `createWebRtcTransport` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`_joinRoom`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`), [`server/src/Room.ts`](server/src/Room.ts) (`peer.on('create-webrtc-transport')`) | `createWebRtcTransport` |
| `connectWebRtcTransport` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`sendTransport.on('connect')`, `recvTransport.on('connect')`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `connectWebRtcTransport` |
| `restartIce` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`restartIce`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `restartIce` |
| `produce` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`sendTransport.on('produce')`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `produce` |
| `produceData` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`sendTransport.on('producedata')`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `produceData` |
| `getTransportStats` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`getTransportStats`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getTransportStats` |
| `getProducerStats` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`getProducerStats`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getProducerStats` |
| `getConsumerStats` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`getConsumerStats`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getConsumerStats` |
| `getDataProducerStats` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`getDataProducerStats`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getDataProducerStats` |
| `getDataConsumerStats` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`getDataConsumerStats`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest`) | `getDataConsumerStats` |
| `applyNetworkThrottle` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`applyNetworkThrottle`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest` → emits) | `applyNetworkThrottle` |
| `stopNetworkThrottle` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`stopNetworkThrottle`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest` → emits) | `stopNetworkThrottle` |

---

## B) Notifications / events → WS events (both directions)

### B1) Protoo notifications (Client → Server) → WS client->server events

**Policy:** keep method names **identical** (minimal rename).  
So **new WS event name == old protoo notification method**.

| Protoo notification (C→S) | Demo references (client) | Demo references (server) | New WS event |
|---|---|---|---|
| `closeProducer` | (used from `RoomClient` when closing producers) [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `closeProducer` |
| `pauseProducer` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `pauseProducer` |
| `resumeProducer` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `resumeProducer` |
| `pauseConsumer` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`_pauseConsumer`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `pauseConsumer` |
| `resumeConsumer` | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`_resumeConsumer`) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `resumeConsumer` |
| `setConsumerPreferredLayers` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `setConsumerPreferredLayers` |
| `setConsumerPriority` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `setConsumerPriority` |
| `requestConsumerKeyFrame` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `requestConsumerKeyFrame` |
| `changeDisplayName` | [`app/src/RoomClient.js`](app/src/RoomClient.js) | [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooNotification`) | `changeDisplayName` |

### B2) Protoo notifications (Server → Client) → WS server->client push events

**Policy:** keep method names **identical** (minimal rename).  
So **new WS push event name == old protoo server notification method**.

| Protoo notification (S→C) | Demo references (server) | Demo references (client) | New WS push event |
|---|---|---|---|
| `mediasoupVersion` | [`server/src/Peer.ts`](server/src/Peer.ts) (`this.notify('mediasoupVersion', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`protoo.on('notification')`) | `mediasoupVersion` |
| `newPeer` | [`server/src/Room.ts`](server/src/Room.ts) (`otherPeer.notify('newPeer', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'newPeer'`) | `newPeer` |
| `peerDisplayNameChanged` | [`server/src/Room.ts`](server/src/Room.ts) (`notify('peerDisplayNameChanged', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'peerDisplayNameChanged'`) | `peerDisplayNameChanged` |
| `peerClosed` | [`server/src/Room.ts`](server/src/Room.ts) (`notify('peerClosed', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'peerClosed'`) | `peerClosed` |
| `producerScore` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('producerScore', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'producerScore'`) | `producerScore` |
| `speakingPeers` | [`server/src/Room.ts`](server/src/Room.ts) (`notify('speakingPeers', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'speakingPeers'`) | `speakingPeers` |
| `activeSpeaker` | [`server/src/Room.ts`](server/src/Room.ts) (`notify('activeSpeaker', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'activeSpeaker'`) | `activeSpeaker` |
| `consumerPaused` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('consumerPaused', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'consumerPaused'`) | `consumerPaused` |
| `consumerResumed` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('consumerResumed', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'consumerResumed'`) | `consumerResumed` |
| `consumerScore` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('consumerScore', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'consumerScore'`) | `consumerScore` |
| `consumerLayersChanged` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('consumerLayersChanged', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'consumerLayersChanged'`) | `consumerLayersChanged` |
| `consumerClosed` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('consumerClosed', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'consumerClosed'`) | `consumerClosed` |
| `dataConsumerClosed` | [`server/src/Peer.ts`](server/src/Peer.ts) (`notify('dataConsumerClosed', ...)`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`case 'dataConsumerClosed'`) | `dataConsumerClosed` |

### B3) Protoo server→client *requests* → WS server->client push-*requests* (must preserve response/accept semantics)

These are **server-initiated** messages where the client responds (Protoo `accept()` / `reject()`).

**Policy:** keep names **identical** to preserve 1:1 mapping and avoid semantic drift.

| Protoo request (S→C) | Demo references (server) | Demo references (client) | New WS push-request name |
|---|---|---|---|
| `newConsumer` | [`server/src/Peer.ts`](server/src/Peer.ts) (`this.request('newConsumer', ...)` inside `consume()`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`protoo.on('request')` → `case 'newConsumer'`) | `newConsumer` |
| `newDataConsumer` | [`server/src/Peer.ts`](server/src/Peer.ts) (`this.request('newDataConsumer', ...)` inside `consumeData()`) | [`app/src/RoomClient.js`](app/src/RoomClient.js) (`protoo.on('request')` → `case 'newDataConsumer'`) | `newDataConsumer` |

---

## C) Key lifecycle steps (exact ordering + implementation locations)

### C1) Client join flow (router caps → device.load → create transports → join)

**Client implementation:** [`app/src/RoomClient.js`](app/src/RoomClient.js) (`async _joinRoom()`)

Proof excerpt (router caps then `device.load`):

```js
const { routerRtpCapabilities } = await this._protoo.request(
  'getRouterRtpCapabilities'
);

await this._mediasoupDevice.load({
  routerRtpCapabilities,
  preferLocalCodecsOrder: this._preferLocalCodecsOrder,
});
```

Proof excerpt (create send transport happens before `join`):

```js
if (this._produce) {
  const transportInfo = await this._protoo.request(
    'createWebRtcTransport',
    { /* ... */ }
  );
  this._sendTransport = this._mediasoupDevice.createSendTransport({ id: transportInfo.transportId, /* ... */ });
}
```

Proof excerpt (`join` request after transport setup):

```js
const { peers } = await this._protoo.request('join', {
  displayName: this._displayName,
  device: this._device,
  rtpCapabilities: this._consume ? this._mediasoupDevice.rtpCapabilities : undefined,
});
```

### C2) DTLS connect: only from transport `"connect"` callback

**Client implementation:** [`app/src/RoomClient.js`](app/src/RoomClient.js) (`this._sendTransport.on('connect', ...)`, `this._recvTransport.on('connect', ...)`)

Proof excerpt:

```js
this._sendTransport.on('connect', ({ dtlsParameters: dtlsParameters2 }, callback, errback) => {
  this._protoo
    .request('connectWebRtcTransport', { transportId: this._sendTransport.id, dtlsParameters: dtlsParameters2 })
    .then(callback)
    .catch(errback);
});
```

**Server implementation:** [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest` → `case 'connectWebRtcTransport'`)

Proof excerpt:

```ts
case 'connectWebRtcTransport': {
  const { transportId, dtlsParameters } = data;
  const transport = this.assertAndGetWebRtcTransport(transportId);
  await transport.connect({ dtlsParameters });
  accept();
  break;
}
```

### C3) Produce: only from transport `"produce"` callback; server returns `producerId`; client uses it as callback id

**Client implementation:** [`app/src/RoomClient.js`](app/src/RoomClient.js) (`this._sendTransport.on('produce', ...)`)

Proof excerpt:

```js
const { producerId } = await this._protoo.request('produce', {
  transportId: this._sendTransport.id,
  kind,
  rtpParameters,
  appData,
});
callback({ id: producerId });
```

**Server implementation:** [`server/src/Peer.ts`](server/src/Peer.ts) (`handleProtooRequest` → `case 'produce'`)

Proof excerpt:

```ts
case 'produce': {
  const { transportId, kind, rtpParameters, appData } = data;
  const transport = this.assertAndGetWebRtcTransport(transportId);
  const producer = await transport.produce({ kind, rtpParameters, appData: { peerId: this.id, source: appData.source } });
  accept({ producerId: producer.id });
  break;
}
```

### C4) Consume ordering invariant (server creates paused consumer → server requests `newConsumer` → client consumes → client `accept()` → server resumes)

**Server creates Consumer paused=true + requests client + resumes only after client accepts:**  
[`server/src/Peer.ts`](server/src/Peer.ts) (`async consume(...)`)

Proof excerpt:

```ts
consumer = await transport.consume({
  producerId: producer.id,
  rtpCapabilities: this.#rtpCapabilities!,
  enableRtx: true,
  paused: true,
  ignoreDtx: true,
  appData: { peerId: producer.appData.peerId, source: producer.appData.source },
});
await this.request('newConsumer', { consumerId: consumer.id, producerId: producer.id, kind: consumer.kind, rtpParameters: consumer.rtpParameters, /* ... */ });
await consumer.resume();
```

**Client consumes on `newConsumer` server-request and answers with `accept()` (which triggers the server resume above):**  
[`app/src/RoomClient.js`](app/src/RoomClient.js) (`protoo.on('request')` → `case 'newConsumer'`)

Proof excerpt (client-side `recvTransport.consume(...)`):

```js
const consumer = await this._recvTransport.consume({
  id: consumerId,
  producerId,
  kind,
  rtpParameters,
  streamId: `${peerId}-${appData.source === 'screensharing' ? 'screensharing' : 'audio-video'}`,
  appData: { ...appData, peerId },
});
```

Proof excerpt (`accept()` after consumer creation):

```js
// We are ready. Answer the protoo request so the server will
// resume this Consumer (which was paused for now if video).
accept();
```

### C5) “New producers trigger consume” (no separate `newProducer` notification; server directly fan-outs `newConsumer` requests)

**Server logic:** [`server/src/Room.ts`](server/src/Room.ts) (`peer.on('new-producer', ...)`)

Proof excerpt:

```ts
peer.on('new-producer', async ({ producer }) => {
  const otherPeers = this.getOtherPeers(peer);
  for (const otherPeer of otherPeers) {
    void otherPeer.consume({ producer, consumerReplicas: this.#consumerReplicas });
  }
});
```

### C6) Peer join/leave notifications (announce peers; and initial consume of existing producers)

**Server logic:** [`server/src/Room.ts`](server/src/Room.ts) (`peer.on('joined', ...)`, `peer.on('disconnected', ...)`)

Proof excerpt (notify `newPeer` + consume existing producers):

```ts
for (const otherPeer of otherPeers) {
  otherPeer.notify('newPeer', { peer: peer.serialize() });
  for (const producer of otherPeer.getProducers()) {
    void peer.consume({ producer, consumerReplicas: this.#consumerReplicas });
  }
}
```

Proof excerpt (notify `peerClosed`):

```ts
for (const otherPeer of otherPeers) {
  otherPeer.notify('peerClosed', { peerId: peer.id });
}
```

---

## Renames (old → new)

None yet. **Planned approach is “keep names identical”** for all request/notification methods to enforce 1:1 mapping.

