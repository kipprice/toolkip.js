/*globals KIP,window*/

/**
 * @file Declaration of the Hoverable class
 * @author	Kip Price
 * @version 1.2
 * @since 0.8
 */

/**
 * @enum Enum of positions that the Hoverable could take
 * @readonly
 * @enum {number}
 */
KIP.Globals.HoverOffsetEnum = {
	"Top" : 1,
	"TopRightAlign": 17,
	"Bottom" : 2,
	"BottomRightAlign" : 18,
	"Left" : 4,
	"LeftBottomAlign" : 36,
	"Right" : 8,
	"RightAlign" : 16,
	"BottomAlign" : 32,
	"RightBottomAlign" : 40,
	"Top-Left" : 5,
	"Top-Right" : 9,
	"Bottom-Left" : 6,
	"Bottom-Right" : 10,
	"Custom": 0
};

/**
 * Creates a drawable that can hover over its parent in a particular location
 * @class
 *
 * @param {String} id - The ID to give the hover element
 * @param {String} cls - The class to assign the element, in addition to the standard "hoverable" class
 * @param {String} content - What to display within the element
 * @param {HTMLElement} [ref] - The reference element to base the position off of
 * @param {OffsetEnum} [offset=Top] - Where to position the hover element relative to the reference
 * @param {Boolean} [isSVG=False] - If the reference element is an SVG, set this to true
 * @param {Object} [adjust] - An optional parameter that will slightly adjust the calculated placement of the Hoverable
 * @param {Number} [adjust.x] - The additional x value to add to the offset of the Hoverable
 * @param {Number} [adjust.y] - The additional y value to add to the offset of the Hoverable
 */
KIP.Objects.Hoverable = function (id, cls, content, ref, offset, isSVG, adjust) {
	"use strict";
	this.id = id;
	this.cls = "hoverable " + cls;
	this.content = content;
	this.reference = ref;
	this.offset = offset || KIP.Globals.HoverOffsetEnum.Top;
	this.isSVG = isSVG;

	this.adjust = adjust || {x: 0, y: 0};

	// Initialize the element to be disabled
	this.enabled = false;

	// Create the div using the drawable constructor
	KIP.Objects.Drawable.call(this, this.id, this.cls, this.content);

	// Apply the styles that actually matter
	this.div.style.position = "absolute";
};

// Implement the Drawable prototype
KIP.Objects.Hoverable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/**
 * Sets whether this hoverable should be drawn on its draw event
 *
 * @param {Boolean} enabled - True if we should complete the draw event when it is called
 */
KIP.Objects.Hoverable.prototype.SetEnabled = function (enabled) {
	this.enabled = enabled;
};

/**
 * Overrides the Drawable draw to make some position adjustments
 *
 * @param {HTMLElement} parent - The parent to add this hoverable to
 */
KIP.Objects.Hoverable.prototype.Draw = function (parent) {
	var that = this;
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
	this.nudged = true;

	// Make sure we nudge back on screen as we need
	window.setTimeout(function() {
		if (!that.nudged) {
			that.NudgeOnscreen();
			that.nudged = true;
		}
	}, 0);
};

/**
 * Guarantee that the parent's class will allow the hover element to be placed relatively
 */
KIP.Objects.Hoverable.prototype.SetupParent = function () {

	// Quit if there isn't a parent yet
	if (!this.parent) return;

	// Make sure the parent always has a strictly coded position
	this.parent.style.position = KIP.Functions.GetComputedStyle(this.parent, "position");
	if (this.parent.style.position === "static") {
		this.parent.style.position = "relative";
	}
};

/**
 * Move the child hoverable roughly to where it needs to be.
 * Fine-tuning will happen after drawing
 */
KIP.Objects.Hoverable.prototype.MoveChild = function () {
	"use strict";
	var w, h, off_x, off_y, box;

	off_x = 0;
	off_y = 0;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	if (!this.reference) this.reference = this.parent;

	// Calculate where the reference is right now
	if (!this.isSVG) {
		w = this.reference.offsetWidth;
		h = this.reference.offsetHeight;
	} else {
		box = this.reference.getBoundingClientRect();
		off_x = box.left;
		w = box.right - box.left;
		//off_y = box.top;
		h = box.bottom - box.top;
	}

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y += (-1 * h);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Bottom) {
		off_y += h;
	} else {
		off_y += 0;
	}

	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x += (-1 * w);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Right) {
		off_x += w;
	} else {
		off_x += 0;
	}

	this.div.style.left = (off_x + "px");
	this.div.style.top = (off_y + "px");
};

/**
 * Adjusts the hover element so it is in the proper location and on screen
 */
KIP.Objects.Hoverable.prototype.AdjustChild = function () {
	"use strict";
	var w, h, off_x, off_y, g_off_x, g_off_y, pw, ph;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	w = this.div.offsetWidth;
	h = this.div.offsetHeight;
	off_x = this.div.offsetLeft;
	off_y = this.div.offsetTop;
	g_off_x = KIP.Functions.GlobalOffsetLeft(this.div);
	g_off_y = KIP.Functions.GlobalOffsetTop(this.div);
	pw = this.parent.offsetWidth;
	ph = this.parent.offsetHeight;

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y = (-1 * h);
	}
	
	// If we are right aligning something, we will need to adjust our x value by our width
	if (this.offset & KIP.Globals.HoverOffsetEnum.RightAlign) {
		off_x = (pw - w);
	}

	// If we are putting something on the left side, put it there properly
	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x = (-1 * w);
	}
	
	// If we are bottom-aligning something, we will need to adjust our y offset
	if (this.offset & KIP.Globals.HoverOffsetEnum.BottomAlign) {
		off_y = (ph - h);
	}

	// Check to make sure that this is on the screen
	// ----------------------------------------------
	// >> Offscreen left : move to the right side >>
	if ((g_off_x + w) < 0) {
		off_x = this.reference.offsetWidth;
	}

	// >> Offscreen right : move to the left side >>
	if (g_off_x > window.innerWidth) {
		off_x = (-1 * w);
	}

	// >> Offscreen bottom, or offscreen left still : move to the top >>
	if ((g_off_y  > window.innerHeight) || (g_off_x < 0)) {
		off_y = (-1 * h);
		off_x = 0;
	}

	// >> Offscreen top : move to the bottom >>
	if ((g_off_y + h) < 0) {
		off_y = this.reference.offsetHeight;
	}
	
	KIP.Functions.MoveRelToElem(this.div, this.reference, off_x + (this.adjust.x || 0), off_y + (this.adjust.y || 0));
	
};

/**
 * Scoots the element so that all of it is onscreen 
 */
KIP.Objects.Hoverable.prototype.NudgeOnscreen = function () {
	var w, h, off_x, off_y, g_off_x, g_off_y;
	
	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;
	
	w = this.div.offsetWidth;
	h = this.div.offsetHeight;
	
	off_x = this.div.offsetLeft;
	off_y = this.div.offsetTop;
	
	g_off_x = KIP.Functions.GlobalOffsetLeft(this.div);
	g_off_y = KIP.Functions.GlobalOffsetTop(this.div);
	
	//-----------------------------------------------------
	// If we need to nudge anything back on screen, do so
	if (!(this.offset & KIP.Globals.HoverOffsetEnum.Left) && !(this.offset & KIP.Globals.HoverOffsetEnum.Right)){
		if (g_off_x < 0) {
			off_x += (-1 * g_off_x);
		}

		// >> Offscreen right : nudge left >>
		if ((g_off_x + w) > window.innerWidth) {
			off_x -= ((g_off_x + w) - window.innerWidth);
		}
	}

	if (!(this.offset & KIP.Globals.HoverOffsetEnum.Top) && !(this.offset & KIP.Globals.HoverOffsetEnum.Bottom)){
		// >> Offscreen bottom, or offscreen left still : nudge up >>
		if ((g_off_y + h) > window.innerHeight) {
			off_y -= ((g_off_y + h) - window.innerHeight);
		}

		// >> Offscreen top : nudge down >>
		if (g_off_y  < 0) {
			off_y += (-1 * g_off_y);
		}
	}
	
		
	KIP.Functions.MoveRelToElem(this.div, this.reference, off_x, off_y);
};
