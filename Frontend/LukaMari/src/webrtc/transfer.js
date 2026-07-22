const CHUNK_SIZE = 16384;
const TRANSFER_COMPLETE_ACK = 'TRANSFER_COMPLETE_ACK';

export class TransferManager {
  constructor({ onProgress, onComplete, onStateChange }) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onStateChange = onStateChange;
    this.chunks = [];
    this.totalChunks = 0;
    this.receivedChunks = 0;
  }

  attachChannel(dc) {
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log('[DC] Open');
      this.onStateChange('webrtc-established');
    };

    dc.onclose = () => console.log('[DC] Closed');

    dc.onerror = (e) => {
      console.error('[DC] Error', e);
      this.onStateChange('error');
    };

    dc.onmessage = ({ data }) => {
      if (typeof data === 'string') {
        if (data.startsWith('TOTAL:')) {
          this.totalChunks = parseInt(data.slice(6));
          this.receivedChunks = 0;
          this.chunks = [];
          console.log(`[Transfer] Expecting ${this.totalChunks} chunks`);
          this.onStateChange('sending');
        } else if (data === 'EOF') {
          console.log('[Transfer] EOF — reconstructing blob');
          const blob = new Blob(this.chunks, { type: 'image/png' });
          this.onProgress(100);
          this.onComplete(blob);
          dc.send(TRANSFER_COMPLETE_ACK);
          this.chunks = [];
        } else if (data === TRANSFER_COMPLETE_ACK) {
          console.log('[Transfer] Receiver confirmed the image');
          this.onStateChange('complete');
        }
      } else {
        this.chunks.push(data);
        this.receivedChunks++;
        if (this.totalChunks > 0) {
          const pct = Math.round((this.receivedChunks / this.totalChunks) * 100);
          this.onProgress(pct);
          console.log(`[Transfer] Chunk ${this.receivedChunks}/${this.totalChunks}`);
        }
      }
    };
  }

  async sendBlob(dc, blob) {
    if (!dc || dc.readyState !== 'open') {
      throw new Error('[Transfer] DataChannel not open');
    }
    const buffer = await blob.arrayBuffer();
    const numChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
    console.log(`[Transfer] Sending ${numChunks} chunks`);
    dc.send(`TOTAL:${numChunks}`);
    this.onStateChange('sending');

    for (let i = 0; i < buffer.byteLength; i += CHUNK_SIZE) {
      const chunk = buffer.slice(i, i + CHUNK_SIZE);
      while (dc.bufferedAmount > 8 * 1024 * 1024) {
        await new Promise(r => setTimeout(r, 30));
      }
      dc.send(chunk);
      const idx = Math.floor(i / CHUNK_SIZE) + 1;
      this.onProgress(Math.round((idx / numChunks) * 100));
      console.log(`[Transfer] Sent chunk ${idx}/${numChunks}`);
    }

    dc.send('EOF');
    console.log('[Transfer] EOF sent');
  }

  reset() {
    this.chunks = [];
    this.totalChunks = 0;
    this.receivedChunks = 0;
  }
}
