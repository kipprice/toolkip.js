/*globals KIP,window*/

/*********************************************************************
 * Creates a drawable that can hover over its parent in a particular location
 * 
 * @param {string} id      The ID to give the hover element
 * @param {string} cls     The class to assign the element, in addition to the standard "hoverable" class
 * @param {string} content What to display within the element
 * @param {HTMLElement} parent  {optional} The parent to add this to
 * @param {OffsetEnum} offset  Where to position the hover element relative to the parent
 *********************************************************************/

// Setup an offset enum
KIP.Globals.HoverOffsetEnum = {
	"Top" : 1,
	"Bottom" : 2,
	"Left" : 4,
	"Right" : 8,
	"Top-Left" : 5,
	"Top-Right" : 9,
	"Bottom-Left" : 6,
	"Bottom-Right" : 10,
	"Custom": 0
};

KIP.Objects.Hoverable = function (id, cls, content, parent, offset) {
	"use strict";
	this.id = id;
	this.cls = "hoverable " + cls;
	this.content = content;
	this.parent = parent;
	this.offset = offset || this.OffsetEnum.Top;

	// Initialize the element to be disabled
	this.enabled = false;

	// Create the div using the drawable constructor
	KIP.Objects.Drawable.call(this, this.id, this.cls, this.content);

	// Apply the styles that actually matter
	this.div.style.position = "absolute";
	this.SetupParent();
};

// Implement the Drawable prototype
KIP.Objects.Hoverable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/*****************************************************************
 * Sets whether this hoverable should be drawn on its draw event
 * 
 * @param {bool} enabled - True if we should complete the draw event when it is called
 *****************************************************************/
KIP.Objects.Hoverable.prototype.SetEnabled = function (enabled) {
	this.enabled = enabled;
}

/**********************************************************
 * Overrides the Drawable draw to make some position adjustments	
 * 
 * @param {HTMLElement} parent If not already set, the parent to add this hoverable to
 **********************************************************/
KIP.Objects.Hoverable.prototype.Draw = function (parent) {

	// Setup the parent if we need it
	this.parent = parent || this.parent;
	if (!this.parent) return;

	// Quit if we aren't enabled
	if (!this.enabled) return;

	// Do our initial setup
	this.SetupParent();
	this.MoveChild();

	// Actually draw
	KIP.Objects.Drawable.prototype.Draw.call(this, this.parent);

	// Tweak everything so it fits
	this.AdjustChild();
};

/***********************************************************
 * Guarantee that the parent's class will allow the hover element to be placed relatively
 ***********************************************************/
KIP.Objects.Hoverable.prototype.SetupParent = function () {

	// Quit if there isn't a parent yet
	if (!this.parent) return;

	// Make sure the parent always has a strictly coded position
	this.parent.style.position = KIP.Functions.GetComputedStyle(this.parent, "position");
	if (this.parent.style.position === "static") {
		this.parent.style.position = "relative";
	}
};

/*********************************************************
 * Move the child hoverable roughly to where it needs to be
 * Fine-tuning will happen after drawing
 *********************************************************/
KIP.Objects.Hoverable.prototype.MoveChild = function () {
	"use strict";
	var w, h, off_x, off_y;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	// Calculate where the parent is right now
	w = this.parent.offsetWidth;
	h = this.parent.offsetHeight;

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y = (-1 * h);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Bottom) {
		off_y = h;
	} else {
		off_y = 0;
	}

	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x = (-1 * w);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Right) {
		off_x = w;
	} else {
		off_x = 0;
	}

	this.div.style.left = (off_x + "px");
	this.div.style.top = (off_y + "px");
};

/***********************************************************
 * Adjusts the hover element so it is in the proper location and on screen
 ***********************************************************/
KIP.Objects.Hoverable.prototype.AdjustChild = function () {
	"use strict";
	var w, h, off_x, off_y;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	w = this.div.offsetWidth;
	h = this.div.offsetHeight;
	off_x = this.div.offsetLeft;
	off_y = this.div.offsetTop;

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y = (-1 * h);
	}

	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x = (-1 * w);
	}

	// Check to make sure that this is on the screen
	// ----------------------------------------------
	// >> Offscreen left : move to the right side >>
	if (off_x < 0) {
		off_x = this.parent.offsetWidth;
	}

	// >> Offscreen right : move to the left side >>
	if (off_x > window.innerWidth) {
		off_x = (-1 * w);
	}

	// >> Offscreen bottom, or offscreen left still : move to the top >>
	if ((off_y > window.innerHeight) || (off_x < 0)) {
		off_y = (-1 * h);
		off_x = 0;
	}

	// >> Offscreen top : move to the bottom >>
	if (off_y < 0) {
		off_y = this.parent.offsetHeight;
	}
	
	this.div.style.left = (off_x + "px");
	this.div.style.top = (off_y + "px");
};
