var Boom            = require('boom');
var PasswordUtility = require('../utilities/password-helper');
var moment = require('moment');

module.exports = function(modules){
  var Log = modules.logger.bind('token.handlers');
  var UserModel = modules.mongoose.models.user;
  var TokenMaker = modules.tokenMaker;

  return {
    create: function (request, reply) {
      Log.log("+ params(%s), query(%s), payload(%s), email(%s)", JSON.stringify(request.params), JSON.stringify(request.query), '/redacted for security/', request.payload.email);

      UserModel.findOne({email:request.payload.email}).then(function(user){
        if(user){
          if(PasswordUtility.check_password(request.payload.password, user.password)){
            //TODO: seed the token encoding with current time or something similar
            var token = TokenMaker.encode(user._id);
            if (!token) {
              reply(Boom.badImplementation)
            }else{
              UserModel.findByIdAndUpdate(user._id, { $set: {
                token:token,
                tokenCreatedAt:new Date().toUTCString()
              }}, { new: true }).then(function(user){
                reply({token:user.token});
              });
            }
          }else{
            Log.info("Password not correct.");
            reply(Boom.notFound("No user with that email and password was found.", request.payload.email));
          }
        }else{
          Log.info("User not found.");
          reply(Boom.notFound("No user with that email and password was found.", request.payload.email));
        }
      }).catch(function(error) {
        Log.error(error);
        reply(Boom.badImplementation("Error authenticating the user.", error));
      });
    },

    delete: function (request, reply) {
      //TODO
      reply(Boom.notImplemented("This needs to be implemented."));
    }
  };
};
