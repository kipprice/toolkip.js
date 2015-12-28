/*globals KIP,document*/

/**
 * @file Declaration of the SVGDrawable object
 * @author Kip Price
 * @version 0.5
 * @since 1.2
 */

/**
 * @class SVGDrawable
 * Creates an SVG image that can have various elements added to it
 * @param {String} id - The unique identifier to apply to this SVG image
 */
KIP.Objects.SVGDrawable = function (id) {
	"use strict";
	this.div = KIP.Functions.CreateSVG(id);
	this.elements = [];
	this.elementsByID = [];

	// Track how much of the SVG should be viewed at a time
	this.min_x = 1000000;
	this.min_y = 1000000;
	this.max_x = 0;
	this.max_y = 0;

	this.gutter = 1;
	this.cur_ID = 0;
	
};

// We inherit from Drawables
KIP.Objects.SVGDrawable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/**
 * Calculates what the view box should be to encompass all of the elements currently in the SVG drawing
 */
KIP.Objects.SVGDrawable.prototype.CalculateView = function () {
	return this.min_x + " " + this.min_y + " " + (this.max_x - this.min_x) + " " + (this.max_y - this.min_y);
};

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
KIP.Objects.SVGDrawable.prototype.AddRectangle = function (x, y, w, h, style, id, cls, group) {
	"use strict";
	this.UpdateView(x, y, w, h);
	return this.AddChild("rect", {"height" : h, "width" : w, "x" : x, "y" : y}, style, id, cls, group);
};

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

// TODO: Add all elements that SVG support
KIP.Objects.SVGDrawable.prototype.AddPath = function (points, style, id) {
	// Loop through the points and assign the appropriate d attribute
};

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

KIP.Objects.SVGDrawable.prototype.LineTo = function (x, y, element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += "L " + x + " " + y + "\n";
	element.setAttribute("d", d);
	return element;
};

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

KIP.Objects.SVGDrawable.prototype.FinishPath = function (element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += " Z";
	element.setAttribute("d", d);
	return element;
};

KIP.Objects.SVGDrawable.prototype.AddRegularPolygon = function (centerX, centerY, sides, radius, style, id, cls, group) {
	"use strict";
	var intAngle, p, points, idx, x, y, curAngle;
	this.UpdateView(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	intAngle = KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360 / sides), 1000);
	
	p = this.AddChild("polygon", {points : ""}, style, id, cls, group);
	
	points = "";
	curAngle = 0;
	for (idx = 0; idx < sides; idx += 1) {
		
		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * radius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * radius, 10);
		curAngle += intAngle;
		points += x + "," + y + " ";
	}
	
	p.setAttribute("points", points);
};

KIP.Objects.SVGDrawable.prototype.AddRegularStar = function (x, y, sides, style, id, cls, group) {

};

/**
 * Adds a circle to the current SVG drawing
 *
 * @param {Number} x - The x for the center of the circle
 * @param {Number} y - The y value for the center of the circle
 * @param {Number} radius - The radius for the circle
 * @param {Object} style - An array defining how to style this rectangle
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {String} [id] - The ID that should be assigned to the element
 * @param {String} [cls] -	The CSS class that should be applied to this element
 * @param {SVGElement} [group] - The SVG group to add this element to
 *
 * @returns {SVGElement} The element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddCircle = function (x, y, radius, style, id, cls, group) {
	"use strict";
	this.UpdateView(x - radius, y - radius, 2 * radius, 2 * radius);
	return this.AddChild("circle", {"cx" : x, "cy" : y, "r" : radius}, style, id, cls, group);
};

KIP.Objects.SVGDrawable.prototype.AddPath = function () {
	
};

KIP.Objects.SVGDrawable.prototype.AddPerfectArc = function (center, radius, startDeg, endDeg, direction, noRadii, style, id, cls, group) {
	var elem, end, start, aDiff, padding, adjust, angle;

	padding = parseInt(style.stroke.width, 10) || 1; 
	this.UpdateView(center.x - radius - padding, center.y - radius - padding, 2 * (radius + padding), 2 * (radius + padding));
	start = {};
	end = {};

	aDiff = endDeg - startDeg;
	
	start.x = Math.sin(KIP.Functions.DegreesToRadians(startDeg)) * radius + center.x;
	start.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(startDeg)) * radius) + center.y;

	end.x = Math.sin(KIP.Functions.DegreesToRadians(endDeg)) * radius + center.x;
	end.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(endDeg)) * radius) + center.y;
	
	adjust = parseInt(style.stroke.width, 10) * Math.sqrt(2) || 0; // Hypotenuse
	angle = KIP.Functions.DegreesToRadians(aDiff + startDeg); // Appropriate angle

	elem = this.AddChild("path", {d : ""}, style, id, cls, group);
	
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

/**
 * Don't call this function directly; use one of the more targeted drawing functions
 * Adds a child element to the current SVG drawing
 * @private
 * @param {String} type  The type of child element we are drawing
 * @param {Object} attr  	 The attributes that should be applied to this child
 * @param {Object} style - An array defining how to style this rectangle
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {String} [id] - The ID that should be assigned to the element
 * @param {String} [cls] -	The CSS class that should be applied to this element
 * @param {SVGElement} [group] - The SVG group to add this element to
 */
KIP.Objects.SVGDrawable.prototype.AddChild = function (type, attr, style, id, cls, group) {
	"use strict";

	// We can't do anything without a type
	if (!type) return;

	if (!id) {
		id = this.cur_ID;
		this.cur_ID += 1;
	}

	var elem = KIP.Functions.CreateSVGElem(id, type, cls, attr);
	this.AssignStyle(style, elem);

	this.elements[this.elements.length] = elem;
	this.elementsByID[id] = elem;

	if (group) {
		group.appendChild(elem);
	} else {
		this.div.appendChild(elem);
	}

	return elem;
};

/**
 * Adds text on top of a provided element
 *
 * @param {SVGElement} elem - The element to add text on top of.
 * @param {String} text  - The text to add
 * @param {Number} x - The x-offset from the target element's position
 * @param {Number} y - The y-offset from the target element's position
 * @param {Object} style - An array defining how to style this rectangle.
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {Object} style.font - An object array defining various font properties. See {@link KIP.Objects.SVGDrawable#AssignFontValues|AssignFontValues} for details.
 * @param {String} id - The identifier to use for the resulting SVG element
 * @param {String} cls - The CSS class to apply to this element
 *
 * @return {SVGElement} The text element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddText = function (elem, text, x, y, style, id, cls, origin, group) {
	var txt, tSpan, cx, cy, e_x, e_y, box, oX, oY;

	if (elem) {
		cx = parseInt(elem.getAttribute('cx'));
		cy = parseInt(elem.getAttribute('cy'));
		e_x = parseInt(elem.getAttribute('x'));
		e_y = parseInt(elem.getAttribute('y'));

		if (e_x || (e_x === 0)) {
			x += e_x;
		} else if (cx || (cx === 0)) {
			x = cx - x;
		}

		if (e_y || (e_y === 0)) {
			y += e_y;
		} else if (cy || (cy === 0)) {
			y = cy + y;
		}
	}

	txt = KIP.Functions.CreateSVGElem(id, "text", cls, {x: x, y: y});
	txt.innerHTML = text;
	this.AssignStyle(style, txt);
	
	box = this.MeasureElem(txt);

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
	}

	this.UpdateView(x, y - box.height, box.width, box.height);

	if (!group) {
		this.div.appendChild(txt);
	} else {
		group.appendChild(txt);
	}
	
	return txt;
};

KIP.Objects.SVGDrawable.prototype.MeasureElem = function (elem) {
	"use strict";
	var p, box, childP;

	p = this.parent;
	childP = elem.parentNode;

	// Temporarily add the element to get its size
	document.body.appendChild(this.div);
	this.div.appendChild(elem);

	// Measure the text since it is now drawn
	box = elem.getBBox();

	// Remove the temporary element and restore the parent
	this.div.removeChild(elem);
	document.body.removeChild(this.div);
	this.parent = p;
	
	if (childP) {
		childP.appendChild(elem);
	}

	return box;
};

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

/**
 * Splits the style object into fill and stroke attributes
 * @private
 * @param {obj} 							style An object with two sub-objects, fill and stroke
 * @param {SVGElement} elem  The element that we are updating with these style attributes
 */
KIP.Objects.SVGDrawable.prototype.AssignStyle = function (style, elem) {
	if (!style) return;
	if (style.fill) this.AssignFillValues(style.fill, elem);
	if (style.stroke) this.AssignStrokeValues(style.stroke, elem);
	if (style.font) this.AssignFontValues(style.font, elem);
};

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
KIP.Objects.SVGDrawable.prototype.AssignFontValues = function (font, elem) {
	if (!font) return elem;
	if (font.size) elem.style.fontSize = font.size;
	if (font.family) elem.style.fontFamily = font.family;
	if (font.weight) elem.style.fontWeight = font.weight;
	if (font.style) elem.style.fontStyle = font.style;
	if (font.color) elem.style.fill = font.color;
	return elem;
};

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
KIP.Objects.SVGDrawable.prototype.AssignStrokeValues = function (stroke, elem) {
	"use strict";

	if (!stroke || !stroke.type || (stroke.type === "None")) {
		elem.style.stroke = "None";
		return elem;
	}

	if (stroke.color) elem.style.stroke = stroke.color;
	if (stroke.opacity) elem.style.strokeOpacity = stroke.opacity;
	if (stroke.width) elem.style.strokeWidth = stroke.width;

	if (stroke.lineCap) elem.style.strokeLinecap = stroke.lineCap;
	if (stroke.lineJoin) elem.style.strokeLinejoin = stroke.lineJoin;

	return elem;
};

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
KIP.Objects.SVGDrawable.prototype.AssignFillValues = function (fill, elem) {

	if (!fill || !fill.type || (fill.type === "None")) {
		elem.style.fill = "None";
		return elem;
	}

	if (fill.color) elem.style.fill = fill.color;
	if (fill.opacity) elem.style.fillOpacity = fill.opacity;
	return elem;
};

KIP.Objects.SVGDrawable.prototype.AssignPoints = function (stroke, elem) {

};

/**
 * Allows the style of an existing element to be changed
 *
 * @param {string} 						id        If *elem* isn't passed in, looks up the element by its ID {optional}
 * @param {SVGElement} elem      The element to add the new CSS to
 * @param {obj} 							new_style An object with two sub-objects, stroke and fill
 */
KIP.Objects.SVGDrawable.prototype.AdjustStyle = function (id, elem, new_style) {
	if (!elem) {
		elem = this.elementsByID[id];
	}

	if (!elem) return;

	this.AssignStyle(new_style, elem);
};

/**
 * Allows the display size of the SVG to be changed
 *
 * @param {Number} w    The width of the total SVG canvas
 * @param {Number} h    The height of the total SVG canvas
 *
 * @param {String} view A viewBox configuration to be used to scale the SVG. If not passed in, it is calcuated to include everything in the SVG
 */
KIP.Objects.SVGDrawable.prototype.AdjustSize = function (w, h, view) {

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

	// Set the view attribute if we need to
	if ((view && (this.view !== view)) || !this.view) {
		this.view = view || this.CalculateView();
		this.div.setAttribute("viewBox", this.view);
	}

};

/**
 * Given an ID, finds the SVG element it belongs to
 *
 * @param {String} id - The ID of the element we are trying to find
 *
 * @return {SVGElement} The SVG Element that has this ID
 */
KIP.Objects.SVGDrawable.prototype.GetElement = function (id) {
	return this.elementsByID[id];
};

KIP.Objects.SVGDrawable.prototype.CreateGradient = function (id, colors) {

};
/**
 * Creates an SVG group with the provided ID
 *
 * @param {String} id - The identifier to use for the group
 *
 * @return {SVGElement} The group that is created
 */
KIP.Objects.SVGDrawable.prototype.CreateGroup = function (id) {
	"use strict";
	return this.AddChild("g", [], {}, id);
};

KIP.Objects.SVGDrawable.prototype.SetAttribute = function (key, value) {
	"use strict";
	this.div.setAttribute(key, value);
};

KIP.Objects.SVGDrawable.prototype.Clear = function () {
	"use strict";
	var elem, idx;
	
	for (idx = (this.div.children.length - 1); idx >= 1; idx -= 1) {
		elem = this.div.children[idx];
		this.div.removeChild(elem);
	}
};