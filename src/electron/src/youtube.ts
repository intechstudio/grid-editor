import { google } from 'googleapis';
import log from 'electron-log';

const youtube = google.youtube('v3');

export async function getLatestVideo(){
  return new Promise((resolve, reject)=>{
    youtube.playlistItems.list({
      key: process.env["YOUTUBE_API_KEY"],
      part: ['snippet'],
      playlistId: process.env["YOUTUBE_RELEASENOTES_PLAYLIST_ID"],
      maxResults: 100,
    }, (err, results) => {
      if (err) {
        log.error(err);
        reject({
          videoId: undefined,
          videLink: undefined
        })
      } else {
        const snippet = results.data.items[results.data.items.length-1].snippet
        const videoLink = "https://www.youtube.com/watch?v="+snippet.resourceId.videoId
        const videoId = snippet.resourceId.videoId
        resolve({
          videoId: videoId, 
          videoLink: videoLink
        });
      } 
    })
  }).catch(err => {
    return {
      videoId: undefined,
      videLink: undefined
    }
  })
  
}
