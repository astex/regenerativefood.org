require.config({
  paths: {
    css: 'lib/require-css',
    text: 'lib/require-text',
    json: 'lib/require-json',

    jquery: 'lib/jquery',

    underscore: 'lib/underscore',
    'underscore.crunch': 'lib/underscore.crunch',

    backbone: 'lib/backbone'
  }
});


require(['jquery', 'backbone', 'models', 'views', 'css!style/main.css'], function($, B, M, V) {
  $.ajaxSetup({
    xhrFields: { withCredentials: true }
  });

  new (B.Router.extend({
    routes: {'': 'main'},
    main: function() { new V.Main({model: new M.Session()}); }
  }))();

  B.history.start({pushState: true});
});
