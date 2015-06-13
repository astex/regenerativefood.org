define(['json!/config.json', 'backbone'], function(config, B) {
  var M = {};

  M.Model = B.Model.extend({
    url: function() { return this.base_url + (this.get('id') || ''); }
  });
  M.Collection = B.Collection.extend({
    parse: function(data) { return data.data; }
  });

  M.Session = M.Model.extend({base_url: config.url + '/session/'});
  M.User = M.Model.extend({base_url: config.url + '/user/'});

  return M;
});
