'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dbName = 'mws-restaurant';

/**
 * Common idb helper functions.
 */

var IDBHelper = function () {
    /**
     * @description constructor
     * @param {"idb"} idb
     */
    function IDBHelper(idb) {
        _classCallCheck(this, IDBHelper);

        this.idb = idb;
        this.openDatabase = IDBHelper.openDatabase;
        this.deleteDatabase = IDBHelper.deleteOldDatabase;
        this.createNewDatabase = IDBHelper.createNewDatabase;
        this.populateDatabase = IDBHelper.populateDatabase;
        this.saveRestaurant = IDBHelper.saveRestaurant;
        this.readAllIdbData = IDBHelper.readAllIdbData;
    }
    /**
     * @description Gets a promise after opening the mws-restaurants database
     * @return {Promise} Promise
     */


    _createClass(IDBHelper, null, [{
        key: 'openDatabase',
        value: function openDatabase() {
            // If the browser doesn't support service worker,
            // we don't care about having a database
            if (!navigator.serviceWorker) {
                return Promise.resolve();
            }
            return idb.open(dbName, 1, function (upgradeDb) {
                var store = upgradeDb.createObjectStore('restaurants', {
                    keyPath: 'id'
                });
                store.createIndex('createdAt', 'createdAt');
            });
        }

        /**
         * @description Deletes the old database
         */

    }, {
        key: 'deleteOldDatabase',
        value: function deleteOldDatabase() {
            var DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);
            DBDeleteRequest.onerror = function () {
                console.log('Error deleting database.');
            };
            DBDeleteRequest.onsuccess = function () {
                console.log('Old db successfully deleted!');
            };
        }

        /**
         * @description Creates a new mws-restaurants database
         * @return {Promise} Returns a promise for the created database
         */

    }, {
        key: 'createNewDatabase',
        value: function createNewDatabase() {
            return idb.open(dbName, 1, function (upgradeDb) {
                if (!upgradeDb.objectStoreNames.contains('restaurants')) {
                    var store = upgradeDb.createObjectStore('restaurants', {
                        keyPath: 'id'
                    });
                    store.createIndex('createdAt', 'createdAt');
                }
                console.log(dbName + ' has been created!');
            });
        }

        /**
         * @description Adds restaurant records into the database
         * @param {Promise} _DBPromise
         */

    }, {
        key: 'populateDatabase',
        value: function populateDatabase(restaurants) {
            var dbPromise = this.openDatabase();
            dbPromise.then(function (db) {
                if (!db) return;

                var tx = db.transaction('restaurants', 'readwrite');
                var store = tx.objectStore('restaurants');
                restaurants.forEach(function (restaurant) {
                    store.put(restaurant);
                });
            });
        }

        /**
         * @description Finds a certain restaurant and then it updates it
         * if not found it considers the restaurant sent with parameter as a new object
         * @param {any} restaurant
         */

    }, {
        key: 'saveRestaurant',
        value: function saveRestaurant(restaurant) {
            console.log('entered the save restaurant helper method: ', restaurant);
            var dbPromise = this.openDatabase();
            dbPromise.then(function (db) {
                if (!db) {
                    return;
                }

                var tx = db.transaction('restaurants', 'readwrite');
                var store = tx.objectStore('restaurants');
                var idIndex = store.index('id');
                var isRestaurantUpdated = false;

                return idIndex.openCursor();
            }).then(function findRestaurant(cursor) {
                if (!cursor) {
                    return;
                }
                console.log('Cursored at:', cursor);
                if (cursor.value && cursor.value.id === restaurant.id) {
                    cursor.value = restaurant;
                    isRestaurantUpdated = true;
                }
                return cursor.continue().then(findRestaurant);
            }).then(function () {
                console.log('Done cursoring');
                if (!isRestaurantUpdated) {
                    cursor.put(restaurant);
                    console.log('added ');
                }
            });
        }

        /**
         * @description Returns all restaurants from the database
         * @param {Promise} _DBPromise
         * @return {restaurants} restaurants
         */

    }, {
        key: 'readAllIdbData',
        value: function readAllIdbData() {
            return _DBPromise().then(function (db) {
                if (!db) {
                    return;
                }
                console.log('readAllData database: ', db);
                var tx = db.transaction(['restaurants'], 'readonly');
                var store = tx.objectStore('restaurants');
                return store.getAll();
            }).then(function (items) {
                console.log('items retrieved: ', items);
            });
        }
    }]);

    return IDBHelper;
}();

exports.default = IDBHelper;
