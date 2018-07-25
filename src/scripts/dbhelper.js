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
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   * @description constructor IDBHelper(idb: "idb"): IDBHelper
   * @param {function} callback
   */
  static fetchRestaurants (callback) {
    const idbHelper = new IDBHelper(idb);
    fetch(this.DATABASE_URL + 'restaurants')
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
          return idbHelper.readAllIdbData(db).then(function (restaurants) {
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
    const idbHelper = new IDBHelper(idb);
    const rUrl = this.DATABASE_URL + 'restaurants/' + id;

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
        console.log('error: ', error);
        const DBPromise = idbHelper.openDatabase();
        DBPromise.then(function (db) {
          idbHelper.getRestaurantById(db, id).then(function (restaurant) {
            callback(null, restaurant);
          });
        });
      });
  }

  /**
   * Fetch reviews for a restaurant by identifier.
   * @param {string} id
   * @param {*} callback
   */
  static fetchReviewsByRestaurantId (id, callback) {
    if (!id) {
      return;
    }
    const idbHelper = new IDBHelper(idb);
    const rUrl = this.DATABASE_URL + 'reviews/?restaurant_id=' + id;

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
        console.log('error: ', error);
        const DBPromise = idbHelper.openDatabase();
        DBPromise.then(function (db) {
          idbHelper.getReviewsForRestaurantById(db, id).then(function (reviews) {
            callback(null, reviews);
          });
        });
      });
  }

  /**
   * Sets favorite to true or false for a restaurant
   * @param {restaurant} restaurant object
   * @param {callback} callback function
   */
  static setRestaurantFavorite (restaurant, callback) {
    if (!restaurant || !restaurant.id) {
      return;
    }
    let isFavorite = restaurant.is_favorite === 'true';
    const rUrl = this.DATABASE_URL + 'restaurants/' + restaurant.id +
      '/?is_favorite=' + !isFavorite;
    fetch(rUrl, {
        method: 'PUT',
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache',
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify({}),
        // body data type must match "Content-Type" header
      })
      .then((response) => response.json()
        .then(function (data) {
          if (callback) {
            callback(null, data);
          }
        })
      ) // parses response to JSON
      .catch((error) => console.error(`Fetch Error =\n`, error));
  }
  /**
   * @description Adds a review to a restaurant
   * @param {review} review A restaurant review object
   * @param {Function} callback Callback function to update the restaurant
   */
  static addReviewForRestaurant (review, callback) {
    if (!review || !review.restaurant_id) {
      return;
    }
    const addReviewUrl = this.DATABASE_URL + 'reviews/';
    const reviewObject = {
      'restaurant_id': review.restaurant_id,
      'name': review.name ? review.name : 'unnamed reviewer',
      'rating': review.rating >= 0 && review.rating <= 5 ? review.rating : 0,
      'comments': review.comments,
    };
    console.log('I got the review: ', reviewObject);
    fetch(addReviewUrl, {
        method: 'POST',
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache',
        credentials: 'same-origin', // include, same-origin, *omit
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(reviewObject),
        // body data type must match "Content-Type" header
      })
      .then((response) => response.json()
        .then(function (data) {
          console.log('this returns: ', data);
          if (callback) {
            callback(null, data);
          }
        })
      ) // parses response to JSON
      .catch((error) => console.error(`Fetch Error =\n`, error));
  }

  /**
   * @description Removes a review from a restaurant
   * @param {review} review A restaurant review object
   * @param {Function} callback Callback function to update the restaurant
   */
  static removeReviewForRestaurant (review, callback) {
    if (!review || !review.id) {
      return;
    }
    const removeReviewUrl = this.DATABASE_URL +
     'reviews/' + review.id;
    console.log('I got the review: ', review);
    console.log('and the remove url: ', removeReviewUrl);
    fetch(removeReviewUrl, {
        method: 'DELETE'})
      .then((response) => response.json()
        .then(function (data) {
          console.log('delete returns: ', data);
          if (callback) {
            callback(null, data);
          }
        })
      ) // parses response to JSON
      .catch((error) => console.error(`Fetch Error =\n`, error));
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
    let imgAddress = restaurant.photograph;

    const nAHasChrome = navigator.userAgent.indexOf('Chrome') > -1;
    const nAHasNotEdge = navigator.userAgent.indexOf('Edge') === -1;
    const isChromeBrowser = nAHasChrome && nAHasNotEdge;

    const imgExtension = isChromeBrowser ? 'webp' : 'jpg';
    if (!restaurant || !restaurant.photograph) {
      imgAddress = restaurant.id;
    }
    return (`dist/img/${imgAddress}.${imgExtension}`);
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
