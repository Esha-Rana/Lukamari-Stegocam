const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class Peer {
  constructor({ onSignal, onDataChannel, onStateChange }) {
    this.onSignal = onSignal;
    this.onDataChannel = onDataChannel;
    this.onStateChange = onStateChange;
    this.pc = null;
    this.dc = null;
    this.pendingCandidates = [];
  }

  _createPC() {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[ICE] Candidate found, sending');
        this.onSignal({ type: 'candidate', candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      console.log(`[ICE] ${s}`);
      if (s === 'checking') this.onStateChange('connecting');
      if (s === 'connected' || s === 'completed') this.onStateChange('ice-established');
      if (s === 'failed' || s === 'disconnected') this.onStateChange('error');
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PC] connectionState: ${pc.connectionState}`);
    };

    pc.ondatachannel = ({ channel }) => {
      console.log('[DC] Received data channel from peer');
      this.dc = channel;
      this.onDataChannel(channel);
    };

    this.pc = pc;
    return pc;
  }

  async createOffer() {
    console.log('[Peer] Creating offer');
    this._createPC();
    this.dc = this.pc.createDataChannel('stego', { ordered: true });
    console.log('[DC] Created data channel');
    this.onDataChannel(this.dc);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('[Signal] Offer sent');
    this.onSignal({ type: 'offer', offer: this.pc.localDescription });
  }

  async handleOffer(offer) {
    console.log('[Peer] Handling offer');
    this._createPC();
    await this.pc.setRemoteDescription(offer);
    await this._flushPendingCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    console.log('[Signal] Answer sent');
    this.onSignal({ type: 'answer', answer: this.pc.localDescription });
  }

  async handleAnswer(answer) {
    console.log('[Peer] Handling answer');
    await this.pc.setRemoteDescription(answer);
    await this._flushPendingCandidates();
  }

  async addCandidate(candidate) {
    if (!this.pc || !this.pc.remoteDescription) {
      console.log('[ICE] Queuing candidate');
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(candidate);
      console.log('[ICE] Candidate added');
    } catch (e) {
      console.warn('[ICE] Failed to add candidate', e);
    }
  }

  async _flushPendingCandidates() {
    console.log(`[ICE] Flushing ${this.pendingCandidates.length} pending candidates`);
    for (const candidate of this.pendingCandidates) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn('[ICE] Failed to add pending candidate', e);
      }
    }
    this.pendingCandidates = [];
  }

  destroy() {
    this.dc?.close();
    this.pc?.close();
    this.pc = null;
    this.dc = null;
    this.pendingCandidates = [];
    console.log('[Peer] Destroyed');
  }
}