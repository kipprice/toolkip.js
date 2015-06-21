/*globals KIP,document*/

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

	this.cur_ID = 0;
};

// We inherit from Drawables
KIP.Objects.SVGDrawable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/***************************************************************
 * Calculates what the view box should be to encompass all of the elements currently in the SVG drawing
 ***************************************************************/
KIP.Objects.SVGDrawable.prototype.CalculateView = function () {
	return this.min_x + " " + this.min_y + " " + this.max_x + " " + this.max_y;
};

/****************************************************************************************
 * Adds a rectangle to the current SVG drawing
 * 
 * @param {double} x     The x value of the upper left corner of the rectangle
 * @param {double} y     The y value of the upper left corner of the rectangle
 * @param {double} w     The width of the rectangle
 * @param {double} h     The height of the rectangle
 * @param {obj} 	 style An array with two sub-arrays: fill and stroke
 * @param {string} id    An ID to associate with the rectangle {optional}
 * @param {string} class A CSS class to assign the rectangle {optional}
 *
 * @returns {SVG Child Element} The rectangle that is created from these parameters
 *****************************************************************************************/
KIP.Objects.SVGDrawable.prototype.AddRectangle = function (x, y, w, h, style, id, cls) {
	"use strict";
	this.UpdateView(x, y, w, h);
	return this.AddChild("rect", {"height" : h, "width" : w, "x" : x, "y" : y}, style, id, cls);
};

/*********************************************************************
 * Updates the min and max specs of the view.
 * Called whenever an element is added to the svg drawing
 * 
 * @param {double} x The x position of the new element
 * @param {double} y The y position of the new element
 * @param {double} w The width of the new element
 * @param {double} h The height of the new element
 *********************************************************************/
KIP.Objects.SVGDrawable.prototype.UpdateView = function (x, y, w, h) {

	// Update the min and max x if appropriate
	if (x <= this.min_x) this.min_x = (x - 1);
	if ((x + w) >= this.max_x) this.max_x = (x + w + 1);

	// Update the min and max y if appropriate
	if (y <= this.min_y) this.min_y = (y - 1);
	if ((y + h) >= this.max_y) this.max_y = (y + h + 1);
};

// TODO: Add all elements that SVG support
KIP.Objects.SVGDrawable.prototype.AddPath = function (points, style, id) {
	// Loop through the points and assign the appropriate d attribute
}

KIP.Objects.SVGDrawable.prototype.AddRegularPolygon = function (x, y, sides, style, id) {

}

KIP.Objects.SVGDrawable.prototype.AddRegularStar = function (x, y, sides, style, id) {

}

/*****************************************************************************************
 * Adds a circle to the current SVG drawing
 * 
 * @param {double} x      The x for the center of the circle
 * @param {double} y      The y value for the center of the circle
 * @param {double} radius The radius for the circle
 * @param {obj} style  		An array with two sub-arrays: fill and stroke
 * @param {string} id     The ID that should be assigned to the element {Optional}
 * @param {string} cls 		The CSS class that should be applied to this element
 * 
 * @returns {SVG Child Element} The element that is created
 ****************************************************************************************/
KIP.Objects.SVGDrawable.prototype.AddCircle = function (x, y, radius, style, id, cls) {
	"use strict";
	this.UpdateView(x - radius, y - radius, 2 * radius, 2 * radius);
	return this.AddChild("circle", {"cx" : x, "cy" : y, "r" : radius}, style, id, cls);
};

/************************************************************************************
 * Don't call this function directly; use one of the more targeted drawing functions
 * Adds a child element to the current SVG drawing
 * 
 * @param {string} type  The type of child element we are drawing
 * @param {obj} attr  The attributes that should be applied to this child
 * @param {string} style The style attributes that should apply to this child
 * @param {string} id    The ID to use for this child element {optional}
 * @param {string} cls   The CSS class to apply to this child element {optional}
 ***********************************************************************************/
KIP.Objects.SVGDrawable.prototype.AddChild = function (type, attr, style, id, cls) {
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

	this.div.appendChild(elem);

	return elem;
};

KIP.Objects.SVGDrawable.prototype.AddText = function (elem, text, x, y, style, id, cls) {
	var txt, tSpan, cx, cy, e_x, e_y;

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

	this.div.appendChild(txt);

	return txt;
};

/***********************************************************************
 * Draws the SVG and all of its child elements
 * 
 * @param {HTML Element} parent The element to add the SVG to
 * @param {double} 			 w      The width that the SVG should be {optional}
 * @param {double} 			 h      The height that the SVG should be {optional}
 * @param {string} 			 view   The string defining the viewBox for the SVG {optional}
 ************************************************************************/
KIP.Objects.SVGDrawable.prototype.Draw = function (parent, w, h, view) {
	"use strict";
	if ((w !== this.w) || (h !== this.h) || (view !== this.view)) {
		this.AdjustSize(w, h, view);
	}

	// Call the super function
	KIP.Objects.Drawable.prototype.Draw.call(this, parent);
};

/***********************************************************************
 * Splits the style object into fill and stroke attributes
 * 
 * @param {obj} 							style An object with two sub-objects, fill and stroke
 * @param {SVG Child Element} elem  The element that we are updating with these style attributes
 ***********************************************************************/
KIP.Objects.SVGDrawable.prototype.AssignStyle = function (style, elem) {
	if (!style) return;
	if (style.fill) this.AssignFillValues(style.fill, elem);
	if (style.stroke) this.AssignStrokeValues(style.stroke, elem);
	if (style.font) this.AssignFontValues(style.font, elem);
}

KIP.Objects.SVGDrawable.prototype.AssignFontValues = function (font, elem) {
	if (!font) return elem;
	if (font.size) elem.style.fontSize = font.size;
	if (font.family) elem.style.fontFamily = font.family;
	if (font.weight) elem.style.fontWeight = font.weight;
	if (font.style) elem.style.fontStyle = font.style;
	if (font.color) elem.style.fill = font.color;
};

/*******************************************************************************
 * Updaets the various style properties that can be assigned to strokes
 * 
 * @param {obj} 							stroke An object containing key-value pairs of different style elements
 * @param {SVG Child Element} elem   The element to apply the style changes to
 *******************************************************************************/
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

/***************************************************************************
 * Updates the various style properties that can be assigned to fills
 * 
 * @param {obj} 							fill An object containing key-value pairs of different style elements
 * @param {SVG Child Element} elem The element to apply the style changes to 
 ***************************************************************************/
KIP.Objects.SVGDrawable.prototype.AssignFillValues = function (fill, elem) {

	if (!fill || !fill.type || (fill.type === "None")) {
		elem.style.fill = "None";
		return elem;
	}

	if (fill.color) elem.style.fill = fill.color;
	if (fill.opacity) elem.style.fillOpacity = fill.opacity;
	return elem;
}

KIP.Objects.SVGDrawable.prototype.AssignPoints = function (stroke, elem) {

}

/*******************************************************************************
 * ALlows the style of an existing element to be changed
 * 
 * @param {string} 						id        If *elem* isn't passed in, looks up the element by its ID {optional}
 * @param {SVG Child Element} elem      The element to add the new CSS to
 * @param {obj} 							new_style An object with two sub-objects, stroke and fill
 *******************************************************************************/
KIP.Objects.SVGDrawable.prototype.AdjustStyle = function (id, elem, new_style) {
	if (!elem) {
		elem = this.elementsByID[id];
	}

	if (!elem) return;

	this.AssignStyle(new_style, elem);
}

/*********************************************************************
 * Allows the display size of the SVG to be changed
 * 
 * @param {double} w    The width of the total SVG canvas
 * @param {double} h    The height of the total SVG canvas
 * @param {string} view A viewBox configuration to be used to scale the SVG. If not passed in, it is calcuated to include everything in the SVG
 *********************************************************************/
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

}

KIP.Objects.SVGDrawable.prototype.GetElement = function (id) {
	return this.elementsByID[id];
}

KIP.Objects.SVGDrawable.prototype.CreateGradient = function (id, colors) {

}