import protooClient from 'protoo-client';
import * as mediasoupClient from 'mediasoup-client';

import { getPeerDevice } from './device';
import { getProtooUrl } from './protoo';

type RoomConnectionState = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export type RemoteTrack = {
  id: string;
  peerId: string;
  kind: 'audio' | 'video';
  stream: MediaStream;
  label: string;
};

export type RoomConnectionCallbacks = {
  onState: (state: RoomConnectionState, error?: unknown) => void;
  onLocalStream: (stream: MediaStream | null) => void;
  onRemoteTrackAdded: (track: RemoteTrack) => void;
  onRemoteTrackRemoved: (trackId: string) => void;
  onServerMediasoupVersion?: (version: string) => void;
};

export class RoomConnection {
  readonly roomId: string;
  readonly displayName: string;
  readonly peerId: string;

  #callbacks: RoomConnectionCallbacks;

  #closed = false;
  // protoo-client is untyped, keep it as `any` in this minimal app.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #protoo: any | null = null;

  #device: mediasoupClient.types.Device | null = null;
  #sendTransport: mediasoupClient.types.Transport | null = null;
  #recvTransport: mediasoupClient.types.Transport | null = null;

  #micProducer: mediasoupClient.types.Producer | null = null;
  #webcamProducer: mediasoupClient.types.Producer | null = null;

  #localStream: MediaStream | null = null;

  #consumers: Map<string, mediasoupClient.types.Consumer> = new Map();
  #consumerTrackIds: Map<string, string> = new Map();
  #consumeChain: Promise<void> = Promise.resolve();

  constructor({
    roomId,
    displayName,
    peerId,
    callbacks,
  }: {
    roomId: string;
    displayName: string;
    peerId: string;
    callbacks: RoomConnectionCallbacks;
  }) {
    this.roomId = roomId;
    this.displayName = displayName;
    this.peerId = peerId;
    this.#callbacks = callbacks;
  }

  async join(): Promise<void> {
    if (this.#closed) return;
    if (this.#protoo) return;

    this.#callbacks.onState('connecting');

    const protooUrl = getProtooUrl({ roomId: this.roomId, peerId: this.peerId });
    const transport = new protooClient.WebSocketTransport(protooUrl);
    const peer = new protooClient.Peer(transport);

    this.#protoo = peer;

    peer.on('open', () => {
      void this.#joinRoom().catch((error: unknown) => {
        this.#callbacks.onState('error', error);
        this.close();
      });
    });

    peer.on('failed', () => {
      this.#callbacks.onState('error', new Error('WebSocket connection failed'));
    });

    peer.on('disconnected', () => {
      this.#callbacks.onState('closed');
      this.close();
    });

    peer.on('close', () => {
      if (this.#closed) return;
      this.close();
    });

    peer.on('request', (request: any, accept: any, reject: any) => {
      // Serialize consumer creation to avoid races.
      this.#consumeChain = this.#consumeChain.then(async () => {
        if (request.method === 'newConsumer') {
          await this.#handleNewConsumerRequest(request, accept, reject);
          return;
        }

        reject(404, `Unsupported request method '${request.method}'`);
      });
    });

    peer.on('notification', (notification: any) => {
      if (notification.method === 'mediasoupVersion') {
        const version = notification.data?.version;
        if (typeof version === 'string') this.#callbacks.onServerMediasoupVersion?.(version);
        return;
      }

      if (notification.method === 'consumerClosed') {
        const consumerId = notification.data?.consumerId;
        if (typeof consumerId === 'string') this.#removeConsumer(consumerId);
        return;
      }
    });
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;

    this.#micProducer?.close();
    this.#webcamProducer?.close();
    this.#sendTransport?.close();
    this.#recvTransport?.close();

    for (const consumer of this.#consumers.values()) {
      try {
        consumer.close();
      } catch {}
    }
    this.#consumers.clear();
    for (const trackId of this.#consumerTrackIds.values()) {
      this.#callbacks.onRemoteTrackRemoved(trackId);
    }
    this.#consumerTrackIds.clear();

    if (this.#localStream) {
      for (const track of this.#localStream.getTracks()) track.stop();
    }
    this.#localStream = null;
    this.#callbacks.onLocalStream(null);

    try {
      this.#protoo?.close();
    } catch {}
    this.#protoo = null;

    this.#callbacks.onState('closed');
  }

  async enableMic(): Promise<void> {
    if (!this.#sendTransport || !this.#device) throw new Error('Not connected yet');
    if (this.#micProducer) return;

    if (!this.#device.canProduce('audio')) {
      throw new Error('This browser cannot produce audio');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const track = stream.getAudioTracks()[0];

    this.#localStream ??= new MediaStream();
    this.#localStream.addTrack(track);
    this.#callbacks.onLocalStream(this.#localStream);

    this.#micProducer = await this.#sendTransport.produce({
      track,
      appData: { source: 'audio' },
    });

    this.#micProducer.on('transportclose', () => {
      this.#micProducer = null;
    });
  }

  disableMic(): void {
    if (!this.#micProducer) return;

    const id = this.#micProducer.id;
    try {
      this.#micProducer.close();
    } finally {
      this.#micProducer = null;
    }

    this.#protoo?.notify('closeProducer', { producerId: id });

    const track = this.#localStream?.getAudioTracks()[0];
    if (track) {
      track.stop();
      this.#localStream?.removeTrack(track);
      this.#callbacks.onLocalStream(this.#localStream?.getTracks().length ? this.#localStream : null);
    }
  }

  async enableWebcam(): Promise<void> {
    if (!this.#sendTransport || !this.#device) throw new Error('Not connected yet');
    if (this.#webcamProducer) return;

    if (!this.#device.canProduce('video')) {
      throw new Error('This browser cannot produce video');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    const track = stream.getVideoTracks()[0];

    this.#localStream ??= new MediaStream();
    this.#localStream.addTrack(track);
    this.#callbacks.onLocalStream(this.#localStream);

    this.#webcamProducer = await this.#sendTransport.produce({
      track,
      appData: { source: 'video' },
    });

    this.#webcamProducer.on('transportclose', () => {
      this.#webcamProducer = null;
    });
  }

  disableWebcam(): void {
    if (!this.#webcamProducer) return;

    const id = this.#webcamProducer.id;
    try {
      this.#webcamProducer.close();
    } finally {
      this.#webcamProducer = null;
    }

    this.#protoo?.notify('closeProducer', { producerId: id });

    const track = this.#localStream?.getVideoTracks()[0];
    if (track) {
      track.stop();
      this.#localStream?.removeTrack(track);
      this.#callbacks.onLocalStream(this.#localStream?.getTracks().length ? this.#localStream : null);
    }
  }

  async #joinRoom(): Promise<void> {
    if (!this.#protoo) throw new Error('Protoo not ready');

    // mediasoup-client Device.
    const createdDevice: mediasoupClient.types.Device = await (mediasoupClient as any).Device.factory();
    this.#device = createdDevice;

    const { routerRtpCapabilities } = await this.#protoo.request('getRouterRtpCapabilities');
    await createdDevice.load({ routerRtpCapabilities });

    // Send transport.
    const sendInfo = await this.#protoo.request('createWebRtcTransport', {
      forceTcp: false,
      appData: { direction: 'producer' },
      sctpCapabilities: undefined,
    });

    this.#sendTransport = createdDevice.createSendTransport({
      id: sendInfo.transportId,
      iceParameters: sendInfo.iceParameters,
      iceCandidates: sendInfo.iceCandidates,
      dtlsParameters: { ...sendInfo.dtlsParameters, role: 'auto' },
      sctpParameters: sendInfo.sctpParameters,
      iceServers: [],
    });

    this.#sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.#protoo!
        .request('connectWebRtcTransport', {
          transportId: this.#sendTransport!.id,
          dtlsParameters,
        })
        .then(callback)
        .catch(errback);
    });

    this.#sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const { producerId } = await this.#protoo!.request('produce', {
          transportId: this.#sendTransport!.id,
          kind,
          rtpParameters,
          appData,
        });

        callback({ id: producerId });
      } catch (error) {
        errback(error as any);
      }
    });

    // Recv transport.
    const recvInfo = await this.#protoo.request('createWebRtcTransport', {
      forceTcp: false,
      appData: { direction: 'consumer' },
      sctpCapabilities: undefined,
    });

    this.#recvTransport = createdDevice.createRecvTransport({
      id: recvInfo.transportId,
      iceParameters: recvInfo.iceParameters,
      iceCandidates: recvInfo.iceCandidates,
      dtlsParameters: { ...recvInfo.dtlsParameters, role: 'auto' },
      sctpParameters: recvInfo.sctpParameters,
      iceServers: [],
    });

    this.#recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.#protoo!
        .request('connectWebRtcTransport', {
          transportId: this.#recvTransport!.id,
          dtlsParameters,
        })
        .then(callback)
        .catch(errback);
    });

    await this.#protoo.request('join', {
      displayName: this.displayName,
      device: getPeerDevice(),
      rtpCapabilities: createdDevice.rtpCapabilities,
      sctpCapabilities: undefined,
    });

    this.#callbacks.onState('connected');
  }

  async #handleNewConsumerRequest(request: any, accept: any, reject: any): Promise<void> {
    if (!this.#recvTransport) {
      reject(500, 'No recv transport');
      return;
    }

    const {
      peerId,
      consumerId,
      producerId,
      kind,
      rtpParameters,
      appData,
    }: {
      peerId: string;
      consumerId: string;
      producerId: string;
      kind: 'audio' | 'video';
      rtpParameters: mediasoupClient.types.RtpParameters;
      appData: { source: string };
    } = request.data;

    const consumer = await this.#recvTransport.consume({
      id: consumerId,
      producerId,
      kind,
      rtpParameters,
      streamId: `${peerId}-${appData?.source === 'screensharing' ? 'screensharing' : 'audio-video'}`,
      appData: { ...(appData ?? {}), peerId },
    });

    this.#consumers.set(consumer.id, consumer);
    consumer.on('transportclose', () => {
      this.#removeConsumer(consumer.id);
    });

    const trackId = `${consumer.id}:${consumer.kind}`;
    this.#consumerTrackIds.set(consumer.id, trackId);

    const stream = new MediaStream([consumer.track]);
    this.#callbacks.onRemoteTrackAdded({
      id: trackId,
      peerId,
      kind: consumer.kind,
      stream,
      label: `${peerId} (${consumer.kind})`,
    });

    accept();
  }

  #removeConsumer(consumerId: string): void {
    const consumer = this.#consumers.get(consumerId);
    if (consumer) {
      try {
        consumer.close();
      } catch {}
      this.#consumers.delete(consumerId);
    }

    const trackId = this.#consumerTrackIds.get(consumerId);
    if (trackId) {
      this.#consumerTrackIds.delete(consumerId);
      this.#callbacks.onRemoteTrackRemoved(trackId);
    }
  }
}

