 /*jshint esversion: 6 */
 "use strict";

import DBHelper from './dbhelper';
import idb from 'idb';

function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('mws-restaurant', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('mws-restaurant', {
      keyPath: 'id'
    });
    store.createIndex('by-date', 'time');
  });
}

export class IndexController {
  constructor(container) {
    /*global google */
    this._container = container;
    // this._postsView = new PostsView(this._container);
    // this._toastsView = new ToastsView(this._container);
    this._lostConnectionToast = null;
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
    this._cleanImageCache();
    let indexController = this;
    setInterval(function () {
      indexController._cleanImageCache();
    }, 1000 * 60 * 5);
    // implementation of service worker inspired from the Udacity course
    // Google Developer Challenge Scholarship: Mobile Web
    this.restaurants = null;
    this.caches = null;
    this.neighborhoods = null;
    this.refreshing = null;

    this.markers = [];
    // Let us open our database
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var DBOpenRequest = window.indexedDB;
    DBOpenRequest.open("mws-restaurant", 1);
    IndexController.prototype_registerServiceWorker = function () {
      if (!navigator.serviceWorker) {
        return;
      }
      window.addEventListener('load', function () {
        navigator.serviceWorker.register("./service-worker.js")
          .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
            if (!navigator.serviceWorker.controller) {
              return;
            }
            if (registration.waiting) {
              indexController._updateReady(registration.waiting);
              return;
            }
            if (registration.installing) {
              indexController._trackInstalling(registration.installing);
              return;
            }
            registration.addEventListener('updatefound', function () {
              indexController._trackInstalling(registration.installing);
            })
              .catch(function (error) {
                console.log('Service worker registration failed, error:', error);
              });
            this.console.log("service worker registered ?");
          });
      });
      // Ensure refresh is only called once.
      // This works around a bug in "force update on reload".
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) {
          return;
        }
        window.location.reload();
        refreshing = true;
      });
      IndexController.prototype._cleanImageCache = function () {
        return this._dbPromise.then(function (db) {
          if (!db) {
            return;
          }
          var imagesNeeded = [];
          var tx = db.transaction('mws-restaurant');
          return tx.objectStore('mws-restaurant').getAll().then(function (messages) {
            messages.forEach(function (message) {
              imagesNeeded.push(message);
            });
            return this.caches.open('mws-restaurant-content-imgs');
          }).then(function (cache) {
            return cache.keys().then(function (requests) {
              requests.forEach(function (request) {
                var url = new URL(request.url);
                if (!imagesNeeded.includes(url.pathname)) {
                  cache.delete(request);
                }
              });
            });
          });
        });
      };
      /**
       * Fetch neighborhoods and cuisines as soon as the page is loaded.
       */
      document.addEventListener('DOMContentLoaded', () => {
        this.fetchNeighborhoods();
        this.fetchCuisines();
      });
      /**
       * Fetch all neighborhoods and set their HTML.
       */
      this.fetchNeighborhoods = () => {
        DBHelper.fetchNeighborhoods((error, neighborhoods) => {
          if (error) {
            console.error(error);
          }
          else {
            this.neighborhoods = neighborhoods;
            this.fillNeighborhoodsHTML();
          }
        });
      };
      /**
       * Set neighborhoods HTML.
       */
      this.fillNeighborhoodsHTML = (neighborhoods = this.neighborhoods) => {
        const select = document.getElementById('neighborhoods-select');
        neighborhoods.forEach(neighborhood => {
          const option = document.createElement('option');
          option.innerHTML = neighborhood;
          option.value = neighborhood;
          select.append(option);
        });
      };
      /**
       * Fetch all cuisines and set their HTML.
       */
      this.fetchCuisines = () => {
        DBHelper.fetchCuisines((error, cuisines) => {
          if (error) {
            console.error(error);
          }
          else {
            this.cuisines = cuisines;
            this.fillCuisinesHTML();
          }
        });
      };
      /**
       * Set cuisines HTML.
       */
      this.fillCuisinesHTML = (cuisines = this.cuisines) => {
        const select = document.getElementById('cuisines-select');
        cuisines.forEach(cuisine => {
          const option = document.createElement('option');
          option.innerHTML = cuisine;
          option.value = cuisine;
          select.append(option);
        });
      };
      /**
       * Initialize Google map, called from HTML.
       */
      window.addEventListener('load', (event, restaurants = this.restaurants) => {
        let map = document.getElementById("map");
        let everything = map.querySelectorAll("*");
        for (var i = 0; i <= everything.length; i++) {
          if (everything[i]) {
            everything[i].setAttribute("tabindex", -1);
          }
        }
      });
      window.initMap = () => {
        let loc = {
          lat: 40.722216,
          lng: -73.987501
        };
        this.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: loc,
          scrollwheel: false
        });
        this.updateRestaurants();
      };
      /**
       * Update page and map for current restaurants.
       */
      this.updateRestaurants = () => {
        const cSelect = document.getElementById('cuisines-select');
        const nSelect = document.getElementById('neighborhoods-select');
        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;
        const cuisine = cSelect[cIndex].value;
        const neighborhood = nSelect[nIndex].value;
        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
          if (error) {
            console.error(error);
          }
          else {
            this.resetRestaurants(restaurants);
            this.fillRestaurantsHTML();
          }
        });
      };
      /**
       * Clear current restaurants, their HTML and remove their map markers.
       */
      this.resetRestaurants = (restaurants) => {
        // Remove all restaurants
        this.restaurants = [];
        const ul = document.getElementById('restaurants-list');
        ul.innerHTML = '';
        // Remove all map markers
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];
        this.restaurants = restaurants;
      };
      /**
       * Create all restaurants HTML and add them to the webpage.
       */
      this.fillRestaurantsHTML = (restaurants = this.restaurants) => {
        const parentDiv = document.getElementById('restaurants-list');
        restaurants.forEach(restaurant => {
          parentDiv.append(this.createRestaurantHTML(restaurant));
        });
        this.addMarkersToMap();
      };
      /**
       * Create restaurant HTML.
       */
      this.createRestaurantHTML = (restaurant) => {
        const childDiv = document.createElement('div');
        childDiv.className = "restaurants-list-item";
        const image = document.createElement('img');
        image.className = 'restaurant-img';
        image.src = DBHelper.imageUrlForRestaurant(restaurant);
        image.alt = `a photo of ${restaurant.name}'s interior`;
        childDiv.append(image);
        const name = document.createElement('h2');
        name.innerHTML = restaurant.name;
        childDiv.append(name);
        const neighborhood = document.createElement('p');
        neighborhood.innerHTML = restaurant.neighborhood;
        childDiv.append(neighborhood);
        const address = document.createElement('p');
        address.innerHTML = restaurant.address;
        childDiv.append(address);
        const more = document.createElement('a');
        more.innerHTML = 'View Details';
        more.href = DBHelper.urlForRestaurant(restaurant);
        childDiv.append(more);
        return childDiv;
      };
      /**
       * Add markers for current restaurants to the map.
       */
      this.addMarkersToMap = (restaurants = this.restaurants) => {
        restaurants.forEach(restaurant => {
          // Add marker to the map
          const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.map);
          google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url;
          });
          this.markers.push(marker);
        });
      };
    };
  }
}
