/*globals KIP,window*/

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
KIP.Objects.Form = function (id, title, btns, saveCb, hideOverlay) {
  "use strict";
  this.id = id;
  this.title = title || "Options";
  this.tables = [];
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
 * @param {variant} btns - The buttons that should be added to the bottom of this form
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
/**
 * Creates the elements needed by the form
 */
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
/**
 * Creates the content container for the form. Hosts all internal tables for the form.
 */
KIP.Objects.Form.prototype.CreateContent = function () {
  "use strict";
  var elem;

  elem = KIP.Functions.CreateSimpleElement(this.id + "-content", "content");
  this.AppendChild(elem);

  this.content = elem;
}

// Form.CreateSection
//----------------------------------------------------------------------------
/**
 * Creates a section within the form
 * @param {string} id        - The identifier for this section
 * @param {string} [header]  - What to display as the header for this section
 * @param {[type]} columnNum - How many columns this section has in its table
 */
KIP.Objects.Form.prototype.CreateSection = function (id, header, columnNum) {
  "use strict";
  var tIdx, table, sec, secHeader;

  // Create the general section UI
  sec = KIP.Functions.CreateSimpleElement(id, "section");

  // Create the header text if appropriate
  if (header) {
    secHeader = KIP.Functions.CreateSimpleElement("", "secHeader", header);
  }

  // Grab the next available table index
  tIdx = this.tables.length;

  // Create the appropriate table
  columnNum = columnNum || 1;
  table = KIP.Functions.CreateTable(id + "-table", "columnContainer", "", 0, columnNum);
  this.tables[tIdx] = {
    table: table,
    data: [],
    colNum: columnNum,
    rowNum: 0,
    id: id
  }

  // Set up the hierarchy & add to our HTML
  if (secHeader) {
    sec.appendChild(secHeader);
  }
  sec.appendChild(table);
  this.content.appendChild(sec);
  this.currentSection = tIdx;

}

// Form.AddField
//---------------------------------------------------------------------------------------
/**
 * Adds an input field to the form
 * @param {string} id          The identifier for the field
 * @param {string} field       The type of input we are creating
 * @param {string} position    Where the field should be placed
 * @param {string} lbl         What label to use for the field
 * @param {string} lblPosition Where the label for the field should be positioned
 * @returns {HTMLElement} The created field
 */
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
  var row, table, col, data, rowNum, colNum, tableData, added;

  // Default positions
  if (!position) {
    position = {
      table: (this.currentSection || (this.tables.length - 1)),
      col: 0
    }
  } else {

    // Table defaults: first current section, then last added
    if (!position.table && (position.table !== 0)) {
      position.table = this.currentSection;
    }
    if (!position.table && (position.table !== 0)) {
      position.table = this.tables.length - 1;
    }

    // Column defaults to 0
    position.column = position.column || 0;
  }

  // Positions are now objects with a specified table & column
  table = position.table;
  col = position.col;

  // Quit if we don't actually have a table
  if (table < 0) return false;
  if (!this.tables[table]) return false;

  // Grab the pieces of data about the table
  rowNum = this.tables[table].rowNum;
  colNum = this.tables[table].colNum;
  tableData = this.tables[table].data;

  // Check if we're adding a new cell to an existing row
  if (rowNum > 0 && tableData[rowNum - 1]) {
    row = tableData[rowNum - 1];

    // If this row doesn't yet have data in this cell, update it
    if (!row.children[col] || !row.children[col].innerHTML) {
      KIP.Functions.ProcessCellContents(element, row.children[col]);
      added = true;
    }

  }

  // If we didn't handle this in the existing cell update, create a new row
  if (!added) {
    data = [];
    data[col] = element;
    row = KIP.Functions.AddRow(this.tables[table].table, data, "", colNum);
    rowNum += 1;
    tableData.push(row);
  }

  // Update our globals
  this.tables[table].rowNum = rowNum;
  this.tables[table].data = tableData;

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
/**
 * Saves all data detailed in the form, as specified by the callback function
 */
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
  * Closes the form without saving any data. It can also be called by Save
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
  var ov, form, input, title, btns, pStyle, lbl, column, cPerc, t, tbl, hd;

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

  // Headers
  hd = {
    "color" : this.themeColor,
    "font-weight" : "bold",
    "font-size" : "22px",
    "margin-bottom": "10px",
    "margin-top": "10px"
  }
  hd = KIP.Functions.CreateCSSClass(".form .secHeader", hd);

  // Columns
  column = {
    "display" : "table",
    "width" : "100%"
  }
  column = KIP.Functions.CreateCSSClass(".form .columnContainer", column);

  column = {
    "display" : "table-cell"
  };
  column = KIP.Functions.CreateCSSClass(".form .column", column);

  // Calculate the appropriate width for each table column
  for (t = 0; t < this.tables.length; t += 1) {
    tbl = this.tables[t];
    cPerc = 100 / tbl.colNum;
    column = {
      "width" : cPerc + "%",
    };
    column = KIP.Functions.CreateCSSClass(".form #" + tbl.id + " .column", column);
  }

};