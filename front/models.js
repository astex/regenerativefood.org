define([
    'json!/config.json', 'jquery', 'underscore', 'backbone', 'underscore.crunch'
  ], function(config, $, _, B) {
    var M = {};

    M.Model = B.Model.extend(
      {
        filters: {},

        url: function() {
          return this.constructor.base_url + (this.get('id') || '') + '?' + $.param(this.filters);
        },

        setFilters: function(filters) {
          this.filters = _.extend({}, this.filters, filters);
          return this;
        },

        parse: function(data, opts) {
          if (opts.collection)
            return data;
          return data.data;
        }
      }, {
        oneToOneFetcher: function(opts) {
          return function(cbs) {
            var m = this;
            if (!m.get(opts.key))
              return _.finish(cbs);
            (m[opts.name] = m[opts.name] || new opts.Model())
              .set('id', m.get(opts.key))
              .fetch(cbs);
          };
        },
        oneToManyFetcher: function(opts) {
          return function(cbs) {
            var m = this;
            var filters = {};
            filters[opts.filter_key] = m.get(m.idAttribute);
            (m[opts.name] = m[opts.name] || new opts.Collection())
              .setFilters(filters);
            return _.serial([
              $.proxy(m[opts.name].fetch, m[opts.name]),
              function(cbs_) {
                m[opts.name].each(function(model) { model[opts.reverse_name] = m; });
                _.finish(cbs_);
              }
            ])(cbs);
          };
        }
      }
    );
    M.Collection = B.Collection.extend(
      {
        filters: {},

        url: function() {
          return this.model.base_url + '?' + $.param(this.filters);
        },

        setFilters: function(filters) {
          this.filters = _.extend({}, this.filters, filters);
          return this;
        },

        parse: function(data) { return data.data; }
      }, {
        manyToOneFetcher: function(opts) {
          return function(cbs) {
            var c = this;
            c[opts.name] = c[opts.name] || new opts.Collection();
            _.serial([
              $.proxy(c[opts.name].fetch, c[opts.name]),
              function(cbs_) {
                c.each(function(m) {
                  if (!m.get(opts.key))
                    return;
                  m[opts.model_name] = c[opts.name].findWhere({id: m.get(opts.key)});
                });
                _.finish(cbs_);
              }
            ])(cbs);
          };
        }
      }
    );

    M.User = M.Model.extend({}, {base_url: config.url + '/user/'});
    M.Users = M.Collection.extend({model: M.User});

    M.Session = M.Model.extend({
      idAttribute: 'user_id',
      fetchUser: M.Model.oneToOneFetcher({Model: M.User, name: 'user', key: 'user_id'})
    }, {base_url: config.url + '/session/'});

    M.Entry = M.Model.extend({
      defaults: {parser: 'marked'},
      fetchSrc: function(cbs) {
        var m = this;
        return require([m.get('parser')], function(parse) {
          m.set('content', parse(m.get('src')));
          _.finish(cbs);
        });
      },
      fetchComments: function(cbs) {
        // This is wrapped in a function since M.Entries cannot be defined
        //  until after M.Entry.
        return $.proxy(M.Model.oneToManyFetcher({
          filter_key: 'parent_id',
          name: 'comments',
          reverse_name: 'parent',
          Collection: M.Entries
        }), this)(cbs);
      }
    }, {base_url: config.url + '/entry/'});
    M.Entries = M.Collection.extend({
      model: M.Entry,
      fetchOwners: M.Collection.manyToOneFetcher({
        Collection: M.Users,
        name: 'owners',
        model_name: 'owner',
        key: 'owner_id'
      })
    });

    return M;
  }
);
