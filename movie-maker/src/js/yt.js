import {google} from "googleapis";
import fs from 'fs'

export async function upload(win, {ytId, ytSecret, tokens, filePath, title, description, privacy, mime, uploadId}) {
    const oauth2Client = new google.auth.OAuth2(
        ytId,
        ytSecret,
        "http://localhost:38901",
    );
    oauth2Client.setCredentials(tokens);
    let fileSize = fs.statSync(filePath).size;
    let service = google.youtube('v3')
    console.log("Uploading", title);
    return await service.videos.insert({
        auth: oauth2Client,
        part: 'snippet,status',
        resource: {
            snippet: {
                title: title,
                description: description,
            },
            status: {
                privacyStatus: privacy,
            },
        },
        media: {
            mimeType: mime,
            body: fs.createReadStream(filePath)
        },
    }, {
        onUploadProgress: e => {
            win.webContents.send('progress' + uploadId, e.bytesRead, fileSize);
        }
    });
}
















