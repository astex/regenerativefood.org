define(
  [
    'jquery', 'underscore', 'backbone',
    'text!templates/header.utpl',
    'text!templates/splash.utpl',
    'underscore.crunch'
  ], function($, _, B, t_header, t_splash) {
    var V = {};

    V.Main = B.View.extend({
      el: $('body'),

      initialize: function() {
        var v = this;
        var ready = _.after(1, function() { v.trigger('ready'); });

        //v.$el.append((new V.Header()).on('ready', ready).el);
        v.$el.append((new V.Splash()).on('ready', ready).el);
      }
    });

    V.Base = B.View.extend({
      initialize: function() {
        var v = this;
        v.fetch({
          success: function() { v.render().trigger('ready'); }
        });
      },

      fetch: function(cbs) { return _.finish(cbs); },

      render: function() {
        this.$el.html(this.t(this.getTemplateArgs()));
        return this;
      },

      getTemplateArgs: function() { return {}; }
    });

    V.Header = V.Base.extend({ el: '<header></header>', t: _.template(t_header) });

    V.Splash = V.Base.extend({
      el: '<section class="body splash"></section>',
      t: _.template(t_splash)
    });

    return V;
  }
);
