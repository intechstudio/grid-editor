
import { appSettings } from './app-helper.store';

import { get } from 'svelte/store';

const ipcRenderer = window.sketchyAPI;


import * as influx from '@influxdata/influxdb-client';

const version = ipcRenderer.sendSync('app_version')

console.log('SUPP')

// You can generate an API token from the "API Tokens Tab" in the UI
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const server = process.env.INFLUX_SERVER

if (token && org && bucket && server){

  console.log("Analytics Ready!")
}
else{
  
  console.log("Analytics ENV Failed")
}

const client = new influx.InfluxDB({url: server, token: token})

let sessionid = Date.now();
const user_platform = get(appSettings).os;


const userId = ipcRenderer.sendSync('analytics_uuid');
const node_env = process.env.NODE_ENV;

const writeApi = client.getWriteApi(org, bucket)
 
function track_event(category, action, label, value){

/**
  let measurement = "AppUsage"

  writeApi.useDefaultTags({nodeenv: node_env, platform: user_platform})
 
  const point = new influx.Point(measurement)
  .stringField("uuid", userId)  
  .stringField("version", version)
  .uintField("sessionid", sessionid)
  .uintField("timestamp", Date.now() - sessionid)
  .stringField("category", category)
  .stringField("action", action)
  .stringField("label", label)
  .stringField("value", value)

  try{
    writeApi.writePoint(point)
  }catch(e){
    console.log("Analytics: ", e)
  }

 */
  

}





let analytics = {track_event}

export {analytics}