define(
  [
    'jquery', 'underscore', 'backbone', 'models',
    'text!templates/header.utpl',
    'text!templates/splash.utpl',
    'underscore.crunch'
  ], function($, _, B, M, t_header, t_splash) {
    var V = {};

    V.Main = B.View.extend({
      el: $('body'),
      model: new M.Session(),

      initialize: function() {
        var v = this;
        _.crunch({
          pre: $.proxy(v.fetch, v),
          post: $.proxy(v.render, v)
        })({
          success: function() { v.trigger('ready'); }
        });
      },

      render: function(cbs) {
        var v = this;
        _.crunch([
          function(cbs_) {
            if (!v.model.get('user_id'))
              return _.finish(cbs_);
            v.$el.append((new V.Header()).on('ready', function() { _.finish(cbs_); }).el);
          },
          function(cbs_) {
            if (v.model.get('user_id'))
              return _.finish(cbs_);
            v.$el.append((new V.Splash()).on('ready', function() { _.finish(cbs); }).el);
          }
        ])(cbs);
      },

      fetch: function(cbs) {
        var v = this;
        _.crunch({
          pre: $.proxy(v.model.fetch, v.model),
          post: $.proxy(v.model.fetchUser, v.model)
        })(cbs);
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

      getTemplateArgs: function() { return {}; },

      error: function(r) { this.$('.error').html(r); }
    });

    V.Header = V.Base.extend({ el: '<header></header>', t: _.template(t_header) });

    V.Splash = V.Base.extend({
      el: '<section class="body splash"></section>',
      t: _.template(t_splash),
      email_regex: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,

      render: function() {
        V.Base.prototype.render.apply(this);
        this.$('[name=confirm]').parents('label').toggle(false);
        this.$('[data-action=signup]').toggle(false);
        this.$('[data-action=old]').toggle(false);
        return this;
      },

      events: {
        'click [data-action=new], [data-action=old]': 'toggleSignup',
        'click [data-action=signup]': 'signup',
        'click [data-action=login]': 'login'
      },

      toggleSignup: function() {
        this.$('[name=confirm]').parents('label').toggle();
        this.$(
          '[data-action=signup], [data-action=login], [data-action=new], [data-action=old]'
        ).toggle();
        this.$('.error').html('');
      },

      signup: function(e) {
        var v = this;
        var email = v.$('[name=email]').val();
        var password = v.$('[name=password]').val();
        var confirm_ = v.$('[name=confirm]').val();

        v.$('.error').html('');

        if (!email || !password || !confirm_)
          return v.error('All fields are required.');
        if (!email.match(v.email_regex))
          return v.error('Please use a valid email address.');
        if (password != confirm_)
          return v.error('Passwords do not match.');

        (new M.User({email: email, password: password})).save({}, {
          success: function() {},
          error: function(m, r) { v.error('There was a problem.'); console.log(r); }
        });
      },

      login: function(e) {
        var v = this;
        var email = v.$('[name=email]').val();
        var password = v.$('[name=password]').val();

        v.$('.error').html('');

        if (!email || !password)
          return v.error('All fields are required.');
        if (!email.match(v.email_regex))
          return v.error('Please use a valid email address.');

        (new M.Session({email: email, password: password})).save({}, {
          success: function() {},
          error: function(m, r) { v.error('There was a problem.'); console.log(r); }
        });
      }
    });

    return V;
  }
);
