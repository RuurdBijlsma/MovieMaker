export default class VideoFragment {
    constructor(videoFile) {
        this.video = videoFile;
        this.start = 0;
        this.end = 1;
        this.playbackRate = 1;
        this.volume = 1;
    }

    get id() {
        return this.video.filePath + '|' + this.start + '|' + this.end;
    }

    get portion() {
        return this.end - this.start;
    }

    reset() {
        this.video.element.pause();
        this.video.element.currentTime = this.start * this.video.duration;
    }

    get progress() {
        let videoProgress = this.video.element.currentTime / this.video.duration;
        return (videoProgress - this.start) / this.portion;
    }

    get adjustedDuration() {
        let duration = this.video.duration / this.playbackRate;
        let adjusted = duration * this.portion;
        return isNaN(adjusted) ? 0 : adjusted;
    }
}