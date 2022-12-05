import { Webhook } from 'simple-discord-webhooks';
import dotenv from 'dotenv';
dotenv.config()

const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);

export async function sendToDiscord(message){

  console.log(message)

  if(!webhook){
    throw new Error('No webhook provided!');
  }

  if(!message.title || !message.text){
    throw new Error('Discord message object does not look right!')
  }

  return await webhook.send(`######\n${message.title}\n######\n${message.text} `)
}