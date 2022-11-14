const { Webhook } = require('simple-discord-webhooks');

const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);

async function sendToDiscord(message){

  console.log(message)

  if(!webhook){
    throw new Error('No webhook provided!');
  }

  if(!message.title || !message.text){
    throw new Error('Discord message object does not look right!')
  }

  return await webhook.send(`######\n${message.title}\n######\n${message.text} `)
}

module.exports = {
  sendToDiscord
}