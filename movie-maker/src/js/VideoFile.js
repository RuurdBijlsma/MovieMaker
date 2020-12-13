import pcm from 'pcm-extract'
import EventEmitter from 'events'
import Utils from "@/js/Utils";

export default class VideoFile extends EventEmitter {
    constructor(probeData, screenshots) {
        super();
        this.probe = probeData;
        this.screenshots = screenshots;
        this.container = null;

        // 10 points per second
        const avgWindowSize = this.audioStream.sample_rate / 10;
        this.pcm = new Float32Array(Math.ceil(this.audioStream.sample_rate * this.duration / avgWindowSize));
        this._elCache = null;

        this.canPlay = false;
        this.on('canplay', () => {
            this.canPlay = true;
        });

        this.source = null;
        this.gainNode = null;

        let stream = pcm.getStream({
            filepath: this.filePath,
            channels: 1,
            ffmpeg: VideoFile.ffmpegPath,
        });
        let i = 0;
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
            if (el === undefined)
                return null;
            this.source = VideoFile.audioContext.createMediaElementSource(el);
            if (this.gainNode)
                this.gainNode.disconnect();
            this.gainNode = VideoFile.audioContext.createGain();
            this.source.connect(this.gainNode);
            this.gainNode.connect(VideoFile.audioContext.destination);
            if (el)
                this._elCache = el;
        }
        return this._elCache;
    }

    get fileName() {
        return Utils.baseFileName(this.filePath);
    }

    get bitrate() {
        return this.videoStream.bit_rate;
    }

    get fps() {
        let fps = this.videoStream.avg_frame_rate.split('/').map(n => +n);
        return Math.round(fps[0] / fps[1] * 100) / 100;
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

    toJSON() {
        return this.filePath;
    }
}
VideoFile.ffmpegPath = 'ffmpeg';
VideoFile.audioContext = new AudioContext();