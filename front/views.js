define(
  [
    'jquery', 'underscore', 'backbone',
    'text!templates/header.utpl',
    'underscore.crunch'
  ], function($, _, B, t_header) {
    var V = {};

    V.Main = B.View.extend({
      el: $('body'),

      initialize: function() {
        var v = this;
        v.$el.append((new V.Header()).on('ready', function() { v.trigger('read'); }).el);
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

    V.Header = V.Base.extend({ t: _.template(t_header) });

    return V;
  }
);
