require('dotenv').config();

const { ipcRenderer } = require('electron');

import { appSettings } from './app-helper.store';

import { get } from 'svelte/store';

const {InfluxDB} = require('@influxdata/influxdb-client')




// You can generate an API token from the "API Tokens Tab" in the UI
const token = '7ABXsBiTxyxEFSwbdlZRKq5T7sAEQnUoHIaxvAwy_EfwUSJ19xXw7hEhvTltSaFpZJbGzug3mseZbjOfLL7-sg=='
const org = 'sukuwc@riseup.net'
const bucket = "editor_analytics"

const client = new InfluxDB({url: 'https://europe-west1-1.gcp.cloud2.influxdata.com', token: token})

let sessionid = Date.now();
const user_platform = get(appSettings).os;

const {Point} = require('@influxdata/influxdb-client')

const userId = ipcRenderer.sendSync('analytics_uuid');
const node_env = process.env.NODE_ENV;

const writeApi = client.getWriteApi(org, bucket)

function track_event(category, action, label, value){

  let measurement = "AppUsage"

  writeApi.useDefaultTags({nodeenv: node_env, platform: user_platform})
 
  const point = new Point(measurement)
  .stringField("uuid", userId)
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

}





let analytics = {track_event}

// track session init event
analytics.track_event("application", "version report", "version", ipcRenderer.sendSync('app_version'))

export {analytics}