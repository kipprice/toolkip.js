/*globals KIP,window*/
KIP.Objects.Form = function (id, title, columns, btns, saveCb, hideOverlay) {
  "use strict";
  this.id = id;
  this.title = title || "Options";
  this.columnNum = columns || 2;
  this.rowNum = 0;
  this.tableData = [];
  this.btns = btns || [];
  this.saveCb = saveCb || function () {};
  this.fields = [];
  
  this.showOverlay = !hideOverlay;
  this.standardStyle = true;
  this.themeColor = "rgba(0,135,230,1)";
  
  // Create our div
  KIP.Objects.Drawable.call(this, this.id, "form");
  
  // Create child divs
  this.CreateElements();
};

KIP.Objects.Form.prototype = Object.create(KIP.Objects.Drawable.prototype);

// Inherits from Drawable
KIP.Objects.Form.prototype = Object.create(KIP.Objects.Drawable.prototype);


KIP.Objects.Form.prototype.CreateTitleBar = function () {
  "use strict";
  var that = this;
  this.titleBar = KIP.Functions.CreateSimpleElement("", "titleBar", this.title);
  
  this.closeLink = KIP.Functions.CreateSimpleElement(this.id + "-close", "close", "CLOSE");
  this.closeLink.addEventListener("click", function () {
    that.CloseForm();
  });
  this.titleBar.appendChild(this.closeLink);
  
  this.AppendChild(this.titleBar);
};

KIP.Objects.Form.prototype.CreateOverlay = function () {
  "use strict";
  this.overlay = KIP.Functions.CreateSimpleElement("", "overlay");
  this.AddSibling(this.overlay);
}

KIP.Objects.Form.prototype.CreateBtnBar = function (btns) {
  "use strict";
  var btn, cb, idx, btn, that;
  this.btnBar = KIP.Functions.CreateSimpleElement("", "btnBar");
  
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
    
    if ((btn.lbl === "OK" || btn.lbl === "Accept" || btn.lbl === "Save") && !btn.click) {
      btn.click = function () {
        that.Save();
        that.CloseForm();
      }
    }
    
    if ((btn.lbl === "Cancel") && !btn.click) {
      btn.click = function () {
        that.CloseForm();
      }
    }
    
    btn = cb(btn);
    this.btnBar.appendChild(btn);
  }
  this.AppendChild(this.btnBar);
};


KIP.Objects.Form.prototype.CreateElements = function () {
  "use strict";
  this.CreateOverlay();
  this.CreateTitleBar();
  this.CreateContent();
  this.CreateBtnBar();
  
}

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

KIP.Objects.Form.prototype.AddField = function (id, field, position, lbl, lblPosition) {
  "use strict";
  
  if (!lblPosition && lblPosition !== 0) {
    lblPosition = position;
  }

  if (lbl) {
    this.AddElement(lbl, lblPosition);
  }
  this.AddElement(field, position);
  
  if (field) {
    this.fields.push({
      "elem": field,
      "id": id
    });
  }
  
  if (this.div.parentNode) {
    this.Draw();
  }
};

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
    
    if (this.rowNum > 0 && this.tableData[this.rowNum - 1] && !(this.tableData[this.rowNum - 1].children[position].innerHTML)) {
      row = this.tableData[this.rowNum - 1];
      KIP.Functions.ProcessCellContents(element, row.children[position]);
    } else {
      data = [];
      data[position] = element;
      row = KIP.Functions.AddRow(this.table, data, "", this.columnNum);
      this.rowNum += 1;
      this.tableData.push(row);
    }
  }
}


KIP.Objects.Form.prototype.AddTextInput = function (id, txt, position, ghostTxt, lbl) {
  "use strict";
  this.AddInput(id, "text", txt, [{key: "placeholder", val: ghostTxt}], lbl, "", position, position);
};

KIP.Objects.Form.prototype.AddInput = function (id, type, value, addlAttr, lbl, cls, position, lblPosition) {
  "use strict";
  var input, lblElem;
  
  if (!addlAttr) {
    addlAttr = [];
  }
  
  addlAttr.push({key: "type", val : type});
  addlAttr.push({key: "value", val: value});
  
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
  this.AddField(id, input, position, lblElem, lblPosition);

}

KIP.Objects.Form.prototype.Save = function () {
  "use strict";
  var fIdx, field, values;
  
  // Loop through all of our fields
  for (fIdx = 0; fIdx < this.fields.length; fIdx += 1) {
    field = this.fields[fIdx];
    
    values[field.id] = field.elem.value;
  }
  
  if (this.saveCb) {
    this.saveCb(values);
  }
};

KIP.Objects.Form.prototype.CloseForm = function () {
  "use strict";
  if (this.overlay.parentNode) {
    this.overlay.parentNode.removeChild(this.overlay);
  }
  
  if (this.div.parentNode) {
    this.div.parentNode.removeChild(this.div);
  }
};

KIP.Objects.Form.prototype.AfterDrawChildren = function () {
  "use strict";
  if (this.standardStyle) {
    this.ApplyStandardStyles();
  }
};

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
    "margin": "auto",
    "margin-top": "15%",
    "background-color": "#FFF",
    "box-shadow" : "1px 1px 13px 4px rgba(0,0,0,.2);",
    "font-family" : "Segoe UI, Calibri, sans",
    "z-index" : "2",
    "position" : "relative",
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
    "box-shadow": "1px 1px 3px 2px rgba(0,0,0,.2)",
    "border-radius" : "3px",
    "font-size" : "15px",
    "opacity" : "0.7"
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
};