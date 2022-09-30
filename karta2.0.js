//----------------------------------
// GLOBAL VARIABLES
//----------------------------------

// Google related variabels
let focusZoom = 17;
let cityZoom = 11;
let overviewZoom = 6;
var mainMap;

// Create all reseller DIVs


// DOM variables
let resellersParentDiv = document.querySelector('.resellers');
let resellerDivs;
const searchBar = document.querySelector('#search-city');
const autoCompletionList = document.querySelector('.city-list-autocomplete');


// Global storage of all the resellers.
let resellersGlobal = [];
fetchResellers().then((data) => {resellersGlobal= data})


createAndAddResellerDivs();

/**
 * Initlize the Google Map with settings and markers. 
 * 
 * 
 * This function name has to be the same as the 'callback' value 
 * specified in the Google Maps API script tag '&callback=initMap'.
 * Todo: Display error message on failed fetch.
*/
async function initMap() {
  // Get the coordinates from the resellers, fetched from  'lists.aterforsaljre.lat_lng'.
  let resellerCoordinates = await fetchResellersCoordinates();
  
  
  // Set the map options, the center of the map and the zoom on load. 
  let mapOptions = {
    center: new google.maps.LatLng('57.78594750386966', '14.162155747193367'),
    zoom: overviewZoom
  }
  // Create a map and initilize it in the div '#map'
  let map = new google.maps.Map(document.getElementById('map'), mapOptions);
  mainMap = map
  
  // Loop over all the coordinates and create markers for them on the map.
  resellerCoordinates.forEach((item)=> {
    
    // The coordinate are in 'xxxxxxxx, xxxxxxx' format. Split and get Longitude, and Langtiude by themselves.
    let longAndLang = item.split(',');
    let long = longAndLang[0];
    let lang = longAndLang[1];
    
    // Create markers
    let markerOptions = {
      position: new google.maps.LatLng(long, lang),
      map: map
    }
    let marker = new google.maps.Marker(markerOptions);
    
    
    // Add EventListner to the marker. On click, center the map on the marker on zoom in.
    marker.addListener('click', () => {
        map.setCenter(marker.getPosition());
        map.panTo(marker.getPosition());

        // If already zoomed in, zoom out.
        if (map.getZoom() == focusZoom - 1) {
          smoothZoomOut(map, overviewZoom, map.getZoom());
        }else {
          smoothZoomIn(map, focusZoom, map.getZoom());
        }
    });
    
  });
    
  // Enable all the 'Reseller' divs click functionality.
  makeResellerDivsClickableOnMap(map);
}

//-------------------------------------------
// GOOGLE MAPS HELPER METHODS
//-------------------------------------------
/**
 * Smooths the zooming functionailty by incremently zooming in until the desiered zoom has been reached.
 * 
 * @param {GoogleMap} map The map in which the zoom will take place.
 * @param {Integer} min The min amount of zoom that will be reached.
 * @param {Integer} current The current zoom on the map.
 */
function smoothZoomIn (map, max, current) {
  // If max zoom is reached, return.
    if (current >= max) {
        return;
    }
    else {
      // Increment the zoom until max is reached by recalling self. After each zoom, sleep 80ms.
        let listner = google.maps.event.addListener(map, 'zoom_changed', (event) =>{
            google.maps.event.removeListener(listner);
            smoothZoomIn(map, max, current + 1);
        });
        setTimeout(() => {
          map.setZoom(current);
          
        }, 80);
    }
}

/**
 * Smooths the zooming functionailty by incremently zooming out until the desiered zoom has been reached.
 * 
 * @param {GoogleMap} map The map in which the zoom will take place.
 * @param {Integer} max The max amount of zoom that will be reached.
 * @param {Integer} current The current zoom on the map.
 */
function smoothZoomOut (map, min, current) {
  // If min zoom is reached, return.
    if (current <= min - 1) {
        return;
    }
    else {
      // Increment the zoom until min is reached by recalling self. After each zoom, sleep 80ms.
        let listner = google.maps.event.addListener(map, 'zoom_changed', (event) =>{
            google.maps.event.removeListener(listner);
            smoothZoomOut(map, min, current - 1);
        });
        setTimeout(() => {
          map.setZoom(current);
          
        }, 80);

    }
}


//-------------------------------------------
// FETCH METHODS
//-------------------------------------------

/**
 * Retrives all the cooridates from the specified list, and returns an array of those coordinates.
 * @returns An array of the reseller coordinates.
 * TODO: Add error handling.
 */
async function fetchResellersCoordinates (){
  const resellers = await fetchResellers();
  
  let resellersCoordinates = [];
  
  for (let index in resellers) {
    resellersCoordinates.push(resellers[index].lat_lng);
  }
  return resellersCoordinates;
}


/**
 * Retrives all the 'Reseller' information from the lists
 * @returns An array of with all the 'Reseller' values
 * TODO: Add error handling.
 */
async function fetchResellers (){
/*
* --- NOTES ---
*  The current specified list is 'aterforsaljare'
*/

  // If previously fetched, return the previously saved data, use resellersGlobal != null
  let response = await fetch('/api/v1/lists/aterforsaljare');
  let json = await response.json();
  let rows = json.rows;

  let resellers = [];
  
  for (let key in rows) {
    resellers.push(rows[key].values);
  }
  
  return resellers;
}



//-------------------------------------------
// HELPER METHODS
//-------------------------------------------


/**
 * Makes all the 'Reseller' divs clickable and interactive with the map. Clicking a 'Reseller' div
 * will center the map on the 'Reseller' location and zoom in. 
  * @param {GoogleMap} map The Google Map
 */
async function makeResellerDivsClickableOnMap(map){
  let resellers = await fetchResellers();
  let previousLocation = null;
  let currentLocation = null;
  
  [...resellerDivs].forEach((resellerDiv)=> {
      resellerDiv.addEventListener('click', ()=> {
      
      // Get reseller information
      const resellerName = resellerDiv.querySelector('#reseller-name').querySelector('b').innerHTML;
      const resellerAddress = resellerDiv.querySelector('#reseller-address').innerHTML;
      let resellerCoordinates = null;
      
      // Map the div that was clicked with the 'Resellers' in the list and get the correct coordinates.
      // Map on the Reseller name and address
      for (let index in resellers) {
        if(resellers[index].namn.toLowerCase() == resellerName.toLowerCase() && resellers[index].adress.toLowerCase() == resellerAddress.toLowerCase()){
         resellerCoordinates = resellers[index].lat_lng;
        }
      }
      
     // The coordinate are in 'xxxxxxxx, xxxxxxx' format. Split and get Longitude, and Langtiude by themselves.
      let longAndLang = resellerCoordinates.split(',');
      let long = longAndLang[0];
      let lang = longAndLang[1];
      
      currentLocation = new google.maps.LatLng(long, lang); 
      // If already zoomed in, zoom out to the 'overviewZoom' , else, zoom in to 'focusZoom'
      if (map.getZoom() == focusZoom - 1) {
          if (previousLocation.equals(currentLocation) ) { 
            map.setCenter(currentLocation);
            map.panTo(currentLocation);
            smoothZoomOut(map, overviewZoom, map.getZoom());
          }else {
            smoothZoomOut(map, overviewZoom, map.getZoom());
            // After zooming out, wait, set center, pan over to location and zoom in.
            setTimeout(()=> {
                map.setCenter(currentLocation);
                map.panTo(currentLocation);
                smoothZoomIn(map, focusZoom, map.getZoom());
            }, 2000);
            
        }
          
        }else {
            map.setCenter(currentLocation);
            map.panTo(currentLocation);
            smoothZoomIn(map, focusZoom, map.getZoom());
        }
        previousLocation = currentLocation
    });
  });
}

/**
 * Handles the creation of the 'Reseller' div elements in the DOM. 
 * If no filter is applied, all resellers are shown. If a filter is given, then we remove
 * all the 'Reseller' divs which city does not match the cityFilter. 
 */
function createResellerHTMLElementsWithCity(cityFilter) {
  [...resellerDivs].forEach((resellerDiv)=> {
    let resellerCity = resellerDiv.querySelector('#reseller-city');
    
    // If we have no filter active on the input field, reset the 'Resellers' list by removing all children
    // and adding them back in the original order.
    if (cityFilter == "" || cityFilter == null) {
        while(resellersParentDiv.firstChild){
            resellersParentDiv.removeChild(resellersParentDiv.firstChild);
        }

        // Add all the Reseller divs back to the container (Resellers)
        [...resellerDivs].forEach((resellerDiv)=> {
            resellersParentDiv.appendChild(resellerDiv)
        });
    }
    else{
        // If a 'Reseller' is not matching the current city filter, remove it from the DOM
      if (!resellerCity.textContent.includes(cityFilter)){
        resellerDiv.remove();
      }
    }
    
  });
}

/**
 * Provides autocompletion for the input form on the 'Resellers' cities by adding 'li' elements.
 * Clicking autocompletion 'li' element will result in a new resellers list with only 'Resellers'
 * matching the input city name.
 * 
*/
async function autoCompleteCities() {
  let inputForm = this;
  let cities = [];
  createResellerHTMLElementsWithCity()
  
  for (let index in resellersGlobal) {
    if (!cities.includes(resellersGlobal[index].stad)){
      cities.push(resellersGlobal[index].stad);
    }
  }
  
  let sortedCities = cities.sort();
  
  // Remove previous list items, clear the list.
  removeListElements();
  
  for (let city in sortedCities) {
    // Check if any city starts with the input search-text
    if (sortedCities[city].toLowerCase().startsWith(inputForm.value.toLowerCase()) && inputForm.value !== ""){
      
      // Create the list elements for the auto completion
      let autoListItem = document.createElement('li');
      autoListItem.classList.add("auto-list-item");
      autoListItem.style.cursor = "pointer";
      
      // Make the matching letters of the avaiable cities and the search term bold.
      let suggestedCity = "<b>" + sortedCities[city].substr(0, inputForm.value.length) + "</b>";
      suggestedCity += sortedCities[city].substr(inputForm.value.length);
      
      // Append list elements to the autocompletion list.
      autoListItem.innerHTML = suggestedCity
    
      autoCompletionList.appendChild(autoListItem);
      let suggestedCityString = sortedCities[city]

      // Clicking on suggested city will remove all suggestions and 
      // populate the input form with the city name and call 'createResellerHTMLElementsWithCity'
      // with the clicked city.
      autoListItem.addEventListener('click', ()=> {
        removeListElements();
        inputForm.value = suggestedCityString
        createResellerHTMLElementsWithCity(suggestedCityString);
        zoomInOnCity(suggestedCityString);
      });
      
    }
  }
  
}
/**
 * Gives a closer overview over the specified city on the map. 
 * Fetches the city coordinates from Google API using the input city name adjusts the map.
 * @param {String} city The name of the city
 */
async function zoomInOnCity(city) {
  let cityResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${city}+sweden&sensor=true&key=AIzaSyBWbOWnTwyC7GU349bPAwBR2v-InO6sebc`)
  .catch(error => console.error('There was an error fetching the city coordinates from Google: '  + error));

  let cityResponseJson = await cityResponse.json()
  .catch(error => console.error('There was an error converting the response object from Google for the city:' + city + ' Error: ' + error));
  let cityLng = cityResponseJson.results[0].geometry.location.lng
  let cityLat = cityResponseJson.results[0].geometry.location.lat

  let cityCoordinates = new google.maps.LatLng(cityLat, cityLng); 

  // Check the current zoom of the map, if the current zoom is greater than the 'cityZoom' 
  // we zoom out and then pan and center on the city and apply the cityZoom on the map.
  if (mainMap.getZoom() > cityZoom){
    smoothZoomOut(mainMap, overviewZoom, mainMap.getZoom());
    setTimeout(() => {
      mainMap.setCenter(cityCoordinates);
      mainMap.panTo(cityCoordinates);
      smoothZoomIn(mainMap, cityZoom, mainMap.getZoom())
    }, 2000);
  }else {
    mainMap.setCenter(cityCoordinates);
    mainMap.panTo(cityCoordinates);
    smoothZoomIn(mainMap, cityZoom, mainMap.getZoom())
  }
}


/**
 * Removes all previous list items in the autocompletion window list.  
 */
function removeListElements() {
  let items = document.querySelectorAll('.auto-list-item');
  items.forEach((item) => {
    item.remove();
  })
}

//-------------------------------------------
// EVENT LISTENERS
//-------------------------------------------

 
searchBar.addEventListener('input', autoCompleteCities);


//-------------------------------------------
// HTML FACTORY
//-------------------------------------------

/**
 * Creates and displays all the reseller in alphabetical order.
 * 
 */
async function createAndAddResellerDivs(){
  const resellers = await fetchResellers();
  let sortedResellers = resellers.sort(compareCitiesByName);
  const pinVector = "https://s3-eu-west-1.amazonaws.com/static.wm3.se/sites/995/template_assets/Vector.png";
  
  [...sortedResellers].forEach((reseller) => {

    // Create the main HTML elements for the Reseller
    let resellerDiv = document.createElement('div');
    let pin = document.createElement('div');
    let pinImg = document.createElement('img');
    let resellerInfo = document.createElement('div');

    // Add class names to DIVs
    resellerDiv.classList.add('reseller');
    pin.classList.add('pin');
    resellerInfo.classList.add('reseller-info');

    // Set pin image
    pinImg.src = pinVector;

    // Create all <p> tags for the ResellerInfo div 
    let resellerName = document.createElement('p');
    let resellerAddress = document.createElement('p');
    let resellerCity = document.createElement('p');
    let resellerPhone = document.createElement('p');
    let resellerMail = document.createElement('p');
    let resellerWebsite = document.createElement('p');

    // Add values to <p>  tags
    resellerName.innerHTML = "<b>" + reseller.namn + "</b>";
    resellerAddress.innerHTML = reseller.adress;
    resellerCity.innerHTML = reseller.stad;
    resellerPhone.innerHTML = reseller.telefon;
    resellerMail.innerHTML = reseller.email;
    resellerWebsite.innerHTML = reseller.website;

    // Add ID's to <p> tags
    resellerName.id = "reseller-name";
    resellerAddress.id = "reseller-address";
    resellerCity.id = "reseller-city";

    // Append child nodes to parents
    resellerInfo.append(resellerName, 
      resellerAddress, 
      resellerCity, 
      resellerPhone, 
      resellerMail, 
      resellerWebsite);

    pin.append(pinImg);
    resellerDiv.append(pin, resellerInfo);
    resellersParentDiv.appendChild(resellerDiv);

  });

  // Set the global variable 
  resellerDivs = document.querySelectorAll('.reseller');
}


/**
 * Compare object based on the value of the 'stad' property on each reseller. Used to sort reseller in alphabetical order. 
 * @param {Object} a 
 * @param {Object} b 
 * @returns an integer used for the sort function.
 */
function compareCitiesByName(a, b){
  if(a.stad < b.stad){
    return -1
  }
  if (a.stad > b.stad) {
    return 1
  }
  return 0

}
