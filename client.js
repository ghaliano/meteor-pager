/**
 * wraper for Meteor.subscribe
 * Inspired from https://github.com/Exartu/Exartu-Pagination
 */
Meteor.pagerClient = function (collection, subscriptionName, filters, options, settings) {
	var self = this;
	this._settings = _.extend({
		fireAt: 100,
		infiniteScroll: true
	}, settings||{});

	this._metadataCollectionHandler = Meteor.subscribe(metadataSubscriptionName);
	this._metadataCollection = metadataCollection;

	this._name = subscriptionName;
	options.limit = options.limit || 0;

	//Store originals to keep truck for eralier usage
	this._filters_base = filters;
	this._options_base = options;
	this._collection = collection;

	this._filters = new ReactiveVar(filters);
	this._options = new ReactiveVar(options);
	this._isLoading = new ReactiveVar(true);
	this._handler = false;
	this._resultMetadata = new ReactiveVar({});

	Meteor.autorun(function(){
		self._isLoading.set(true);
		self._handler = Meteor.subscribe(
			self._name, 
			self._filters.get(),
			self._options.get()
		);

		if (self._handler.ready() && self._metadataCollectionHandler.ready()){
			var metadata = self._metadataCollection.findOne(self._name);
			if (metadata){
				var currentCount = self._collection.find().count();
				self._resultMetadata.set({
					count: metadata.count,
					hasMore: metadata.count>currentCount,
					pagesCount: Math.ceil(metadata.count/self.util.getLimit())
				});
			}
			self._isLoading.set(false);
		}
	});

	self.util = {
		//Subscribe to more data
		loadMore: function () {
			self.util.setOption('limit', self._options_base.limit + self.util.getOption('limit'));
		},
		hasMore: function () {
			return self._resultMetadata.get().hasMore;
		},
		//Get current subscription handler
		getHandler: function () {
			return self._handler;
		},
		//Is data under loading
		isLoading: function () {
			return self._isLoading.get();
		},
		//Set filters
		setFilters: function(filters) {
			self._filters.set(filters);
		},
		//Get filter by index
		setFilter: function (index, value) {
			var filters = self._filters.get();
			filters[index] = value;
			self.util.setOptions(filters);
		},
		getLimit: function (){
			return self.util.getOption('limit');
		},
		//Set options
		setOptions: function(options) {
			self._options.set(options);
		},
		//add one option by index
		setOption: function (index, value) {
			var options = self._options.get();
			options[index] = value;
			self.util.setOptions(options);
		},
		//Get option by index
		getOption: function (index) {
			return self._options.get()[index];
		},
		//Stop current subscription and reload
		//Why reload? in some case like sorting where we need to resibscribe with custom sort.
		stopAndReload: function () {
			self._handler.stop();
			self.util.setOption('limit', self._options_base.limit);
		},
		//get total Cursor count (without limit)
		getResultMetadata: function (index) {
			return index?self._resultMetadata[index]:self._resultMetadata;
		},
		scrollListner: function(){
			$(window).on("scroll", _.debounce(
				function() {
				  var elem = $(self._settings.container || window);
				  if(elem.scrollTop() + elem.height() > $(self._settings.container || document).height() - self._settings.fireAt){
				    self.util.loadMore();
				  }
				}, 
				300
			));
		}
	}

	if (this._settings.infiniteScroll){
		this.util.scrollListner();
	}
};