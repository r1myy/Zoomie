// Le mixeur individuel — cœur du produit (section 4.3 du cahier des charges).
// Chaque flux audio distant reste séparé jusqu'ici : on lui applique un gain
// local, jamais renvoyé au serveur, avec un plafond anti-saturation.

const SAFETY_MAX_DB = 12;
const SAFETY_MAX_GAIN = Math.pow(10, SAFETY_MAX_DB / 20);

function percentToGain(percent: number) {
  return Math.max(0, Math.min(percent / 100, SAFETY_MAX_GAIN));
}

interface ParticipantNodes {
  source: MediaStreamAudioSourceNode;
  gain: GainNode;
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
}

export class MixerEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private nodes = new Map<string, ParticipantNodes>();

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  async resume() {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  setMasterPercent(percent: number) {
    this.master.gain.value = percentToGain(percent);
  }

  addParticipantTrack(identity: string, track: MediaStreamTrack) {
    this.removeParticipant(identity);

    const stream = new MediaStream([track]);
    const source = this.ctx.createMediaStreamSource(stream);
    const gain = this.ctx.createGain();
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;

    source.connect(gain);
    gain.connect(analyser);
    gain.connect(this.master);

    this.nodes.set(identity, {
      source,
      gain,
      analyser,
      data: new Uint8Array(analyser.frequencyBinCount),
    });
  }

  setParticipantPercent(identity: string, percent: number) {
    const node = this.nodes.get(identity);
    if (node) node.gain.gain.value = percentToGain(percent);
  }

  getParticipantLevel(identity: string): number {
    const node = this.nodes.get(identity);
    if (!node) return 0;
    node.analyser.getByteTimeDomainData(node.data);
    let sumSquares = 0;
    for (const value of node.data) {
      const normalized = (value - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / node.data.length);
  }

  removeParticipant(identity: string) {
    const node = this.nodes.get(identity);
    if (!node) return;
    node.source.disconnect();
    node.gain.disconnect();
    node.analyser.disconnect();
    this.nodes.delete(identity);
  }

  dispose() {
    for (const identity of Array.from(this.nodes.keys())) {
      this.removeParticipant(identity);
    }
    this.master.disconnect();
    void this.ctx.close();
  }
}
