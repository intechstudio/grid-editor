import { store } from '../main-store';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import influx from '@influxdata/influxdb-client';
import { app } from 'electron';
import log from 'electron-log'
import dotenv from 'dotenv';
dotenv.config();

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = store.get('userId') || uuidv4();
// (re)save the userid, so it persists for the next app session.
store.set('userId', userId)

// using the measurement protocol
export async function googleAnalytics(name, params) {

  const measurement_id = `G-SJB4MHFG3N`;
  const api_secret = `snyDyY8-Rka6ZrCTe_6m-A`;

  console.log('send to google...', userId, name, params);

  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`, {
      method: "POST",
      body: JSON.stringify({
        client_id: userId,
        events: [
          {
            name: name.replace(/\s|-/g, '_'),
            params: params
          }
        ]
      })
    })
  } catch (error) {
    console.log('google analytics error', error)
  }
  
}

let client;
let writeApi;
  
export function influxAnalytics(category, action, label, value){

  const sessionid = Date.now();
  const user_platform = process.platform;
  const node_env = process.env.NODE_ENV;
  const version = app.getVersion();

  let measurement = "AppUsage";
    
  function init(){
    const token = process.env.INFLUX_TOKEN
    const org = process.env.INFLUX_ORG
    const bucket = process.env.INFLUX_BUCKET
    const server = process.env.INFLUX_SERVER!
  
    if (token && org && bucket && server) {
      log.info("Influx Analytics Ready!")
    }
    else {
      log.info("Influx Analytics ENV Failed")
    }

    client = new influx.InfluxDB({url: server, token: token})
    writeApi  = client.getWriteApi(org!, bucket!)
  }

  if(client == undefined || writeApi == undefined){
    init();
  }

  try{
    const point = new influx.Point(measurement)
      .stringField("uuid", userId)  
      .stringField("version", version)
      .uintField("sessionid", sessionid)
      .uintField("timestamp", Date.now() - sessionid)
      .stringField("category", category)
      .stringField("action", action)
      .stringField("label", label)
      .stringField("value", value)

    writeApi.useDefaultTags({nodeenv: node_env!, platform: user_platform})
    writeApi.writePoint(point)
  }catch(e){
    console.log("Analytics: ", e)
  }
  
}

