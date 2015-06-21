/*globals KIP*/
/*************************************************************
 * Helper functions for trigonometric transforms
 * @author Kip Price
 * @version 1.1
 * @since v1.0
 ************************************************************/

/******************************************************
 * Draws a line between two specified points
 *
 * @param {obj} start Point object with keys "x" and "y"; represents the start point
 * @param {obj} end   Point object with keys "x" and "y"; represents the end point
 * @param {HTML Element} host  The parent element to draw this line on
 *
 * @return {HTML Element} The line that is drawn
 ******************************************************/
KIP.Functions.DrawLine = function (start, end, host) {
	"use strict";
	var angle, distance, div;
	distance = KIP.Functions.GetDistance(start, end);
	angle = KIP.Functions.GetAngle(start, end);

	// Create the div and give it minimal styling to show the line
	div = KIP.Functions.CreateSimpleElement("", "angledLine");
	div.style.position = "absolute";
	div.style.left = start.x + "px";
	div.style.top = start.y + "px";

	// Approriately assign the size of the element
	div.style.width = distance + "px";
	div.style.height = "1px";

	// Rotate to our specified degree
	div.style.transformOrigin = "0px 0px";
	div.style.transform = "rotate(" + angle + "deg)";

	// Add to the specified parent element
	host.appendChild(div);

	return div;
};

/******************************************************************
 * Draws a line between the two provided elements
 *
 * @param {HTML Element} start_elem The element to start the line at
 * @param {HTML Element} end_elem   The element to end the line at
 *
 * @return {HTML Element} The line that gets drawn
 ******************************************************************/
KIP.Functions.ConnectElements = function (start_elem, end_elem) {
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

	return KIP.Functions.DrawLine(start_point, end_point, parent);
};

/***************************************************
 * Finds the distance between the two provided points
 *
 * @param {obj} start An object with the keys "x" and "y" ; represents the start point
 * @param {obj} end   An object with the keys "x" and "y" ; represents the end point
 *
 * @return {long} The distance between the two points
 ***************************************************/
KIP.Functions.GetDistance = function (start, end) {
	"use strict";
	var distance, dx, dy;

	dx = (start.x - end.x);
	dy = (start.y - end.y);

	distance = Math.sqrt((dx * dx) + (dy * dy));
	return distance;
};

/************************************************
 * Finds the angle between two points
 *
 * @param {obj} start An object with the keys "x" and "y"; represents the origin point of the angle
 * @param {obj} end   An object with the keys "x" and "y"; represents the destination point of the angle
 *
 * @return {long} The angle (in degrees) between the two points
 ************************************************/
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
