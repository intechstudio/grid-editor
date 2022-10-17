
import { appSettings } from './app-helper.store';

import { get } from 'svelte/store';

const ipcRenderer = window.sketchyAPI;


//import * as influx from '@influxdata/influxdb-client';

const version = ipcRenderer.sendSync('app_version')

console.log('SUPP')

// You can generate an API token from the "API Tokens Tab" in the UI
/**
console.log('env', ctxProcess.env)

const token = ctxProcess.env.INFLUX_TOKEN
const org = ctxProcess.env.INFLUX_ORG
const bucket = ctxProcess.env.INFLUX_BUCKET
const server = ctxProcess.env.INFLUX_SERVER

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
const node_env = ctxProcess.env.NODE_ENV;

const writeApi = client.getWriteApi(org, bucket)
  */
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