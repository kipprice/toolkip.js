/*globals KIP,document,console*/
/**
 * @file Functions that allow for easier creation of SVG elements
 * @author Kip Price
 * @version 1.0
 * @since 1.1
 */
/**
 * Creates an SVG parent that can be added to dynamically
 *
 * @param {String} id      The ID for the SVG element created
 * @param {Number} width   The width at which the SVG should display {optional: 0}
 * @param {Number} height  The height at which the SVG should display {optional: 0}
 * @param {String} view    The viewBox parameter that should be set for the created element {optional: "0 0 0 0"}
 * @param {String} content The contents of the SVG that should displayed {optional: ""}
 *
 * @returns {SVGElement} The SVG element that was created
 */
KIP.Functions.CreateSVG = function (id, width, height, view, content, noAspect) {
	"use strict";
	try {
		// Quit if we don't have an appropriate ID
		if (!id && (id !== 0)) return;

		// Create the element and set its ID
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("id", id);

		// Set the various sizing variables, or use defaults
		svg.setAttribute("width", width || 0);
		svg.setAttribute("height", height || 0);
		svg.setAttribute("viewBox", view || "0 0 0 0");
		svg.setAttribute("version", "1.1");

		// Give the new content
		if (content) svg.innerHTML = content;

		// Set a default for the aspect ratio
		if (!noAspect) {
			svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
		}

		return svg;
	} catch (e) {
		console.log("Error creating SVG");
	}
};

/**
 * Creates a piece of an SVG drawing
 *
 * @param {String} type - What type of SVG element we are drawing
 * @param {Object} attr - An object of key-value pairs of attributes to set for this element
 *
 * @returns {SVGElement} The element to be added to the SVG drawing
 */
KIP.Functions.CreateSVGElem = function (type, attr) {
	"use strict";
	try {
		var elem, key;

		// Create an element within the appropriate namespace
		elem = document.createElementNS("http://www.w3.org/2000/svg", type);

		// Loop through the various attributes and assign them out
		for (key in attr) {
			if (attr.hasOwnProperty(key)) {
				elem.setAttribute(key, attr[key]);
			}
		}

		// Return the resultant element
		return elem;
	} catch (e) {
		console.log("Error creating SVG element");
	}
};
