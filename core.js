/*globals document*/

/*************************************************************
 * Helper functions for DOM and string manipulation
 * @author Kip Price
 * @version v1.2
 * @since v0.1
 ************************************************************/

/**
 * Global structure of the KIP library
 * @type {Object}
 */
var KIP = {
  Objects : {},
  Functions : {},
  Constants : {},
  Globals : {},
  Options : {},
  Test : {}
};

/*************************************************************************
 * Creates a div element with the provided id, class, content, and attributes.
 *
 * @param {string} id The ID to assign the element {optional}
 * @param {string} cls The class to assign the element {optional}
 * @param {string} content What to include as the contents of the div {optional}
 * @param {arr} attr An array of key-value pairs that sets all other attributes for the element
 *
 * @return {HTML Element} The created element, with all specified parameters included.
 *************************************************************************/
KIP.Functions.CreateSimpleElement = function (id, cls, content, attr) {
  var elem, a;

  elem = document.createElement("div");

  // Add the ID if we have it
  if (id) {
    elem.setAttribute("id", id);
  }

  // Add the class if we have it
  if (cls) {
    elem.setAttribute("class", cls);
  }

  // Add the innerHTML if we have it
  if (content) {
    elem.innerHTML = content;
  }

  // Loop through our list of attributes and set them too
  for (a in attr) {
    if (attr.hasOwnProperty(a)) {
      try {
        elem.setAttribute(attr[a].key, attr[a].val);
      } catch (e) {
        continue;
      }
    }
  }

  return elem;
};

/*************************************************
 * Creates an HTML element with the attributes that are passed in through the object.
 *
 * The attributes accepted are "id", "cls", "attr", "children", "type", "before_content", and "after_content"
 *
 * @param {obj} obj The object to base the element off of
 *
 * @return {HTML Element} The HTML element with all attributes specified by the object
 *************************************************/
KIP.Functions.CreateElement = function (obj) {
  var elem, a, c, child, type;

  type = obj.type || "div";
  elem = document.createElement(type);

  if (obj.id) {
    elem.setAttribute("id", obj.id);
  }

  if (obj.cls) {
    elem.setAttribute("class", obj.cls);
  }

  if (obj.before_content) {
    elem.innerHTML = obj.before_content;
  }

  // Loop through all other attributes that we should be setting
  for (a in obj.attr) {
    if (obj.attr.hasOwnProperty(a)) {
      try {
        elem.setAttribute(obj.attr[a].key, obj.attr[a].val);
      } catch (e) {
        continue;
      }
    }
  }

  // Loop through all of the children listed for this element
  for (c in obj.children) {
    if (obj.children.hasOwnProperty(c)) {
      try {
        if (obj.children[c].setAttribute) {
          elem.appendChild(obj.children[c]);
        } else {
          child = KIP.Functions.CreateElement(obj.children[c]);
          elem.appendChild(child);
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Add any after html
  if (obj.after_content) {
    elem.innerHTML += obj.after_content;
  }

  return elem;
};

/********************************************************
 * Allows a user to safely add a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to add the element
 ********************************************************/
KIP.Functions.AddCSSClass = function (elem, newClass) {
  var cls = " " + elem.getAttribute("class") + " ";

  if (cls.indexOf(newClass) === -1){
    cls = cls + newClass;
    elem.setAttribute("class", KIP.Functions.Trim(cls));
  }
};

/************************************************************
 * Allows a user to safely remove a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to remove from the element
 ************************************************************/
KIP.Functions.RemoveCSSClass = function (elem, oldClass) {
  "use strict";
  var cls, len;
  cls = " " + elem.getAttribute("class") + " ";
  len = cls.length;
  cls = cls.replace(" " + oldClass + " "," ");

  if (cls.length !== len) {
    elem.setAttribute("class", KIP.Functions.Trim(cls));
  }
};

KIP.Functions.HasCSSClass = function (elem, cls) {
  var cur_cls = " " + elem.getAttribute("class") + " ";
  
  if (cur_cls.indexOf(cls) === -1) {
    return false;
  } 

  return true;
}

/*********************************************************
 * Sets the CSS definition for a given class and attribute.
 * 
 * @param {string} cls   - The class to change
 * @param {string} item  - The attribute within the class to update
 * @param {string} val   - The new value to set the attribute to
 * @param {bool} force   - If true, will create the CSS attribute even if it doesn't exist
 *
 * @return {bool} True if the CSS was successfully set, false otherwise
 *********************************************************/
KIP.Functions.SetCSSAttribute = function (cls, item, val, force) {
  var i,css,sheet,rule;

  // Loop through all of the stylesheets we have available
  for (sheet = 0; sheet < document.styleSheets.length; sheet += 1) {

    // Pull in the appropriate index for the browser we're using
    css = document.all ? 'rules' : 'cssRules';  //cross browser
    rule = document.styleSheets[sheet][css];

    // If we have rules to loop over...
    if (rule) {

      // ... loop through them and check if they are the class we are looking for
      for (i = 0; i < rule.length; i += 1) {

        // If we have a match on the class...
        if (rule[i].selectorText === cls){

          // ... and the class has the item we're looking for ...
          if ( (rule[i].style[item]) || (force) ){

            //... set it to our new value, and return true.
            rule[i].style[item] = val;
            return true;
          }
        }
      }
    }
  }

  // Return false if we didn't change anything
  return false;
};

/*********************************************
 * Grabs the value of a given CSS class's attribute
 * 
 * @param {string} cls  - The CSS class to look within
 * @param {string} item - The attribute we want to grab the value for
 *
 * @return {string} The value of that particular CSS class's attribute
 *********************************************/
KIP.Functions.GetCSSAttribute = function (cls, item) {
  var i,css,sheet,rule;

  // Loop through all of the stylesheets we have available
  for (sheet=0; sheet < document.styleSheets.length; sheet += 1) {

    // Pull in the appropriate index for the browser we're using
    css = document.all ? 'rules' : 'cssRules';  //cross browser
    rule = document.styleSheets[sheet][css];

    // If we have an index...
    if (rule) {
      // ... loop through all and check for the actual class
      for (i = 0 ; i < rule.length; i += 1) {

        // If we find the class...
        if (rule[i].selectorText === cls){

          // ... return what the item is set to (if anything)
          return (rule[i].style[item]);
        }
      }
    }
  }

  // Return a blank string if it couldn't be found
  return "";
};

/*******************************************************
 * Gets the computed style of a given element
 * 
 * @param {HTMLElement} elem - The element we are getting the style of
 * @param {string} attr - If passed in, the attribute to grab from the element's style
 *
 * @return {string} Either the particular value for the passed in attribute, or the whole style array. 
 *******************************************************/
KIP.Functions.GetComputedStyle = function (elem, attr) {
  var style;

  // Use the library function on the window first
  if (window.getComputedStyle) {
    style = window.getComputedStyle(elem);

    if (attr) {
      return style.getPropertyValue(attr);
    } else {
      return style;
    }

  // If that doesn't work, maybe it's through the currentStyle property
  } else if (elem.currentStyle) {
    style = elem.currentStyle;

    if (attr) {
      return style[attr];
    } else {
      return style;
    }
  }

  return;
}

/*************************************
 * Trims all white space off of the beginning and end of a string
 *
 * @param {string} str The string to trim
 *
 * @return {string} The trimmed string
 *************************************/
KIP.Functions.Trim = function (str) {
  var ret;
  ret = str.replace(/^\s*/g, "");
  ret = ret.replace(/\s*?$/g, "");
  return ret;
};

/***********************************************************
 * Gets the offset left of this element in reference to the entire page
 *
 * @param {HTML Element} elem   The element to get the offset of
 * @param {HTML Element} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the left of the page (or parent, if included)
 ***********************************************************/
KIP.Functions.GlobalOffsetLeft = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetLeft", parent);
}

/*********************************************************
 * Gets the offset top of this element in reference to the entire page
 *
 * @param {HTML Element} elem   The element to get the offset of
 * @param {HTML Element} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the top of the page (or parent, if included)
 *********************************************************/
KIP.Functions.GlobalOffsetTop = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetTop", parent);
}

/*******************************************************
 * Gets both the left and top offset
 *
 * @param {HTML Element} elem   The element to get the offsets for
 * @param {HTML Element} parent The element to use as the reference frame
 *
 * @return {obj} Object with the keys "left" and "top"
 *******************************************************/
KIP.Functions.GlobalOffsets = function (elem, parent) {
  return {
    left: KIP.Functions.GlobalOffsetLeft(elem, parent),
    top: KIP.Functions.GlobalOffsetTop(elem, parent)
  }
}

/***************************************************************
 * Helper function to get a global offset
 *
 * @param  {HTML Element} elem   The element to get the global offset for
 * @param  {string} type   The type of offset we should look at (either "offsetTop" or "offsetWidth")
 * @param  {HTML Element} parent The parent to use as the reference frame. Uses document.body by default {optional}
 *
 * @return {int} The specified offset for the element
 ***************************************************************/
KIP.Functions.auxGlobalOffset = function (elem, type, parent) {
  var offset = 0;

  // Recursively loop until we no longer have a parent
  while(elem && (elem !== parent)) {
    if (elem[type]) {
      offset += elem[type]
    }
    elem = elem.parentNode;
  }

  return offset;
}

/*************************************************************
 * Finds the closest shared parent between two arbitrary elements
 *
 * @param {HTML Element} elem_a  The first element to find the shared parent for
 * @param {HTML Element} elem_b  The second element to find the shared parent for
 *
 * @return {HTML Element} The closest shared parent, or undefined if it doesn't exist or an error occurred.
 ************************************************************/
KIP.Functions.FindCommonParent = function (elem_a, elem_b) {
  var parent_a, parent_b;

  // If eother element doesn't exist, no point in going further
  if (!elem_a || !elem_b) return undefined;

  // Set up the source parent, and quit if it doesn't exist
  parent_a = elem_a;

  // Set up the reference parent and quit if it doesn't exist
  parent_b = elem_b;

  // Loop through all parents of the source element
  while (parent_a) {

    // And all of the parents of the reference element
    while (parent_b) {

      // If they are the same parent, we have found our parent node
      if (parent_a === parent_b) return parent_a;

      // Otherwise, increment the parent of the reference element
      parent_b = parent_b.parentNode;
    }

    // Increment the source parent and reset the reference parent
    parent_a = parent_a.parentNode;
    parent_b = elem_b;
  }

  // return undefined if we never found a match
  return undefined;

};

/********************************************************************
 * Moves a given element to a position relative to the reference element.
 *
 * This is for cases where you have two elements with different parents, and
 * you want to specify that element A is some number of pixels in some direction compared to element B.
 *
 * @param {HTML Element} elem    The element to move
 * @param {HTML Element} ref     The element to use as the reference element
 * @param {int} x       The x offset to give this element, relative to the reference
 * @param {int} y       The y offset to give this element, relative to the reference
 * @param {bool} no_move If set to false, only returns the offset_x and offset_y that the element would have to be moved {optional}
 *
 * @return {obj} An object containing the keys x and y, set to the offset applied to the element.
 *******************************************************************/
KIP.Functions.MoveRelToElem = function (elem, ref, x, y, no_move) {
  var offset_me,offset_them, dx, dy;

  // Find the offsets globally for each element
  offset_me = KIP.Functions.GlobalOffsets(elem);
  offset_them = KIP.Functions.GlobalOffsets(elem);

  // Find the difference between their global offsets
  dx = offset_them.left - offset_me.left;
  dy = offset_them.top - offset_me.left;

  // Adjust the element to the position specified
  if (!no_move) {
    elem.style.position = "absolute";
    elem.style.left = dx + "px";
    elem.style.top = dy + "px";
  }

  // Always return the offset we assigned this element.
  return {x: dx, y: dy};

}

/***************************************************
 * Gets a piece of a delimited string
 *
 * @param {string} str The string to grab a piece from
 * @param {string} delim The character (or characters) that are delimiting the string
 * @param {int} piece The piece number to get. Defaults to 1 if not passed in.
 *
 * @return {string} The specified piece of the string, "" if it doesn't exist
 ***************************************************/
KIP.Functions.Piece = function (str, delim, piece) {
  var i, start, end;

  start = -1;
  end = str.indexOf(delim);
  for (i = 0; i < (piece - 1); i += 1) {
    start = end;
    end = str.indexOf(delim, end + 1);

    if (start === -1) {
      return "";
    }
  }

  if (end === -1) {
    return str.substr(start + 1);
  }

  return str.substring(start + 1, end);
};

/**************************************************
 * Capitalizes the first letter of each word of a given string, and converts all else to lowercase
 *
 * @param {string} str   The string to convert to title case
 * @param {string} delim What separates the different words in this string
 *
 * @returns {string} The string, now in title case
 **************************************************/
KIP.Functions.TitleCase = function (str, delim) {
	var words, w, out;
	delim = delim || " ";
	out = "";

	words = str.split(delim);

	for (w = 0; w < words.length; w += 1) {
		if (w !== 0) {
			out += delim;
		}
		out += KIP.Functions.CharAt(words[w], 0).toUpperCase();
		out += KIP.Functions.Rest(words[w], 1).toLowerCase();
	}

	return out;
};

/*********************************************
 * Capitalizes the first letter of a given string, and converts the rest to lowercase
 *
 * @param {string} str   The string to capitalize
 *
 * @returns {string} The string, now in sentence case
 *********************************************/
KIP.Functions.SentenceCase = function (str) {
	var out;
	out = KIP.Functions.CharAt(str, 0).toUpperCase();
	out += KIP.Functions.Rest(str, 1).toLowerCase();

	return out;
};

/*********************************************
 * Slightly more memorable way to get a character at a given position in a string
 *
 * @param {string} str The string to take the character out of
 * @param {int} idx What index of the string to get the character of
 *
 * @return {string} The character at the specified position
 ********************************************/
KIP.Functions.CharAt = function (str, idx) {
	return str.substr(idx, 1);
};

/*********************************************
 * Gets the substring of a string starting from a given index
 *
 * @param {string} str The string to get the substring of
 * @param {int} idx What index to start the substring at
 *
 * @return {string} The rest of the string after the provided index
 ********************************************/
KIP.Functions.Rest = function (str, idx) {
	return str.substring(idx, str.length);
};

/*****************************************
 * Turns a date object into a short string representation
 *
 * @param {date} dt The date to convert to a string
 *
 * @returns {string} The short date string
 *****************************************/
KIP.Functions.ShortDate = function (dt) {
	var out;
	out = (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear();
	return out;
};

