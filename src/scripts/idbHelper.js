const dbName = 'mws-restaurant';

/**
 * Common idb helper functions.
 */
class IDBHelper {
    /**
     * @description constructor _
     * @param {"idb"} idb
     */
    constructor (idb) {
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
    static openDatabase () {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        return idb.open(dbName, 1, function (upgradeDb) {
            const store = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id',
            });
            store.createIndex('createdAt', 'createdAt');
        });
    }

    /**
     * @description Deletes the old database
     */
    static deleteOldDatabase () {
        let DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);
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
    static createNewDatabase () {
        return idb.open(dbName, 1, function (upgradeDb) {
            if (!upgradeDb.objectStoreNames.contains('restaurants')) {
                let store = upgradeDb.createObjectStore('restaurants', {
                    keyPath: 'id',
                });
                store.createIndex('createdAt', 'createdAt');
            }
            console.log(dbName + ' has been created!');
        });
    }

    /**
     * @description Adds restaurant records into the database
     * @param {Array<restaurant>} restaurants
     */
    static populateDatabase (restaurants) {
        const dbPromise = this.openDatabase();
        dbPromise.then(function (db) {
            if (!db) {
                return;
            }

            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
                store.put(restaurant);
            });
        });
    }

    /**
     * @description Finds a certain restaurant and then it updates it
     * if not found it considers the restaurant
     *  sent with parameter as a new object
     * @param {any} restaurant
     */
    static saveRestaurant (restaurant) {
        console.log('entered the save restaurant helper method: ', restaurant);
        let isRestaurantUpdated = false;
        const dbPromise = this.openDatabase();
        dbPromise.then(function (db) {
            if (!db) {
                return;
            }

            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            const idIndex = store.index('id');

            return idIndex.openCursor();
        }).then(function findRestaurant (cursor) {
            if (!cursor) {
                return;
            }
            console.log('Cursored at:', cursor);
            if (cursor.value && cursor.value.id === restaurant.id) {
                cursor.value = restaurant;
                isRestaurantUpdated = true;
            }
            if (!isRestaurantUpdated) {
                cursor.put(restaurant);
                console.log('added ');
            }
            return cursor.continue().then(findRestaurant);
        }).then(function () {
            console.log('Done cursoring');
        });
    }

    /**
     * @description Returns all restaurants from the database
     * @param {Promise} _DBPromise
     * @return {restaurants} restaurants
     */
    static readAllIdbData () {
        const dbPromise = this.openDatabase();
        return dbPromise.then(function (db) {
            if (!db) {
                return;
            }
            console.log('readAllData database: ', db);
            let tx = db.transaction(['restaurants'], 'readonly');
            let store = tx.objectStore('restaurants');
            return store.getAll();
        }).then((items) => {
            console.log('items retrieved: ', items);
        });
    }
}
