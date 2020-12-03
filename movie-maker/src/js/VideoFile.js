import pcm from 'pcm-extract'

export default class VideoFile {
    constructor(probeData, screenshots) {
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
        stream.on('readable', () => {
            let avg = 0;
            while (true) {
                let value = stream.read();
                if (value === null)
                    break;
                avg += value;
                if (i++ % 1000 === 0) {
                    let index = Math.floor(i / 1000);
                    this.pcm[index] = avg / 1000;
                    avg = 0;
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