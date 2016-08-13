/*globals KIP*/

/**
 * @file Documents the Drawable class
 * @author Kip Price
 * @version 1.2
 * @since 0.1
 */

/**
 *This is an interface-esque object that abstracts the draw function
 *@constructor
 *@param {string} id - The ID that should be used for the div for this object
 *@param {string} cls - The class that should be used for the main div for this object
 *@param {string} content - The content that should be applied to this div
 */
KIP.Objects.Drawable = function (id, cls, content) {
	"use strict";
  this.div = KIP.Functions.CreateSimpleElement(id, cls, content);
  this.children = [];
  this.elderSiblings = [];
  this.youngerSiblings = [];
  this.style = this.div.style;
};

/**
 * Adds a Drawable child to this {@link KIP.Objects.Drawable} object
 * @param {Drawable} child - The child to add to this Drawable
 * @param {HTMLElement} [parent] - If this child should be added to a different div, allow that
 * @version 1.1
 */
KIP.Objects.Drawable.prototype.AppendChild = function (child, parent, position) {
  "use strict";

  if (!this.children) {
    this.children = [];
  }

  if (!position && (position !== 0)) {
    position = this.children.length;
  }

	// Set the appropriate parent
	parent = parent || this.div;

	// Save the data into our array
  this.children.splice(position, 0, {child: child, parent: parent});
	
};

// Drawable.AddSibling
//-----------------------------------------------------------------------
/**
 * Adds a sibling to this main drawable node.
 * @param {variant} sibling - Either HTMLElement or Drawable to be drawn as a sibling
 * @param {boolean} before - True if this sibling should appear before the main div
 */
KIP.Objects.Drawable.prototype.AddSibling = function (sibling, before) {
  "use strict";

  if (before) {
    this.elderSiblings.push(sibling);
  } else {
    this.youngerSiblings.push(sibling);
  }
}

KIP.Objects.Drawable.prototype.RemoveSibling = function (sibling) {
  "use strict";

  // Quit if the child is nothing
  if (!sibling) return false;

  // Quit if we do not have any sibling collections
  if (!this.elderSiblings || !this.youngerSiblings) {
    return false;
  }

  if (!this.RemoveElem(sibling, this.elderSiblings)) {
    if (this.RemoveElem(sibling, this.youngerSiblings)) {
      return sibling;
    }
  }

  return false;

};

KIP.Objects.Drawable.prototype.RemoveElementByIdx = function (idx, arr) {
  "use strict";
  var elem;
  // Return false if the index is out of bound
	if ((idx < 0) || (idx > arr.length)) {
		return false;
	}

	elem = arr[idx];
	arr.splice(idx, 1);

  // Remove the child from its parent if it's a regular div
  if (elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }

	// Otherwise, call the erase function
	if (elem.Draw) {
		elem.Erase();
	}
};

KIP.Objects.Drawable.prototype.RemoveElem = function (element, arr) {
  "use strict";
  var idx;

  // Remove the child from our children array
  for (idx = 0; idx < arr.length; idx += 1) {
    if (arr[idx] === element) {
      if (this.RemoveElementdByIdx(idx)) {
				return element;
			}
		}
	}
};

/**
 * Removes a given child from a Drawable
 * @param {Drawable} child - The child to remove from our array and our parent
 * @returns {boolean} True if the child was successfully removed, false otherwise
 */
KIP.Objects.Drawable.prototype.RemoveChild = function (child) {
  "use strict";

  var idx;

	// Quit if child is nothing
	if (!child) return false;

  // Return false if we don't have any children to remove
  if (!this.children) {
    return false;
  }

  // Remove the item if it exists
  if (this.RemoveElem(child, this.children)) {
    return child;
  }

	// If we got this far, we must have failed to find anything
	return false;
};

/**
 * Removes a child by its index from a Drawable
 * @param {number} idx - The index to remove from our array
 * @param {boolean}
 */
KIP.Objects.Drawable.prototype.RemoveChildByIdx = function (idx) {
	"use strict";
	return this.RemoveElementByIdx(idx, this.children);
}

/**
 * Removes a sibling by its index from a Drawable
 * @param {number} idx - The index to remove from our array
 * @param {boolean}
 */
KIP.Objects.Drawable.prototype.RemoveSiblingByIdx = function (idx, before) {
	"use strict";
  if (before) {
    return this.RemoveElementByIdx(idx, this.elderSiblings);
  } else {
    return this.RemoveElementByIdx(idx, this.youngerSiblings);
  }

}

/**
 * Draws the elements for this {@link KIP.Objects.Drawable}
 * @param {HTMLElement} parent - The element to add the library div to
 * @param {boolean} [noErase] - True if the elements shouldn't be erased before drawing
 * @version 1.1
 */
KIP.Objects.Drawable.prototype.Draw = function (parent, noErase, iBefore) {
  "use strict";
  var i, elem, sibling,  that = this;

  // Quit if something went wrong and there is no longer a div element
  if (!this.div) return;

  // Set our current parent equal to the new thing passed in
  this.parent = parent || this.parent;

  // Call the refresh function, if it's something that we'd need to do
  this.Refresh();

  // Handle pre-siblings
  if (this.elderSiblings && this.elderSiblings.length > 0) {
    for (i = 0; i < this.elderSiblings.length; i += 1) {
      sibling = this.elderSiblings[i];

      if (sibling.parentNode && !noErase) {
        sibling.parentNode.removeChild(sibling);
      }

      this.parent.appendChild(sibling);
    }
  }

  // Remove the div that exists, if it does
  if (this.div.parentNode && !noErase) {
		
		if (!iBefore) {
			iBefore = this.div.nextSibling;
		}
		
    this.div.parentNode.removeChild(this.div);
  }

  // Redraw the div onto the new parent
  if (iBefore) {
    this.parent.insertBefore(this.div, iBefore);
  } else {
		
    this.parent.appendChild(this.div);
  }

    // Handle post-siblings
  if (this.youngerSiblings && this.youngerSiblings.length > 0) {
    for (i = 0; i < this.youngerSiblings.length; i += 1) {
      sibling = this.youngerSiblings[i];

      if (sibling.parentNode && !noErase) {
        sibling.parentNode.removeChild(sibling);
      }

      this.parent.appendChild(sibling);
    }
  }

  // Call the shell function in case a child has overridden it
  this.BeforeDrawChildren();

  // If we have any children, loop through them too
  if (!this.children) return;
  for (i = 0; i < this.children.length; i += 1) {
		elem = this.children[i];
    if (elem.child) {

			// Draw it if it's a Drawable
			if (elem.child.Draw) {
      	elem.child.Draw(elem.parent);

			// Otherwise, just add to the parent
    	} else {
				if (elem.parentNode && !noErase) {
					elem.parentNode.removeChild(elem);
				}
				elem.parent.appendChild(elem.child);
			}
		}
	}

  // Call the shell function in case a child has overridden it
  this.AfterDrawChildren();
};

KIP.Objects.Drawable.prototype.Erase = function () {
	if (this.div.parentNode) {
		this.div.parentNode.removeChild(this.div);
	}
};

/**
 * Basic function for refreshing the elements of the Drawable. If not needed, this will do nothing.
 */
KIP.Objects.Drawable.prototype.Refresh = function () {

};

/**
 * Overridable function that will be run before the Draw function adds children drawables to the div.
 */
KIP.Objects.Drawable.prototype.BeforeDrawChildren = function () {

};


/**
 * Overridable function that will be run after the Draw function adds children drawables to the div.
 */
KIP.Objects.Drawable.prototype.AfterDrawChildren = function () {

};
