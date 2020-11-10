const shell = require('electron').shell

export function openInBrowser(url){
  shell.openExternal(url)
}