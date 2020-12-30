import EventEmitter from 'events'
import Utils from "@/js/Utils";

export default class VideoFile extends EventEmitter {
    constructor(probeData, screenshots, loudness) {
        super();
        this.probe = probeData;
        this.screenshots = screenshots;
        this.container = null;
        this.analyser = null;
        this.dataArray = null;

        this._elCache = null;

        this.canPlay = false;
        this.on('canplay', () => {
            this.canPlay = true;
        });

        this.source = null;
        this.gainNode = null;
        this.loudness = loudness;
    }

    get element() {
        if (this.container === null)
            return null;
        if (this._elCache === null) {
            let el = [...this.container.children].find(c => c.getAttribute('id') === this.filePath);
            if (el === undefined)
                return null;
            this.source = VideoFile.audioContext.createMediaElementSource(el);

            if (this.analyser)
                this.analyser.disconnect();
            if (this.gainNode)
                this.gainNode.disconnect();

            this.gainNode = VideoFile.audioContext.createGain();
            this.source.connect(this.gainNode);

            if (this.isAudio) {
                this.analyser = VideoFile.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                this.gainNode.connect(this.analyser);
                this.analyser.connect(VideoFile.audioContext.destination);
            } else {
                this.gainNode.connect(VideoFile.audioContext.destination);
            }
            if (el)
                this._elCache = el;
        }
        return this._elCache;
    }

    get hasAudio() {
        return this.audioStream !== undefined;
    }

    get isAudio() {
        return this.videoStream.codec_name === 'png' || this.videoStream.codec_name === 'jpg';
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