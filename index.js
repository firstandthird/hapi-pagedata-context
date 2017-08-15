const pkg = require('./package.json');
const async = require('async');
const Boom = require('boom');

exports.register = function(server, options, next) {
  if (!options.pages) {
    return next(new Error('No pages passed to context'));
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
          return cb(err);
        }
        response.source.context[key] = content;
        cb();
      });
    }, err => {
      if (err) {
        return reply(Boom.badImplementation(err));
      }
      
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
