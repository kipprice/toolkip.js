/*globals KIP*/
/**
 * @file Helper functions for trigonometric transforms
 * @author Kip Price
 * @version 1.1
 * @since v1.0
 */

/**
 * Draws a line between two specified points
 *
 * @param {Object} start - The start point of the line
 * @param {Number} start.x - The starting x position of the line
 * @param {Number} start.y - The starting y position of the line
 * @param {Object} end - The end point of the line
 * @param {Number} end.x - The ending x position of the line
 * @param {Number} end.y - The ending y position of the line
 * @param {HTMLElement} host - The parent element to draw this line on
 * @param {string} [lbl] - A label to apply to this 
 *
 * @return {HTMLElement} The line that is drawn
 */
KIP.Functions.DrawLine = function (start, end, host, lbl, lblNoRotate) {
	"use strict";
	var angle, distance, div, cls, lblElem;
	distance = KIP.Functions.GetDistance(start, end);
	angle = KIP.Functions.GetAngle(start, end);

	// Create a CSS class that can be overridden for general options
	cls = KIP.Functions.CreateCSSClass(".angledLine", {
		"position" : "absolute",
		"height" : "1px",
		"transform-origin" : "0px 0px"
	});
	
	// Create the div and give it minimal styling to show the line
	div = KIP.Functions.CreateSimpleElement("", "angledLine");
	div.style.left = start.x + "px";
	div.style.top = start.y + "px";

	// Approriately assign the size of the element
	div.style.width = distance + "px";

	// Rotate to our specified degree
	div.style.transform = "rotate(" + angle + "deg)";

	// Add to the specified parent element
	host.appendChild(div);

	// If there is also a label, create that
	if (lbl) {
		lblElem = KIP.Functions.CreateSimpleElement("", "lbl", lbl);
		if (lblNoRotate) {
			lblElem.style.transform = "rotate(" + (-1 * angle) + "deg)";
			lblElem.style.transformOrigin = "(0, 0)";
		}
		div.appendChild(lblElem);
	}
	return div;
};

/**
 * Draws a line between the two provided elements
 *
 * @param {HTMLElement} start_elem The element to start the line at
 * @param {HTMLElement} end_elem   The element to end the line at
 *
 * @return {HTMLElement} The line that gets drawn
 */
KIP.Functions.ConnectElements = function (start_elem, end_elem, lbl, lblNoRotate) {
	"use strict";
	var start_point, end_point, x_1, x_2, y_1, y_2, parent;

	// Set our parent to use when calculating the global offsets
	parent = KIP.Functions.FindCommonParent(start_elem, end_elem);

	// Set the values to be the center of each element
	x_1 = KIP.Functions.GlobalOffsetLeft(start_elem, parent) + (start_elem.offsetWidth / 2);
	x_2 = KIP.Functions.GlobalOffsetLeft(end_elem, parent) + (end_elem.offsetWidth / 2);
	y_1 = KIP.Functions.GlobalOffsetTop(start_elem, parent) + (start_elem.offsetHeight / 2);
	y_2 = KIP.Functions.GlobalOffsetTop(end_elem, parent) + (end_elem.offsetHeight / 2);

	// Create the objects for these points
	start_point = {x : x_1, y : y_1};
	end_point = { x : x_2, y : y_2};

	return KIP.Functions.DrawLine(start_point, end_point, parent, lbl, lblNoRotate);
};

/**
 * Finds the distance between the two provided points
 *
 * @param {Object} start - The first endpoint of the segment we are measuring
 * @param {Number} start.x - The x position of the first point
 * @param {Number} start.y - The y position of the first point
 * @param {Object} end - The second enpoint of the segment we are measuring
 * @param {Number} end.x - The x position of the second point
 * @param {Number} end.y - The y position of the second point
 *
 * @return {Number} The distance between the two points
 */
KIP.Functions.GetDistance = function (start, end) {
	"use strict";
	var distance, dx, dy;

	dx = (start.x - end.x);
	dy = (start.y - end.y);

	distance = Math.sqrt((dx * dx) + (dy * dy));
	return distance;
};

/**
 * Finds the angle between two points
 *
 * @param {Object} start - The origin point of an angle
 * @param {Number} start.x - The x position of the origin point
 * @param {Number} start.y - The y position of the origin point
 * @param {Object} end - The destination point of an angle
 * @param {Number} end.x - The x position of the end point
 * @param {Number} end.y - The y position of the end point
 *
 * @return {Number} The angle (in degrees) between the two points
 */
KIP.Functions.GetAngle = function (start, end) {
	"use strict";
	var dx, dy, q_sign, q_ang, angle;

	dx = (end.x - start.x);
	dy = (end.y - start.y);

	// Don't divide by zero
	if (dx === 0) return (dy < 0) ? 270 : 90;

	// Handle horizontals too
	if (dy === 0) return (dx < 0) ? 180 : 0;

	// Atan requires that all elements are positive
	q_sign = ((dx * dy) > 0) ? 1 : -1;
	q_ang = (dx < 0) ? Math.PI : 0;


	angle = Math.atan(Math.abs(dy) / Math.abs(dx));
	angle = ((angle * q_sign) + q_ang);

	return (angle * (180 / Math.PI));
};

KIP.Functions.DegreesToRadians = function (deg) {
	var result = ((Math.PI*deg) / 180);
	return result;
}

KIP.Functions.Contained = function (pt, rect) {
	"use strict";
	if (rect.bottom || rect.top || rect.left || rect.right) {
		if (pt.x < rect.left) return false;
		if (pt.x > rect.right) return false;
		if (pt.y < rect.top) return false;
		if (pt.y > rect.bottom) return false;
	} else {
		if (pt.x < rect.x) return false;
		if (pt.x > (rect.x + rect.width)) return false;
		if (pt.y < rect.y) return false;
		if (pt.y > (rect.y + rect.height)) return false;
	}
	
	return true;
}
