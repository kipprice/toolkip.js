/*globals document, window, Event*/

/**
 * @file Helper functions for DOM and string manipulation
 * @author Kip Price
 * @version v1.2
 * @since v0.1
 */

/**
 * Global structure of the KIP library
 * @namespace KIP
 */
var KIP = {
  /**
   * All object definitions contained within the library
   * @namespace Objects
   */
  Objects : {},

  /**
   * All global function definitions contained within the library
   * @namespace Functions
   */
  Functions : {},

  /**
   * All constants that are necessary for this library
   * @namespace Constants
   */
  Constants : {},

  /**
   * All globals that are necessary for this library
   * @namespace Globals
   */
  Globals : {},

  /**
   * All configurable options for the library
   * @namespace Options
   */
  Options : {},

  /**
   * All unit tests for the library
   * @namespace Test
   */
  Test : {},
	
	/**
	 * All events for the library
	 * @namespace Events
	 */
	Events : {}
};

KIP.Events.CSSChange = new Event("csschange");

// CreateSimpleElement
//--------------------------------------------------------------------
/**
 * Creates a div element with the provided id, class, content, and attributes.
 *
 * @param {string} id - The ID to assign the element {optional}
 * @param {string} cls - The class to assign the element {optional}
 * @param {string} content - What to include as the contents of the div {optional}
 * @param {arr} attr - An array of key-value pairs that sets all other attributes for the element
 *
 * @return {HTMLElement} The created element, with all specified parameters included.P
 */
KIP.Functions.CreateSimpleElement = function (id, cls, content, attr, children) {
  var elem, a, c, child;

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

  // Loop through all of the children listed for this element
  for (c in children) {
    if (children.hasOwnProperty(c)) {
      try {
        if (children[c].setAttribute) {
          elem.appendChild(children[c]);
        } else {
          child = KIP.Functions.CreateElement(children[c]);
          elem.appendChild(child);
        }
      } catch (e) {
        continue;
      }
    }
  }

  return elem;
};

// CreateElement
//------------------------------------------------------------------------------------
/**
 * Creates an HTML element with the attributes that are passed in through the object.
 *
 * @param {obj} obj - The object to base the element off of
 * @param {String} obj.id - The ID to assign to the created element
 * @param {String} obj.cls - The CSS class to assign the created element
 * @param {String} obj.type - The HTML tag to create. Defaults to "div" if not specified
 * @param {Array} obj.attr - An array of attributes to apply to the element.
 * @param {String} obj.attr.key - The name of the attribute to add
 * @param {String} obj.attr.val - The value of the attribute to add
 * @param {Array} obj.children - An array of child elements to add to the element. Can either be in the same object format as would be used for this function, or genuine HTML elements. Added in the order they appear in the array.
 * @param {String} obj.before_content - The inner HTML that should appear before any child elements are added
 * @param {String} obj.after_content - THe inner HTML that should be inserted after all child elements are drawn.
 * @return {HTMLElement} The HTML element with all attributes specified by the object
 *
 * @example
 * // returns an HTMl object that looks like this:
 * // <div id="123" class="cssClass" width="30"></div>
 * KIP.Functions.CreateElement( {id: "123", cls: "cssClass", attr: [{key: "width", val: 30}]});
 */
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

// AddCSSClass
//-----------------------------------------------------
/**
 * Allows a user to safely add a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to add the element
 */
KIP.Functions.AddCSSClass = function (elem, newClass) {
  var cls;
	
	if (!elem || !newClass) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
	elem.dispatchEvent(KIP.Events.CSSChange);

  // Still suport setting the class if the class is not originally set
  cls = elem.getAttribute("class");
  if (cls === null || cls === "null") {
    elem.setAttribute("class", newClass);
  }
	
	cls = " " + cls + " ";

  if (cls.indexOf(" " + newClass + " ") === -1) {
    cls = cls + newClass;
		elem.setAttribute("class", KIP.Functions.Trim(cls));
  }
};

// RemoveCSSClass
//--------------------------------------------------------
/**
 * Allows a user to safely remove a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to remove from the element
 */
KIP.Functions.RemoveCSSClass = function (elem, oldClass) {
  "use strict";
	var cls, len;
	
	if (!elem || !oldClass) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
	elem.dispatchEvent(KIP.Events.CSSChange);
	
  cls = " " + elem.getAttribute("class") + " ";
  len = cls.length;
  cls = cls.replace(" " + oldClass + " ", " ");

  if (cls.length !== len) {
		elem.setAttribute("class", KIP.Functions.Trim(cls));
  }

};

// HasCSSClass
//--------------------------------------------------
/**
 * Checks whether a provided HTML element has a CSS class applied
 *
 * @param {HTMLElement} elem - The element to check
 * @param {String} cls  - The CSS class to check for
 *
 * @returns {Boolean} True if the element has the CSS class applied; false otherwise
 */
KIP.Functions.HasCSSClass = function (elem, cls) {
	
	if (!elem) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
  var cur_cls = " " + elem.getAttribute("class") + " ";

  if (cur_cls.indexOf(" " + cls + " ") === -1) {
    return false;
  }

  return true;
};

// SetCSSAttribute
//------------------------------------------------------------------
/**
 * Sets the CSS definition for a given class and attribute.
 *
 * @param {string} cls   - The class to change
 * @param {string} item  - The attribute within the class to update
 * @param {string} val   - The new value to set the attribute to
 * @param {bool} force   - If true, will create the CSS attribute even if it doesn't exist
 *
 * @return {bool} True if the CSS was successfully set, false otherwise
 */
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
        if (rule[i].selectorText === cls) {

          // ... and the class has the item we're looking for ...
          if ((rule[i].style[item]) || (force)) {

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

// GetCSSAttribute
//-------------------------------------------------------
/**
 * Grabs the value of a given CSS class's attribute
 *
 * @param {string} cls  - The CSS class to look within
 * @param {string} item - The attribute we want to grab the value for
 *
 * @return {string} The value of that particular CSS class's attribute
 */
KIP.Functions.GetCSSAttribute = function (cls, item) {
  var i, css, sheet, rule;

  // Loop through all of the stylesheets we have available
  for (sheet = 0; sheet < document.styleSheets.length; sheet += 1) {

    // Pull in the appropriate index for the browser we're using
    css = document.all ? 'rules' : 'cssRules';  //cross browser
    rule = document.styleSheets[sheet][css];

    // If we have an index...
    if (rule) {
      // ... loop through all and check for the actual class
      for (i = 0 ; i < rule.length; i += 1) {

        // If we find the class...
        if (rule[i].selectorText === cls) {

          // ... return what the item is set to (if anything)
          return (rule[i].style[item]);
        }
      }
    }
  }

  // Return a blank string if it couldn't be found
  return "";
};

KIP.Functions.CreateCSSClass = function (selector, attr, noAppend) {
	var cls, a, styles;

  styles = document.getElementsByTagName("style");
  if (styles.length > 0) {
    cls = styles[0];
  } else {
    cls = document.createElement("style");
    cls.innerHTML = "";
  }
	
	cls.innerHTML += "\n" + selector + " {\n";
	for (a in attr) {
    if (attr.hasOwnProperty(a)) {
      if (attr[a].key) {
        cls.innerHTML += "\t" + attr[a].key + ": " + attr[a].val + ";\n";
      } else {
        cls.innerHTML += "\t" + a + " : " + attr[a] + ";\n";
      }
    }
	}
	cls.innerHTML += "\n}";
	
	if (!noAppend) document.head.appendChild(cls);
  
  return cls;
}

// GetComputedStyle
//---------------------------------------------------------
/**
 * Gets the computed style of a given element
 *
 * @param {HTMLElement} elem - The element we are getting the style of
 * @param {string} attr - If passed in, the attribute to grab from the element's style
 *
 * @return {string} Either the particular value for the passed in attribute, or the whole style array.
 */
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

// GlobalOffsetLeft
//-------------------------------------------------------------
/**
 * Gets the offset left of this element in reference to the entire page
 *
 * @param {HTMLElement} elem   The element to get the offset of
 * @param {HTMLElement} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the left of the page (or parent, if included)
 */
KIP.Functions.GlobalOffsetLeft = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetLeft", parent);
};

// GlobalOffsetTop
//------------------------------------------------------------
/**
 * Gets the offset top of this element in reference to the entire page
 *
 * @param {HTMLElement} elem   The element to get the offset of
 * @param {HTMLElement} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the top of the page (or parent, if included)
 */
KIP.Functions.GlobalOffsetTop = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetTop", parent);
};

// GlobalOffsets
//--------------------------------------------------------
/**
 * Gets both the left and top offset
 *
 * @param {HTMLElement} elem   The element to get the offsets for
 * @param {HTMLElement} parent The element to use as the reference frame
 *
 * @return {obj} Object with the keys "left" and "top"
 */
KIP.Functions.GlobalOffsets = function (elem, parent) {
  return {
    left: KIP.Functions.GlobalOffsetLeft(elem, parent),
    top: KIP.Functions.GlobalOffsetTop(elem, parent)
  };
};

/**
 * Helper function to get a global offset
 *
 * @param  {HTMLElement} elem   The element to get the global offset for
 * @param  {string} type   The type of offset we should look at (either "offsetTop" or "offsetWidth")
 * @param  {HTMLElement} parent The parent to use as the reference frame. Uses document.body by default {optional}
 *
 * @return {int} The specified offset for the element
 */
KIP.Functions.auxGlobalOffset = function (elem, type, parent) {
  var offset = 0;

  // Recursively loop until we no longer have a parent
  while (elem && (elem !== parent)) {
    if (elem[type]) {
      offset += elem[type];
    }
    elem = elem.offsetParent;
  }

  return offset;
};

// FindCommonParent
//----------------------------------------------------------------
/**
 * Finds the closest shared parent between two arbitrary elements
 *
 * @param {HTMLElement} elem_a  The first element to find the shared parent for
 * @param {HTMLElement} elem_b  The second element to find the shared parent for
 *
 * @return {HTMLElement} The closest shared parent, or undefined if it doesn't exist or an error occurred.
 */
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

// MoveRelToElement
//-------------------------------------------------------------------
/**
 * Moves a given element to a position relative to the reference element.
 *
 * This is for cases where you have two elements with different parents, and
 * you want to specify that element A is some number of pixels in some direction compared to element B.
 *
 * @param {HTMLElement} elem - The element to move
 * @param {HTMLElement} ref - The element to use as the reference element
 * @param {int} x - The x offset to give this element, relative to the reference
 * @param {int} y - The y offset to give this element, relative to the reference
 * @param {bool} no_move If set to false, only returns the offset_x and offset_y that the element would have to be moved {optional}
 *
 * @return {obj} An object containing the keys x and y, set to the offset applied to the element.
 */
KIP.Functions.MoveRelToElem = function (elem, ref, x, y, no_move) {
  var offset_me, offset_them, dx, dy;

  // Find the offsets globally for each element
  offset_me = KIP.Functions.GlobalOffsets(elem);
  offset_them = KIP.Functions.GlobalOffsets(elem);

  // Find the difference between their global offsets
  dx = (offset_them.left + x) - offset_me.left;
  dy = (offset_them.top + y) - offset_me.top;

  // Adjust the element to the position specified
  if (!no_move) {
    elem.style.position = "absolute";
    elem.style.left = dx + "px";
    elem.style.top = dy + "px";
  }

  // Always return the offset we assigned this element.
  return {x: dx, y: dy};

};

// RemoveSubclassFromAllElenents
//-------------------------------------------------------------------------------
/**
 * Allows you to easily remove a subclass from all elements that have a certain main class.
 * Useful for things like button selection
 * 
 * @param {String} cls - The main class to find all elements of
 * @param {String} subcls - The sub class to remove from all of those elements
 * @param {HTMLElement} [exception] - If needed, a single element that should not have its subclass removed.
 */
KIP.Functions.RemoveSubclassFromAllElements = function (cls, subcls, exception) {
	var elems, e, elem;
	elems = document.getElementsByClassName(cls);
	
	for (e = 0; e < elems.length; e += 1) {
		elem = elems[e];
		
		// Only remove it if it isn't the exception
		if (elem !== exception) {
			KIP.Functions.RemoveCSSClass(elem, subcls);
		}
	}
};

// AddResizingElement
//--------------------------------------------------------------------------------------
/**
 * Adds an element to the document that should resize with the document
 * @param {HTMLElement} elem - The element that should resize
 * @param {number} [fixedRatio] - If provided, keeps the image at this fixed ratio of w:h at all document sizes
 * @param {number} [forceInitW] - Optionally force the initial width to a certain value
 * @param {number} [forceInitH] - Optionally force the initial height to a certain value
 */
KIP.Functions.AddResizingElement = function (elem, fixedRatio, forceInitW, forceInitH) {
	"use strict";
	var idx, obj;
	if (!KIP.Globals.Resizables) {
		KIP.Globals.Resizables = [];
	}
	
	idx = KIP.Globals.Resizables.length;
	
	// Create an object with the initial parameters included
	KIP.Globals.Resizables[idx] = {
		
		// The original x, y, w, and h of the element
		o_x: KIP.Functions.GlobalOffsetLeft(elem),
		o_y: KIP.Functions.GlobalOffsetTop(elem),
		o_w: elem.offsetWidth,
		o_h: elem.offsetHeight,
		
		// The global width and height of the original window
		g_w: forceInitW || window.innerWidth,
		g_h: forceInitH || (window.innerWidth * fixedRatio) || window.innerHeight,
	
		// Other useful elements to keep track of
		h_w_ratio: fixedRatio || 1, 
		elem: elem
	};
	
	obj = KIP.Globals.Resizables[idx];
	
	// Add a listener on resize
	window.addEventListener("resize", function () {
		KIP.Functions.ResizeElement(obj);
	});
	
	return idx;
	
};

// ResizeElement
//---------------------------------------------
/**
 * Resizes an element to be the same ratio as it previously was
 * @param {HTMLElement} obj - The element to resize
 */
KIP.Functions.ResizeElement = function (obj) {
	var perc, h, wRatio, hRatio;
	
	// Calculate the ratio for the width
	wRatio = (window.innerWidth / obj.g_w);

	// Calculate the ratios we need for the height
	h = (obj.h_w_ratio * window.innerWidth) || (window.innerHeight);
	hRatio = (h / obj.g_h);
	
	// Calculate the x coordinate
	perc = (obj.o_x / obj.g_w); // Percentage of the width this appeared at originally
	obj.elem.style.left = (perc * window.innerWidth) + "px";
	
	// Calculate the y coordinate
	perc = (obj.o_y / obj.g_h);
	obj.elem.style.top = (perc * h) + "px";
	
	// Calculate the width and height
	obj.elem.style.width = (obj.o_w * wRatio) + "px";
	obj.elem.style.height = (obj.o_h * hRatio) + "px";
};

// RemoveElemFromArr
//-------------------------------------------------------------
/**
 * Finds & removes an element from the array if it exists.
 * @param {Array} arr - The array to remove from
 * @param {Variant} elem  - The element to remove
 * @param {Function} equal - The function that is used to test for equality
 */
KIP.Functions.RemoveElemFromArr = function (arr, elem, equal) {
  "use strict";
  var idx;

  // If we didn't get a function to test for equality, set it to the default
  if (!equal) {
    equal = function (a, b) {return (a === b); };
  }

  // Loop through the array and remove all equal elements
  for (idx = (arr.length - 1); idx >= 0; idx -= 1) {
    if (equal(arr[idx], elem)) {
      arr.splice(idx, 1);
    }
  }

};

// RoundToPlace
//--------------------------------------------------------
/**
 * Helper function to round a number to a particular place
 * @param {number} num - The number to round
 * @param {number} place - A multiple of 10 that indicates the decimal place to round to. I.e., passing in 100 would round to the hundredths place
 */
KIP.Functions.RoundToPlace = function (num, place) {
  return (Math.round(num * place) / place);
};

/**
  * 
*/
KIP.Functions.TransitionToDisplayNone = function (elem, func, disp) {
	"use strict";
	
	if (!disp) disp = "block";
	
	// Add the display none after a transition end 
	elem.addEventListener("transitionend", function () {
		if (func()) {
			elem.style.display = "none";
		}
	});
	
	// Remove the display none at the start of the fade in transition
	elem.addEventListener("csschangestart", function () {
		if (func()) {
			elem.style.display = disp;
		}
	})
};

// IsChildEventTarget
//--------------------------------------------------------
/**
 * Checks if a child of the current task is being targeted by the event
 * @param {Event} ev   - The event that is being triggered
 * @param {HTMLElement} root - The parent to check for
 * @returns {boolean} True if the event is being triggered on a child element of the root element, false otherwise
 */
KIP.Functions.IsChildEventTarget = function (ev, root) {
	"use strict";
	return KIP.Functions.IsChild(root, ev.target);
};

// IsChild
//--------------------------------------------------------
/**
 * Checks if an element is a child of the provided parent element
 * @param {HTMLElement} root - The parent to check for
 * @param {HTMLElement} child - The element to check for being a child of the root node
 * @param {number} [levels] - The maximum number of layers that the child can be separated from its parent. Ignored if not set.
 * @returns {boolean} True if the child has the root as a parent
 */
KIP.Functions.IsChild = function (root, child, levels) {
  "use strict";
  var parent;

  parent = child;

  // Loop through til we either have a match or ran out of parents
  while (parent) {
    if (parent === root) return true;
    parent = parent.parentNode;
  }

  return false;
};


// CreateTable
//-------------------------------------------------------------------------------------
/**
 * Creates a table with a specified set of cell elements
 * @param {string} tableID - The unique identifier to use for this table
 * @param {string} [tableClass] - The CSS class to use for the table
 * @param {array} elements - A 2D array of the indexing method [row][column] that contains the contents of the cell at this position that should be created within the table.
 *                         - Can come in three forms: a string of plain content, an already created element, or an object array with the following properties
 * @param {object} [elements[r][c].create] - An object to be passed into CreateElement, to generate the content of the cell
 * @param {string} [elements[r][c].content] - A string to be used as the content of the cell
 * @param {object} [elements[r][c].attr] - All additional attributes that should be applied to the cell (colspan & rowspan, e.g.)
 *
 * @returns {HTMLElement} The created HTML table
 * 
 * */
KIP.Functions.CreateTable = function (tableID, tableClass, elements, rowNum, colNum) {
  "use strict";
  
  var tbl, row, cell, elem, rIdx, cIdx, content, key;
  
  // Set a row number
  if (!rowNum) {
    rowNum = elements.length;
  }
  
  // Create the table
  tbl = KIP.Functions.CreateElement({
    type: "table",
    cls: tableClass
  });
  
  for (rIdx = 0; rIdx < rowNum; rIdx += 1) {
    // Grab the column number if we don't have it
    if (!colNum) {
      colNum = elements[rIdx].length;
    }
    
    row = tbl.insertRow(-1);
    for (cIdx = 0; cIdx < colNum; cIdx += 1) {
      
      // Check how this element should be added
      elem = elements[rIdx][cIdx];
      cell = row.insertCell(-1);
      this.ProcessCellContents(elem, cell);
    }
    
  }
  return tbl;
}

KIP.Functions.ProcessCellContents = function (data, cell) {
  "use strict";
  var content, key;
  
  // string
  if (data.toLowerCase) {
    cell.innerHTML = data;
    
  // HTML
  } else if (data.appendChild) {
    cell.appendChild(data)
  
  // Regular object
  } else {
    if (data.create) {
      content = KIP.Functions.CreateElement(data.create);
      cell.appendChild(content);
    } else {
      cell.innerHTML = data.content;
    }
    
    // Handle additional properties
    for (key in data.attr) {
      if (data.attr.hasOwnProperty(key)) {
        cell.setAttribute(key, data.attr[key]);
      }
    }
  }
  
  return cell;
};

KIP.Functions.AddRow = function (table, elements, idx, colNum) {
  "use strict";
  var row, cell, cIdx, data;
  
  if (!idx && (idx !== 0)) {
    idx = -1;
  }
  
  if (!colNum && colNum !== 0) {
    colNum = elements.length;
  }
  
  // Quit if we don't have a table
  if (!table) return;
  if (!table.insertRow) return;
  
  row = table.insertRow(idx);
  
  // Loop through columns to add cells
  for (cIdx = 0; cIdx < colNum; cIdx += 1) {
    cell = row.insertCell(-1);
    data = elements[cIdx] || "";
    this.ProcessCellContents(data, cell);
  }
  
  return row;
};
