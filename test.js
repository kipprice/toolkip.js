/*globals KIP*/

// Collection
//-------------------------------------
/**
 * Creates a key-value collection that has pretty decent performance (but double stores)
 * @class Collection
 */
KIP.Objects.Collection = function () {
	"use strict";
	this.data = [];
	this.backData = {};
};

// Collection.Length
//------------------------------------------------------
/**
 * Helper to grab the length of the collection
 * @returns {number} The number of elements in the collection
 */
KIP.Objects.Collection.prototype.Length = function () {
	"use strict";
	return this.data.length;
};

// Collection.AddElement
//--------------------------------------------------------------------------------
/**
 * Adds an element to our collection
 * @param {string} key - The key to use to uniquely identify this element
 * @param {variant} value - The value to store in the collection
 * @param {number} [idx] - The index at which the element should be replace
 * @param {boolean} [replace] - If true, will replace any elements with the same key
 * @returns {number} The index at which the element was added, -1 if it failed
 */
KIP.Objects.Collection.prototype.AddElement = function (key, value, idx, replace) {
	"use strict";
	var elem, loop, k, i;
	
	// Check if we're replacing an element and quit if we are not supposed to
	if (this.DoesElementExist(key)) {
		if (!replace) return -1;
		
		// If we should be replacing, pull out the old values now
		this.RemoveElement(key);
	}
	
	// Create the object that should be stored into the collection
	elem = {
		key: key,
		value: value
	};
	
	// Push the data into our regular index array
	if (!idx && (idx !== 0)) {
		idx = (this.data.push(elem) - 1);
	} else {
		this.data.splice(idx, 0, elem);
		loop = true;
	}
	
	// Now also add to our key array
	this.backData[key] = idx;
	
	// Loop over the back data if we need to
	if (loop) {
		for (k in this.backData) {
			if (this.backData.hasOwnProperty(k)) {
				
				// If this index is affected by the splice, update it
				i = this.backData[k];
				if (i >= idx && (k !== key)) {
					this.backData[k] += 1;
				}
			}
		}
	}
	
	return idx;
};
	
// Collection.RemoveElement
//----------------------------------------------------------------------
/**
 * Removes an element from our Collection
 * @param {string} key - The key to remove from our collection
 * @param {number} [idx] - If available, the index at which the element already exists. If not passed in, this will be grabbed via the key
 * @returns {Object} The data that was removed, with properties of "key", "idx", and "value"
 */
KIP.Objects.Collection.prototype.RemoveElement = function (key, idx) {
	"use strict";
	var i, bIdx, val;
	
	// Grab the index if it wasn't passed in
	if (!idx && (idx !== 0)) {
		idx = this.GetElementIdx(key);
	}
	
	// Remove from the regular data array
	val = this.data.splice(idx, 1);
	
	// Remove from the back data array
	delete this.backData[key];
	
	// Loop through the back index to update the indices
	for (i in this.backData) {
		if (this.backData.hasOwnProperty(i)) {
			
			// If this index was affected, subtract one
			bIdx = this.backData[i];
			if (bIdx > idx) {
				this.backData[i] -= 1;
			}
		}
	}
	
	// Return data about the element we removed
	return {
		key: key,
		idx: idx,
		value: val
	};
};

// Collection.RemoveElementAtIndex
//----------------------------------------------------------------------
/**
 * Removes an element at a given index
 * @param {number} idx - The index where the element appears
 * @returns {Object} The data that was removed, with properties of "key", "idx", and "value"
 */
KIP.Objects.Collection.prototype.RemoveElementAtIndex = function (idx) {
	"use strict";
	var key;
	
	// Find the key to send on to the other function
	key = this.GetElementKey(idx);
	
	// Return the regular result of removing an element
	return this.RemoveElement(key, idx);
};
	
// Collection.GetElement
//------------------------------------------------------------------
/**
 * Gets the value for a given index or key
 * @param {string} key - The key of the element to grab
 * @param {number} [idx] - If passed in, the index at which the element appears. If not included, grabbed from the key
 * @returns {variant} The element that was retrieved
 */
KIP.Objects.Collection.prototype.GetElement = function (key, idx) {
	"use strict";
	if (!idx && (idx !== 0)) {
		idx = this.GetElementIdx(key);
	}
	
	// Quit if no index exists
	if (!idx && idx !== 0) {
		return null;
	}
	
	if (!this.data[idx] && (this.data[idx] !== 0)) {
		return null;
	}
	
	// Otherwise, return the item
	return this.data[idx];
};
	
// Collection.GetElementByIdx
//------------------------------------------------------------------
/**
 * Grabs an element from the index it appear in our data array
 * @param {number} idx - The index to grab from
 * @returns {variant} The element that appears at this index
 */
KIP.Objects.Collection.prototype.GetElementByIdx = function (idx) {
	"use strict";
	var key = this.GetElementKey(idx);
	return this.GetElement(key, idx);
};
	
// Collection.GetElementIdx
//----------------------------------------------------------------
/**
 * From a key, grabs the index at which an element appears
 * @param {string} key - The key to grab the index for
 * @returns {number} The index at which the element appears
 */
KIP.Objects.Collection.prototype.GetElementIdx = function (key) {
	"use strict";
	return this.backData[key];
};
	
// Collection.GetElementKey
//---------------------------------------------------------------
/**
 * Gets the key for a given element from its index
 * @param {number} idx - The index at which the element appears
 * @returns {string} The key of the element at that index
 */
KIP.Objects.Collection.prototype.GetElementKey = function (idx) {
	"use strict";
	var elem = this.data[idx];
	if (!elem && elem !== 0) return null;
	return this.data[idx].key;
};

// Collection.Sort
//-----------------------------------------------------------
/**
 * Sorts our data collection by a given sort function
 * @param {function} sortFunc - The sorting function to use
 * @returns {Array} Our newly sorted data array
 */
KIP.Objects.Collection.prototype.Sort = function (sortFunc) {
	"use strict";

	// Sort the data
	this.data = this.data.sort(sortFunc);

	// Reassign our back values
	this.ReassignBackData();

	return this.data;
};

// Collection.ReassignBackData
//-----------------------------------------------------------------
/**
 * Updates the key -> index mapping after the data array changes
 */
KIP.Objects.Collection.prototype.ReassignBackData = function () {
	"use strict";
	var idx, key;

	// Reassign the back matching
	for (idx = 0; idx < this.data.length; idx += 1) {
		key = this.data[idx].key;
		this.backData[key] = idx;
	}
};

// Collection.MergeCollection
//---------------------------------------------------------------------------
/**
 * Combines the data in an existing collection into this collection
 * @param {Collection} coll   - The collection we are merging from
 * @param {boolean} useOld - If true, will use our existing data if a key conflict exists. Otherwise, data from the passed in collection will overwrite existing data.
 */
KIP.Objects.Collection.prototype.MergeCollection = function (coll, useOld) {
	"use strict";
	var key, idx, nIdx;
	
	for (idx = 0; idx < coll.data.length; idx += 1) {
		key = coll.data[idx];
		
		// If we already have some data under that key, either override or ignore it
		if (this.backData.hasOwnProperty(key)) {
			if (useOld) continue;
			this.data[this.backData[key]] = coll.data[idx];
			
		// Otherwise, add the data to our collection instead
		} else {
			nIdx = this.data.push(coll.data[idx]);
			this.backData[key] = nIdx;
		}
	}
};

// Collection.Clear
//----------------------------------------------------
/**
 * Clears out the data in this collction
 */
KIP.Objects.Collection.prototype.Clear = function () {
	"use strict";
	this.data = [];
	this.backData = {};
};

// Collection.GetNextIndex
//------------------------------------------------------------
/**
 * Grabs the next available index in our data array
 * @returns {number} The next available index
 */
KIP.Objects.Collection.prototype.GetNextIndex = function () {
	"use strict";
	return this.data.length;
};

// Collection.DoesElementExist
//-------------------------------------------------------------------
/**
 * Checks if an element of the given key already exists in this collection
 * @param {string} key - The key to check
 * @returns {boolean} True if the key already exsts, false otherwise
 */
KIP.Objects.Collection.prototype.DoesElementExist = function (key) {
	"use strict";
	var idx, elem;
	idx = this.backData[key];
	
	// Quit early if the key didn't exist
	if (!idx && (idx !== 0)) return false;
	
	// Return whether there is actually data
	return !!this.data[idx];
};

KIP.Objects.Collection.prototype.Sort = function (func) {
	"use strict";
	var copy;
	
	// Make a shallow copy of the data array
	copy = this.data.slice();
	
	// Sort the copy
	copy = copy.sort(func);
	
	// Return the copied array
	return copy;
}/**
 * Items for grabbing color conversions and new colors
 * @file Color.js
 * @version 1.0
 * @author Kip Price
 */

/** @type {Number} The amount the hue should increase when cycling through new colors */
KIP.Constants.HueInterval = 22;

/** @type {Number} The amount that the lightness should increase when cycling through new colors */
KIP.Constants.LightInterval = 20;

/** @type {Number} The amount that the saturation should increase when cycling through new colors */
KIP.Constants.SaturationInterval = 20;

/** @type {Object} The max and min saturation value that should be used for cycling colors */
KIP.Constants.SaturationLimits = {
	Max: 100,
	Min: 20
};

/** @type {Object} The max and min lightness values that should be used for cycling colors */
KIP.Constants.LightnessLimits = {
	Max: 80,
	Min: 35
};

KIP.Constants.HSLPieceEnum = {
	Saturation: 0,
	Lightness : 1,
	Hue : 2
};

// GenerateColor
//---------------------------------------------
/**
 * Generates the next color in the global color object
 * 
 * @param {string} [id] - An identifier for the color
 * 
 * @returns {string} The next hex string for the color selector
 */
KIP.Functions.GenerateColor = function (id, firstRotate) {
	"use strict";
	var color;

	// Initialize the "Used Colors" array if we haven't yet
	if (!KIP.Globals.UsedColors) {
		KIP.Globals.UsedColors = {};
	}

	// Initialize the global color object if we haven't yet
	if (!KIP.Globals.ColorObj) {
		KIP.Globals.ColorObj = new KIP.Objects.Color();
		KIP.Globals.ColorObj.ParseFromHSLColor("hsl(330, 80%, 50%)");
	}

	// Grab the next available color
	color = KIP.Globals.ColorObj.GetNextHue(firstRotate || 0);

	// If we received an identifier, use it
	if (id) {
		KIP.Globals.UsedColors[id] = color;
	}

	return color;
};

/**
 * Finds the current color of the color object & returns it
 */
KIP.Functions.GetCurrentColor = function () {
		// Initialize the global color object if we haven't yet
	if (!KIP.Globals.ColorObj) {
		KIP.Globals.ColorObj = new KIP.Objects.Color();
		KIP.Globals.ColorObj.ParseFromHSLColor("hsl(330, 80%, 50%)");
	}
	
	return KIP.Globals.ColorObj.GetCurrentHue();
};

/**
 * Calculates the non-opacity value of the semi-transparent front color when placed over another color
 * @param {string} frontColor - A color string including an alpha value
 * @param {[type]} backColor - The color that appears in the background
 * @param {number} [opacity] - The opacity of the first color, if not included in the color string
 */
KIP.Functions.GetApparentColor = function (frontColor, backColor, opacity) {
	"use strict";
	var col;

	// Create the color object
	col = new KIP.Objects.Color();
	col.ParseColorString(frontColor, opacity);

	// Calculate the new color
	col.GetApparentColor(backColor);

	return col.HexString();
}

KIP.Functions.GetComplementaryColor = function (color, cutoff) {
	"use strict";
	var col, comp, lightness;
	cutoff = cutoff || 45;

	// Grab the appropriate color
	col = new KIP.Objects.Color();
	col.ParseColorString(color);

	// Grab the current lightness value
	lightness = col.GetLightness();

	if (lightness < cutoff) {
		col.lightness = 95;
	} else {
		col.lightness = 5;
	}
	col.GenerateRGBValues();
	
	return col.RGBAString();
}

// HexToRGB
//-------------------------------------------
/**
 * Converts a hex color string to a RGB color string
 * 
 * @param {string} hex - The hex string to convert
 * 
 * @returns {string} The appropriate RGB string
 */
KIP.Functions.HexToRGB = function (hex) {
	"use strict";
	var c;

	c = new KIP.Objects.Color();
	c.ParseFromHexColor(hex);

	return c.RGBString();
};

// HexToRGBA
//-----------------------------------------------
/**
 * Converts a hex color string to rgba color string
 * 
 * @param {string} hex - The hex string to parse
 * 
 * @param {number} alpha - The alpha value to give the color
 */
KIP.Functions.HexToRBA = function (hex, alpha) {
	"use strict";
	var c;

	// Use our color object to handle this
	c = new KIP.Objects.Color();
	c.ParseFromHexColor(hex, alpha);

	return c.RGBAString();
};

// HSLToRGB
//-----------------------------------------
/**
 * Converts a HSL string to RGB string
 * 
 * @param {string} hsl - The HSL string to parse
 * 
 * @returns {string} The RGB string that corresponds
 */
KIP.Functions.HSLToRGB = function (hsl) {
	"use strict";
	var c;

	c = new KIP.Objects.Color();
	c.ParseFromHSLColor(hsl);

	return c.RGBString();
};

// HSLAToRGBA
//-------------------------------------------------
/**
 * Converts a HSLA string to a RGB string
 * 
 * @param {string} hsl - The HSL string to convert
 * @param {number} alpha - The alpha value to use, if the hsl string doesn't include it
 * 
 * @returns {string} The appropriate RGBA string
 */
KIP.Functions.HSLAToRBGA = function (hsl, alpha) {
	var c;

	c = new KIP.Objects.Color();
	c.ParseFromHSLColor(hsl, alpha);

	return c.RGBAString();
};

// FullHexString
//-----------------------------------------------
/**
 * Grabs the hex value for a given number and ensures it is a certain length
 * 
 * @param {number} val - The number to convert to Hex
 * @param {number} [l] - How long the hex string should be
 * 
 * @returns {string} The hex value of the passed in number
 */
KIP.Functions.FullHexString = function (val, l) {
	"use strict";
	var out, i;

	l = l || 0;

	out = val.toString(16);

	if (out.length < l) {
		for (i = 0 ; i < (l - out.length); i += 1) {
			out = "0" + out;
		}
	}

	return out;
};

// Color
//-------------------------------------------
/**
 * Creates an object that can handle color conversions
 * 
 * @class Color
 * 
 * @param {number} [r] - The red value for the color
 * @param {number} [g] - The green value for the color
 * @param {number} [b] - The blue value for the color
 * @param {number} [a] - The alpha value for the color
 */
KIP.Objects.Color = function(r, g, b, a) {
	"use strict";
	this.red = r || 0;
	this.green = g || 0;
	this.blue = b || 0;
	this.alpha = a || 1;
};

// Color.RGBAString
//-----------------------------------------------------
/**
 * Gets the appropriate RGBA string for this color
 * 
 * @returns {string} RGBA string for the color
 */
KIP.Objects.Color.prototype.RGBAString = function () {
	"use strict";
	return this.RGBString(true);
};

// Color.RGBString
//------------------------------------------------------------
/**
 * Grabs the RGB string (with A element if appropriate) for this color
 * 
 * @param {boolean} withAlpha - If true, include the alpha element in the returned string
 * 
 * @returns {string} The appropriate color string
 */
KIP.Objects.Color.prototype.RGBString = function (withAlpha) {
	"use strict";
	var out;

	// Start the string regardless of alpha value
	out = "rgba(" + this.red + ", " + this.green + ", " + this.blue;
	
	// Add the alpha value if appropriate
	if (withAlpha) {
		out += ", " + this.alpha;
	}

	// Close up the string and send it out
	out += ")";
	return out;
};

// Color.HSLString
//-------------------------------------------------------------
/**
 * From the color object, creates a hue-saturation-lightness string
 * 
 * @param {boolean} withAlpha - If true, also adds an alpha element to the end of the string
 */
KIP.Objects.Color.prototype.HSLString = function (withAlpha) {
	"use strict";
	var out;
	if (!this.hue) this.GenerateHSLValues();

	// String starts out the same regardless of whether we are including alpha
	out = "hsl(" +  this.hue + ", " + this.saturation + "%, " + this.lightness + "%";

	// Grab the alpha piece if appropriate
	if (withAlpha) {
		out += ", " + this.alpha;
	}

	// Return the HSL string	
	out += ")";
	return out;
};

// Color.HSLAString
//-----------------------------------------------------
/**
 * From the color object, create a HSLA string
 * 
 * @returns {string} A string for the color
 */
KIP.Objects.Color.prototype.HSLAString = function () {
	"use strict";
	return this.HSLString(true);
};

// Color.HexString
//----------------------------------------------------------
/**
 * From the color object, creates a hex color string
 * 
 * @param {boolean} [withAlpha] - True if alpha should be added to the hex string
 * 
 * @returns {string} The appropriate hex string
 */
KIP.Objects.Color.prototype.HexString = function (withAlpha) {
	"use strict";
	var col, out;
	out = "#";

	out += KIP.Functions.FullHexString(this.red, 2);
	out += KIP.Functions.FullHexString(this.green, 2);
	out += KIP.Functions.FullHexString(this.blue, 2);

	if (withAlpha) {
		out += KIP.Functions.FullHexString(this.alpha, 2);
	}

	return out;
};

// Color.GenerateHSLValues
//-------------------------------------------------------------
/**
 * Calculates the HSL values for this RGB color and saves it off in the color.
 * Relies on the rgb values already having been set
 */
KIP.Objects.Color.prototype.GenerateHSLValues = function () {
	"use strict";
	var r, g, b, lightness, delta, max, min, hue, saturation, out;

	r = this.red / 255;
	g = this.green / 255;
	b = this.blue / 255;

	// Find the max, min, and the difference between them.
	// We need these values to calculate HSL equivalents
	max = Math.max(r, g, b);
	min = Math.min(r, g, b);
	delta = max-min;

	// Lightness is the average between the two extremes
	lightness = (max + min) / 2;

	// If the max and min are the same, all three are actually the same value,
	// so we can quit now with our grayscale color
	if (max === min) {
		this.hue = 0;
		this.saturation = 0;
		this.lightness = Math.round(lightness * 100);
		return;
	}

	// The saturation is a ratio of the delta of the extremes
	// over a version of the sum of the extremes.
	// It changes when lightness is less or more than 50%.
	if (lightness > .5) {
		saturation = delta / (2 - max - min);
	} else{
		saturation = delta / (max + min);
	}

	// The hue is calculated from the two non-max values
	// If two values match the max, then we just evaluate in order red -> green -> blue

	// Red was the max.
	if (max === r) {
		hue = (g - b) / delta;

		// We need an additional kick if green is less than blue
		if (g < b) {
			hue += 6;
		}

	// Green was the max
	} else if (max === g){
		hue = (b - r) / delta + 2;

	// Blue was the max
	} else{
		hue = (r - g) / delta + 4;
	}

	// Divide by six to get the appropriate average
	hue /= 6;

	// -- Save off the member variables for this color --
	// 
	// All values are currently in the range [0,1].
	// Hue needs to be multiplied by 360 to get the appropriate value.
	// Saturation and lightness both need to be multiplied by 100.
	this.hue = Math.round(hue * 3600) / 10;
	this.saturation = Math.round(saturation * 1000) / 10;
	this.lightness = Math.round(lightness * 1000) / 10;

	if (!this.startHue) {
		this.startHue = this.hue;
		this.startSat = this.saturation;
		this.startLight = this.lightness;
	}
};

// Color.GenerateRGBValues
//------------------------------------------------------------
/**
 * Saves off the appropriate RGB values for this color based on its hex values.
 * Relies on the hex colors being set
 */
KIP.Objects.Color.prototype.GenerateRGBValues = function () {
	"use strict";
	var hue, saturation, lightness, p, q, t, i;

	hue = this.hue / 360;
	saturation = this.saturation / 100;
	lightness = this.lightness / 100;

	// If there is not saturation, it's grayscale, so the colors are all equal to the lightness
	if (saturation === 0) {
		this.red = this.green = this.blue = lightness;
		this.red *= 255;
		this.green *= 255;
		this.blue *= 255;
		return true;
	}

	//If we do have a saturated value, we need to convert it to RGB
	// Get the value of the q coefficient
	if (lightness < 0.5) {
		q = lightness * (1 + saturation);
	} else {
		q = lightness + saturation - (lightness * saturation);
	}

	// And calculate p from q
	p = (2 * lightness) - q;

	for (i = -1; i <= 1; i += 1){
		t = hue + (-i / 3);

		// Check for the extremes and adjust them
		if (t < 0) {
			t += 1;
		} else if (t > 1) {
			t -= 1;
		}

		// Find the appropriate case to treat this value as
		if (t < ( 1 / 6)) {
			this.SetAppropriateColor(i + 1, (p + ((q - p) * 6 * t)) * 255);
		} else if (t < (1 / 2)) {
			this.SetAppropriateColor(i + 1, q * 255);
		} else if (t < (2 / 3)) {
			this.SetAppropriateColor(i + 1, (p + ((q - p) * (2/3 - t) * 6)) * 255);
		} else{
			this.SetAppropriateColor(i + 1, p * 255);
		}
	}
};

// Color.ParseFromHexColor
//----------------------------------------------------------------------
/**
 * Takes in a hex string and saves it internally
 * 
 * @param {string} hex - The hex string to parse in
 * @param {number} [alpha] - The alpha value to use
 * 
 * @returns {boolean} True if the parsing succeeds, false otherwise
 */
KIP.Objects.Color.prototype.ParseFromHexColor = function (hex, alpha) {
	"use strict";
	var idx, col, pc, aIncluded, hReg, inc;

	hReg = /^#?(?:[0-9A-Fa-f]{3,4}){1,2}$/;

	if (!hReg.test(hex)) {
		return false;
	}

	// Strip out the # character if it was there
	if (KIP.Functions.CharAt(hex, 0) === "#") {
		hex = KIP.Functions.Rest(hex, 1);
	}

	if (hex.length < 6) {
		inc = 1;
	} else {
		inc = 2;
	}

	// Flip through each of the possible columns
	for (idx = 0; idx < hex.length; idx += inc) {
		pc = hex.substr(idx, inc);

		if (inc === 1) {
			pc += pc;
		}

		// Parse out the color and set it appropriately
		col = parseInt(pc, 16);
		this.SetAppropriateColor((idx / inc), col);

		// If we hit alpha values, 
		if (idx > 4) {
			aIncluded = true;
		}
	}

	// Set the alpha value if it wasn't included in the hex string
	if (!aIncluded) {
		this.alpha = alpha || 0;
	}

	return true;
};

// Color.ParseFromRGBColor
//----------------------------------------------------------------------
/**
 * Takes in a rgb color string and parses it into our internal format
 * 
 * @param {string} rgb   - The RGB string to parse
 * @param {number} [alpha] - The alpha value to parse in, if the rgb string doesn't have it
 * 
 * @returns {boolean} True if the parsing succeeds, false otherwise 
 */
KIP.Objects.Color.prototype.ParseFromRGBColor = function (rgb, alpha) {
	"use strict";
	var rgbReg, rgbaReg, match;

	rgbReg = /rgb\((?:([0-9]{1-3}), ?){3}\)/;
	rgbaReg = /rgba\((?:([0-9]{1-3}), ?){3}, ?([0-9]{0,1}(?:\.[0-9]+)?)\)/;

	if (!rgbReg.test(rgb)) {
		if (!rgbaReg.test(rgb)) {
			return false;
		} else {
			match = rgbaReg.exec(rgb);
		}
	} else {
		match = rgbReg.exec(rgb);
	}

	this.red = match[1];
	this.green = match[2];
	this.blue = match[3];

	if ((match[4] !== undefined) || (alpha !== undefined)) {
		this.alpha = match[4] || alpha;
	}

	return true;
};

// Color.ParseFromHSLColor
//-------------------------------------------------------------------
/**
 * Takes in a HSL string and converts it to the color object's internal format
 * 
 * @param {string} hsl - The HSL string to convert. Can also be a HSLA string
 * @param {number} [a] - The alpha value to set, if it is not included in the HSLA string
 * 
 * @returns {boolean} True if the color was successfully parsed, false otherwise.
 */
KIP.Objects.Color.prototype.ParseFromHSLColor = function (hsl, a) {
	"use strict";
	var hslReg, hslaReg, match, hue, saturation, lightness, q, p, i, t;
	hslReg = /hsl\(([0-9]{1,3}), ?([0-9]{1,3})%, ?([0-9]{1,3})%\)/;
	hslaReg = /hsla\(([0-9]{1,3}), ?([0-9]{1,3})%, ?([0-9]{1,3})%, ?([0-9]{0,1}(?:\.[0-9]+)?)\)/;

	// Quit if the regex doesn't match
	if (!hslReg.test(hsl)) {
		if (!hslaReg.test(hsl)) {
			return false;
		} else {
			match = hslaReg.exec(hsl);
		}
	} else {
		match = hslReg.exec(hsl);
	}

	// Save off the values parsed out of the string
	this.hue = Math.round(parseFloat(match[1]) * 10) / 10;
	this.saturation = Math.round(parseFloat(match[2]) * 10) / 10;
	this.lightness = Math.round(parseFloat(match[3]) * 10) / 10;

	// Only set the alpha if something is available
	if ((match[4] !== undefined) || (a !== undefined)) {
		this.alpha = parseFloat(match[4]) || a;
	}

	// Make sure the RGB values are updated too
	this.GenerateRGBValues();

	return true;
};

/**
 * Tries to parse a given string into an internal color object
 * 
 * @param {string} str - The string to parse
 * @param {number} [alpha] - The alpha value to use, if not included in the string
 * 
 * @returns {boolean} True if the parsing succeeds, false otherwise
 */
KIP.Objects.Color.prototype.ParseColorString = function (str, alpha) {
	"use strict";
	var success;

	// Try to parse the string as a RGB value
	success = this.ParseFromRGBColor(str, alpha);
	if (success) return true;

	// Try to parse the string as a Hex value
	success = this.ParseFromHexColor(str, alpha);
	if (success) return true;

	// Try to parse the string as a HSL value
	success = this.ParseFromHSLColor(str, alpha);
	if (success) return true;

	// If nothing worked, return false
	return false;
};

// Color.SetAppropriateColor
//----------------------------------------------------------------------
/**
 * Sets a color value based on the index of the color (ie, red = 0, green = 2)
 * 
 * @param {number} idx - The index of the color we are saving
 * @param {number} val - The value that the color should be set to
 */
KIP.Objects.Color.prototype.SetAppropriateColor = function (idx, val) {
	"use strict";
	if (idx < 3) {
		val = Math.min(255, Math.max(0, Math.round(val)));
	} else {
		val = Math.min(1, Math.max(0, val));
	}

	switch (idx) {
		case 0:
			this.red = val;
			break;
		case 1:
			this.green = val;
			break;
		case 2:
			this.blue = val;
			break;
		case 3:
			this.alpha = val;
			break;
	}
};

// Color.GetNextHue
//-------------------------------------------------------------
/**
 * Grabs the next hue available for this color selector. 
 * Can be used as a random color generator
 * 
 * @param {boolean} withAlpha - True if the alpha value should also be included in the output string
 * 
 * @returns {string} The hex color string for the new color
 */
KIP.Objects.Color.prototype.GetNextHue = function (firstRotate, withAlpha) {
	"use strict";
	var toCycle = [], idx;

	// First, convert our internal format to HSL (if needed)
	if (!this.startHue) this.GenerateHSLValues();

	// Fill in our array of the order in which we will cycle the values
	toCycle[0] = firstRotate;
	toCycle[1] = (firstRotate + 1) % 3;
	toCycle[2] = (firstRotate + 2) % 3;

	// Loop through the cycles and set their values
	for (idx = 0; idx < toCycle.length; idx += 1) {

		// Rotate and quit if we don't have to rotate another piece
		if (!this.RotateAppropriateHSLValue(toCycle[idx])) {
			break;
		}
	}

	// Update the RGB values too
	this.GenerateRGBValues();
	return this.HexString(withAlpha);
};

KIP.Objects.Color.prototype.GetCurrentHue = function (withAlpha) {
	return this.HexString(withAlpha);
};

// Color.RotateAppropriateHSLValue
//-----------------------------------------------------------------------
/**
 * Calculates the next appropriate value for the HSL type, and
 * @param {[type]} idx [description]
 */
KIP.Objects.Color.prototype.RotateAppropriateHSLValue = function (idx) {
	"use strict";
	var val, start;

	// Grab the appropriate current value and start value
	switch(idx) {
		case KIP.Constants.HSLPieceEnum.Saturation: 
			val = this.RotateSaturation();
			start = this.startSat;
			break;
		case KIP.Constants.HSLPieceEnum.Lightness:
			val = this.RotateLightness();
			start = this.startLight;
			break;
		case KIP.Constants.HSLPieceEnum.Hue:
			val = this.RotateHue();
			start = this.startHue;
			break;
	}

	// Return true if we'd made a full circle
	if (val === start) {
		return true
	}
	return false;
};

KIP.Objects.Color.prototype.RotateHue = function () {
	"use strict";
	return this.hue = this.RotateHSLValue(this.hue, KIP.Constants.HueInterval, 360);
};

KIP.Objects.Color.prototype.RotateSaturation = function () {
	"use strict";
	return this.saturation = this.RotateHSLValue(this.saturation, KIP.Constants.SaturationInterval, 100, KIP.Constants.SaturationLimits.Max, KIP.Constants.SaturationLimits.Min);
};

KIP.Objects.Color.prototype.RotateLightness = function () {
	return this.lightness = this.RotateHSLValue(this.lightness, KIP.Constants.LightInterval, 100, KIP.Constants.LightnessLimits.Max, KIP.Constants.LightnessLimits.Min);
}

// Color.RotateHSLValue
//---------------------------------------------------------------------------------------
/**
 * Rotates a given HSL value by an appropriate interval to get a new color
 * 
 * @param {number} startVal -The value the HSL value started with
 * @param {number} inc - How much the HSL value should be incremented
 * @param {number} modBy - What the mod of the HSL value should be
 * @param {number} [max] - The maximum this HSL value can be
 * @param {number} [min] - The minimum this HSL value can be
 * 
 * @returns {number} The newly rotate HSL value
 */
KIP.Objects.Color.prototype.RotateHSLValue = function (startVal, inc, modBy, max, min) {
	"use strict";
	var out;

	// Increment and mod
	out = startVal += inc;
	out %= modBy;

	// If we have beither max nor min, quit now
	if (!max) return KIP.Functions.RoundToPlace(out, 10);
	if (!min && (min !== 0)) return KIP.Functions.RoundToPlace(out, 10);

	// Loop until we have an acceptable value
	while ((out < min) || (out > max)) {
		out = startVal += inc;
		out %= modBy;
	}

	// Return the appropriate value
	return KIP.Functions.RoundToPlace(out, 10);
};

// Color.GetApparentColor
//-------------------------------------------------------
/**
 * Calculates what the display color of this color would be without setting an alpha value.
 * Can calculate what the RGB value should be given a background color instead of RGBA
 * 
 * @param {variant} backColor - Either the color object or color string for the background color
 * 
 * @returns {boolean} True if we were successfully able to calculate the apparent color.
 */
KIP.Objects.Color.prototype.GetApparentColor = function (backColor) {
	"use strict";
	var c, antiAlpha;

	// Parse the backColor if it is a string, or just leave it if it is an object
	if (!backColor.red) {
		c = new KIP.Objects.Color();
		if (!c.ParseColorString(backColor)) {
			return false;
		}
	} else {
		c = backColor;
	}

	antiAlpha = 1 - this.alpha;
	this.red = Math.round((this.red * this.alpha) + (c.red * antiAlpha));
	this.green = Math.round((this.green * this.alpha) + (c.green * antiAlpha));
	this.blue = Math.round((this.blue * this.alpha) + (c.blue * antiAlpha));

	this.alpha = 1;

	return true;
};

// Color.IsDark
//----------------------------------------------------
/**
 * Checks if this color object is more dark than light
 * @returns {boolean} True if the color is dark
 */
KIP.Objects.Color.prototype.IsDark = function () {
	"use strict";
	if (!this.hue) this.GenerateHSLValues();

	return (this.lightness <= 50);
};

// Color.IsLight
//------------------------------------------------------
/**
 * Checks if this color object is more light than dark
 * @returns {boolean} True if the color is light
 */
KIP.Objects.Color.prototype.IsLight = function () {
	"use strict";
	if (!this.hue) this.GenerateHSLValues();

	return (this.lightness > 50);
};

KIP.Objects.Color.prototype.GetLightness = function () {
	"use strict";
	if (!this.hue) this.GenerateHSLValues();

	return this.lightness;  
}/*globals document, window, Event*/

/**
 * @file Helper functions for DOM and string manipulation
 * @author Kip Price
 * @version v1.2
 * @since v0.1
 */

/**
 * Global structure of the KIP library
 * @namespace KIP
 */
if (!window.KIP) {
	window.KIP = {
		/**
		 * All object definitions contained within the library
		 * @namespace Objects
		 */
		Objects : {},

		/**
		 * All global function definitions contained within the library
		 * @namespace Functions
		 */
		Functions : {},

		/**
		 * All constants that are necessary for this library
		 * @namespace Constants
		 */
		Constants : {},

		/**
		 * All globals that are necessary for this library
		 * @namespace Globals
		 */
		Globals : {},

		/**
		 * All configurable options for the library
		 * @namespace Options
		 */
		Options : {},

		/**
		 * All unit tests for the library
		 * @namespace Test
		 */
		Test : {},

		/**
		 * All events for the library
		 * @namespace Events
		 */
		Events : {}
	};
}

KIP.Events.CSSChange = new Event("csschange");

// CreateSimpleElement
//--------------------------------------------------------------------
/**
 * Creates a div element with the provided id, class, content, and attributes.
 *
 * @param {string} id - The ID to assign the element {optional}
 * @param {string} cls - The class to assign the element {optional}
 * @param {string} content - What to include as the contents of the div {optional}
 * @param {arr} attr - An array of key-value pairs that sets all other attributes for the element
 *
 * @return {HTMLElement} The created element, with all specified parameters included.P
 */
KIP.Functions.CreateSimpleElement = function (id, cls, content, attr, children) {
  var elem, a, c, child;

  elem = document.createElement("div");

  // Add the ID if we have it
  if (id) {
    elem.setAttribute("id", id);
  }

  // Add the class if we have it
  if (cls) {
    elem.setAttribute("class", cls);
  }

  // Add the innerHTML if we have it
  if (content) {
    elem.innerHTML = content;
  }

  // Loop through our list of attributes and set them too
  for (a in attr) {
    if (attr.hasOwnProperty(a)) {
      try {
				if (attr[a].key) {
        	elem.setAttribute(attr[a].key, attr[a].val);
				} else {
					elem.setAttribute(a, attr[a]);
				}
      } catch (e) {
        continue;
      }
    }
  }

  // Loop through all of the children listed for this element
  for (c in children) {
    if (children.hasOwnProperty(c)) {
      try {
        if (children[c].setAttribute) {
          elem.appendChild(children[c]);
        } else {
          child = KIP.Functions.CreateElement(children[c]);
          elem.appendChild(child);
        }
      } catch (e) {
        continue;
      }
    }
  }

  return elem;
};

// CreateElement
//------------------------------------------------------------------------------------
/**
 * Creates an HTML element with the attributes that are passed in through the object.
 *
 * @param {obj} obj - The object to base the element off of
 * @param {String} obj.id - The ID to assign to the created element
 * @param {String} obj.cls - The CSS class to assign the created element
 * @param {String} obj.type - The HTML tag to create. Defaults to "div" if not specified
 * @param {Array} obj.attr - An array of attributes to apply to the element.
 * @param {String} obj.attr.key - The name of the attribute to add
 * @param {String} obj.attr.val - The value of the attribute to add
 * @param {Array} obj.children - An array of child elements to add to the element. Can either be in the same object format as would be used for this function, or genuine HTML elements. Added in the order they appear in the array.
 * @param {String} obj.before_content - The inner HTML that should appear before any child elements are added
 * @param {String} obj.after_content - THe inner HTML that should be inserted after all child elements are drawn.
 * @return {HTMLElement} The HTML element with all attributes specified by the object
 *
 * @example
 * // returns an HTMl object that looks like this:
 * // <div id="123" class="cssClass" width="30"></div>
 * KIP.Functions.CreateElement( {id: "123", cls: "cssClass", attr: [{key: "width", val: 30}]});
 */
KIP.Functions.CreateElement = function (obj) {
  var elem, a, c, child, type;

  type = obj.type || "div";
  elem = document.createElement(type);

  if (obj.id) {
    elem.setAttribute("id", obj.id);
  }

  if (obj.cls) {
    elem.setAttribute("class", obj.cls);
  }

  if (obj.before_content) {
    elem.innerHTML = obj.before_content;
  }

  // Loop through all other attributes that we should be setting
  for (a in obj.attr) {
    if (obj.attr.hasOwnProperty(a)) {
      try {
        if (obj.attr[a].key) {
        	elem.setAttribute(obj.attr[a].key, obj.attr[a].val);
				} else {
					elem.setAttribute(a, obj.attr[a]);
				}
      } catch (e) {
        continue;
      }
    }
  }

  // Loop through all of the children listed for this element
  for (c in obj.children) {
    if (obj.children.hasOwnProperty(c)) {
      try {
        if (obj.children[c].setAttribute) {
          elem.appendChild(obj.children[c]);
        } else {
          child = KIP.Functions.CreateElement(obj.children[c]);
          elem.appendChild(child);
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Add any after html
  if (obj.after_content) {
    elem.innerHTML += obj.after_content;
  }

  return elem;
};

// AddCSSClass
//-----------------------------------------------------
/**
 * Allows a user to safely add a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to add the element
 */
KIP.Functions.AddCSSClass = function (elem, newClass) {
  var cls;
	
	if (!elem || !newClass) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
	elem.dispatchEvent(KIP.Events.CSSChange);

  // Still suport setting the class if the class is not originally set
  cls = elem.getAttribute("class");
  if (cls === null || cls === "null") {
    elem.setAttribute("class", newClass);
  }
	
	cls = " " + cls + " ";

  if (cls.indexOf(" " + newClass + " ") === -1) {
    cls = cls + newClass;
		elem.setAttribute("class", KIP.Functions.Trim(cls));
  }
};

// RemoveCSSClass
//--------------------------------------------------------
/**
 * Allows a user to safely remove a CSS class to an element's existing list of CSS classes
 *
 * @param {HTMLElement} elem    The element that should have its class updated
 * @param {string} newClass     The class to remove from the element
 */
KIP.Functions.RemoveCSSClass = function (elem, oldClass) {
  "use strict";
	var cls, len;
	
	if (!elem || !oldClass) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
	elem.dispatchEvent(KIP.Events.CSSChange);
	
  cls = " " + elem.getAttribute("class") + " ";
  len = cls.length;
  cls = cls.replace(" " + oldClass + " ", " ");

  if (cls.length !== len) {
		elem.setAttribute("class", KIP.Functions.Trim(cls));
  }

};

// HasCSSClass
//--------------------------------------------------
/**
 * Checks whether a provided HTML element has a CSS class applied
 *
 * @param {HTMLElement} elem - The element to check
 * @param {String} cls  - The CSS class to check for
 *
 * @returns {Boolean} True if the element has the CSS class applied; false otherwise
 */
KIP.Functions.HasCSSClass = function (elem, cls) {
	
	if (!elem) return;
	
	// Handle Drawables being passed in
	if (elem.Draw) elem = elem.div;
	
  var cur_cls = " " + elem.getAttribute("class") + " ";

  if (cur_cls.indexOf(" " + cls + " ") === -1) {
    return false;
  }

  return true;
};

// SetCSSAttribute
//------------------------------------------------------------------
/**
 * Sets the CSS definition for a given class and attribute.
 *
 * @param {string} cls   - The class to change
 * @param {string} item  - The attribute within the class to update
 * @param {string} val   - The new value to set the attribute to
 * @param {bool} force   - If true, will create the CSS attribute even if it doesn't exist
 *
 * @return {bool} True if the CSS was successfully set, false otherwise
 */
KIP.Functions.SetCSSAttribute = function (cls, item, val, force) {
  var i,css,sheet,rule;

  // Loop through all of the stylesheets we have available
  for (sheet = 0; sheet < document.styleSheets.length; sheet += 1) {

    // Pull in the appropriate index for the browser we're using
    css = document.all ? 'rules' : 'cssRules';  //cross browser
    rule = document.styleSheets[sheet][css];

    // If we have rules to loop over...
    if (rule) {

      // ... loop through them and check if they are the class we are looking for
      for (i = 0; i < rule.length; i += 1) {

        // If we have a match on the class...
        if (rule[i].selectorText === cls) {

          // ... and the class has the item we're looking for ...
          if ((rule[i].style[item]) || (force)) {

            //... set it to our new value, and return true.
            rule[i].style[item] = val;
            return true;
          }
        }
      }
    }
  }

  // Return false if we didn't change anything
  return false;
};

// GetCSSAttribute
//-------------------------------------------------------
/**
 * Grabs the value of a given CSS class's attribute
 *
 * @param {string} cls  - The CSS class to look within
 * @param {string} item - The attribute we want to grab the value for
 *
 * @return {string} The value of that particular CSS class's attribute
 */
KIP.Functions.GetCSSAttribute = function (cls, item) {
  var i, css, sheet, rule;

  // Loop through all of the stylesheets we have available
  for (sheet = 0; sheet < document.styleSheets.length; sheet += 1) {

    // Pull in the appropriate index for the browser we're using
    css = document.all ? 'rules' : 'cssRules';  //cross browser
    rule = document.styleSheets[sheet][css];

    // If we have an index...
    if (rule) {
      // ... loop through all and check for the actual class
      for (i = 0 ; i < rule.length; i += 1) {

        // If we find the class...
        if (rule[i].selectorText === cls) {

          // ... return what the item is set to (if anything)
          return (rule[i].style[item]);
        }
      }
    }
  }

  // Return a blank string if it couldn't be found
  return "";
};

KIP.Functions.CreateCSSClass = function (selector, attr, noAppend) {
	var cls, a, styles;

  styles = document.getElementsByTagName("style");
  if (styles.length > 0) {
    cls = styles[0];
  } else {
    cls = document.createElement("style");
    cls.innerHTML = "";
  }
	
	cls.innerHTML += "\n" + selector + " {\n";
	for (a in attr) {
    if (attr.hasOwnProperty(a)) {
      if (attr[a].key) {
        cls.innerHTML += "\t" + attr[a].key + ": " + attr[a].val + ";\n";
      } else {
        cls.innerHTML += "\t" + a + " : " + attr[a] + ";\n";
      }
    }
	}
	cls.innerHTML += "\n}";
	
	if (!noAppend) document.head.appendChild(cls);
  
  return cls;
}

// GetComputedStyle
//---------------------------------------------------------
/**
 * Gets the computed style of a given element
 *
 * @param {HTMLElement} elem - The element we are getting the style of
 * @param {string} attr - If passed in, the attribute to grab from the element's style
 *
 * @return {string} Either the particular value for the passed in attribute, or the whole style array.
 */
KIP.Functions.GetComputedStyle = function (elem, attr) {
  var style;

  // Use the library function on the window first
  if (window.getComputedStyle) {
    style = window.getComputedStyle(elem);

    if (attr) {
      return style.getPropertyValue(attr);
    } else {
      return style;
    }

  // If that doesn't work, maybe it's through the currentStyle property
  } else if (elem.currentStyle) {
    style = elem.currentStyle;

    if (attr) {
      return style[attr];
    } else {
      return style;
    }
  }

  return;
}

// GlobalOffsetLeft
//-------------------------------------------------------------
/**
 * Gets the offset left of this element in reference to the entire page
 *
 * @param {HTMLElement} elem   The element to get the offset of
 * @param {HTMLElement} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the left of the page (or parent, if included)
 */
KIP.Functions.GlobalOffsetLeft = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetLeft", parent);
};

// GlobalOffsetTop
//------------------------------------------------------------
/**
 * Gets the offset top of this element in reference to the entire page
 *
 * @param {HTMLElement} elem   The element to get the offset of
 * @param {HTMLElement} parent The parent element to use as the reference. If not included, it uses the document.body as the reference {optional}
 *
 * @return {int} The global offset of the elememt from the top of the page (or parent, if included)
 */
KIP.Functions.GlobalOffsetTop = function (elem, parent) {
  return KIP.Functions.auxGlobalOffset(elem, "offsetTop", parent);
};

// GlobalOffsets
//--------------------------------------------------------
/**
 * Gets both the left and top offset
 *
 * @param {HTMLElement} elem   The element to get the offsets for
 * @param {HTMLElement} parent The element to use as the reference frame
 *
 * @return {obj} Object with the keys "left" and "top"
 */
KIP.Functions.GlobalOffsets = function (elem, parent) {
  return {
    left: KIP.Functions.GlobalOffsetLeft(elem, parent),
    top: KIP.Functions.GlobalOffsetTop(elem, parent)
  };
};

/**
 * Helper function to get a global offset
 *
 * @param  {HTMLElement} elem   The element to get the global offset for
 * @param  {string} type   The type of offset we should look at (either "offsetTop" or "offsetWidth")
 * @param  {HTMLElement} parent The parent to use as the reference frame. Uses document.body by default {optional}
 *
 * @return {int} The specified offset for the element
 */
KIP.Functions.auxGlobalOffset = function (elem, type, parent) {
  var offset = 0;

  // Recursively loop until we no longer have a parent
  while (elem && (elem !== parent)) {
    if (elem[type]) {
      offset += elem[type];
    }
    elem = elem.offsetParent;
  }

  return offset;
};

// FindCommonParent
//----------------------------------------------------------------
/**
 * Finds the closest shared parent between two arbitrary elements
 *
 * @param {HTMLElement} elem_a  The first element to find the shared parent for
 * @param {HTMLElement} elem_b  The second element to find the shared parent for
 *
 * @return {HTMLElement} The closest shared parent, or undefined if it doesn't exist or an error occurred.
 */
KIP.Functions.FindCommonParent = function (elem_a, elem_b) {
  var parent_a, parent_b;

  // If eother element doesn't exist, no point in going further
  if (!elem_a || !elem_b) return undefined;

  // Set up the source parent, and quit if it doesn't exist
  parent_a = elem_a;

  // Set up the reference parent and quit if it doesn't exist
  parent_b = elem_b;

  // Loop through all parents of the source element
  while (parent_a) {

    // And all of the parents of the reference element
    while (parent_b) {

      // If they are the same parent, we have found our parent node
      if (parent_a === parent_b) return parent_a;

      // Otherwise, increment the parent of the reference element
      parent_b = parent_b.parentNode;
    }

    // Increment the source parent and reset the reference parent
    parent_a = parent_a.parentNode;
    parent_b = elem_b;
  }

  // return undefined if we never found a match
  return undefined;

};

// MoveRelToElement
//-------------------------------------------------------------------
/**
 * Moves a given element to a position relative to the reference element.
 *
 * This is for cases where you have two elements with different parents, and
 * you want to specify that element A is some number of pixels in some direction compared to element B.
 *
 * @param {HTMLElement} elem - The element to move
 * @param {HTMLElement} ref - The element to use as the reference element
 * @param {int} x - The x offset to give this element, relative to the reference
 * @param {int} y - The y offset to give this element, relative to the reference
 * @param {bool} no_move If set to false, only returns the offset_x and offset_y that the element would have to be moved {optional}
 *
 * @return {obj} An object containing the keys x and y, set to the offset applied to the element.
 */
KIP.Functions.MoveRelToElem = function (elem, ref, x, y, no_move) {
  var offset_me, offset_them, dx, dy;

  // Find the offsets globally for each element
  offset_me = KIP.Functions.GlobalOffsets(elem);
  offset_them = KIP.Functions.GlobalOffsets(elem);

  // Find the difference between their global offsets
  dx = (offset_them.left + x) - offset_me.left;
  dy = (offset_them.top + y) - offset_me.top;

  // Adjust the element to the position specified
  if (!no_move) {
    elem.style.position = "absolute";
    elem.style.left = dx + "px";
    elem.style.top = dy + "px";
  }

  // Always return the offset we assigned this element.
  return {x: dx, y: dy};

};

// RemoveSubclassFromAllElenents
//-------------------------------------------------------------------------------
/**
 * Allows you to easily remove a subclass from all elements that have a certain main class.
 * Useful for things like button selection
 * 
 * @param {String} cls - The main class to find all elements of
 * @param {String} subcls - The sub class to remove from all of those elements
 * @param {HTMLElement} [exception] - If needed, a single element that should not have its subclass removed.
 */
KIP.Functions.RemoveSubclassFromAllElements = function (cls, subcls, exception) {
	var elems, e, elem;
	elems = document.getElementsByClassName(cls);
	
	for (e = 0; e < elems.length; e += 1) {
		elem = elems[e];
		
		// Only remove it if it isn't the exception
		if (elem !== exception) {
			KIP.Functions.RemoveCSSClass(elem, subcls);
		}
	}
};

// AddResizingElement
//--------------------------------------------------------------------------------------
/**
 * Adds an element to the document that should resize with the document
 * @param {HTMLElement} elem - The element that should resize
 * @param {number} [fixedRatio] - If provided, keeps the image at this fixed ratio of w:h at all document sizes
 * @param {number} [forceInitW] - Optionally force the initial width to a certain value
 * @param {number} [forceInitH] - Optionally force the initial height to a certain value
 */
KIP.Functions.AddResizingElement = function (elem, fixedRatio, forceInitW, forceInitH) {
	"use strict";
	var idx, obj;
	if (!KIP.Globals.Resizables) {
		KIP.Globals.Resizables = [];
	}
	
	idx = KIP.Globals.Resizables.length;
	
	// Create an object with the initial parameters included
	KIP.Globals.Resizables[idx] = {
		
		// The original x, y, w, and h of the element
		o_x: KIP.Functions.GlobalOffsetLeft(elem),
		o_y: KIP.Functions.GlobalOffsetTop(elem),
		o_w: elem.offsetWidth,
		o_h: elem.offsetHeight,
		
		// The global width and height of the original window
		g_w: forceInitW || window.innerWidth,
		g_h: forceInitH || (window.innerWidth * fixedRatio) || window.innerHeight,
	
		// Other useful elements to keep track of
		h_w_ratio: fixedRatio || 1, 
		elem: elem
	};
	
	obj = KIP.Globals.Resizables[idx];
	
	// Add a listener on resize
	window.addEventListener("resize", function () {
		KIP.Functions.ResizeElement(obj);
	});
	
	return idx;
	
};

// ResizeElement
//---------------------------------------------
/**
 * Resizes an element to be the same ratio as it previously was
 * @param {HTMLElement} obj - The element to resize
 */
KIP.Functions.ResizeElement = function (obj) {
	var perc, h, wRatio, hRatio;
	
	// Calculate the ratio for the width
	wRatio = (window.innerWidth / obj.g_w);

	// Calculate the ratios we need for the height
	h = (obj.h_w_ratio * window.innerWidth) || (window.innerHeight);
	hRatio = (h / obj.g_h);
	
	// Calculate the x coordinate
	perc = (obj.o_x / obj.g_w); // Percentage of the width this appeared at originally
	obj.elem.style.left = (perc * window.innerWidth) + "px";
	
	// Calculate the y coordinate
	perc = (obj.o_y / obj.g_h);
	obj.elem.style.top = (perc * h) + "px";
	
	// Calculate the width and height
	obj.elem.style.width = (obj.o_w * wRatio) + "px";
	obj.elem.style.height = (obj.o_h * hRatio) + "px";
};

// RemoveElemFromArr
//-------------------------------------------------------------
/**
 * Finds & removes an element from the array if it exists.
 * @param {Array} arr - The array to remove from
 * @param {Variant} elem  - The element to remove
 * @param {Function} equal - The function that is used to test for equality
 */
KIP.Functions.RemoveElemFromArr = function (arr, elem, equal) {
  "use strict";
  var idx;

  // If we didn't get a function to test for equality, set it to the default
  if (!equal) {
    equal = function (a, b) {return (a === b); };
  }

  // Loop through the array and remove all equal elements
  for (idx = (arr.length - 1); idx >= 0; idx -= 1) {
    if (equal(arr[idx], elem)) {
      arr.splice(idx, 1);
    }
  }

};

// RoundToPlace
//--------------------------------------------------------
/**
 * Helper function to round a number to a particular place
 * @param {number} num - The number to round
 * @param {number} place - A multiple of 10 that indicates the decimal place to round to. I.e., passing in 100 would round to the hundredths place
 */
KIP.Functions.RoundToPlace = function (num, place) {
  return (Math.round(num * place) / place);
};

/**
  * 
*/
KIP.Functions.TransitionToDisplayNone = function (elem, func, disp) {
	"use strict";
	
	if (!disp) disp = "block";
	
	// Add the display none after a transition end 
	elem.addEventListener("transitionend", function () {
		if (func()) {
			elem.style.display = "none";
		}
	});
	
	// Remove the display none at the start of the fade in transition
	elem.addEventListener("csschangestart", function () {
		if (func()) {
			elem.style.display = disp;
		}
	})
};

// IsChildEventTarget
//--------------------------------------------------------
/**
 * Checks if a child of the current task is being targeted by the event
 * @param {Event} ev   - The event that is being triggered
 * @param {HTMLElement} root - The parent to check for
 * @returns {boolean} True if the event is being triggered on a child element of the root element, false otherwise
 */
KIP.Functions.IsChildEventTarget = function (ev, root) {
	"use strict";
	return KIP.Functions.IsChild(root, ev.target);
};

// IsChild
//--------------------------------------------------------
/**
 * Checks if an element is a child of the provided parent element
 * @param {HTMLElement} root - The parent to check for
 * @param {HTMLElement} child - The element to check for being a child of the root node
 * @param {number} [levels] - The maximum number of layers that the child can be separated from its parent. Ignored if not set.
 * @returns {boolean} True if the child has the root as a parent
 */
KIP.Functions.IsChild = function (root, child, levels) {
  "use strict";
  var parent;

  parent = child;

  // Loop through til we either have a match or ran out of parents
  while (parent) {
    if (parent === root) return true;
    parent = parent.parentNode;
  }

  return false;
};


// CreateTable
//-------------------------------------------------------------------------------------
/**
 * Creates a table with a specified set of cell elements
 * @param {string} tableID - The unique identifier to use for this table
 * @param {string} [tableClass] - The CSS class to use for the table
 * @param {array} elements - A 2D array of the indexing method [row][column] that contains the contents of the cell at this position that should be created within the table.
 *                         - Can come in three forms: a string of plain content, an already created element, or an object array with the following properties
 * @param {object} [elements[r][c].create] - An object to be passed into CreateElement, to generate the content of the cell
 * @param {string} [elements[r][c].content] - A string to be used as the content of the cell
 * @param {object} [elements[r][c].attr] - All additional attributes that should be applied to the cell (colspan & rowspan, e.g.)
 *
 * @returns {HTMLElement} The created HTML table
 * 
 * */
KIP.Functions.CreateTable = function (tableID, tableClass, elements, rowNum, colNum) {
  "use strict";
  
  var tbl, row, cell, elem, rIdx, cIdx, content, key;
  
  // Set a row number
  if (!rowNum) {
    rowNum = elements.length;
  }
  
  // Create the table
  tbl = KIP.Functions.CreateElement({
    type: "table",
    cls: tableClass
  });
  
  for (rIdx = 0; rIdx < rowNum; rIdx += 1) {
    // Grab the column number if we don't have it
    if (!colNum) {
      colNum = elements[rIdx].length;
    }
    
    row = tbl.insertRow(-1);
    for (cIdx = 0; cIdx < colNum; cIdx += 1) {
      
      // Check how this element should be added
      elem = elements[rIdx][cIdx];
      cell = row.insertCell(-1);
      this.ProcessCellContents(elem, cell);
    }
    
  }
  return tbl;
}

KIP.Functions.ProcessCellContents = function (data, cell) {
  "use strict";
  var content, key;
  
  // string
  if (data.toLowerCase) {
    cell.innerHTML = data;
    
  // HTML
  } else if (data.appendChild) {
    cell.appendChild(data)
  
  // Regular object
  } else {
    if (data.create) {
      content = KIP.Functions.CreateElement(data.create);
      cell.appendChild(content);
    } else {
      cell.innerHTML = data.content;
    }
    
    // Handle additional properties
    for (key in data.attr) {
      if (data.attr.hasOwnProperty(key)) {
        cell.setAttribute(key, data.attr[key]);
      }
    }
  }
  
  return cell;
};

KIP.Functions.AddRow = function (table, elements, idx, colNum) {
  "use strict";
  var row, cell, cIdx, data;
  
  if (!idx && (idx !== 0)) {
    idx = -1;
  }
  
  if (!colNum && colNum !== 0) {
    colNum = elements.length;
  }
  
  // Quit if we don't have a table
  if (!table) return;
  if (!table.insertRow) return;
  
  row = table.insertRow(idx);
  
  // Loop through columns to add cells
  for (cIdx = 0; cIdx < colNum; cIdx += 1) {
    cell = row.insertCell(-1);
    data = elements[cIdx] || "";
    this.ProcessCellContents(data, cell);
  }
  
  return row;
};
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
	
	
};/**
 * @file Helper functions for working with dates
 * @author Kip Price
 * @version 1.0
 * @since 1.1
 */

/**
 *	Finds the difference in days between two date objects
 *	@param {Date} a - The first date to compare
 *	@param {Date} b - The second date to compare
 *	@param {Boolean} [signed] - If true, will take the difference in order passed in
 *	@param {Boolean} [milli] - If true, will take the ms difference instead of the day difference
 *  @param {boolean} [inclusive] - If true, returns a value in milliseconds even if milliseconds weren't compared
 **/
KIP.Functions.DateDiff = function (a, b, signed, milli, inclusive) {
	"use strict";
	var ms, diff, dir;
	ms = (1000 * 60 * 60 * 24);
	
	// Make sure we are accurately rounding dates
	if (!milli) {
		a.setHours(0);
		a.setMilliseconds(0);
		a.setMinutes(0);
		a.setSeconds(0);
		
		b.setHours(0);
		b.setMilliseconds(0);
		b.setMinutes(0);
		b.setSeconds(0);
	}

	if ((a > b) || signed) {
		diff = (a - b);
	} else {
		diff = (b - a);
	}
	
	if (!milli) {
		diff = Math.floor(diff / ms);
	}
	
	if (inclusive) {
		diff += (ms * ((diff < 0) ? -1 : 1));
	}

	return diff;
};

KIP.Functions.BusinessDateDiff = function (a, b, signed, milli, inclusive) {
	"use strict";
	var diff, dowA, dowB, base, dir, idx, ret;
	diff = KIP.Functions.DateDiff(a, b, signed, milli, inclusive);

	if (diff < 0) {
		dir = -1;
	} else {
		dir = 1;
	}

	dowA = a.getDay();

	// Loop through the days between the two dates and pull out any weekend days
	ret = diff;
	for (idx = 0; idx < Math.abs(diff); idx += 1) {

		// If this date
		if (dowA === 0 || dowA === 6) {
			ret -= (1 * dir);
		}

		dowA += (idx * dir);
		dowA %= 7;
	}

	return ret;

}

/**
 * Gets the display string of the date in a short format (MM/DD/YYYY)
 * @param {Date} dt - The date to get the short date for
 */
KIP.Functions.ShortDate = function (dt) {
	"use strict";
	var yr;
	yr = (parseInt(dt.getFullYear()) % 100);
	return (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + yr;
};

KIP.Functions.InputDateFmt = function (dt) {
	"use strict";
	var m, d, y;
	y = dt.getFullYear();
	
	m = (dt.getMonth() + 1);
	if (m < 10) m = "0" + m;
	
	d = parseInt(dt.getDate(), 10);
	if (d < 10) d = "0" + d
	return (dt.getFullYear() + "-" + m + "-" + d);
}

/**
 * Gets the display string of the time in a short format (HH:MM)
 * @param {Date} dt - The date to extract the time from
 * @param {Boolean} withExtra - If true, will display as HH:MM AM/PM instead of military time
 */
KIP.Functions.ShortTime = function (dt, withExtra) {
	"use strict";
  var min, hours, half;

	//Get the minutes value for the current date
	min = parseInt(dt.getMinutes());
  hours = parseInt(dt.getHours());
  half = "";

	//We need to pad minutes to get a recognizable time format
	if (min < 10) {
		min = "0" + min;
	}

  if (withExtra) {
    half = " AM";
    if (hours >= 12) half = " PM";
    if (hours > 12) hours -= 12;
  }

	//Return unpadded hours (but in military time) and padded minutes.
	return hours + ":" + min + half;
};

/**
 * Gets the display string for a date and time
 * @param {Date} dt - The date to extract the formatted string from
 * @param {Boolean} withExtra - If true, uses AM/PM format instead of military time.
 */
KIP.Functions.ShortDateTime = function (dt, withExtra) {
	"use strict";
	return KIP.Functions.ShortDate(dt) + " " + KIP.Functions.ShortTime(dt, withExtra);
};

KIP.Functions.StopwatchDisplay = function (milli, noLeadingZeros, noBlanks) {
	"use strict";
	var seconds, minutes, hours, days, arr;

	seconds = Math.floor(milli / 1000); milli %= 1000;
	minutes = Math.floor(seconds / 60); seconds %= 60;
	hours = Math.floor(minutes / 60); minutes %= 60;
	days = Math.floor(hours / 24); hours %= 24;

	// Add the leading zeros if appropriate
	if (!noLeadingZeros) {
		arr = KIP.Functions.AddLeadingZeroes(2, String(seconds), String(minutes), String(hours));
		seconds = arr[0];
		minutes = arr[1];
		hours   = arr[2];
	}

	return days + "D  " + hours + ":" + minutes + ":" + seconds + " '" + milli;
};

KIP.Functions.AddLeadingZeroes = function (count) {
	"use strict";
	var aCnt, aItem, z, ret;

	ret = [];

	// Loop through all the other arguments we received
	for (aCnt = 1; aCnt < arguments.length; aCnt += 1) {
		aItem = arguments[aCnt];

		// Loop through the number of zeros we need to add and add them
		for (z = aItem.length; z < count; z += 1) {
			ret[aCnt - 1]  = "0" + aItem;
		}
	}

	return ret;
};

KIP.Functions.AddToDate = function (date, counts) {
	"use strict";

	if (counts.milliseconds) {
		date.setMilliseconds(date.getMilliseconds() + counts.milliseconds);
	}

	if (counts.seconds) {
		date.setSeconds(date.getSeconds() + counts.seconds);
	}

	if (counts.minutes) {
		date.setMinutes(date.getMinutes() + counts.minutes);
	}

	if (counts.hours) {
		date.setHours(date.getHours() + counts.hours);
	}

	if (counts.days) {
		date.setDate(date.getDate() + counts.days);
	}

	return date;

};

KIP.Functions.GetMonthName = function (date, short) {
	"use strict";
	switch (date.getMonth()) {
		case 0:
			if (short) return "Jan";
			return "January"
		case 1:
			if (short) return "Feb";
			return "February";
		case 2:
			if (short) return "Mar";
			return "March";
		case 3:
			if (short) return "Apr";
			return "April";
		case 4:
			return "May";
		case 5:
			if (short) return "Jun";
			return "June";
		case 6:
			if (short) return "Jul";
			return "July";
		case 7:
			if (short) return "Aug";
			return "August";
		case 8:
			if (short) return "Sept";
			return "September";
		case 9:
			if (short) return "Oct";
			return "October";
		case 10:
			if (short) return "Nov";
			return "November";
		case 11:
			if (short) return "Dec";
			return "December";
	}
	return "";
};

KIP.Functions.GetDayOfWeek = function (date, short){
	"use strict";
	switch (date.getDay()) {
		case 0:
			if (short) return "Sun";
			return "Sunday";
		case 1:
			if (short) return "Mon";
			return "Monday";
		case 2:
			if (short) return "Tues";
			return "Tuesday";
		case 3:
			if (short) return "Wed";
			return "Wednesday";
		case 4:
			if (short) return "Thurs";
			return "Thursday";
		case 5:
			if (short) return "Fri";
			return "Friday";
		case 6:
			if (short) return "Sat";
			return "Saturday";
	}
	return "";
};/*globals KIP*/

/**
 * @file Documents the Drawable class
 * @author Kip Price
 * @version 1.2
 * @since 0.1
 */

/**
 *This is an interface-esque object that abstracts the draw function
 *@constructor
 *@param {string} id - The ID that should be used for the div for this object
 *@param {string} cls - The class that should be used for the main div for this object
 *@param {string} content - The content that should be applied to this div
 */
KIP.Objects.Drawable = function (id, cls, content) {
  this.div = KIP.Functions.CreateSimpleElement(id, cls, content);
  this.children = [];
  this.elderSiblings = [];
  this.youngerSiblings = [];
  this.style = this.div.style;
};

/**
 * Adds a Drawable child to this {@link KIP.Objects.Drawable} object
 * @param {Drawable} child - The child to add to this Drawable
 * @param {HTMLElement} [parent] - If this child should be added to a different div, allow that
 * @version 1.1
 */
KIP.Objects.Drawable.prototype.AppendChild = function (child, parent, position) {
  "use strict";

  if (!this.children) {
    this.children = [];
  }

  if (!position && (position !== 0)) {
    position = this.children.length;
  }
	
	// Set the appropriate parent
	parent = parent || this.div;

	// Save the data into our array
  this.children.splice(position, 0, {child: child, parent: parent});
};

// Drawable.AddSibling
//-----------------------------------------------------------------------
/**
 * Adds a sibling to this main drawable node.
 * @param {variant} sibling - Either HTMLElement or Drawable to be drawn as a sibling
 * @param {boolean} before - True if this sibling should appear before the main div
 */
KIP.Objects.Drawable.prototype.AddSibling = function (sibling, before) {
  "use strict";
  
  if (before) {
    this.elderSiblings.push(sibling);
  } else {
    this.youngerSiblings.push(sibling);
  }
}

KIP.Objects.Drawable.prototype.RemoveSibling = function (sibling) {
  "use strict";
  
  // Quit if the child is nothing
  if (!sibling) return false;

  // Quit if we do not have any sibling collections
  if (!this.elderSiblings || !this.youngerSiblings) {
    return false;
  }
  
  if (!this.RemoveElem(sibling, this.elderSiblings)) {
    if (this.RemoveElem(sibling, this.youngerSiblings)) {
      return sibling;
    }
  }
  
  return false;
  
};

KIP.Objects.Drawable.prototype.RemoveElementByIdx = function (idx, arr) {
  "use strict";
  var elem;
  // Return false if the index is out of bound
	if ((idx < 0) || (idx > arr.length)) {
		return false;		
	} 
	
	elem = arr[idx];
	arr.splice(idx, 1);

  // Remove the child from its parent if it's a regular div
  if (elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }
	
	// Otherwise, call the erase function
	if (elem.Draw) {
		elem.Erase();
	}
};

KIP.Objects.Drawable.prototype.RemoveElem = function (element, arr) {
  "use strict";
  var idx;
  
  // Remove the child from our children array
  for (idx = 0; idx < arr.length; idx += 1) {
    if (arr[idx] === element) {
      if (this.RemoveElementdByIdx(idx)) {
				return element;
			}
		}
	}
};

/**
 * Removes a given child from a Drawable
 * @param {Drawable} child - The child to remove from our array and our parent
 * @returns {boolean} True if the child was successfully removed, false otherwise
 */
KIP.Objects.Drawable.prototype.RemoveChild = function (child) {
  "use strict";

  var idx;
	
	// Quit if child is nothing
	if (!child) return false;

  // Return false if we don't have any children to remove
  if (!this.children) {
    return false;
  }

  // Remove the item if it exists
  if (this.RemoveElem(child, this.children)) {
    return child;
  }
	
	// If we got this far, we must have failed to find anything
	return false;
};

/**
 * Removes a child by its index from a Drawable
 * @param {number} idx - The index to remove from our array
 * @param {boolean} 
 */
KIP.Objects.Drawable.prototype.RemoveChildByIdx = function (idx) {
	"use strict";
	return this.RemoveElementByIdx(idx, this.children);
}

/**
 * Removes a sibling by its index from a Drawable
 * @param {number} idx - The index to remove from our array
 * @param {boolean} 
 */
KIP.Objects.Drawable.prototype.RemoveSiblingByIdx = function (idx, before) {
	"use strict";
  if (before) {
    return this.RemoveElementByIdx(idx, this.elderSiblings);
  } else {
    return this.RemoveElementByIdx(idx, this.youngerSiblings);
  }
	
}

/**
 * Draws the elements for this {@link KIP.Objects.Drawable}
 * @param {HTMLElement} parent - The element to add the library div to
 * @param {boolean} [noErase] - True if the elements shouldn't be erased before drawing
 * @version 1.1
 */
KIP.Objects.Drawable.prototype.Draw = function (parent, noErase) {
  "use strict";
  var i, elem, sibling, that = this;

  // Quit if something went wrong and there is no longer a div element
  if (!this.div) return;

  // Set our current parent equal to the new thing passed in
  this.parent = parent || this.parent;

  // Call the refresh function, if it's something that we'd need to do
  this.Refresh();

  // Handle pre-siblings
  if (this.elderSiblings && this.elderSiblings.length > 0) {
    for (i = 0; i < this.elderSiblings.length; i += 1) {
      sibling = this.elderSiblings[i];
      
      if (sibling.parentNode && !noErase) {
        sibling.parentNode.removeChild(sibling);
      }
      
      this.parent.appendChild(sibling);
    }
  }
  
  // Remove the div that exists, if it does
  if (this.div.parentNode && !noErase) {
    this.div.parentNode.removeChild(this.div);
  }

  // Redraw the div onto the new parent
  this.parent.appendChild(this.div);
  
    // Handle post-siblings
  if (this.youngerSiblings && this.youngerSiblings.length > 0) {
    for (i = 0; i < this.youngerSiblings.length; i += 1) {
      sibling = this.youngerSiblings[i];
      
      if (sibling.parentNode && !noErase) {
        sibling.parentNode.removeChild(sibling);
      }
      
      this.parent.appendChild(sibling);
    }
  }

  // Call the shell function in case a child has overridden it
  this.BeforeDrawChildren();

  // If we have any children, loop through them too
  if (!this.children) return;
  for (i = 0; i < this.children.length; i += 1) {
		elem = this.children[i];
    if (elem.child) {
			
			// Draw it if it's a Drawable
			if (elem.child.Draw) {
      	elem.child.Draw(elem.parent);
				
			// Otherwise, just add to the parent
    	} else {
				if (elem.parentNode && !noErase) {
					elem.parentNode.removeChild(elem);
				}
				elem.parent.appendChild(elem.child);
			}
		}
	}

  // Call the shell function in case a child has overridden it
  this.AfterDrawChildren();
};

KIP.Objects.Drawable.prototype.Erase = function () {
	if (this.div.parentNode) {
		this.div.parentNode.removeChild(this.div);
	}
};

/**
 * Basic function for refreshing the elements of the Drawable. If not needed, this will do nothing.
 */
KIP.Objects.Drawable.prototype.Refresh = function () {

};

/**
 * Overridable function that will be run before the Draw function adds children drawables to the div.
 */
KIP.Objects.Drawable.prototype.BeforeDrawChildren = function () {

};


/**
 * Overridable function that will be run after the Draw function adds children drawables to the div.
 */
KIP.Objects.Drawable.prototype.AfterDrawChildren = function () {

};
/*globals KIP,window*/

/**
 * @file Documents the Editable class, which implements the Drawable prototype
 * @author Kip Price
 * @version 1.2
 * @since 0.1
 */

/**
 * Creates an Editable element and object
 * @constructor
 * @param {string} id - The ID that should be assigned to this object
 * @param {string} type - The type of input element that should display {optional}
 * @param {string} content - What should be shown as the content for {optional}
 * @param {function} validate - The function that should be used to validate if the editable can be saved {optional}
 * @param {function} update - The function to call once the editable successfully saves
 */
KIP.Objects.Editable = function (id, type, content, validate, update) {
  this.id = id;
  this.type = type || "text";
  this.content = content;
  this.validate = validate;
  this.update = update;
  this.is_modifying = false;

  KIP.Objects.Drawable.call(this, this.id, "editable", this.content);

  this.CreateElements();
  this.AddListeners();
};

// This relies on the drawable framework
KIP.Objects.Editable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/**
 * Adds all event listeners for this object (mostly click events);
 */
KIP.Objects.Editable.prototype.AddListeners = function () {
  var that = this;

  // Start our editing
  this.div.onclick = function (e) {
    if (!that.is_modifying) {
      that.Modify();
    }

    if (e.stopPropagation) e.stopPropagation();
    if (e.cancelBubble !== null) e.cancelBubble = true;
  };

  // Make sure that we stop editing when we click elsewhere
  window.addEventListener("click", function (e) {
    if (e.target === that.div) return;
    if (that.is_modifying) {
      that.Save();
    }
  });

  // Check to see if enter was pressed
  this.inputDiv.onkeydown = function (e) {
    if (e.keyCode === 13 && that.is_modifying) {
      that.Save();
    }
  };
};

/**
 * Creates all elements that are needed to display this editable.
 */
KIP.Objects.Editable.prototype.CreateElements = function () {
  this.inputDiv = KIP.Functions.CreateElement({type: "input", id: this.id + "|input", attr: [{key: "type", val: this.type}]});
};

/**
 * Starts the modification of the data of this editable
 */
KIP.Objects.Editable.prototype.Modify = function () {
  this.is_modifying = true;
  this.inputDiv.value = this.content;

  // Clear out the main div and add instead the input div
  this.div.innerHTML = "";
  this.div.appendChild(this.inputDiv);

  this.inputDiv.select();
	this.inputDiv.focus();

};

/**
 * Save the new contents of the editable, assuming that validation is successful
 */
KIP.Objects.Editable.prototype.Save = function () {
  var content;

  // Grab the user input
  content = this.inputDiv.value;

  this.div.removeChild(this.inputDiv);

  // Revert our modifying status
  this.is_modifying = false;

  // If validation exists and it failed, revert the change
  if (this.validate && !this.validate(content)) {
    this.inputDiv.value = this.content;
    this.div.innerHTML = this.content;
    return;

  // If either we don't have a validation function, or it succeeded, then just replace the text
  } else {
    this.content = content;
    this.div.innerHTML = content;

    // Notify any listeners that the editable has been saved
    if (this.update) {
      this.update(this.content, this);
    }
  }
};
KIP.Objects.EventHandler = function () {

};/*globals KIP,window*/

// Form
//---------------------------------------------------------------------------
/**
 * Creates a generic form that can be displayed or hidden
 * @param {string} id - The identifier for the form
 * @param {string} title - The title of the form, to show in the title bar
 * @param {number} columns - The number of columns the main table of this form should have
 * @param {array} [btns] - An array of the buttons that should appear in the bottom rght corner of the form
 * @param {function} [saveCB] - What function to use to save the values on this form
 * @param {boolean} [hideOverlay] - If true, this form will not add a semi-opaque overlay over the rest of the screen when open
 * @returns {Form} The created form
 * @class Form
 */
KIP.Objects.Form = function (id, title, columns, btns, saveCb, hideOverlay) {
  "use strict";
  this.id = id;
  this.title = title || "Options";
  this.columnNum = columns || 2;
  this.rowNum = 0;
  this.tableData = [];
  this.btns = btns || [];
  this.saveCb = saveCb || function () {};
  this.fields = new KIP.Objects.Collection();
  
  this.showOverlay = !hideOverlay;
  this.standardStyle = true;
  this.themeColor = "rgba(0,135,230,1)";
  
  // Create our div
  KIP.Objects.Drawable.call(this, this.id, "form");
  
  // Create child divs
  this.CreateElements();
};

/**
 * @extends Drawable
 */
KIP.Objects.Form.prototype = Object.create(KIP.Objects.Drawable.prototype);

// Form.CreateTitleBar
//--------------------------------------------------------

KIP.Objects.Form.prototype.CreateTitleBar = function () {
  "use strict";
  var that = this;
  this.titleBar = KIP.Functions.CreateSimpleElement("", "titleBar", this.title);
  
  // Add a link to close the form
  this.closeLink = KIP.Functions.CreateSimpleElement(this.id + "-close", "close", "CLOSE");
  this.closeLink.addEventListener("click", function () {
    that.CloseForm();
  });
  this.titleBar.appendChild(this.closeLink);
  
  this.AppendChild(this.titleBar);
};

// Form.CreateOverlay
//-------------------------------------------------------
KIP.Objects.Form.prototype.CreateOverlay = function () {
  "use strict";
  var that = this;
  
  // Create & add the overlay as a sibling to the form
  this.overlay = KIP.Functions.CreateSimpleElement("", "overlay");
  this.overlay.addEventListener("click", function () {
    that.CloseForm();
  })
  this.AddSibling(this.overlay);
}
  
// Form.CreateBtnBar
//----------------------------------------------------------

/**
 *Creates the bottom bar that displays buttons
 * @param
 */
KIP.Objects.Form.prototype.CreateBtnBar = function (btns) {
  "use strict";
  var btn, cb, idx, that;
  this.btnBar = KIP.Functions.CreateSimpleElement("", "btnBar");
  
  // Save off the callback we will use to add actions to the buttons
  that = this;
  cb = function (data) {
    var elem;
    elem = KIP.Functions.CreateSimpleElement(that.id + "-" + data.id, "btn " + data.cls, data.lbl);
    if (data.click) {
      elem.addEventListener("click", data.click);
    }
    if (data.color) {
      elem.style.backgroundColor = data.color;
    }
    return elem;
  }
  
  // Go through each of the provided buttons & create them
  for (idx = 0; idx < this.btns.length; idx += 1) {
    
    btn = this.btns[idx];
    
    // Default in some actions for the "OK" case
    if ((btn.lbl === "OK" || btn.lbl === "Accept" || btn.lbl === "Save") && !btn.click) {
      btn.click = function () {
        that.Save();
        that.CloseForm();
      }
    }
    
    // Default in some actions for the "Cancel" case
    if ((btn.lbl === "Cancel") && !btn.click) {
      btn.click = function () {
        that.CloseForm();
      }
    }
    
    // Add the actions to the button
    btn = cb(btn);
    this.btnBar.appendChild(btn);
  }
  
  // Add the button to the overall bar
  this.AppendChild(this.btnBar);
};

// Form.CreateElements
//---------------------------------------------------------
KIP.Objects.Form.prototype.CreateElements = function () {
  "use strict";
  
  // Create semi-opaque layer to sit behind the form
  this.CreateOverlay();
  
  // Create the top bar of the form
  this.CreateTitleBar();
  
  // Create the areas where the form will actually display data
  this.CreateContent();
  
  // Create the bottom bar of buttons
  this.CreateBtnBar();
  
}

// Form.CreateContent
//-------------------------------------------------------
KIP.Objects.Form.prototype.CreateContent = function () {
  "use strict";
  
  // Create the top section of the form
  this.top = KIP.Functions.CreateSimpleElement("", "top");
  this.AppendChild(this.top);
  
  // Create a containing div for the columns
  this.table = KIP.Functions.CreateTable(this.id + "-table", "columnContainer", "", 0, this.columnNum);
  this.AppendChild(this.table);
  
  // Create the bottom section of the form
  this.bottom = KIP.Functions.CreateSimpleElement("", "bottom");
  this.AppendChild(this.bottom);
};

// Form.AddField
//---------------------------------------------------------------------------------------
KIP.Objects.Form.prototype.AddField = function (id, field, position, lbl, lblPosition) {
  "use strict";
  
  // Default label position to be the same as the regular position
  if (!lblPosition && lblPosition !== 0) {
    lblPosition = position;
  }

  
  if (lbl) {
    this.AddElement(lbl, lblPosition);
  }
  this.AddElement(field, position);
  
  if (field) {
    this.fields.AddElement(id, {
      "elem": field,
      "id": id
    });
  }
  
  if (this.div.parentNode) {
    this.Draw();
  }
  
  return field;
};

// Form.AddHeader
//-----------------------------------------------------------
KIP.Objects.Form.prototype.AddHeader = function (txt, cls) {
  "use strict";
}

// Form.AddElement
//----------------------------------------------------------------------
/*
 *@description Adds an HTML element to the given position on the form
 *@param {HTMLElement} element - The HTML element to add to the form
 *@param {variant} position - The position at which an element should appear in the form
*/
KIP.Objects.Form.prototype.AddElement = function (element, position) {
  "use strict";
  var row, data;
  
  // Top
  if (position === "top") {
    this.top.appendChild(element);
  
  // Bottom
  } else if (position === "bottom") {
    this.bottom.appendChild(element);
  }
  
  // Specific column
  else {
    
    if (this.rowNum > 0 && this.tableData[this.rowNum - 1]) {
      row = this.tableData[this.rowNum - 1];
      if (!row.children[position] || !row.children[position].innerHTML) {
        KIP.Functions.ProcessCellContents(element, row.children[position]);
      } else {
        data = [];
        data[position] = element;
        row = KIP.Functions.AddRow(this.table, data, "", this.columnNum);
        this.rowNum += 1;
        this.tableData.push(row);
      }
    } else {
      data = [];
      data[position] = element;
      row = KIP.Functions.AddRow(this.table, data, "", this.columnNum);
      this.rowNum += 1;
      this.tableData.push(row);
    }
  }
}

// Form.AddTextInput
//--------------------------------------------------------------------------------------
/*
 * Adds a text-input to the form.
 * @param {string} id - What identifier to use for this input
 * @param {string} [txt] - The value to use for the field initially
 * @param {variant] position - Where the text input should be displayed in the form. If a string, "top" or "bottom" are acceptable. If numeric, it should be a 0-indexed 
 * @param {string} [ghostTxt] - The text to use as the placeholder for the input
 * @param {string} [lbl] - The label to use to describe the text
 */
KIP.Objects.Form.prototype.AddTextInput = function (id, txt, position, ghostTxt, lbl) {
  "use strict";
  return this.AddInput(id, "text", txt, [{key: "placeholder", val: ghostTxt}], lbl, "", position, position);
};

// Form.AddExpandingInput
//--------------------------------------------------------------------------------------------------------------------------------------------
/*
 * Add an input that, when data is entered, expands to an extra field
 * @param {string} id - THe unique identifier for 
 * @param {string} subID
 * @param {string} [type]
 * @param {string} position
 * @param {string} [value]
 * @param {object} [attr]
 * @param {string} [lbl]
 * @param {string} [cls]
 * @param {function} [changeCb]
 * @param {function} [blurCb]
 * @param {array} [addlListeners]
 * @returns {HTMLElement} The expandable field that was created
 */
KIP.Objects.Form.prototype.AddExpandingInput = function (id, subID, type, position, value, attr, lbl, cls, changeCb, blurCb, addlListeners) {
  "use strict";
  var field, that, a, aList;
  that = this;
  
  // Make sure we have an ID & a subID
  if (!subID) subID = 0;
  
  // Create the field
  field = this.AddInput(id + "." + subID, type || "text", value, attr, lbl, cls, position, position);
  
  // Add a content listener that adds fields
  field.addEventListener("keyup", changeCb || function (e) {
    var next;
    next = document.getElementById(id + "." + (subID + 1));
    if (!next && this.value.length > 0) {
      that.AddExpandingTextInput(id, subID + 1, txt, position, ghostTxt, lbl);
    }
    this.focus();
  });
  
  // Add a content listener to remove fields on lost focus when they are empty
  field.addEventListener("blur", blurCb || function () {
    if (this.value.length === 0) {
      that.RemoveField(this.id + "." + this.subID);
    }
  });
  
  // Add any additional listeners
  if (addlListeners) {
    for (a = 0; a < addlListeners.length; a += 1) {
      aList = addlListeners[a];
      if (!aList) continue;
      field.addEventListener(aList.type, aList.func);
    }
  }
};

// Form.AddExpandingInputTable
//-----------------------------------------------------------------------------------------------------------------------------------------
/* Creates a table that expands when the user adds details */
KIP.Objects.Form.prototype.AddExpandingInputTable = function (ids, subID, types, positions, values, attrs, lbls, classes, addlListeners) {
  "use strict"
  var c, field, that, changeCb, blurCb, cb;
  that = this;
  
  // Function for adding new rows
  changeCb = function () {
    var next;
    next = document.getElementById(ids[0] + "." + (subID + 1));
    if (!next && this.value.length > 0) {
      that.AddExpandingInputTable(ids, subID + 1, types, positions, values, attrs, lbls, classes, addlListeners);
    }
    this.focus();
  }
  
  // Function for removing empy rows
  blurCb = function () {
    var i, empty, f, k;
    empty = true;
    
    for (i = 0; i < ids.length; i += 1) {
      f = that.fields.GetElement(ids[i] + "." + subID).value;
      if (f.elem.value.length > 0) {
        empty = false;
        break;
      }
    }
    
    // Only clear the row if everything is empty
    if (!empty) return;
    
    // Remove the entire row
    for (i = 0; i < ids.length; i += 1) {
      k = ids[i] + "." + subID;
      that.RemoveField(k);
    }
  }
  
  // Loop through the columns we received
  for (c = 0; c < ids.length; c += 1) {
    this.AddExpandingInput(ids[c], subID, types && types[c] || "", positions && positions[c] || 0, values && values[c] || "", attrs && attrs[c] || {}, lbls && lbls[c] || "", classes && classes[c] || "", changeCb, blurCb, addlListeners && addlListeners[c]);
  }
}

KIP.Objects.Form.prototype.RemoveField = function (id, ignoreContent) {
  "use strict";
  var field;
  
  field = this.fields.GetElement(id).value;
  if (!field) return false;
  if (field.elem.value && !ignoreContent) return false;
  
  // Remove from view
  if (field.elem.parentNode) {
    field.elem.parentNode.removeChild(field.elem);
  }
  
  // Remove from collection
  this.fields.RemoveElement(id);
  
  return true;
}

// Form.AddInput
//-----------------------------------------------------------------------------------------------------------------------------
/*
 @description Adds an input element to the form with the provided parameters
 @param {variant} id - If a string, treated as the identifier for the element. If an object, used to grab values for all parameters.
 @param {string} [type] - What type of input is being created. Defaults to "text".
 @param {string} [value] - What value, if any, should be set initially in this field
 @param {obj} [addlAttr] - An object containing key-value pairs of any additional attributes that need to be set for this input.
 @param {string} [lbl] - What label should be used to describe this element.
 @param {string} [cls] - What class should be applied for this input
 @param {string} position - The position at which this input should be placed.
 @param {string} [lblPosition] - THe position at which the label for this input should be placed. Defaults to the position value.
 @returns {HTMLElement} The field that was created.
*/
KIP.Objects.Form.prototype.AddInput = function (id, type, value, addlAttr, lbl, cls, position, lblPosition) {
  "use strict";
  var input, lblElem;
  
  // Check if an object was passed in instead of individual parts
  if (typeof id === "object") {
    type = id.type;
    value = id.value;
    addlAttr = id.attr;
    lbl = id.lbl;
    cls = id.cls;
    position = id.position;
    lblPosition = id.lblPosition;
    id = id.id;
  }
  
  if (!addlAttr) {
    addlAttr = {};
  }
  
  addlAttr.type = type;
  addlAttr.value = value;
  
  input = KIP.Functions.CreateElement({
    type: "input",
    cls: cls,
    id: id,
    attr : addlAttr
  });
                          
  if (lbl) {
    lblElem = KIP.Functions.CreateSimpleElement(id + "lbl", "lbl", lbl);
  }
  
  // Add both of these new elements to our form
  return this.AddField(id, input, position, lblElem, lblPosition);
  
}

// Form.Save
//--------------------------------------------------
KIP.Objects.Form.prototype.Save = function () {
  "use strict";
  var fIdx, field, values;
  values = {};
  
  // Loop through all of our fields
  for (fIdx = 0; fIdx < this.fields.Length(); fIdx += 1) {
    field = this.fields.GetElement("", fIdx).value;
    
    values[field.id] = field.elem.value;
  }
  
  if (this.saveCb) {
    this.saveCb(values);
  }
};

//Form.CloseForm
//---------------------------------------------------
/**
  *
  */

KIP.Objects.Form.prototype.CloseForm = function () {
  "use strict";
  if (this.overlay.parentNode) {
    this.overlay.parentNode.removeChild(this.overlay);
  }
  
  if (this.div.parentNode) {
    this.div.parentNode.removeChild(this.div);
  }
};

// Form.AfterDrawChildren
//---------------------------------------------------------------------------
/**
  * Makes sure to create the standard CSS styles unless the caller disabled it
  */
KIP.Objects.Form.prototype.AfterDrawChildren = function () {
  "use strict";
  if ((this.standardStyle) && (!this.stylesCreated)) {
    this.ApplyStandardStyles();
    this.stylesCreated = true;
  }
};

// Form.ApplyStandardStyles
//---------------------------------------------------------------------------
/**
  * Creates standard CSS classes for each of the elements in the form. Can be overridden with more specific CSS.
  */
KIP.Objects.Form.prototype.ApplyStandardStyles = function () {
  "use strict";
  var ov, form, input, title, btns, pStyle, lbl, column, cPerc;

  // Force parent to have an explicit display
  pStyle = KIP.Functions.GetComputedStyle(this.parent, "position");
  if (pStyle === "static") {
    pStyle = "relative";
  }
  this.parent.style.position = pStyle;
  
  // Overlay styles
  ov = {
    "position": "fixed",
    "left": 0,
    "top" : 0,
    "width": "100%",
    "height" : "100%",
    "background-color": "rgba(0,0,0,0.7)",
    "z-index" : "1"
  };
  ov = KIP.Functions.CreateCSSClass(".overlay", ov);
  
  // form formatting
  form = {
    "left": "30%",
    "top": "15%",
    "background-color": "#FFF",
    "box-shadow" : "1px 1px 13px 4px rgba(0,0,0,.2);",
    "font-family" : "Segoe UI, Calibri, sans",
    "z-index" : "2",
    "position" : "absolute",
    "display" : "block",
    "max-width": "80%",
    "padding" : "10px",
    "width" : "40%"
  };
  form = KIP.Functions.CreateCSSClass(".form", form);
  
  // input formatting
  input = {
    "background-color" : "rgba(0,0,0,.1)",
    "border" : "1px solid rgba(0,0,0,.25)",
    "font-family" : "Segoe UI, Calibri, sans",
  };
  input = KIP.Functions.CreateCSSClass(".form input", input);
  input = {
    "width": "250px",
    "outline" : "none"
  };
  input = KIP.Functions.CreateCSSClass(".form input[type=text]", input);
  
  // title bar
  title = {
    "width" : "calc(100% - 10px)",
    "text-align" : "center",
    "background-color" : this.themeColor,
    "color" : "#FFF",
    "padding" : "5px",
    "font-size" : "20px",
    "position" : "absolute",
    "top" : "-30px",
    "left" : "0px"
  };
  title = KIP.Functions.CreateCSSClass(".form .titleBar", title);
  title = {
    "float" : "right",
    "display" : "inline-block",
    "opacity": "0.7",
    "font-size": "15px",
    "padding-top" : "2px",
    "padding-right" : "5px"
  }
  title = KIP.Functions.CreateCSSClass(".form .titleBar .close", title);
  title = {
    "opacity": "1",
    "cursor" : "pointer"
  }
  title = KIP.Functions.CreateCSSClass(".form .titleBar .close:hover", title);
  
  // button bar
  btns = {
    "width" : "100%",
    "display" : "flex",
    "flex-direction" : "row",
    "justify-content" : "flex-end",
    "font-size" : "20px"
  };
  btns = KIP.Functions.CreateCSSClass(".form .btnBar", btns);
  btns = {
    "padding" : "5px",
    "box-shadow": "1px 1px 1px 1px rgba(0,0,0,.2)",
    "border-radius" : "3px",
    "font-size" : "15px",
    "opacity" : "0.7",
    "margin" : "5px"
  }
  btns = KIP.Functions.CreateCSSClass(".form .btnBar .btn", btns);
  btns = {
      "opacity" : "1",
      "cursor" : "pointer"
  }
  btns = KIP.Functions.CreateCSSClass(".form .btnBar .btn:hover", btns);
  
  // Labels
  lbl = {
    "color": "#666",
    "display" : "inline-block",
    "text-align": "right",
    "padding-left" : "5px",
    "padding-right" : "5px"
  }
  lbl = KIP.Functions.CreateCSSClass(".form .lbl", lbl);
  
  // Columns
  column = {
    "display" : "table",
    "width" : "100%"
  }
  column = KIP.Functions.CreateCSSClass(".form .columnContainer", column);
  cPerc = 100 / this.columnNum; 
  column = {
    "width" : cPerc + "%",
    "display" : "table-cell"
  };
  column = KIP.Functions.CreateCSSClass(".form .column", column);
};KIP.Constants.GraphTypeEnum = {
	"Pie" : 0,
	"Bar" : 1,
	"Circle" : 2,
	"Tier" : 3,
	"Line": 4,
	"Trend": 5
};

/** 
 * Creates a graph object  of various types
 * @class Graph
 * @param {string} id - The unique identifier for the graph
 * @param {GraphTypeEnum} type - The type of graph we are creating
 **/
KIP.Objects.Graph = function (id, type) {
	this.id = id;
	this.data = [];
	this.dataListeners = [];
	this.type = type;
	this.sortedData = [];
	
	this.elems = [];

	// The root of a graph is an SVG drawable
	KIP.Objects.SVGDrawable.call(this, id);
};

// The graph is based off of an SVG Drawable
KIP.Objects.Graph.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

// Graph.AddData
//--------------------------------------------------------------------------------------------
/**
 * Adds a piece of data to the graph. Each graph handles this data separately
 * @param {string} label - What the data should be labeled with
 * @param {number} independent - The x value of this data
 * @param {number} [dependent] - The y value of this data
 * @param {number} [depth] - The z value of this data
 * @param {variant} [addl] - Any additional data that this particular graph might need to dispalt its data
 * @returns {number} The index at which this data is placed
 */
KIP.Objects.Graph.prototype.AddData = function (label, independent, dependent, depth, addl) {
	"use strict";
	var idx;

	idx = this.data.length;

	this.data[idx] = {lbl: label, x: independent, y: dependent, z: depth, extra: addl};

	this.AddDataAppropriateForGraph(idx);
	
	return idx;
};

// Graph.AddDataAppropriateForGraph
//------------------------------------------------------------------------
/**
 * Placeholder function that is overriden by each type of graph
 * @param {number} idx - The index of the data we are adding toLocaleString
 */
KIP.Objects.Graph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
};

// Graph.AddListenerToData
//--------------------------------------------------------------------------
/**
 * Queues up an event listener to a particular piece of data, to be added when it is drawn
 * @param {number} idx - The index of the data to add the listener to
 * @param {string} type - The type of listener we want to add
 * @param {function} func - The call back function for the listener
 */
KIP.Objects.Graph.prototype.AddListenerToData = function (idx, type, func) {
	"use strict";
	var cnt;

	if (!this.dataListeners[idx]) {
		this.dataListeners[idx] = [];
	}

	cnt = this.dataListeners[idx].length;
	this.dataListeners[idx][cnt] = {type: type, listener: func};
};

// Graph.AttachDataLsteners
//---------------------------------------------------------------------
/**
 * Add the appropriate event listeners to the current piece of data
 * @param {number} idx - The index of the piece of data being drawn
 * @param {SVGElement} pc - The SVG element to add the event listener to
 */
KIP.Objects.Graph.prototype.AttachDataListeners = function (idx, pc) {
	"use strict";
	var type, listenerArr, listener, jdx;
	listenerArr = this.dataListeners[idx];

	if (!listenerArr) return;
	
	// Loop through all of the events we have for this index
	for (jdx = 0; jdx < listenerArr.length; jdx += 1) {
		
		// Skip this if we don't have any data
		if (!listenerArr[jdx]) continue;
		
		// Grab the type and callback
		type = listenerArr[jdx].type;
		listener = listenerArr[jdx].listener;
		
		// Don't do anything if we're missing something
		if ((!type) || (!listener)) continue;
		
		// Otherwise, add the event listener
		pc.addEventListener(type, listener);
	}
};

// =================== CIRCULAR GRAPH SUBTYPE ===============================
// CircularGraph
//------------------------------------------------
/**
 * Prototypical graph object to use for pie graphs and circle graphs
 * @param {string} id - The unique identifier for this graph
 * @param {GraphTypeEnum} type - What type of graph this will become
 */
KIP.Objects.CircularGraph = function (id, type) {
	"use strict";
	KIP.Objects.Graph.call(this, id, type);
};

// Inherits the basic properties of a graph
KIP.Objects.CircularGraph.prototype = Object.create(KIP.Objects.Graph.prototype);

// CircularGraph.AddTextAroundRing
//---------------------------------------------------------------------------------------------------------------------------------
/** 
 * Adds a label in the appropriate position around the circular graph
 * @param {string} txt - The text to display as the label
 * @param {number} startAngle - The beginning angle (in degrees) of the data we are labeling
 * @param {number} endAngle - The ending angle (in degrees) of the data we are labeling
 * @param {SVGElement} reFElem - The element to add the label to
 * @param {number} [r] - The radius for this particular piece of data
 * @param {string} [id] - A unique identifier for this label
 * @param {string} [cls] - A CSS class to use for this label
 * @param {SVGElement} [group] - The SVG group to add this to
 * @param {boolean} [rotate] - True if the text should be rotated around the graph.
 * @returns {SVGElement} The created label
 */
KIP.Objects.CircularGraph.prototype.AddTextAroundRing = function (txt, startAngle, endAngle, refElem, r, id, cls, group, rotate) {
	"use strict";
	var tDeg, tRad, tX, tY, origin, text, rAng, box;

	// Quit if this isn't a circular graph
	if (!this.radius) return;

	// Allow a passed in radius
	r = r || this.radius;

	// Calculate the position at which the text should appear
	tDeg = startAngle + (endAngle - startAngle) / 2;
	tRad = KIP.Functions.DegreesToRadians(tDeg);
	
	tY = KIP.Functions.RoundToPlace(-1 * Math.cos(tRad), 1000);
	tX = KIP.Functions.RoundToPlace(Math.sin(tRad), 1000);

	origin = {};

	// Calculate where to stick the y component of the origin
	origin.y = (tY / -4) + 0.75;

	// Calculate where to stick the x component of the origin
	origin.x = (tX / -2) + 0.5;
	
	// Actually add the text
	text = this.AddText(refElem, txt, this.center.x + (tX * (r + 1)), this.center.y + ((r + 1) * tY), this.fontStyle, id, cls, origin, group);
	
	// Rotate if appropriate
	if (rotate) {
		box = this.MeasureElem(text);
		rAng = (((endAngle - startAngle ) / 2) + startAngle) % 45 + 315;
		text.setAttribute("transform", "rotate(" + (rAng) + " " + (box.x + (box.width / 2)) + " " + (box.y + (box.height / 2)) + ")");
	}
	
	return text;

};

// CircularGraph.AddPieceListeners
//------------------------------------------------------------------------------------
/**
 * Adds the mouse in/out listeners for the data pieces to show labels
 * @param {SVGElement} piece - The element to add the listeners to
 * @param {string} text - The label to show on mouse over
 * @param {SVGElement} [box] - The SVG rectangle that appears behind the text
 */
KIP.Objects.CircularGraph.prototype.AddPieceListeners = function (piece, text, box) {
	"use strict";
	if (!piece || !text) return;

	piece.addEventListener("mouseover", function () {
		text.style.opacity = 1;
		if (box) box.style.opacity = 0.8;
	});

	piece.addEventListener("mouseout", function () {
		text.style.opacity = 0;
		if (box) box.style.opacity = 0;
	});

	text.style.transition = "opacity ease-in-out .2s";
	text.style.opacity = 0;
	if (box) {
		box.style.opacity = 0;
		box.style.transition = "opacity ease-in-out .2s";
	}
	
};

//======================= PIE GRAPH ==============================//
// PieGraph.Refresh
//--------------------------------------------------------------------------
/**
 * Creates a pie graph that can show up to two types of data for every piece (percentage and height)
 * @param {string} id - The unique identifier for this graph
 * @param {object} [center] - The center point at which to draw this graph. Default is {x: 80, y: 80}
 * @param {number} [center.x] - The x position of the center. Default is 80
 * @param {number} [center.y] - The y position of the center. Default is 80
 * @param {number} [radius] - The radius of the graph. This is ignored if also changing the height of the graph. Default is 40
 * @param {object} [style] - The style to use when drawing the graph
 * @param {boolean} [labelAtTop] - Set to true if the mouse over label should only appear at the top
 */
KIP.Objects.PieGraph = function (id, center, radius, style, labelAtTop) {
	"use strict";

	this.center = center || {x: 80, y: 80};
	this.radius = radius || 30;
	this.total = 0;
	this.style = style || {stroke : {type: "solid", color : "#000", width: "0px"}, fill : {type : "solid"}};
	this.fontStyle = {font: {family: "Segoe UI", size: "10px"}, fill: {type: "solid"}};
	this.hslRotate = KIP.Constants.HSLPieceEnum.Saturation;
	this.labelAtTop = labelAtTop || false; 
	this.sort = true;
	this.keyX = 0;
	this.keyY = 0;
	this.days = 0;
	
	this.addLabels = true;
	this.addKey = true;

	KIP.Objects.CircularGraph.call(this, id, KIP.Constants.GraphTypeEnum.Pie);
};

KIP.Objects.PieGraph.prototype = Object.create(KIP.Objects.CircularGraph.prototype);

KIP.Objects.PieGraph.prototype.ChooseColorRotate = function (hsl) {
	this.hslRotate = hsl;
};

// PieGraph.Refresh
//-------------------------------------------------------
/**
 * Draws all of the pieces needed for the pie graph
 */
KIP.Objects.PieGraph.prototype.Refresh = function () {
	var datum, dIdx, elem, perc, lastDeg, text, style, tX, tY, tDeg, origin, r, layerWedge, layerText, layerBox, box, textBox, sIdx, key;
	style = this.style;

	lastDeg = 0;

	this.Clear();
	
	layerWedge = this.CreateGroup("wedges");
	layerBox = this.CreateGroup("boxes");
	layerText = this.CreateGroup("text");
	
	// If we should use the radius for the key, adjust to that
	if (this.keyOnRadius) {
		this.keyX = this.center.x + this.radius + 5;
		this.keyY = this.center.y - this.radius + this.gutter;
		
	// Otherwise, just use max X & min Y
	} else {
		this.keyX = this.max_x || 0;
		this.keyY = this.min_y;
	}
	
	this.sortedArray = this.data.slice();
	
	// First, sort by size (unless the user requested otherwise)
	if (this.sort) {
		this.sortedArray = this.sortedArray.sort(function (a, b) {
			if (a.x > b.x) {
				return -1;
			} else if (a.x < b.x) {
				return 1;
			}

			return 0;
		});
	}
	
	// Loop through our newly sorted array to draw things
	for (sIdx = 0; sIdx < this.sortedArray.length; sIdx += 1) {
		datum = this.sortedArray[sIdx];
		dIdx = datum.id;
		perc = (datum.x / this.total);
		r = datum.y || this.radius;

		// Color the font to match the data
		this.fontStyle.fill.color = style.fill.color = KIP.Functions.GenerateColor("", this.hslRotate);
		
		// If there's only one element, just draw a circle
		if (this.data.length === 1) {
			elem = this.AddCircle(this.center.x, this.center.y, r, this.style, "", "", layerWedge);
		
		// Otherwise, draw a wedge
		}else {
			elem = this.AddPerfectArc(this.center, r, lastDeg, lastDeg + (perc * 360), 1, false, style, "", "", layerWedge);
		}
		
		// ========== LABELS =========
		if (this.addLabels) {
			// If we are showing the labels around the data, use our standard function
			if (!this.labelAtTop) {
				text = this.AddTextAroundRing(datum.lbl, lastDeg, lastDeg + (perc * 360), elem, r, "", "", layerText, this.rotate);

			// Otherwise, show it at the top of the graph
			} else {
				text = this.AddText(elem, datum.lbl, this.center.x - this.radius, this.center.y - this.radius - 16, this.fontStyle, "", "", "",  layerText);
				box = this.MeasureElem(text);
				textBox = this.AddRectangle(box.x, box.y, box.width, box.height, {fill: {type: "solid", color: "#FFF"}}, "", "", layerBox);
			}
		}
		
		// Add a key for the graph
		if (this.addKey) {
			key = this.AddDataToKey(datum, layerText);
		}

		//Only show the text on hover
		this.AddPieceListeners(elem, text, textBox);
		this.AttachDataListeners(dIdx, elem);

		lastDeg += (perc * 360);
		
		// Store the elements we created into our elem array
		this.elems[dIdx] = {
			piece: elem,
			label: text,
			labelBox: textBox,
			color: style.fill.color,
			keyText: key
		};
	}

	// Add the final line to the key
	if (this.addKey) {
		this.fontStyle.fill.color = "#000";
		this.keyY += 5;
		this.AddDataToKey({x: this.total, lbl: "TOTAL"}, layerText);

		if (this.days) {
			this.AddDataToKey({x: KIP.Functions.RoundToPlace(this.total / this.days, 10), lbl: "Avg Day"}, layerText);
		}
	}
};

// PieGraph.AddDataToKey
//----------------------------------------------------------------------
/**
 * Adds a label to the key for the graph
 * @param {object} datum - The data we are adding to the key
 * @param {SVGGroup} layer - The SVG group to add this key display to
 */
KIP.Objects.PieGraph.prototype.AddDataToKey = function (datum, layer) {
	"use strict";
	var txt, box, style;
	
	// Add the text
	style = JSON.parse(JSON.stringify(this.fontStyle));
	style.font.size = "6";
	txt = this.AddText(undefined, datum.lbl + " : " + datum.x, this.keyX, this.keyY, style, "", "", "",  layer);
	
	// Calculate the measurements for next time
	box = this.MeasureElem(txt);
	this.keyY = this.keyY + box.height;
	
	return txt;
};

// PieGraph.AddAppropriateDataForGraph
//----------------------------------------------------------------------------
/**
 * Adds to our total of our pie graph
 * @param {number} idx - The index at which the data appears
 */
KIP.Objects.PieGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var datum;

	// Add to the total so we can get the percentages right
	datum = this.data[idx];
	this.total += datum.x;
	datum.id = idx;

	// Redraw if we have drawn before
	if (this.parent) {
		this.Draw();
	}
};

//====================== CIRCLE GRAPH =============================//
// CircleGraph
//---------------------------------------------------------------
/**
 * Creates a graph with multiple rings to show multiple data sets on a circle
 * @param {string} id - The unique identifier for this graph
 * @param {object} [center] - The center point for this graph
 * @param {number} [center.x] - The x position of the center point of the graph
 * @param {number} [center.y] - The y position of the center point of the graph
 * @param {number} [radius] - The size of the graph
 * @param {object} [style] - The style to use for the graph
 */
KIP.Objects.CircleGraph = function (id, center, radius, style) {
	"use strict";
	this.center = center || {x: 80, y: 80};
	this.radius = radius || 30;
	this.ringTotals = [];
	this.style = style || {stroke : {type: "solid", color : "#000", width: "5px"}, fill : {}};
	this.fontStyle = {font: {family: "Segoe UI", size: "10px"}, fill: {type: "solid"}};
	this.strokeWidth = 5;
	
	// Implements a circular graph
	KIP.Objects.CircularGraph.call(this, id, KIP.Constants.GraphTypeEnum.Circle);
};

// Implements the CircularGraph object as its prototype
KIP.Objects.CircleGraph.prototype = Object.create(KIP.Objects.CircularGraph.prototype);

// CircleGraph.Refresh
//---------------------------------------------------------
/**
 * Draws all of the pieces of the graph and adds listeners and labels
 */
KIP.Objects.CircleGraph.prototype.Refresh = function () {
	"use strict";
	var colors, text, dIdx, datum, max, perc, elem, ring, width, r, lastDeg, nextDeg, c, opacity, layerRings, layerText;

	// Creates the layers for the circle graph
	layerRings = this.CreateGroup("rings");
	layerText = this.CreateGroup("text");
	
	// Initialize some variables we need
	max = Math.max.apply(this, this.ringTotals);
	colors = {};
	lastDeg = [];

	// Loop through all of the data we have available
	for (dIdx = 0; dIdx < this.data.length; dIdx += 1) {
		datum = this.data[dIdx];

		// If we don't yet have a color for this label, create a new one
		if (!colors[datum.lbl]) {
			colors[datum.lbl] = KIP.Functions.GenerateColor(datum.lbl, KIP.Constants.HSLPieceEnum.Hue);
		}
		c = colors[datum.lbl];

		// Pull out the pieces of data we need
		ring = datum.y;
		width = datum.z * this.strokeWidth;

		// Calculate what degree this piece of data should appear at
		if (!lastDeg[ring]) {
			lastDeg[ring] = 0;
		}
		nextDeg = ((datum.x * 360) / max) + lastDeg[ring];

		// If the ring is negative, it should be displayed as a ghost ring
		if (ring < 0) {
			ring = -1 * ring;
			opacity = 0.4;
		} else {
			opacity = 1;
		}

		// Set up the style and radius
		r = this.radius + ((this.radius / 2) * ring);
		this.style.stroke.width = width + "px";
		this.style.stroke.color = c;

		// Add the element and its hover text
		elem = this.AddPerfectArc(this.center, r, lastDeg[ring], nextDeg, 1, true, this.style, "", "", layerRings);
		elem.style.opacity = opacity;
		text = this.AddTextAroundRing(datum.lbl, lastDeg[ring], nextDeg, elem, r + (width - this.strokeWidth), "", "", layerText);
		this.div.appendChild(elem);
		
		// Add event listeners
		this.AddPieceListeners(elem, text);
		this.AttachDataListeners(dIdx, elem);
		
		// Increment the degree count
		lastDeg[ring] = nextDeg;
	}
};

// CircleGraph.AddDataAppropriateForGraph
//------------------------------------------------------------------------------
/**
 * Adds data to the circlegraph specific data collections
 * @param {number} idx - THe index at which the raw data lives
 */
KIP.Objects.CircleGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var ring, datum;

	datum = this.data[idx];
	ring = datum.y;

	if (ring < 0) {
		ring = -1 * ring;
	}

	// Add to the total for this ring
	if (!this.ringTotals[ring]) {
		this.ringTotals[ring] = 0;
	}

	this.ringTotals[ring] += datum.x;

	// Redraw if we have drawn before
	if (this.parent) {
		this.Draw();
	}
};

//====================== TRENDING GRAPH ==============================//
KIP.Objects.TrendingGraph = function (id, minX, minY) {
	this.min_x = minX || 10000000;
	this.min_y = minY || 10000000;
	this.hslRotate = KIP.Constants.HSLPieceEnum.Hue;
	
	this.style = {fill: {}, stroke: {type: "solid", width: "0.2"}, font : {family: "Calibri"}};
	this.fontStyle = {fill : {type: "solid"}, font : {family: "Calibri"}};
	// Call the constructor for the graph
	KIP.Objects.Graph.call(this, id,  KIP.Constants.GraphTypeEnum.Trend);
};

KIP.Objects.TrendingGraph.prototype = Object.create(KIP.Objects.Graph.prototype);

KIP.Objects.TrendingGraph.prototype.AddDataAppropriateForGraph = function (idx) {
	"use strict";
	var datum;
	
	datum = this.data[idx];
	
	this.UpdateView(datum.x, datum.y, 1, 1);
};

KIP.Objects.TrendingGraph.prototype.AddLineListeners = function (line, lbl, box) {
	"use strict";
	var that = this;
	if (!line || !lbl) return;

	line.addEventListener("mouseover", function () {
		lbl.style.opacity = 1;
		line.style.strokeWidth = (that.style.stroke.width * 3) + "px";
		if (box) box.style.opacity = 0.8;
	});

	line.addEventListener("mouseout", function () {
		lbl.style.opacity = 0;
		line.style.strokeWidth = that.style.stroke.width + "px";
		if (box) box.style.opacity = 0;
	});

	lbl.style.opacity = 0;
};

KIP.Objects.TrendingGraph.prototype.Refresh = function () {
	"use strict";
	var datum, sorted, lastLine, dIdx, ptLayer, txtLayer, lastElem, xDiff, yDiff, txt;
	
	// Sort the array by the z value
	sorted = this.data.slice();
	sorted = sorted.sort(function (a, b) {
		if (!a || !b) return 0;
		if ((a.z === undefined) || (b.z === undefined)) return 0;
		
		if (a.z > b.z) {
			return 1;
		} else if (a.z < b.z) {
			return -1;
		}
		
		if (a.x > b.x) {
			return 1;
		} else if (a.x < b.x) {
			return -1;
		}
		
		return 0;
	});
	
	xDiff = this.max_x - this.min_x;
	yDiff = this.max_y - this.min_y;
	
	this.style.stroke.width = (Math.min(xDiff, yDiff) / 70);
	
	this.fontStyle.font.size = (this.style.stroke.width * 8);
	
	// Create the groups
	ptLayer = this.CreateGroup("pts");
	txtLayer = this.CreateGroup("txt");
	
	// Loop through our sorted data and draw our points and lines
	for (dIdx = 0; dIdx < sorted.length; dIdx += 1) {
		datum = sorted[dIdx];
		
		// If the last line doesn't match the current value, create a new line
		if (((datum.z === undefined) && !lastElem) || (lastLine !== datum.z)) {
			
			// Generate a color
		this.fontStyle.fill.color = this.style.stroke.color = KIP.Functions.GenerateColor("", this.hslRotate);
			
			if (datum.z !== undefined) lastLine = datum.z;
			lastElem = this.AddChild("path", {d : ""}, this.style, "", "", ptLayer);
			txt = this.AddText(lastElem, datum.lbl, datum.x, datum.y, this.fontStyle, "", "", "", txtLayer);
			
			this.AddLineListeners(lastElem, txt);
			this.MoveTo(datum.x, datum.y, lastElem);
		
		// Otherwise, add to the last line
		} else {
			this.LineTo(datum.x, datum.y, lastElem);
		}
	}
	
	//this.FinishPath(lastElem);
};
/*globals KIP,window*/

/**
 * @file Declaration of the Hoverable class
 * @author	Kip Price
 * @version 1.2
 * @since 0.8
 */

/**
 * @enum Enum of positions that the Hoverable could take
 * @readonly
 * @enum {number}
 */
KIP.Globals.HoverOffsetEnum = {
	"Top" : 1,
	"TopRightAlign": 17,
	"Bottom" : 2,
	"BottomRightAlign" : 18,
	"Left" : 4,
	"LeftBottomAlign" : 36,
	"Right" : 8,
	"RightAlign" : 16,
	"BottomAlign" : 32,
	"RightBottomAlign" : 40,
	"Top-Left" : 5,
	"Top-Right" : 9,
	"Bottom-Left" : 6,
	"Bottom-Right" : 10,
	"Custom": 0
};

/**
 * Creates a drawable that can hover over its parent in a particular location
 * @class
 *
 * @param {String} id - The ID to give the hover element
 * @param {String} cls - The class to assign the element, in addition to the standard "hoverable" class
 * @param {String} content - What to display within the element
 * @param {HTMLElement} [ref] - The reference element to base the position off of
 * @param {OffsetEnum} [offset=Top] - Where to position the hover element relative to the reference
 * @param {Boolean} [isSVG=False] - If the reference element is an SVG, set this to true
 * @param {Object} [adjust] - An optional parameter that will slightly adjust the calculated placement of the Hoverable
 * @param {Number} [adjust.x] - The additional x value to add to the offset of the Hoverable
 * @param {Number} [adjust.y] - The additional y value to add to the offset of the Hoverable
 */
KIP.Objects.Hoverable = function (id, cls, content, ref, offset, isSVG, adjust) {
	"use strict";
	this.id = id;
	this.cls = "hoverable " + cls;
	this.content = content;
	this.reference = ref;
	this.offset = offset || KIP.Globals.HoverOffsetEnum.Top;
	this.isSVG = isSVG;

	this.adjust = adjust || {x: 0, y: 0};

	// Initialize the element to be disabled
	this.enabled = false;

	// Create the div using the drawable constructor
	KIP.Objects.Drawable.call(this, this.id, this.cls, this.content);

	// Apply the styles that actually matter
	this.div.style.position = "absolute";
};

// Implement the Drawable prototype
KIP.Objects.Hoverable.prototype = Object.create(KIP.Objects.Drawable.prototype);

/**
 * Sets whether this hoverable should be drawn on its draw event
 *
 * @param {Boolean} enabled - True if we should complete the draw event when it is called
 */
KIP.Objects.Hoverable.prototype.SetEnabled = function (enabled) {
	this.enabled = enabled;
};

/**
 * Overrides the Drawable draw to make some position adjustments
 *
 * @param {HTMLElement} parent - The parent to add this hoverable to
 */
KIP.Objects.Hoverable.prototype.Draw = function (parent) {
	var that = this;
	// Setup the parent if we need it
	this.parent = parent || this.parent;
	if (!this.parent) return;

	// Quit if we aren't enabled
	if (!this.enabled) return;

	// Do our initial setup
	this.SetupParent();
	this.MoveChild();

	// Actually draw
	KIP.Objects.Drawable.prototype.Draw.call(this, this.parent);

	// Tweak everything so it fits
	this.AdjustChild();
	this.nudged = true;

	// Make sure we nudge back on screen as we need
	window.setTimeout(function() {
		if (!that.nudged) {
			that.NudgeOnscreen();
			that.nudged = true;
		}
	}, 0);
};

/**
 * Guarantee that the parent's class will allow the hover element to be placed relatively
 */
KIP.Objects.Hoverable.prototype.SetupParent = function () {

	// Quit if there isn't a parent yet
	if (!this.parent) return;

	// Make sure the parent always has a strictly coded position
	this.parent.style.position = KIP.Functions.GetComputedStyle(this.parent, "position");
	if (this.parent.style.position === "static") {
		this.parent.style.position = "relative";
	}
};

/**
 * Move the child hoverable roughly to where it needs to be.
 * Fine-tuning will happen after drawing
 */
KIP.Objects.Hoverable.prototype.MoveChild = function () {
	"use strict";
	var w, h, off_x, off_y, box;

	off_x = 0;
	off_y = 0;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	if (!this.reference) this.reference = this.parent;

	// Calculate where the reference is right now
	if (!this.isSVG) {
		w = this.reference.offsetWidth;
		h = this.reference.offsetHeight;
	} else {
		box = this.reference.getBoundingClientRect();
		off_x = box.left;
		w = box.right - box.left;
		//off_y = box.top;
		h = box.bottom - box.top;
	}

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y += (-1 * h);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Bottom) {
		off_y += h;
	} else {
		off_y += 0;
	}

	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x += (-1 * w);
	} else if (this.offset & KIP.Globals.HoverOffsetEnum.Right) {
		off_x += w;
	} else {
		off_x += 0;
	}

	this.div.style.left = (off_x + "px");
	this.div.style.top = (off_y + "px");
};

/**
 * Adjusts the hover element so it is in the proper location and on screen
 */
KIP.Objects.Hoverable.prototype.AdjustChild = function () {
	"use strict";
	var w, h, off_x, off_y, g_off_x, g_off_y, pw, ph;

	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;

	w = this.div.offsetWidth;
	h = this.div.offsetHeight;
	off_x = this.div.offsetLeft;
	off_y = this.div.offsetTop;
	g_off_x = KIP.Functions.GlobalOffsetLeft(this.div);
	g_off_y = KIP.Functions.GlobalOffsetTop(this.div);
	pw = this.parent.offsetWidth;
	ph = this.parent.offsetHeight;

	// Use bit checks to determine where the hover should start
	if (this.offset & KIP.Globals.HoverOffsetEnum.Top) {
		off_y = (-1 * h);
	}
	
	// If we are right aligning something, we will need to adjust our x value by our width
	if (this.offset & KIP.Globals.HoverOffsetEnum.RightAlign) {
		off_x = (pw - w);
	}

	// If we are putting something on the left side, put it there properly
	if (this.offset & KIP.Globals.HoverOffsetEnum.Left) {
		off_x = (-1 * w);
	}
	
	// If we are bottom-aligning something, we will need to adjust our y offset
	if (this.offset & KIP.Globals.HoverOffsetEnum.BottomAlign) {
		off_y = (ph - h);
	}

	// Check to make sure that this is on the screen
	// ----------------------------------------------
	// >> Offscreen left : move to the right side >>
	if ((g_off_x + w) < 0) {
		off_x = this.reference.offsetWidth;
	}

	// >> Offscreen right : move to the left side >>
	if (g_off_x > window.innerWidth) {
		off_x = (-1 * w);
	}

	// >> Offscreen bottom, or offscreen left still : move to the top >>
	if ((g_off_y  > window.innerHeight) || (g_off_x < 0)) {
		off_y = (-1 * h);
		off_x = 0;
	}

	// >> Offscreen top : move to the bottom >>
	if ((g_off_y + h) < 0) {
		off_y = this.reference.offsetHeight;
	}
	
	KIP.Functions.MoveRelToElem(this.div, this.reference, off_x + (this.adjust.x || 0), off_y + (this.adjust.y || 0));
	
};

/**
 * Scoots the element so that all of it is onscreen 
 */
KIP.Objects.Hoverable.prototype.NudgeOnscreen = function () {
	var w, h, off_x, off_y, g_off_x, g_off_y;
	
	// Quit if the offset is custom; the caller will have to set it
	if (this.offset === KIP.Globals.HoverOffsetEnum.Custom) return;
	
	w = this.div.offsetWidth;
	h = this.div.offsetHeight;
	
	off_x = this.div.offsetLeft;
	off_y = this.div.offsetTop;
	
	g_off_x = KIP.Functions.GlobalOffsetLeft(this.div);
	g_off_y = KIP.Functions.GlobalOffsetTop(this.div);
	
	//-----------------------------------------------------
	// If we need to nudge anything back on screen, do so
	if (!(this.offset & KIP.Globals.HoverOffsetEnum.Left) && !(this.offset & KIP.Globals.HoverOffsetEnum.Right)){
		if (g_off_x < 0) {
			off_x += (-1 * g_off_x);
		}

		// >> Offscreen right : nudge left >>
		if ((g_off_x + w) > window.innerWidth) {
			off_x -= ((g_off_x + w) - window.innerWidth);
		}
	}

	if (!(this.offset & KIP.Globals.HoverOffsetEnum.Top) && !(this.offset & KIP.Globals.HoverOffsetEnum.Bottom)){
		// >> Offscreen bottom, or offscreen left still : nudge up >>
		if ((g_off_y + h) > window.innerHeight) {
			off_y -= ((g_off_y + h) - window.innerHeight);
		}

		// >> Offscreen top : nudge down >>
		if (g_off_y  < 0) {
			off_y += (-1 * g_off_y);
		}
	}
	
		
	KIP.Functions.MoveRelToElem(this.div, this.reference, off_x, off_y);
};
/*globals KIP,window*/
if (!window.KIP) {
  /**
   * Global structure of the KIP library
   * @namespace KIP
   */
  window.KIP = {
    /**
     * All object definitions contained within the library
     * @namespace Objects
     */
    Objects : {
      Drawable : function () {},
      Editable :  function () {},
      SVGDrawable :  function () {},
      Form :  function () {}
    },

    /**
     * All global function definitions contained within the library
     * @namespace Functions
     */
    Functions : {},

    /**
     * All constants that are necessary for this library
     * @namespace Constants
     */
    Constants : {},

    /**
     * All globals that are necessary for this library
     * @namespace Globals
     */
    Globals : {},

    /**
     * All configurable options for the library
     * @namespace Options
     */
    Options : {},

    /**
     * All unit tests for the library
     * @namespace Test
     */
    Test : {},

    /**
     * All events for the library
     * @namespace Events
     */
    Events : {}
  };
}

KIP.Constants.Files = ["core", "stringHelper", "dateTools", "trig", "drawable", "svg_helper", "color", "collection", "server", "editable", "hoverable", "svg", "ctxmenu", "form", "graph", "projectPlan", "select"];
KIP.Constants.StandaloneFiles = {"core" : "1", "stringHelper" : "1", "dateTools" : "1", "trig" : "1", "drawable" : "1", "svg_helper" : "1", "color" : "1", "collection" : "1", "server" : "1"};
KIP.Constants.DrawableDependents = {"editable" : "1", "hoverable" : "1", "svg" : "1", "ctxmenu" : "1", "form" : "1", "graph" : "1", "select" : "1", "projectPlan" : "1"};
KIP.Constants.DropboxPath = "https://dl.dropboxusercontent.com/u/52957066/javascript%20tools/toolkip.js/";

KIP.Functions.Include = function (include, cb) {
  "use strict";
  var type, idx, elem, create, next, loaded, onLoad, max;
  
  loaded = 0;
  max = include.length;
  
  // Actually load the script tag
  create = function (type, i) {
    
    
    // Make sure we call the "everything loaded" callback when everything is actually loaded
    onLoad = function () {
      loaded += 1;
      
      if (loaded === max) {
        if (cb) {
          cb();
        } 
      }
    };
    
    KIP.Functions.CreateScriptElement(type, onLoad);
    next(i + 1);
  }
  
  // Grab the next element
  next = function (i) {
    var type;
    type = include[i];
   
    // Quit if this is the last one
    if (!type) {
      
      return;
    }
    
    // Add the element
    create(type, i);
  }

  next(0);
};

KIP.Functions.IncludeKIP = function (include, exclude, cb) {
  "use strict";
  var i, fName , r1, r2, myCb;
  r1 = [];
  r2 = [];
  
  if (!include) {
    include = KIP.Constants.Files.slice();
  }
  if (!exclude) {
    exclude = [];
  }
  
  for (i = (include.length - 1); i >= 0; i -= 1) {
    fName = include[i];
    
    if (!exclude[fName]) {
      
      if (KIP.Constants.DrawableDependents[fName]) {
        r2.push(KIP.Constants.DropboxPath + fName + ".js");
      } else {
        r1.push(KIP.Constants.DropboxPath + fName + ".js");
      }
      
    }
  }
  
  myCb = function () {
    KIP.Functions.Include(r2, cb);
  }
  
  KIP.Functions.Include(r1, myCb);
}

KIP.Functions.CreateScriptElement = function (url, onLoad) {
  "use strict";
  var elem;
  
  elem = document.createElement("script");
  elem.setAttribute("src", url);
  if (onLoad) {
    elem.onload = onLoad;
  }
  document.head.appendChild(elem);
  
  return elem;
}

var KIP={Objects:{},Functions:{},Constants:{},Globals:{},Options:{},Test:{}};KIP.Functions.CreateSimpleElement=function(a,b,c,d){var e,f;e=document.createElement("div");a&&e.setAttribute("id",a);b&&e.setAttribute("class",b);c&&(e.innerHTML=c);for(f in d)if(d.hasOwnProperty(f))try{e.setAttribute(d[f].key,d[f].val)}catch(g){}return e;};
KIP.Functions.CreateElement=function(a){var b,c,d,e;b=document.createElement(a.type||"div");a.id&&b.setAttribute("id",a.id);a.cls&&b.setAttribute("class",a.cls);a.before_content&&(b.innerHTML=a.before_content);for(c in a.attr)if(a.attr.hasOwnProperty(c))try{b.setAttribute(a.attr[c].key,a.attr[c].val)}catch(f){}for(d in a.children)if(a.children.hasOwnProperty(d))try{a.children[d].setAttribute?b.appendChild(a.children[d]):(e=KIP.Functions.CreateElement(a.children[d]),b.appendChild(e))}catch(f){}a.after_content&&
(b.innerHTML+=a.after_content);return b};KIP.Functions.AddCSSClass=function(a,b){var c;a&&(a.Draw&&(a=a.div),c=" "+a.getAttribute("class")+" ",-1===c.indexOf(" "+b+" ")&&a.setAttribute("class",KIP.Functions.Trim(c+b)))};KIP.Functions.RemoveCSSClass=function(a,b){var c,d;a&&(a.Draw&&(a=a.div),c=" "+a.getAttribute("class")+" ",d=c.length,c=c.replace(" "+b+" "," "),c.length!==d&&a.setAttribute("class",KIP.Functions.Trim(c)))};
KIP.Functions.HasCSSClass=function(a,b){if(a)return a.Draw&&(a=a.div),-1===(" "+a.getAttribute("class")+" ").indexOf(" "+b+" ")?!1:!0};KIP.Functions.SetCSSAttribute=function(a,b,c,d){var e,f,g;for(f=0;f<document.styleSheets.length;f+=1)if(e=document.all?"rules":"cssRules",g=document.styleSheets[f][e])for(e=0;e<g.length;e+=1)if(g[e].selectorText===a&&(g[e].style[b]||d))return g[e].style[b]=c,!0;return!1};
KIP.Functions.GetCSSAttribute=function(a,b){var c,d,e;for(d=0;d<document.styleSheets.length;d+=1)if(c=document.all?"rules":"cssRules",e=document.styleSheets[d][c])for(c=0;c<e.length;c+=1)if(e[c].selectorText===a)return e[c].style[b];return""};KIP.Functions.GetComputedStyle=function(a,b){var c;if(window.getComputedStyle)return c=window.getComputedStyle(a),b?c.getPropertyValue(b):c;if(a.currentStyle)return c=a.currentStyle,b?c[b]:c};
KIP.Functions.GlobalOffsetLeft=function(a,b){return KIP.Functions.auxGlobalOffset(a,"offsetLeft",b)};KIP.Functions.GlobalOffsetTop=function(a,b){return KIP.Functions.auxGlobalOffset(a,"offsetTop",b)};KIP.Functions.GlobalOffsets=function(a,b){return{left:KIP.Functions.GlobalOffsetLeft(a,b),top:KIP.Functions.GlobalOffsetTop(a,b)}};KIP.Functions.auxGlobalOffset=function(a,b,c){for(var d=0;a&&a!==c;)a[b]&&(d+=a[b]),a=a.offsetParent;return d};
KIP.Functions.FindCommonParent=function(a,b){var c,d;if(a&&b)for(c=a,d=b;c;){for(;d;){if(c===d)return c;d=d.parentNode}c=c.parentNode;d=b}};KIP.Functions.MoveRelToElem=function(a,b,c,d,e){var f;b=KIP.Functions.GlobalOffsets(a);f=KIP.Functions.GlobalOffsets(a);c=f.left+c-b.left;d=f.top+d-b.top;e||(a.style.position="absolute",a.style.left=c+"px",a.style.top=d+"px");return{x:c,y:d}};
KIP.Functions.RemoveSubclassFromAllElements=function(a,b,c){var d,e;a=document.getElementsByClassName(a);for(d=0;d<a.length;d+=1)e=a[d],e!==c&&KIP.Functions.RemoveCSSClass(e,b)};
KIP.Functions.AddResizingElement=function(a,b,c,d){var e,f;KIP.Globals.Resizables||(KIP.Globals.Resizables=[]);e=KIP.Globals.Resizables.length;KIP.Globals.Resizables[e]={o_x:KIP.Functions.GlobalOffsetLeft(a),o_y:KIP.Functions.GlobalOffsetTop(a),o_w:a.offsetWidth,o_h:a.offsetHeight,g_w:c||window.innerWidth,g_h:d||window.innerWidth*b||window.innerHeight,h_w_ratio:b||1,elem:a};f=KIP.Globals.Resizables[e];window.addEventListener("resize",function(){KIP.Functions.ResizeElement(f)});return e};
KIP.Functions.ResizeElement=function(a){var b,c,d,e;d=window.innerWidth/a.g_w;c=a.h_w_ratio*window.innerWidth||window.innerHeight;e=c/a.g_h;b=a.o_x/a.g_w;a.elem.style.left=b*window.innerWidth+"px";b=a.o_y/a.g_h;a.elem.style.top=b*c+"px";a.elem.style.width=a.o_w*d+"px";a.elem.style.height=a.o_h*e+"px"};KIP.Functions.RemoveElemFromArr=function(a,b,c){var d;c||(c=function(a,b){return a===b});for(d=a.length-1;0<=d;--d)c(a[d],b)&&a.splice(d,1)};
KIP.Functions.RoundToPlace=function(a,b){return Math.round(a*b)/b};KIP.Functions.DateDiff=function(a,b,c,d){a=a>b||c?a-b:b-a;return d?a:Math.round(a/864E5)};KIP.Functions.ShortDate=function(a){var b;b=parseInt(a.getFullYear())%100;return a.getMonth()+1+"/"+a.getDate()+"/"+b};KIP.Functions.ShortTime=function(a,b){var c,d,e;c=parseInt(a.getMinutes());d=parseInt(a.getHours());e="";10>c&&(c="0"+c);b&&(e=" AM",12<=d&&(e=" PM"),12<d&&(d-=12));return d+":"+c+e};KIP.Functions.ShortDateTime=function(a,b){return KIP.Functions.ShortDate(a)+" "+KIP.Functions.ShortTime(a,b)};
KIP.Functions.StopwatchDisplay=function(a,b,c){var d,e,f;c=Math.floor(a/1E3);a%=1E3;d=Math.floor(c/60);c%=60;e=Math.floor(d/60);d%=60;f=Math.floor(e/24);e%=24;b||(b=KIP.Functions.AddLeadingZeroes(2,String(c),String(d),String(e)),c=b[0],d=b[1],e=b[2]);return f+"D  "+e+":"+d+":"+c+" '"+a};KIP.Functions.AddLeadingZeroes=function(a){var b,c,d,e;e=[];for(b=1;b<arguments.length;b+=1)for(c=arguments[b],d=c.length;d<a;d+=1)e[b-1]="0"+c;return e};
KIP.Functions.AddToDate=function(a,b){b.milliseconds&&a.setMilliseconds(a.getMilliseconds()+b.milliseconds);b.seconds&&a.setSeconds(a.getSeconds()+b.seconds);b.minutes&&a.setMinutes(a.getMinutes()+b.minutes);b.hours&&a.setHours(a.getHours()+b.hours);b.days&&a.setDate(a.getDate()+b.days);return a};KIP.Functions.Piece=function(a,b,c){var d,e,f;e=-1;f=a.indexOf(b);for(d=0;d<c-1;d+=1)if(e=f,f=a.indexOf(b,f+1),-1===e)return"";return-1===f?a.substr(e+1):a.substring(e+1,f)};KIP.Functions.TitleCase=function(a,b){var c,d,e;b=b||" ";e="";c=a.split(b);for(d=0;d<c.length;d+=1)0!==d&&(e+=b),e+=KIP.Functions.CharAt(c[d],0).toUpperCase(),e+=KIP.Functions.Rest(c[d],1).toLowerCase();return e};
KIP.Functions.SentenceCase=function(a){var b;b=KIP.Functions.CharAt(a,0).toUpperCase();return b+=KIP.Functions.Rest(a,1).toLowerCase()};KIP.Functions.CharAt=function(a,b){return a.substr(b,1)};KIP.Functions.Rest=function(a,b){return a.substring(b,a.length)};KIP.Functions.Trim=function(a){a=a.replace(/^\s*/g,"");return a=a.replace(/\s*?$/g,"")};KIP.Constants.HueInterval=22;KIP.Constants.LightInterval=20;KIP.Constants.SaturationInterval=20;KIP.Constants.SaturationLimits={Max:100,Min:20};KIP.Constants.LightnessLimits={Max:80,Min:35};KIP.Constants.HSLPieceEnum={Saturation:0,Lightness:1,Hue:2};
KIP.Functions.GenerateColor=function(a,b){var c;KIP.Globals.UsedColors||(KIP.Globals.UsedColors={});KIP.Globals.ColorObj||(KIP.Globals.ColorObj=new KIP.Objects.Color,KIP.Globals.ColorObj.ParseFromHSLColor("hsl(330, 80%, 50%)"));c=KIP.Globals.ColorObj.GetNextHue(b||0);a&&(KIP.Globals.UsedColors[a]=c);return c};KIP.Functions.GetCurrentColor=function(){KIP.Globals.ColorObj||(KIP.Globals.ColorObj=new KIP.Objects.Color,KIP.Globals.ColorObj.ParseFromHSLColor("hsl(330, 80%, 50%)"));return KIP.Globals.ColorObj.GetCurrentHue()};
KIP.Functions.HexToRGB=function(a){var b;b=new KIP.Objects.Color;b.ParseFromHexColor(a);return b.RGBString()};KIP.Functions.HexToRBA=function(a,b){var c;c=new KIP.Objects.Color;c.ParseFromHexColor(a,b);return c.RGBAString()};KIP.Functions.HSLToRGB=function(a){var b;b=new KIP.Objects.Color;b.ParseFromHSLColor(a);return b.RGBString()};KIP.Functions.HSLAToRBGA=function(a,b){var c;c=new KIP.Objects.Color;c.ParseFromHSLColor(a,b);return c.RGBAString()};
KIP.Functions.FullHexString=function(a,b){var c,d;b=b||0;c=a.toString(16);if(c.length<b)for(d=0;d<c.length-b;d+=1)c="0"+c;return c};KIP.Objects.Color=function(a,b,c,d){this.red=a||0;this.green=b||0;this.blue=c||0;this.alpha=d||1};KIP.Objects.Color.prototype.RGBAString=function(){return this.RGBString(!0)};KIP.Objects.Color.prototype.RGBString=function(a){var b;b="rgba("+this.red+", "+this.green+", "+this.blue;a&&(b+=", "+this.alpha);return b+")"};
KIP.Objects.Color.prototype.HSLString=function(a){var b;this.hue||this.GenerateHSLValues();b="hsl("+this.hue+", "+this.saturation+"%, "+this.lightness+"%";a&&(b+=", "+this.alpha);return b+")"};KIP.Objects.Color.prototype.HSLAString=function(){return this.HSLString(!0)};
KIP.Objects.Color.prototype.HexString=function(a){var b;b="#"+KIP.Functions.FullHexString(this.red,2);b+=KIP.Functions.FullHexString(this.green,2);b+=KIP.Functions.FullHexString(this.blue,2);a&&(b+=KIP.Functions.FullHexString(this.alpha,2));return b};
KIP.Objects.Color.prototype.GenerateHSLValues=function(){var a,b,c,d,e,f,g;a=this.red/255;b=this.green/255;c=this.blue/255;f=Math.max(a,b,c);g=Math.min(a,b,c);e=f-g;d=(f+g)/2;f===g?(this.saturation=this.hue=0,this.lightness=Math.round(100*d)):(f===a?(a=(b-c)/e,b<c&&(a+=6)):a=f===b?(c-a)/e+2:(a-b)/e+4,this.hue=Math.round(a/6*3600)/10,this.saturation=Math.round(1E3*(.5<d?e/(2-f-g):e/(f+g)))/10,this.lightness=Math.round(1E3*d)/10,this.startHue||(this.startHue=this.hue,this.startSat=this.saturation,this.startLight=
this.lightness))};KIP.Objects.Color.prototype.GenerateRGBValues=function(){var a,b,c,d,e;a=this.hue/360;b=this.saturation/100;c=this.lightness/100;if(0===b)return this.red=this.green=this.blue=c,!0;b=.5>c?c*(1+b):c+b-c*b;c=2*c-b;for(e=-1;1>=e;e+=1)d=a+-e/3,0>d?d+=1:1<d&&--d,d<1/6?this.SetAppropriateColor(e+1,255*(c+6*(b-c)*d)):.5>d?this.SetAppropriateColor(e+1,255*b):d<2/3?this.SetAppropriateColor(e+1,255*(c+(b-c)*(2/3-d)*6)):this.SetAppropriateColor(e+1,255*c)};
KIP.Objects.Color.prototype.ParseFromHexColor=function(a,b){var c,d,e,f;if(!/^#?(?:[0-9A-Fa-f]{3,4}){1,2}$/.test(a))return!1;"#"===KIP.Functions.CharAt(a,0)&&(a=KIP.Functions.Rest(a,1));f=6>a.length?1:2;for(c=0;c<a.length;c+=f)d=a.substr(c,f),1===f&&(d+=d),d=parseInt(d,16),this.SetAppropriateColor(c/f,d),4<c&&(e=!0);e||(this.alpha=b||0);return!0};
KIP.Objects.Color.prototype.ParseFromRGBColor=function(a,b){var c,d;c=/rgb\((?:([0-9]{1-3}), ?){3}\)/;d=/rgba\((?:([0-9]{1-3}), ?){3}, ?([0-9]{0,1}(?:\.[0-9]+)?)\)/;if(c.test(a))c=c.exec(a);else if(d.test(a))c=d.exec(a);else return!1;this.red=c[1];this.green=c[2];this.blue=c[3];if(void 0!==c[4]||void 0!==b)this.alpha=c[4]||b;return!0};
KIP.Objects.Color.prototype.ParseFromHSLColor=function(a,b){var c,d;c=/hsl\(([0-9]{1,3}), ?([0-9]{1,3})%, ?([0-9]{1,3})%\)/;d=/hsla\(([0-9]{1,3}), ?([0-9]{1,3})%, ?([0-9]{1,3})%, ?([0-9]{0,1}(?:\.[0-9]+)?)\)/;if(c.test(a))c=c.exec(a);else if(d.test(a))c=d.exec(a);else return!1;this.hue=Math.round(10*parseFloat(c[1]))/10;this.saturation=Math.round(10*parseFloat(c[2]))/10;this.lightness=Math.round(10*parseFloat(c[3]))/10;if(void 0!==c[4]||void 0!==b)this.alpha=parseFloat(c[4])||b;this.GenerateRGBValues();
return!0};KIP.Objects.Color.prototype.ParseColorString=function(a,b){var c;return(c=this.ParseFromRGBColor(a,b))||(c=this.ParseFromHexColor(a,b))?!0:(c=this.ParseFromHSLColor(a,b))?!0:!1};KIP.Objects.Color.prototype.SetAppropriateColor=function(a,b){b=3>a?Math.min(255,Math.max(0,Math.round(b))):Math.min(1,Math.max(0,b));switch(a){case 0:this.red=b;break;case 1:this.green=b;break;case 2:this.blue=b;break;case 3:this.alpha=b}};
KIP.Objects.Color.prototype.GetNextHue=function(a,b){var c=[],d;this.startHue||this.GenerateHSLValues();c[0]=a;c[1]=(a+1)%3;c[2]=(a+2)%3;for(d=0;d<c.length&&this.RotateAppropriateHSLValue(c[d]);d+=1);this.GenerateRGBValues();return this.HexString(b)};KIP.Objects.Color.prototype.GetCurrentHue=function(a){return this.HexString(a)};
KIP.Objects.Color.prototype.RotateAppropriateHSLValue=function(a){var b,c;switch(a){case KIP.Constants.HSLPieceEnum.Saturation:b=this.RotateSaturation();c=this.startSat;break;case KIP.Constants.HSLPieceEnum.Lightness:b=this.RotateLightness();c=this.startLight;break;case KIP.Constants.HSLPieceEnum.Hue:b=this.RotateHue(),c=this.startHue}return b===c?!0:!1};KIP.Objects.Color.prototype.RotateHue=function(){return this.hue=this.RotateHSLValue(this.hue,KIP.Constants.HueInterval,360)};
KIP.Objects.Color.prototype.RotateSaturation=function(){return this.saturation=this.RotateHSLValue(this.saturation,KIP.Constants.SaturationInterval,100,KIP.Constants.SaturationLimits.Max,KIP.Constants.SaturationLimits.Min)};KIP.Objects.Color.prototype.RotateLightness=function(){return this.lightness=this.RotateHSLValue(this.lightness,KIP.Constants.LightInterval,100,KIP.Constants.LightnessLimits.Max,KIP.Constants.LightnessLimits.Min)};
KIP.Objects.Color.prototype.RotateHSLValue=function(a,b,c,d,e){var f;f=a+=b;f%=c;if(!d||!e&&0!==e)return KIP.Functions.RoundToPlace(f,10);for(;f<e||f>d;)f=a+=b,f%=c;return KIP.Functions.RoundToPlace(f,10)};
KIP.Objects.Color.prototype.GetApparentColor=function(a){var b;if(a.red)b=a;else if(b=new KIP.Objects.Color,!b.ParseColorString(a))return!1;a=1-this.alpha;this.red=Math.round(this.red*this.alpha+b.red*a);this.green=Math.round(this.green*this.alpha+b.green*a);this.blue=Math.round(this.blue*this.alpha+b.blue*a);this.alpha=1;return!0};KIP.Objects.Color.prototype.IsDark=function(){this.hue||this.GenerateHSLValues();return 50>=this.lightness};
KIP.Objects.Color.prototype.IsLight=function(){this.hue||this.GenerateHSLValues();return 50<this.lightness};KIP.Functions.AJAXRequest=function(a,b,c,d,e){var f=!1;try{f=new XMLHttpRequest}catch(g){try{f=new ActiveXObject("Msxml2.XMLHTTP")}catch(h){try{f=new ActiveXObject("Microsoft.XMLHTTP")}catch(m){return!1}}}if(!f)return!1;"function"!==typeof c&&(c=function(){});"function"!==typeof d&&(d=function(){});f.onreadystatechange=function(){if(4===f.readyState)return 200===f.status?c(f.responseText):d(f.responseText)};"GET"===a?(f.open("GET",b,!0),f.send(null)):"POST"===a&&(f.open("POST",b,!0),f.setRequestHeader("Content-type",
"application/x-www-form-urlencoded"),f.send(e));return f};KIP.Functions.CreateSVG=function(a,b,c,d,e,f){if(a||0===a){var g=document.createElementNS("http://www.w3.org/2000/svg","svg");g.setAttribute("id",a);g.setAttribute("width",b||0);g.setAttribute("height",c||0);g.setAttribute("viewBox",d||"0 0 0 0");e&&(g.innerHTML=e);f||g.setAttribute("preserveAspectRatio","xMinYMin meet");return g}};
KIP.Functions.CreateSVGElem=function(a,b,c,d){var e;a=document.createElementNS("http://www.w3.org/2000/svg",b);c&&a.setAttribute("class",c);for(e in d)d.hasOwnProperty(e)&&a.setAttribute(e,d[e]);return a};KIP.Objects.Drawable=function(a,b,c){this.div=KIP.Functions.CreateSimpleElement(a,b,c);this.children=[];this.style=this.div.style};KIP.Objects.Drawable.prototype.AppendChild=function(a,b,c){this.children||(this.children=[]);c||0===c||(c=this.children.length);a.Draw&&(this.children.splice(c,0,a),this.children[c].parent=b||this.div)};
KIP.Objects.Drawable.prototype.RemoveChild=function(a){var b;if(!this.children)return!1;for(b=0;b<this.children.length;b+=1)this.children[b]===a&&this.children.splice(b,1);a.parentNode&&a.parentNode.removeChild(a);return!0};
KIP.Objects.Drawable.prototype.Draw=function(a,b){this.div&&(this.parent=a||this.parent,this.Refresh(),this.div.parentNode&&!b&&this.div.parentNode.removeChild(this.div),this.parent.appendChild(this.div),this.BeforeDrawChildren(),this.children&&(this.children.map(function(a,b,e){a&&a.Draw()}),this.AfterDrawChildren()))};KIP.Objects.Drawable.prototype.Erase=function(){this.div.parentNode&&this.div.parentNode.removeChild(this.div)};KIP.Objects.Drawable.prototype.Refresh=function(){};
KIP.Objects.Drawable.prototype.BeforeDrawChildren=function(){};KIP.Objects.Drawable.prototype.AfterDrawChildren=function(){};KIP.Functions.DrawLine=function(a,b,c){var d,e;d=KIP.Functions.GetDistance(a,b);b=KIP.Functions.GetAngle(a,b);e=KIP.Functions.CreateSimpleElement("","angledLine");e.style.position="absolute";e.style.left=a.x+"px";e.style.top=a.y+"px";e.style.width=d+"px";e.style.height="1px";e.style.transformOrigin="0px 0px";e.style.transform="rotate("+b+"deg)";c.appendChild(e);return e};
KIP.Functions.ConnectElements=function(a,b){var c,d,e,f,g;g=KIP.Functions.FindCommonParent(a,b);c=KIP.Functions.GlobalOffsetLeft(a,g)+a.offsetWidth/2;d=KIP.Functions.GlobalOffsetLeft(b,g)+b.offsetWidth/2;e=KIP.Functions.GlobalOffsetTop(a,g)+a.offsetHeight/2;f=KIP.Functions.GlobalOffsetTop(b,g)+b.offsetHeight/2;return KIP.Functions.DrawLine({x:c,y:e},{x:d,y:f},g)};KIP.Functions.GetDistance=function(a,b){var c,d;c=a.x-b.x;d=a.y-b.y;return Math.sqrt(c*c+d*d)};
KIP.Functions.GetAngle=function(a,b){var c,d,e,f;c=b.x-a.x;d=b.y-a.y;if(0===c)return 0>d?270:90;if(0===d)return 0>c?180:0;e=0>c?Math.PI:0;f=Math.atan(Math.abs(d)/Math.abs(c));f=f*(0<c*d?1:-1)+e;return 180/Math.PI*f};KIP.Functions.DegreesToRadians=function(a){return Math.PI*a/180};KIP.Objects.Editable=function(a,b,c,d,e){this.id=a;this.type=b||"text";this.content=c;this.validate=d;this.update=e;this.is_modifying=!1;KIP.Objects.Drawable.call(this,this.id,"editable",this.content);this.CreateElements();this.AddListeners()};KIP.Objects.Editable.prototype=Object.create(KIP.Objects.Drawable.prototype);
KIP.Objects.Editable.prototype.AddListeners=function(){var a=this;this.div.onclick=function(b){a.is_modifying||a.Modify();b.stopPropagation&&b.stopPropagation();null!==b.cancelBubble&&(b.cancelBubble=!0)};window.addEventListener("click",function(b){b.target!==a.div&&a.is_modifying&&a.Save()});this.inputDiv.onkeydown=function(b){13===b.keyCode&&a.is_modifying&&a.Save()}};
KIP.Objects.Editable.prototype.CreateElements=function(){this.inputDiv=KIP.Functions.CreateElement({type:"input",id:this.id+"|input",attr:[{key:"type",val:this.type}]})};KIP.Objects.Editable.prototype.Modify=function(){this.is_modifying=!0;this.inputDiv.value=this.content;this.div.innerHTML="";this.div.appendChild(this.inputDiv);this.inputDiv.select();this.inputDiv.focus()};
KIP.Objects.Editable.prototype.Save=function(){var a;a=this.inputDiv.value;this.div.removeChild(this.inputDiv);this.is_modifying=!1;this.validate&&!this.validate(a)?(this.inputDiv.value=this.content,this.div.innerHTML=this.content):(this.content=a,this.div.innerHTML=a,this.update&&this.update(this.content,this))};KIP.Globals.HoverOffsetEnum={Top:1,TopRightAlign:17,Bottom:2,BottomRightAlign:18,Left:4,LeftBottomAlign:36,Right:8,RightAlign:16,BottomAlign:32,RightBottomAlign:40,"Top-Left":5,"Top-Right":9,"Bottom-Left":6,"Bottom-Right":10,Custom:0};
KIP.Objects.Hoverable=function(a,b,c,d,e,f,g){this.id=a;this.cls="hoverable "+b;this.content=c;this.reference=d;this.offset=e||KIP.Globals.HoverOffsetEnum.Top;this.isSVG=f;this.adjust=g||{x:0,y:0};this.enabled=!1;KIP.Objects.Drawable.call(this,this.id,this.cls,this.content);this.div.style.position="absolute"};KIP.Objects.Hoverable.prototype=Object.create(KIP.Objects.Drawable.prototype);KIP.Objects.Hoverable.prototype.SetEnabled=function(a){this.enabled=a};
KIP.Objects.Hoverable.prototype.Draw=function(a){var b=this;(this.parent=a||this.parent)&&this.enabled&&(this.SetupParent(),this.MoveChild(),KIP.Objects.Drawable.prototype.Draw.call(this,this.parent),this.AdjustChild(),this.nudged=!0,window.setTimeout(function(){b.nudged||(b.NudgeOnscreen(),b.nudged=!0)},0))};
KIP.Objects.Hoverable.prototype.SetupParent=function(){this.parent&&(this.parent.style.position=KIP.Functions.GetComputedStyle(this.parent,"position"),"static"===this.parent.style.position&&(this.parent.style.position="relative"))};
KIP.Objects.Hoverable.prototype.MoveChild=function(){var a,b,c,d;d=c=0;this.offset!==KIP.Globals.HoverOffsetEnum.Custom&&(this.reference||(this.reference=this.parent),this.isSVG?(b=this.reference.getBoundingClientRect(),c=b.left,a=b.right-b.left,b=b.bottom-b.top):(a=this.reference.offsetWidth,b=this.reference.offsetHeight),d=this.offset&KIP.Globals.HoverOffsetEnum.Top?d+-1*b:this.offset&KIP.Globals.HoverOffsetEnum.Bottom?d+b:d+0,c=this.offset&KIP.Globals.HoverOffsetEnum.Left?c+-1*a:this.offset&KIP.Globals.HoverOffsetEnum.Right?
c+a:c+0,this.div.style.left=c+"px",this.div.style.top=d+"px")};
KIP.Objects.Hoverable.prototype.AdjustChild=function(){var a,b,c,d,e,f,g,h;if(this.offset!==KIP.Globals.HoverOffsetEnum.Custom){a=this.div.offsetWidth;b=this.div.offsetHeight;c=this.div.offsetLeft;d=this.div.offsetTop;e=KIP.Functions.GlobalOffsetLeft(this.div);f=KIP.Functions.GlobalOffsetTop(this.div);g=this.parent.offsetWidth;h=this.parent.offsetHeight;this.offset&KIP.Globals.HoverOffsetEnum.Top&&(d=-1*b);this.offset&KIP.Globals.HoverOffsetEnum.RightAlign&&(c=g-a);this.offset&KIP.Globals.HoverOffsetEnum.Left&&
(c=-1*a);this.offset&KIP.Globals.HoverOffsetEnum.BottomAlign&&(d=h-b);0>e+a&&(c=this.reference.offsetWidth);e>window.innerWidth&&(c=-1*a);if(f>window.innerHeight||0>e)d=-1*b,c=0;0>f+b&&(d=this.reference.offsetHeight);KIP.Functions.MoveRelToElem(this.div,this.reference,c+(this.adjust.x||0),d+(this.adjust.y||0))}};
KIP.Objects.Hoverable.prototype.NudgeOnscreen=function(){var a,b,c,d,e,f;this.offset!==KIP.Globals.HoverOffsetEnum.Custom&&(a=this.div.offsetWidth,b=this.div.offsetHeight,c=this.div.offsetLeft,d=this.div.offsetTop,e=KIP.Functions.GlobalOffsetLeft(this.div),f=KIP.Functions.GlobalOffsetTop(this.div),this.offset&KIP.Globals.HoverOffsetEnum.Left||this.offset&KIP.Globals.HoverOffsetEnum.Right||(0>e&&(c+=-1*e),e+a>window.innerWidth&&(c-=e+a-window.innerWidth)),this.offset&KIP.Globals.HoverOffsetEnum.Top||
this.offset&KIP.Globals.HoverOffsetEnum.Bottom||(f+b>window.innerHeight&&(d-=f+b-window.innerHeight),0>f&&(d+=-1*f)),KIP.Functions.MoveRelToElem(this.div,this.reference,c,d))};KIP.Objects.ContextMenu=function(a){KIP.Objects.Drawable.call(this,"ctxMenu","ctxMenu");this.options=[];this.xOptions=[];this.target=a||window;this.div.style.position="absolute";this.AddEventListeners()};KIP.Objects.ContextMenu.prototype=Object.create(KIP.Objects.Drawable.prototype);KIP.Objects.ContextMenu.prototype.AddOption=function(a,b){var c;c=this.options.length;this.xOptions[a]=c;c=KIP.Functions.CreateSimpleElement("opt|"+c,"ctxOption",a);c.onclick=b;this.div.appendChild(c)};
KIP.Objects.ContextMenu.prototype.RemoveOption=function(a){a=this.xOptions[a];this.div.removeChild(this.options[a].div);this.options.splice(a,1)};KIP.Objects.ContextMenu.prototype.ClearOptions=function(){this.options.map(function(a){this.div.removeChild(a.div)});this.options.length=0;this.xOptions.length=0};
KIP.Objects.ContextMenu.prototype.AddEventListeners=function(){var a=this;window.addEventListener("contextmenu",function(){console.log("erasing");a.Erase()},!0);window.addEventListener("click",function(b){a.Erase()});this.target.addEventListener("contextmenu",function(b){var c;a.Erase();if(b.ctrlKey)return!0;b.stopPropagation();b.preventDefault();c=b.clientX;b=b.clientY;a.div.style.left=c+"px";a.div.style.top=b+"px";a.Draw(document.body);c+a.div.offsetWidth>window.innerWidth&&(c=window.innerWidth-
a.div.offsetWidth);b+a.div.offsetHeight>window.innerHeight&&(b=window.innerHeight-a.div.offsetHeight);a.div.style.left=c+"px";a.div.style.top=b+"px";return!1},!1)};KIP.Objects.SVGDrawable=function(a){this.div=KIP.Functions.CreateSVG(a);this.elements=[];this.elementsByID=[];this.min_y=this.min_x=1E6;this.max_y=this.max_x=0;this.gutter=1;this.cur_ID=0};KIP.Objects.SVGDrawable.prototype=Object.create(KIP.Objects.Drawable.prototype);KIP.Objects.SVGDrawable.prototype.CalculateView=function(){return this.min_x+" "+this.min_y+" "+(this.max_x-this.min_x)+" "+(this.max_y-this.min_y)};
KIP.Objects.SVGDrawable.prototype.AddRectangle=function(a,b,c,d,e,f,g,h){this.UpdateView(a,b,c,d);return this.AddChild("rect",{height:d,width:c,x:a,y:b},e,f,g,h)};KIP.Objects.SVGDrawable.prototype.UpdateView=function(a,b,c,d){a<this.min_x&&(this.min_x=a-this.gutter);a+c>this.max_x&&(this.max_x=a+c+this.gutter);b<this.min_y&&(this.min_y=b-this.gutter);b+d>this.max_y&&(this.max_y=b+d+this.gutter);this.view=this.CalculateView();this.div.setAttribute("viewBox",this.view)};
KIP.Objects.SVGDrawable.prototype.AddPath=function(a,b,c){};KIP.Objects.SVGDrawable.prototype.MoveTo=function(a,b,c){var d;d=c.getAttribute("d");c.setAttribute("d",d+("M"+a+" "+b+"\n"));return c};KIP.Objects.SVGDrawable.prototype.LineTo=function(a,b,c){var d;d=c.getAttribute("d");c.setAttribute("d",d+("L "+a+" "+b+"\n"));return c};
KIP.Objects.SVGDrawable.prototype.CurveTo=function(a,b,c,d){var e;e=d.getAttribute("d");e+="C "+a.x+" "+a.y+", ";e+=b.x+" "+b.y+", ";e+=c.x+" "+c.y+"\n";d.setAttribute("d",e);return d};KIP.Objects.SVGDrawable.prototype.ArcTo=function(a,b,c,d,e,f){var g;g=f.getAttribute("d");g+="A "+a.x+" "+a.y;g=g+(" "+b+" "+c+" "+d)+(" "+KIP.Functions.RoundToPlace(e.x,1E3)+" "+KIP.Functions.RoundToPlace(e.y,1E3)+"\n");f.setAttribute("d",g);return f};
KIP.Objects.SVGDrawable.prototype.FinishPath=function(a){var b;b=a.getAttribute("d");a.setAttribute("d",b+" Z");return a};
KIP.Objects.SVGDrawable.prototype.AddRegularPolygon=function(a,b,c,d,e,f,g,h){var m,l,k;this.UpdateView(a-d,b-d,2*d,2*d);m=KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360/c),1E3);e=this.AddChild("polygon",{points:""},e,f,g,h);f="";for(g=k=0;g<c;g+=1)h=a+KIP.Functions.RoundToPlace(Math.sin(k)*d,10),l=b+KIP.Functions.RoundToPlace(-1*Math.cos(k)*d,10),k+=m,f+=h+","+l+" ";e.setAttribute("points",f)};KIP.Objects.SVGDrawable.prototype.AddRegularStar=function(a,b,c,d,e,f,g){};
KIP.Objects.SVGDrawable.prototype.AddCircle=function(a,b,c,d,e,f,g){this.UpdateView(a-c,b-c,2*c,2*c);return this.AddChild("circle",{cx:a,cy:b,r:c},d,e,f,g)};KIP.Objects.SVGDrawable.prototype.AddPath=function(){};
KIP.Objects.SVGDrawable.prototype.AddPerfectArc=function(a,b,c,d,e,f,g,h,m,l){var k,n,p,r,q;k=parseInt(g.stroke.width,10)||1;this.UpdateView(a.x-b-k,a.y-b-k,2*(b+k),2*(b+k));r=d-c;k=Math.sin(KIP.Functions.DegreesToRadians(c))*b+a.x;n=-1*Math.cos(KIP.Functions.DegreesToRadians(c))*b+a.y;p=Math.sin(KIP.Functions.DegreesToRadians(d))*b+a.x;d=-1*Math.cos(KIP.Functions.DegreesToRadians(d))*b+a.y;q=parseInt(g.stroke.width,10)*Math.sqrt(2)||0;c=KIP.Functions.DegreesToRadians(r+c);g=this.AddChild("path",
{d:""},g,h,m,l);n+=-1*Math.cos(c)*q;k+=Math.sin(c)*q;d+=-1*Math.cos(c)*q;p+=Math.sin(c)*q;a.y+=-1*Math.cos(c)*q;a.x+=Math.sin(c)*q;this.MoveTo(k,n,g);this.ArcTo({x:b,y:b},0,180<r?1:0,e,{x:p,y:d},g);if(f)return g;this.LineTo(a.x,a.y,g);this.FinishPath(g);return g};
KIP.Objects.SVGDrawable.prototype.AddChild=function(a,b,c,d,e,f){if(a)return d||(d=this.cur_ID,this.cur_ID+=1),a=KIP.Functions.CreateSVGElem(d,a,e,b),this.AssignStyle(c,a),this.elements[this.elements.length]=a,this.elementsByID[d]=a,f?f.appendChild(a):this.div.appendChild(a),a};
KIP.Objects.SVGDrawable.prototype.AddText=function(a,b,c,d,e,f,g,h,m){var l,k,n;if(a){l=parseInt(a.getAttribute("cx"));k=parseInt(a.getAttribute("cy"));n=parseInt(a.getAttribute("x"));a=parseInt(a.getAttribute("y"));if(n||0===n)c+=n;else if(l||0===l)c=l-c;if(a||0===a)d+=a;else if(k||0===k)d=k+d}f=KIP.Functions.CreateSVGElem(f,"text",g,{x:c,y:d});f.innerHTML=b;this.AssignStyle(e,f);b=this.MeasureElem(f);h&&(e=h.x*b.width,h=h.y*b.height,c-=e-0,d-=h-b.height,f.setAttribute("x",c),f.setAttribute("y",
d));this.UpdateView(c,d-b.height,b.width,b.height);m?m.appendChild(f):this.div.appendChild(f);return f};KIP.Objects.SVGDrawable.prototype.MeasureElem=function(a){var b,c,d;b=this.parent;d=a.parentNode;document.body.appendChild(this.div);this.div.appendChild(a);c=a.getBBox();this.div.removeChild(a);document.body.removeChild(this.div);this.parent=b;d&&d.appendChild(a);return c};
KIP.Objects.SVGDrawable.prototype.Draw=function(a,b,c,d){b===this.w&&c===this.h&&d===this.view||this.AdjustSize(b,c,d);KIP.Objects.Drawable.prototype.Draw.call(this,a)};KIP.Objects.SVGDrawable.prototype.AssignStyle=function(a,b){a&&(a.fill&&this.AssignFillValues(a.fill,b),a.stroke&&this.AssignStrokeValues(a.stroke,b),a.font&&this.AssignFontValues(a.font,b))};
KIP.Objects.SVGDrawable.prototype.AssignFontValues=function(a,b){if(!a)return b;a.size&&(b.style.fontSize=a.size);a.family&&(b.style.fontFamily=a.family);a.weight&&(b.style.fontWeight=a.weight);a.style&&(b.style.fontStyle=a.style);a.color&&(b.style.fill=a.color);return b};
KIP.Objects.SVGDrawable.prototype.AssignStrokeValues=function(a,b){if(!a||!a.type||"None"===a.type)return b.style.stroke="None",b;a.color&&(b.style.stroke=a.color);a.opacity&&(b.style.strokeOpacity=a.opacity);a.width&&(b.style.strokeWidth=a.width);a.lineCap&&(b.style.strokeLinecap=a.lineCap);a.lineJoin&&(b.style.strokeLinejoin=a.lineJoin);return b};
KIP.Objects.SVGDrawable.prototype.AssignFillValues=function(a,b){if(!a||!a.type||"None"===a.type)return b.style.fill="None",b;a.color&&(b.style.fill=a.color);a.opacity&&(b.style.fillOpacity=a.opacity);return b};KIP.Objects.SVGDrawable.prototype.AssignPoints=function(a,b){};KIP.Objects.SVGDrawable.prototype.AdjustStyle=function(a,b,c){b||(b=this.elementsByID[a]);b&&this.AssignStyle(c,b)};
KIP.Objects.SVGDrawable.prototype.AdjustSize=function(a,b,c){a&&this.w!==a&&(this.w=a||this.w,this.div.setAttribute("width",this.w));b&&this.h!==b&&(this.h=b||this.h,this.div.setAttribute("height",this.h));if(c&&this.view!==c||!this.view)this.view=c||this.CalculateView(),this.div.setAttribute("viewBox",this.view)};KIP.Objects.SVGDrawable.prototype.GetElement=function(a){return this.elementsByID[a]};KIP.Objects.SVGDrawable.prototype.CreateGradient=function(a,b){};
KIP.Objects.SVGDrawable.prototype.CreateGroup=function(a){return this.AddChild("g",[],{},a)};KIP.Objects.SVGDrawable.prototype.SetAttribute=function(a,b){this.div.setAttribute(a,b)};KIP.Objects.SVGDrawable.prototype.Clear=function(){var a,b;for(b=this.div.children.length-1;1<=b;--b)a=this.div.children[b],this.div.removeChild(a)};KIP.Objects.Select=function(a){KIP.Objects.Drawable.call(this,a,"select");this.id=a;this.input=KIP.Functions.CreateElement({type:"input",cls:"select",id:"input"+a});this.data=[];this.dataDiv=KIP.Functions.CreateSimpleElement("data"+a,"dropdown");this.selectedData=-1;this.options=[];this.visible=[];this.visibleCnt=0;this.div.appendChild(this.input);this.div.appendChild(this.dataDiv);this.AddListeners()};KIP.Objects.Select.prototype=Object.create(KIP.Objects.Drawable.prototype);
KIP.Objects.Select.prototype.AddListeners=function(){var a;a=this;this.input.addEventListener("focus",function(){a.Dropdown()});this.input.addEventListener("blur",function(){a.Dropdown(!0)});this.input.addEventListener("keydown",function(b){a.expanded&&(40===b.keyCode?a.HiliteNext():38===b.keyCode?a.HilitePrevious():13===b.keyCode&&a.Validate())});this.input.addEventListener("input",function(b){a.Filter();b.stopPropagation();return!1})};
KIP.Objects.Select.prototype.Dropdown=function(a){a?(KIP.Functions.RemoveCSSClass(this.dataDiv,"expanded"),this.expanded=!1):(KIP.Functions.AddCSSClass(this.dataDiv,"expanded"),this.expanded=!0,this.hiliteNext=this.selectedData=0)};
KIP.Objects.Select.prototype.AddData=function(a){var b,c,d,e,f;e=this;d=function(a,b){a.addEventListener("mousedown",function(a){e.Select(e.data[b])})};for(b in a)a.hasOwnProperty(b)&&(f=this.data.push({key:b,val:a[b]}),c=KIP.Functions.CreateSimpleElement("opt"+this.id+"|"+f,"opt",a[b]),this.options.push(c),this.visible.push(!0),this.visibleCnt+=1,d(c,f-1),this.dataDiv.appendChild(c))};
KIP.Objects.Select.prototype.Filter=function(){var a,b,c;b=this.input.value;for(a=0;a<this.data.length;a+=1)c=this.data[a].key.indexOf(b),-1===c&&(c=this.data[a].val.indexOf(b)),-1===c&&this.visible[a]&&(KIP.Functions.AddCSSClass(this.options[a],"filtered"),a===this.selectedData&&(this.selectedData=-1),this.visible[a]=!1,--this.visibleCnt),-1===c||this.visible[a]||(KIP.Functions.RemoveCSSClass(this.options[a],"filtered"),this.visible[a]=!0,this.visibleCnt+=1)};
KIP.Objects.Select.prototype._Hilite=function(a){var b,c,d;if(0!==this.dataDiv.children.length){0<=this.selectedData&&KIP.Functions.RemoveCSSClass(this.options[this.selectedData],"selected");for(c=0;!d;)if(b=this.selectedData+a,0>b&&(b=this.data.length-1),b>=this.data.length&&(b=0),this.visible[b]&&(d=!0),c+=1,c>this.data.length)return;KIP.Functions.AddCSSClass(this.options[b],"selected");this.selectedData=b}};KIP.Objects.Select.prototype.HiliteNext=function(){return this._Hilite(1)};
KIP.Objects.Select.prototype.HilitePrevious=function(){return this._Hilite(-1)};KIP.Objects.Select.prototype.Select=function(a){this.value=a.key;this.input.value=a.val};KIP.Objects.Select.prototype.Validate=function(){var a;a=this.input.value;-1!==this.selectedData&&(0<=this.data[this.selectedData].key.indexOf(a)||0<=this.data[this.selectedData].val.indexOf(a))&&this.select(this.selectedData)};KIP.Objects.Collection=function(){this.data=[];this.backData={}};KIP.Objects.Collection.prototype.Length=function(){return this.data.length};KIP.Objects.Collection.prototype.AddElement=function(a,b,c,d){var e,f;if(this.DoesElementExist(a)){if(!d)return null;this.RemoveElement(a)}b={key:a,value:b};c||0===c?(this.data.splice(c,0,b),e=!0):c=this.data.push(b);this.backData[a]=c;if(e)for(f in this.backData)this.backData.hasOwnProperty(f)&&(e=this.backData[f],e>=c&&f!==a&&(this.backData[f]+=1));return c};
KIP.Objects.Collection.prototype.RemoveElement=function(a,b){var c,d,e;b||0===b||(b=this.GetElementIdx(a));e=this.data.splice(b,1);delete this.backData[a];for(c in this.backData)this.backData.hasOwnProperty(c)&&(d=this.backData[c],d>b&&--this.backData[c]);return{key:a,idx:b,value:e}};KIP.Objects.Collection.prototype.RemoveElementAtIndex=function(a){var b;b=this.GetElementKey(a);return this.RemoveElement(b,a)};
KIP.Objects.Collection.prototype.GetElement=function(a,b){b||0===b||(b=this.GetElementIdx(a));return!b&&0!==b||!this.data[b]&&0!==this.data[b]?null:this.data[b].value};KIP.Objects.Collection.prototype.GetElementByIdx=function(a){var b=this.GetElementKey(a);return this.GetElement(b,a)};KIP.Objects.Collection.prototype.GetElementIdx=function(a){return this.backData[a]};KIP.Objects.Collection.prototype.GetElementKey=function(a){var b=this.data[a];return b||0===b?this.data[a].key:null};
KIP.Objects.Collection.prototype.Sort=function(a){return this.data.sort(a)};KIP.Objects.Collection.prototype.MergeCollection=function(a,b){var c,d,e;for(d=0;d<a.data.length;d+=1)c=a.data[d],this.backData.hasOwnProperty(c)?b||(this.data[this.backData[c]]=a.data[d]):(e=this.data.push(a.data[d]),this.backData[c]=e)};KIP.Objects.Collection.prototype.Clear=function(){this.data=[];this.backData={}};KIP.Objects.Collection.prototype.GetNextIndex=function(){return this.data.length};
KIP.Objects.Collection.prototype.DoesElementExist=function(a){return(a=this.backData[a])||0===a?!!this.data[a]:!1};KIP.Constants.GraphTypeEnum={Pie:0,Bar:1,Circle:2,Tier:3,Line:4,Trend:5};KIP.Objects.Graph=function(a,b){this.id=a;this.data=[];this.dataListeners=[];this.type=b;this.sortedData=[];this.elems=[];KIP.Objects.SVGDrawable.call(this,a)};KIP.Objects.Graph.prototype=Object.create(KIP.Objects.SVGDrawable.prototype);KIP.Objects.Graph.prototype.AddData=function(a,b,c,d,e){var f;f=this.data.length;this.data[f]={lbl:a,x:b,y:c,z:d,extra:e};this.AddDataAppropriateForGraph(f);return f};
KIP.Objects.Graph.prototype.AddDataAppropriateForGraph=function(a){};KIP.Objects.Graph.prototype.AddListenerToData=function(a,b,c){this.dataListeners[a]||(this.dataListeners[a]=[]);this.dataListeners[a][this.dataListeners[a].length]={type:b,listener:c}};KIP.Objects.Graph.prototype.AttachDataListeners=function(a,b){var c,d,e,f;if(d=this.dataListeners[a])for(f=0;f<d.length;f+=1)d[f]&&(c=d[f].type,e=d[f].listener,c&&e&&b.addEventListener(c,e))};
KIP.Objects.CircularGraph=function(a,b){KIP.Objects.Graph.call(this,a,b)};KIP.Objects.CircularGraph.prototype=Object.create(KIP.Objects.Graph.prototype);
KIP.Objects.CircularGraph.prototype.AddTextAroundRing=function(a,b,c,d,e,f,g,h,m){var l,k,n;if(this.radius)return e=e||this.radius,l=KIP.Functions.DegreesToRadians(b+(c-b)/2),k=KIP.Functions.RoundToPlace(-1*Math.cos(l),1E3),l=KIP.Functions.RoundToPlace(Math.sin(l),1E3),n={},n.y=k/-4+.75,n.x=l/-2+.5,a=this.AddText(d,a,this.center.x+l*(e+1),this.center.y+(e+1)*k,this.fontStyle,f,g,n,h),m&&(m=this.MeasureElem(a),a.setAttribute("transform","rotate("+(((c-b)/2+b)%45+315)+" "+(m.x+m.width/2)+" "+(m.y+m.height/
2)+")")),a};KIP.Objects.CircularGraph.prototype.AddPieceListeners=function(a,b,c){a&&b&&(a.addEventListener("mouseover",function(){b.style.opacity=1;c&&(c.style.opacity=.8)}),a.addEventListener("mouseout",function(){b.style.opacity=0;c&&(c.style.opacity=0)}),b.style.transition="opacity ease-in-out .2s",b.style.opacity=0,c&&(c.style.opacity=0,c.style.transition="opacity ease-in-out .2s"))};
KIP.Objects.PieGraph=function(a,b,c,d,e){this.center=b||{x:80,y:80};this.radius=c||30;this.total=0;this.style=d||{stroke:{type:"solid",color:"#000",width:"0px"},fill:{type:"solid"}};this.fontStyle={font:{family:"Segoe UI",size:"10px"},fill:{type:"solid"}};this.hslRotate=KIP.Constants.HSLPieceEnum.Saturation;this.labelAtTop=e||!1;this.sort=!0;this.days=this.keyY=this.keyX=0;this.addKey=this.addLabels=!0;KIP.Objects.CircularGraph.call(this,a,KIP.Constants.GraphTypeEnum.Pie)};
KIP.Objects.PieGraph.prototype=Object.create(KIP.Objects.CircularGraph.prototype);KIP.Objects.PieGraph.prototype.ChooseColorRotate=function(a){this.hslRotate=a};
KIP.Objects.PieGraph.prototype.Refresh=function(){var a,b,c,d,e,f,g,h,m,l,k,n,p,r;g=this.style;e=0;this.Clear();m=this.CreateGroup("wedges");k=this.CreateGroup("boxes");l=this.CreateGroup("text");this.keyOnRadius?(this.keyX=this.center.x+this.radius+5,this.keyY=this.center.y-this.radius+this.gutter):(this.keyX=this.max_x||0,this.keyY=this.min_y);this.sortedArray=this.data.slice();this.sort&&(this.sortedArray=this.sortedArray.sort(function(a,b){return a.x>b.x?-1:a.x<b.x?1:0}));for(p=0;p<this.sortedArray.length;p+=
1)a=this.sortedArray[p],b=a.id,d=a.x/this.total,h=a.y||this.radius,this.fontStyle.fill.color=g.fill.color=KIP.Functions.GenerateColor("",this.hslRotate),c=1===this.data.length?this.AddCircle(this.center.x,this.center.y,h,this.style,"","",m):this.AddPerfectArc(this.center,h,e,e+360*d,1,!1,g,"","",m),this.addLabels&&(this.labelAtTop?(f=this.AddText(c,a.lbl,this.center.x-this.radius,this.center.y-this.radius-16,this.fontStyle,"","","",l),h=this.MeasureElem(f),n=this.AddRectangle(h.x,h.y,h.width,h.height,
{fill:{type:"solid",color:"#FFF"}},"","",k)):f=this.AddTextAroundRing(a.lbl,e,e+360*d,c,h,"","",l,this.rotate)),this.addKey&&(r=this.AddDataToKey(a,l)),this.AddPieceListeners(c,f,n),this.AttachDataListeners(b,c),e+=360*d,this.elems[b]={piece:c,label:f,labelBox:n,color:g.fill.color,keyText:r};this.addKey&&(this.fontStyle.fill.color="#000",this.keyY+=5,this.AddDataToKey({x:this.total,lbl:"TOTAL"},l),this.days&&this.AddDataToKey({x:KIP.Functions.RoundToPlace(this.total/this.days,10),lbl:"Avg Day"},l))};
KIP.Objects.PieGraph.prototype.AddDataToKey=function(a,b){var c,d;c=JSON.parse(JSON.stringify(this.fontStyle));c.font.size="6";c=this.AddText(void 0,a.lbl+" : "+a.x,this.keyX,this.keyY,c,"","","",b);d=this.MeasureElem(c);this.keyY+=d.height;return c};KIP.Objects.PieGraph.prototype.AddDataAppropriateForGraph=function(a){var b;b=this.data[a];this.total+=b.x;b.id=a;this.parent&&this.Draw()};
KIP.Objects.CircleGraph=function(a,b,c,d){this.center=b||{x:80,y:80};this.radius=c||30;this.ringTotals=[];this.style=d||{stroke:{type:"solid",color:"#000",width:"5px"},fill:{}};this.fontStyle={font:{family:"Segoe UI",size:"10px"},fill:{type:"solid"}};this.strokeWidth=5;KIP.Objects.CircularGraph.call(this,a,KIP.Constants.GraphTypeEnum.Circle)};KIP.Objects.CircleGraph.prototype=Object.create(KIP.Objects.CircularGraph.prototype);
KIP.Objects.CircleGraph.prototype.Refresh=function(){var a,b,c,d,e,f,g,h,m,l,k,n,p;n=this.CreateGroup("rings");p=this.CreateGroup("text");d=Math.max.apply(this,this.ringTotals);a={};m=[];for(c=0;c<this.data.length;c+=1)b=this.data[c],a[b.lbl]||(a[b.lbl]=KIP.Functions.GenerateColor(b.lbl,KIP.Constants.HSLPieceEnum.Hue)),e=a[b.lbl],f=b.y,g=b.z*this.strokeWidth,m[f]||(m[f]=0),l=360*b.x/d+m[f],0>f?(f*=-1,k=.4):k=1,h=this.radius+this.radius/2*f,this.style.stroke.width=g+"px",this.style.stroke.color=e,
e=this.AddPerfectArc(this.center,h,m[f],l,1,!0,this.style,"","",n),e.style.opacity=k,b=this.AddTextAroundRing(b.lbl,m[f],l,e,h+(g-this.strokeWidth),"","",p),this.div.appendChild(e),this.AddPieceListeners(e,b),this.AttachDataListeners(c,e),m[f]=l};KIP.Objects.CircleGraph.prototype.AddDataAppropriateForGraph=function(a){var b;b=this.data[a];a=b.y;0>a&&(a*=-1);this.ringTotals[a]||(this.ringTotals[a]=0);this.ringTotals[a]+=b.x;this.parent&&this.Draw()};
KIP.Objects.TrendingGraph=function(a,b,c){this.min_x=b||1E7;this.min_y=c||1E7;this.hslRotate=KIP.Constants.HSLPieceEnum.Hue;this.style={fill:{},stroke:{type:"solid",width:"0.2"},font:{family:"Calibri"}};this.fontStyle={fill:{type:"solid"},font:{family:"Calibri"}};KIP.Objects.Graph.call(this,a,KIP.Constants.GraphTypeEnum.Trend)};KIP.Objects.TrendingGraph.prototype=Object.create(KIP.Objects.Graph.prototype);
KIP.Objects.TrendingGraph.prototype.AddDataAppropriateForGraph=function(a){a=this.data[a];this.UpdateView(a.x,a.y,1,1)};KIP.Objects.TrendingGraph.prototype.AddLineListeners=function(a,b,c){var d=this;a&&b&&(a.addEventListener("mouseover",function(){b.style.opacity=1;a.style.strokeWidth=3*d.style.stroke.width+"px";c&&(c.style.opacity=.8)}),a.addEventListener("mouseout",function(){b.style.opacity=0;a.style.strokeWidth=d.style.stroke.width+"px";c&&(c.style.opacity=0)}),b.style.opacity=0)};
KIP.Objects.TrendingGraph.prototype.Refresh=function(){var a,b,c,d,e,f,g,h;b=this.data.slice();b=b.sort(function(a,b){return a&&b&&void 0!==a.z&&void 0!==b.z?a.z>b.z?1:a.z<b.z?-1:a.x>b.x?1:a.x<b.x?-1:0:0});this.style.stroke.width=Math.min(this.max_x-this.min_x,this.max_y-this.min_y)/70;this.fontStyle.font.size=8*this.style.stroke.width;e=this.CreateGroup("pts");f=this.CreateGroup("txt");for(d=0;d<b.length;d+=1)a=b[d],void 0===a.z&&!g||c!==a.z?(this.fontStyle.fill.color=this.style.stroke.color=KIP.Functions.GenerateColor("",
this.hslRotate),void 0!==a.z&&(c=a.z),g=this.AddChild("path",{d:""},this.style,"","",e),h=this.AddText(g,a.lbl,a.x,a.y,this.fontStyle,"","","",f),this.AddLineListeners(g,h),this.MoveTo(a.x,a.y,g)):this.LineTo(a.x,a.y,g)};/*globals KIP,window,console*/

/**
 * Creates a view of a project in a Gantt Chart
 * @class ProjectWindow
 * @param {string} name - The name & ID of the project
 * @param {Date} start - The date at which the default viewing window should start. Can be a date string or a Date object
 * @param {Date} end   - OBSOLETE. The date at which the default viewing window should end. Can be a date string or a Date object
 * @param {Object} [dim]   - What the dimensions of SVG Element should be
 */
KIP.Objects.ProjectWindow = function (name, start, end, dim) {
	"use strict";
	var view;
	this.name = name;
	this.id = name;
	this.rowHeight = 5;
	this.rowSpace = 2.5;

	this.unitWidth = 5;

	// Create collections for items & events
	this.items = [];
	this.events = [];
	this.rows = [];
	this.lines = [];
	this.headers = [];
	this.itemHeaders = [];

	this.importantDates = {};
	this.impDateCategories = [];

	this.showWeekends = true;
	this.showOverallLbl = true;
	this.disableFill = false;
	this.showTitles = true;
	this.alwaysShowEvents = false;

	this.monthColors = [
		"37c8ab",
		"#00aad4",
		"#0066ff",
		"#3737c8",
		"#7137c8",
		"#ab37c8",
		"#ff0066",
		"#ff2a2a",
		"#ff6600",
		"#ffcc00",
		"#abc837",
		"#37c837"
	];

	// Covert the start/end to dates if needed
	if (!start.getYear) {
		start = new Date(start);
	}
	if (!end.getYear) {
		end = new Date(end);
	}

	// Pieces that determine the relative length of items
	this.start = start;
	this.end = end;
	this.today = new Date();

	this.relStart = this.ConvertToProjectPoint(start);
	this.relEnd = this.ConvertToProjectPoint(end);
	this.relToday = this.ConvertToProjectPoint(this.today);

	// Pieces that determine the text bubble color
	this.bubbleColor = "#000";
	this.textColor = "#FFF";

	// Set the dimensions regardless of whether
	if (dim) {
		this.width = dim.width;
		this.height = dim.height;
	} else {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
	}

	// Create a SVG canvas for the project items
	KIP.Objects.SVGDrawable.call(this, this.id);

	// Set up the view for the object
	view = this.Resize();

	this.autoResize = false;
	this.AdjustSize(this.width, this.height, view);

	this.bottomBarPercentage = 0.5;
	this.bottomBarGap = 0.05;

	// Create the guidelines
	this.lineGrp = this.CreateGroup("lines");
	this.itemGrp = this.CreateGroup("items");
	this.eventGrp = this.CreateGroup("events");
	this.txtGrp = this.CreateGroup("textBubbles");
	this.headerGrp = this.CreateGroup("guideHeaders");
	this.overlayGrp = this.CreateGroup("overlay");

	// Create the div that will hold the bubbles
	this.textDiv = KIP.Functions.CreateSimpleElement("svgText");
	this.headerDiv = KIP.Functions.CreateSimpleElement("svgHeaders");

	this.CreateGuidelines();
	// Setup the color array for segments
	this.segmentColors = [];

	// Add listener for resizing
	this.AddWindowListeners(dim);
};

/** Inherits from the SVGDrawable class */
KIP.Objects.ProjectWindow.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

/**
 * Adds listeners to the window in general, like resizing
 * @param {Object} [dim] - The original dimensions of the project window
 */
KIP.Objects.ProjectWindow.prototype.AddWindowListeners = function (dim) {
	"use strict";
	var w_h, w_w, that;
	w_h = window.innerHeight;
	w_w = window.innerWidth;
	that = this;

	window.addEventListener("resize", function () {
		var view;
		if (dim) {
			that.width = (dim.width * window.innerWidth) / w_w;
			that.height = (dim.height * window.innerHeight) / w_h;
		} else {
			that.width = window.innerWidth;
			that.height = window.innerHeight;
		}
		view = that.Resize();
		that.CreateGuidelines();
		that.AdjustSize(that.width, that.height, view);
		that.Draw();
	});
};

/**
 * Handle a resize of the window
 */
KIP.Objects.ProjectWindow.prototype.Resize = function () {
	"use strict";
	var ratio = this.width / this.height;
	this.viewH = (this.rowHeight * 40);
	this.viewW = (this.unitWidth * 40 * ratio);
	this.viewX = 0;
	this.viewY = 0;
	return this.CreateView();
};

/**
 * Takes in an input and returns the relative poisition on the default start date
 * 
 * @param {Date} input - A date or date string that should be converted to a relative date
 * @param {Date} [start] - If provided, will compare this as the baseline point 
 *
 * @returns {number} Where the relative date falls on the relative timeline
 */
KIP.Objects.ProjectWindow.prototype.ConvertToProjectPoint = function (input, start) {
	"use strict";
	var diff;

	start = start || this.start;

	if (!this.showWeekends) {
		diff = KIP.Functions.BusinessDateDiff(input, start, true);
	} else {
		diff = KIP.Functions.DateDiff(input, start, true);
	}
	return diff;
};

/**
 * Takes a relative project point and reverts it to its original point.
 * 
 * @param {number} pt - The relative date to convert
 * 
 * @returns {Date} The reverted date
 */
KIP.Objects.ProjectWindow.prototype.RevertFromProjectPoint = function (pt) {
	"use strict";
	var dt;
	dt = new Date(this.start);

	// We need to add weekends back in if we are currently excluding them
	if (!this.showWeekends) {
		pt += 2 * Math.floor((pt + this.start.getDay()) / 5) + 1;
	}

	// Calculate the reverse date
	dt.setDate(dt.getDate() + pt);
	return dt;
};

KIP.Objects.ProjectWindow.prototype.AddGrouper = function (lbl) {
	"use strict";
	
}
/**
 * Adds a timeline item to the view
 * 
 * @param {date} s - The start date for the item
 * @param {date} e - The end date for the item
 * @param {string} lbl - What to use to display information about the item
 * @param {array} topSegments - An array of objects to use for the display of the top part of the row
 * @param {array} bottomSegments - An array of objects to use for the display of the bottom part of the row
 * 
 * @returns {SVGElement} The item that was created
 */
KIP.Objects.ProjectWindow.prototype.AddItem = function (s, e, lbl, topSegments, bottomSegments, addl) {
	"use strict";
	var idx, item, sIdx, segment, row, y, x, div, start, end, sDt, segHeight, segEnd, ctx, that;
	that = this;

	// Convert to dates if needed
	if (!s.getYear) {
		s = new Date(s);
	}
	if (!e.getYear) {
		e = new Date(e);
	}

	// Grab the relative dates from the real dates
	start = this.ConvertToProjectPoint(s);
	end = this.ConvertToProjectPoint(e);

	idx = this.items.length;
	row = this.GetRow(start, end);

	// Create the appropriate item object
	item = this.items[idx] = {
		grp: this.CreateGroup("item" + idx, this.itemGrp),
		lbl: lbl,
		row: row,
		start: s,
		end: e,
		x: start * this.unitWidth,
		y: (row * this.rowHeight * this.rowSpace),
		width: (end + start) * this.unitWidth,
		id: idx,
		eventGrp: this.CreateGroup(idx + "|events", this.eventGrp),
		addl: addl
	};

	// Loop through the top segments & draw
	this.CreateSegments(topSegments, item, start, end, row);

	// Try to add the bottom segments as well
	if (!bottomSegments) {
		bottomSegments = topSegments;
	}

	this.CreateSegments(bottomSegments, item, start, end, row, true)

	// Create a context menu 
	item.ctx = this.AddContextMenu(item);
	
	// Create some text that should apply to
	if (this.showTitles) {

		// Try to overlay text above the item
		this.fillProperty.color = "#000";
		this.fillProperty.opacity = 0.8;
		this.fontProperty.size = (2 * this.rowHeight / 3);
		item.text = this.AddText(item.grp, lbl + "   " + KIP.Functions.ShortDate(s) + " - " + KIP.Functions.ShortDate(e), this.unitWidth / 2, -1, "", {x: 0, y: 1}, item.grp)

		this.fillProperty.opacity = 1;
	}
	
	// Add to our row tracker as appropriate
	if (!this.rows[row]) {
		this.rows[row] = [];
	}
	this.rows[row].push(item);
	return item;
};

/**
 * Creates a context menu for the item
 * 
 * @param {Object} item - The item to add the menu to
 * 
 * @returns {ContextMenu} The menu to display for this element
 */	
KIP.Objects.ProjectWindow.prototype.AddContextMenu = function (item) {
	"use strict";
	var ctx, that;
	that = this;

	// Create a context menu for this element
	ctx = new KIP.Objects.ContextMenu(item.grp);

	// Create the option to expand or collapse the task
	ctx.AddOption("Expand/Collapse", function () {
		that.ExpandItem(item);
	});

	//ctx.AddOption("Remove");
	
	// Draws the context menu on the body
	ctx.Draw(document.body);
	
	// Add the ctxMenu css
	KIP.Functions.CreateCSSClass(".ctxMenu", [
		{key: "border-radius", val: "5px"},
		{key: "padding", val: "5px 0"},
		{key: "background-color", val: "#444"},
		{key: "color", val: "#FFF"},
		{key: "font-family", val: ' "Segoe UI", "Calibri"'}
	]);
	
	// Add the basic context option CSS
	KIP.Functions.CreateCSSClass(".ctxOption", [
		{key: "padding", val: "5px 10px"},
	]);
	
	// Add the highlighted context option CSS
	KIP.Functions.CreateCSSClass(".ctxOption:hover", [
		{key: "color", val: "#444"},
		{key: "background-color", val: "#FFF"},
		{key: "cursor", val: "pointer"}
	]);

	return ctx;
};

/**
 * Grabs the row at which an item appears
 * @param {Object} item - The item to grab the row of
 * @returns {number} The row at which the item appears
 */
KIP.Objects.ProjectWindow.prototype.GetRowOfItem = function (item) {
	"use strict";
	var rIdx, rIt;

	// First try just to grab the item's row
	if (item && item.row) {
		return item.row;
	}

	// Loop backwards as it will wusually be the last item added
	for (rIdx = (this.rows.length - 1); rIdx >= 0; rIdx += 1) {
		for (rIt = 0; rIt < this.rows[rIdx].length; rIt += 1) {
			if (this.rows[rIdx][rIt] === item) {
				return rIdx;
			}
		}
	}
};

/**
 * Creates the top/bottom segments of an item
 * @param {Array} arr - The segments to create
 * @param {Object} item - The item to add this to
 */
KIP.Objects.ProjectWindow.prototype.CreateSegments = function (arr, item, start, end, row, isBottom) {
	"use strict";
	var idx, x, lastX, segEnd, sDt, first;

	lastX = start;
	first = true;

	// Loop through each of the segments
	for (idx = 0; idx < arr.length; idx += 1) {
		if (!arr[idx]) continue;

		sDt = arr[idx].end;

		if (!sDt.getYear) {
			sDt = new Date(sDt);
		}
		segEnd = this.ConvertToProjectPoint(sDt);
		x = lastX;

		if (!first) {
			x += 0.5;
		} else {
			first = false;
		}

		// Try to draw the segment
		if (segEnd >= lastX) {
			this.CreateSegment(item, {x: x, y: row}, segEnd, arr[idx], idx, isBottom);

		// Handle the error case of something not actually being a forward rectangle
		} else {
			console.log("\nError in segment creation\nStart: " + x + " End: " + segEnd);
		}

		lastX = segEnd;
	}

	if (this.disableFill) return;

	// If we haven't hit the end, create a last segment
	if (lastX !== end) {
		if (first) {
			x = start;
		} else {
			x = lastX + 0.5;
		}

		this.CreateSegment(item, {x: x, y: row}, end, {lbl: "??"}, -1, isBottom);
	}
};

/**
 * Creates a segment for a piece of the project plan.
 *
 * @param {Object} item - The item this is being created for
 * @param {Object} start - The start x & y value
 * @param {number} end - At what point the segment ends
 * @param {Object} data - Any additional available data about the segment
 * @param {number} idx - What index of segment we are creating
 * @param {bool} isBottom - True if we are drawing the bottom set of segments
 *
 * @returns {SVGDrawable} The created segment
 */
KIP.Objects.ProjectWindow.prototype.CreateSegment = function (item, start, end, data, idx, isBottom) {
	"use strict";
	var segment, div, y, height, x, width;

	// Adjust the top value as appropriate
	y = start.y * this.rowHeight * this.rowSpace;
	height = this.rowHeight * (1 - this.bottomBarPercentage);

	if (isBottom) {
		y += (this.bottomBarGap * this.rowHeight) + (this.rowHeight * (1 - this.bottomBarPercentage));
		height = (this.rowHeight * this.bottomBarPercentage);
	}

	// Set the x & width values for readability
	x = start.x * this.unitWidth;
	width = ((end - start.x) * this.unitWidth) + (0.5 * this.unitWidth);
	if ((width < 0) || (isNaN(width))) {
		console.log("Err: improper width for segment");
		return;
	}

	// Set the appropriate color & fill properties
	this.SetSegmentStyle(data, idx);

	// Create the segment and label
	segment = this.AddRectangle(x, y, width, height, "", item.grp);
	div = this.AddTextBubble(data.lbl + "<br>[" + data.type + " on " + data.end + "]", segment, item, "", "", "", (y + (6 * height)) - item.y);

	return segment;
};

/**
 * Sets the style for the provided segment. Can be overriden by individual implementations
 * @param {SVGElement} segment - Data about the segment to set the appropriate color 
 * @param {number} idx - The index of the segment
 */
KIP.Objects.ProjectWindow.prototype.SetSegmentStyle = function (segment, idx) {
	"use strict";
	if (!this.segmentColors[idx]) {
		this.segmentColors[idx] = KIP.Functions.GenerateColor(idx, KIP.Constants.HSLPieceEnum.Hue);
	}
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.segmentColors[idx];
};

/**
 * Adds data about an event without actually drawing it
 * 
 * @param {Object} item     - The item object to add event data to
 * @param {Date} pos      - The date at which this event should appear. Accepts a date string or Date object
 * @param {String} lbl      - What label should appear for the event on hover
 * @param {Object} addlInfo - Any additional information needed about the event
 * 
 * @returns {Object} The data about the created event
 */
KIP.Objects.ProjectWindow.prototype.AddEventData = function (item, pos, lbl, addlInfo) {
	"use strict";
	var ev, dt, pt, row, x ,y;

	if (!item) return;

	if (!pos.getYear) {
		dt = new Date(pos);
	}
	pt = this.ConvertToProjectPoint(dt);

	x = pt * this.unitWidth;

	row = this.GetRowOfItem(item);
	y = row * this.rowSpace * this.rowHeight;

	ev = {
		lbl: lbl,
		date: pos,
		prjPt: pt,
		row: row,
		x: x,
		y: y,
		addl: addlInfo
	};

	// Add to our array
	if (!item.events) {
		item.events = [];
	}
	item.events.push(ev);

	// return the created object
	return ev;
};

/**
 * Adds an event & draws it
 * 
 * @param {Object} item - The item object to add event data to
 * @param {Object} [ev] - If available, the data that was already created for this event. Created if not passed in
 * @param {Date} [pos] - The date at which this event should appear. If ev is passed in, this is ignored
 * @param {String} [lbl] - The label that should appear for this event. If ev is passed in, this is ignored
 * @param {Object} [addlInfo] - Any additional info available for the event
 * 
 * @returns {SVGElement} The event that was created
 */
KIP.Objects.ProjectWindow.prototype.AddEvent = function (item, ev, pos, lbl, addlInfo, large) {
	"use strict";
	var date, row, dx, dy, txt, event;

	// Quit if we don't have an item
	if (!item) return;

	// Grab the appropriate data
	if (!ev) {
		ev =this.AddEventData(item, pos, lbl, addlInfo);
	}

	// Grab the offset valies we should use
	dx = this.unitWidth / 8;
	dy = this.rowHeight / 3;

	// Set attributes for the event
	this.fillProperty.type = "solid";
	if (ev.addl) {
		if (ev.addl.idx || ev.addl.idx === 0) {
			this.fillProperty.color = this.segmentColors[ev.addl.idx];
		} else if (ev.addl.color) {
			this.fillProperty.color = ev.addl.color;
		}
	}  else {
		this.fillProperty.color = "#FFF";
	}

	// Set the appropriate line properties
	
	this.fillProperty.opacity = 1;


	// Create a marker for the event
	if (large) {
		this.lineProperty.type = "solid";
		this.lineProperty.width = (dx );
		this.lineProperty.color = "#333";
		
		event = this.AddPath([
			{x: ev.x - dx, y: ev.y - dy},
			{x: ev.x - dx, y: ev.y},
			{x: ev.x, y: ev.y + (0.5 * dy)},
			{x: ev.x + dx, y: ev.y},
			{x: ev.x + dx, y: ev.y - dy}
		], {id: "ev." + this.events.length}, item.eventGrp);
	} else {
		event = this.AddRectangle(ev.x, ev.y, this.unitWidth / 10, this.rowHeight * (1 - this.bottomBarPercentage), {id: "ev." + this.events.length}, item.eventGrp);
	}

	txt = this.AddTextBubble(ev.lbl, event, item);
	
	this.lineProperty.type = "none";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";

	return event;
};

/**
 * Removes all events linked to an event from the canvas (but not the internal collection)
 * Used to only draw events on zoom in
 * @param {Object} item - The item to remove events from
 */
KIP.Objects.ProjectWindow.prototype.RemoveEvents = function (item) {
	"use strict";
	item.eventGrp.innerHTML = "";
};

/**
 * Adds all events in an item's internal array to the canvas.
 * Used to only draw events on zoom in
 * @param {Object} item - The item to add events to.
 */
KIP.Objects.ProjectWindow.prototype.AddEvents = function (item, large) {
	"use strict";
	var ev, event;
	
	if (!item.events) return;
	
	for (ev = 0; ev < item.events.length; ev += 1) {
		this.AddEvent(item, item.events[ev], "", "", "", large);
	}
};

/**
 * Expands an item to fill the screen. 
 * Allows the view of more details about the event
 * @param {Object} item - The item to expand
 */
KIP.Objects.ProjectWindow.prototype.ExpandItem = function (item) {
	"use strict";
	var scaleCoord, posCoord, w, h;

	// Handle collapsing
	if (item.expanded) {
		// Remove from the overlay
		this.overlayGrp.removeChild(item.grp);
		this.overlayGrp.removeChild(this.overlay);
		this.overlayGrp.removeChild(item.eventGrp);

		this.itemGrp.appendChild(item.grp);
		this.eventGrp.appendChild(item.eventGrp);
		item.expanded = false;
		this.expanded = null;
		this.div.style.cursor = "-webkit-grab";

		item.grp.removeAttribute("transform");
		item.eventGrp.removeAttribute("transform");

		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item);
		}
		
		item.text.style.fill = "#000";
		item.text.removeAttribute("transform");

	// Handle expanding
	} else {
		// Create the overlay
		this.fillProperty.opacity = 0.8;
		this.fillProperty.color = "#000";
		this.fillProperty.type="solid";
		this.overlay = this.AddRectangle(this.viewX, this.viewY, this.viewW, this.viewH, "", this.overlayGrp);

		this.itemGrp.removeChild(item.grp);
		this.eventGrp.removeChild(item.eventGrp);
		this.overlayGrp.appendChild(item.grp);
		this.overlayGrp.appendChild(item.eventGrp);
		item.expanded = true;
		this.expanded = item;
		this.div.style.cursor = "default";

		// Calculate the appropriate coordinates
		w = document.documentElement.clientWidth || window.innerWidth;
		h = document.documentElement.clientHeight || window.innerHeight;
		scaleCoord = this.CalculateSVGCoordinates(w - 20, (2 * h / 3));
		posCoord = this.CalculateSVGCoordinates(20, (window.innerHeight) / 3);
		scaleCoord.x -= posCoord.x;
		scaleCoord.y -= posCoord.y;

		// Actually do the resizing
		this.ResizeAndRepositionItem(item, {
			w: scaleCoord.x,
			h: scaleCoord.y,
			x: posCoord.x,
			y: posCoord.y
		});
		
		item.text.style.fill = "#FFF";
		item.text.setAttribute("transform", "translate(0," + (-0.25 * this.MeasureElem(item.text).height) + ")");
		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item, true);
		}
	}
};

/**
 * Gets the row at which an item should appear, before the item is created
 * 
 * @param {Date} start - The start date of the event we are getting the row for
 * @param {Date} end - The end date of the event we are getting the row for
 * 
 * @returns {number} The row number for this item
 */
KIP.Objects.ProjectWindow.prototype.GetRow = function (start, end) {
	"use strict";

	// TODO eventually: allow multiple elements per row
	return this.rows.length;
};

/**
 * OBSOLETE Creates a text bubble as an SVG
 * @param {number} x      The x coordinate the bubble should appear at
 * @param {number} y      The y coordinate the bubble should appear at
 * @param {String} lbl    The label that should appear in the bubble
 * @param {SVGGroup} layer - The layer at which this bubble should be added
 * @param {Object} origin - The origin of the text that will be displayed
 * @returns {SCGElement} The bubble that is created
 */
KIP.Objects.ProjectWindow.prototype.AddSVGTextBubble = function (x, y, lbl, layer, origin) {
	"use strict";
	var rect, text, attr, dim, grp;

	 grp = this.CreateGroup(lbl + "bubble", layer);

	if (lbl === "") {
		lbl = "??";
	}

	// Reset other properties
	this.lineProperty.type = "none";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";

	// Set the color attributes
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.bubbleColor;

	// Set the rectangle attributes
	attr = {
		rx: (this.rowHeight / 3),
		ry: (this.rowHeight / 3)
	};
	rect = this.AddRectangle(x, y, 0, 0, attr, grp);

	if (!origin)  {
		origin = {};
		origin.x = 0;
		origin.y = 0;
	}

	// Add the text
	this.fillProperty.color = this.textColor;
	this.fontProperty.family = "Segoe UI Semilight, Calibri, Arial";
	this.fontProperty.size = (this.rowHeight / 3) + "pt";
	text = this.AddText("", lbl, x, y, "", origin, grp);

	// Resize the rectangle to the size of the text
	dim = this.MeasureElem(text);
	rect.setAttribute("width", dim.width * 1.75);
	rect.setAttribute("height", dim.height * 1.65);
	rect.setAttribute("x", x);
	text.setAttribute("x", x + (dim.width * 0.37));
	rect.setAttribute("y", dim.y - (dim.height * 82.5));

	return grp;
};

/**
 * Adds a label hover bubble for an svg element. Stays in the same place for the DLG
 * 
 * @param {String} lbl - The label that should appear in the bubble
 * @param {SVGElement} elem - The element to add the bubble to
 * @param {Object} item - The item object that this bubble is generally being applied to
 * @param {number} [anchor_x] - The x-position at which a bubble should always appear
 * @param {number} [anchor_y] - The y-position at which a bubble should always appear
 * 
 * @returns {HTMLElement} The text bubble that was created
 */
KIP.Objects.ProjectWindow.prototype.AddTextBubble = function (lbl, elem, item, anchor_x, anchor_y) {
	"use strict";
	var div, that;
	
	if (!elem) return;

	// check if we've attched our element
	if (!this.textDiv.parentNode) {
		this.parent.appendChild(this.textDiv);
	}

	div = KIP.Functions.CreateSimpleElement("txt." + lbl, "textBubble", lbl);
	div.style.position = "absolute";
	div.style.backgroundColor = this.bubbleColor;
	div.style.color = this.textColor;
	div.style.fontFamily = "Calibri";
	div.style.padding = "3px";
	div.style.borderRadius = "5px";

	this.textDiv.appendChild(div);
	that = this;


	// Mouse in listener
	elem.addEventListener("mouseover", function (ev) {
		var x, y, box;
		// Quit if we've already revealed the bubble
		if (!KIP.Functions.HasCSSClass(div, "hidden")) return;

		box = elem.getBoundingClientRect();

		x = Math.round(box.left < 0 ? 0 : box.left);
		y = Math.round(box.top < 0 ? box.height : box.top + box.height);

		// Set the appropriate coordinates
		div.style.left = x + "px";
		div.style.top = y + "px";
		KIP.Functions.RemoveCSSClass(div, "hidden");
	});

	// Mouse out listener
	elem.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		if (rel === div) return;

		KIP.Functions.AddCSSClass(div, "hidden");
	});

	// Mouse in listener for the bubble
	div.addEventListener("mouseover", function (ev) {
		ev.stopPropagation();
		return false;

	});

	div.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		if (rel === elem) return;

		KIP.Functions.AddCSSClass(div, "hidden");
	});

	KIP.Functions.AddCSSClass(div, "hidden");

	return div;
};

/**
 * Creates the lines indicating dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuidelines = function () {
	"use strict";
	var num, lIdx, ln, func, relToday, x, dow, today, revDt, w, mult, coordA, coordB, noShow, shortDt, txt, txtColor, box;

	// Don't draw lines if they wouldn't show
	coordA = this.CalculateScreenCoordinates(this.viewX, this.viewY);
	coordB = this.CalculateScreenCoordinates(this.viewX + (this.unitWidth / 15), this.viewY);
	if ((coordB.x - coordA.x) === 0) {
		noShow = true;
	}

	// Even if they might be shown, don't show more than 200 lines
	if (this.viewW > (200 * this.unitWidth)) {
		noShow = true;
	}

	// Remove all old guildelines
	for (lIdx = this.lines.length - 1; lIdx >= 0; lIdx -= 1) {
		if (this.lines[lIdx] && this.lines[lIdx].parentNode) {
			this.lineGrp.removeChild(this.lines[lIdx]);
		}
	}

	this.lines = [];
	num = this.viewW / this.unitWidth;

	today = new Date();
	dow = today.getDay();
	relToday = this.ConvertToProjectPoint(today);

	// Set the fill properies for these lines
	this.fillProperty.type = "solid";
	this.lineProperty.type = "none";
	this.lineProperty.color = "rgba(0,0,0,0)";
	this.lineProperty.width = 0;

	// Loop throuh all visible lines at this point
	for (lIdx  = 0; lIdx < num; lIdx += 1) {
		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + (lIdx * this.unitWidth);
		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		shortDt = KIP.Functions.ShortDate(revDt);
		dow = revDt.getDay();
		txt = "";

		if (this.importantDates[shortDt]) {
			w = this.unitWidth;
			this.fillProperty.color = this.importantDates[shortDt].color;
			txt = this.importantDates[shortDt].lbl;
			txtColor = this.importantDates[shortDt].textColor;

		} else if (KIP.Functions.DateDiff(revDt, today) === 0) {
			this.fillProperty.color = "#8AE";
			w = this.unitWidth;

		} else if (this.showWeekends && (dow === 0 || dow === 6)) {
			this.fillProperty.color = "#DDD";
			w = this.unitWidth;

		} else if (!this.showWeekends && dow === 1) {
			if (noShow) continue;
			this.fillProperty.color = "#AAA";
			w = this.unitWidth / 20;

		} else {
			if (noShow) continue;
			this.fillProperty.color = "#EEE";
			w = this.unitWidth / 20;
		}

		ln = this.AddRectangle(x, this.viewY, w, this.viewH, "", this.lineGrp);
		this.lines.push(ln);

		// Draw the text for important dates
		if (txt) {
			this.fillProperty.color = txtColor;
			this.fontProperty.size = (2 * this.unitWidth / 3);
			txt = this.AddText(ln, txt, (0.5 * this.unitWidth),  (3 * this.rowHeight), "", {x: 0.5, y: 0.5}, this.lineGrp);
			box = this.MeasureElem(txt);
			txt.setAttribute("y", +txt.getAttribute("y") + (box.width / 2) + this.rowHeight);

			this.RotateElement(txt, -90);
			this.lines.push(txt);
		}
		
	}

	this.CreateGuideHeaders(noShow);
};

/**
 * Creates the headers for the dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuideHeaders = function (noNumbers) {
	"use strict";
	var num, header, txt, idx, revDt, x, months, mIdx, rect, month, w;

	// remove all of the old guide headers
	for (idx = this.headers.length - 1; idx >= 0; idx -= 1) {
		if (this.headers[idx] && this.headers[idx].parentNode) {
			this.headerGrp.removeChild(this.headers[idx]);
		}
	}

	this.headers = [];
	months = {};

	
	this.fillProperty.type="solid";
	this.fontProperty.size=(this.unitWidth / 2);
	this.fontProperty.family = "Segoe UI Light,Calibri";
	this.fillProperty.opacity = 1;

	num = this.viewW / this.unitWidth;
	for (idx = 0; idx < num; idx += 1) {

		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + ((idx - 1) * this.unitWidth);

		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		mIdx = revDt.getMonth() + "." + revDt.getYear();

		// Initialize the months index if appropriate
		if (!months[mIdx]) {
			months[mIdx] = {
				name: KIP.Functions.GetMonthName(revDt),
				start: x,
				month: revDt.getMonth(),
				year: revDt.getFullYear()
			}
		} else {
			months[mIdx].end = x;
		}

		// Don't raw numbers if we shouldn't be
		if (noNumbers) continue;

		// Create the day headers
		this.fillProperty.color = "#FFF";
		this.headers.push(this.AddRectangle(x, this.viewY + (this.rowHeight * 2), this.unitWidth, this.rowHeight, "", this.headerGrp));
		this.fillProperty.color="#68C";
		this.headers.push(this.AddText("", revDt.getDate(), x + (this.unitWidth / 4), this.viewY + (this.rowHeight * 2), "", {x: 0, y: 0}, this.headerGrp));

	}
	

	// Create the monthly headers
	for (mIdx in months) {
		if (months.hasOwnProperty(mIdx)) {

			month = months[mIdx];
			w = month.end - month.start + this.unitWidth;
			if ((w < 0) || (isNaN(w))) continue;

			// create a rectangle
			this.fillProperty.color = this.monthColors[month.month];
			this.headers.push(this.AddRectangle(month.start, this.viewY, w, this.rowHeight * 2, "", this.headerGrp));

			// create the text
			this.fillProperty.color = "#FFF";

			this.fontProperty.size = this.unitWidth;
			this.headers.push(this.AddText("", month.name.toUpperCase() + " " + month.year, month.start + (2 * this.unitWidth), this.viewY, "", {x: 0, y: 0}, this.headerGrp));
		}
	}
};

/**
 * Handle updating our guidelines on zoom
 * @param {number} amt - The amount that has been zoomed
 */
KIP.Objects.ProjectWindow.prototype.Zoom = function (amt) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Zoom.call(this, amt);
	this.CreateGuidelines();
	this.RefreshUI();
};

/**
 * Handle updating our guidelines on pan
 * @param {number} amtX - The x amount to move the viewbox
 * @param {number} amtY - The y amount to move the viewbox
 */
KIP.Objects.ProjectWindow.prototype.Pan = function (amtX, amtY) {
	"use strict";
	if (this.expanded) return;
	KIP.Objects.SVGDrawable.prototype.Pan.call(this, amtX, amtY);
	this.CreateGuidelines();
	this.RefreshUI();
};

/** 
 * Allows the user to sort the items in the Gantt chart according to a particular sort function
 * @param {function} sortFunc - The function to sort the list by
 */
KIP.Objects.ProjectWindow.prototype.Sort = function (sortFunc, titleFunc) {
	"use strict";
	var i, y, h, lastH, headCb, that = this;

	// Clear any previous headers
	this.itemHeaders.map (function (elem) {
		if (!elem) return;
		if (!elem.div) return;
		if (elem.div.parentNode) {
			elem.div.parentNode.removeChild(elem.div);
		}
	});
	this.itemHeaders = [];
	
	// We need to rearrange the rows to the appropriate positions
	this.items.sort(sortFunc);

	// Also create headers for each of the sections
	this.items.map(function (elem, key, arr) {
		h = titleFunc(elem);
		if (lastH === h) return;
		that.AddItemHeader(key, h);
		lastH = h;
	});
	
	// Update the UI
	this.RefreshUI();
};

/** 
 * Clears all data about this project.
 */
KIP.Objects.ProjectWindow.prototype.Clear = function () {
	"use strict";
	var rIdx, idx, item;

	// Clear out the visible elements
	this.ClearUI();

	// Clear out our internal collections
	this.rows = [];
	this.items = [];
	this.events = [];
};

/** 
 * Clears the UI of the project, but not its internal data
 */
KIP.Objects.ProjectWindow.prototype.ClearUI = function () {
	"use strict";
	this.itemGrp.innerHTML = "";
	this.eventGrp.innerHTML = "";
	this.textDiv.innerHTML = "";
};

/**
 * Temporarily resizes an item via a transform matrix
 * 
 * @param {Object} item - The item to resize & reposition
 * @param {Object} newDim - The new dimensions to use for the item
 * @param {number} newDim.x - The new x position
 * @param {number} newDim.y - The new y position
 * @param {number} newDim.w - The new width of the item
 * @param {number} newDim.h - The new height of the item
 * @param {number} [newDim.scaleW] - The percentage to scale by. Used in place of w if provided
 * @param {number} [newDim.scaleH] - The percentage to scale by. Used in place of h if provided
 */
KIP.Objects.ProjectWindow.prototype.ResizeAndRepositionItem = function (item, newDim) {
	"use strict";
	var box, dx, dy, dw, dh, matrix;

	// Remove any previous transforms we had applied
	item.grp.removeAttribute("transform");

	// Measure the elem as it originally existed
	box = this.MeasureElem(item.grp);

	// Quit if width or height are zero
	if (box.width === 0) return;
	if (box.height === 0) return;

	// Calculate the deltas of the width & height
	dw = newDim.scaleW || (newDim.w / box.width);
	dh = newDim.scaleH || (newDim.h / box.height);

	// Calculate the deltas of the new x & y
	dx = newDim.x - box.x;
	dy = newDim.y - box.y;

	// Calculate what offset we'll need for the scaling
	dx += (-1 * (dw - 1) * box.x);
	dy += (-1 * (dh - 1) * box.y);

	// Create the matrix element to use
	matrix = "matrix(";
	matrix += dw + ", ";
	matrix += "0, 0, ";
	matrix += dh + ", ";
	matrix += dx + ", ";
	matrix += dy;
	matrix += ")";

	item.grp.setAttribute("transform", matrix);
	item.eventGrp.setAttribute("transform", matrix);
};

/**
 * Disables showing the titles inline
 * @param {boolean} [undo] - If true, enables the titles
 */
KIP.Objects.ProjectWindow.prototype.DisableTitles = function (undo) {
	"use strict";

	if (undo) {
		this.rowSpace = 2.5;
		this.showTitles = true;
	} else {
		this.rowSpace = 1.5;
		this.showTitles = false;
	}

	this.RefreshUI();
};

/** 
 * Changes the y position of an item
 * @param {Object} item - The item that is being adjusted
 * @param {number} newY - The new Y value that this item should appear at
 * @param {number} row  - The new row value of the item
 */
KIP.Objects.ProjectWindow.prototype.AdjustY = function (item, newY, row) {
	"use strict";
	var grp, c, child, origY, dy, tmp;

	this.rows[row] = [this.items[row]];
	this.items[row].row = row;
	this.items[row].y = newY;

	grp = item.grp;

	// Loop through all of the segments and adjust their position
	for (c = 0; c < grp.children.length; c += 1) {
		child = grp.children[c];
		tmp = child.getAttribute("y");

		// Make sure we account for both the top & bottom row
		if (!origY && (origY !== 0)) {
			origY = tmp;
		}

		if ((tmp !== origY) && (child !== item.text)) {
			dy = (+tmp) - (+origY);
		} else if (child === item.text) {
			dy = -1;
		} else {
			dy = 0;
		}

		child.setAttribute("y", newY + dy);
	}

	// Remove & redraws the associated events
	if (item.events) {
		item.events.map(function (elem) {
			elem.row = row;
			elem.y = newY;
		});
		this.RemoveEvents(item);
		this.AddEvents(item);
	}
};

/**
 * Refreshes the display so that new Y values are accommodated
 */
KIP.Objects.ProjectWindow.prototype.RefreshUI = function () {
	"use strict";
	var i, y, h_y, box, top;

	// Now loop through the events and assign new rows
	this.rows = [];
	h_y = 0;
	for (i = 0; i < this.items.length; i += 1) {

		// Show or hide the title as appropriate
		if (!this.showTitles) {
			if (this.items[i].text && this.items[i].text.parentNode) {
				this.items[i].text.parentNode.removeChild(this.items[i].text);
			}
		} else {
			if (this.items[i].text && !this.items[i].text.parentNode) {
				this.items[i].grp.appendChild(this.items[i].text);
			}
		}
		
		// Check if there is a header, and if so, draw it too
		if (this.itemHeaders[i]) {
			this.headerDiv.appendChild(this.itemHeaders[i].div);
			
			top = this.CalculateScreenCoordinates(0, h_y + this.rowSpace + (i * this.rowHeight * this.rowSpace)).y;
			top += this.div.getBoundingClientRect().top;
			this.itemHeaders[i].div.style.top = top + "px";
			box = this.itemHeaders[i].div.getBoundingClientRect();
			if (box.height > 0) {
				h_y += this.CalculateSVGHeight(box.height) + (1.5 * this.rowSpace);
			}
		}
	
		y = h_y + (i * this.rowHeight * this.rowSpace);
		this.AdjustY(this.items[i], y, i);

		
	}

	// Refresh all of the appropriate elements
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.AddItemHeader = function (idx, label) {
	"use strict";
	var h;
	
	// Add our header div if appropriate
	if (!this.headerDiv.parentNode) {
		this.parent.appendChild(this.headerDiv);
	}
	
	// Create a header to be added
	h = KIP.Functions.CreateSimpleElement("header" + idx, "header", label);
	
	// Save to our headers array
	this.itemHeaders[idx] = {
		div: h,
		lbl: label,
		key: idx
	};
	
};
/**
 * Adds an important date to our internal collection.
 */
KIP.Objects.ProjectWindow.prototype.AddImportantDate = function (startDate, lbl, color, textColor, endDate) {
	"use strict";
	var diff, dir, dt, dIdx, tmp;
	
	// Convert to a date if need be
	if (!startDate.getFullYear) {
		startDate = new Date(startDate);
	}
	
	// Convert the end date if we have it & get the difference between it & the start date
	diff = 0;
	dir = 1;
	
	if (endDate && !endDate.getFullYear) {
		endDate = new Date(endDate);
	}
	
	if (endDate) {
		diff = KIP.Functions.DateDiff(endDate, startDate);
		dir = (diff < 0) ? -1 : 1;
		diff = Math.abs(diff);
	}
	
	// Quit if the date isn't real
	if (!startDate || !startDate.getFullYear) return;
	tmp = new Date(startDate);
	for (dIdx = 0; dIdx <= diff; dIdx += dir) {
		dt = tmp;
		// Add to our important date array
		this.importantDates[KIP.Functions.ShortDate(dt)] = {
			date: dt,
			lbl: lbl,
			color: color || "#C30",
			textColor: textColor || "FFF"
		};
		dt = KIP.Functions.AddToDate(tmp, {days: 1});
	}

	// Redraw so the date is now incorporated
	this.CreateGuidelines();
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.CreateImportantDateForm = function (date, cb) {
	"use strict";

	var lblInput, bgLbl, bgColor, txtLbl, txtColor, startLbl, startDt, endLbl, endDt, accept, cancel, clear, cats, c, catOpt, that = this;

	if (!date) date = "";

	// Allow the user to name the date anything they want
	lblInput = KIP.Functions.CreateElement({
		type: "input",
		id: "dateLabel", 
		cls: "dateLabel",
		attr: [
			{key: "placeholder", val: "Label for important date"}
		]
	});

	// Field for allowing user to set the background color
	bgColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateBG",
		cls: "dateBG",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "rgb(0,0,0)"}
		]
	});
	bgLbl = KIP.Functions.CreateSimpleElement("bgColorLbl", "bgColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Background Color: "
		},
		bgColor
	]);

	// Allow the user to change the color of the text on top
	txtColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateTxtColor",
		cls: "dateTxtColor",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "#FFFFFF"}
		]
	});
	txtLbl = KIP.Functions.CreateSimpleElement("txtColorLbl", "textColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Text Color: "
		},
		txtColor
	]);

	// Let the user set the appropriate date
	startDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	startLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Start Date * : "
		},
		startDt
	]);
	
		// Let the user set the appropriate date
	endDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	endLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "End Date: "
		},
		endDt
	]);
	
	// Category selector
	cats = KIP.Functions.CreateElement({
		type: "select"
	});
	
	// Create the options for this cat selector as well
	for (c = 0; c < this.impDateCategories.length; c += 1) {
		catOpt = KIP.Functions.CreateElement({
			type: "Option",
			value: c,
			before_content: this.impDateCategories[c]
		});
		cats.appendChild(catOpt);
	}
	
	this.impDateCatSelector = cats;

	clear = function () {
		startDt.value = "";
		endDt.value = "";
		lblInput.value = "";
		bgColor.value = "#000000";
		txtColor.value = "#FFFFFF";
	};

	accept = KIP.Functions.CreateSimpleElement("impDateAccept", "impDateAccept", "Accept");
	accept.addEventListener("click", function () {
		var dStart, dEnd;
		dStart = startDt.value;
		dEnd = endDt.value;
		if (!dEnd) dEnd = dStart;
		if (dStart) {
			dStart = dStart.split("-");
			dEnd = dEnd.split("-");
			that.AddImportantDate(new Date(dStart[0], dStart[1] - 1, dStart[2]),
														lblInput.value,
														bgColor.value,
														txtColor.value,
														new Date(dEnd[0], dEnd[1] - 1, dEnd[2])
													 );
		}
		clear();
		that.ShowImportantDateForm("", cb);
	});

	cancel = KIP.Functions.CreateSimpleElement("impDateCancel", "impDateCancel", "Cancel");
	cancel.addEventListener("click", function () {
		clear();
		that.ShowImportantDateForm("", cb);
	});

	this.dateForm = KIP.Functions.CreateSimpleElement("impDateForm", "impDateForm", "", "", [startLbl, endLbl, lblInput, bgLbl, txtLbl, accept, cancel]);

	return this.dateForm;

};

KIP.Objects.ProjectWindow.prototype.ShowImportantDateForm = function (parent, cb) {
	"use strict";
	if (!this.dateForm) {
		this.AddImportantDateCategory("Just Me");
		this.AddImportantDate("Everyone");
		this.CreateImportantDateForm("", cb);
	}

	if (this.dateFormShowing) {
		this.dateForm.parentNode.removeChild(this.dateForm);
		this.dateFormShowing = false;
	} else {
		parent.appendChild(this.dateForm);
		this.dateFormShowing = true;
	}

	if (cb) cb();
};

KIP.Objects.ProjectWindow.prototype.AddImportantDateCategory = function (catName) {
	"use strict";
	var catOpt, idx;
	
	idx = this.impDateCategories.length;
	this.impDateCategories.push(catName);
	
	// If we have already drawn the form, we need to add new catgories
	catOpt = KIP.Functions.CreateElement({
		type: "Option",
		value: idx,
		before_content: catName
	});
	this.impDateCatSelector.appendChild(catOpt);
	
	// return the index this was added to
	return idx;
}

KIP.Objects.ProjectWindow.prototype.RemoveImportantDate = function (dt) {
	"use strict";
	delete this.importantDates[dt];
	this.CreateGuidelines();
	this.Draw();
}/*globals KIP,window,console*/

/**
 * Creates a view of a project in a Gantt Chart
 * @class ProjectWindow
 * @param {string} name - The name & ID of the project
 * @param {Date} start - The date at which the default viewing window should start. Can be a date string or a Date object
 * @param {Date} end   - OBSOLETE. The date at which the default viewing window should end. Can be a date string or a Date object
 * @param {Object} [dim]   - What the dimensions of SVG Element should be
 */
KIP.Objects.ProjectWindow = function (name, start, end, dim) {
	"use strict";
	var view;
	this.name = name;
	this.id = name;
	this.rowHeight = 5;
	this.rowSpace = 2.5;

	this.unitWidth = 5;

	// Create collections for items & events
	this.items = [];
	this.eventCnt = 0;
	this.rows = [];
	this.lines = [];
	this.headers = [];
	this.itemHeaders = [];

	this.importantDates = {};
	this.impDateCategories = [];

	this.showWeekends = true;
	this.showOverallLbl = true;
	this.disableFill = false;
	this.showTitles = true;
	this.alwaysShowEvents = false;
	
	this.maxHeaderHeight = 40;

	this.monthColors = [
		"37c8ab",
		"#00aad4",
		"#0066ff",
		"#3737c8",
		"#7137c8",
		"#ab37c8",
		"#ff0066",
		"#ff2a2a",
		"#ff6600",
		"#ffcc00",
		"#abc837",
		"#37c837"
	];

	// Covert the start/end to dates if needed
	if (!start.getYear) {
		start = new Date(start);
	}
	if (!end.getYear) {
		end = new Date(end);
	}

	// Pieces that determine the relative length of items
	this.start = start;
	this.end = end;
	this.today = new Date();

	this.relStart = this.ConvertToProjectPoint(start);
	this.relEnd = this.ConvertToProjectPoint(end);
	this.relToday = this.ConvertToProjectPoint(this.today);

	// Pieces that determine the text bubble color
	this.bubbleColor = "#333";
	this.textColor = "#FFF";

	// Set the dimensions regardless of whether
	if (dim) {
		this.width = dim.width;
		this.height = dim.height;
	} else {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
	}

	// Create a SVG canvas for the project items
	KIP.Objects.SVGDrawable.call(this, this.id);

	// Set up the view for the object
	view = this.Resize();

	this.autoResize = false;
	this.AdjustSize(this.width, this.height, view);

	this.barPercentages = [0.5, 0.5];
	this.bottomBarPercentage = 0.5;
	this.bottomBarGap = 0.05;
	this.barGap = 0.05;
	
	this.eventRow = 0;

	// Create the guidelines
	this.lineGrp = this.CreateGroup("lines");
	this.itemGrp = this.CreateGroup("items");
	this.eventGrp = this.CreateGroup("events");
	this.txtGrp = this.CreateGroup("textBubbles");
	this.headerGrp = this.CreateGroup("guideHeaders");
	this.overlayGrp = this.CreateGroup("overlay");

	// Create the div that will hold the bubbles
	this.textDiv = KIP.Functions.CreateSimpleElement("svgText");
	this.headerDiv = KIP.Functions.CreateSimpleElement("svgHeaders");

	this.CreateGuidelines();
	// Setup the color array for segments
	this.segmentColors = [];

	// Add listener for resizing
	this.AddWindowListeners(dim);
};

/** Inherits from the SVGDrawable class */
KIP.Objects.ProjectWindow.prototype = Object.create(KIP.Objects.SVGDrawable.prototype);

/**
 * Adds listeners to the window in general, like resizing
 * @param {Object} [dim] - The original dimensions of the project window
 */
KIP.Objects.ProjectWindow.prototype.AddWindowListeners = function (dim) {
	"use strict";
	var w_h, w_w, that;
	w_h = window.innerHeight;
	w_w = window.innerWidth;
	that = this;

	window.addEventListener("resize", function () {
		var view;
		if (dim) {
			that.width = (dim.width * window.innerWidth) / w_w;
			that.height = (dim.height * window.innerHeight) / w_h;
		} else {
			that.width = window.innerWidth;
			that.height = window.innerHeight;
		}
		view = that.Resize();
		that.CreateGuidelines();
		that.AdjustSize(that.width, that.height, view);
		that.Draw();
	});
};

/**
 * Handle a resize of the window
 */
KIP.Objects.ProjectWindow.prototype.Resize = function () {
	"use strict";
	var ratio = this.width / this.height;
	this.viewH = (this.rowHeight * 40);
	this.viewW = (this.unitWidth * 40 * ratio);
	this.viewX = 0;
	this.viewY = 0;
	return this.CreateView();
};

/**
 * Takes in an input and returns the relative poisition on the default start date
 * 
 * @param {Date} input - A date or date string that should be converted to a relative date
 * @param {Date} [start] - If provided, will compare this as the baseline point 
 *
 * @returns {number} Where the relative date falls on the relative timeline
 */
KIP.Objects.ProjectWindow.prototype.ConvertToProjectPoint = function (input, start, addTime) {
	"use strict";
	var diff;

	start = start || this.start;

	if (!this.showWeekends) {
		diff = KIP.Functions.BusinessDateDiff(input, start, true, addTime);
	} else {
		diff = KIP.Functions.DateDiff(input, start, true, addTime);
	}
	
	// Convert to a percentage start
	if (addTime) {
		diff /= (1000 * 60 * 60 * 24);		
	}
	
	return diff;
};

/**
 * Takes a relative project point and reverts it to its original point.
 * 
 * @param {number} pt - The relative date to convert
 * 
 * @returns {Date} The reverted date
 */
KIP.Objects.ProjectWindow.prototype.RevertFromProjectPoint = function (pt) {
	"use strict";
	var dt;
	dt = new Date(this.start);

	// We need to add weekends back in if we are currently excluding them
	if (!this.showWeekends) {
		pt += 2 * Math.floor((pt + this.start.getDay()) / 5) + 1;
	}

	// Calculate the reverse date
	dt.setDate(dt.getDate() + pt);
	return dt;
};

KIP.Objects.ProjectWindow.prototype.AddGrouper = function (lbl) {
	"use strict";
	
}

KIP.Objects.ProjectWindow.prototype.CreateExpandedInfo = function (addl) {
	"use strict";
	var div, key, val, excl;
	
	excl = {
		"TopSegments" : true,
		"BottomSegments" : true,
		"Events" : true,
		"Design" : true
	}
	div = KIP.Functions.CreateSimpleElement("", "additionalInfo");
	
	if (!this.expandedInfoCB) {
		div.innerHTML = this.WriteArray(addl, "<div class='additionalInfoLine'>", "</div>", excl);
	} else {
		div.innerHTML = this.expandedInfoCB(addl);
	}
	
	return div;
}

KIP.Objects.ProjectWindow.prototype.WriteArray = function (arr, before, after, exclude) {
	"use strict";
	var key, val, ret;
	
	ret = "";
	for (key in arr) {
		if (arr.hasOwnProperty(key)) {
			val = arr[key];
			
			if (exclude && exclude[key]) {
				continue;
			}
			
			if (typeof val !== "object") {
				ret += before + key + " : " + val + after;
			} else if (val) {
				ret += before + key + " : " + this.WriteArray(val, before, after) + after;
			}
		}
	}
	
	return ret;
}
/**
 * Adds a timeline item to the view
 * 
 * @param {date} s - The start date for the item
 * @param {date} e - The end date for the item
 * @param {string} lbl - What to use to display information about the item
 * @param {array} segments - An array of arrays of objects that contain the data to display for each of the rows of the item
 * @param {object} addl - Any additional details about the item that are worth knowing
 * @returns {SVGElement} The item that was created
 */
KIP.Objects.ProjectWindow.prototype.AddItem = function (s, e, lbl, segments, addl) {
	"use strict";
	var idx, item, sIdx, segment, row, y, x, div, start, end, sDt, segHeight, segEnd, ctx, that, sIdx;
	that = this;

	// Convert to dates if needed
	if (!s.getYear) {
		s = new Date(s);
	}
	if (!e.getYear) {
		e = new Date(e);
	}

	// Grab the relative dates from the real dates
	start = this.ConvertToProjectPoint(s);
	end = this.ConvertToProjectPoint(e);

	idx = this.items.length;
	row = this.GetRow(start, end);

	// Create the appropriate item object
	item = this.items[idx] = {
		grp: this.CreateGroup("item" + idx, this.itemGrp),
		lbl: lbl,
		row: row,
		start: s,
		end: e,
		x: start * this.unitWidth,
		y: (row * this.rowHeight * this.rowSpace),
		width: (end - start) * this.unitWidth,
		id: idx,
		eventGrp: this.CreateGroup(idx + "|events", this.eventGrp),
		addl: addl,
		addlInfoExpanded : this.CreateExpandedInfo(addl)
	};

	// Loop through the segments & draw
	for (sIdx = 0; sIdx < segments.length; sIdx += 1) {
		this.CreateSegments(segments[sIdx], item, start, end, row, sIdx);
	}
	// Create a context menu 
	item.ctx = this.AddContextMenu(item);
	
	// Create some text that should apply to

	// Try to overlay text above the item
	this.fillProperty.color = "#000";
	this.fillProperty.opacity = 0.8;
	this.fontProperty.size = (2 * this.rowHeight / 3);
	item.text = this.AddText(item.grp, lbl + "   " + KIP.Functions.ShortDate(s) + " - " + KIP.Functions.ShortDate(e), this.unitWidth / 2, -1, "", {x: 0, y: 1}, item.grp)

	this.fillProperty.opacity = 1;
	
	if (!this.showTitles) {
		item.text.parentNode.removeChild(item.text);
	}
	
	// Add to our row tracker as appropriate
	if (!this.rows[row]) {
		this.rows[row] = [];
	}
	this.rows[row].push(item);
	return item;
};

/**
 * Creates a context menu for the item
 * 
 * @param {Object} item - The item to add the menu to
 * 
 * @returns {ContextMenu} The menu to display for this element
 */	
KIP.Objects.ProjectWindow.prototype.AddContextMenu = function (item) {
	"use strict";
	var ctx, that;
	that = this;

	// Create a context menu for this element
	ctx = new KIP.Objects.ContextMenu(item.grp);

	// Create the option to expand or collapse the task
	ctx.AddOption("Expand/Collapse", function () {
		that.ExpandItem(item);
	});

	ctx.AddOption("Remove", function () {
		that.RemoveItem(item);
	});
	
	return ctx;
};

/**
 * Grabs the row at which an item appears
 * @param {Object} item - The item to grab the row of
 * @returns {number} The row at which the item appears
 */
KIP.Objects.ProjectWindow.prototype.GetRowOfItem = function (item) {
	"use strict";
	var rIdx, rIt;

	// First try just to grab the item's row
	if (item && item.row) {
		return item.row;
	}

	// Loop backwards as it will usually be the last item added
	for (rIdx = (this.rows.length - 1); rIdx >= 0; rIdx += 1) {
		for (rIt = 0; rIt < this.rows[rIdx].length; rIt += 1) {
			if (this.rows[rIdx][rIt] === item) {
				return rIdx;
			}
		}
	}
};

/**
 * Creates the top/bottom segments of an item
 * @param {Array} arr - The segments to create
 * @param {Object} item - The item to add this to
 */
KIP.Objects.ProjectWindow.prototype.CreateSegments = function (arr, item, start, end, row, segRow) {
	"use strict";
	var idx, x, lastX, segEnd, sDt, first;

	lastX = start;
	first = true;

	// Loop through each of the segments
	for (idx = 0; idx < arr.length; idx += 1) {
		if (!arr[idx]) continue;

		sDt = arr[idx].end;

		if (!sDt.getYear) {
			sDt = new Date(sDt);
		}
		segEnd = this.ConvertToProjectPoint(sDt);
		x = lastX;

		if (!first) {
			x += 0.5;
		} else {
			first = false;
		}

		// Try to draw the segment
		if (segEnd >= lastX) {
			this.CreateSegment(item, {x: x, y: row}, segEnd, arr[idx], idx, segRow, item);

		// Handle the error case of something not actually being a forward rectangle
		} else {
			console.log("\nError in segment creation\nStart: " + x + " End: " + segEnd);
		}

		lastX = segEnd;
	}

	if (this.disableFill) return;

	// If we haven't hit the end, create a last segment
	if (lastX !== end) {
		if (first) {
			x = start;
		} else {
			x = lastX + 0.5;
		}

		this.CreateSegment(item, {x: x, y: row}, end, {}, -1, segRow, item);
	}
};

/**
 * Creates a segment for a piece of the project plan.
 *
 * @param {Object} item - The item this is being created for
 * @param {Object} start - The start x & y value
 * @param {number} end - At what point the segment ends
 * @param {Object} data - Any additional available data about the segment
 * @param {number} idx - What index of segment we are creating
 * @param {bool} isBottom - True if we are drawing the bottom set of segments
 *
 * @returns {SVGDrawable} The created segment
 */
KIP.Objects.ProjectWindow.prototype.CreateSegment = function (item, start, end, data, idx,  rowNum, addl) {
	"use strict";
	var segment, div, y, height, x, width, i, txt;
	
	// Adjust the top value as appropriate
	y = start.y * this.rowHeight * this.rowSpace;
	height = this.rowHeight * (this.barPercentages[rowNum]);

	if (rowNum > 0) {
		for (i = (rowNum - 1); i >= 0; i -= 1) {
			y += (this.rowHeight * this.barPercentages[i]) + (this.barGap * this.rowHeight);
		}
		y += (this.barGap * this.rowHeight);
	}

	// Set the x & width values for readability
	x = start.x * this.unitWidth;
	width = ((end - start.x) * this.unitWidth) + (0.5 * this.unitWidth);
	if ((width < 0) || (isNaN(width))) {
		console.log("Err: improper width for segment");
		return;
	}

	// Set the appropriate color & fill properties
	this.SetSegmentStyle(data, idx);

	// Create the segment and label
	segment = this.AddRectangle(x, y, width, height, "", item.grp);
	if (data.lbl) {
		txt = data.lbl;
		
		if (data.type) {
			txt += "<br>[" + data.type + " on " + data.end + "]";
		}
		
		if (!this.showTitles) {
			txt += "<br><br>" + addl.lbl + " (" + KIP.Functions.ShortDate(addl.start) + " - " + KIP.Functions.ShortDate(addl.end) + ")";
		}
		
		div = this.AddTextBubble(txt, segment, item, "", "", "", (y + (6 * height)) - item.y);
	}
	
	return segment;
};

/**
 * Sets the style for the provided segment. Can be overriden by individual implementations
 * @param {SVGElement} segment - Data about the segment to set the appropriate color 
 * @param {number} idx - The index of the segment
 */
KIP.Objects.ProjectWindow.prototype.SetSegmentStyle = function (segment, idx) {
	"use strict";
	if (!this.segmentColors[idx]) {
		this.segmentColors[idx] = KIP.Functions.GenerateColor(idx, KIP.Constants.HSLPieceEnum.Hue);
	}
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.segmentColors[idx];
};

/**
 * Adds data about an event without actually drawing it
 * 
 * @param {Object} item     - The item object to add event data to
 * @param {Date} pos      - The date at which this event should appear. Accepts a date string or Date object
 * @param {String} lbl      - What label should appear for the event on hover
 * @param {Object} addlInfo - Any additional information needed about the event
 * 
 * @returns {Object} The data about the created event
 */
KIP.Objects.ProjectWindow.prototype.AddEventData = function (item, pos, lbl, addlInfo) {
	"use strict";
	var ev, dt, pt, row, x ,y, i;

	if (!item) return;

	if (!pos.getYear) {
		dt = new Date(pos);
	}
	pt = this.ConvertToProjectPoint(dt, "", true);

	x = pt * this.unitWidth;

	row = this.GetRowOfItem(item);
	
	// Get the appropriate height
	y = (row * this.rowHeight) + ((row - 1) * this.rowSpace);
	for (i = (this.eventRow - 1); i >= 0; i -= 1) {
		y += ((2 * this.barGap * this.rowHeight) + (this.rowHeight * this.barPercentages[i]));
	}

	ev = {
		lbl: lbl,
		date: pos,
		prjPt: pt,
		row: row,
		x: x,
		y: y,
		addl: addlInfo
	};

	// Add to our array
	if (!item.events) {
		item.events = [];
	}
	item.events.push(ev);

	// return the created object
	return ev;
};

/**
 * Adds an event & draws it
 * 
 * @param {Object} item - The item object to add event data to
 * @param {Object} [ev] - If available, the data that was already created for this event. Created if not passed in
 * @param {Date} [pos] - The date at which this event should appear. If ev is passed in, this is ignored
 * @param {String} [lbl] - The label that should appear for this event. If ev is passed in, this is ignored
 * @param {Object} [addlInfo] - Any additional info available for the event
 * 
 * @returns {SVGElement} The event that was created
 */
KIP.Objects.ProjectWindow.prototype.AddEvent = function (item, ev, pos, lbl, addlInfo, large) {
	"use strict";
	var date, row, dx, dy, txt, event, height;

	// Quit if we don't have an item
	if (!item) return;

	// Grab the appropriate data
	if (!ev) {
		ev =this.AddEventData(item, pos, lbl, addlInfo);
	}

	// Grab the offset valies we should use
	dx = this.unitWidth / 8;
	dy = this.rowHeight / (2 + this.barPercentages.length);

	// Set attributes for the event
	this.fillProperty.type = "solid";
	if (ev.addl) {
		if (ev.addl.idx || ev.addl.idx === 0) {
			this.fillProperty.color = this.segmentColors[ev.addl.idx];
		} else if (ev.addl.color) {
			this.fillProperty.color = ev.addl.color;
		}
	}  else {
		this.fillProperty.color = "#FFF";
	}

	// Set the appropriate line properties
	
	this.fillProperty.opacity = 0.3;

	height = this.rowHeight * this.barPercentages[this.eventRow];

	
	// Create a marker for the event
	if (large) {
		this.lineProperty.type = "None";
		this.lineProperty.width = 0;
		this.lineProperty.color = "rgba(0,0,0,0)";
		
		event = this.AddPath([
			{x: ev.x - dx, y: ev.y - dy},
			{x: ev.x - dx, y: ev.y},
			{x: ev.x, y: ev.y + (0.5 * dy)},
			{x: ev.x + dx, y: ev.y},
			{x: ev.x + dx, y: ev.y - dy}
		], {id: "ev." + this.eventCnt}, item.eventGrp);
	} else {
		this.lineProperty.type = "solid";
		this.lineProperty.color = "rgba(0,0,0,0)";
		this.lineProperty.width = (this.viewW / 250);
		event = this.AddRectangle(ev.x, ev.y, this.viewW / 1000, height, {id: "ev." + this.eventCnt}, item.eventGrp);
	}

	txt = this.AddTextBubble(ev.lbl, event, item, "", "", 0.3);
	
	this.lineProperty.type = "None";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";
	this.fillProperty.opacity = 1;
	this.eventCnt += 1;
	return event;
};

/**
 * Removes all events linked to an event from the canvas (but not the internal collection)
 * Used to only draw events on zoom in
 * @param {Object} item - The item to remove events from
 */
KIP.Objects.ProjectWindow.prototype.RemoveEvents = function (item) {
	"use strict";
	item.eventGrp.innerHTML = "";
};

/**
 * Adds all events in an item's internal array to the canvas.
 * Used to only draw events on zoom in
 * @param {Object} item - The item to add events to.
 */
KIP.Objects.ProjectWindow.prototype.AddEvents = function (item, large) {
	"use strict";
	var ev, event;
	
	if (!item.events) return;
	
	for (ev = 0; ev < item.events.length; ev += 1) {
		this.AddEvent(item, item.events[ev], "", "", "", large);
	}
};

/**
 * Expands an item to fill the screen. 
 * Allows the view of more details about the event
 * @param {Object} item - The item to expand
 */
KIP.Objects.ProjectWindow.prototype.ExpandItem = function (item) {
	"use strict";
	var scaleCoord, posCoord, w, h;

	// Handle collapsing
	if (item.expanded) {
		// Remove from the overlay
		this.overlayGrp.removeChild(item.grp);
		this.overlayGrp.removeChild(this.overlay);
		this.overlayGrp.removeChild(item.eventGrp);
		this.parent.removeChild(item.addlInfoExpanded);

		this.itemGrp.appendChild(item.grp);
		this.eventGrp.appendChild(item.eventGrp);
		item.expanded = false;
		this.expanded = null;
		this.div.style.cursor = "-webkit-grab";

		item.grp.removeAttribute("transform");
		item.eventGrp.removeAttribute("transform");

		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item);
		}
		
		item.text.style.fill = "#000";
		item.text.removeAttribute("transform");

	// Handle expanding
	} else {
		// Create the overlay
		this.fillProperty.opacity = 0.8;
		this.fillProperty.color = "#000";
		this.fillProperty.type="solid";
		this.overlay = this.AddRectangle(this.viewX, this.viewY, this.viewW, this.viewH, "", this.overlayGrp);

		this.itemGrp.removeChild(item.grp);
		this.eventGrp.removeChild(item.eventGrp);
		this.overlayGrp.appendChild(item.grp);
		this.overlayGrp.appendChild(item.eventGrp);
		this.parent.appendChild(item.addlInfoExpanded);
		item.expanded = true;
		this.expanded = item;
		this.div.style.cursor = "default";

		// Calculate the appropriate coordinates
		w = document.documentElement.clientWidth || window.innerWidth;
		h = document.documentElement.clientHeight || window.innerHeight;
		scaleCoord = this.CalculateSVGCoordinates(w - 20, (2 * h / 3));
		posCoord = this.CalculateSVGCoordinates(20, (window.innerHeight) / 3);
		scaleCoord.x -= posCoord.x;
		scaleCoord.y -= posCoord.y;

		// Actually do the resizing
		this.ResizeAndRepositionItem(item, {
			w: scaleCoord.x,
			h: scaleCoord.y,
			x: posCoord.x,
			y: posCoord.y
		});
		
		item.text.style.fill = "rgba(0,0,0,0)";
		item.text.setAttribute("transform", "translate(0," + (-0.25 * this.MeasureElem(item.text).height) + ")");
		if (!this.alwaysShowEvents) {
			this.RemoveEvents(item);
			this.AddEvents(item, true);
		}
	}
};

/**
 * Gets the row at which an item should appear, before the item is created
 * 
 * @param {Date} start - The start date of the event we are getting the row for
 * @param {Date} end - The end date of the event we are getting the row for
 * 
 * @returns {number} The row number for this item
 */
KIP.Objects.ProjectWindow.prototype.GetRow = function (start, end) {
	"use strict";

	// TODO eventually: allow multiple elements per row
	return this.rows.length;
};

/**
 * OBSOLETE Creates a text bubble as an SVG
 * @param {number} x      The x coordinate the bubble should appear at
 * @param {number} y      The y coordinate the bubble should appear at
 * @param {String} lbl    The label that should appear in the bubble
 * @param {SVGGroup} layer - The layer at which this bubble should be added
 * @param {Object} origin - The origin of the text that will be displayed
 * @returns {SCGElement} The bubble that is created
 */
KIP.Objects.ProjectWindow.prototype.AddSVGTextBubble = function (x, y, lbl, layer, origin) {
	"use strict";
	var rect, text, attr, dim, grp;

	 grp = this.CreateGroup(lbl + "bubble", layer);

	if (lbl === "") {
		lbl = "??";
	}

	// Reset other properties
	this.lineProperty.type = "none";
	this.lineProperty.width = 0;
	this.lineProperty.color = "rgba(0,0,0,0)";

	// Set the color attributes
	this.fillProperty.type = "solid";
	this.fillProperty.color = this.bubbleColor;

	// Set the rectangle attributes
	attr = {
		rx: (this.rowHeight / 3),
		ry: (this.rowHeight / 3)
	};
	rect = this.AddRectangle(x, y, 0, 0, attr, grp);

	if (!origin)  {
		origin = {};
		origin.x = 0;
		origin.y = 0;
	}

	// Add the text
	this.fillProperty.color = this.textColor;
	this.fontProperty.family = "Segoe UI Semilight, Calibri, Arial";
	this.fontProperty.size = (this.rowHeight / 3) + "pt";
	text = this.AddText("", lbl, x, y, "", origin, grp);

	// Resize the rectangle to the size of the text
	dim = this.MeasureElem(text);
	rect.setAttribute("width", dim.width * 1.75);
	rect.setAttribute("height", dim.height * 1.65);
	rect.setAttribute("x", x);
	text.setAttribute("x", x + (dim.width * 0.37));
	rect.setAttribute("y", dim.y - (dim.height * 82.5));

	return grp;
};

/**
 * Adds a label hover bubble for an svg element. Stays in the same place for the DLG
 * 
 * @param {String} lbl - The label that should appear in the bubble
 * @param {SVGElement} elem - The element to add the bubble to
 * @param {Object} item - The item object that this bubble is generally being applied to
 * @param {number} [anchor_x] - The x-position at which a bubble should always appear
 * @param {number} [anchor_y] - The y-position at which a bubble should always appear
 * 
 * @returns {HTMLElement} The text bubble that was created
 */
KIP.Objects.ProjectWindow.prototype.AddTextBubble = function (lbl, elem, item, anchor_x, anchor_y, origOpacity) {
	"use strict";
	var div, that;
	
	if (!elem) return;

	// check if we've attched our element
	if (!this.textDiv.parentNode) {
		this.parent.appendChild(this.textDiv);
	}

	div = KIP.Functions.CreateSimpleElement("txt." + lbl, "textBubble", lbl);
	div.style.position = "absolute";
	div.style.backgroundColor = this.bubbleColor;
	div.style.color = this.textColor;
	div.style.fontFamily = "Segoe UI Light";
	div.style.padding = "5px";
	div.style.borderRadius = "5px";
	div.style.fontSize = "12px";
	div.style.boxShadow = "1px 1px 8px 2px rgba(0,0,0,.1)";

	this.textDiv.appendChild(div);
	that = this;


	// Mouse in listener
	elem.addEventListener("mouseover", function (ev) {
		var x, y, box;
		
		// Quit if we've already revealed the bubble
		if (!KIP.Functions.HasCSSClass(div, "hidden")) return;
		
		// Hide whatever bubble was showing last if it's not hidden
		if (that.lastBubble) {
			KIP.Functions.AddCSSClass(that.lastBubble, "hidden");
		}

		box = elem.getBoundingClientRect();

		x = ev.x; //Math.round(box.left < 0 ? 0 : box.left);
		y = Math.round(box.top + box.height);
		
		// Set the appropriate coordinates
		KIP.Functions.RemoveCSSClass(div, "hidden");
		
		// Make sure whatever coordinates we found are still on the screen
		box = div.getBoundingClientRect();
		if (x < 0) {
			x = 0;
		} else if ((x + box.width) > window.innerWidth) {
			x = (window.innerWidth - box.width);
		}
		
		if (y < 0) {
			y = 0;
		} else if ((y + box.height) > window.innerHeight) {
			y = (window.innerHeight - box.height);
		}
		
		div.style.left = x + "px";
		div.style.top = y + "px";
		
		that.lastBubble = div;
		
		elem.style.opacity=1;
	});

	// Mouse out listener
	elem.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		//if (rel === div) return;

		KIP.Functions.AddCSSClass(div, "hidden");
		elem.style.opacity = origOpacity;
	});

	elem.addEventListener("mousemove", function (ev) {
		if (KIP.Functions.HasCSSClass(div, "hidden")) return;
		div.style.left = ev.x + "px";
	});
	
	// Mouse in listener for the bubble
	/*div.addEventListener("mouseover", function (ev) {
		ev.stopPropagation();
		return false;

	});

	div.addEventListener("mouseout", function (ev) {
		var rel = ev.toElement || ev.relatedTarget;
		if (rel === elem) return;

		KIP.Functions.AddCSSClass(div, "hidden");
	});*/

	KIP.Functions.AddCSSClass(div, "hidden");

	return div;
};

/**
 * Creates the lines indicating dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuidelines = function () {
	"use strict";
	var num, lIdx, ln, func, relToday, x, dow, today, revDt, w, mult, coordA, coordB, noShow, shortDt, txt, txtColor, box;

	// Don't draw lines if they wouldn't show
	coordA = this.CalculateScreenCoordinates(this.viewX, this.viewY);
	coordB = this.CalculateScreenCoordinates(this.viewX + (this.unitWidth / 15), this.viewY);
	if ((coordB.x - coordA.x) === 0) {
		noShow = true;
	}

	// Even if they might be shown, don't show more than 200 lines
	if (this.viewW > (200 * this.unitWidth)) {
		noShow = true;
	}

	// Remove all old guildelines
	for (lIdx = this.lines.length - 1; lIdx >= 0; lIdx -= 1) {
		if (this.lines[lIdx] && this.lines[lIdx].parentNode) {
			this.lineGrp.removeChild(this.lines[lIdx]);
		}
	}

	this.lines = [];
	num = this.viewW / this.unitWidth;

	today = new Date();
	dow = today.getDay();
	relToday = this.ConvertToProjectPoint(today);

	// Set the fill properies for these lines
	this.fillProperty.type = "solid";
	this.lineProperty.type = "none";
	this.lineProperty.color = "rgba(0,0,0,0)";
	this.lineProperty.width = 0;

	// Loop throuh all visible lines at this point
	for (lIdx  = 0; lIdx < num; lIdx += 1) {
		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + (lIdx * this.unitWidth);
		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		shortDt = KIP.Functions.ShortDate(revDt);
		dow = revDt.getDay();
		txt = "";

		if (this.importantDates[shortDt]) {
			w = this.unitWidth;
			this.fillProperty.color = this.importantDates[shortDt].color;
			txt = this.importantDates[shortDt].lbl;
			txtColor = this.importantDates[shortDt].textColor;

		} else if (KIP.Functions.DateDiff(revDt, today) === 0) {
			this.fillProperty.color = "#8AE";
			w = this.unitWidth;

		} else if (this.showWeekends && (dow === 0 || dow === 6)) {
			this.fillProperty.color = "rgba(0,0,0,.15)";
			w = this.unitWidth;

		} else if (!this.showWeekends && dow === 1) {
			if (noShow) continue;
			this.fillProperty.color =  "rgba(100,100,100,.3)";
			w = this.unitWidth / 20;

		} else {
			if (noShow) continue;
			this.fillProperty.color = "rgba(220,220,220,.4)";
			w = this.unitWidth / 20;
		}

		ln = this.AddRectangle(x, this.viewY, w, this.viewH, "", this.lineGrp);
		this.lines.push(ln);

		// Draw the text for important dates
		if (txt) {
			this.fillProperty.color = txtColor;
			this.fontProperty.size = (2 * this.unitWidth / 3);
			txt = this.AddText(ln, txt, (0.5 * this.unitWidth),  (3 * this.rowHeight), "", {x: 0.5, y: 0.5}, this.lineGrp);
			box = this.MeasureElem(txt);
			txt.setAttribute("y", +txt.getAttribute("y") + (box.width / 2) + this.rowHeight);

			this.RotateElement(txt, -90);
			this.lines.push(txt);
		}
		
	}

	this.CreateGuideHeaders(noShow);
};

/**
 * Creates the headers for the dates on the Gantt chart
 */
KIP.Objects.ProjectWindow.prototype.CreateGuideHeaders = function (noNumbers) {
	"use strict";
	var num, header, txt, idx, revDt, x, months, mIdx, rect, month, w, maxH, h;
	
	// remove all of the old guide headers
	for (idx = this.headers.length - 1; idx >= 0; idx -= 1) {
		if (this.headers[idx] && this.headers[idx].parentNode) {
			this.headerGrp.removeChild(this.headers[idx]);
		}
	}

	this.headers = [];
	months = {};

	// Calculate the max height in SVG units
	maxH = this.CalculateSVGHeight(this.maxHeaderHeight);
	h = maxH;
	
	this.fillProperty.type = "solid";
	this.fontProperty.size = ( h / 3);
	this.fontProperty.family = "Segoe UI Light,Calibri";
	this.fillProperty.opacity = 1;

	num = this.viewW / this.unitWidth;
	for (idx = 0; idx < num; idx += 1) {

		x = this.viewX + (this.unitWidth - (this.viewX % this.unitWidth)) + ((idx - 1) * this.unitWidth);

		revDt = this.RevertFromProjectPoint(x / this.unitWidth);
		mIdx = revDt.getMonth() + "." + revDt.getYear();

		// Initialize the months index if appropriate
		if (!months[mIdx]) {
			months[mIdx] = {
				name: KIP.Functions.GetMonthName(revDt),
				start: x,
				month: revDt.getMonth(),
				year: revDt.getFullYear()
			}
		} else {
			months[mIdx].end = x;
		}

		// Don't show numbers if we shouldn't be
		if (noNumbers) continue;

		// Create the day headers
		this.fillProperty.color = "#FFF";
		this.headers.push(this.AddRectangle(x, this.viewY + h, this.unitWidth, (h / 2), "", this.headerGrp));
		this.fillProperty.color="#68C";
		this.headers.push(this.AddText("", revDt.getDate(), x + (this.unitWidth / 4), this.viewY + h, "", {x: 0, y: 0}, this.headerGrp));

	}
	

	// Create the monthly headers
	for (mIdx in months) {
		if (months.hasOwnProperty(mIdx)) {

			month = months[mIdx];
			w = month.end - month.start + this.unitWidth;
			if ((w < 0) || (isNaN(w))) continue;

			// create a rectangle
			this.fillProperty.color = this.monthColors[month.month];
			this.headers.push(this.AddRectangle(month.start, this.viewY, w, h, "", this.headerGrp));

			// create the text
			this.fillProperty.color = "#FFF";

			this.fontProperty.size = ( h / 2);
			this.headers.push(this.AddText("", month.name.toUpperCase() + " " + month.year, month.start + (2 * this.unitWidth), this.viewY, "", {x: 0, y: 0}, this.headerGrp));
		}
	}
};

/**
 * Handle updating our guidelines on zoom
 * @param {number} amt - The amount that has been zoomed
 */
KIP.Objects.ProjectWindow.prototype.Zoom = function (amt) {
	"use strict";
	if (this.expanded) return;
	if (this.lastBubble) {
		KIP.Functions.AddCSSClass(this.lastBubble, "hidden");
	}
	KIP.Objects.SVGDrawable.prototype.Zoom.call(this, amt);
	this.CreateGuidelines();
	this.RefreshUI();
};

/**
 * Handle updating our guidelines on pan
 * @param {number} amtX - The x amount to move the viewbox
 * @param {number} amtY - The y amount to move the viewbox
 */
KIP.Objects.ProjectWindow.prototype.Pan = function (amtX, amtY) {
	"use strict";
	if (this.expanded) return;
	if (this.lastBubble) {
		KIP.Functions.AddCSSClass(this.lastBubble, "hidden");
	}
	KIP.Objects.SVGDrawable.prototype.Pan.call(this, amtX, amtY);
	this.CreateGuidelines();
	this.RefreshUI();
};

/** 
 * Allows the user to sort the items in the Gantt chart according to a particular sort function
 * @param {function} sortFunc - The function to sort the list by
 */
KIP.Objects.ProjectWindow.prototype.Sort = function (sortFunc, titleFunc) {
	"use strict";
	var i, y, h, lastH, headCb, that = this;

	// Clear any previous headers
	this.itemHeaders.map (function (elem) {
		if (!elem) return;
		if (!elem.div) return;
		if (elem.div.parentNode) {
			elem.div.parentNode.removeChild(elem.div);
		}
	});
	this.itemHeaders = [];
	
	// We need to rearrange the rows to the appropriate positions
	this.items.sort(sortFunc);

	// Also create headers for each of the sections
	this.items.map(function (elem, key, arr) {
		h = titleFunc(elem);
		if (lastH === h) return;
		that.AddItemHeader(key, h);
		lastH = h;
	});
	
	// Update the UI
	this.RefreshUI();
};

/** 
 * Clears all data about this project.
 */
KIP.Objects.ProjectWindow.prototype.Clear = function () {
	"use strict";
	var rIdx, idx, item;

	// Clear out the visible elements
	this.ClearUI();

	// Clear out our internal collections
	this.rows = [];
	this.items = [];
	this.eventCnt = 0;
};

/** 
 * Clears the UI of the project, but not its internal data
 */
KIP.Objects.ProjectWindow.prototype.ClearUI = function () {
	"use strict";
	this.itemGrp.innerHTML = "";
	this.eventGrp.innerHTML = "";
	this.textDiv.innerHTML = "";
};

KIP.Objects.ProjectWindow.prototype.RemoveItem = function (item) {
	"use strict";
	var idx, tItem;
	idx = item.id;
	tItem = this.items[idx];
	
	// Grab the appropriate item index
	if (tItem !== item) {
		for (idx = 0; idx < this.items.length; idx += 1) {
			tItem = this.items[idx];
			if (tItem === item) break;
		}
	}
	
	// Remove the value of the row
	this.rows.splice(item.row, 1);
	
	// Remove the item
	this.items.splice(idx, 1);
	
	// Clear the HTML
	item.grp.innerHTML = "";
	if (item.grp.parentNode) {
		item.grp.parentNode.removeChild(item.grp);
	}
	
	// Clean up event HTML
	item.eventGrp.innerHTML = "";
	if (item.eventGrp.parentNode) {
		item.eventGrp.parentNode.removeChild(item.eventGrp);
	}
	if (item.events) this.eventCnt -= item.events.length;
	
	// Allow a callback on remove
	if (item.addl.onremove) {
		item.addl.onremove();
	}
	
	// Refresh so everything slides into place
	this.RefreshUI();
};

/**
 * Temporarily resizes an item via a transform matrix
 * 
 * @param {Object} item - The item to resize & reposition
 * @param {Object} newDim - The new dimensions to use for the item
 * @param {number} newDim.x - The new x position
 * @param {number} newDim.y - The new y position
 * @param {number} newDim.w - The new width of the item
 * @param {number} newDim.h - The new height of the item
 * @param {number} [newDim.scaleW] - The percentage to scale by. Used in place of w if provided
 * @param {number} [newDim.scaleH] - The percentage to scale by. Used in place of h if provided
 */
KIP.Objects.ProjectWindow.prototype.ResizeAndRepositionItem = function (item, newDim) {
	"use strict";
	var box, dx, dy, dw, dh, matrix;

	// Remove any previous transforms we had applied
	item.grp.removeAttribute("transform");

	// Measure the elem as it originally existed
	box = this.MeasureElem(item.grp);

	// Quit if width or height are zero
	if (box.width === 0) return;
	if (box.height === 0) return;

	// Calculate the deltas of the width & height
	dw = newDim.scaleW || (newDim.w / box.width);
	dh = newDim.scaleH || (newDim.h / box.height);

	// Calculate the deltas of the new x & y
	dx = newDim.x - box.x;
	dy = newDim.y - box.y;

	// Calculate what offset we'll need for the scaling
	dx += (-1 * (dw - 1) * box.x);
	dy += (-1 * (dh - 1) * box.y);

	// Create the matrix element to use
	matrix = "matrix(";
	matrix += dw + ", ";
	matrix += "0, 0, ";
	matrix += dh + ", ";
	matrix += dx + ", ";
	matrix += dy;
	matrix += ")";

	item.grp.setAttribute("transform", matrix);
	item.eventGrp.setAttribute("transform", matrix);
};

/**
 * Disables showing the titles inline
 * @param {boolean} [undo] - If true, enables the titles
 */
KIP.Objects.ProjectWindow.prototype.DisableTitles = function (undo) {
	"use strict";

	if (undo) {
		this.rowSpace = 2.5;
		this.showTitles = true;
	} else {
		this.rowSpace = 1.5;
		this.showTitles = false;
	}

	this.RefreshUI();
};

/** 
 * Changes the y position of an item
 * @param {Object} item - The item that is being adjusted
 * @param {number} newY - The new Y value that this item should appear at
 * @param {number} row  - The new row value of the item
 */
KIP.Objects.ProjectWindow.prototype.AdjustY = function (item, newY, row) {
	"use strict";
	var grp, c, child, origY, dy, tmp, that;

	that = this;
	
	this.rows[row] = [this.items[row]];
	this.items[row].row = row;
	this.items[row].y = newY;

	grp = item.grp;

	// Loop through all of the segments and adjust their position
	for (c = 0; c < grp.children.length; c += 1) {
		child = grp.children[c];
		tmp = child.getAttribute("y");

		// Make sure we account for both the top & bottom row
		if (!origY && (origY !== 0)) {
			origY = tmp;
		}

		if ((tmp !== origY) && (child !== item.text)) {
			dy = (+tmp) - (+origY);
		} else if (child === item.text) {
			dy = -1;
		} else {
			dy = 0;
		}

		child.setAttribute("y", newY + dy);
	}

	// Remove & redraws the associated events
	if (item.events) {
		item.events.map(function (elem) {
			var i;
			elem.row = row;
			elem.y = newY;
			for (i = (that.eventRow - 1); i >= 0; i -= 1) {
				elem.y += ((2 * that.barGap * that.rowHeight) + (that.rowHeight * that.barPercentages[i]));
			}
		});
		this.RemoveEvents(item);
		this.AddEvents(item);
	}
};

/**
 * Refreshes the display so that new Y values are accommodated
 */
KIP.Objects.ProjectWindow.prototype.RefreshUI = function () {
	"use strict";
	var i, y, h_y, box, top, itemLeft, itemRight, headerX;

	// Now loop through the events and assign new rows
	this.rows = [];
	h_y = 0;
	for (i = 0; i < this.items.length; i += 1) {

		box = undefined;
		
		// Show or hide the title as appropriate
		if (!this.showTitles) {
			if (this.items[i].text && this.items[i].text.parentNode) {
				this.items[i].text.parentNode.removeChild(this.items[i].text);
			}
		} else {
			if (this.items[i].text && !this.items[i].text.parentNode) {
				this.items[i].grp.appendChild(this.items[i].text);
				
			}
			
			// Adjust to be on screen
			box = this.MeasureElem(this.items[i].text);
			itemLeft = this.CalculateScreenCoordinates(this.items[i].x, 0).x;
			itemRight = this.CalculateScreenWidth(this.MeasureElem(this.items[i].grp).width) + itemLeft;
			if (itemLeft < 0) {
				headerX = this.CalculateSVGCoordinates(0, 0).x;
				
				if (itemRight > 0) {
					this.items[i].text.setAttribute("x", headerX);
				} else {
					this.items[i].text.setAttribute("x", itemRight);
				}
			} else {
				this.items[i].text.setAttribute("x", this.items[i].x);
			}
		}
		
		// Check if there is a header, and if so, draw it too
		if (this.itemHeaders[i]) {
			this.headerDiv.appendChild(this.itemHeaders[i].div);
			
			top = this.CalculateScreenCoordinates(0, h_y + this.rowSpace + (i * this.rowHeight * this.rowSpace) - (box ? box.height : 0)).y;
			top += this.div.getBoundingClientRect().top;
			this.itemHeaders[i].div.style.top = top + "px";
			box = this.itemHeaders[i].div.getBoundingClientRect();
			if (box.height > 0) {
				h_y += this.CalculateSVGHeight(box.height) + (1.5 * this.rowSpace) + (this.headerGap || 0);
			}
		}
	
		y = h_y + (i * this.rowHeight * this.rowSpace);
		this.AdjustY(this.items[i], y, i);

		
	}

	// Refresh all of the appropriate elements
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.AddItemHeader = function (idx, label) {
	"use strict";
	var h;
	
	// Add our header div if appropriate
	if (!this.headerDiv.parentNode) {
		this.parent.appendChild(this.headerDiv);
	}
	
	// Create a header to be added
	h = KIP.Functions.CreateSimpleElement("header" + idx, "header", label);
	
	// Save to our headers array
	this.itemHeaders[idx] = {
		div: h,
		lbl: label,
		key: idx
	};
	
};
/**
 * Adds an important date to our internal collection.
 */
KIP.Objects.ProjectWindow.prototype.AddImportantDate = function (startDate, lbl, color, textColor, endDate, category) {
	"use strict";
	var diff, dir, dt, dIdx, tmp, cb, that = this;
	
	cb = function (date, label, col, textCol, cat) {
		that.importantDates[KIP.Functions.ShortDate(date)] = {
			date: new Date(date),
			lbl: label,
			color: col || "#C30",
			textColor: textCol || "#FFF",
			category: category
		}
	};
	
	// Convert to a date if need be
	if (!startDate.getFullYear) {
		startDate = new Date(startDate);
	}
	
	// Convert the end date if we have it & get the difference between it & the start date
	diff = 0;
	dir = 1;
	
	if (endDate && !endDate.getFullYear) {
		endDate = new Date(endDate);
	}
	
	if (endDate) {
		diff = KIP.Functions.DateDiff(endDate, startDate);
		dir = (diff < 0) ? -1 : 1;
		diff = Math.abs(diff);
	}
	
	// Quit if the date isn't real
	if (!startDate || !startDate.getFullYear) return;
	tmp = new Date(startDate);
	for (dIdx = 0; dIdx <= diff; dIdx += dir) {
		dt = tmp;
		// Add to our important date array
		cb(dt, lbl ,color, textColor, category);
		
		// Increment the date
		dt = KIP.Functions.AddToDate(tmp, {days: 1});
	}

	// Redraw so the date is now incorporated
	this.CreateGuidelines();
	this.Draw();
};

KIP.Objects.ProjectWindow.prototype.CreateImportantDateForm = function (date, cb) {
	"use strict";

	var lblInput, bgLbl, bgColor, txtLbl, txtColor, startLbl, startDt, endLbl, endDt, accept, cancel, clear, cats, c, catOpt, that = this;

	if (!date) date = "";

	// Allow the user to name the date anything they want
	lblInput = KIP.Functions.CreateElement({
		type: "input",
		id: "dateLabel", 
		cls: "dateLabel",
		attr: [
			{key: "placeholder", val: "Label for important date"}
		]
	});

	// Field for allowing user to set the background color
	bgColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateBG",
		cls: "dateBG",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "rgb(0,0,0)"}
		]
	});
	bgLbl = KIP.Functions.CreateSimpleElement("bgColorLbl", "bgColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Background Color: "
		},
		bgColor
	]);

	// Allow the user to change the color of the text on top
	txtColor = KIP.Functions.CreateElement({
		type: "input",
		id: "dateTxtColor",
		cls: "dateTxtColor",
		attr: [
			{key: "type", val: "color"},
			{key: "value", val: "#FFFFFF"}
		]
	});
	txtLbl = KIP.Functions.CreateSimpleElement("txtColorLbl", "textColorLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Text Color: "
		},
		txtColor
	]);

	// Let the user set the appropriate date
	startDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	startLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "Start Date * : "
		},
		startDt
	]);
	
		// Let the user set the appropriate date
	endDt = KIP.Functions.CreateElement({
		type: "input",
		id: "dateDt",
		cls: "dateDt",
		attr: [
			{key: "type", val: "date"},
			{key: "value", val: "date"}
		]
	});
	endLbl = KIP.Functions.CreateSimpleElement("dtLbl", "dtLbl", "", "", [
		{
			type: "span",
			cls: "lbl",
			before_content: "End Date: "
		},
		endDt
	]);
	
	// Category selector
	cats = KIP.Functions.CreateElement({
		type: "select"
	});
	
	// Create the options for this cat selector as well
	for (c = 0; c < this.impDateCategories.length; c += 1) {
		catOpt = KIP.Functions.CreateElement({
			type: "Option",
			value: c,
			before_content: this.impDateCategories[c]
		});
		cats.appendChild(catOpt);
	}
	
	this.impDateCatSelector = cats;

	clear = function () {
		startDt.value = "";
		endDt.value = "";
		lblInput.value = "";
		cats.value = 0;
		bgColor.value = "#000000";
		txtColor.value = "#FFFFFF";
	};

	accept = KIP.Functions.CreateSimpleElement("impDateAccept", "impDateAccept", "Accept");
	accept.addEventListener("click", function () {
		var dStart, dEnd;
		dStart = startDt.value;
		dEnd = endDt.value;
		if (!dEnd) dEnd = dStart;
		if (dStart) {
			dStart = dStart.split("-");
			dEnd = dEnd.split("-");
			that.AddImportantDate(new Date(dStart[0], dStart[1] - 1, dStart[2]),
														lblInput.value,
														bgColor.value,
														txtColor.value,
														new Date(dEnd[0], dEnd[1] - 1, dEnd[2]),
														cats.value
													 );
		}
		clear();
		that.ShowImportantDateForm("", cb);
	});

	cancel = KIP.Functions.CreateSimpleElement("impDateCancel", "impDateCancel", "Cancel");
	cancel.addEventListener("click", function () {
		clear();
		that.ShowImportantDateForm("", cb);
	});

	this.dateForm = KIP.Functions.CreateSimpleElement("impDateForm", 
																										"impDateForm", 
																										"", 
																										"", 
																										[startLbl, 
																										 endLbl, 
																										 lblInput, 
																										 bgLbl, 
																										 txtLbl,
																										 cats,
																										 accept, 
																										 cancel]);

	return this.dateForm;

};

KIP.Objects.ProjectWindow.prototype.ShowImportantDateForm = function (parent, cb) {
	"use strict";
	if (!this.dateForm) {
		this.AddImportantDateCategory("Just Me");
		this.CreateImportantDateForm("", cb);
	}

	if (this.dateFormShowing) {
		this.dateForm.parentNode.removeChild(this.dateForm);
		this.dateFormShowing = false;
	} else {
		parent.appendChild(this.dateForm);
		this.dateFormShowing = true;
	}

	if (cb) cb();
};

KIP.Objects.ProjectWindow.prototype.AddImportantDateCategory = function (catName) {
	"use strict";
	var catOpt, idx;
	
	// Check that we din't have a category with that name
	for (idx = 0; idx < this.impDateCategories.length; idx += 1) {
		if (this.impDateCategories[idx] === catName) {
			return false;
		}
	}
	
	// Otherwise, add it to the list
	idx = this.impDateCategories.length;
	this.impDateCategories.push(catName);
	
	// If we have already drawn the form, we need to add new catgories
	if (!this.dateForm) {
		return idx;
	}
	catOpt = KIP.Functions.CreateElement({
		type: "Option",
		value: idx,
		before_content: catName
	});
	this.impDateCatSelector.appendChild(catOpt);
	
	// return the index this was added to
	return idx;
}

KIP.Objects.ProjectWindow.prototype.RemoveImportantDate = function (dt) {
	"use strict";
	delete this.importantDates[dt];
	this.CreateGuidelines();
	this.Draw();
}/* globals KIP */

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
	
};/**
 * Sends an AJAX request to a url of our choice as either a POST or GET
 * @param {string} type - Set to either "POST" or "GET" to indicate the type of response we want
 * @param {string} url - The URL to send the request to
 * @param {function} [success] - A function to run if the call succeeds
 * @param {function} [error] - A function to run if the request errors out
 * @param {string} params - An "&" delimited string of "key=value" pairs that can be sent as AJAX
 * @returns {AJAXRequest} - The request that was sent
 */
KIP.Functions.AJAXRequest = function (type, url, success, error, params){
  var req = false;

  // Try to get an HTML Request
  try {
    req = new XMLHttpRequest();
  } catch (e) {

    // If it failed, it could be because we're in IE, so try that
    try {
      req = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e){

      // If that failed too, then we'll try the other IE specific method
      try {
        req = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e) {

        // And if we still can't get anything, then we're out of options
        return false;
      }
    }
  }

  // If we couldn't grab a request, quit
  if (!req) return false;

  // If we don't have a success function, create a generic blank one
	if (typeof success !== 'function') {
		success = function () {};
	}

  // If we don't have an error function, create a generic blank one
  if (typeof error !== 'function') {
		error = function() {};
	}

  // When the request is ready to run, try running it.
  req.onreadystatechange = function(){
    if(req.readyState === 4){
        return req.status === 200 ? success(req.responseText) : error(req.responseText);
    }
  };

  // If it's a GET request...
  if (type === "GET"){

    // ... send our request.
    req.open("GET", url, true);
		
  // If it's a POST request...
  }else if (type === "POST"){

    // ... open the connection ...
    req.open("POST", url, true);

    // ... pull in the data for the POST ...
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    // ... and send the data.
    req.send(params);

  }

  // Return the total request
  return req;
};
// Objects that would be useful to have a short cut version of the name
if (!KDrawable) {
	KDrawable = KIP.Objects.Drawable;
}

if (!KEditable) {
	KEditable = KIP.Objects.Editable;
}

if (!KSelect) {
	KSelect = KIP.Objects.Select;
}

if (!KSVGDrawable) {
	KSVGDrawable = KIP.Objects.SVGDrawable;
}

if (!KCtxMenu) {
	KCtxMenu = KIP.Objects.ContextMenu;
}

if (!KHoverable) {
	KHoverable = KIP.Objects.Hoverable;
}

// Core functions that get used a lot & could benefit from a shorter name

if (!KSimpleElement) {
	KSimpleElement = KIP.Functions.CreateSimpleElement;
}

if (!KElement) {
	KElement = KIP.Functions.CreateElement;
}

if (!KRoundToPlace) {
	KRoundToPlace = KIP.Functions.RoundToPlace;
}

if (!K)// Piece
//----------------------------------------------------
/**
 * Gets a piece of a delimited string
 *
 * @param {string} str The string to grab a piece from
 * @param {string} delim The character (or characters) that are delimiting the string
 * @param {int} piece The piece number to get. Defaults to 1 if not passed in.
 *
 * @return {string} The specified piece of the string, "" if it doesn't exist
 */
KIP.Functions.Piece = function (str, delim, piece) {
  var i, start, end;

  start = -1;
  end = str.indexOf(delim);
  for (i = 0; i < (piece - 1); i += 1) {
    start = end;
    end = str.indexOf(delim, end + 1);

    if (start === -1) {
      return "";
    }
  }

  if (end === -1) {
    return str.substr(start + 1);
  }

  return str.substring(start + 1, end);
};

// TitleCase
//----------------------------------------------------
/**
 * Capitalizes the first letter of each word of a given string, and converts all else to lowercase
 *
 * @param {string} str   The string to convert to title case
 * @param {string} delim What separates the different words in this string
 *
 * @returns {string} The string, now in title case
 */
KIP.Functions.TitleCase = function (str, delim) {
	var words, w, out;
	delim = delim || " ";
	out = "";

	words = str.split(delim);

	for (w = 0; w < words.length; w += 1) {
		if (w !== 0) {
			out += delim;
		}
		out += KIP.Functions.CharAt(words[w], 0).toUpperCase();
		out += KIP.Functions.Rest(words[w], 1).toLowerCase();
	}

	return out;
};

// SentenceCase
//--------------------------------------------------
/**
 * Capitalizes the first letter of a given string, and converts the rest to lowercase
 *
 * @param {string} str   The string to capitalize
 *
 * @returns {string} The string, now in sentence case
 */
KIP.Functions.SentenceCase = function (str) {
	var out;
	out = KIP.Functions.CharAt(str, 0).toUpperCase();
	out += KIP.Functions.Rest(str, 1).toLowerCase();

	return out;
};

// CharAt
//--------------------------------------------------
/**
 * Slightly more memorable way to get a character at a given position in a string
 *
 * @param {string} str - The string to take the character out of
 * @param {int} idx - What index of the string to get the character of
 *
 * @return {string} The character at the specified position
 */
KIP.Functions.CharAt = function (str, idx) {
	return str.substr(idx, 1);
};

// Rest
//--------------------------------------------------
/**
 * Gets the substring of a string starting from a given index
 *
 * @param {string} str The string to get the substring of
 * @param {int} idx What index to start the substring at
 *
 * @return {string} The rest of the string after the provided index
 */
KIP.Functions.Rest = function (str, idx) {
	return str.substring(idx, str.length);
};

// Trim
//--------------------------------------------------
/**
 * Trims all white space off of the beginning and end of a string
 *
 * @param {string} str The string to trim
 *
 * @return {string} The trimmed string
 */
KIP.Functions.Trim = function (str) {
  var ret;
  ret = str.replace(/^\s*/g, "");
  ret = ret.replace(/\s*?$/g, "");
  return ret;
};/*globals KIP,document*/

/**
 * @file Declaration of the SVGDrawable object
 * @author Kip Price
 * @version 0.5
 * @since 1.2
 */

// SVGDrawable
//--------------------------------------------------------
/**
 * @class SVGDrawable
 * Creates an SVG image that can have various elements added to it
 * @param {String} id - The unique identifier to apply to this SVG image
 */
KIP.Objects.SVGDrawable = function (id, preventEvents) {
	"use strict";
	this.div = KIP.Functions.CreateSVG(id);
	this.elements = [];
	this.elementsByID = [];

	// Track how much of the SVG should be viewed at a time
	this.min_x = 1000000;
	this.min_y = 1000000;
	this.max_x = 0;
	this.max_y = 0;

	// Allow the viewport to be adjusted
	this.viewX = 0;
	this.viewY = 0;
	this.viewW = 0;
	this.viewH = 0;

	this.gutter = 1;
	this.cur_ID = 0;

	this.lineProperty = {};
	this.fillProperty = {};
	this.fontProperty = {};

	this.autoResize = true;
	this.zoomAmt = 0.08;

	if (preventEvents) return;
	this.div.style.cursor = "-webkit-grab";
	var that = this;

	// Handle the scroll wheel event for the SVG
	this.div.addEventListener("wheel", function (e) {
		var delta = e.deltaY;
		delta = (delta > 0) ? that.zoomAmt : -1 * that.zoomAmt;
		that.Zoom(delta);
	});

	// Add some panning controls
	this.div.addEventListener("mousedown", function (e) {
		that.isPanning = true;
		that.panX = e.clientX;
		that.panY = e.clientY;
		that.div.style.cursor = "-webkit-grabbing";
	});

	window.addEventListener("mousemove", function (e) {
		var dX, dY;
		if (!that.isPanning) return;

		// Make sure to cancel the event if we are beyond the windows bounds
		if ((e.x <= 0) || (e.x >= (window.innerWidth - 1))) {
			that.isPanning = false;
			that.div.style.cursor = "-webkit-grab";
			return;
		}

		if ((e.y<= 0) || (e.y >= (window.innerHeight - 1))) {
			that.isPanning = false;
			that.div.style.cursor = "-webkit-grab";
			return;
		}

		// Grab the delta of the mouse move
		dX = e.clientX - that.panX;
		dY = e.clientY - that.panY;
		that.div.style.cursor = "-webkit-grabbing";

		// Reset the pan variables
		that.panX = e.clientX;
		that.panY = e.clientY;

		dX = ((1 + (-1 * that.viewW * dX)) / that.w);
		dY = ((2 + (-1 * that.viewH * dY)) / that.h);

		// Actually move the svg
		that.Pan(dX, dY);
	});

	window.addEventListener("mouseup", function (e) {
		that.isPanning = false;
		that.div.style.cursor = "-webkit-grab";
	});
};

// We inherit from Drawables
KIP.Objects.SVGDrawable.prototype = Object.create(KIP.Objects.Drawable.prototype);

// SVGDrawable.CalculateView
//---------------------------------------------------------------
/**
 * Calculates what the view box should be to encompass all of the elements currently in the SVG drawing
 */
KIP.Objects.SVGDrawable.prototype.CalculateView = function () {
	"use strict";

	// Set the appropriate view variables
	this.viewX = this.min_x;
	this.viewY = this.min_y;
	this.viewW = (this.max_x - this.min_x);
	this.viewH = (this.max_y - this.min_y);

	return this.CreateView();
};

// SVGDrawable.CreateView
//---------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.CreateView = function () {
	"use strict";
	this.viewW = (this.viewW < 0) ? 1 : this.viewW;
	this.viewH = (this.viewH < 0) ? 1 : this.viewH;
	return this.viewX + " " + this.viewY + " " + this.viewW + " " + this.viewH;
}

// SVGDrawable.AddRectangle
//-----------------------------------------------------------------------------------
/**
 * Adds a rectangle to the current SVG drawing
 *
 * @param {Number} x - The x value of the upper left corner of the rectangle
 * @param {Number} y - The y value of the upper left corner of the rectangle
 * @param {Number} w - The width of the rectangle
 * @param {Number} h - The height of the rectangle
 * @param {Object} style - An array defining how to style this rectangle
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {String} [id] - An ID to associate with the rectangle
 * @param {String} [cls] - A CSS class to assign the rectangle
 * @param {SVGElement} [group] - The SVG group to add this to
 *
 * @returns {SVGElement} The rectangle that is created from these parameters
 */
KIP.Objects.SVGDrawable.prototype.AddRectangle = function (x, y, w, h, attr, grp) {
	"use strict";
	
	// Check that all of the values are real
	if (!x && x !== 0) return;
	if (!y && y !== 0) return;
	if ((w < 0) || (!w && w !== 0)) return;
	if ((h < 0) || (!h && h !== 0)) return;
	
	// Update the view
	if (this.autoResize) this.UpdateView(x, y, w, h);

	// Set the appropriate attributes
	if (!attr) attr = {};
	attr.x = x;
	attr.y = y;
	attr.height = h;
	attr.width = w;

	return this.AddChild("rect", attr, grp);
};

// SVGDrawable.UpdateView
//-----------------------------------------------------------------------
/**
 * Updates the min and max specs of the view.
 * Called whenever an element is added to the svg drawing
 *
 * @param {Number} x The x position of the new element
 * @param {Number} y The y position of the new element
 * @param {Number} w The width of the new element
 * @param {Number} h The height of the new element
 */
KIP.Objects.SVGDrawable.prototype.UpdateView = function (x, y, w, h) {

	// Update the min and max x if appropriate
	if (x < this.min_x) this.min_x = (x - this.gutter);
	if ((x + w) > this.max_x) this.max_x = (x + w + this.gutter);

	// Update the min and max y if appropriate
	if (y < this.min_y) this.min_y = (y - this.gutter);
	if ((y + h) > this.max_y) this.max_y = (y + h + this.gutter);

	this.view = this.CalculateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.AddPath
//--------------------------------------------------------------------------
// TODO: Add all elements that SVG support
KIP.Objects.SVGDrawable.prototype.AddPath = function (points, attr, grp) {
	"use strict";
	var pt, pIdx, elem;

	if (points.length === 0) return;

	if (!attr) attr = {};
	attr.d = "";

	elem = this.AddChild("path", attr, grp);

	// Loop through the points and assign the appropriate d attribute
	for (pIdx = 0; pIdx < points.length; pIdx += 1) {
		pt = points[pIdx];

		// The first point needs to be a "Move to" instead of a "line to"
		if (pIdx === 0) {
			this.MoveTo(pt.x, pt.y, elem);

		// If we have control points, it should be a curve
		} else if (pt.controls) {
			this.CurveTo(pt.controls[0], pt.controls[1], {x: pt.x, y: pt.y}, elem);

		// Also handle the perfect arc case
		} else if (pt.radius) {
			this.ArcTo(pt.radius, pt.xRotation, pt.largeArc, pt.sweepFlag, {x: pt.x, y: pt.y}, elem);

		// Otherwise, just draw a straight line
		} else {
			this.LineTo(pt.x, pt.y, elem);
		}

		// Update the view for each point
		if (this.autoResize) this.UpdateView(pt.x, pt.y, 0, 0);
	}

	if (!attr.noFinish) this.FinishPath(elem);

	return elem;
};

// SVGDrawable.MoveTo
//-----------------------------------------------------------------------
/**
 * Moves the path cursor to the specified point
 *
 * @param {number} x - The x coordinate to move to
 * @param {number} y - The y coordinate to move to
 * @param {SVGElement} element - The element we are setting the path for
 *
 * @returns {SVGElement} The element, with the d attribute modified
 */
KIP.Objects.SVGDrawable.prototype.MoveTo = function (x, y, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "M" + x + " " + y + "\n";
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.LineTo
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.LineTo = function (x, y, element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += "L " + x + " " + y + "\n";
	element.setAttribute("d", d);
	return element;
};

// SVGDrawavle.CurveTo
//--------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.CurveTo = function (controlOne, controlTwo, endPoint, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "C " + controlOne.x + " " + controlOne.y + ", ";
	d += controlTwo.x + " " + controlTwo.y + ", ";
	d += endPoint.x + " " + endPoint.y + "\n";
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.ArcTo
//-----------------------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.ArcTo = function (radius, xRotation, largeArc, sweepFlag, endPoint, element) {
	"use strict";
	var d;

	d = element.getAttribute("d");
	d += "A " + radius.x + " " + radius.y;
	d += " " + xRotation + " " + largeArc + " " + sweepFlag;
	d += " " + KIP.Functions.RoundToPlace(endPoint.x, 1000) + " " + KIP.Functions.RoundToPlace(endPoint.y, 1000) + "\n" ;
	element.setAttribute("d", d);

	return element;
};

// SVGDrawable.FinishPath
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.FinishPath = function (element) {
	"use strict";
	var d;
	d = element.getAttribute("d");
	d += " Z";
	element.setAttribute("d", d);
	return element;
};

// SVGDrawable.AddRegularPolygon
//-------------------------------------------------------------------------------------------------------------
/**
 * Creates an SVG regular polygon
 * @param {number} centerX - The central x position of the polygon
 * @param {number} centerY - The central y position of the polygon
 * @param {number} sides - The number of sides the polygon should have
 * @param {number} radius - How far a radial arm of the polygon should extend
 * @param {object} [attr] - Any additional attributes that should be applied to the SVG element
 * @param {object} [grp] - The group this element should belong to
 */
KIP.Objects.SVGDrawable.prototype.AddRegularPolygon = function (centerX, centerY, sides, radius, attr, grp) {
	"use strict";
	var intAngle, p, points, idx, x, y, curAngle;
	if (this.autoResize) this.UpdateView(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	intAngle = KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360 / sides), 1000);

	if (!attr) attr = {};
	attr.points = "";

	p = this.AddChild("polygon", attr, grp);

	points = "";
	curAngle = 0;
	for (idx = 0; idx < sides; idx += 1) {

		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * radius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * radius, 10);
		curAngle += intAngle;
		points += x + "," + y + " ";
	}

	p.setAttribute("points", points);
	
	return p;
};

// SVGDrawable.RegularStar
//---------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.AddRegularStar = function (centerX, centerY, sides, radius, innerRadius, attr, grp) {
	"use strict";
	var intAngle, p, points, idx, x, y, curAngle;
	
	curAngle = 0;
	points = "";
	
	if (this.autoResize) this.UpdateView(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	
	intAngle = KIP.Functions.RoundToPlace(KIP.Functions.DegreesToRadians(360 / sides), 1000);
	
	if (!attr) attr = {};
	attr.points = "";
	
	p = this.AddChild("polygon", attr, grp);
	
	// Loop through all of the points of the star
	for (idx = 0; idx < sides; idx += 1) {
    
		// Outer point
		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * radius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * radius, 10);
		curAngle += (intAngle / 2);
		points += x + ", " + y + " ";
		
		// Inner point
		x = centerX + KIP.Functions.RoundToPlace(Math.sin(curAngle) * innerRadius, 10);
		y = centerY + KIP.Functions.RoundToPlace(-1 * Math.cos(curAngle) * innerRadius, 10);
		curAngle += (intAngle / 2);
		points += x + ", " + y + " ";
		
  }
	
	p.setAttribute("points", points);
	
	return p;
};

// SVGDrawable.AddCircle
//-------------------------------------------------------------------------------------
/**
 * Adds a circle to the current SVG drawing
 *
 * @param {Number} x - The x for the center of the circle
 * @param {Number} y - The y value for the center of the circle
 * @param {Number} radius - The radius for the circle
 * @param {Object} style - An array defining how to style this rectangle
 * @param {Object} style.fill - An object array definiging various fill properties. See {@link KIP.Objects.SVGDrawable#AssignFillValues|AssignFillValues} for details.
 * @param {Object} style.stroke - An object array defining various stroke properties. See {@link KIP.Objects.SVGDrawable#AssignStrokeValues|AssignStrokeValues} for details.
 * @param {String} [id] - The ID that should be assigned to the element
 * @param {String} [cls] -	The CSS class that should be applied to this element
 * @param {SVGElement} [group] - The SVG group to add this element to
 *
 * @returns {SVGElement} The element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddCircle = function (x, y, radius, attr, grp) {
	"use strict";
	if (this.autoResize) this.UpdateView(x - radius, y - radius, 2 * radius, 2 * radius);

	// Set the appropriate attributes
	if (!attr) attr = {};
	attr.cx = x;
	attr.cy = y;
	attr.r = radius;

	// Add the child
	return this.AddChild("circle", attr, grp);
};

// SVGDrawable.AddPerfectArc
//-----------------------------------------------------------------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.AddPerfectArc = function (center, radius, startDeg, endDeg, direction, noRadii, attr, grp) {
	var elem, end, start, aDiff, padding, adjust, angle;

	padding = parseInt(style.stroke.width, 10) || 1;
	if (this.autoResize) this.UpdateView(center.x - radius - padding, center.y - radius - padding, 2 * (radius + padding), 2 * (radius + padding));
	start = {};
	end = {};

	aDiff = endDeg - startDeg;

	start.x = Math.sin(KIP.Functions.DegreesToRadians(startDeg)) * radius + center.x;
	start.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(startDeg)) * radius) + center.y;

	end.x = Math.sin(KIP.Functions.DegreesToRadians(endDeg)) * radius + center.x;
	end.y = -1 * (Math.cos(KIP.Functions.DegreesToRadians(endDeg)) * radius) + center.y;

	adjust = parseInt(style.stroke.width, 10) * Math.sqrt(2) || 0; // Hypotenuse
	angle = KIP.Functions.DegreesToRadians(aDiff + startDeg); // Appropriate angle

	if (!attr) attr = {};
	attr.d = "";
	elem = this.AddChild("path", attr, grp);

	start.y += (-1 * Math.cos(angle) * adjust);
	start.x += (Math.sin(angle) * adjust);

	end.y += (-1 * Math.cos(angle) * adjust);
	end.x += (Math.sin(angle) * adjust);

	center.y += (-1 * Math.cos(angle) * adjust);
	center.x += (Math.sin(angle) * adjust);


	this.MoveTo(start.x, start.y, elem);
	this.ArcTo({x: radius, y: radius}, 0, (aDiff > 180)? 1 : 0, direction, {x: end.x, y: end.y}, elem);

	if (noRadii) return elem;

	this.LineTo(center.x, center.y, elem);
	this.FinishPath(elem);

	return elem;
};

// SVGDrawable.AddChild
//--------------------------------------------------------------------------
/**
 * Don't call this function directly; use one of the more targeted drawing functions
 * Adds a child element to the current SVG drawing
 * @private
 * @param {String} type  The type of child element we are drawing
 * @param {Object} attr  	 The attributes that should be applied to this child
 */
KIP.Objects.SVGDrawable.prototype.AddChild = function (type, attr, group) {
	"use strict";

	// We can't do anything without a type
	if (!type) return;

	if (!attr.id) {
		attr.id = this.cur_ID;
		this.cur_ID += 1;
	}

	var elem = KIP.Functions.CreateSVGElem(type, attr);
	if (type !== "g") this.AssignStyle(elem);

	this.elements[this.elements.length] = elem;
	this.elementsByID[attr.id] = elem;

	if (group) {
		group.appendChild(elem);
	} else {
		this.div.appendChild(elem);
	}

	return elem;
};

// SVGDrawable.AddText
//----------------------------------------------------------------------------------------------
/**
 * Adds text on top of a provided element
 *
 * @param {SVGElement} elem - The element to add text on top of.
 * @param {String} text  - The text to add
 * @param {Number} [x] - The x-offset from the target element's position
 * @param {Number} [y] - The y-offset from the target element's position
 * @param {Object} [attr] - All attributes that should be applied to the element, in key value pairs
 * @param {Object} [origin] - The point that should be considered the origin of the text, as values from 0 -1
 * @param {SVGElement} [group] - The group that this text should be added to
 *
 * @return {SVGElement} The text element that is created
 */
KIP.Objects.SVGDrawable.prototype.AddText = function (elem, text, x, y, attr, origin, group, flowRect) {
	var txt, tSpan, cx, cy, e_x, e_y, box, oX, oY, flowRoot, flowRegion, flowElem, flowPara;
	
	// Default the x/y values
	x = x || 0;
	y = y || 0;

	// Measure the source element
	if (elem) {
		box = this.MeasureElem(elem);
		x += box.x;
		y += box.y;
	}

	if (!attr) attr = {};
	attr.x = x;
	attr.y = y;

	if (!flowRect) {
		txt = KIP.Functions.CreateSVGElem("text", attr);
		txt.innerHTML = text;
	} else {
		flowPara = KIP.Functions.CreateSVGElem("flowPara");
		flowPara.innerHTML = text;
		
		// Create the rectangle that sets dimensions
		flowRect.x = attr.x;
		flowRect.y = attr.y;
		flowRegion = KIP.Functions.CreateSVGElem("flowRegion");
		flowElem = KIP.Functions.CreateSVGElem("rect", flowRect);
		flowRegion.appendChild(flowElem);
		
		
		// Create the wrapping flow element
		txt = KIP.Functions.CreateSVGElem("flowRoot", {id: attr.id});
		txt.appendChild(flowRegion);
		txt.appendChild(flowPara);
	}
	
	this.AssignStyle(txt);

	// Get the measurements for the 
	if (!flowRect) {
		box = this.MeasureElem(txt);
	} else {
		box = this.MeasureElem(flowPara);
	}

	// X and Y are where the origin point should be positioned
	// We'll have to calculate where to actually draw the text, given that the origin may be different spots
	// Originally, the origin point is in the bottom left corner
	if (origin) {
		oX = origin.x * box.width;
		oY = origin.y * box.height;

		x -= (oX - 0);
		y -= (oY - box.height);

		txt.setAttribute("x", x);
		txt.setAttribute("y", y);
		box = this.MeasureElem(txt);
	}

	if (this.autoResize) this.UpdateView(box.x, box.y, box.width, box.height);

	
	if (!group) {
		this.div.appendChild(txt);
	} else {
		group.appendChild(txt);
	}

	KIP.Functions.AddCSSClass(txt, "unselectable");

	return txt;
};

// SVGDrawable.MeasureElem
//-----------------------------------------------------------------------
/**
 * Calculates the dimensions of a provided element
 * @param {SVGElement} elem - The element we are meausuring
 */
KIP.Objects.SVGDrawable.prototype.MeasureElem = function (elem) {
	"use strict";
	var p, box, childP;

	
	// Try to grab the measurement before we try to do some parent swapping
	if (this.div.parentNode) {
		try {
			box = elem.getBBox();
			if (box.x || box.y || box.height || box.width) return box;
		} catch (e) {
			console.log("error thrown");
		}
	}

	p = this.parent;
	childP = elem.parentNode;

	// Temporarily add the element to get its size
	if (p !== document.body) {
		document.body.appendChild(this.div);
	}
	this.div.appendChild(elem);

	// Measure the text since it is now drawn
	box = elem.getBBox();

	// Remove the temporary element and restore the parent
	this.div.removeChild(elem);
	if (p !== document.body) {
		document.body.removeChild(this.div);
		this.parent = p;
		if (this.parent) {
			this.parent.appendChild(this.div);
		}
	}

	if (childP) {
		childP.appendChild(elem);
	}

	return box;
};

// SVGDrawable.Draw
//-------------------------------------------------------------------------
/**
 * Draws the SVG and all of its child elements
 *
 * @param {HTMLElement} parent The element to add the SVG to
 * @param {double} 			 w      The width that the SVG should be {optional}
 * @param {double} 			 h      The height that the SVG should be {optional}
 * @param {string} 			 view   The string defining the viewBox for the SVG {optional}
 */
KIP.Objects.SVGDrawable.prototype.Draw = function (parent, w, h, view) {
	"use strict";
	if ((w !== this.w) || (h !== this.h) || (view !== this.view)) {
		this.AdjustSize(w, h, view);
	}

	// Call the super function
	KIP.Objects.Drawable.prototype.Draw.call(this, parent);
};

// SVGDrawable.AssignStyle
//-----------------------------------------------------------------------
/**
 * Splits the style object into fill and stroke attributes
 * @private
 * @param {obj} 							style An object with two sub-objects, fill and stroke
 * @param {SVGElement} elem  The element that we are updating with these style attributes
 */
KIP.Objects.SVGDrawable.prototype.AssignStyle = function (elem) {

	if (this.fillProperty) this.AssignFillValues(this.fillProperty, elem);
	if (this.lineProperty) this.AssignStrokeValues(this.lineProperty, elem);
	if (this.fontProperty) this.AssignFontValues(this.fontProperty, elem);
};

// SVGDrawable.AssignFontValues
//-----------------------------------------------------------------------------
/**
 * Updates the various style properties that can be applied to fonts
 *
 * @param {Object} font - The object containing the relevant style definitions. Uses CSS-style values.
 * @param {String} font.size - The size of the font
 * @param {String} font.family - The family the font belongs to
 * @param {String} font.weight - How heavy the font should be
 * @param {String} font.fontStyle - The font-style to use
 * @param {String} font.fill - The color to use for the font
 * @param {SVGElement} elem - The element that these should apply to
 *
 * @returns {SVGElement} The element passed in with the style applied
 */
KIP.Objects.SVGDrawable.prototype.AssignFontValues = function (font, elem) {
	if (!font) return elem;
	if (font.size) elem.style.fontSize = font.size + "px";
	if (font.family) elem.style.fontFamily = font.family;
	if (font.weight) elem.style.fontWeight = font.weight;
	if (font.style) elem.style.fontStyle = font.style;
	if (font.color) elem.style.fill = font.color;
	return elem;
};

// SVGDrawable.AssignStrokeValues
//---------------------------------------------------------------------------------
/**
 * Updates the various style properties that can be assigned to strokes
 *
 * @param {Object} stroke - An object containing key-value pairs of different style elements. Uses CSS-style values.
 * @param {String} stroke.type - Can either be "None" or "Solid"
 * @param {String} stroke.color - The color to use for the stroke
 * @param {String} stroke.opacity - The opacity to be used for the stroke
 * @param {String} stroke.width - How wide the stroke line should be
 * @param {String} stroke.lineCap -  How the stroke line should end
 * @param {String} stroke.lineJoin - How corners on the stroke should be shaped
 * @param {SVGElement} elem   The element to apply the style changes to
 *
 * @return {SVGElement} The element with the new styles applied
 */
KIP.Objects.SVGDrawable.prototype.AssignStrokeValues = function (stroke, elem) {
	"use strict";

	if (!stroke || !stroke.type || (stroke.type === "None")) {
		elem.style.stroke = "None";
		elem.style.strokeWidth = 0;
		return elem;
	}

	if (stroke.color) elem.style.stroke = stroke.color;
	if (stroke.opacity) elem.style.strokeOpacity = stroke.opacity;
	if (stroke.width || (stroke.width === 0)) elem.style.strokeWidth = stroke.width;

	if (stroke.lineCap) elem.style.strokeLinecap = stroke.lineCap;
	if (stroke.lineJoin) elem.style.strokeLinejoin = stroke.lineJoin;

	return elem;
};

// SVGDrawable.AssignFillValues
//-----------------------------------------------------------------------------
/**
 * Updates the various style properties that can be assigned to fills
 *
 * @param {Object} fill - An object containing data about various fill style elements. Uses CSS-style values.
 * @param {String} fill.type - Can be set to "None" or "Solid"
 * @param {String} fill.color - The color that this object should be filled with
 * @param {String} fill.opacity - The opacity that should be applied to the fill of this object
 *
 * @param {SVGElement} elem The element to apply the style changes to
 */
KIP.Objects.SVGDrawable.prototype.AssignFillValues = function (fill, elem) {

	if (!fill || !fill.type || (fill.type === "None")) {
		elem.style.fill = "None";
		return elem;
	}

	if (fill.color) elem.style.fill = fill.color;
	if (fill.opacity) elem.style.fillOpacity = fill.opacity;
	if (fill.url) elem.style.fill = "url(" + fill.url + ")";
	return elem;
};

// SVGDrawable.AdjustStyle
//-----------------------------------------------------------------------
/**
 * Allows the style of an existing element to be changed
 *
 * @param {string} id - If *elem* isn't passed in, looks up the element by its ID {optional}
 * @param {SVGElement} elem - The element to add the new CSS to
 */
KIP.Objects.SVGDrawable.prototype.AdjustStyle = function (id, elem) {
	if (!elem) {
		elem = this.elementsByID[id];
	}

	if (!elem) return;

	this.AssignStyle(elem);
};

// SVGDrawable.SetLineProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetLineProperties = function (props) {
	"use strict";
	this.SetProperties(this.lineProperty, props);
};

// SVGDrawable.SetFillProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetFillProperties = function (props) {
	"use strict";
	this.SetProperties(this.fillProperty, props);
};

// SVGDrawable.SetFontProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetFontProperties = function (props) {
	"use strict";
	this.SetProperties(this.fontProperty, props);
};

// SVGDrawable.SetProperties
//-----------------------------------------------------------------------
KIP.Objects.SVGDrawable.prototype.SetProperties = function (propCollection, newProps) {
	"use strict";
	var prop;

	for (prop in newProps) {
		if (newProps.hasOwnProperty(prop)) {
			propCollection[prop] = newProps[prop];
		}
	}
}

// SVGDrawable.AdjustSize
//-------------------------------------------------------------------------
/**
 * Allows the display size of the SVG to be changed
 *
 * @param {Number} w    The width of the total SVG canvas
 * @param {Number} h    The height of the total SVG canvas
 *
 * @param {String} view A viewBox configuration to be used to scale the SVG. If not passed in, it is calcuated to include everything in the SVG
 */
KIP.Objects.SVGDrawable.prototype.AdjustSize = function (w, h, view) {
	"use strict";

	// Set the width attribute if we need to
	if (w && (this.w !== w)) {
		this.w = w || this.w;
		this.div.setAttribute("width", this.w);
	}

	// Set the height attribute if we need to
	if (h && (this.h !== h)) {
		this.h = h || this.h;
		this.div.setAttribute("height", this.h);
	}

	// Set the view attribute if we need to
	if ((view && (this.view !== view)) || !this.view) {
		this.view = view || this.CalculateView();
		this.div.setAttribute("viewBox", this.view);
	}

};

// SVGDrawable.GetElement
//-----------------------------------------------------------------------
/**
 * Given an ID, finds the SVG element it belongs to
 *
 * @param {String} id - The ID of the element we are trying to find
 *
 * @return {SVGElement} The SVG Element that has this ID
 */
KIP.Objects.SVGDrawable.prototype.GetElement = function (id) {
	"use strict";
	return this.elementsByID[id];
};

// SVGDrawable.CreateGroup
//-----------------------------------------------------------------------
/**
 * Creates an SVG group with the provided ID
 *
 * @param {String} id - The identifier to use for the group
 *
 * @return {SVGElement} The group that is created
 */
KIP.Objects.SVGDrawable.prototype.CreateGroup = function (id, grp) {
	"use strict";
	return this.AddChild("g", {id: id}, grp);
};

// SVGDrawable.SetAttribute
//-----------------------------------------------------------------------
/**
 * Sets an attribute on the SVG element
 * @param	{string} key - What attribute to set
 * @param {string} value - What to set the attribute to
 */
KIP.Objects.SVGDrawable.prototype.SetAttribute = function (key, value) {
	"use strict";
	this.div.setAttribute(key, value);
};

// SVGDrawable.Clear
//-----------------------------------------------------------------------
/**
 * Removes all elements from the SVG canvas
 */
KIP.Objects.SVGDrawable.prototype.Clear = function () {
	"use strict";
	var elem, idx;

	for (idx = (this.div.children.length - 1); idx >= 1; idx -= 1) {
		elem = this.div.children[idx];
		this.div.removeChild(elem);
	}
};

// SVGDrawable.Zoom
//-----------------------------------------------------------------------
/**
 * Allows the viewport to be zoomed into the SVG
 * @param {number} amt - The amount that should be zoomed in
 */
KIP.Objects.SVGDrawable.prototype.Zoom = function (amt) {
	"use strict";
	var xUnit, yUnit;
	
	// Calculate the ratio of the SVG drawing
	xUnit = this.viewW;
	yUnit = this.viewH;
	
	// Adjust the view parameters
	this.viewX -= (amt * xUnit);
	this.viewY -= (amt * yUnit);
	this.viewW += (2 * amt * xUnit);
	this.viewH += (2 * amt * yUnit);
	
	this.view = this.CreateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.Pan
//-----------------------------------------------------------------------
/**
 * Allows the viewport to be panned around
 * @param {number} panX - The amount to move the X direction
 * @param {number} panY - The amount to move the Y direction
 */
KIP.Objects.SVGDrawable.prototype.Pan = function (panX, panY) {
	"use strict";
	this.viewX += panX;
	this.viewY += panY;
	this.view = this.CreateView();
	this.div.setAttribute("viewBox", this.view);
};

// SVGDrawable.CalculateScreenCoordinates
//-------------------------------------------------------------------------------
/**
 * Calculates where a provided SVG-based point actually appears on the ysicial screen
 *
 * @param {number} x - THe x coordinate in the SVG view
 * @param {number} y - The y coordinate in the SVG view
 *
 * @returns {Object} Object containing new x & y values
 */
KIP.Objects.SVGDrawable.prototype.CalculateScreenCoordinates = function (x, y) {
	"use strict";
	var xRatio, yRatio, left, top, newX, newY;

	// If the coordinate isn't on the screen, quit
	//if ((x < this.viewX) || (x > (this.viewX + this.viewW))) return {x: NaN, y: NaN};
	//if ((y < this.viewY) || (y > (this.viewY + this.viewH))) return {x: NaN, y: NaN};

	// Grab proportions from parent if we can
	if (this.parent) {
		left = this.parent.offsetLeft;
		top = this.parent.offsetTop;

	// Otherwise, just use the window properties
	} else {
		left = 0;
		top = 0;
	}

	xRatio = this.w / this.viewW;
	yRatio = this.h / this.viewH;

	newX = xRatio * (x - this.viewX) + left;
	newY = yRatio * (y - this.viewY) + top;

	newX = Math.floor(newX);
	newY = Math.floor(newY);

	return {x: newX, y: newY};
};

// SVGDrawable.CalculateSVGCoordinates
//-----------------------------------------------------------------------------
/**
 * Finds the corresponding SVG coordinate for a window coordinate. Useful for taking event data and translating to SVG coordinates.
 *
 * @param {number} x - The x value of the window point
 * @param {number} y - The y value of the window point
 *
 * @returns {Object} Object containing new x & y values
 */
KIP.Objects.SVGDrawable.prototype.CalculateSVGCoordinates = function (x, y) {
	"use strict";
	var left, top, xRatio, yRatio, newX, newY;

	// Grab proportions from parent if we can
	if (this.parent) {
		left = this.parent.offsetLeft;
		top = this.parent.offsetTop;

	// Otherwise, just use the window properties
	} else {
		left = 0;
		top = 0;
	}

	// Calculate the appropriate proportions
	xRatio = this.viewW / this.w;
	yRatio = this.viewH / this.h;

	// Calculate the ratio
	newX = xRatio * (x - left) + this.viewX;
	newY = yRatio * (y - top) + this.viewY;

	return {x: newX, y: newY};
}

KIP.Objects.SVGDrawable.prototype.CalculateSVGWidth = function (w) {
	"use strict";
	var xRatio = this.viewW / this.w;
	return w * xRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateSVGHeight = function (h) {
	var yRatio = this.viewH / this.h;
	return h * yRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateScreenWidth = function (w) {
	"use strict";
	var xRatio = this.w / this.viewW;
	return w * xRatio;
}

KIP.Objects.SVGDrawable.prototype.CalculateScreenHeight = function (h) {
	var yRatio = this.h / this.viewH ;
	return h * yRatio;
}


// SVGDrawable.CreateGradient
//----------------------------------------------------------------------------------------
/**
 * Create a gradient with a given set of points
 *
 * @param {string} type       - What type of gradient you are creating ("linear" or "radial")
 * @param {Array} points     - An array of objects, each with three properties
 * @param {string} points.color - The color to use for the provided point
 * @param {number} points.offset - The offset to use for the color point (between  0 and 1)
 * @param {number} points.opacity - What opacity the point should have
 * @param {Object} [transforms] - object containing the properties of the transform gradient that will be applied
 * @param {number} transforms.startX - The starting x value for thte gradient
 * @param {number} transforms.startY - The starting y value for the gradient
 * @param {number} transforms.endX
 * @param {number} transforms.endY
 *
 * @returns {string} The ID of the created gradient or transform gradient (if transform data was passed in)
 */
KIP.Objects.SVGDrawable.prototype.CreateGradient = function (type, points, transforms) {
	"use strict";
	var grad, pt, pIdx, id, tID, tGrad;

	// Initialize our definitions node if need be
	if (!this.defs) {
		this.defs = KIP.Functions.CreateSVGElem("defs");
		this.gradients = [];
		this.div.appendChild(this.defs);
	}

	id = "gradient" + this.gradients.length;

	// Create the initial gradient
	if (type === "linear") {
		grad = KIP.Functions.CreateSVGElem("linearGradient", {id: id});
	} else if (type === "radial") {
		grad = KIP.Functions.CreateSVGElem("radialGradient", {id: id});
	} else {
		return;
	}

	// Apply the points to the gradient
	for (pIdx = 0; pIdx < points.length; pIdx += 1) {
		pt = KIP.Functions.CreateSVGElem("stop", {id: id + "stop" + pIdx});
		pt.style.stopColor = points[pIdx].color;
		pt.style.stopOpacity = points[pIdx].opacity;
		pt.setAttribute("offset", points[pIdx].offset);
		grad.appendChild(pt);
	}

	this.defs.appendChild(grad);
	this.gradients[this.gradients.length] = grad;

	// TODO: fix
	if (transforms) {
		tID = "gradient" + this.gradients.length;
		tGrad = KIP.Functions.CreateSVGElem(type + "Gradient", {id: tID});

		tGrad.setAttribute("x1", transforms.startX);
		tGrad.setAttribute("x2", transforms.endX);
		tGrad.setAttribute("y1", transforms.startY);
		tGrad.setAttribute("y2", transforms.endY);

		tGrad.setAttribute("xlink:href", "#" + id);

		this.defs.appendChild(tGrad);
		this.gradients[this.gradients.length] = grad;
		id = tID;
	}

	// Return the ID of the gradient, as that's what elements will need to reference
	return id;
}

// SVGDrawable.CreatePattern
//-----------------------------------------------------------------------
// TODO: fix
KIP.Objects.SVGDrawable.prototype.CreatePattern = function (type, id) {
	"use strict";
	var pat, div;

	// Create the definitions node, if it doesn't already exist
	if (!this.defs) {
		this.defs = KIP.Functions.CreateSVGElem("defs");
		this.patternIDs = {};
		this.div.appendChild(this.defs);
	}

	// Create the appropriate pattern
	div = 100;
	if (type === "stipple") {
		id = id || "stipple";
		pat = this.StipplePattern(10, 10, id);
	}

	// Remove any previous elements with this name
	if (this.patternIDs[id]) {
		this.defs.removeChild(this.patternIDs[id]);
	}

	this.defs.appendChild(pat);
	this.patternIDs[id] = pat;

	return id;
};

// SVGDrawable.StipplePattern
//---------------------------------------------------------------------------------
// TODO: FIx
KIP.Objects.SVGDrawable.prototype.StipplePattern = function (width, height, id) {
	"use strict";
	var x, y, circ, pattern, rx, ry, cx, cy;

	pattern = KIP.Functions.CreateSVGElem("pattern", {id: id || "stipple",x: 0, y: 0, height: .25, width: .25});
	pattern.setAttribute("patternTransform","translate(0,0) scale(10, 10)");
	pattern.setAttribute("patternUnits", "userSpaceOnUse");

	// Grab the appropriate radii
	rx = (width / 5);
	ry = (height / 5);

	// Grab the appropriate center point
	cx = (rx / 2);
	cy = (ry / 2);

	// Create the circle and add it to the pattern
	circ = KIP.Functions.CreateSVGElem("circle", {rx: rx, ry: ry, cx: cx, cy: cy});
	this.AssignStyle(circ);
	pattern.appendChild(circ);

	return pattern;
};

// SVGDrawable.RotateElement
//--------------------------------------------------------------------------------
/**
 * Rotates a provided element by some number of degrees around a certain point.
 * @param {SVGElement} elem - The element to rotate
 * @param {number} deg - The number of degrees to rotate the element
 * @param {object} point - The point around whuch the rotation should occur.
 * @param {number} point.x - The x coordinate to rottate around
 * @param {number} point.y - The y coordinate to rotate around
 */
KIP.Objects.SVGDrawable.prototype.RotateElement = function (elem, deg, point) {
	"use strict";
	var box;
	if (!point) {
		box = this.MeasureElem(elem);
		point = {
			x: box.x + (box.width / 2),
			y: box.y + (box.height / 2)
		}
	}

	elem.setAttribute("transform", "rotate(" + deg + ", " + point.x + ", " + point.y + ")");
	return elem;
};

// SVGDrawable.AddShape
//------------------------------------------------------------------------
/**
 * Draws a predetermined shape as an SVG. Used for stencil shapes.
 * Currently only supports a check mark or an "x"
 * @param {string} type - The type of shape to add. Currently supports "check", "x", "plus"
 * @param {object} [attr] - ANy additional atributes to be added to the shape
 * @param {SVGElement} [grp] - The SVG group to add this to
 */
KIP.Objects.SVGDrawable.prototype.AddShape = function (type, attr, grp) {
	"use strict";
	var ret
	// Only types currently supported is "check", "x", "plus"
	
	// Checkmark
	if (type === "check") {
    ret = this.AddPath(
			[
				{x: -0.15, y: 2.95},
				{x: 1, y: 4},
				{x: 1.25, y: 4},
				
				{x: 3, y: 0.25},
				{x: 2.4, y: 0},
				
				{x: 1, y: 3},
				{x: 0.3, y: 2.3}
			],
			attr,
			grp
		);
		
	// X
	} else if (type === "x") {
		ret = this.AddPath(
			[
				{x: 0.25, y: 0.6},
				{x: 1, y: 0},
				{x: 2, y: 1.1},
				{x: 3, y: 0},
				{x: 3.75, y: 0.6},
				
				{x: 2.66, y: 1.75},
				
				{x: 3.75, y: 2.9},
				{x: 3, y: 3.5},
				{x: 2, y: 2.5},
				{x: 1, y: 3.5},
				{x: 0.25, y: 2.9},
				
				{x: 1.33, y: 1.75}
			],
			attr,
			grp
		);
	} else if (type === "plus") {
		ret = this.AddPath(
			[
				{x: 2, y: 2},
				{x: 2, y: 0},
				{x: 3, y: 0},
				
				{x: 3, y: 2},
				{x: 5, y: 2},
				{x: 5, y: 3},
				
				{x: 3, y: 3},
				{x: 3, y: 5},
				{x: 2, y: 5},
				
				{x: 2, y: 3},
				{x: 0, y: 3},
				{x: 0, y: 2}
			],
			attr,
			grp
		);
	}
	
	return ret;
};/*globals KIP,document,console*/
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
