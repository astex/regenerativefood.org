define(
  [
    'jquery', 'underscore', 'backbone', 'moment', 'uuid', 'models',
    'text!templates/splash.utpl',
    'text!templates/header.utpl',
    'text!templates/list.utpl',
    'text!templates/entry.utpl',
    'text!templates/comment.utpl',
    'text!templates/month.utpl',
    'underscore.crunch', 'jquery.deparam'
  ], function(
      $, _, B, moment, uuid, M,
      t_splash, t_header, t_list, t_entry, t_comment, t_month
    ) {
    var V = {};

    V.Main = B.View.extend({
      el: $('body'),

      initialize: function() {
        var v = this;
        this.$el.html('');
        _.serial([$.proxy(v.fetch, v), $.proxy(v.render, v)])({
          success: function() { v.trigger('ready'); }
        });
      },

      fetch: function(cbs) {
        var v = this;
        v.model.user = ((new M.User()).setFilters({verbosity: 'self'}));
        _.serial([
          function(cbs_) {
            if (v.model.get('user_id'))
              return _.finish(cbs_);
            v.model.fetch(cbs_);
          },
          $.proxy(v.model.fetchUser, v.model)
        ])(cbs);
      },

      render: function(cbs) {
        var v = this;
        if (!v.model.get('user_id'))
          return v.add(V.Splash, cbs);

        _.parallel([
          function(cbs_) { v.add(V.Header, cbs); },
          function(cbs_) {
            v.$el.append(
              (new V.List({
                session: v.model,
                model: ((new M.Entries()).setFilters(_.extend(
                  $.deparam(window.location.search.slice(1)),
                  { parent_id__null: true }
                )))
              }))
                .on('ready', function() { _.finish(cbs); })
                .el
            );
          }
        ])(cbs);
      },

      add: function(View, cbs) {
        this.$el.append(
          (new View({session: this.model}))
            .on('ready', function() { _.finish(cbs); })
            .el
        );
      },

      events: {'click': 'hidePopups'},

      hidePopups: function(e) {
        var $el = $(e.target);

        if (!$el.data('popup') && !$el.closest('.popup').length) {
          if ($('.popup').is(':visible')){
            $('.popup').removeClass('expanded');
          }
        }
      }
    });

    V.Base = B.View.extend({
      initialize: function(opts) {
        var v = this;
        v.session = opts.session;
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

    V.Splash = V.Base.extend({
      el: '<section class="body splash"></section>',
      t: _.template(t_splash),
      email_regex: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,

      render: function() {
        V.Base.prototype.render.apply(this);
        this.$('[name=confirm], [name=name]').parents('label').toggle(false);
        this.$('[data-action=signup], [data-action=old]').toggle(false);
        return this;
      },

      events: {
        'click [data-action=new], [data-action=old]': 'toggleSignup',
        'click [data-action=signup]': 'signup',
        'click [data-action=login]': 'login',
        'submit form': 'submit'
      },

      toggleSignup: function() {
        this.$('[name=confirm], [name=name]').parents('label').toggle();
        this.$(
          '[data-action=signup], [data-action=login], [data-action=new], [data-action=old]'
        ).toggle();
        this.$('.error').html('');
      },

      signup: function(e) {
        var v = this;
        var name = v.$('[name=name]').val();
        var email = v.$('[name=email]').val();
        var password = v.$('[name=password]').val();
        var confirm_ = v.$('[name=confirm]').val();

        v.$('.error').html('');

        if (!name || !email || !password || !confirm_)
          return v.error('All fields are required.');
        if (!email.match(v.email_regex))
          return v.error('Please use a valid email address.');
        if (password != confirm_)
          return v.error('Passwords do not match.');

        data = {name: name, email: email, password: password};

        (new M.User(data))
          .setFilters({verbosity: 'guest'})
          .save({}, {
            success: function() {
              (new M.Session(data)).save({}, {
                success: function(m) { (new V.Main({model: m})); },
                error: function() { v.error(
                  'A user account was created, but we had trouble logging you in.  Try logging in ' +
                  'normally.'
                ); }
              });
            },
            error: function(m, r) { v.error('We couldn\'t create that account.'); console.log(r); }
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
          success: function(m) { (new V.Main({model: m})); },
          error: function(m, r) { v.error('There was a problem.'); console.log(r); }
        });
      },

      submit: function(e) {
        e.preventDefault();
        var login = this.$('[data-action=login]');
        var signup = this.$('[data-action=signup]');

        if (login.is(':visible'))
          login.click();
        else if (signup.is(':visible'))
          signup.click();
      }
    });

    V.Header = V.Base.extend({
      el: '<header></header>',
      t: _.template(t_header),

      getTemplateArgs: function() { return {session: this.session}; },

      events: {
        'click [data-popup]': 'popup',
        'click [data-action=logout]': 'logout'
      },

      popup: function(e) {
        this.$($(e.currentTarget).data('popup')).toggleClass('expanded');
      },

      logout: function() {
        this.session.destroy({
          success: function() { new V.Main({model: new M.Session()}); }
        });
      }
    });

    V.List = V.Base.extend({
      el: '<section class="body"></section>',
      t: _.template(t_list),
      t_month: _.template(t_month),

      fetch: function(cbs) {
        var v = this;

        v.model.owners = ((new M.Users()).setFilters({'verbosity': 'guest'}));

        _.serial([
          $.proxy(v.model.fetch, v.model),
          $.proxy(v.model.fetchOwners, v.model)
        ])(cbs);
      },

      render: function() {
        var v = this;
        V.Base.prototype.render.apply(v);
        _.chain(v.model.models)
          .groupBy(function(entry) { return moment(entry.get('created')).format('YYYYMM'); })
          .map(function(v, i) { return [i, v]; })
          .sortBy(function(date_entries) { return date_entries[0]; })
          .each(function(date_entries) {
            _.chain(date_entries[1])
              .sortBy(function(entry) {
                return moment(entry.get('created')).format();
              })
              .each(function(entry) {
                v.$el.prepend((new V.Entry({
                  session: v.session,
                  moment: moment,
                  model: entry
                })).el);
              });
            v.$el.prepend(v.t_month({
              model: moment(date_entries[0], 'YYYYMM')
            }));
          });
        return v;
      },

      events: {
        'click [data-action=new]': 'new_',
        'click [data-update=filters]': 'filter'
      },

      new_: function() {
        var entry = new M.Entry({owner_id: this.session.get('user_id')});
        entry.owner = this.session.user;

        this.$el.prepend((new V.Entry({session: this.session, edit: true, model: entry})).el);
      },

      filter: function(e) {
        var $el = $(e.currentTarget);
        var url = window.location.href.split('?')[0];
        var filters = $.deparam(window.location.search.slice(1));
        if ($el.data('type') == 'list') {
          filters[$el.attr('name')] = filters[$el.attr('name')] || [];
          if (!_.contains(filters[$el.attr('name')], $el.val()))
            filters[$el.attr('name')].push($el.val());
          else
            filters[$el.attr('name')] = _.without(filters[$el.attr('name')], $el.val());
        }
        window.location.href = url + '?' + $.param(filters);
      }
    });

    V.Entry = V.Base.extend({
      el: '<div class="entry"></div>',
      t: _.template(t_entry),
      t_comment: _.template(t_comment),

      initialize: function(opts) {
        this.edit = opts.edit;
        V.Base.prototype.initialize.apply(this, [opts]);
      },

      fetch: function(cbs) {
        var v = this;
        if (v.model.isNew()) {
          v.model.comments = (new M.Entries()).setFilters({parent_id: v.model.get('id')});
          v.model.comments.owners = new M.Users();
          return _.finish(cbs);
        }

        return _.parallel([
          $.proxy(v.model.fetchSrc, v.model),
          _.serial([
            $.proxy(v.model.fetchComments, v.model),
            _.parallel([
              function(cbs_) {
                v.model.comments.owners = new M.Users()
                  .setFilters({verbosity: 'guest'});
                return $.proxy(v.model.comments.fetchOwners, v.model.comments)(cbs_);
              },
              function(cbs_) {
                return _.parallel(v.model.comments.map(function(comment) {
                  return $.proxy(comment.fetchSrc, comment);
                }))(cbs_);
              }
            ])
          ])
        ])(cbs);
      },

      render: function() {
        var v = this;

        V.Base.prototype.render.apply(v);
        if (v.edit) {
          v.$el.addClass('expanded');
          v.$el.addClass('editing');
          v.$el.removeClass('comment-expanded');
        }
        v.model.comments.each(function(comment) {
          v.$('.comments').append(v.t_comment({model: comment, moment: moment}));
        });
        v.$('span.delete').hide();
        return v;
      },

      getTemplateArgs: function() {
        return {
          model: this.model, session: this.session, edit: this.edit, moment: moment
        };
      },

      events: {
        'click .title': 'toggle',
        'change input': 'set',
        'change textarea': 'set',
        'click [data-action=cancel]': 'cancel',
        'click [data-action=publish]': 'publish',
        'click [data-action=delete]': 'destroy',
        'click [data-action=edit]': 'edit',
        'click [data-show=comments]': 'showComments',
        'click [data-show=delete]': 'showDelete',
        'click [data-action=comment]': 'comment'
      },

      toggle: function(e) {
        if (!$(e.target).is('button'))
          if (!this.edit)
            this.$el.toggleClass('expanded');
      },

      set: function(e) {
        var $el = $(e.currentTarget);
        var data = {};
        data[$el.attr('name')] = (
          $el.data('type') == 'list' ?
            _.map($el.val().split(','), function(t) { return $.trim(t); }) :
          $el.val()
        );
        this.model.set(data);
      },

      cancel: function() {
        if (this.model.isNew())
          return this.remove();

        this.edit = false;
        this.$el.removeClass('editing');
        this.render();
      },

      publish: function() {
        var v = this;

        v.$('.error').html('');

        if (!v.model.get('title'))
          return v.error('Please give your post a title.');
        if (!v.model.get('src'))
          return v.error('Please add some content.');

        v.model.save({}, {
          error: function() { v.error('We could not save that entry.'); },
          success: function() {
            v.$el.removeClass('expanded');
            v.model.fetchSrc({
              error: function() { v.error('Your post is saved, but we had difficulty parsing it.'); },
              success: function() { v.cancel(); }
            });
          }
        });
      },

      destroy: function(e) {
        var v = this;
        v.model.destroy({
          success: function() { v.remove(); },
          error: function() { v.error('We couldn\'t delete that entry.'); }
        });
      },

      edit: function() {
        this.edit = true;
        this.render();
      },

      showComments: function() { this.$el.toggleClass('comment-expanded'); },

      showDelete: function() {
        this.$('.delete').toggle();
      },

      comment: function() {
        var v = this;
        var src = v.$('[name=src]').val();

        v.$('.error').html('');

        if (!src)
          return v.error('Please add some content.');

        var entry = new M.Entry({
          parent_id: v.model.get('id'),
          owner_id: v.session.get('user_id'),
          src: src,
          title: uuid.create().toString()
        });
        entry.owner = v.session.user;

        entry.save({}, {
          error: function() { v.error('We couldn\'t save that comment.'); },
          success: function() {
            entry.fetchSrc({
              error: function() { v.error(
                'We saved that comment, but had trouble displaying it.  Try reloading the page.'
              ); },
              success: function() {
                v.model.comments.add(entry);
                v.render();
              }
            });
          }
        });
      }
    });

    return V;
  }
);
