/* globals KIP */

KIP.Objects.ProjectWindow = function (name, start, end, dim) {
	var view;
	this.name = name;
	this.id = name;
	this.rowHeight = 5;

	this.unitWidth = 5;

	// Create collections for items & events
	this.items = [];
	this.events = [];
	this.rows = [];
	this.lines = [];
	this.headers = [];

	this.showWeekends = true;
	this.showOverallLbl = true;
	this.disableFill = false;

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

	this.CreateGuidelines();
	// Setup the color array for segments
	this.segmentColors = [];

	// Add listener for resizing
	this.AddWindowListeners(dim);
};

KIP.Objects.ProjectWindow.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

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
}

KIP.Objects.ProjectWindow.prototype.Resize = function () {
	"use strict";
	var ratio = this.width / this.height;
	this.viewH = (this.rowHeight * 40);
	this.viewW = (this.unitWidth * 40 * ratio);
	this.viewX = 0;
	this.viewY = 0;
	return this.CreateView();
};

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

/**
 * Adds a timeline item to the view
 * @param {date} s - The start date for the item
 * @param {date} e - The end date for the item
 * @param {string} lbl - What to use to display information about the item
 * @param {array} topSegments - An array of objects to use for the display of the top part of the row
 * @param {array} bottomSegments - An array of objects to use for the display of the bottom part of the row
 */
KIP.Objects.ProjectWindow.prototype.AddItem = function (s, e, lbl, topSegments, bottomSegments) {
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
		y: row * this.rowHeight * 1.5,
		width: (end + start) * this.unitWidth,
		id: idx
	};

	// Loop through the top segments & draw
	this.CreateSegments(topSegments, item, start, end, row);

	// Try to add the bottom segments as well
	if (!bottomSegments) {
		bottomSegments = topSegments;
	}

	this.CreateSegments(bottomSegments, item, start, end, row, true)

	// Create a text bubble for the entire item
	if (this.showOverallLbl) div = this.AddTextBubble(lbl + "<br> (" + KIP.Functions.ShortDate(s) + " - " + KIP.Functions.ShortDate(e) + ")", item.grp, item, "0%");

	// Create some text that should apply to

	// Create a context menu for this element
	ctx = new KIP.Objects.ContextMenu(item.grp);
	ctx.AddOption("Expand", function () {
		that.ExpandItem(item);
	});
	ctx.AddOption("Remove");
	ctx.Draw(document.body);

	// Add to our row tracker as appropriate
	if (!this.rows[row]) {
		this.rows[row] = [];
	}
	this.rows[row].push(item);
	return item;
};

KIP.Objects.ProjectWindow.prototype.GetRowOfItem = function (item) {
	"use strict";
	var rIdx, rIt;

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
	y = start.y * this.rowHeight * 1.5;
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
	div = this.AddTextBubble(data.lbl + "<br>[" + data.type + " on " + data.end + "]", segment, item, "", "", (start.x * this.unitWidth) - item.x, (y + height) - item.y);

	return segment;
}

KIP.Objects.ProjectWindow.prototype.SetSegmentStyle = function (segment, idx) {
	"use strict";
	if (!this.segmentColors[idx]) {
		this.segmentColors[idx] = KIP.Functions.GenerateColor(idx, KIP.Constants.HSLPieceEnum.Hue);
	}
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.segmentColors[idx];
}

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
	y = row * 1.5 * this.rowHeight;

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
}

KIP.Objects.ProjectWindow.prototype.AddEvent = function (item, ev, pos, lbl, addlInfo) {
	"use strict";
	var ev, date, row, dx, dy, txt;

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
	if (addlInfo && (addlInfo.idx || addlInfo.idx === 0)) {
		this.fillProperty.color = this.segmentColors[addlInfo.idx];
	}  else {
		this.fillProperty.color = "#FFF";
	}

	// Set the appropriate line properties
	this.lineProperty.type = "solid";
	this.lineProperty.width = (dx );
	this.lineProperty.color = "#333";

	// Create the event group for this item (if it doesn't exist)
	if (!item.eventGrp) {
		item.eventGrp = this.CreateGroup(item.id + "|events", this.eventGrp);
	}

	// Create a marker for the event
	ev = this.AddPath([
		{x: ev.x - dx, y: ev.y - dy},
		{x: ev.x - dx, y: ev.y},
		{x: ev.x, y: ev.y + (0.5 * dy)},
		{x: ev.x + dx, y: ev.y},
		{x: ev.x + dx, y: ev.y - dy}
	], {id: "ev." + this.events.length}, item.eventGrp);

	txt = this.AddTextBubble(lbl, ev, item);

	return ev;

};

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

		item.grp.removeAttribute("transform");
		item.eventGrp.removeAttribute("transform");

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
	}

};

KIP.Objects.ProjectWindow.prototype.GetRow = function (start, end) {
	"use strict";

	// TODO eventually: allow multiple elements per row
	return this.rows.length;
}

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
}

/**
 * Adds a label hover bubble for an svg element. Stays in the same place for the DLG
 */
KIP.Objects.ProjectWindow.prototype.AddTextBubble = function (lbl, elem, item, anchor_x, anchor_y, svg_x, svg_y) {
	"use strict";
	var div, that;

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
		var x, y, svgCoord, itemCoord;
		// Quit if we've already revealed the bubble
		if (!KIP.Functions.HasCSSClass(div, "hidden")) return;

		svgCoord = that.CalculateScreenCoordinates(svg_x + item.x, svg_y + item.y);
		itemCoord = that.CalculateScreenCoordinates(item.x, item.y);

		// Find the appropriate x value, using anchors first...
		if (anchor_x || (anchor_x === 0)) {
			x = anchor_x;

		// Then static SVG coordinates...
		} else if (svgCoord.x|| (svgCoord.x === 0)) {
			x = svgCoord.x + "px";

		// Then the item coordinates for the parent group...
		} else if (itemCoord.x || (itemCoord.x === 0)) {
			x = itemCoord.x;

		// Finally, the event coordinates
		} else {
			x = ev.x + "px";
		}

		// Find the appropriate x value, using anchors first...
		if (anchor_y || (anchor_y === 0)) {
			y = anchor_y;

		// Then static SVG coordinates...
		} else if (svgCoord.y || (svgCoord.y === 0)) {
			y = svgCoord.y + "px";

		// Then the item coordinates for the parent group...
		} else if (itemCoord.y || (itemCoord.y === 0)) {
			y = itemCoord.y;

		// Finally, the event coordinates
		} else {
			y = ev.y + 20 + "px";
		}

		// Set the appropriate coordinates
		div.style.left = x;
		div.style.top = y;
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

};

/**
 * Creates the lines indicating dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuidelines = function () {
	"use strict";
	var num, lIdx, ln, func, relToday, x, dow, today, revDt, w;

	// Remove all old guildelines
	for (lIdx = this.lines.length - 1; lIdx >= 0; lIdx -= 1) {
		this.lineGrp.removeChild(this.lines[lIdx]);
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

		dow = revDt.getDay();

		if (KIP.Functions.DateDiff(revDt, today) === 0) {
			this.fillProperty.color = "#8AE";
			w = this.unitWidth;
		} else if (this.showWeekends && (dow === 0 || dow === 6)) {
			this.fillProperty.color = "#DDD";
			w = this.unitWidth;
		} else if (!this.showWeekends && dow === 1) {
			this.fillProperty.color = "#AAA";
			w = this.unitWidth / 20;
		} else {
			this.fillProperty.color = "#EEE";
			w = this.unitWidth / 20;
		}

		ln = this.AddRectangle(x, this.viewY, w, this.viewH, "", this.lineGrp);
		this.lines[lIdx] = ln;
	}

	this.CreateGuideHeaders();

};

KIP.Objects.ProjectWindow.prototype.CreateGuideHeaders = function () {
	"use strict";
	var num, header, txt, idx, revDt, x, months, mIdx, rect, month, w;

	// remove all of the old guide headers
	for (idx = this.headers.length - 1; idx >= 0; idx -= 1) {
		this.headerGrp.removeChild(this.headers[idx]);
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
 */
KIP.Objects.ProjectWindow.prototype.Zoom = function (amt) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Zoom.call(this, amt);
	this.CreateGuidelines();
};

/**
 * Handle updating our guidelines on pan
 */
KIP.Objects.ProjectWindow.prototype.Pan = function (amtX, amtY) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Pan.call(this, amtX, amtY);
	this.CreateGuidelines();
}

KIP.Objects.ProjectWindow.prototype.Sort = function (sortFunc) {
	"use strict";

	// We need to rearrange the rows to the appropriate positions

	// Refresh all of the appropriate elements
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.Clear = function () {
	"use strict";
	var rIdx, idx, item;

	// Clear out the visible elements
	this.ClearUI();

	// Clear out our internal collections
	this.rows = [];
	this.items = [];
	this.events = [];
}

KIP.Objects.ProjectWindow.prototype.ClearUI = function () {
	"use strict";
	this.itemGrp.innerHTML = "";
	this.eventGrp.innerHTML = "";
	this.textDiv.innerHTML = "";
}

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
