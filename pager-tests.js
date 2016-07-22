// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by pager.js.
import { name as packageName } from "meteor/ghaliano:pager";

// Write your tests here!
// Here is an example.
Tinytest.add('pager - example', function (test) {
  test.equal(packageName, "pager");
});
