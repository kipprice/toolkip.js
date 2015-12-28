/**
 * @file Helper functions for working with dates
 * @author Kip Price
 * @version 1.0
 * @since 1.1
 */

/**
 *	Finds the difference in days between two date objects
 *	@param {Date} a - The first date to compare
 *	@param {Date} b - The second date to compare
 *	@param {Boolean} signed - If true, will take the difference in order passed in
 *	@param {Boolean} ms - If true, will take the ms difference instead of the day difference
 **/
KIP.Functions.DateDiff = function (a, b, signed, milli) {
	"use strict";
	var ms, diff;
	ms = (1000 * 60 * 60 * 24);

	if ((a > b) || signed) {
		diff = (a - b);
	} else {
		diff = (b - a);
	}

	if (!milli) {
		return Math.round(diff / ms);
	} else {
		return diff;
	}
};

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