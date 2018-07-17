const dbName = 'mws-restaurant';

/**
 * Common idb helper functions.
 */
class IDBHelper {
    /**
     * @description constructor
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
        this.getRestaurantById = IDBHelper.getRestaurantById;
        this.getReviewsForRestaurantById  = IDBHelper.getReviewsForRestaurantById;
    }

    /**
     * @description Gets a promise after opening the mws-restaurants database
     * @return {Promise} Promise
     */
    static openDatabase () {
        return this.idb.open(dbName, 2, function (upgradeDb) {
            console.log('inside db open: ', upgradeDb);
            const store = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id',
            });
            store.createIndex('createdAt', 'createdAt');
            const storeReviews = upgradeDb.createObjectStore('reviews', {
                keyPath: 'id',
            });
            storeReviews.createIndex('createdAt', 'createdAt');
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
     * @param {*} db
     * @return {restaurants} restaurants
     */
    static readAllIdbData (db) {
        if (!db) {
            return Promise.resolve();
        }
        let tx = db.transaction(['restaurants'], 'readonly');
        let store = tx.objectStore('restaurants');
        return store.getAll();
    }

    /**
     * @description Returns a restaurant object
     * @param {IDBDatabase} db
     * @param {Number} restaurantId
     * @return {restaurant} restaurant
     */
    static getRestaurantById (db, restaurantId) {
        if (!db) {
            return Promise.resolve();
        }
        const tx = db.transaction(['restaurants'], 'readonly');
        const store = tx.objectStore('restaurants');
        const id = parseInt(restaurantId);
        return store.get(id);
    }

    /**
     * @description Returns a restaurant object
     * @param {IDBDatabase} db
     * @param {Number} restaurantId
     * @return {restaurant} restaurant
     */
    static getReviewsForRestaurantById (db, restaurantId) {
        if (!db) {
            return Promise.resolve();
        }
        const tx = db.transaction(['reviews'], 'readonly');
        const store = tx.objectStore('reviews');
        const id = parseInt(restaurantId);
        return store.get(id);
    }
}
