Meteor.pagerServer = function (subscriptionName, cursorFunction, composite) {
	var self = this;
	this.subscriptionName = subscriptionName;
  
  if (composite) {
    Meteor.publishComposite(subscriptionName, function(filter, options){
      var cursor = cursorFunction(filter, options);

      Metadata.add({
        connectionId: this.connection.id,
        name: subscriptionName,
        finalCursor: cursor['find']()
      });
      this.ready();

      return cursor;
    });
  } else {

    Meteor.publish(subscriptionName, function(filter, options){
      var cursor = cursorFunction(filter, options);

      Metadata.add({
        connectionId: this.connection.id,
        name: subscriptionName,
        finalCursor: cursor
      });
      this.ready();

      return cursor;
    });
  }
	
	Meteor.publish(metadataSubscriptionName, function () {
	  var self = this;

	  Metadata.setAsPublished(self);
	  _.each(Metadata.get(self.connection.id), function (metadata) {
	    Metadata.publish(metadata);
	  });
	  self.ready();
	});
}

var Metadata = {
  metadatas: {},
  add: function (metadata) {
    this.metadatas[metadata.connectionId] = this.metadatas[metadata.connectionId]  || {};
    var old = this.metadatas[metadata.connectionId][metadata.name];
    this.metadatas[metadata.connectionId][metadata.name] = metadata;

    if (old) {
      //update finalCursor count
      if (this.published[metadata.connectionId]) {
        this.updatePublish(metadata, old);
      }
    }else {
      if (this.published[metadata.connectionId]){
        this.publish(metadata);
      }
    }
  },
  get: function(connectionId){
    return this.metadatas[connectionId];
  },
  publish: function(metadata){
    var self = this,
      finalCursor = metadata.finalCursor;
    if (finalCursor) {

      var pub = self.published[metadata.connectionId];
      var initializing = true;

      var handler = finalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing)
            pub.changed(metadataSubscriptionName, metadata.name, {count: finalCursor.count()});
        },
        removed: function (id) {
          pub.changed(metadataSubscriptionName, metadata.name, {count: finalCursor.count()});
        }
      });

      self.metadatas[metadata.connectionId][metadata.name].handler = handler;

      initializing = false;
      //send initial values

      pub.added(metadataSubscriptionName, metadata.name, {
        count: finalCursor.count()
      });


      pub.onStop(function () {
        if (! self.metadatas[metadata.connectionId]) return;

        self.metadatas[metadata.connectionId][metadata.name].handler.stop();

        delete self.metadatas[metadata.connectionId][metadata.name];
        if (_.isEmpty(self.metadatas[metadata.connectionId])){
          delete self.metadatas[metadata.connectionId];
        }
      });
    }
  },
  updatePublish: function (metadata, old) {
    if (old.handler){
      old.handler.stop();
    };
    var self = this,
      finalCursor = metadata.finalCursor;
    if (finalCursor) {

      var pub = this.published[metadata.connectionId];
      var initializing = true;

      self.metadatas[metadata.connectionId][metadata.name].handler = finalCursor.observeChanges({
        added: function (id) {
          //avoid to notify all added changes when it starts
          if (!initializing){
            pub.changed(metadataSubscriptionName, metadata.name, {count: finalCursor.count()});
          }
        },
        removed: function (id) {
          pub.changed(metadataSubscriptionName, metadata.name, {count: finalCursor.count()});
        }
      });
      initializing = false;

      self.published[metadata.connectionId].changed(
        metadataSubscriptionName, 
        metadata.name, 
        {
          count: metadata.finalCursor.count()
      });
    }
  },
  setAsPublished: function(pub){
    var self = this;

    self.published = self.published || {};
    self.published[pub.connection.id] = pub;
  }
};