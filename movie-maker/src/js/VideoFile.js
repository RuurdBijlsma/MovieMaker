import pcm from 'pcm-extract'
import EventEmitter from 'events'

export default class VideoFile extends EventEmitter {
    constructor(probeData, screenshots) {
        super();
        this.probe = probeData;
        this.screenshots = screenshots;
        this.container = null;

        this.pcm = new Float32Array(Math.ceil(this.audioStream.sample_rate * this.duration / 1000));
        this._elCache = null;

        let stream = pcm.getStream({
            filepath: this.filePath,
            channels: 1,
            ffmpeg: VideoFile.ffmpegPath,
        });
        let i = 0;
        const avgWindowSize = 1000;
        this.pcmLoaded = false;
        stream.on('readable', () => {
            let avg = 0;
            while (true) {
                let value = stream.read();
                if (value === null)
                    break;
                avg += Math.abs(value);
                if (i++ % avgWindowSize === 0) {
                    let index = Math.floor(i / avgWindowSize);
                    this.pcm[index] = avg / avgWindowSize;
                    avg = 0;
                    if (index + 1 >= this.pcm.length) {
                        this.emit("pcm");
                        this.pcmLoaded = true;
                    }
                }
            }
        });
    }

    get element() {
        if (this.container === null)
            return null;
        if (this._elCache === null) {
            let el = [...this.container.children].find(c => c.getAttribute('id') === this.filePath);
            if (el)
                this._elCache = el;
        }
        return this._elCache;
    }

    get streams() {
        return this.probe.streams;
    }

    get videoStream() {
        return this.streams.find(s => s.codec_type === 'video');
    }

    get audioStream() {
        return this.streams.find(s => s.codec_type === 'audio');
    }

    get aspectRatio() {
        return this.width / this.height;
    }

    get width() {
        return this.videoStream.width;
    }

    get height() {
        return this.videoStream.height;
    }

    get filePath() {
        return this.probe.format.filename;
    }

    get duration() {
        return this.probe.format.duration;
    }
}
VideoFile.ffmpegPath = 'ffmpeg';