'use strict';
// implementation of service worker inspired from the Udacity course
// Google Developer Challenge Scholarship: Mobile Web
const _registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('../../service-worker.js')
        .then(function (registration) {
          console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function (error) {
          console.log(error);
        });
    });
    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      console.log(this);
      if (refreshing) {
        return;
      }
      // window.location.reload();
      refreshing = true;
    });
  }
};

 _registerServiceWorker();
self.markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error('fetch are o eroare', error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */

window.addEventListener('load', (event, restaurants = self.restaurants) => {
  let map = document.getElementById('map');
  let everything = map.querySelectorAll('*');
    for (let i=0; i<=everything.length; i++) {
      if (everything[i]) {
        everything[i].setAttribute('tabindex', -1);
      }
    }
});

window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501,
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false,
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants () {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.log(error);
    } else {
      if (!restaurants) {
        return;
      }
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants (restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
  // Remove all map markers
  if (!self || !self.markers) {
    return;
  }
  self.markers.forEach(function (m) {
    m.setMap(null);
  });
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML (restaurants = self.restaurants) {
  if (!restaurants) {
    return;
  }
  const parentDiv = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    if (!restaurant) {
      return;
    }
    parentDiv.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML (restaurant) {
  if (!restaurant) {
    return;
  }
  const childDiv = document.createElement('div');
  childDiv.className = 'restaurants-list-item';

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image['data-src'] = image.src;
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
  more.rel = 'noopener';
  childDiv.append(more);

  return childDiv;
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap (restaurants = self.restaurants) {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
}
