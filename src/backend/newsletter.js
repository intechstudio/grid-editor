const axios = require('axios');

exports.checkOptIn = (groupName) =>{
  return (req, res, next) => {
    const optIn = req.body.optIn;
    if(optIn){
      this.getGroups(req,res,next).then(() => 
        this.findGroupIdByGroupName(groupName)(req,res,next)).then(() => 
          this.addUser(req,res,next)).then(()=>{ 
            console.log('did we hit this?')
            next();
          })
          .catch(err => next(err)) 
    } else {
      next();
    }
  }
}


exports.addUser = async (req, res, next) => {
 
  console.info('Starting addUser()...')

  // define locals
  res.locals.isSuccess = false;

  // data
  const _data = {
      "email": res.locals.email,
      "name": res.locals.name
  }

  body = JSON.stringify(_data);

  // prepare the request and add subscriber to group
  const config = {
    url: `https://api.mailerlite.com/api/v2/groups/${res.locals.groupId}/subscribers`,
    method: 'POST',
    headers: { 
        'x-mailerlite-apikey': '87797f3eeae8a54446392b65420884a5',
        'content-type': 'application/json'
    },
    data: body
  }

  try {
    const response = await axios(config);
    next();
  } catch (err) {
    next(err);
  } 
}

exports.findGroupIdByGroupName = (groupName) => {
  return function (req,res,next) {

    console.info('Starting findGroupIdByGroupName()...')

      const groups = res.locals.groups;

      if(!Array.isArray(groups)){
        throw new Error('not array')
      }

      res.locals.groupId = null;
  
      groups.forEach(group => {
        if(group.name == groupName){
          res.locals.groupId = group.id;
          next();
        }
      });

      if(res.locals.groupId === null){
        throw new Error('Cannot find group by id.')
      } 
    }
}

exports.getGroups = async (req, res, next) => {    

  console.info('Starting getGroups()...')

  const config = {
    url: `https://api.mailerlite.com/api/v2/groups`,
    method: 'GET',
    headers: {
        'X-MailerLite-ApiKey': '87797f3eeae8a54446392b65420884a5',
        'Content-Type': 'application/json'
    }
  }

  try {
    const response = await axios(config);
    res.locals.groups = response.data;
    console.log('newsletter groups...', res.locals.groups)
    next();
  } catch (err) {
    next(err)
  }

}
