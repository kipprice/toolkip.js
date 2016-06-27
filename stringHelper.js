/*globals KIP*/
// Piece
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
};