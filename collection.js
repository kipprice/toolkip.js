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
	this.sortedData;
	this.loopIdx = -1;
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
	
	// Loop through sorted data to remove
	for (i = (this.sortedData.length - 1); i >= 0; i-= 1) {
		if (this.sortedData[i].key === key) {
			this.sortedData.splice(i,1);
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
	var key, val, idx, nIdx;
	
	for (idx = 0; idx < coll.data.length; idx += 1) {
		key = coll.data[idx].key;
		
		// If we already have some data under that key, either override or ignore it
		if (key in this.backData) {
			if (useOld) continue;
			this.data[this.backData[key]] = coll.data[idx];
			
		// Otherwise, add the data to our collection instead
		} else {
			nIdx = this.data.push(coll.data[idx]);
			nIdx -= 1;
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

// Collection.Sort
//----------------------------------------------------------
/**
 * Sorts the data contained in our collection
 * @param {function} func - The funcion by which to sort
 * @returns {array} An array containing the sorted version of this collection
 */
KIP.Objects.Collection.prototype.Sort = function (func) {
	"use strict";
	var copy;
	
	// Make a shallow copy of the data array
	copy = this.data.slice();
	
	// Sort the copy
	copy = copy.sort(function (a, b) {
		return func(a.value, b.value);
	});

	this.sortedData = copy;
	
	// Return the copied array
	return copy;
};



// Collection.GetSortedData
//-------------------------------------------------------------
/**
 * Gets the sorted data contained within this collection
 */
KIP.Objects.Collection.prototype.GetSortedData = function () {
	"use strict";
	if (this.sortedData) return this.sortedData.slice();
	return this.data.slice();
};

// Collection.HasNext
//-------------------------------------------------------
/**
 * Determines if there is another element in this collection, when looping over elements
 */
KIP.Objects.Collection.prototype.HasNext = function () {
	"use strict";
	
	return (this.loopIdx < (this.data.length  - 1));
};

// Collection.Next
//----------------------------------------------------
/**
 * Grabs the next element in this collection. If there is sorted data, uses the sorted order. Otherwise, FIFO.
 */
KIP.Objects.Collection.prototype.Next = function () {
	"use strict";
	
	this.loopIdx ++;
	
	// Return null if out of bounds
	if (this.loopIdx >= this.data.length) return null;
	
	// Otherwise return either the sorted value or the unsorted value
	if (this.sortedData) {
		return this.sortedData[this.loopIdx];
	} else {
		return this.data[this.loopIdx];
	}
};

// Collection.StartLoop
//---------------------------------------------------------
/**
 * Synonym for ResetLoop. Resets loop counters so we can loop over elements
 * in this collection.
 */
KIP.Objects.Collection.prototype.StartLoop = function () {
	"use strict";
	this.ResetLoop();
};

// Collection.ResetLoop
//--------------------------------------------------------
/**
 * Resets loop counters so we can loop over elements in this collection.
 */
KIP.Objects.Collection.prototype.ResetLoop = function () {
	"use strict";
	this.loopIdx = -1;
};
