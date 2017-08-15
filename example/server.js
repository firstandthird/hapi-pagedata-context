'use strict';

const Hapi = require('hapi');
const port = process.env.PORT || 8080;

const server = new Hapi.Server({
  debug: {
    log: ['pagedata', 'error', 'cache'],
    request: ['error']
  }
});

server.connection({ port });

server.register([
  {
    register: require('vision')
  },
  {
    register: require('hapi-pagedata'),
    options: {
      host: process.env.PAGEDATA_HOST || `http://localhost:${port}`,
      key: process.env.PAGEDATA_KEY || 'key',
      status: 'draft',
      enablePageCache: false,
      enableProjectPagesCache: false,
      enableParentPagesCache: false,
      verbose: true
    }
  },
  {
    register: require('../'),
    options: {
      pages: {
        one: 'trunk-path-one',
        two: 'trunk-path-two'
      }
    }
  }
], err => {
  if (err) {
    throw err;
  }

  server.views({
    engines: {
      njk: require('vision-nunjucks')
    },
    path: `${__dirname}/views`,
    helpersPath: `${__dirname}/helpers`
  });

  server.route({
    path: '/api/pages/{page}',
    method: 'GET',
    handler(request, reply) {
      reply({
          content: {
            page: request.params.page,
            number: Math.floor(Math.random() * 1000)
          }
      });
    }
  });

  server.route({
    path: '/',
    method: 'get',
    handler: {
      view: {
        template: 'index'
      }
    }
  });

  server.start(startErr => {
    if (startErr) {
      throw startErr;
    }
    console.log('Server started', server.info.uri);
  });
});
