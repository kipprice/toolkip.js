/*globals KIP,document*/

/***********************************************************************
 * Creates an SVG parent that can be added to dynamically
 * 
 * @param {string} id      The ID for the SVG element created
 * @param {double} width   The width at which the SVG should display {optional: 0}
 * @param {double} height  The height at which the SVG should display {optional: 0}
 * @param {string} view    The viewBox parameter that should be set for the created element {optional: "0 0 0 0"}
 * @param {string} content The contents of the SVG that should displayed {optional: ""}
 *
 * @returns {SVG Element} The SVG element that was created
 ***********************************************************************/
KIP.Functions.CreateSVG = function (id, width, height, view, content) {

	// Quit if we don't have an appropriate ID
	if (!id && (id !== 0)) return;

	// Create the element and set its ID
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("id", id);

	// Set the various sizing variables, or use defaults
	svg.setAttribute("width",width || 0);
	svg.setAttribute("height",height || 0);
	svg.setAttribute("viewBox", view || "0 0 0 0");

	// Give the new color
	if (content) svg.innerHTML = content;
	return svg;
}

/**************************************************************
 * Creates a piece of an SVG drawing
 * 
 * @param {string} id   The ID to assign to this element
 * @param {string} type What type of SVG element we are drawing
 * @param {string} cls  What CSS class to apply to the element (useful for hover effects)
 * @param {obj} attr An object of key-value pairs of attributes to set for this element
 * 
 * @returns {SVG Child Element} The element to be added to the SVG drawing
 **************************************************************/
KIP.Functions.CreateSVGElem = function (id, type, cls, attr) {
	var elem, key;

	// Create an element within the 
	elem = document.createElementNS("http://www.w3.org/2000/svg", type);
	if (cls) elem.setAttribute("class", cls);

	// Loop through the various attributes and assign them out
	for (key in attr){
		if (attr.hasOwnProperty(key)) {
			elem.setAttribute(key, attr[key]);
		}
	}

	// Return the resultant element
	return elem;
};