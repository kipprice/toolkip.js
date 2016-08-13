KIP.Objects.CanvasProject = function (id, options, config) {
	"use strict";
	this.id = id;

	this.elems = new KIP.Functions.Collection();

	// Configures the real size and the view size
	this.config = {
		width : config.w || window.innerWidth,
		height: config.h || window.innerHeight,
		top: config.y || 0,
		left: config.x || 0,
		viewWidth : config.v_w || config.w || window.innerWidth,
		viewHeight : config.v_h || config.h || window.innerHeight,
		viewTop : config.v_y || config.y || 0,
		viewLeft: config.v_x || config.x || 0
	};

	this.options = options || {};

	// Set defaults for the options variable


};

// Inherits from Drawable
KIP.Objects.CanvasProject.prototype = Object.create(KIP.Objects.Drawable.prototype);

//#region Adding elements
KIP.Objects.CanvasProject.prototype.AddItem = function (id, segments) {
	"use strict";

};

KIP.Objects.CanvasProject.prototype.AddEvent = function (id) {
	"use strict";
}
//#endregion

//#region Drawing things
KIP.Objects.CanvasProject.prototype.Refresh = function () {
	"use strict";
}

KIP.Objects.CanvasProject.prototype.RenderFrame = function () {
	"use strict";

}
//#endregion

//#region Helpers to convert between the different coordinate systems
KIP.Objects.CanvasProject.prototype.CalculateRelativePosition = function (x, y) {
	"use strict";
	var xRatio, yRatio, out;
	out = {};
	
	xRatio = this.config.viewWidth / this.config.width;
	yRatio = this.config.viewHeight / this.config.height;

	out.x = (xRatio * x) - this.viewLeft;
	out.y = (yRatio * y) - this.viewTop;

	return out;
}

KIP.Objects.CanvasProject.prototype.CalculateRelativeDimension = function (width, height) {
	"use strict";
	var out, start, end;
	out = {};
	start = this.CalculateRelativePosition(0, 0);
	end = this.CalculateRelativePosition(width, height);

	out.width = (end.x - start.x);
	out.height = (end.y - start.y);

	return out;
}

KIP.Objects.CanvasProject.prototype.CalculateScreenPosition = function (x, y) {
	"use strict";
	var xRatio, yRatio, out;
	out = {};
	
	xRatio = this.config.width / this.config.viewWidth;
	yRatio = this.config.height / this.config.viewHeight;

	out.x = (xRatio * (x + this.viewLeft));
	out.y = (yRatio * (y + this.viewTop));

	return out;
}

KIP.Objects.CanvasProject.prototype.CalculateScreenDimension = function (width, height) {
	"use strict";
	var out, start, end;
	out = {};
	start = this.CalculateScreenPosition(0, 0);
	end = this.CalculateScreenPosition(width, height);

	out.width = (end.x - start.x);
	out.height = (end.y - start.y);

	return out;
}
//#endregion


KIP.Objects.CanvasItem = function (id, parent, start, segments, events, lbl) {
	"use strict";
	this.id = id;
	this.start = start;
	this.parent = parent;
	this.segments = segments;
	this.events = events;
	this.lbl = lbl;
	this.position = {
		x: null,
		y: null
	};


	this.AddSegments();
}


KIP.Objects.CanvasItem.prototype.AddSegments = function () {
	"use strict";
	var sIdx, subSegments, subIdx, subSegment, lastX;

	lastX = this.start;

	// Loop through each of our segments
	for (sIDx = 0; sIdx < this.segments.length; sIdx += 1) {
		subSegments = this.segments[sIdx];

		// Loop through each of the sub-segments contained
		for (subIdx = 0; subIdx < subSegments.length; subIdx += 1) {
			subSegment = subSegments[subIdx];

			lastX = this.AddSegment(subSegment, lastX);

		}

	}
}

KIP.Objects.CanvasItem.prototype.AddSegment = function () {
	"use strict";
	
	// A segment has a set of 

}

KIP.Objects.CanvasItem.prototype.IsVisible = function (dim) {
	"use strict";

}

KIP.Objects.CanvasItem.prototype.IsSegmentVisible = function (dim) {
	"use strict";
}

KIP.Objects.CanvasItem.prototype.Draw = function (y) {
	"use strict";
	this.position.y = y;


}