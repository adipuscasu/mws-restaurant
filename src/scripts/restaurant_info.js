let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
      });
      fillBreadcrumb();
      // test
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 * @param {*} callback
 */
self.fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      addTabIndex();
      callback(null, restaurant);
    });
  }
};

self.addTabIndex = () => {
  let mapContainerElem = document.getElementById('map-container');
  let everythingMap = mapContainerElem.querySelectorAll('*');
  for (let i = 0; i <= everythingMap.length; i++) {
    if (everythingMap[i]) {
      everythingMap[i].setAttribute('tabindex', 0);
    }
  }
  let restaurantContainerElem = document.getElementById('restaurant-container');
  let everythingRestaurant = restaurantContainerElem.querySelectorAll('*');
  for (let i = 0; i <= everythingRestaurant.length; i++) {
    if (everythingRestaurant[i]) {
      everythingRestaurant[i].setAttribute('tabindex', 0);
    }
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 * @param {*} restaurant
 */
self.fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  self.addFavoriteButton(name);
  self.addModalForReviews(name);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = `a photo of ${restaurant.name}'s interior`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (self.restaurant.operating_hours) {
    self.fillRestaurantHoursHTML();
  }
  // fill reviews

  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id,
    (error, reviewsResult) => {
      if (error) {
        console.log('Error retrieving reviews: ', error);
      }
      if (reviewsResult && reviewsResult.length > 0) {
        self.restaurant.reviews = reviewsResult;
      }
      fillReviewsHTML();
    });
};

self.addFavoriteButton = (container) => {
  // adds the Favorite/Unfavorite button
  const favImg = document.createElement('img');
  favImg.classList.add('div-img-pull-right');
  let aImgSrc = '/img/favorite_star2_56x56.png';
  let imgTitle = 'Restaurant is favorite';

  if (restaurant.is_favorite === 'false') {
    aImgSrc = '/img/unfavorite_star_56x56.png';
    imgTitle = 'Restaurant is not favorite';
  }
  favImg.src = aImgSrc;
  favImg.title = imgTitle;
  favImg.alt = imgTitle;
  container.appendChild(favImg);

  favImg.addEventListener('click', () => {
    DBHelper.setRestaurantFavorite(restaurant, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      addTabIndex();
    });
  });
};

self.addModalForReviews = (container) => {
  if (!container) {
    return;
  }
  const modalDiv = document.createElement('div');
  modalDiv.classList.add('modal');
  modalDiv.id = 'modalReviewsEdit';
  const modalDivChild = document.createElement('div');
  modalDivChild.classList.add('modal-content');
  const spanInChildDiv = document.createElement('span');
  spanInChildDiv.classList.add('close');
  spanInChildDiv.innerHTML = '&times;';
  spanInChildDiv.onclick = function () {
    modalDiv.style.display = 'none';
  };
  const divForTextarea = document.createElement('div');
  divForTextarea.classList.add('center-div');
  const textAreaChild = document.createElement('textarea');
  textAreaChild.rows = 20;
  textAreaChild.placeholder = 'Please type here the review ' +
    'content and then click the Submit button';
  textAreaChild.id = 'reviews-textarea';
  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.innerText = 'Submit the review';
  submitButton.title = 'Press this button to submit the review';
  submitButton.id = 'modal-submit-button';
  submitButton.classList.add('submit-disabled');
  submitButton.disabled = true;
  submitButton.addEventListener('click', () => {
    const txtArea = document.getElementById('reviews-textarea');
    const reviewText = txtArea.txtValue;
    DBHelper.addReviewInRestaurantById(restaurant, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      addTabIndex();
    });
  });
  // add watchers on changes for the textarea
  textAreaChild.addEventListener('mouseover', (evnt) => {
    self.onTextAreaContentChange(evnt);
  });
  textAreaChild.addEventListener('click', (evnt) => {
    self.onTextAreaContentChange(evnt);
  });
  textAreaChild.addEventListener('mouseout', (evnt) => {
    self.onTextAreaContentChange(evnt);
  });
  textAreaChild.addEventListener('keyup', (evnt) => {
    self.onTextAreaContentChange(evnt);
  });
  textAreaChild.addEventListener('keydown', (evnt) => {
    self.onTextAreaContentChange(evnt);
  });

  divForTextarea.appendChild(textAreaChild);
  divForTextarea.appendChild(submitButton);
  modalDivChild.appendChild(spanInChildDiv);
  modalDivChild.appendChild(divForTextarea);
  modalDiv.appendChild(modalDivChild);
  container.appendChild(modalDiv);
};

self.onTextAreaContentChange = (evnt) => {
  let txtValue = evnt.target && evnt.target.value ? evnt.target.value :
    evnt.srcElement && evnt.srcElement.value ? evnt.srcElement.value : '';
  self.isSubmitValid(txtValue ? true : false);
};

self.isSubmitValid = (isEnabled) => {
  const submitButton = document.getElementById('modal-submit-button');
  submitButton.disabled = !isEnabled;
  if (!isEnabled && !submitButton.classList.contains('submit-disabled')) {
    submitButton.classList.add('submit-disabled');
  } else if (isEnabled && submitButton.classList.contains('submit-disabled')) {
    submitButton.classList.remove('submit-disabled');
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 * @param {*} operatingHours
 */
self.fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    if (operatingHours.hasOwnProperty(key)) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);
      hours.appendChild(row);
    }
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 * @param {*} reviews
 */
self.fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  self.addReviewsAddButton(container);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach((review) => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

self.addReviewsAddButton = (container) => {
  // clear the contents of the container first
  // this is to prevent duplicating reviews
  const testForDiv = document.getElementById('div-add-reviews-div');
  if (testForDiv) {
    document.removeChild(testForDiv);
  }
  
  // adds the Add review button
  const btnReview = document.createElement('BUTTON');
  const revText = 'Add review';
  btnReview.addEventListener('click', function () {
    const modalDiv = document.getElementById('modalReviewsEdit');
    modalDiv.style.display = 'block';
    DBHelper.addReviewForRestaurant(restaurant, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      addTabIndex();
    });
  });
  const txtButtonReview = document.createTextNode(revText);
  btnReview.appendChild(txtButtonReview);
  const divForbtnReview = document.createElement('div');
  divForbtnReview.id = 'div-add-reviews-button';
  divForbtnReview.appendChild(btnReview);
  container.appendChild(divForbtnReview);
};

/**
 * Create review HTML and add it to the webpage.
 * @param {*} review
 * @return {li} li element
 */
self.createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 * @param {*} restaurant
 */
self.fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 * @param {*} name
 * @param {*} url
 * @return {string} parameter
 */
self.getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};