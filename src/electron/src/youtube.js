const { google } = require('googleapis');
const youtube = google.youtube('v3');
const log = require('electron-log');

async function getLatestVideo(){
  return new Promise((resolve, reject)=>{
    youtube.playlistItems.list({
      key: process.env["YOUTUBE_API_KEY"],
      part: 'snippet',
      playlistId: process.env["YOUTUBE_RELEASENOTES_PLAYLIST_ID"],
      maxResult: 100,
    }, (err, results) => {
      if (err) {
        log.error(err);
        reject(err)
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
  })
  
}

module.exports = {getLatestVideo}
