/* globals KIP */

/**
 * Creates a view of a project in a Gantt Chart
 * @class ProjectWindow
 * @param {string} name - The name & ID of the project
 * @param {Date} start - The date at which the default viewing window should start. Can be a date string or a Date object
 * @param {Date} end   - OBSOLETE. The date at which the default viewing window should end. Can be a date string or a Date object
 * @param {Object} [dim]   - What the dimensions of SVG Element should be
 */
KIP.Objects.ProjectWindow = function (name, start, end, dim) {
	var view;
	this.name = name;
	this.id = name;
	this.rowHeight = 5;
	this.rowSpace = 2.5;

	this.unitWidth = 5;

	// Create collections for items & events
	this.items = [];
	this.events = [];
	this.rows = [];
	this.lines = [];
	this.headers = [];
	this.itemHeaders = [];

	this.importantDates = {};

	this.showWeekends = true;
	this.showOverallLbl = true;
	this.disableFill = false;
	this.showTitles = true;
	this.alwaysShowEvents = false;

	this.	monthColors = [
		"37c8ab",
		"#00aad4",
		"#0066ff",
		"#3737c8",
		"#7137c8",
		"#ab37c8",
		"#ff0066",
		"#ff2a2a",
		"#ff6600",
		"#ffcc00",
		"#abc837",
		"#37c837"
	];

	// Covert the start/end to dates if needed
	if (!start.getYear) {
		start = new Date(start);
	}
	if (!end.getYear) {
		end = new Date(end);
	}

	// Pieces that determine the relative length of items
	this.start = start;
	this.end = end;
	this.today = new Date();

	this.relStart = this.ConvertToProjectPoint(start);
	this.relEnd = this.ConvertToProjectPoint(end);
	this.relToday = this.ConvertToProjectPoint(this.today);

	// Pieces that determine the text bubble color
	this.bubbleColor = "#000";
	this.textColor = "#FFF";

	// Set the dimensions regardless of whether
	if (dim) {
		this.width = dim.width;
		this.height = dim.height;
	} else {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
	}

	// Create a SVG canvas for the project items
	KIP.Objects.SVGDrawable.call(this, this.id);

	// Set up the view for the object
	view = this.Resize();

	this.autoResize = false;
	this.AdjustSize(this.width, this.height, view);

	this.bottomBarPercentage = 0.5;
	this.bottomBarGap = 0.05;

	// Create the guidelines
	this.lineGrp = this.CreateGroup("lines");
	this.itemGrp = this.CreateGroup("items");
	this.eventGrp = this.CreateGroup("events");
	this.txtGrp = this.CreateGroup("textBubbles");
	this.headerGrp = this.CreateGroup("guideHeaders");
	this.overlayGrp = this.CreateGroup("overlay");

	// Create the div that will hold the bubbles
	this.textDiv = KIP.Functions.CreateSimpleElement("svgText");
	this.headerDiv = KIP.Functions.CreateSimpleElement("svgHeaders");

	this.CreateGuidelines();
	// Setup the color array for segments
	this.segmentColors = [];

	// Add listener for resizing
	this.AddWindowListeners(dim);
};

/** Inherits from the SVGDrawable class */
KIP.Objects.ProjectWindow.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

/**
 * Adds listeners to the window in general, like resizing
 * @param {Object} [dim] - The original dimensions of the project window
 */
KIP.Objects.ProjectWindow.prototype.AddWindowListeners = function (dim) {
	"use strict";
	var w_h, w_w, that;
	w_h = window.innerHeight;
	w_w = window.innerWidth;
	that = this;

	window.addEventListener("resize", function () {
		var view;
		if (dim) {
			that.width = (dim.width * window.innerWidth) / w_w;
			that.height = (dim.height * window.innerHeight) / w_h;
		} else {
			that.width = window.innerWidth;
			that.height = window.innerHeight;
		}
		view = that.Resize();
		that.CreateGuidelines();
		that.AdjustSize(that.width, that.height, view);
		that.Draw();
	});
};

/**
 * Handle a resize of the window
 */
KIP.Objects.ProjectWindow.prototype.Resize = function () {
	"use strict";
	var ratio = this.width / this.height;
	this.viewH = (this.rowHeight * 40);
	this.viewW = (this.unitWidth * 40 * ratio);
	this.viewX = 0;
	this.viewY = 0;
	return this.CreateView();
};

/**
 * Takes in an input and returns the relative poisition on the default start date
 * 
 * @param {Date} input - A date or date string that should be converted to a relative date
 * @param {Date} [start] - If provided, will compare this as the baseline point 
 *
 * @returns {number} Where the relative date falls on the relative timeline
 */
KIP.Objects.ProjectWindow.prototype.ConvertToProjectPoint = function (input, start) {
	"use strict";
	var diff;

	start = start || this.start;

	if (!this.showWeekends) {
		diff = KIP.Functions.BusinessDateDiff(input, start, true);
	} else {
		diff = KIP.Functions.DateDiff(input, start, true);
	}
	return diff;
};

/**
 * Takes a relative project point and reverts it to its original point.
 * 
 * @param {number} pt - The relative date to convert
 * 
 * @returns {Date} The reverted date
 */
KIP.Objects.ProjectWindow.prototype.RevertFromProjectPoint = function (pt){
	var dt, tmp;
	dt = new Date(this.start);

	// We need to add weekends back in if we are currently excluding them
	if (!this.showWeekends) {
		pt += 2 * Math.floor((pt + this.start.getDay()) / 5) + 1;
	}

	// Calculate the reverse date
	dt.setDate(dt.getDate() + pt);
	return dt;
};

KIP.Objects.ProjectWindow.prototype.AddGrouper = function (lbl) {
	"use strict";
	
}
/**
 * Adds a timeline item to the view
 * 
 * @param {date} s - The start date for the item
 * @param {date} e - The end date for the item
 * @param {string} lbl - What to use to display information about the item
 * @param {array} topSegments - An array of objects to use for the display of the top part of the row
 * @param {array} bottomSegments - An array of objects to use for the display of the bottom part of the row
 * 
 * @returns {SVGElement} The item that was created
 */
KIP.Objects.ProjectWindow.prototype.AddItem = function (s, e, lbl, topSegments, bottomSegments, addl) {
	"use strict";
	var idx, item, sIdx, segment, row, y, x, div, start, end, sDt, segHeight, segEnd, ctx, that;
	that = this;

	// Convert to dates if needed
	if (!s.getYear) {
		s = new Date(s);
	}
	if (!e.getYear) {
		e = new Date(e);
	}

	// Grab the relative dates from the real dates
	start = this.ConvertToProjectPoint(s);
	end = this.ConvertToProjectPoint(e);

	idx = this.items.length;
	row = this.GetRow(start, end);

	// Create the appropriate item object
	item = this.items[idx] = {
		grp: this.CreateGroup("item" + idx, this.itemGrp),
		lbl: lbl,
		row: row,
		start: s,
		end: e,
		x: start * this.unitWidth,
		y: (row * this.rowHeight * this.rowSpace),
		width: (end + start) * this.unitWidth,
		id: idx,
		eventGrp: this.CreateGroup(idx + "|events", this.eventGrp),
		addl: addl
	};

	// Loop through the top segments & draw
	this.CreateSegments(topSegments, item, start, end, row);

	// Try to add the bottom segments as well
	if (!bottomSegments) {
		bottomSegments = topSegments;
	}

	this.CreateSegments(bottomSegments, item, start, end, row, true)

	// Create a context menu 
	item.ctx = this.AddContextMenu(item);
	
	// Create some text that should apply to
	if (this.showTitles) {

		// Try to overlay text above the item
		this.fillProperty.color = "#000";
		this.fillProperty.opacity = 0.8;
		this.fontProperty.size = (2 * this.rowHeight / 3);
		item.text = this.AddText(item.grp, lbl + "   " + KIP.Functions.ShortDate(s) + " - " + KIP.Functions.ShortDate(e), this.unitWidth / 2, -1, "", {x: 0, y: 1}, item.grp)

		this.fillProperty.opacity = 1;
	}
	
	// Add to our row tracker as appropriate
	if (!this.rows[row]) {
		this.rows[row] = [];
	}
	this.rows[row].push(item);
	return item;
};

/**
 * Creates a context menu for the item
 * 
 * @param {Object} item - The item to add the menu to
 * 
 * @returns {ContextMenu} The menu to display for this element
 */	
KIP.Objects.ProjectWindow.prototype.AddContextMenu = function (item) {
	"use strict";
	var ctx, that;
	that = this;

	// Create a context menu for this element
	ctx = new KIP.Objects.ContextMenu(item.grp);

	// Create the option to expand or collapse the task
	ctx.AddOption("Expand/Collapse", function () {
		that.ExpandItem(item);
	});

	//ctx.AddOption("Remove");
	
	// Draws the context menu on the body
	ctx.Draw(document.body);
	
	// Add the ctxMenu css
	KIP.Functions.CreateCSSClass(".ctxMenu", [
		{key: "border-radius", val: "5px"},
		{key: "padding", val: "5px 0"},
		{key: "background-color", val: "#444"},
		{key: "color", val: "#FFF"},
		{key: "font-family", val: ' "Segoe UI", "Calibri"'}
	]);
	
	// Add the basic context option CSS
	KIP.Functions.CreateCSSClass(".ctxOption", [
		{key: "padding", val: "5px 10px"},
	]);
	
	// Add the highlighted context option CSS
	KIP.Functions.CreateCSSClass(".ctxOption:hover", [
		{key: "color", val: "#444"},
		{key: "background-color", val: "#FFF"},
		{key: "cursor", val: "pointer"}
	]);

	return ctx;
};

/**
 * Grabs the row at which an item appears
 * @param {Object} item - The item to grab the row of
 * @returns {number} The row at which the item appears
 */
KIP.Objects.ProjectWindow.prototype.GetRowOfItem = function (item) {
	"use strict";
	var rIdx, rIt;

	// First try just to grab the item's row
	if (item && item.row) {
		return item.row;
	}

	// Loop backwards as it will wusually be the last item added
	for (rIdx = (this.rows.length - 1); rIdx >= 0; rIdx += 1) {
		for (rIt = 0; rIt < this.rows[rIdx].length; rIt += 1) {
			if (this.rows[rIdx][rIt] === item) {
				return rIdx;
			}
		}
	}
};

/**
 * Creates the top/bottom segments of an item
 * @param {Array} arr - The segments to create
 * @param {Object} item - The item to add this to
 */
KIP.Objects.ProjectWindow.prototype.CreateSegments = function (arr, item, start, end, row, isBottom) {
	"use strict";
	var idx, x, lastX, segEnd, sDt, first;

	lastX = start;
	first = true;

	// Loop through each of the segments
	for (idx = 0; idx < arr.length; idx += 1) {
		if (!arr[idx]) continue;

		sDt = arr[idx].end;

		if (!sDt.getYear) {
			sDt = new Date(sDt);
		}
		segEnd = this.ConvertToProjectPoint(sDt);
		x = lastX;

		if (!first) {
			x += 0.5;
		} else {
			first = false;
		}

		// Try to draw the segment
		if (segEnd >= lastX) {
			this.CreateSegment(item, {x: x, y: row}, segEnd, arr[idx], idx, isBottom);

		// Handle the error case of something not actually being a forward rectangle
		} else {
			console.log("\nError in segment creation\nStart: " + x + " End: " + segEnd);
		}

		lastX = segEnd;
	}

	if (this.disableFill) return;

	// If we haven't hit the end, create a last segment
	if (lastX !== end) {
		if (first) {
			x = start;
		} else {
			x = lastX + 0.5;
		}

		this.CreateSegment(item, {x: x, y: row}, end, {lbl: "??"}, -1, isBottom);
	}
};

/**
 * Creates a segment for a piece of the project plan.
 *
 * @param {Object} item - The item this is being created for
 * @param {Object} start - The start x & y value
 * @param {number} end - At what point the segment ends
 * @param {Object} data - Any additional available data about the segment
 * @param {number} idx - What index of segment we are creating
 * @param {bool} isBottom - True if we are drawing the bottom set of segments
 *
 * @returns {SVGDrawable} The created segment
 */
KIP.Objects.ProjectWindow.prototype.CreateSegment = function (item, start, end, data, idx, isBottom) {
	"use strict";
	var segment, div, y, height, x, width;

	// Adjust the top value as appropriate
	y = start.y * this.rowHeight * this.rowSpace;
	height = this.rowHeight * (1 - this.bottomBarPercentage);

	if (isBottom) {
		y += (this.bottomBarGap * this.rowHeight) + (this.rowHeight * (1 - this.bottomBarPercentage));
		height = (this.rowHeight * this.bottomBarPercentage);
	}

	// Set the x & width values for readability
	x = start.x * this.unitWidth;
	width = ((end - start.x) * this.unitWidth) + (0.5 * this.unitWidth);
	if ((width < 0) || (isNaN(width))) {
		console.log("Err: improper width for segment");
		return;
	}

	// Set the appropriate color & fill properties
	this.SetSegmentStyle(data, idx);

	// Create the segment and label
	segment = this.AddRectangle(x, y, width, height, "", item.grp);
	div = this.AddTextBubble(data.lbl + "<br>[" + data.type + " on " + data.end + "]", segment, item, "", "", "", (y + (6 * height)) - item.y);

	return segment;
};

/**
 * Sets the style for the provided segment. Can be overriden by individual implementations
 * @param {SVGElement} segment - Data about the segment to set the appropriate color 
 * @param {number} idx - The index of the segment
 */
KIP.Objects.ProjectWindow.prototype.SetSegmentStyle = function (segment, idx) {
	"use strict";
	if (!this.segmentColors[idx]) {
		this.segmentColors[idx] = KIP.Functions.GenerateColor(idx, KIP.Constants.HSLPieceEnum.Hue);
	}
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.segmentColors[idx];
};

/**
 * Adds data about an event without actually drawing it
 * 
 * @param {Object} item     - The item object to add event data to
 * @param {Date} pos      - The date at which this event should appear. Accepts a date string or Date object
 * @param {String} lbl      - What label should appear for the event on hover
 * @param {Object} addlInfo - Any additional information needed about the event
 * 
 * @returns {Object} The data about the created event
 */
KIP.Objects.ProjectWindow.prototype.AddEventData = function (item, pos, lbl, addlInfo) {
	"use strict";
	var ev, dt, pt, row, x ,y;

	if (!item) return;

	if (!pos.getYear) {
		dt = new Date(pos);
	}
	pt = this.ConvertToProjectPoint(dt);

	x = pt * this.unitWidth;

	row = this.GetRowOfItem(item);
	y = row * this.rowSpace * this.rowHeight;

	ev = {
		lbl: lbl,
		date: pos,
		prjPt: pt,
		row: row,
		x: x,
		y: y,
		addl: addlInfo
	};

	// Add to our array
	if (!item.events) {
		item.events = [];
	}
	item.events.push(ev);

	// return the created object
	return ev;
};

/**
 * Adds an event & draws it
 * 
 * @param {Object} item - The item object to add event data to
 * @param {Object} [ev] - If available, the data that was already created for this event. Created if not passed in
 * @param {Date} [pos] - The date at which this event should appear. If ev is passed in, this is ignored
 * @param {String} [lbl] - The label that should appear for this event. If ev is passed in, this is ignored
 * @param {Object} [addlInfo] - Any additional info available for the event
 * 
 * @returns {SVGElement} The event that was created
 */
KIP.Objects.ProjectWindow.prototype.AddEvent = function (item, ev, pos, lbl, addlInfo, large) {
	"use strict";
	var date, row, dx, dy, txt, event;

	// Quit if we don't have an item
	if (!item) return;

	// Grab the appropriate data
	if (!ev) {
		ev =this.AddEventData(item, pos, lbl, addlInfo);
	}

	// Grab the offset valies we should use
	dx = this.unitWidth / 8;
	dy = this.rowHeight / 3;

	// Set attributes for the event
	this.fillProperty.type = "solid";
	if (ev.addl) {
		if (ev.addl.idx || ev.addl.idx === 0) {
			this.fillProperty.color = this.segmentColors[ev.addl.idx];
		} else if (ev.addl.color) {
			this.fillProperty.color = ev.addl.color;
		}
	}  else {
		this.fillProperty.color = "#FFF";
	}

	// Set the appropriate line properties
	
	this.fillProperty.opacity = 1;


	// Create a marker for the event
	if (large) {
		this.lineProperty.type = "solid";
		this.lineProperty.width = (dx );
		this.lineProperty.color = "#333";
		
		event = this.AddPath([
			{x: ev.x - dx, y: ev.y - dy},
			{x: ev.x - dx, y: ev.y},
			{x: ev.x, y: ev.y + (0.5 * dy)},
			{x: ev.x + dx, y: ev.y},
			{x: ev.x + dx, y: ev.y - dy}
		], {id: "ev." + this.events.length}, item.eventGrp);
	} else {
		event = this.AddRectangle(ev.x, ev.y, this.unitWidth / 10, this.rowHeight * (1 - this.bottomBarPercentage), {id: "ev." + this.events.length}, item.eventGrp);
	}

	txt = this.AddTextBubble(ev.lbl, event, item);
	
	this.lineProperty.type = "none";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";

	return event;
};

/**
 * Removes all events linked to an event from the canvas (but not the internal collection)
 * Used to only draw events on zoom in
 * @param {Object} item - The item to remove events from
 */
KIP.Objects.ProjectWindow.prototype.RemoveEvents = function (item) {
	"use strict";
	item.eventGrp.innerHTML = "";
};

/**
 * Adds all events in an item's internal array to the canvas.
 * Used to only draw events on zoom in
 * @param {Object} item - The item to add events to.
 */
KIP.Objects.ProjectWindow.prototype.AddEvents = function (item, large) {
	"use strict";
	var ev, event;
	
	if (!item.events) return;
	
	for (ev = 0; ev < item.events.length; ev += 1) {
		this.AddEvent(item, item.events[ev], "", "", "", large);
	}
};

/**
 * Expands an item to fill the screen. 
 * Allows the view of more details about the event
 * @param {Object} item - The item to expand
 */
KIP.Objects.ProjectWindow.prototype.ExpandItem = function (item) {
	"use strict";
	var scaleCoord, posCoord, w, h;

	// Handle collapsing
	if (item.expanded) {
		// Remove from the overlay
		this.overlayGrp.removeChild(item.grp);
		this.overlayGrp.removeChild(this.overlay);
		this.overlayGrp.removeChild(item.eventGrp);

		this.itemGrp.appendChild(item.grp);
		this.eventGrp.appendChild(item.eventGrp);
		item.expanded = false;
		this.expanded = null;
		this.div.style.cursor = "-webkit-grab";

		item.grp.removeAttribute("transform");
		item.eventGrp.removeAttribute("transform");

		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item);
		}
		
		item.text.style.fill = "#000";
		item.text.removeAttribute("transform");

	// Handle expanding
	} else {
		// Create the overlay
		this.fillProperty.opacity = 0.8;
		this.fillProperty.color = "#000";
		this.fillProperty.type="solid";
		this.overlay = this.AddRectangle(this.viewX, this.viewY, this.viewW, this.viewH, "", this.overlayGrp);

		this.itemGrp.removeChild(item.grp);
		this.eventGrp.removeChild(item.eventGrp);
		this.overlayGrp.appendChild(item.grp);
		this.overlayGrp.appendChild(item.eventGrp);
		item.expanded = true;
		this.expanded = item;
		this.div.style.cursor = "default";

		// Calculate the appropriate coordinates
		w = document.documentElement.clientWidth || window.innerWidth;
		h = document.documentElement.clientHeight || window.innerHeight;
		scaleCoord = this.CalculateSVGCoordinates(w - 20, (2 * h / 3));
		posCoord = this.CalculateSVGCoordinates(20, (window.innerHeight) / 3);
		scaleCoord.x -= posCoord.x;
		scaleCoord.y -= posCoord.y;

		// Actually do the resizing
		this.ResizeAndRepositionItem(item, {
			w: scaleCoord.x,
			h: scaleCoord.y,
			x: posCoord.x,
			y: posCoord.y
		});
		
		item.text.style.fill = "#FFF";
		item.text.setAttribute("transform", "translate(0," + (-0.25 * this.MeasureElem(item.text).height) + ")");
		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item, true);
		}
	}
};

/**
 * Gets the row at which an item should appear, before the item is created
 * 
 * @param {Date} start - The start date of the event we are getting the row for
 * @param {Date} end - The end date of the event we are getting the row for
 * 
 * @returns {number} The row number for this item
 */
KIP.Objects.ProjectWindow.prototype.GetRow = function (start, end) {
	"use strict";

	// TODO eventually: allow multiple elements per row
	return this.rows.length;
};

/**
 * OBSOLETE Creates a text bubble as an SVG
 * @param {number} x      The x coordinate the bubble should appear at
 * @param {number} y      The y coordinate the bubble should appear at
 * @param {String} lbl    The label that should appear in the bubble
 * @param {SVGGroup} layer - The layer at which this bubble should be added
 * @param {Object} origin - The origin of the text that will be displayed
 * @returns {SCGElement} The bubble that is created
 */
KIP.Objects.ProjectWindow.prototype.AddSVGTextBubble = function (x, y, lbl, layer, origin) {
	"use strict";
	var rect, text, attr, dim, grp;

	 grp = this.CreateGroup(lbl + "bubble", layer);

	if (lbl === "") {
		lbl = "??";
	}

	// Reset other properties
	this.lineProperty.type = "none";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";

	// Set the color attributes
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.bubbleColor;

	// Set the rectangle attributes
	attr = {
		rx: (this.rowHeight / 3),
		ry: (this.rowHeight / 3)
	};
	rect = this.AddRectangle(x, y, 0, 0, attr, grp);

	if (!origin)  {
		origin = {};
		origin.x = 0;
		origin.y = 0;
	}

	// Add the text
	this.fillProperty.color = this.textColor;
	this.fontProperty.family = "Segoe UI Semilight, Calibri, Arial";
	this.fontProperty.size = (this.rowHeight / 3) + "pt";
	text = this.AddText("", lbl, x, y, "", origin, grp);

	// Resize the rectangle to the size of the text
	dim = this.MeasureElem(text);
	rect.setAttribute("width", dim.width * 1.75);
	rect.setAttribute("height", dim.height * 1.65);
	rect.setAttribute("x", x);
	text.setAttribute("x", x + (dim.width * 0.37));
	rect.setAttribute("y", dim.y - (dim.height * 82.5));

	return grp;
};

/**
 * Adds a label hover bubble for an svg element. Stays in the same place for the DLG
 * 
 * @param {String} lbl - The label that should appear in the bubble
 * @param {SVGElement} elem - The element to add the bubble to
 * @param {Object} item - The item object that this bubble is generally being applied to
 * @param {number} [anchor_x] - The x-position at which a bubble should always appear
 * @param {number} [anchor_y] - The y-position at which a bubble should always appear
 * 
 * @returns {HTMLElement} The text bubble that was created
 */
KIP.Objects.ProjectWindow.prototype.AddTextBubble = function (lbl, elem, item, anchor_x, anchor_y) {
	"use strict";
	var div, that;
	
	if (!elem) return;

	// check if we've attched our element
	if (!this.textDiv.parentNode) {
		this.parent.appendChild(this.textDiv);
	}

	div = KIP.Functions.CreateSimpleElement("txt." + lbl, "textBubble", lbl);
	div.style.position = "absolute";
	div.style.backgroundColor = this.bubbleColor;
	div.style.color = this.textColor;
	div.style.fontFamily = "Calibri";
	div.style.padding = "3px";
	div.style.borderRadius = "5px";

	this.textDiv.appendChild(div);
	that = this;


	// Mouse in listener
	elem.addEventListener("mouseover", function (ev) {
		var x, y, box;
		// Quit if we've already revealed the bubble
		if (!KIP.Functions.HasCSSClass(div, "hidden")) return;

		box = elem.getBoundingClientRect();

		x = Math.round(box.left < 0 ? 0 : box.left);
		y = Math.round(box.top < 0 ? box.height : box.top + box.height);

		// Set the appropriate coordinates
		div.style.left = x + "px";
		div.style.top = y + "px";
		KIP.Functions.RemoveCSSClass(div, "hidden");
	});

	// Mouse out listener
	elem.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		if (rel === div) return;

		KIP.Functions.AddCSSClass(div, "hidden");
	});

	// Mouse in listener for the bubble
	div.addEventListener("mouseover", function (ev) {
		ev.stopPropagation();
		return false;

	});

	div.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		if (rel === elem) return;

		KIP.Functions.AddCSSClass(div, "hidden");
	});

	KIP.Functions.AddCSSClass(div, "hidden");

	return div;
};

/**
 * Creates the lines indicating dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuidelines = function () {
	"use strict";
	var num, lIdx, ln, func, relToday, x, dow, today, revDt, w, mult, coordA, coordB, noShow, shortDt, txt, txtColor, box;

	// Don't draw lines if they wouldn't show
	coordA = this.CalculateScreenCoordinates(this.viewX, this.viewY);
	coordB = this.CalculateScreenCoordinates(this.viewX + (this.unitWidth / 15), this.viewY);
	if ((coordB.x - coordA.x) === 0) {
		noShow = true;
	}

	// Even if they might be shown, don't show more than 200 lines
	if (this.viewW > (200 * this.unitWidth)) {
		noShow = true;
	}

	// Remove all old guildelines
	for (lIdx = this.lines.length - 1; lIdx >= 0; lIdx -= 1) {
		if (this.lines[lIdx] && this.lines[lIdx].parentNode) {
			this.lineGrp.removeChild(this.lines[lIdx]);
		}
	}

	this.lines = [];
	num = this.viewW / this.unitWidth;

	today = new Date();
	dow = today.getDay();
	relToday = this.ConvertToProjectPoint(today);

	// Set the fill properies for these lines
	this.fillProperty.type = "solid";
	this.lineProperty.type = "none";
	this.lineProperty.color = "rgba(0,0,0,0)";
	this.lineProperty.width = 0;

	// Loop throuh all visible lines at this point
	for (lIdx  = 0; lIdx < num; lIdx += 1) {
		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + (lIdx * this.unitWidth);
		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		shortDt = KIP.Functions.ShortDate(revDt);
		dow = revDt.getDay();
		txt = "";

		if (this.importantDates[shortDt]) {
			w = this.unitWidth;
			this.fillProperty.color = this.importantDates[shortDt].color;
			txt = this.importantDates[shortDt].lbl;
			txtColor = this.importantDates[shortDt].textColor;

		} else if (KIP.Functions.DateDiff(revDt, today) === 0) {
			this.fillProperty.color = "#8AE";
			w = this.unitWidth;

		} else if (this.showWeekends && (dow === 0 || dow === 6)) {
			this.fillProperty.color = "#DDD";
			w = this.unitWidth;

		} else if (!this.showWeekends && dow === 1) {
			if (noShow) continue;
			this.fillProperty.color = "#AAA";
			w = this.unitWidth / 20;

		} else {
			if (noShow) continue;
			this.fillProperty.color = "#EEE";
			w = this.unitWidth / 20;
		}

		ln = this.AddRectangle(x, this.viewY, w, this.viewH, "", this.lineGrp);
		this.lines.push(ln);

		// Draw the text for important dates
		if (txt) {
			this.fillProperty.color = txtColor;
			this.fontProperty.size = (2 * this.unitWidth / 3);
			txt = this.AddText(ln, txt, (0.5 * this.unitWidth),  (3 * this.rowHeight), "", {x: 0.5, y: 0.5}, this.lineGrp);
			box = this.MeasureElem(txt);
			txt.setAttribute("y", +txt.getAttribute("y") + (box.width / 2) + this.rowHeight);

			this.RotateElement(txt, -90);
			this.lines.push(txt);
		}
		
	}

	this.CreateGuideHeaders(noShow);
};

/**
 * Creates the headers for the dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuideHeaders = function (noNumbers) {
	"use strict";
	var num, header, txt, idx, revDt, x, months, mIdx, rect, month, w;

	// remove all of the old guide headers
	for (idx = this.headers.length - 1; idx >= 0; idx -= 1) {
		if (this.headers[idx] && this.headers[idx].parentNode) {
			this.headerGrp.removeChild(this.headers[idx]);
		}
	}

	this.headers = [];
	months = {};

	
	this.fillProperty.type="solid";
	this.fontProperty.size=(this.unitWidth / 2);
	this.fontProperty.family = "Segoe UI Light,Calibri";
	this.fillProperty.opacity = 1;

	num = this.viewW / this.unitWidth;
	for (idx = 0; idx < num; idx += 1) {

		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + ((idx - 1) * this.unitWidth);

		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		mIdx = revDt.getMonth() + "." + revDt.getYear();

		// Initialize the months index if appropriate
		if (!months[mIdx]) {
			months[mIdx] = {
				name: KIP.Functions.GetMonthName(revDt),
				start: x,
				month: revDt.getMonth(),
				year: revDt.getFullYear()
			}
		} else {
			months[mIdx].end = x;
		}

		// Don't raw numbers if we shouldn't be
		if (noNumbers) continue;

		// Create the day headers
		this.fillProperty.color = "#FFF";
		this.headers.push(this.AddRectangle(x, this.viewY + (this.rowHeight * 2), this.unitWidth, this.rowHeight, "", this.headerGrp));
		this.fillProperty.color="#68C";
		this.headers.push(this.AddText("", revDt.getDate(), x + (this.unitWidth / 4), this.viewY + (this.rowHeight * 2), "", {x: 0, y: 0}, this.headerGrp));

	}
	

	// Create the monthly headers
	for (mIdx in months) {
		if (months.hasOwnProperty(mIdx)) {

			month = months[mIdx];
			w = month.end - month.start + this.unitWidth;
			if ((w < 0) || (isNaN(w))) continue;

			// create a rectangle
			this.fillProperty.color = this.monthColors[month.month];
			this.headers.push(this.AddRectangle(month.start, this.viewY, w, this.rowHeight * 2, "", this.headerGrp));

			// create the text
			this.fillProperty.color = "#FFF";

			this.fontProperty.size = this.unitWidth;
			this.headers.push(this.AddText("", month.name.toUpperCase() + " " + month.year, month.start + (2 * this.unitWidth), this.viewY, "", {x: 0, y: 0}, this.headerGrp));
		}
	}
};

/**
 * Handle updating our guidelines on zoom
 * @param {number} amt - The amount that has been zoomed
 */
KIP.Objects.ProjectWindow.prototype.Zoom = function (amt) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Zoom.call(this, amt);
	this.CreateGuidelines();
	this.RefreshUI();
};

/**
 * Handle updating our guidelines on pan
 * @param {number} amtX - The x amount to move the viewbox
 * @param {number} amtY - The y amount to move the viewbox
 */
KIP.Objects.ProjectWindow.prototype.Pan = function (amtX, amtY) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Pan.call(this, amtX, amtY);
	this.CreateGuidelines();
	this.RefreshUI();
};

/** 
 * Allows the user to sort the items in the Gantt chart according to a particular sort function
 * @param {function} sortFunc - The function to sort the list by
 */
KIP.Objects.ProjectWindow.prototype.Sort = function (sortFunc, titleFunc) {
	"use strict";
	var i, y, h, lastH, headCb, that = this;

	// Clear any previous headers
	this.itemHeaders.map (function (elem) {
		if (!elem) return;
		if (!elem.div) return;
		if (elem.div.parentNode) {
			elem.div.parentNode.removeChild(elem.div);
		}
	});
	this.itemHeaders = [];
	
	// We need to rearrange the rows to the appropriate positions
	this.items.sort(sortFunc);

	// Also create headers for each of the sections
	this.items.map(function (elem, key, arr) {
		h = titleFunc(elem);
		if (lastH === h) return;
		that.AddItemHeader(key, h);
		lastH = h;
	});
	
	// Update the UI
	this.RefreshUI();
};

/** 
 * Clears all data about this project.
 */
KIP.Objects.ProjectWindow.prototype.Clear = function () {
	"use strict";
	var rIdx, idx, item;

	// Clear out the visible elements
	this.ClearUI();

	// Clear out our internal collections
	this.rows = [];
	this.items = [];
	this.events = [];
};

/** 
 * Clears the UI of the project, but not its internal data
 */
KIP.Objects.ProjectWindow.prototype.ClearUI = function () {
	"use strict";
	this.itemGrp.innerHTML = "";
	this.eventGrp.innerHTML = "";
	this.textDiv.innerHTML = "";
};

/**
 * Temporarily resizes an item via a transform matrix
 * 
 * @param {Object} item - The item to resize & reposition
 * @param {Object} newDim - The new dimensions to use for the item
 * @param {number} newDim.x - The new x position
 * @param {number} newDim.y - The new y position
 * @param {number} newDim.w - The new width of the item
 * @param {number} newDim.h - The new height of the item
 * @param {number} [newDim.scaleW] - The percentage to scale by. Used in place of w if provided
 * @param {number} [newDim.scaleH] - The percentage to scale by. Used in place of h if provided
 */
KIP.Objects.ProjectWindow.prototype.ResizeAndRepositionItem = function (item, newDim) {
	"use strict";
	var box, dx, dy, dw, dh, matrix;

	// Remove any previous transforms we had applied
	item.grp.removeAttribute("transform");

	// Measure the elem as it originally existed
	box = this.MeasureElem(item.grp);

	// Quit if width or height are zero
	if (box.width === 0) return;
	if (box.height === 0) return;

	// Calculate the deltas of the width & height
	dw = newDim.scaleW || (newDim.w / box.width);
	dh = newDim.scaleH || (newDim.h / box.height);

	// Calculate the deltas of the new x & y
	dx = newDim.x - box.x;
	dy = newDim.y - box.y;

	// Calculate what offset we'll need for the scaling
	dx += (-1 * (dw - 1) * box.x);
	dy += (-1 * (dh - 1) * box.y);

	// Create the matrix element to use
	matrix = "matrix(";
	matrix += dw + ", ";
	matrix += "0, 0, ";
	matrix += dh + ", ";
	matrix += dx + ", ";
	matrix += dy;
	matrix += ")";

	item.grp.setAttribute("transform", matrix);
	item.eventGrp.setAttribute("transform", matrix);
};

/**
 * Disables showing the titles inline
 * @param {boolean} [undo] - If true, enables the titles
 */
KIP.Objects.ProjectWindow.prototype.DisableTitles = function (undo) {
	"use strict";

	if (undo) {
		this.rowSpace = 2.5;
		this.showTitles = true;
	} else {
		this.rowSpace = 1.5;
		this.showTitles = false;
	}

	this.RefreshUI();
};

/** 
 * Changes the y position of an item
 * @param {Object} item - The item that is being adjusted
 * @param {number} newY - The new Y value that this item should appear at
 * @param {number} row  - The new row value of the item
 */
KIP.Objects.ProjectWindow.prototype.AdjustY = function (item, newY, row) {
	"use strict";
	var grp, c, child, origY, dy, tmp;

	this.rows[row] = [this.items[row]];
	this.items[row].row = row;
	this.items[row].y = newY;

	grp = item.grp;

	// Loop through all of the segments and adjust their position
	for (c = 0; c < grp.children.length; c += 1) {
		child = grp.children[c];
		tmp = child.getAttribute("y");

		// Make sure we account for both the top & bottom row
		if (!origY && (origY !== 0)) {
			origY = tmp;
		}

		if ((tmp !== origY) && (child !== item.text)) {
			dy = (+tmp) - (+origY);
		} else if (child === item.text) {
			dy = -1;
		} else {
			dy = 0;
		}

		child.setAttribute("y", newY + dy);
	}

	// Remove & redraws the associated events
	if (item.events) {
		item.events.map(function (elem) {
			elem.row = row;
			elem.y = newY;
		});
		this.RemoveEvents(item);
		this.AddEvents(item);
	}
};

/**
 * Refreshes the display so that new Y values are accommodated
 */
KIP.Objects.ProjectWindow.prototype.RefreshUI = function () {
	"use strict";
	var i, y, h_y, box, top;

	// Now loop through the events and assign new rows
	this.rows = [];
	h_y = 0;
	for (i = 0; i < this.items.length; i += 1) {

		// Show or hide the title as appropriate
		if (!this.showTitles) {
			if (this.items[i].text && this.items[i].text.parentNode) {
				this.items[i].text.parentNode.removeChild(this.items[i].text);
			}
		} else {
			if (this.items[i].text && !this.items[i].text.parentNode) {
				this.items[i].grp.appendChild(this.items[i].text);
			}
		}
		
		// Check if there is a header, and if so, draw it too
		if (this.itemHeaders[i]) {
			this.headerDiv.appendChild(this.itemHeaders[i].div);
			
			top = this.CalculateScreenCoordinates(0, h_y + this.rowSpace + (i * this.rowHeight * this.rowSpace)).y;
			top += this.div.getBoundingClientRect().top;
			this.itemHeaders[i].div.style.top = top + "px";
			box = this.itemHeaders[i].div.getBoundingClientRect();
			if (box.height > 0) {
				h_y += this.CalculateSVGHeight(box.height) + (1.5 * this.rowSpace);
			}
		}
	
		y = h_y + (i * this.rowHeight * this.rowSpace);
		this.AdjustY(this.items[i], y, i);

		
	}

	// Refresh all of the appropriate elements
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.AddItemHeader = function (idx, label) {
	"use strict";
	var h;
	
	// Add our header div if appropriate
	if (!this.headerDiv.parentNode) {
		this.parent.appendChild(this.headerDiv);
	}
	
	// Create a header to be added
	h = KIP.Functions.CreateSimpleElement("header" + idx, "header", label);
	
	// Save to our headers array
	this.itemHeaders[idx] = {
		div: h,
		lbl: label,
		key: idx
	};
	
};
/**
 * Adds an important date to our internal collection.
 */
KIP.Objects.ProjectWindow.prototype.AddImportantDate = function (startDate, lbl, color, textColor, endDate) {
	"use strict";
	var diff, dir, dt, dIdx, tmp;
	
	// Convert to a date if need be
	if (!startDate.getFullYear) {
		startDate = new Date(startDate);
	}
	
	// Convert the end date if we have it & get the difference between it & the start date
	diff = 0;
	dir = 1;
	
	if (endDate && !endDate.getFullYear) {
		endDate = new Date(endDate);
	}
	
	if (endDate) {
		diff = KIP.Functions.DateDiff(endDate, startDate);
		dir = (diff < 0) ? -1 : 1;
		diff = Math.abs(diff);
	}
	
	// Quit if the date isn't real
	if (!startDate || !startDate.getFullYear) return;
	tmp = new Date(startDate);
	for (dIdx = 0; dIdx <= diff; dIdx += dir) {
		dt = tmp;
		// Add to our important date array
		this.importantDates[KIP.Functions.ShortDate(dt)] = {
			date: dt,
			lbl: lbl,
			color: color || "#C30",
			textColor: textColor || "FFF"
		};
		dt = KIP.Functions.AddToDate(tmp, {days: 1});
	}

	// Redraw so the date is now incorporated
	this.CreateGuidelines();
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.CreateImportantDateForm = function (date, cb) {
	"use strict";

	var lblInput, bgLbl, bgColor, txtLbl, txtColor, startLbl, startDt, endLbl, endDt, accept, cancel, clear, that = this;

	if (!date) date = "";

	// Allow the user to name the date anything they want
	lblInput = KIP.Functions.CreateElement({
		type: "input",
		id: "dateLabel", 
		cls: "dateLabel",
		attr: [
		{key: "placeholder", val: "Label for important date"}
		]
	});

	// Field for allowing user to set the background color
	bgColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateBG",
		cls: "dateBG",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "rgb(0,0,0)"}
		]
	});
	bgLbl = KIP.Functions.CreateSimpleElement("bgColorLbl", "bgColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Background Color: "
		},
		bgColor
	]);

	// Allow the user to change the color of the text on top
	txtColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateTxtColor",
		cls: "dateTxtColor",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "#FFFFFF"}
		]
	});
	txtLbl = KIP.Functions.CreateSimpleElement("txtColorLbl", "textColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Text Color: "
		},
		txtColor
	]);

	// Let the user set the appropriate date
	startDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	startLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Start Date * : "
		},
		startDt
	]);
	
		// Let the user set the appropriate date
	endDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	endLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "End Date: "
		},
		endDt
	]);

	clear = function () {
		startDt.value = "";
		endDt.value = "";
		lblInput.value = "";
		bgColor.value = "#000000";
		txtColor.value = "#FFFFFF";
	};

	accept = KIP.Functions.CreateSimpleElement("impDateAccept", "impDateAccept", "Accept");
	accept.addEventListener("click", function () {
		var dStart, dEnd;
		dStart = startDt.value;
		dEnd = endDt.value;
		if (!dEnd) dEnd = dStart;
		if (dStart) {
			dStart = dStart.split("-");
			dEnd = dEnd.split("-");
			that.AddImportantDate(new Date(dStart[0], dStart[1] - 1, dStart[2]),
														lblInput.value,
														bgColor.value,
														txtColor.value,
														new Date(dEnd[0], dEnd[1] - 1, dEnd[2])
													 );
		}
		clear();
		that.ShowImportantDateForm("", cb);
	});

	cancel = KIP.Functions.CreateSimpleElement("impDateCancel", "impDateCancel", "Cancel");
	cancel.addEventListener("click", function () {
		clear();
		that.ShowImportantDateForm("", cb);
	});

	this.dateForm = KIP.Functions.CreateSimpleElement("impDateForm", "impDateForm", "", "", [startLbl, endLbl, lblInput, bgLbl, txtLbl, accept, cancel]);

	return this.dateForm;

};

KIP.Objects.ProjectWindow.prototype.ShowImportantDateForm = function (parent, cb) {
	"use strict";
	if (!this.dateForm) this.CreateImportantDateForm("", cb);

	if (this.dateFormShowing) {
		this.dateForm.parentNode.removeChild(this.dateForm);
		this.dateFormShowing = false;
	} else {
		parent.appendChild(this.dateForm);
		this.dateFormShowing = true;
	}

	if (cb) cb();
}

KIP.Objects.ProjectWindow.prototype.RemoveImportantDate = function (dt) {
	"use strict";
	delete this.importantDates[dt];
	this.CreateGuidelines();
	this.Draw();
}