import { store } from '../main-store';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import influx from '@influxdata/influxdb-client';
import { app } from 'electron';
import dotenv from 'dotenv';
dotenv.config()

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

const version = app.getVersion();
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const server = process.env.INFLUX_SERVER!

if (token && org && bucket && server) {
  console.log("Influx Analytics Ready!")
}
else {
  console.log("Influx Analytics ENV Failed")
}

const client = new influx.InfluxDB({url: server, token: token})
const writeApi = client.getWriteApi(org!, bucket!)

const sessionid = Date.now();
const user_platform = process.platform;
const node_env = process.env.NODE_ENV;

export function influxAnalytics(category, action, label, value){

  console.log('send to influx...', category, action, label, value);

  let measurement = "AppUsage"

  writeApi.useDefaultTags({nodeenv: node_env!, platform: user_platform})
 
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
  
}