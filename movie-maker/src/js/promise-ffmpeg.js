import util from 'util'
import path from 'path'

const ffmpeg = window.require('fluent-ffmpeg');

ffmpeg.ffprobe = util.promisify(ffmpeg.ffprobe)

ffmpeg.screenshot = (file, folder, timeStamp) => {
    return new Promise(((resolve, reject) => {
        let fileName = Math.round(Math.random() * 100000000) + '.png';
        ffmpeg(file)
            .on('end', () => resolve(path.join(folder, fileName).replace(/\\/g, '/')))
            .on('error', reject)
            .screenshots({
                timestamps: [timeStamp],
                size: '?x256',
                filename: fileName,
                folder: folder,
            });
    }))
}

export default ffmpeg;