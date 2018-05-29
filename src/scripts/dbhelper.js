/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.c
   */
  static get DATABASE_URL () {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   * @description constructor IDBHelper(idb: "idb"): IDBHelper
   * @param {function} callback
   */
  static fetchRestaurants (callback) {
    const idbHelper = new IDBHelper(idb);
    fetch(this.DATABASE_URL)
    .then(function (response) {
      if (response.ok) {
        response.json()
          .then(function (data) {
            idbHelper.populateDatabase(data);
            callback(null, data);
          });
      } else {
        throw response.statusText;
      }
    })
    .catch(function (error) {
      console.log('error: ', error);
      const DBPromise = idbHelper.openDatabase();
      DBPromise.then(function (db) {
        idbHelper.readAllIdbData(db).then(function (restaurants) {
          console.log('data from idbHelper: ', restaurants);
          callback(null, restaurants);
          });
        });
  });
  }

  /**
   * Fetch a restaurant by its ID.
   * @param {string} id
   * @param {*} callback
   */
  static fetchRestaurantById (id, callback) {
    if (!id) {
      return;
    }
    const rUrl = this.DATABASE_URL + '/' + id;

    fetch(rUrl)
      .then(function (response) {
        if (response.ok) {
          response.json().then(function (data) {
            callback(null, data);
          });
        } else {
          throw response.statusText;
        }
      })
      .catch(function (error) {
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   * @param {string} cuisine
   * @param {*} callback
   */
  static fetchRestaurantByCuisine (cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter((r) => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   * @param {string} neighborhood
   * @param {*} callback
   */
  static fetchRestaurantByNeighborhood (neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(
          (r) => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine
   * and a neighborhood with proper error handling.
   * @param {string} cuisine
   * @param {string} neighborhood
   * @param {*} callback
   */
  static fetchRestaurantByCuisineAndNeighborhood (
    cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter((r) => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter((r) => r.neighborhood === neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   *  @param {*} callback
   */
  static fetchNeighborhoods (callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   *  @param {*} callback
   */
  static fetchCuisines (callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) === i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   * @param {restaurant} restaurant
   * @return {string}
   */
  static urlForRestaurant (restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   * @param {restaurant} restaurant
   * @return {string}
   */
  static imageUrlForRestaurant (restaurant) {
    const mqTablet = window.matchMedia('(min-width: 450px)');
    const mqDestop = window.matchMedia('(min-width: 800px)');
    let imgAddress = restaurant.photograph;

    if (!restaurant || !restaurant.photograph) {
      imgAddress = restaurant.id;
    }
    if (mqDestop.matches) {
      return (`/img/desktop/${imgAddress}.jpg`);
    } else if (mqTablet.matches) {
      return (`/img/tablet/${imgAddress}.jpg`);
    } else {
      return (`/img/mobile/${imgAddress}.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   * @param {restaurant} restaurant
   * @param {map} map
   * @return {object}
   */
  static mapMarkerForRestaurant (restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP,
    });
    return marker;
  }
}
