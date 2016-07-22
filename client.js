/**
 * wraper for Meteor.subscribe
 * Inspired from https://github.com/Exartu/Exartu-Pagination
 */
Meteor.pagerClient = function (collection, subscriptionName, filters, options) {
	var self = this;
	this._metadataCollection = new Meteor.Collection('pagerMetadata');
	this._metadataCollectionHandler = Meteor.subscribe('pagerMetadata');

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
				self._resultMetadata.set({
					count: metadata.count,
					hasMore: metadata.count>self._collection.find().count()
				});
			}
			self._isLoading.set(false);
		
		}
	});

	self.util = {
		//Subscribe to more data
		loadMore: function () {
			self._options.set('limit', self._options_base.limit + self._options.get().limit);
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
		//Add filter by index
		addFilter: function(index, value) {
			self._filters.set(index, value);
		},
		//Set filters
		setFilters: function(filters) {
			self._filters.set(filters);
		},
		//Get filter by index
		getFilter: function (index) {
			return self._filters.get()[index];
		},
		//Set options
		setOptions: function(options) {
			self._options.set(options);
		},
		//add one option by index
		addOption: function (index, value) {
			self._options.set(index, value);
		},
		//Get option by index
		getOption: function (index) {
			return self._options.get()[index];
		},
		//Get current subscription results
		getResults: function () {
			return self._collection.find();
		},
		//Stop current subscription and reload
		//Why reload? in some case like sorting where we need to resibscribe with custom sort.
		stopAndReload: function () {
			self._handler.stop();
			var options = self._options.get();
			options.limit = self._options_base.limit
			self._options.set(options);
		},
		//get total Cursor count (without limit)
		getResultMetadata: function (index) {
			return index?self._resultMetadata[index]:self._resultMetadata;
		}
	}
};