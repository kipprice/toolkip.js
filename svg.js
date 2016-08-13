/*globals KIP,document*/

/**
 * @file Declaration of the SVGDrawable object
 * @author Kip Price
 * @version 0.5
 * @since 1.2
 */

// SVGDrawable
//--------------------------------------------------------
/**
 * @class SVGDrawable
 * Creates an SVG image that can have various elements added to it
 * @param {String} id - The unique identifier to apply to this SVG image
 */
KIP.Objects.SVGDrawable = function (id, preventEvents, options) {
	"use strict";
	this.div = KIP.Functions.CreateSVG(id, "", "", "", "", options && options.aspect);
	this.elements = [];
	this.elementsByID = [];

	// Track how much of the SVG should be viewed at a time
	this.min_x = 1000000;
	this.min_y = 1000000;
	this.max_x = 0;
	this.max_y = 0;

	// Allow the viewport to be adjusted
	this.viewX = 0;
	this.viewY = 0;
	this.viewW = 0;
	this.viewH = 0;

	this.gutter = 1;
	this.cur_ID = 0;

	this.lineProperty = {};
	this.fillProperty = {};
	this.fontProperty = {};

	this.autoResize = true;
	this.zoomAmt = 0.08;

	if (preventEvents) return;
	this.div.style.cursor = "-webkit-grab";
	var that = this;
	
	// Handle event options (long term this should handle all options)
	this.options = options || {};
	if (this.options.zoomX === undefined) this.options.zoomX = !preventEvents;
	if (this.options.zoomY === undefined) this.options.zoomY = !preventEvents;
	if (this.options.panX === undefined) this.options.panX = !preventEvents;
	if (this.options.panY === undefined) this.options.panY = !preventEvents;

	// Handle the scroll wheel event for the SVG
	this.div.addEventListener("wheel", function (e) {
		var delta = e.deltaY;
		delta = (delta > 0) ? that.zoomAmt : -1 * that.zoomAmt;
		that.Zoom(delta);
	});

	// Add some panning controls
	this.div.addEventListener("mousedown", function (e) {
		that.isPanning = true;
		that.panX = e.clientX;
		that.panY = e.clientY;
		that.div.style.cursor = "-webkit-grabbing";
	});

	window.addEventListener("mousemove", function (e) {
		var dX, dY;
		if (!that.isPanning) return;

		// Make sure to cancel the event if we are beyond the windows bounds
		if ((e.x <= 0) || (e.x >= (window.innerWidth - 1))) {
			that.isPanning = false;
			that.div.style.cursor = "-webkit-grab";
			return;
		}

		if ((e.y<= 0) || (e.y >= (window.innerHeight - 1))) {
			that.isPanning = false;
			that.div.style.cursor = "-webkit-grab";
			return;
		}

		// Grab the delta of the mouse move
		dX = e.clientX - that.panX;
		dY = e.clientY - that.panY;
		that.div.style.cursor = "-webkit-grabbing";

		// Reset the pan variables
		that.panX = e.clientX;
		that.panY = e.clientY;

		dX = ((1 + (-1 * that.viewW * dX)) / that.w);
		dY = ((2 + (-1 * that.viewH * dY)) / that.h);

		// Actually move the svg
		that.Pan(dX, dY);
	});

	window.addEventListener("mouseup", function (e) {
		that.isPanning = false;
		that.div.style.cursor = "-webkit-grab";
	});
};

// We inherit from Drawables
KIP.Objects.SVGDrawable.prototype = Object.create(KIP.Objects.Drawable.prototype);

// SVGDrawable.CalculateView
//---------------------------------------------------------------
/**
 * Calculates what the view box should be to encompass all of the elements currently in the SVG drawing
 */
KIP.Objects.SVGDrawable.prototype.CalculateView = function (setHTML) {
	"use strict";

	// Set the appropriate view variables
	this.viewX = this.min_x;
	this.viewY = this.min_y;
	this.viewW = (this.max_x - this.min_x);
	this.viewH = (this.max_y - this.min_y);

	return this.CreateView(setHTML);
};

// SVGDrawable.CreateView
//---------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.CreateView = function (setHTML) {
	"use strict";
	var out;
	this.viewW = (this.viewW < 0) ? 1 : this.viewW;
	this.viewH = (this.viewH < 0) ? 1 : this.viewH;
	out = this.viewX + " " + this.viewY + " " + this.viewW + " " + this.viewH;
	
	if (setHTML) this.div.setAttribute("viewBox", out);
	
	return out;
};

// SVGDrawable.AddRectangle
//-----------------------------------------------------------------------------------
/**
 * Adds a rectangle to the current SVG drawing
 *
 * @param {Number} x - The x value of the upper left corner of the rectangle
 * @param {Number} y - The y value of the upper left corner of the rectangle
 * @param {Number} w - The width of the rectangle
 * @param {Number} h - The height of the rectangle
 * @param {Object} style - An array defining how to style this rectangle
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {String} [id] - An ID to associate with the rectangle
 * @param {String} [cls] - A CSS class to assign the rectangle
 * @param {SVGElement} [group] - The SVG group to add this to
 *
 * @returns {SVGElement} The rectangle that is created from these parameters
 */
KIP.Objects.SVGDrawable.prototype.AddRectangle = function (x, y, w, h, attr, grp) {
	"use strict";
	
	// Check that all of the values are real
	if (!x && x !== 0) return;
	if (!y && y !== 0) return;
	if ((w < 0) || (!w && w !== 0)) return;
	if ((h < 0) || (!h && h !== 0)) return;
	
	// Update the view
	if (this.autoResize) this.UpdateView(x, y, w, h);

	// Set the appropriate attributes
	if (!attr) attr = {};
	attr.x = x;
	attr.y = y;
	attr.height = h;
	attr.width = w;

	return this.AddChild("rect", attr, grp);
};

// SVGDrawable.UpdateView
//-----------------------------------------------------------------------
/**
 * Updates the min and max specs of the view.
 * Called whenever an element is added to the svg drawing
 *
 * @param {Number} x The x position of the new element
 * @param {Number} y The y position of the new element
 * @param {Number} w The width of the new element
 * @param {Number} h The height of the new element
 */
KIP.Objects.SVGDrawable.prototype.UpdateView = function (x, y, w, h) {

	// Update the min and max x if appropriate
	if (x < this.min_x) this.min_x = (x - this.gutter);
	if ((x + w) > this.max_x) this.max_x = (x + w + this.gutter);

	// Update the min and max y if appropriate
	if (y < this.min_y) this.min_y = (y - this.gutter);
	if ((y + h) > this.max_y) this.max_y = (y + h + this.gutter);

	this.view = this.CalculateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.AddPath
//--------------------------------------------------------------------------
// TODO: Add all elements that SVG support
KIP.Objects.SVGDrawable.prototype.AddPath = function (points, attr, grp) {
	"use strict";
	var pt, pIdx, elem;

	if (points.length === 0) return;

	if (!attr) attr = {};
	attr.d = "";

	elem = this.AddChild("path", attr, grp);

	// Loop through the points and assign the appropriate d attribute
	for (pIdx = 0; pIdx < points.length; pIdx += 1) {
		pt = points[pIdx];

		// The first point needs to be a "Move to" instead of a "line to"
		if (pIdx === 0) {
			this.MoveTo(pt.x, pt.y, elem);

		// If we have control points, it should be a curve
		} else if (pt.controls) {
			this.CurveTo(pt.controls[0], pt.controls[1], {x: pt.x, y: pt.y}, elem);

		// Also handle the perfect arc case
		} else if (pt.radius) {
			this.ArcTo(pt.radius, pt.xRotation, pt.largeArc, pt.sweepFlag, {x: pt.x, y: pt.y}, elem);

		// Otherwise, just draw a straight line
		} else {
			this.LineTo(pt.x, pt.y, elem);
		}

		// Update the view for each point
		if (this.autoResize) this.UpdateView(pt.x, pt.y, 0, 0);
	}

	if (!attr.noFinish) this.FinishPath(elem);

	return elem;
};

// SVGDrawable.MoveTo
//-----------------------------------------------------------------------
/**
 * Moves the path cursor to the specified point
 *
 * @param {number} x - The x coordinate to move to
 * @param {number} y - The y coordinate to move to
 * @param {SVGElement} element - The element we are setting the path for
 *
 * @returns {SVGElement} The element, with the d attribute modified
 */
KIP.Objects.SVGDrawable.prototype.MoveTo = function (x, y, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "M" + x + " " + y + "\n";
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.LineTo
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.LineTo = function (x, y, element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += "L " + x + " " + y + "\n";
	element.setAttribute("d", d);
	return element;
};

// SVGDrawavle.CurveTo
//--------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.CurveTo = function (controlOne, controlTwo, endPoint, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "C " + controlOne.x + " " + controlOne.y + ", ";
	d += controlTwo.x + " " + controlTwo.y + ", ";
	d += endPoint.x + " " + endPoint.y + "\n";
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.ArcTo
//-----------------------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.ArcTo = function (radius, xRotation, largeArc, sweepFlag, endPoint, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "A " + radius.x + " " + radius.y;
	d += " " + xRotation + " " + largeArc + " " + sweepFlag;
	d += " " + KIP.Functions.RoundToPlace(endPoint.x, 1000) + " " + KIP.Functions.RoundToPlace(endPoint.y, 1000) + "\n" ;
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.FinishPath
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.FinishPath = function (element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += " Z";
	element.setAttribute("d", d);
	return element;
};

// SVGDrawable.AddRegularPolygon
//-------------------------------------------------------------------------------------------------------------
/**
 * Creates an SVG regular polygon
 * @param {number} centerX - The central x position of the polygon
 * @param {number} centerY - The central y position of the polygon
 * @param {number} sides - The number of sides the polygon should have
 * @param {number} radius - How far a radial arm of the polygon should extend
 * @param {object} [attr] - Any additional attributes that should be applied to the SVG element
 * @param {object} [grp] - The group this element should belong to
 */
KIP.Objects.SVGDrawable.prototype.AddRegularPolygon = function (centerX, centerY, sides, radius, attr, grp) {
	"use strict";
	var intAngle, p, points, idx, x, y, curAngle;
	if (this.autoResize) this.UpdateView(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	intAngle = KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360 / sides), 1000);

	if (!attr) attr = {};
	attr.points = "";

	p = this.AddChild("polygon", attr, grp);

	points = "";
	curAngle = 0;
	for (idx = 0; idx < sides; idx += 1) {

		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * radius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * radius, 10);
		curAngle += intAngle;
		points += x + "," + y + " ";
	}

	p.setAttribute("points", points);
	
	return p;
};

// SVGDrawable.RegularStar
//---------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.AddRegularStar = function (centerX, centerY, sides, radius, innerRadius, attr, grp) {
	"use strict";
	var intAngle, p, points, idx, x, y, curAngle;
	
	curAngle = 0;
	points = "";
	
	if (this.autoResize) this.UpdateView(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	
	intAngle = KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360 / sides), 1000);
	
	if (!attr) attr = {};
	attr.points = "";
	
	p = this.AddChild("polygon", attr, grp);
	
	// Loop through all of the points of the star
	for (idx = 0; idx < sides; idx += 1) {
    
		// Outer point
		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * radius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * radius, 10);
		curAngle += (intAngle / 2);
		points += x + ", " + y + " ";
		
		// Inner point
		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * innerRadius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * innerRadius, 10);
		curAngle += (intAngle / 2);
		points += x + ", " + y + " ";
		
  }
	
	p.setAttribute("points", points);
	
	return p;
};

// SVGDrawable.AddCircle
//-------------------------------------------------------------------------------------
/**
 * Adds a circle to the current SVG drawing
 *
 * @param {Number} x - The x for the center of the circle
 * @param {Number} y - The y value for the center of the circle
 * @param {Number} radius - The radius for the circle
 * @param {String} [attr] - Any attributes that should be applied directly to the element
 * @param {SVGElement} [group] - The SVG group to add this element to
 *
 * @returns {SVGElement} The element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddCircle = function (x, y, radius, attr, grp) {
	"use strict";
	if (this.autoResize) this.UpdateView(x - radius, y - radius, 2 * radius, 2 * radius);

	// Set the appropriate attributes
	if (!attr) attr = {};
	attr.cx = x;
	attr.cy = y;
	attr.r = radius;

	// Add the child
	return this.AddChild("circle", attr, grp);
};

// SVGDrawable.AddPerfectArc
//-----------------------------------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.AddPerfectArc = function (center, radius, startDeg, endDeg, direction, noRadii, attr, grp) {
	var elem, end, start, aDiff, padding, adjust, angle;

	padding = parseInt(this.fillProperty.width, 10) || 1;
	
	if (this.autoResize) this.UpdateView(center.x - radius - padding, center.y - radius - padding, 2 * (radius + padding), 2 * (radius + padding));
	start = {};
	end = {};

	aDiff = endDeg - startDeg;

	start.x = Math.sin(KIP.Functions.DegreesToRadians(startDeg)) * radius + center.x;
	start.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(startDeg)) * radius) + center.y;

	end.x = Math.sin(KIP.Functions.DegreesToRadians(endDeg)) * radius + center.x;
	end.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(endDeg)) * radius) + center.y;

	adjust = parseInt(this.fillProperty.width, 10) * Math.sqrt(2) || 0; // Hypotenuse
	angle = KIP.Functions.DegreesToRadians(aDiff + startDeg); // Appropriate angle

	if (!attr) attr = {};
	attr.d = "";
	elem = this.AddChild("path", attr, grp);

	start.y += (-1 * Math.cos(angle) * adjust);
	start.x += (Math.sin(angle) * adjust);

	end.y += (-1 * Math.cos(angle) * adjust);
	end.x += (Math.sin(angle) * adjust);

	center.y += (-1 * Math.cos(angle) * adjust);
	center.x += (Math.sin(angle) * adjust);


	this.MoveTo(start.x, start.y, elem);
	this.ArcTo({x: radius, y: radius}, 0, (aDiff > 180)? 1 : 0, direction, {x: end.x, y: end.y}, elem);

	if (noRadii) return elem;

	this.LineTo(center.x, center.y, elem);
	this.FinishPath(elem);

	return elem;
};

// SVGDrawable.AddChild
//--------------------------------------------------------------------------
/**
 * Don't call this function directly; use one of the more targeted drawing functions
 * Adds a child element to the current SVG drawing
 * @private
 * @param {String} type  The type of child element we are drawing
 * @param {Object} attr  	 The attributes that should be applied to this child
 */
KIP.Objects.SVGDrawable.prototype.AddChild = function (type, attr, group) {
	"use strict";

	// We can't do anything without a type
	if (!type) return;

	if (!attr.id) {
		attr.id = this.cur_ID;
		this.cur_ID += 1;
	}

	var elem = KIP.Functions.CreateSVGElem(type, attr);
	if (type !== "g") this.AssignStyle(elem);

	this.elements[this.elements.length] = elem;
	this.elementsByID[attr.id] = elem;

	if (group) {
		group.appendChild(elem);
	} else {
		this.div.appendChild(elem);
	}

	return elem;
};

// SVGDrawable.AddText
//----------------------------------------------------------------------------------------------
/**
 * Adds text on top of a provided element
 *
 * @param {SVGElement} elem - The element to add text on top of.
 * @param {String} text  - The text to add
 * @param {Number} [x] - The x-offset from the target element's position
 * @param {Number} [y] - The y-offset from the target element's position
 * @param {Object} [attr] - All attributes that should be applied to the element, in key value pairs
 * @param {Object} [origin] - The point that should be considered the origin of the text, as values from 0 -1
 * @param {SVGElement} [group] - The group that this text should be added to
 *
 * @return {SVGElement} The text element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddText = function (elem, text, x, y, attr, origin, group, flowRect) {
	var txt, tSpan, cx, cy, e_x, e_y, box, oX, oY, flowRoot, flowRegion, flowElem, flowPara;
	
	// Default the x/y values
	x = x || 0;
	y = y || 0;

	// Measure the source element
	if (elem) {
		box = this.MeasureElem(elem);
		x += box.x;
		y += box.y;
	}

	if (!attr) attr = {};
	attr.x = x;
	attr.y = y;

	if (!flowRect) {
		txt = KIP.Functions.CreateSVGElem("text", attr);
		txt.innerHTML = text;
	} else {
		flowPara = KIP.Functions.CreateSVGElem("flowPara");
		flowPara.innerHTML = text;
		
		// Create the rectangle that sets dimensions
		flowRect.x = attr.x;
		flowRect.y = attr.y;
		flowRegion = KIP.Functions.CreateSVGElem("flowRegion");
		flowElem = KIP.Functions.CreateSVGElem("rect", flowRect);
		flowRegion.appendChild(flowElem);
		
		
		// Create the wrapping flow element
		txt = KIP.Functions.CreateSVGElem("flowRoot", {id: attr.id});
		txt.appendChild(flowRegion);
		txt.appendChild(flowPara);
	}
	
	this.AssignStyle(txt);

	// Get the measurements for the 
	if (!flowRect && (this.autoResize || origin)) {
		box = this.MeasureElem(txt);
	} else {
		box = this.MeasureElem(flowPara);
	}

	// X and Y are where the origin point should be positioned
	// We'll have to calculate where to actually draw the text, given that the origin may be different spots
	// Originally, the origin point is in the bottom left corner
	if (origin) {
		oX = origin.x * box.width;
		oY = origin.y * box.height;

		x -= (oX - 0);
		y -= (oY - box.height);

		txt.setAttribute("x", x);
		txt.setAttribute("y", y);
		box = this.MeasureElem(txt);
	}

	if (this.autoResize) this.UpdateView(box.x, box.y, box.width, box.height);

	
	if (!group) {
		this.div.appendChild(txt);
	} else {
		group.appendChild(txt);
	}

	KIP.Functions.AddCSSClass(txt, "unselectable");

	return txt;
};

// SVGDrawable.MeasureElem
//-----------------------------------------------------------------------
/**
 * Calculates the dimensions of a provided element
 * @param {SVGElement} elem - The element we are meausuring
 */
KIP.Objects.SVGDrawable.prototype.MeasureElem = function (elem) {
	"use strict";
	var p, box, childP;
	
	if (!elem) return;
	
	// Try to grab the measurement before we try to do some parent swapping
	if (this.div.parentNode) {
		box = elem.getBBox();
	}
	if (box && (box.x || box.y || box.height || box.width)) return box;

	p = this.parent;
	childP = elem.parentNode;

	// Temporarily add the element to get its size
	if (p !== document.body) {
		document.body.appendChild(this.div);
	}
	this.div.appendChild(elem);

	// Measure the text since it is now drawn
	box = elem.getBBox();

	// Remove the temporary element and restore the parent
	this.div.removeChild(elem);
	if (p !== document.body) {
		document.body.removeChild(this.div);
		this.parent = p;
		if (this.parent) {
			this.parent.appendChild(this.div);
		}
	}

	if (childP) {
		childP.appendChild(elem);
	}

	return box;
};

// SVGDrawable.Draw
//-------------------------------------------------------------------------
/**
 * Draws the SVG and all of its child elements
 *
 * @param {HTMLElement} parent The element to add the SVG to
 * @param {double} 			 w      The width that the SVG should be {optional}
 * @param {double} 			 h      The height that the SVG should be {optional}
 * @param {string} 			 view   The string defining the viewBox for the SVG {optional}
 */
KIP.Objects.SVGDrawable.prototype.Draw = function (parent, w, h, view) {
	"use strict";
	if ((w !== this.w) || (h !== this.h) || (view !== this.view)) {
		this.AdjustSize(w, h, view);
	}

	// Call the super function
	KIP.Objects.Drawable.prototype.Draw.call(this, parent);
};

// SVGDrawable.AssignStyle
//-----------------------------------------------------------------------
/**
 * Splits the style object into fill and stroke attributes
 * @private
 * @param {obj} 							style An object with two sub-objects, fill and stroke
 * @param {SVGElement} elem  The element that we are updating with these style attributes
 */
KIP.Objects.SVGDrawable.prototype.AssignStyle = function (elem) {
	"use strict";
	var styles, tmp, key;
	styles = {};
	tmp = [];
	if (this.fillProperty) this.AssignFillValues(this.fillProperty, elem, styles);
	if (this.lineProperty) this.AssignStrokeValues(this.lineProperty, elem, styles);
	if (this.fontProperty) this.AssignFontValues(this.fontProperty, elem, styles);
	
	for (key in styles) {
		if (styles.hasOwnProperty(key)) {
			tmp.push(key + " : " + styles[key]);
		}
	}
	
	elem.setAttribute("style", tmp.join(";"));
};

// SVGDrawable.AssignFontValues
//-----------------------------------------------------------------------------
/**
 * Updates the various style properties that can be applied to fonts
 *
 * @param {Object} font - The object containing the relevant style definitions. Uses CSS-style values.
 * @param {String} font.size - The size of the font
 * @param {String} font.family - The family the font belongs to
 * @param {String} font.weight - How heavy the font should be
 * @param {String} font.fontStyle - The font-style to use
 * @param {String} font.fill - The color to use for the font
 * @param {SVGElement} elem - The element that these should apply to
 *
 * @returns {SVGElement} The element passed in with the style applied
 */
KIP.Objects.SVGDrawable.prototype.AssignFontValues = function (font, elem, styles) {
	"use strict";
	if (!font) return elem;
	if (font.size) styles["font-size"] = font.size + "px";
	if (font.family) styles["font-family"] = font.family;
	if (font.weight) styles["font-weight"] = font.weight;
	if (font.style) styles["font-style"] = font.style;
	if (font.color) styles.fill = font.color;
	return elem;
};

// SVGDrawable.AssignStrokeValues
//---------------------------------------------------------------------------------
/**
 * Updates the various style properties that can be assigned to strokes
 *
 * @param {Object} stroke - An object containing key-value pairs of different style elements. Uses CSS-style values.
 * @param {String} stroke.type - Can either be "None" or "Solid"
 * @param {String} stroke.color - The color to use for the stroke
 * @param {String} stroke.opacity - The opacity to be used for the stroke
 * @param {String} stroke.width - How wide the stroke line should be
 * @param {String} stroke.lineCap -  How the stroke line should end
 * @param {String} stroke.lineJoin - How corners on the stroke should be shaped
 * @param {SVGElement} elem   The element to apply the style changes to
 *
 * @return {SVGElement} The element with the new styles applied
 */
KIP.Objects.SVGDrawable.prototype.AssignStrokeValues = function (stroke, elem, styles) {
	"use strict";

	if (!stroke || !stroke.type || (stroke.type === "None")) {
		styles.stroke = "None";
		styles["stroke-width"] = 0;
		return elem;
	}

	// Handle dashing of lines
	if (stroke.type === "dashed") {
		if (!stroke.dashArray) stroke.dashArray = "1, 5";
		elem.setAttribute("stroke-dasharray", stroke.dashArray);
	}

	if (stroke.color) styles.stroke = stroke.color;
	if (stroke.opacity) styles["stroke-opacity"] = stroke.opacity;
	if (stroke.width || (stroke.width === 0)) styles["stroke-width"] = stroke.width;

	if (stroke.lineCap) styles["stroke-linecap"] = stroke.lineCap;
	if (stroke.lineJoin) styles["stroke-linejoin"] = stroke.lineJoin;

	return elem;
};

// SVGDrawable.AssignFillValues
//-----------------------------------------------------------------------------
/**
 * Updates the various style properties that can be assigned to fills
 *
 * @param {Object} fill - An object containing data about various fill style elements. Uses CSS-style values.
 * @param {String} fill.type - Can be set to "None" or "Solid"
 * @param {String} fill.color - The color that this object should be filled with
 * @param {String} fill.opacity - The opacity that should be applied to the fill of this object
 *
 * @param {SVGElement} elem The element to apply the style changes to
 */
KIP.Objects.SVGDrawable.prototype.AssignFillValues = function (fill, elem, styles) {
	"use strict";
	if (!fill || !fill.type || (fill.type === "None")) {
		styles.fill = "None";
		return elem;
	}

	if (fill.color) styles.fill = fill.color;
	if (fill.opacity) styles["fill-opacity"] = fill.opacity;
	if (fill.url) styles.fill = "url(" + fill.url + ")";
	return elem;
};

// SVGDrawable.AdjustStyle
//-----------------------------------------------------------------------
/**
 * Allows the style of an existing element to be changed
 *
 * @param {string} id - If *elem* isn't passed in, looks up the element by its ID {optional}
 * @param {SVGElement} elem - The element to add the new CSS to
 */
KIP.Objects.SVGDrawable.prototype.AdjustStyle = function (id, elem) {
	if (!elem) {
		elem = this.elementsByID[id];
	}

	if (!elem) return;

	this.AssignStyle(elem);
};

// SVGDrawable.SetLineProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetLineProperties = function (props) {
	"use strict";
	this.SetProperties(this.lineProperty, props);
};

// SVGDrawable.SetFillProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetFillProperties = function (props) {
	"use strict";
	this.SetProperties(this.fillProperty, props);
};

// SVGDrawable.SetFontProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetFontProperties = function (props) {
	"use strict";
	this.SetProperties(this.fontProperty, props);
};

// SVGDrawable.SetProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetProperties = function (propCollection, newProps) {
	"use strict";
	var prop;

	for (prop in newProps) {
		if (newProps.hasOwnProperty(prop)) {
			propCollection[prop] = newProps[prop];
		}
	}
}

// SVGDrawable.AdjustSize
//-------------------------------------------------------------------------
/**
 * Allows the display size of the SVG to be changed
 *
 * @param {Number} w    The width of the total SVG canvas
 * @param {Number} h    The height of the total SVG canvas
 *
 * @param {String} view A viewBox configuration to be used to scale the SVG. If not passed in, it is calcuated to include everything in the SVG
 */
KIP.Objects.SVGDrawable.prototype.AdjustSize = function (w, h, view) {
	"use strict";
	var tmp_w, tmp_h;

	// Set the width attribute if we need to
	if (w && (this.w !== w)) {
		this.w = w || this.w;
		this.div.setAttribute("width", this.w);
	}

	// Set the height attribute if we need to
	if (h && (this.h !== h)) {
		this.h = h || this.h;
		this.div.setAttribute("height", this.h);
	}

	// If we got a height with no width, we want to make sure that we store an appropriate width internally
	if (h && !w) {
		tmp_w = (this.max_x - this.min_x);
		tmp_h = (this.max_y - this.min_y);

		this.w = (tmp_w * this.h) / tmp_h;
		this.div.setAttribute("width", this.w);
	}

	// If we got a width with no height, we want to make sure that we store an appropriate height internally
	if (w && !h) {
		tmp_w = (this.max_x - this.min_x);
		tmp_h = (this.max_y - this.min_y);

		this.h = (tmp_h * this.w) / tmp_w;
		this.div.setAttribute("height", this.h);
	}

	// Set the view attribute if we need to
	if ((view && (this.view !== view)) || !this.view) {
		this.view = view || this.CalculateView();
		this.div.setAttribute("viewBox", this.view);
	}

};

// SVGDrawable.GetElement
//-----------------------------------------------------------------------
/**
 * Given an ID, finds the SVG element it belongs to
 *
 * @param {String} id - The ID of the element we are trying to find
 *
 * @return {SVGElement} The SVG Element that has this ID
 */
KIP.Objects.SVGDrawable.prototype.GetElement = function (id) {
	"use strict";
	return this.elementsByID[id];
};

// SVGDrawable.CreateGroup
//-----------------------------------------------------------------------
/**
 * Creates an SVG group with the provided ID
 *
 * @param {String} id - The identifier to use for the group
 *
 * @return {SVGElement} The group that is created
 */
KIP.Objects.SVGDrawable.prototype.CreateGroup = function (id, grp) {
	"use strict";
	return this.AddChild("g", {id: id}, grp);
};

// SVGDrawable.SetAttribute
//-----------------------------------------------------------------------
/**
 * Sets an attribute on the SVG element
 * @param	{string} key - What attribute to set
 * @param {string} value - What to set the attribute to
 */
KIP.Objects.SVGDrawable.prototype.SetAttribute = function (key, value) {
	"use strict";
	this.div.setAttribute(key, value);
};

// SVGDrawable.Clear
//-----------------------------------------------------------------------
/**
 * Removes all elements from the SVG canvas
 */
KIP.Objects.SVGDrawable.prototype.Clear = function () {
	"use strict";
	var elem, idx;

	for (idx = (this.div.children.length - 1); idx >= 1; idx -= 1) {
		elem = this.div.children[idx];
		this.div.removeChild(elem);
	}
};

// SVGDrawable.Zoom
//-----------------------------------------------------------------------
/**
 * Allows the viewport to be zoomed into the SVG
 * @param {number} amt - The amount that should be zoomed in
 */
KIP.Objects.SVGDrawable.prototype.Zoom = function (amt) {
	"use strict";
	var xUnit, yUnit;
	
	// Calculate the ratio of the SVG drawing
	xUnit = this.viewW;
	yUnit = this.viewH;
	
	// Adjust the view parameters
	if (this.options.zoomX) {
		this.viewX -= (amt * xUnit);
		this.viewW += (2 * amt * xUnit);
	}
	
	if (this.options.zoomY) {
		this.viewY -= (amt * yUnit);
		this.viewH += (2 * amt * yUnit);
	}
	
	this.view = this.CreateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.Pan
//-----------------------------------------------------------------------
/**
 * Allows the viewport to be panned around
 * @param {number} panX - The amount to move the X direction
 * @param {number} panY - The amount to move the Y direction
 */
KIP.Objects.SVGDrawable.prototype.Pan = function (panX, panY) {
	"use strict";
	
	if (this.options.panX) {
		this.viewX += panX;
	}
	if (this.options.panY) {
		this.viewY += panY;
	}
	this.view = this.CreateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.CalculateScreenCoordinates
//-------------------------------------------------------------------------------
/**
 * Calculates where a provided SVG-based point actually appears on the physical screen
 *
 * @param {number} x - THe x coordinate in the SVG view
 * @param {number} y - The y coordinate in the SVG view
 *
 * @returns {Object} Object containing new x & y values
 */
KIP.Objects.SVGDrawable.prototype.CalculateScreenCoordinates = function (x, y, global) {
	"use strict";
	var xRatio, yRatio, left, top, newX, newY;

	// If the coordinate isn't on the screen, quit
	//if ((x < this.viewX) || (x > (this.viewX + this.viewW))) return {x: NaN, y: NaN};
	//if ((y < this.viewY) || (y > (this.viewY + this.viewH))) return {x: NaN, y: NaN};

	// Grab proportions from parent if we can
	if (this.parent && global) {
		left = KIP.Functions.GlobalOffsetLeft(this.div);
		top = KIP.Functions.GlobalOffsetTop(this.div);
	
		// Get the offset of just the direct parent
	} else if (this.parent) {
		left = this.parent.offsetLeft;
		top = this.parent.offsetTop;
	
	// Otherwise, just use the window properties
	} else {
		left = 0;
		top = 0;
	}

	xRatio = this.w / this.viewW;
	yRatio = this.h / this.viewH;

	newX = xRatio * (x - this.viewX) + left;
	newY = yRatio * (y - this.viewY) + top;

	newX =(newX|newX)
	newY =(newY|newY);

	return {x: newX, y: newY};
};

// SVGDrawable.CalculateSVGCoordinates
//-----------------------------------------------------------------------------
/**
 * Finds the corresponding SVG coordinate for a window coordinate. Useful for taking event data and translating to SVG coordinates.
 *
 * @param {number} x - The x value of the window point
 * @param {number} y - The y value of the window point
 *
 * @returns {Object} Object containing new x & y values
 */
KIP.Objects.SVGDrawable.prototype.CalculateSVGCoordinates = function (x, y) {
	"use strict";
	var left, top, xRatio, yRatio, newX, newY;

	// Grab proportions from parent if we can
	if (this.parent) {
		left = this.parent.offsetLeft;
		top = this.parent.offsetTop;

	// Otherwise, just use the window properties
	} else {
		left = 0;
		top = 0;
	}

	// Calculate the appropriate proportions
	xRatio = this.viewW / this.w;
	yRatio = this.viewH / this.h;

	// Calculate the ratio
	newX = xRatio * (x - left) + this.viewX;
	newY = yRatio * (y - top) + this.viewY;

	return {x: newX, y: newY};
}

KIP.Objects.SVGDrawable.prototype.CalculateSVGWidth = function (w) {
	"use strict";
	var xRatio = this.viewW / this.w;
	return w * xRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateSVGHeight = function (h) {
	var yRatio = this.viewH / this.h;
	return h * yRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateScreenWidth = function (w) {
	"use strict";
	var xRatio = this.w / this.viewW;
	return w * xRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateScreenHeight = function (h) {
	var yRatio = this.h / this.viewH ;
	return h * yRatio;
}


// SVGDrawable.CreateGradient
//----------------------------------------------------------------------------------------
/**
 * Create a gradient with a given set of points
 *
 * @param {string} type       - What type of gradient you are creating ("linear" or "radial")
 * @param {Array} points     - An array of objects, each with three properties
 * @param {string} points.color - The color to use for the provided point
 * @param {number} points.offset - The offset to use for the color point (between  0 and 1)
 * @param {number} points.opacity - What opacity the point should have
 * @param {Object} [transforms] - object containing the properties of the transform gradient that will be applied
 * @param {number} transforms.startX - The starting x value for thte gradient
 * @param {number} transforms.startY - The starting y value for the gradient
 * @param {number} transforms.endX
 * @param {number} transforms.endY
 *
 * @returns {string} The ID of the created gradient or transform gradient (if transform data was passed in)
 */
KIP.Objects.SVGDrawable.prototype.CreateGradient = function (type, points, transforms) {
	"use strict";
	var grad, pt, pIdx, id, tID, tGrad;

	// Initialize our definitions node if need be
	if (!this.defs) {
		this.defs = KIP.Functions.CreateSVGElem("defs");
		this.gradients = [];
		this.div.appendChild(this.defs);
	}

	id = "gradient" + this.gradients.length;

	// Create the initial gradient
	if (type === "linear") {
		grad = KIP.Functions.CreateSVGElem("linearGradient", {id: id});
	} else if (type === "radial") {
		grad = KIP.Functions.CreateSVGElem("radialGradient", {id: id});
	} else {
		return;
	}

	// Apply the points to the gradient
	for (pIdx = 0; pIdx < points.length; pIdx += 1) {
		pt = KIP.Functions.CreateSVGElem("stop", {id: id + "stop" + pIdx});
		pt.style.stopColor = points[pIdx].color;
		pt.style.stopOpacity = points[pIdx].opacity;
		pt.setAttribute("offset", points[pIdx].offset);
		grad.appendChild(pt);
	}

	this.defs.appendChild(grad);
	this.gradients[this.gradients.length] = grad;

	// TODO: fix
	if (transforms) {
		tID = "gradient" + this.gradients.length;
		tGrad = KIP.Functions.CreateSVGElem(type + "Gradient", {id: tID});

		tGrad.setAttribute("x1", transforms.startX);
		tGrad.setAttribute("x2", transforms.endX);
		tGrad.setAttribute("y1", transforms.startY);
		tGrad.setAttribute("y2", transforms.endY);

		tGrad.setAttribute("xlink:href", "#" + id);

		this.defs.appendChild(tGrad);
		this.gradients[this.gradients.length] = grad;
		id = tID;
	}

	// Return the ID of the gradient, as that's what elements will need to reference
	return id;
}

// SVGDrawable.CreatePattern
//-----------------------------------------------------------------------
// TODO: fix
KIP.Objects.SVGDrawable.prototype.CreatePattern = function (type, id) {
	"use strict";
	var pat, div;

	// Create the definitions node, if it doesn't already exist
	if (!this.defs) {
		this.defs = KIP.Functions.CreateSVGElem("defs");
		this.patternIDs = {};
		this.div.appendChild(this.defs);
	}

	// Create the appropriate pattern
	div = 100;
	if (type === "stipple") {
		id = id || "stipple";
		pat = this.StipplePattern(10, 10, id);
	}

	// Remove any previous elements with this name
	if (this.patternIDs[id]) {
		this.defs.removeChild(this.patternIDs[id]);
	}

	this.defs.appendChild(pat);
	this.patternIDs[id] = pat;

	return id;
};

// SVGDrawable.StipplePattern
//---------------------------------------------------------------------------------
// TODO: FIx
KIP.Objects.SVGDrawable.prototype.StipplePattern = function (width, height, id) {
	"use strict";
	var x, y, circ, pattern, rx, ry, cx, cy;

	pattern = KIP.Functions.CreateSVGElem("pattern", {id: id || "stipple",x: 0, y: 0, height: .25, width: .25});
	pattern.setAttribute("patternTransform","translate(0,0) scale(10, 10)");
	pattern.setAttribute("patternUnits", "userSpaceOnUse");

	// Grab the appropriate radii
	rx = (width / 5);
	ry = (height / 5);

	// Grab the appropriate center point
	cx = (rx / 2);
	cy = (ry / 2);

	// Create the circle and add it to the pattern
	circ = KIP.Functions.CreateSVGElem("circle", {rx: rx, ry: ry, cx: cx, cy: cy});
	this.AssignStyle(circ);
	pattern.appendChild(circ);

	return pattern;
};

// SVGDrawable.RotateElement
//--------------------------------------------------------------------------------
/**
 * Rotates a provided element by some number of degrees around a certain point.
 * @param {SVGElement} elem - The element to rotate
 * @param {number} deg - The number of degrees to rotate the element
 * @param {object} point - The point around whuch the rotation should occur.
 * @param {number} point.x - The x coordinate to rottate around
 * @param {number} point.y - The y coordinate to rotate around
 */
KIP.Objects.SVGDrawable.prototype.RotateElement = function (elem, deg, point) {
	"use strict";
	var box;
	if (!point) {
		box = this.MeasureElem(elem);
		point = {
			x: box.x + (box.width / 2),
			y: box.y + (box.height / 2)
		}
	}

	elem.setAttribute("transform", "rotate(" + deg + ", " + point.x + ", " + point.y + ")");
	return elem;
};

// SVGDrawable.AddShape
//------------------------------------------------------------------------
/**
 * Draws a predetermined shape as an SVG. Used for stencil shapes.
 * Currently only supports a check mark or an "x"
 * @param {string} type - The type of shape to add. Currently supports "check", "x", "plus"
 * @param {object} [attr] - ANy additional atributes to be added to the shape
 * @param {SVGElement} [grp] - The SVG group to add this to
 */
KIP.Objects.SVGDrawable.prototype.AddShape = function (type, attr, grp) {
	"use strict";
	var ret
	// Only types currently supported is "check", "x", "plus"
	
	// Checkmark
	if (type === "check") {
    ret = this.AddPath(
			[
				{x: -0.15, y: 2.95},
				{x: 1, y: 4},
				{x: 1.25, y: 4},
				
				{x: 3, y: 0.25},
				{x: 2.4, y: 0},
				
				{x: 1, y: 3},
				{x: 0.3, y: 2.3}
			],
			attr,
			grp
		);
		
	// X
	} else if (type === "x") {
		ret = this.AddPath(
			[
				{x: 0.25, y: 0.6},
				{x: 1, y: 0},
				{x: 2, y: 1.1},
				{x: 3, y: 0},
				{x: 3.75, y: 0.6},
				
				{x: 2.66, y: 1.75},
				
				{x: 3.75, y: 2.9},
				{x: 3, y: 3.5},
				{x: 2, y: 2.5},
				{x: 1, y: 3.5},
				{x: 0.25, y: 2.9},
				
				{x: 1.33, y: 1.75}
			],
			attr,
			grp
		);
	} else if (type === "plus") {
		ret = this.AddPath(
			[
				{x: 2, y: 2},
				{x: 2, y: 0},
				{x: 3, y: 0},
				
				{x: 3, y: 2},
				{x: 5, y: 2},
				{x: 5, y: 3},
				
				{x: 3, y: 3},
				{x: 3, y: 5},
				{x: 2, y: 5},
				
				{x: 2, y: 3},
				{x: 0, y: 3},
				{x: 0, y: 2}
			],
			attr,
			grp
		);
	}
	
	return ret;
};