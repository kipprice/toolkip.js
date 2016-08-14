KIP.Globals.Templates = {};

// A templated object allows you to take some HTML pattern and dynamically fill it
// It is loosely based on the jquery framework of templating
// If an element does not have an ID, it is not replaceable

// CreateTemplate
//------------------------------------------------
/**
 * Create a templated HTML object
 * @param {object} inObj - All details needed to create the template
 * @param {string} inObj.type - Determines how the contents are loaded. Can be "file" or "text".
 * @param {string} inObj.id - The identifier to save for the template
 * @param {string} [inObj.content] - Contains free-text string for inOBjs of type "text"
 * @param {string} [inObj.name] - Contains the name of the file to load for inObjs of type "file"
 **/
KIP.Functions.CreateTemplate = function (inObj) {
	"use strict";
	var content, processContents, processChildren, request;

	// processContents (private)
	//----------------------------------
	/**
	 * Takes in an HTML string & starts the recursive process to turn it into a template
	 */
	processContents = function (data) {
		var temp, o, reg, idx, lastIdx, children;

		temp = document.createElement("template");
		temp.innerHTML = data;
		o = {};
		o.structure = [];
		o.html = [];
		o.elems = {};
		o.suffix = 0;

		// Loop through the children
		processChildren(temp.content.childNodes, o, "", null);

		// Save into our collection of templates
		KIP.Globals.Templates[inObj.id] = o;
	}

	// processChildren (private)
	//-------------------------------------------------------------
	/**
	 * Loops through children on an element and saves it to the template object we are creating
	 */
	processChildren = function (children, obj, parentID, parent) {
		"use strict";
		var cIdx, child, clone, id, pId, childClone;

		// Quit if we don't have anything to save into
		if (!obj) return;

		// Loop through the children in this parent & add them to the object
		for (cIdx in children) {
			if (children.hasOwnProperty(cIdx)) {
				child = children[cIdx];
				id = child.getAttribute("id");

				// Clone the element into our element array if there is an ID
				if (id) {
					if (pId && obj.elems[id]) {
						obj.elems[parentID + "->" + id] = childClone = child.cloneNode();
					} else {
						obj.elems[id] = childClone = child.cloneNode();
					}
				}

				// Recurse on its children
				processChildren(child.childNodes, obj, id, childClone);

				// Add it to our clones of the elements
				// If there's a parent element, append it
				if (parent) {
					parent.appendChild(childClone);

				// Otherwise add it to our top-level element array
				} else {
					obj.html.push(childClone);
				}
			}
		}
	}


	// Quit if we don't have an ID for this template
	if (!inObj.id) return;

	// Figure out where the content of the file lives
	if (inObj.type === "file") {
		// Try to load the file if it was passed in instead of a straight HTML string
		var request = new XMLHttpRequest();
    request.open('GET', inObj.name, true); 
    request.onreadystatechange = function () {
    	var json;
	    if (request.readyState == 4 && request.status == "200") {
	      processContents(request.responseText);
	    }
    };
    xobj.send(null);  

	} else {
		content = inObj.content;
		processContents(content);
	}

	

};


// LoadTemplate
//--------------------------------------------------------------------------------
/**
 * Loads a template with the specified data
 * @param {string} id - The identifier of the template to load
 * @param {object} content - An object containing any additional data to load into the template. 
 * @param {boolean} [excludeBlank] - If true, any element with an ID in the template that is not populated by 'content' will be removed
 * @param {string} [suffix] - If provided, the suffix added to element IDs to differentiate this iteration of the template. Defaults to the 
 *														count of iterations of the template.
 * @param {string} [delim] - If provided, the delimiter between the ID and the delimiter. Defaults to "|".
 * @returns {array} Array of top-level HTML elements in the template
 **/
KIP.Functions.LoadTemplate = function (id, content, excludeBlank, suffix, delim) {
	"use strict";
	var id, template, elem, out, html, prop, pIdx, i, defaults;

	defaults = {};

	// Grab the template & quit if it isn't there
	template = KIP.Globals.Templates[id];
	if (!template) return;

	// Set some defaults
	if (!delim) delim = "|";
	if (!suffix && (suffix !== 0)) suffix = ++template.suffix;

	// Loop through each of the pieces in the template
	for (id in template.elems) {
		if (template.elems.hasOwnProperty(id)) {
			elem = template.elems[id];
			defaults[id] = {};

			// If we have data to fill, use it
			if (content[id]) {

				// String content: just build the element without any id or class changes
				if (typeof content[id] === typeof "abc") {
					elem.innerHTML = content[id];
				} else {

					// Loop through each attribute in the element & set it
					for (pIdx in content[id]) {
						if (content[id].hasOwnProperty(pIdx)) {
							prop = content[id][pIdx];

							if (pIdx === "innerHTML") {
								defaults[id][pIdx] = elem.innerHTML;
								elem.innerHTML = prop;
							} else if (pIdx === "value") {
								defaults[id][pIdx] = elem.value;
								elem.value = prop;
							} else {
								defaults[id][pIdx] = elem.getAttribute(pIdx) || "";
								elem.setAttribute(pIdx, prop);
							}
						}
					}
				}

			// Flag elements that should be excluded
			} else if (excludeBlank) {
				defaults[id].excluded = {
					parent: elem.parentNode,
					next: elem.nextSibling
				}
				elem.parentNode.removeChild(elem);
			}

			// Even if we don't have content for an element, we need to update the ID
			elem.setAttribute(id, id + delim + suffix);
			defaults[id].id = id;
		}
	}

	// Now loop through the structure & use it to create the output elements
	out = [];

	// Copy HTML elements
	for (i = 0; i < template.html.length; i += 1) {
		out[i] = template.html[i].cloneNode(true);
	}

	// Restore the default values to these elements
	for (id in template.elems) {
		if (template.elems.hasOwnProperty(id)) {

			// Only do stuff with elements that changed from their default values
			if (defaults[id]) {

				// Restore any deleted elements
				if (defaults[id].excluded) {
					defaults[id].excluded.parent.insertBefore(elem, defaults[id].excluded.next);
				}

				// Restore changed properties
				else {
					for (pIdx in defaults[id]){
						if (defaults[id].hasOwnProperty(pIdx)) {

							if (pIdx === "innerHTML") {
								elem.innerHTML = defaults[id][pIdx];
							} else if (pIdx === "value") {
								elem.value = defaults[id][pIdx]
							} else {
								elem.setAttribute(pIdx, defaults[id][pIdx]);
							}

						}
					}
				}
			}
		}
	}

	return out;
}