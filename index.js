const pkg = require('./package.json');
const async = require('async');
const _ = require('lodash');
const Boom = require('boom');

exports.register = function(server, options, next) {
  if (!options.pages) {
    server.log(['hapi-pagedata-context', 'error'], 'no pages passed to context');
    return next('No pages passed to context');
  }
  
  const contextHandler = (request, reply) => {
    if (request.response.variety !== 'view') {
      return reply.continue();
    }
    
    const response = request.response;
    
    response.source.context = response.source.context ? response.source.context : {};
    async.each(Object.keys(options.pages), (key, cb) => {
      const slug = options.pages[key];
      server.methods.pagedata.getPageContent(slug, (err, content) => {
        if (err) {
          server.log(['hapi-pagedata-context', 'error', 'get-page'], err);
          return cb();
        }
        const respObj = {};
        respObj[key] = content;
        response.source.context = _.defaults(response.source.context, respObj);
        cb();
      });
    }, err => {
      if (err) {
        reply(Boom.badImplementation(err));
      }

      console.log(response.source.context);
      
      reply.continue();
    }); 
  };
  
  server.ext('onPostHandler', contextHandler);

  next();
};

exports.register.attributes = {
  once: true,
  pkg,
  dependencies: 'hapi-pagedata'
};
