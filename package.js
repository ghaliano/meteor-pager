Package.describe({
  name: 'ghaliano:pager',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.use('reywood:publish-composite@1.4.2', 'server');
  api.imply('reywood:publish-composite');
  api.versionsFrom('1.3.4.4');
  api.addFiles(['server.js'], 'server');
  api.addFiles(['client.js'], 'client');
  api.addFiles(['both.js']);
  //api.addFiles(['view.js'], 'client');
});

Package.onTest(function(api) {
  //api.use('ecmascript');
  api.use('tinytest');
  api.use('ghaliano:pager');
  api.mainModule('pager-tests.js');
});
