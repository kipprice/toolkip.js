/*globals KIP,window,document*/

/**
 * @file Documents the Context Menu class
 * @author Kip Price
 * @version 1.0
 * @since 1.0
 */

// ContextMenu
//-----------------------------------------------
/**
 *	@class ContextMenu
 *	Creates an object to override the general context menu. Can be used individually per element,
 *	@param {HTMLElement} target - The HTML element to draw this menu for
 */
KIP.Objects.ContextMenu = function (target, noStyles) {
	KIP.Objects.Drawable.call(this, "ctxMenu", "ctxMenu");
	this.options = [];
	this.xOptions = [];

	this.target = target || window;

	this.AddEventListeners();
	
	if (!noStyles) {
		this.ApplyStandardStyles();
	}
	
};

// This implements the Drawable class
KIP.Objects.ContextMenu.prototype = Object.create(KIP.Objects.Drawable.prototype);

// ContextMenu.AddOption
//-------------------------------------------------------------------------
/**
 * Allows an item to be added to a specific context menu.
 * @param {string}   label    - What should be displayed in the menu for this element
 * @param {Function} callback - The function to call when the option is clicked
 */
KIP.Objects.ContextMenu.prototype.AddOption = function (label, callback, subOptions) {
	"use strict";
	var idx, obj, sIdx;
	idx = this.options.length;
	obj = {};

	// Add a pointer in the index
	this.xOptions[label] = idx;

	// Create a div for the element and add a click listener
	obj.div = KIP.Functions.CreateSimpleElement("opt|" + idx, "ctxOption", label);
	obj.div.onclick = callback;

	// Add the div to our main menu
	this.div.appendChild(obj.div);

	// Add the propeties to the internal object
	obj.label = label;
	obj.callback = callback;
	
	this.options[idx] = obj;

	// Loop through suboptions and add them
	if (subOptions) {
		for (sIdx = 0; sIdx < subOptions.length; sIdx += 1) {
			this.AddSubOption(label, subOptions[sIdx].label, subOptions[sIdx].callback);
		}
	}
	
	return obj;
};

// ContextMenu.AddSubOption
//------------------------------------------------------------------------------------
KIP.Objects.ContextMenu.prototype.AddSubOption = function (srcLbl, label, callback) {
	"use strict";
	var src, obj, idx;
	
	idx = this.options.length;
	obj = {};

	// Grab the source option
	src = this.xOptions[srcLbl];
	src = this.options[src];
	if (!src && (src !== 0)) return;
	
	// Grab the index to use for this label	
	this.xOptions[label] = idx;

	// Add a hover effect to the source
	if (!src.subMenu) {
		src.subMenu = this.BuildSubMenu(src.label, src);
	}
	
	obj.label = label;
	obj.callback = callback;
	
	// Add to the sub menu
	obj.div = KIP.Functions.CreateSimpleElement("opt|" + idx, "ctxOption", label);
	obj.div.onclick = callback;
	
	src.subMenu.appendChild(obj.div);
	
	this.options[idx] = obj;
	return obj;
}

// ContextMenu.BuildSubMenu
//-------------------------------------------------------------
KIP.Objects.ContextMenu.prototype.BuildSubMenu = function (lbl, src) {
	"use strict";
	var div;

	// Create the div for the sub menu
	div = KIP.Functions.CreateSimpleElement("subMenu|" + lbl, "subMenu");
	div.style.display = "none";
	
	// Mouse over handling
	src.div.addEventListener("mouseover", function () {
		div.style.display = "block";
	});
	
	// Mouse out handling
	src.div.addEventListener("mouseout", function () {
		div.style.display = "none";
	});
	src.div.innerHTML += "...";
	
	KIP.Functions.AddCSSClass(src.div.parentNode, "fadable");
	
	src.div.appendChild(div);
	
	return div;
}

// ContextMenu.RemoveOption
//------------------------------------------------------------------
/**
 * Removes a particular item from the context menu
 * @param {string} label - The label of the item to remove
 */
KIP.Objects.ContextMenu.prototype.RemoveOption = function (label) {
	var idx;
	idx = this.xOptions[label];
	this.div.removeChild(this.options[idx].div);
	this.options.splice(idx, 1);
};

// ContextMenu.ClearOptions
//--------------------------------------------------------------
/**
 * Clears all options currently created for the menu
 */
KIP.Objects.ContextMenu.prototype.ClearOptions = function () {
	// Remove all of the elements
	this.options.map(function (elem) {
		this.div.removeChild(elem.div);
	});

	// Clear the arrays
	this.options.length = 0;
	this.xOptions.length = 0;
};

// ContextMenu.AddEventListeners
//------------------------------------------------------------------
/**
 * Adds the listeners to the menu itself
 * Also handles any additional menus that may have been created for different objects
 * @private
 */
KIP.Objects.ContextMenu.prototype.AddEventListeners = function () {
	var that = this;

	// Always erase every context menu that is being shown first
	window.addEventListener("contextmenu", function () {
		that.Erase();
	}, true);

	// On a regular, non-menu click, always hide the menu
	window.addEventListener("click", function (e) {
		that.Erase();
	});
	
	this.target.addEventListener("mouseup", function (e) {
		that.Erase();
	});

	// Only show the context menu for the linked target
	this.target.addEventListener("contextmenu", function (e) {
		var pos_x, pos_y;

		that.Erase();

		// Use the default version of the rclick menu if ctrl is being pressed
		if (e.ctrlKey) return true;

		// Stop the bubbling, since we've found our target
		e.stopPropagation();
		e.preventDefault();

		// Grab the approximate position
		pos_x = e.clientX;
		pos_y = e.clientY;

		/// Set the initial approximate position before drawing
		that.div.style.left = (pos_x + "px");
		that.div.style.top = (pos_y + "px");

		that.Draw(document.body);

		// If we're too far over, shift it.
		if ((pos_x + that.div.offsetWidth) > window.innerWidth) {
			pos_x = (window.innerWidth - that.div.offsetWidth);
		}

		// If we're too low, move up
		if ((pos_y + that.div.offsetHeight) > window.innerHeight) {
			pos_y = (window.innerHeight - that.div.offsetHeight);
		}

		// Adjust the display
		that.div.style.left = (pos_x + "px");
		that.div.style.top = (pos_y + "px");

		// Prevent the real r-click menu
		return false;
	}, false);

};

// ContextMenu.ApplyStandardStyles
//---------------------------------------------------------------------
KIP.Objects.ContextMenu.prototype.ApplyStandardStyles = function () {
	"use strict";
	var cls;
	
	if (KIP.Globals.CreatedCtxMenuStyles) return;
	// Style for context menu itself
	cls = {
		"background-color" : "rgba(60, 60, 60, 1)",
		"color" : "#FFF",
		"font-family" : "\"Calibri Light\", Sans-Serif",
		"box-shadow" : "1px 1px 3px 2px rgba(0,0,0,0.1)",
		"font-size" : "14px",
		"border-radius" : "4px",
		"padding-top" : "2px",
		"padding-bottom" : "2px",
		"width" : "10%",
		"position" : "absolute"
	}
	KIP.Functions.CreateCSSClass(".ctxMenu", cls);
	
	cls["background-color"] = "rgba(40, 40, 40, 0.9)";
	cls.width = "100%";
	cls.top = "-2px";
	cls["box-shadow"] = "1px 1px 1px 1px rgba(0,0,0,0.1)";
	cls.left = "calc(100% - 1px)";
	cls["border-left"] = "1px solid #777";
	KIP.Functions.CreateCSSClass(".subMenu", cls);
	
	cls["background-color"] = "rgba(40, 40, 40, 0.85)";
	cls["border-left"] = "1px solid #888";
	KIP.Functions.CreateCSSClass(".subMenu .subMenu", cls);
	
	// Style for options
	cls = {
		"padding" : "4px 10px",
		"cursor" : "pointer",
		"position" : "relative"
	}
	KIP.Functions.CreateCSSClass(".ctxOption", cls);
	
	// Hover class for options
	cls = {
		"background-color" : "#505050",
		"color" : "#FFF",
		"border-left" : "7px solid #999"
	}
	KIP.Functions.CreateCSSClass(".ctxOption:hover", cls);
	
	KIP.Globals.CreatedCtxMenuStyles = true;
	
};