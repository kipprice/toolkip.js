KIP.Constants.GraphTypeEnum = {
	"Pie" : 0,
	"Bar" : 1,
	"Circle" : 2,
	"Tier" : 3,
	"Line": 4,
	"Trend": 5
};

/** 
 * Creates a graph object  of various types
 * @class Graph
 * @param {string} id - The unique identifier for the graph
 * @param {GraphTypeEnum} type - The type of graph we are creating
 **/
KIP.Objects.Graph = function (id, type) {
	this.id = id;
	this.data = [];
	this.dataListeners = [];
	this.type = type;
	this.sortedData = [];
	
	this.elems = [];

	// The root of a graph is an SVG drawable
	KIP.Objects.SVGDrawable.call(this, id);
};

// The graph is based off of an SVG Drawable
KIP.Objects.Graph.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

// Graph.AddData
//--------------------------------------------------------------------------------------------
/**
 * Adds a piece of data to the graph. Each graph handles this data separately
 * @param {string} label - What the data should be labeled with
 * @param {number} independent - The x value of this data
 * @param {number} [dependent] - The y value of this data
 * @param {number} [depth] - The z value of this data
 * @param {variant} [addl] - Any additional data that this particular graph might need to dispalt its data
 * @returns {number} The index at which this data is placed
 */
KIP.Objects.Graph.prototype.AddData = function (label, independent, dependent, depth, addl) {
	"use strict";
	var idx;

	idx = this.data.length;

	this.data[idx] = {lbl: label, x: independent, y: dependent, z: depth, extra: addl};

	this.AddDataAppropriateForGraph(idx);
	
	return idx;
};

// Graph.AddDataAppropriateForGraph
//------------------------------------------------------------------------
/**
 * Placeholder function that is overriden by each type of graph
 * @param {number} idx - The index of the data we are adding toLocaleString
 */
KIP.Objects.Graph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
};

// Graph.AddListenerToData
//--------------------------------------------------------------------------
/**
 * Queues up an event listener to a particular piece of data, to be added when it is drawn
 * @param {number} idx - The index of the data to add the listener to
 * @param {string} type - The type of listener we want to add
 * @param {function} func - The call back function for the listener
 */
KIP.Objects.Graph.prototype.AddListenerToData = function (idx, type, func) {
	"use strict";
	var cnt;

	if (!this.dataListeners[idx]) {
		this.dataListeners[idx] = [];
	}

	cnt = this.dataListeners[idx].length;
	this.dataListeners[idx][cnt] = {type: type, listener: func};
};

// Graph.AttachDataLsteners
//---------------------------------------------------------------------
/**
 * Add the appropriate event listeners to the current piece of data
 * @param {number} idx - The index of the piece of data being drawn
 * @param {SVGElement} pc - The SVG element to add the event listener to
 */
KIP.Objects.Graph.prototype.AttachDataListeners = function (idx, pc) {
	"use strict";
	var type, listenerArr, listener, jdx;
	listenerArr = this.dataListeners[idx];

	if (!listenerArr) return;
	
	// Loop through all of the events we have for this index
	for (jdx = 0; jdx < listenerArr.length; jdx += 1) {
		
		// Skip this if we don't have any data
		if (!listenerArr[jdx]) continue;
		
		// Grab the type and callback
		type = listenerArr[jdx].type;
		listener = listenerArr[jdx].listener;
		
		// Don't do anything if we're missing something
		if ((!type) || (!listener)) continue;
		
		// Otherwise, add the event listener
		pc.addEventListener(type, listener);
	}
};

// =================== CIRCULAR GRAPH SUBTYPE ===============================
// CircularGraph
//------------------------------------------------
/**
 * Prototypical graph object to use for pie graphs and circle graphs
 * @param {string} id - The unique identifier for this graph
 * @param {GraphTypeEnum} type - What type of graph this will become
 */
KIP.Objects.CircularGraph = function (id, type) {
	"use strict";
	KIP.Objects.Graph.call(this, id, type);
};

// Inherits the basic properties of a graph
KIP.Objects.CircularGraph.prototype = Object.create(KIP.Objects.Graph.prototype);

// CircularGraph.AddTextAroundRing
//---------------------------------------------------------------------------------------------------------------------------------
/** 
 * Adds a label in the appropriate position around the circular graph
 * @param {string} txt - The text to display as the label
 * @param {number} startAngle - The beginning angle (in degrees) of the data we are labeling
 * @param {number} endAngle - The ending angle (in degrees) of the data we are labeling
 * @param {SVGElement} reFElem - The element to add the label to
 * @param {number} [r] - The radius for this particular piece of data
 * @param {string} [id] - A unique identifier for this label
 * @param {string} [cls] - A CSS class to use for this label
 * @param {SVGElement} [group] - The SVG group to add this to
 * @param {boolean} [rotate] - True if the text should be rotated around the graph.
 * @returns {SVGElement} The created label
 */
KIP.Objects.CircularGraph.prototype.AddTextAroundRing = function (txt, startAngle, endAngle, refElem, r, id, cls, group, rotate) {
	"use strict";
	var tDeg, tRad, tX, tY, origin, text, rAng, box;

	// Quit if this isn't a circular graph
	if (!this.radius) return;

	// Allow a passed in radius
	r = r || this.radius;

	// Calculate the position at which the text should appear
	tDeg = startAngle + (endAngle - startAngle) / 2;
	tRad = KIP.Functions.DegreesToRadians(tDeg);
	
	tY = KIP.Functions.RoundToPlace(-1 * Math.cos(tRad), 1000);
	tX = KIP.Functions.RoundToPlace(Math.sin(tRad), 1000);

	origin = {};

	// Calculate where to stick the y component of the origin
	origin.y = (tY / -4) + 0.75;

	// Calculate where to stick the x component of the origin
	origin.x = (tX / -2) + 0.5;
	
	// Actually add the text
	text = this.AddText(refElem, txt, this.center.x + (tX * (r + 1)), this.center.y + ((r + 1) * tY), this.fontStyle, id, cls, origin, group);
	
	// Rotate if appropriate
	if (rotate) {
		box = this.MeasureElem(text);
		rAng = (((endAngle - startAngle ) / 2) + startAngle) % 45 + 315;
		text.setAttribute("transform", "rotate(" + (rAng) + " " + (box.x + (box.width / 2)) + " " + (box.y + (box.height / 2)) + ")");
	}
	
	return text;

};

// CircularGraph.AddPieceListeners
//------------------------------------------------------------------------------------
/**
 * Adds the mouse in/out listeners for the data pieces to show labels
 * @param {SVGElement} piece - The element to add the listeners to
 * @param {string} text - The label to show on mouse over
 * @param {SVGElement} [box] - The SVG rectangle that appears behind the text
 */
KIP.Objects.CircularGraph.prototype.AddPieceListeners = function (piece, text, box) {
	"use strict";
	if (!piece || !text) return;

	piece.addEventListener("mouseover", function () {
		text.style.opacity = 1;
		if (box) box.style.opacity = 0.8;
	});

	piece.addEventListener("mouseout", function () {
		text.style.opacity = 0;
		if (box) box.style.opacity = 0;
	});

	text.style.transition = "opacity ease-in-out .2s";
	text.style.opacity = 0;
	if (box) {
		box.style.opacity = 0;
		box.style.transition = "opacity ease-in-out .2s";
	}
	
};

//======================= PIE GRAPH ==============================//
// PieGraph.Refresh
//--------------------------------------------------------------------------
/**
 * Creates a pie graph that can show up to two types of data for every piece (percentage and height)
 * @param {string} id - The unique identifier for this graph
 * @param {object} [center] - The center point at which to draw this graph. Default is {x: 80, y: 80}
 * @param {number} [center.x] - The x position of the center. Default is 80
 * @param {number} [center.y] - The y position of the center. Default is 80
 * @param {number} [radius] - The radius of the graph. This is ignored if also changing the height of the graph. Default is 40
 * @param {object} [style] - The style to use when drawing the graph
 * @param {boolean} [labelAtTop] - Set to true if the mouse over label should only appear at the top
 */
KIP.Objects.PieGraph = function (id, center, radius, style, labelAtTop) {
	"use strict";

	this.center = center || {x: 80, y: 80};
	this.radius = radius || 30;
	this.total = 0;
	this.style = style || {stroke : {type: "solid", color : "#000", width: "0px"}, fill : {type : "solid"}};
	this.fontStyle = {font: {family: "Segoe UI", size: "10px"}, fill: {type: "solid"}};
	this.hslRotate = KIP.Constants.HSLPieceEnum.Saturation;
	this.labelAtTop = labelAtTop || false; 
	this.sort = true;
	this.keyX = 0;
	this.keyY = 0;
	this.days = 0;
	
	this.addLabels = true;
	this.addKey = true;

	KIP.Objects.CircularGraph.call(this, id, KIP.Constants.GraphTypeEnum.Pie);
};

KIP.Objects.PieGraph.prototype = Object.create(KIP.Objects.CircularGraph.prototype);

KIP.Objects.PieGraph.prototype.ChooseColorRotate = function (hsl) {
	this.hslRotate = hsl;
};

// PieGraph.Refresh
//-------------------------------------------------------
/**
 * Draws all of the pieces needed for the pie graph
 */
KIP.Objects.PieGraph.prototype.Refresh = function () {
	var datum, dIdx, elem, perc, lastDeg, text, style, tX, tY, tDeg, origin, r, layerWedge, layerText, layerBox, box, textBox, sIdx, key;
	style = this.style;

	lastDeg = 0;

	this.Clear();
	
	layerWedge = this.CreateGroup("wedges");
	layerBox = this.CreateGroup("boxes");
	layerText = this.CreateGroup("text");
	
	// If we should use the radius for the key, adjust to that
	if (this.keyOnRadius) {
		this.keyX = this.center.x + this.radius + 5;
		this.keyY = this.center.y - this.radius + this.gutter;
		
	// Otherwise, just use max X & min Y
	} else {
		this.keyX = this.max_x || 0;
		this.keyY = this.min_y;
	}
	
	this.sortedArray = this.data.slice();
	
	// First, sort by size (unless the user requested otherwise)
	if (this.sort) {
		this.sortedArray = this.sortedArray.sort(function (a, b) {
			if (a.x > b.x) {
				return -1;
			} else if (a.x < b.x) {
				return 1;
			}

			return 0;
		});
	}
	
	// Loop through our newly sorted array to draw things
	for (sIdx = 0; sIdx < this.sortedArray.length; sIdx += 1) {
		datum = this.sortedArray[sIdx];
		dIdx = datum.id;
		perc = (datum.x / this.total);
		r = datum.y || this.radius;

		// Color the font to match the data
		this.fontStyle.fill.color = style.fill.color = KIP.Functions.GenerateColor("", this.hslRotate);
		
		// If there's only one element, just draw a circle
		if (this.data.length === 1) {
			elem = this.AddCircle(this.center.x, this.center.y, r, this.style, "", "", layerWedge);
		
		// Otherwise, draw a wedge
		}else {
			elem = this.AddPerfectArc(this.center, r, lastDeg, lastDeg + (perc * 360), 1, false, style, "", "", layerWedge);
		}
		
		// ========== LABELS =========
		if (this.addLabels) {
			// If we are showing the labels around the data, use our standard function
			if (!this.labelAtTop) {
				text = this.AddTextAroundRing(datum.lbl, lastDeg, lastDeg + (perc * 360), elem, r, "", "", layerText, this.rotate);

			// Otherwise, show it at the top of the graph
			} else {
				text = this.AddText(elem, datum.lbl, this.center.x - this.radius, this.center.y - this.radius - 16, this.fontStyle, "", "", "",  layerText);
				box = this.MeasureElem(text);
				textBox = this.AddRectangle(box.x, box.y, box.width, box.height, {fill: {type: "solid", color: "#FFF"}}, "", "", layerBox);
			}
		}
		
		// Add a key for the graph
		if (this.addKey) {
			key = this.AddDataToKey(datum, layerText);
		}

		//Only show the text on hover
		this.AddPieceListeners(elem, text, textBox);
		this.AttachDataListeners(dIdx, elem);

		lastDeg += (perc * 360);
		
		// Store the elements we created into our elem array
		this.elems[dIdx] = {
			piece: elem,
			label: text,
			labelBox: textBox,
			color: style.fill.color,
			keyText: key
		};
	}

	// Add the final line to the key
	if (this.addKey) {
		this.fontStyle.fill.color = "#000";
		this.keyY += 5;
		this.AddDataToKey({x: this.total, lbl: "TOTAL"}, layerText);

		if (this.days) {
			this.AddDataToKey({x: KIP.Functions.RoundToPlace(this.total / this.days, 10), lbl: "Avg Day"}, layerText);
		}
	}
};

// PieGraph.AddDataToKey
//----------------------------------------------------------------------
/**
 * Adds a label to the key for the graph
 * @param {object} datum - The data we are adding to the key
 * @param {SVGGroup} layer - The SVG group to add this key display to
 */
KIP.Objects.PieGraph.prototype.AddDataToKey = function (datum, layer) {
	"use strict";
	var txt, box, style;
	
	// Add the text
	style = JSON.parse(JSON.stringify(this.fontStyle));
	style.font.size = "6";
	txt = this.AddText(undefined, datum.lbl + " : " + datum.x, this.keyX, this.keyY, style, "", "", "",  layer);
	
	// Calculate the measurements for next time
	box = this.MeasureElem(txt);
	this.keyY = this.keyY + box.height;
	
	return txt;
};

// PieGraph.AddAppropriateDataForGraph
//----------------------------------------------------------------------------
/**
 * Adds to our total of our pie graph
 * @param {number} idx - The index at which the data appears
 */
KIP.Objects.PieGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var datum;

	// Add to the total so we can get the percentages right
	datum = this.data[idx];
	this.total += datum.x;
	datum.id = idx;

	// Redraw if we have drawn before
	if (this.parent) {
		this.Draw();
	}
};

//====================== CIRCLE GRAPH =============================//
// CircleGraph
//---------------------------------------------------------------
/**
 * Creates a graph with multiple rings to show multiple data sets on a circle
 * @param {string} id - The unique identifier for this graph
 * @param {object} [center] - The center point for this graph
 * @param {number} [center.x] - The x position of the center point of the graph
 * @param {number} [center.y] - The y position of the center point of the graph
 * @param {number} [radius] - The size of the graph
 * @param {object} [style] - The style to use for the graph
 */
KIP.Objects.CircleGraph = function (id, center, radius, style) {
	"use strict";
	this.center = center || {x: 80, y: 80};
	this.radius = radius || 30;
	this.ringTotals = [];
	this.style = style || {stroke : {type: "solid", color : "#000", width: "5px"}, fill : {}};
	this.fontStyle = {font: {family: "Segoe UI", size: "10px"}, fill: {type: "solid"}};
	this.strokeWidth = 5;
	
	// Implements a circular graph
	KIP.Objects.CircularGraph.call(this, id, KIP.Constants.GraphTypeEnum.Circle);
};

// Implements the CircularGraph object as its prototype
KIP.Objects.CircleGraph.prototype = Object.create(KIP.Objects.CircularGraph.prototype);

// CircleGraph.Refresh
//---------------------------------------------------------
/**
 * Draws all of the pieces of the graph and adds listeners and labels
 */
KIP.Objects.CircleGraph.prototype.Refresh = function () {
	"use strict";
	var colors, text, dIdx, datum, max, perc, elem, ring, width, r, lastDeg, nextDeg, c, opacity, layerRings, layerText;

	// Creates the layers for the circle graph
	layerRings = this.CreateGroup("rings");
	layerText = this.CreateGroup("text");
	
	// Initialize some variables we need
	max = Math.max.apply(this, this.ringTotals);
	colors = {};
	lastDeg = [];

	// Loop through all of the data we have available
	for (dIdx = 0; dIdx < this.data.length; dIdx += 1) {
		datum = this.data[dIdx];

		// If we don't yet have a color for this label, create a new one
		if (!colors[datum.lbl]) {
			colors[datum.lbl] = KIP.Functions.GenerateColor(datum.lbl, KIP.Constants.HSLPieceEnum.Hue);
		}
		c = colors[datum.lbl];

		// Pull out the pieces of data we need
		ring = datum.y;
		width = datum.z * this.strokeWidth;

		// Calculate what degree this piece of data should appear at
		if (!lastDeg[ring]) {
			lastDeg[ring] = 0;
		}
		nextDeg = ((datum.x * 360) / max) + lastDeg[ring];

		// If the ring is negative, it should be displayed as a ghost ring
		if (ring < 0) {
			ring = -1 * ring;
			opacity = 0.4;
		} else {
			opacity = 1;
		}

		// Set up the style and radius
		r = this.radius + ((this.radius / 2) * ring);
		this.style.stroke.width = width + "px";
		this.style.stroke.color = c;

		// Add the element and its hover text
		elem = this.AddPerfectArc(this.center, r, lastDeg[ring], nextDeg, 1, true, this.style, "", "", layerRings);
		elem.style.opacity = opacity;
		text = this.AddTextAroundRing(datum.lbl, lastDeg[ring], nextDeg, elem, r + (width - this.strokeWidth), "", "", layerText);
		this.div.appendChild(elem);
		
		// Add event listeners
		this.AddPieceListeners(elem, text);
		this.AttachDataListeners(dIdx, elem);
		
		// Increment the degree count
		lastDeg[ring] = nextDeg;
	}
};

// CircleGraph.AddDataAppropriateForGraph
//------------------------------------------------------------------------------
/**
 * Adds data to the circlegraph specific data collections
 * @param {number} idx - THe index at which the raw data lives
 */
KIP.Objects.CircleGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var ring, datum;

	datum = this.data[idx];
	ring = datum.y;

	if (ring < 0) {
		ring = -1 * ring;
	}

	// Add to the total for this ring
	if (!this.ringTotals[ring]) {
		this.ringTotals[ring] = 0;
	}

	this.ringTotals[ring] += datum.x;

	// Redraw if we have drawn before
	if (this.parent) {
		this.Draw();
	}
};

//====================== TRENDING GRAPH ==============================//
KIP.Objects.TrendingGraph = function (id, minX, minY) {
	this.min_x = minX || 10000000;
	this.min_y = minY || 10000000;
	this.hslRotate = KIP.Constants.HSLPieceEnum.Hue;
	
	this.style = {fill: {}, stroke: {type: "solid", width: "0.2"}, font : {family: "Calibri"}};
	this.fontStyle = {fill : {type: "solid"}, font : {family: "Calibri"}};
	// Call the constructor for the graph
	KIP.Objects.Graph.call(this, id,  KIP.Constants.GraphTypeEnum.Trend);
};

KIP.Objects.TrendingGraph.prototype = Object.create(KIP.Objects.Graph.prototype);

KIP.Objects.TrendingGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var datum;
	
	datum = this.data[idx];
	
	this.UpdateView(datum.x, datum.y, 1, 1);
};

KIP.Objects.TrendingGraph.prototype.AddLineListeners = function (line, lbl, box) {
	"use strict";
	var that = this;
	if (!line || !lbl) return;

	line.addEventListener("mouseover", function () {
		lbl.style.opacity = 1;
		line.style.strokeWidth = (that.style.stroke.width * 3) + "px";
		if (box) box.style.opacity = 0.8;
	});

	line.addEventListener("mouseout", function () {
		lbl.style.opacity = 0;
		line.style.strokeWidth = that.style.stroke.width + "px";
		if (box) box.style.opacity = 0;
	});

	lbl.style.opacity = 0;
};

KIP.Objects.TrendingGraph.prototype.Refresh = function () {
	"use strict";
	var datum, sorted, lastLine, dIdx, ptLayer, txtLayer, lastElem, xDiff, yDiff, txt;
	
	// Sort the array by the z value
	sorted = this.data.slice();
	sorted = sorted.sort(function (a, b) {
		if (!a || !b) return 0;
		if ((a.z === undefined) || (b.z === undefined)) return 0;
		
		if (a.z > b.z) {
			return 1;
		} else if (a.z < b.z) {
			return -1;
		}
		
		if (a.x > b.x) {
			return 1;
		} else if (a.x < b.x) {
			return -1;
		}
		
		return 0;
	});
	
	xDiff = this.max_x - this.min_x;
	yDiff = this.max_y - this.min_y;
	
	this.style.stroke.width = (Math.min(xDiff, yDiff) / 70);
	
	this.fontStyle.font.size = (this.style.stroke.width * 8);
	
	// Create the groups
	ptLayer = this.CreateGroup("pts");
	txtLayer = this.CreateGroup("txt");
	
	// Loop through our sorted data and draw our points and lines
	for (dIdx = 0; dIdx < sorted.length; dIdx += 1) {
		datum = sorted[dIdx];
		
		// If the last line doesn't match the current value, create a new line
		if (((datum.z === undefined) && !lastElem) || (lastLine !== datum.z)) {
			
			// Generate a color
		this.fontStyle.fill.color = this.style.stroke.color = KIP.Functions.GenerateColor("", this.hslRotate);
			
			if (datum.z !== undefined) lastLine = datum.z;
			lastElem = this.AddChild("path", {d : ""}, this.style, "", "", ptLayer);
			txt = this.AddText(lastElem, datum.lbl, datum.x, datum.y, this.fontStyle, "", "", "", txtLayer);
			
			this.AddLineListeners(lastElem, txt);
			this.MoveTo(datum.x, datum.y, lastElem);
		
		// Otherwise, add to the last line
		} else {
			this.LineTo(datum.x, datum.y, lastElem);
		}
	}
	
	//this.FinishPath(lastElem);
};
