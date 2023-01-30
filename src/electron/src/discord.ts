import { Webhook } from 'simple-discord-webhooks';

import { app } from 'electron';


export async function sendToDiscord(message){

  const webhook = new Webhook(new URL(process.env.DISCORD_FEEDBACK_WEBHOOK!));

  if(!webhook){
    throw new Error('No webhook provided!');
  }

  if(!message.title || !message.text){
    throw new Error('Discord message object does not look right!')
  }

  return await webhook.send(`###### ${message.title} ######\n${process.platform} | ${process.env.NODE_ENV} | ${app.getVersion()}\n${message.text} `).catch((err) => console.log('discord error',err))
  
}

 
