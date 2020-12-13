export default class VideoFragment {
    constructor(videoFile, id) {
        this.video = videoFile;
        this.start = 0;
        this.end = 1;
        this.playbackRate = 1;
        this.volume = 1;
        if (id !== undefined) {
            this.id = id;
            VideoFragment.id = id + 1;
        } else {
            this.id = VideoFragment.id++;
        }
    }

    get portion() {
        return this.end - this.start;
    }

    reset() {
        if (this.video.element === null)
            return;
        this.video.element.pause();
        this.video.element.currentTime = this.start * this.video.duration;
    }

    get progress() {
        if (this.video.element === null)
            return 0;
        let videoProgress = this.video.element.currentTime / this.video.duration;
        return (videoProgress - this.start) / this.portion;
    }

    get adjustedDuration() {
        if (this.video.element === null)
            return 0;
        let duration = this.video.duration / this.playbackRate;
        let adjusted = duration * this.portion;
        return isNaN(adjusted) ? 0 : adjusted;
    }

    static fromObject(videoFile, obj) {
        let fragment = new VideoFragment(videoFile, obj.id);
        fragment.start = obj.start;
        fragment.end = obj.end;
        fragment.volume = obj.volume;
        fragment.playbackRate = obj.playbackRate;
        return fragment;
    }
}

VideoFragment.id = 0;