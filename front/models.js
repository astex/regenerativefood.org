define([
    'json!/config.json', 'underscore', 'backbone', 'underscore.crunch'
  ], function(config, _, B) {
    var M = {};

    M.Model = B.Model.extend({
      url: function() { return this.base_url + (this.get('id') || ''); },

      parse: function(data) { return data.data; }
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
      parse: function(data) { return data.data; }
    });

    M.User = M.Model.extend({base_url: config.url + '/user/'});
    M.Session = M.Model.extend({
      url: config.url + '/session/',
      idAttribute: 'user_id',
      fetchUser: M.Model.relatedFetcher({Model: M.User, name: 'user', key: 'user_id'})
    });

    return M;
  }
);
