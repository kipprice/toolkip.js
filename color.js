/**
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
}