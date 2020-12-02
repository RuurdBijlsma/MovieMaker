export default class VideoFragment {
    constructor(videoFile) {
        this.video = videoFile;
        this.start = 0;
        this.end = 1;
        this.playbackRate = 1;
        this.volume = 1;
    }

    reset() {
        this.video.element.pause();
        this.video.element.currentTime = this.start * this.video.duration;
    }

    get progress() {
        let videoProgress = this.video.element.currentTime / this.video.duration;
        let cutPortion = this.end - this.start;
        return (videoProgress - this.start) * cutPortion;
    }

    get adjustedDuration() {
        let duration = this.video.duration / this.playbackRate
        let cut = this.end - this.start;
        let adjusted = duration * cut;
        return isNaN(adjusted) ? 0 : adjusted;
    }
}