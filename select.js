/* globals KIP */

/**
 * Creates a selec-like element using the Drawable framework for more adaptability in styles and design
 * @param {string} id - The unique identifier for this select element
 */
KIP.Objects.Select = function (id) {
	"use strict";
	
	KIP.Objects.Drawable.call(this, id, "select");
	this.id = id;
	
	// Create the input div we'll be using
	 this.input = KIP.Functions.CreateElement({
		 type: "input",
		 cls: "select",
		 id: "input" + id
	 });
	
	// Create the data for available options
	this.data = [];
	this.dataDiv = KIP.Functions.CreateSimpleElement("data" + id, "dropdown");
	this.selectedData = -1;
	this.options = [];
	this.visible = [];
	this.keys = {};
	this.visibleCnt = 0;
	
	// Add to our div
	this.div.appendChild(this.input);
	this.div.appendChild(this.dataDiv);
	
	this.AddListeners();
};

KIP.Objects.Select.prototype = Object.create(KIP.Objects.Drawable.prototype);

KIP.Objects.Select.prototype.AddListeners = function () {
	"use strict";
	var that;
	that = this;
	this.input.addEventListener("focus", function () {
		that.Dropdown();
	});
	
	this.input.addEventListener("blur", function () {
		that.Dropdown(true);
	});
	
	this.input.addEventListener("keydown", function (e) {
		
		// Quit if we are not expanded
		if (!that.expanded) return;
		
		if (e.keyCode === 40) {
			that.HiliteNext();
			e.preventDefault();
		} else if (e.keyCode === 38) {
			that.HilitePrevious();
			e.preventDefault();
		} else if (e.keyCode === 13) {
			that.Validate();
		}
	});
	
	this.input.addEventListener("keyup", function (e) {
		that.Filter();
		e.stopPropagation();
		return false;
	});

};

KIP.Objects.Select.prototype.Dropdown = function (retract) {
	"use strict";
	
	if (!retract) {
		KIP.Functions.AddCSSClass(this.dataDiv, "expanded");
		this.expanded = true;
		this.selectedData = 0;
		this.hiliteNext = 0;
	} else {
		KIP.Functions.RemoveCSSClass(this.dataDiv, "expanded");
		this.expanded = false;	
	}
};

KIP.Objects.Select.prototype.AddData = function (obj) {
	"use strict";
	var key, opt, func, that, i;
	that = this;
	
	// Helper function for assigning the listener
	func = function (elem, idx) {
		elem.addEventListener("mousedown", function (e) {
			that.Select(that.data[idx]);
		});
	};

	// Add to our data array
	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			
			// Skip if we already added this
			if (this.keys[key]) continue;
			
			i = this.data.push({key: key, val : obj[key]});
			this.keys[key] = true;
			
			// Also add to the options element array
			opt = KIP.Functions.CreateSimpleElement("opt" + this.id + "|" + i, "opt", obj[key]);
			this.options.push(opt);
			this.visible.push(true);
			this.visibleCnt += 1;
			
			// Add the listeners to this item
			func(opt, i - 1);
			
			// Add to the display
			this.dataDiv.appendChild(opt);
		}
	}
	
	// Make sure we also filter out new items
	this.Filter();
	
};

KIP.Objects.Select.prototype.Filter = function () {
	"use strict";
	var i, k, v, str, idx;
	
	// Grab the string to filter against
	str = this.input.value.toUpperCase();
	
	// Loop through each element of the array
	for (i = 0; i < this.data.length; i += 1) {
		idx = this.data[i].key.indexOf(str);
		if (idx === -1) {
			idx = this.data[i].val.indexOf(str);
		}
		
		// Hide the div if it doesn't belong
		if (idx === -1) {
			if (this.visible[i]) {
				KIP.Functions.AddCSSClass(this.options[i], "filtered");
				if (i === this.selectedData) {
					KIP.Functions.RemoveCSSClass(this.options[this.selectedData], "selected");
					this.selectedData = -1;
				}
				this.visible[i] = false;
				this.visibleCnt -= 1;
			}
		}
		
		// Or show it if it does
		if (idx !== -1) {
			if (!this.visible[i]) {
				KIP.Functions.RemoveCSSClass(this.options[i], "filtered");
				this.visible[i] = true;
				this.visibleCnt += 1;
			}
		}
	}
	
};

KIP.Objects.Select.prototype._Hilite = function (dir) {
	"use strict";
	var idx, cnt, done;
	
	// Quit if we have no displayed elements
	if (this.dataDiv.children.length === 0) return;
	
	// remove the old selection
	if (this.selectedData >= 0) {
		KIP.Functions.RemoveCSSClass(this.options[this.selectedData], "selected");
	}
	
	cnt = 0;
	idx = this.selectedData;
	// Make sure we're hilighting the next visible task
	while (!done) {
		idx += dir;
			
		// Handle the extreme of "above the list"
		if (idx < 0) {
			idx = this.data.length - 1;
		}

		// Handle the extreme of "below the list"
		if (idx >= this.data.length) {
			idx = 0;
		}
		
		if (this.visible[idx]) done = true;
		
		cnt += 1;
		if (cnt > this.data.length) return;
	}
	
	// Hilite the appropriate option child
	KIP.Functions.AddCSSClass(this.options[idx], "selected");
	
	this.selectedData = idx;
};

KIP.Objects.Select.prototype.HiliteNext = function () {
	return this._Hilite(1);
};

KIP.Objects.Select.prototype.HilitePrevious = function () {
	return this._Hilite(-1);
};

KIP.Objects.Select.prototype.Select = function (data) {
	"use strict";
	var that = this;
	this.value = data.key;
	this.input.value = data.val;
	
	if (this.selectedData >= 0) {
		KIP.Functions.RemoveCSSClass(this.options[this.selectedData], "selected");
		this.selectedData = -1;
	}
	
	window.setTimeout(function () {that.Dropdown(true);}, 100);
};

KIP.Objects.Select.prototype.Validate = function () {
	"use strict";
	var str, idx;
	
	str = this.input.value;
	
	// Compare against the selected element (if there is one)
	if (this.selectedData !== -1) {
		this.Select(this.data[this.selectedData]);
	}
	
	// If there's only one element, also pick that
	if (this.visibleCnt === 1) {
		for (idx = 0; idx < this.visible.length; idx += 1) {
			if (this.visible[idx]) {
				this.Select(this.data[idx]);
			}
		}
	}
	
};