/*globals KIP,window,document*/

/*********************************************
 *	@class ContextMenu
 *	
 *	Creates an object to override the general context menu. Can be used individually per element, 
 *	
 *	@param {HTMLElement} target - The HTML element to draw this menu for
 *********************************************/
KIP.Objects.ContextMenu = function (target) {
	KIP.Objects.Drawable.call(this, "ctxMenu", "ctxMenu");
	this.options = [];
	this.xOptions = [];
	
	this.target = target || window;
	this.div.style.position = "absolute";
	
	this.AddEventListeners();
};

// This implements the Drawable class
KIP.Objects.ContextMenu.prototype = Object.create(KIP.Objects.Drawable.prototype);

/**************************************************************************
 * Allows an item to be added to a specific context menu.
 * 
 * @param {string}   label    - What should be displayed in the menu for this element
 * @param {Function} callback - The function to call when the option is clicked
 **************************************************************************/
KIP.Objects.ContextMenu.prototype.AddOption = function (label, callback) {
	var idx, obj;
	idx = this.options.length;
	obj = {};
	
	// Add a pointer in the index
	this.xOptions[label] = idx;
	
	// Create a div for the element and add a click listener
	obj.div = KIP.Functions.CreateSimpleElement("opt|" + idx, "ctxOption", label);
	obj.div.onclick = callback;
	
	// Add the div to our main menu
	this.div.appendChild(obj.div);
	
	obj.label = label;
	obj.callback = callback;
};

/*******************************************************************
 * Removes a particular item from the context menu
 * 
 * @param {string} label - The label of the item to remove
 *******************************************************************/
KIP.Objects.ContextMenu.prototype.RemoveOption = function (label) {
	var idx;
	idx = this.xOptions[label];
	this.div.removeChild(this.options[idx].div);
	this.options.splice(idx, 1);
};
	
/**************************************************************
 * Clears all options currently created for the menu
 **************************************************************/
KIP.Objects.ContextMenu.prototype.ClearOptions = function () {
	// Remove all of the elements
	this.options.map(function (elem) {
		this.div.removeChild(elem.div);
	});
	
	// Clear the arrays
	this.options.length = 0;
	this.xOptions.length = 0;
};

/*******************************************************************
 * Adds the listeners to the menu itself 
 * Also handles any additional menus that may have been created for different objects
 *******************************************************************/
KIP.Objects.ContextMenu.prototype.AddEventListeners = function () {
	var that = this;
	
	// Always erase every context menu that is being shown first
	window.addEventListener("contextmenu", function () {
		console.log("erasing");
		that.Erase();
	}, true);

	// On a regular, non-menu click, always hide the menu
	window.addEventListener("click", function (e) {
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