export default class VideoFragment {
    constructor(videoFile) {
        this.video = videoFile;
        this.start = 0;
        this.end = 1;
        this.playbackRate = 1;
        this.volume = 1;
    }

    get adjustedDuration() {
        let duration = this.video.duration / this.playbackRate
        let cut = this.end - this.start;
        return duration * cut;
    }
}