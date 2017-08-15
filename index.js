const pkg = require('./package.json');
const async = require('async');
const _ = require('lodash');

exports.register = function(server, options, next) {
  // Check Dependency
  if (!server.plugins['hapi-pagedata']) {
    server.log('required dependency missing');
    return next();
  }

  if (!options.slugs || options.slugs.length === 0) {
    server.log(['error', 'hapi-pagedata-context'], 'no slugs passed to context');
    return next();
  }
  
  const contextHandler = (request, reply) => {
    if (request.response.variety !== 'view') {
      return reply.continue();
    }
    
    const response = request.response;
    
    response.source.context = response.source.context ? response.source.context : {};
    async.each(options.slugs, (slug, cb) => {
      server.methods.pagedata.getPageContent(slug, (err, content) => {
        if (err) {
          server.log(['error', 'get-page', 'hapi-pagedata-context'], err);
          return cb();
        }
        
        response.source.context = _.defaults(response.source.context, content);
        cb();
      });
    }, err => {
      if (err) {
        throw err;
      }
      
      reply.continue();
    }); 
  };
  
  server.ext('onPostHandler', contextHandler);

  next();
};

exports.register.attributes = {
  once: true,
  pkg
};
