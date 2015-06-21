/*globals KIP,window*/

/***********************************************************************
 * @class Editable
 * @description Creates an Editable element and object
 * @param {string} id The ID that should be assigned to this object
 * @param {string} type The type of input element that should display {optional}
 * @param {string} content What should be shown as the content for {optional}
 * @param {function} validate The function that should be used to validate if the editable can be saved {optional}
 * @param {function} update The function to call once the editable successfully saves
 ***********************************************************************/
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

/***********************************************************
 * Adds all event listeners for this object (mostly click events);
 ***********************************************************/
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

/*************************************************************
 * Creates all elements that are needed to display this editable.
 *************************************************************/
KIP.Objects.Editable.prototype.CreateElements = function () {
  this.inputDiv = KIP.Functions.CreateElement({type: "input", id: this.id + "|input", attr: [{key: "type", val: this.type}]});
};

/****************************************************
 * Starts the modification of the data of this editable
 ****************************************************/
KIP.Objects.Editable.prototype.Modify = function () {
  this.is_modifying = true;
  this.inputDiv.value = this.content;
  
  // Clear out the main div and add instead the input div
  this.div.innerHTML = "";
  this.div.appendChild(this.inputDiv);
  
  this.inputDiv.select();
	this.inputDiv.focus();
  
};

/**************************************************
 * Save the new contents of the editable, assuming that validation is successful
 **************************************************/
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