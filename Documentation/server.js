/**
 * Sends an AJAX request to a url of our choice as either a POST or GET
 * @param {string} type - Set to either "POST" or "GET" to indicate the type of response we want
 * @param {string} url - The URL to send the request to
 * @param {function} [success] - A function to run if the call succeeds
 * @param {function} [error] - A function to run if the request errors out
 * @param {string} params - An "&" delimited string of "key=value" pairs that can be sent as AJAX
 * @returns {AJAXRequest} - The request that was sent
 */
KIP.Functions.AJAXRequest = function (type, url, success, error, params){
  var req = false;

  // Try to get an HTML Request
  try {
    req = new XMLHttpRequest();
  } catch (e) {

    // If it failed, it could be because we're in IE, so try that
    try {
      req = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e){

      // If that failed too, then we'll try the other IE specific method
      try {
        req = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e) {

        // And if we still can't get anything, then we're out of options
        return false;
      }
    }
  }

  // If we couldn't grab a request, quit
  if (!req) return false;

  // If we don't have a success function, create a generic blank one
	if (typeof success !== 'function') {
		success = function () {};
	}

  // If we don't have an error function, create a generic blank one
  if (typeof error !== 'function') {
		error = function() {};
	}

  // When the request is ready to run, try running it.
  req.onreadystatechange = function(){
    if(req.readyState === 4){
        return req.status === 200 ? success(req.responseText) : error(req.responseText);
    }
  };

  // If it's a GET request...
  if (type === "GET"){

    // ... send our request.
    req.open("GET", url, true);
    req.send(null);

  // If it's a POST request...
  }else if (type === "POST"){

    // ... open the connection ...
    req.open("POST", url, true);

    // ... pull in the data for the POST ...
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    // ... and send the data.
    req.send(params);

  }

  // Return the total request
  return req;
};