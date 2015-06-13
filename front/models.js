define([
    'json!/config.json', 'jquery', 'underscore', 'backbone', 'underscore.crunch'
  ], function(config, $, _, B) {
    var M = {};

    M.Model = B.Model.extend({
      url: function() { return this.constructor.base_url + (this.get('id') || ''); },

      parse: function(data, opts) {
        if (opts.collection)
          return data;
        return data.data;
      }
    }, {
      relatedFetcher: function(opts) {
        return function(cbs) {
          var m = this;
          if (!m.get(opts.key))
            return _.finish(cbs);
          (m[opts.name] = m[opts.name] || new opts.Model({id: m.get(opts.key)}))
            .fetch(cbs);
        };
      }
    });
    M.Collection = B.Collection.extend({
      url: function() { return this.model.base_url; },
      parse: function(data) { return data.data; }
    }, {
      many2OneFetcher: function(opts) {
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
    });

    M.User = M.Model.extend({}, {base_url: config.url + '/user/'});
    M.Users = M.Collection.extend({model: M.User});

    M.Session = M.Model.extend({
      idAttribute: 'user_id',
      fetchUser: M.Model.relatedFetcher({Model: M.User, name: 'user', key: 'user_id'})
    }, {base_url: config.url + '/session/'});

    M.Entry = M.Model.extend({
      fetchSrc: function(cbs) {
        var m = this;
        return require([m.get('parser')], function(parse) {
          m.set('content', parse(m.get('src')));
          _.finish(cbs);
        });
      }
    }, {base_url: config.url + '/entry/'});
    M.Entries = M.Collection.extend({
      model: M.Entry,
      fetchOwners: M.Collection.many2OneFetcher({
        Collection: M.Users,
        name: 'owners',
        model_name: 'owner',
        key: 'owner_id'
      })
    });

    return M;
  }
);
