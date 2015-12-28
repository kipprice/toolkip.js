KIP.Objects.Collection = function () {
	"use strict";
	this.data = [];
	this.backData = {};
};

KIP.Objects.Collection.prototype.Length = function () {
	"use strict";
	return this.data.length;
};

KIP.Objects.Collection.prototype.AddElement = function (key, value, idx, replace) {
	"use strict";
	var elem, loop, k, i;
	
	// Check if we're replacing an element and quit if we are not supposed to
	if (this.DoesElementExist(key)) {
		if (!replace) return null;
		
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
		idx = this.data.push(elem);
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

KIP.Objects.Collection.prototype.RemoveElementAtIndex = function (idx) {
	"use strict";
	var key;
	
	// Find the key to send on to the other function
	key = this.GetElementKey(idx);
	
	// Return the regular result of removing an element
	return this.RemoveElement(key, idx);
};
	
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
	
	// Otherwise, return the value
	return this.data[idx].value;
};
	
KIP.Objects.Collection.prototype.GetElementByIdx = function (idx) {
	"use strict";
	var key = this.GetElementKey(idx);
	return this.GetElement(key, idx);
};
	
KIP.Objects.Collection.prototype.GetElementIdx = function (key) {
	"use strict";
	return this.backData[key];
};
	
KIP.Objects.Collection.prototype.GetElementKey = function (idx) {
	"use strict";
	var elem = this.data[idx];
	if (!elem && elem !== 0) return null;
	return this.data[idx].key;
};

KIP.Objects.Collection.prototype.Sort = function (sortFunc) {
	"use strict";
	return this.data.sort(sortFunc);
};

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

KIP.Objects.Collection.prototype.Clear = function () {
	"use strict";
	this.data = [];
	this.backData = {};
};

KIP.Objects.Collection.prototype.GetNextIndex = function () {
	"use strict";
	return this.data.length;
};

KIP.Objects.Collection.prototype.DoesElementExist = function (key) {
	"use strict";
	var idx, elem;
	idx = this.backData[key];
	
	// Quit early if the key didn't exist
	if (!idx && (idx !== 0)) return false;
	
	// Return whether there is actually data
	return !!this.data[idx];
};