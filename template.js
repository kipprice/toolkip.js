KIP.Globals.Templates = {};

// A templated object allows you to take some HTML pattern and dynamically fill it
// It is loosely based on the jquery framework of templating
// TO label any piece as something that could be replaced

//<div id="{0:name}">{0:content}</div>

// Create a templated HTML object
KIP.Functions.CreateTemplate = function (inObj) {
	"use strict";
	var content, processContents, processChildren, request;

	// Start off the recursive process of saving off these elements
	processContents = function (data) {
		var temp, o, reg, idx, lastIdx, children;

		temp = document.createElement("template");
		temp.innerHTML = data;
		o = {};
		o.structure = [];
		o.html = [];
		o.elems = {};

		// Loop through the children
		processChildren(temp.content.childNodes, o, "", null);

		// Save into our collection of templates
		KIP.Globals.Templates[inObj.id] = o;
	}

	// Recursive process for tracking elements
	processChildren = function (children, obj, parentID, parent) {
		"use strict";
		var cIdx, child, clone, id, pId, childClone;

		if (!obj) return;

		// Loop through the children in this parent & add them to the object
		for (cIdx in children) {
			if (children.hasOwnProperty(cIdx)) {
				child = children[cIdx];
				id = child.getAttribute("id");

				// Clone the element into our element array
				if (pId && obj.elems[id]) {
					obj.elems[parentID + "->" + id] = childClone = child.cloneNode();
				} else {
					obj.elems[id] = childClone = child.cloneNode();
				}

				// Add it to the structure
				processChildren(child.childNodes, obj, id, childClone);

				// Make sure we preserve the structure
				if (parent) {
					parent.appendChild(childClone);
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


// Fill the templated object
KIP.Functions.LoadTemplate = function (id, content, excludeBlank) {
	"use strict";
	var id, template, elem, out, html, prop, pIdx, i, defaults;

	defaults = {};

	// Grab the template & quit if it isn't there
	template = KIP.Globals.Templates[id];
	if (!template) return;

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
		}
	}

	// Now loop through the structure & use it to create the output elements
	out = [];
	for (i = 0; i < template.html.length; i += 1) {
		out[i] = template.html[i].cloneNode(true);
	}

	// Restore the default values to these elements
	for (id in template.elems) {
		if (template.elems.hasOwnProperty(id)) {

			// Only do stuff with elements that changed from theirr default values
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