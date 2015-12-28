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
  this.div = KIP.Functions.CreateSimpleElement(id, cls, content);
  this.children = [];
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

  // Only allow the child to be added if it is also a drawable
  if (!child.Draw) return;

  this.children.splice(position, 0, child);

  // Set the parent pre-emptively here
  this.children[position].parent = parent || this.div;
};

/**
 * Removes a given child from a Drawable
 * @param {Drawable} child - The child to remove from our array and our parent
 * @returns {boolean} True if the child was successfully removed, false otherwise
 */
KIP.Objects.Drawable.prototype.RemoveChild = function (child) {
  "use strict";

  var idx;

  // Return false if we don't have any children to remove
  if (!this.children) {
    return false;
  }

  // Remove the child from our children array
  for (idx = 0; idx < this.children.length; idx += 1) {
    if (this.children[idx] === child) {
      this.children.splice(idx, 1);
    }
  }

  // Remove the child from its parent too
  if (child.parentNode) {
    child.parentNode.removeChild(child);
  }

  return true;
};

/**
 * Draws the elements for this {@link KIP.Objects.Drawable}
 * @param {HTMLElement} parent - The element to add the library div to
 * @param {boolean} [noErase] - True if the elements shouldn't be erased before drawing
 * @version 1.1
 */
KIP.Objects.Drawable.prototype.Draw = function (parent, noErase) {
  "use strict";
  var that = this;

  // Quit if something went wrong and there is no longer a div element
  if (!this.div) return;

  // Set our current parent equal to the new thing passed in
  this.parent = parent || this.parent;

  // Call the refresh function, if it's something that we'd need to do
  this.Refresh();

  // Remove the div that exists, if it does
  if (this.div.parentNode && !noErase) {
    this.div.parentNode.removeChild(this.div);
  }

  // Redraw the div onto the new parent
  this.parent.appendChild(this.div);

  // Call the shell function in case a child has overridden it
  this.BeforeDrawChildren();

  // If we have any children, loop through them too
  if (!this.children) return;
  this.children.map(function (elem, idx, arr) {
    if (elem) {
      elem.Draw();
    }
  });

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
