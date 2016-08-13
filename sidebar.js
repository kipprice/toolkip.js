KIP.Objects.Sidebar = function (id, options) {
  "use strict";
  var that = this;
  this.id = id;
  
  KIP.Objects.Drawable.call(this, id, "sidebar");
  
  // Initialize all of the options
  this.options = options || {};
  
  // Initialize additional missing options
  if (!this.options.maxWidth) this.options.maxWidth = "20%";
  if (!this.options.resizable) this.options.resizable = true;
  if (!this.options.width) this.options.width = this.options.maxWidth;
  if (!this.options.defaultTab) this.options.defaultTab = 0;
  if (!this.options.position) this.options.position = "left";
  if (!this.options.shrinkTo) this.options.shrinkTo = 0;
  
  // Initialize our elements & add them to the parent
  this.elems = {
    tabs : KIP.Functions.CreateSimpleElement("tabGrp", "tabs", "", "", "", this.div),
    tabContent: KIP.Functions.CreateSimpleElement("tabContent", "tabContent", "", "", "", this.div),
    button: KIP.Functions.CreateSimpleElement("sidebarBtn", "btn", "", "", "", this.div)
  };
  
  this.elems.innerTabs = KIP.Functions.CreateSimpleElement("intTabGrp", "intTabs", "", "", "", this.elems.tabs);
  
  this.elems.button.addEventListener("click", function () {
    if (that.expanded) {
      that.Collapse();
    } else {
      that.Expand();
    }
 
  })
  
  // Initialize our styles (if appropriate)
  if (!this.options.preventStyles) {
    this.AddStyles();
  }
}

KIP.Objects.Sidebar.prototype = Object.create(KIP.Objects.Drawable.prototype);

KIP.Objects.Sidebar.prototype.Expand = function () {
  "use strict";
  KIP.Functions.AddCSSClass(this.div, "expanded");
  this.expanded = true;
}

KIP.Objects.Sidebar.prototype.Collapse = function () {
  "use strict";
  KIP.Functions.RemoveCSSClass(this.div, "expanded");
  this.expanded = false;
}

KIP.Objects.Sidebar.prototype.Resize = function () {
  "use strict";
}

KIP.Objects.Sidebar.prototype.AddStyles = function () {
  "use strict";
  var cls, left;
  
  if (KIP.Globals.AddedSidebarStyles) return;
  
  KIP.Globals.AddedSidebarStyles = true;
  
  // Grab the appropriate left position of the sidebar
  if (this.options.position === "left") {
    left = "0%";
  } else {
    left = (100 - +this.options.maxWidth) + "%";
  }
 
  // Sidebar class
  cls = {
    "position" : "fixed",
    "left": left,
    "top" : 0,
    "height" : "100%",
    "transition": "width .2s ease-in-out",
    "max-width": this.options.maxWidth,
    "width": this.options.shrinkTo,
    "box-shadow": "1px 0px 5px 2px rgba(0,0,0,.2)",
    "z-index" : "0",
    "display": "flex",
    "background-color" : "#DDD"
  };
  KIP.Functions.CreateCSSClass(".sidebar", cls);
  
  // Expanded class
  cls = {
    "width": this.options.width
  };
  KIP.Functions.CreateCSSClass(".sidebar.expanded", cls);
  
  // Button Class
  cls = {
    "position" : "absolute",
    "height" : "5%",
    "width" : "15px",
    "left" : "calc(100% - 7px)",
    "top" : "47.5%",
    "background-color" : "#555",
    "z-index": "2",
    "cursor": "pointer"
  };
  KIP.Functions.CreateCSSClass(".sidebar #sidebarBtn", cls);
  
  // tab content
  cls = {
    "overflow-x": "hidden",
    "position" : "relative",
    "width" : "87%",
    "z-index": "1",
    "background-color" : "#FFF",
    "box-shadow" : "1px 1px 5px 2px rgba(0,0,0,.2)",
    "margin-top" : "2%",
    "margin-bottom" : "2%",
    "box-sizing" : "border-box"
  }
  KIP.Functions.CreateCSSClass(".sidebar .tabContent", cls);
  
  cls = {
    "overflow-y" : "auto",
    "padding" : "10px"
  }
  KIP.Functions.CreateCSSClass(".sidebar.expanded .tabContent", cls);
  
  // Tabs class
  cls = {
    "overflow": "hidden",
    "position": "relative",
    "height" : "100%",
    "width" : "10%",
    "z-index": "1",
    "padding-top" : "5px"
  }
  KIP.Functions.CreateCSSClass(".sidebar .tabs", cls);
  
  // Internal tabs
  cls = {
    "transform" : "rotate(-90deg)",
    "transform-origin": "0 0",
    "display" : "flex",
    "justify-content" : "flex-end",
    "margin-top" : "100%",
    "width" : "auto"
  }
  KIP.Functions.CreateCSSClass(".sidebar .tabs .intTabs", cls);
  
  // Tab class
  cls = {
    "cursor" : "pointer",
    "white-space" : "nowrap",
    "margin" : "0 10px",
    "padding" : "5px"
  };
  KIP.Functions.CreateCSSClass(".sidebar .tabs .tab", cls);
  
  // selected / hover tab class
  cls = {
    "background-color" : "#0066ff",
    "color" : "#FFF",
    "border-radius" : "5px"
  }
  KIP.Functions.CreateCSSClass(".sidebar .tabs .tab.selected, .sidebar .tabs .tab:hover", cls);
}

KIP.Objects.Sidebar.prototype.AddTab = function (tabName, tabContent) {
  "use strict";
  var div, idx, obj, that;
  
  if (!this.tabs) this.tabs = [];
  idx = this.tabs.length;
  
  // Add a tab to the tab bar
  div = KIP.Functions.CreateSimpleElement("tab" + idx, "tab", tabName);
  this.elems.innerTabs.appendChild(div);
  
  // Create the object we will store
  obj = {
    tabNameElem: div,
    tabName: tabName,
    tabContent: tabContent
  }
  
  // Add the content of the tab
  if (tabContent.Draw) {
    obj.tabContentElem = tabContent.div;
    obj.tabContentDrawable = tabContent;
    
  } else if (tabContent.appendChild) {
    obj.tabContentElem = tabContent;
  
  } else if (typeof tabContent === typeof "abc") {
    div = KIP.Functions.CreateSimpleElement("content-" + tabName, "tab", tabContent);
    obj.tabContentElem = div;
  }
  
  this.tabs.push(obj);
  
  // Add the click listener the tab will respect
  that = this;
  obj.tabNameElem.addEventListener("click", function () {
    that.SelectTab(idx);
  });
  
  // If this is the default tab, select it to begin with
  if (this.options.defaultTab === idx) {
    this.SelectTab(idx);
  }
}

// Sidebar.SelectTab
//---------------------------------------------------------
/**
 * Selects a tab from the sidebar & queues up its content
 */
KIP.Objects.Sidebar.prototype.SelectTab = function (idx) {
  "use strict";
  
  //Apply the selected class
  KIP.Functions.AddCSSClass(this.tabs[idx].tabNameElem, "selected");
  
  //Remove the old class
  if (this.selectedTab) KIP.Functions.RemoveCSSClass(this.selectedTab, "selected");
  
  this.selectedTab  = this.tabs[idx].tabNameElem;
  
  //Content Swap
  this.elems.tabContent.innerHTML = "";
  if (this.tabs[idx].tabContentDrawable) {
    this.tabs[idx].tabContentDrawable.Draw(this.elems.tabContent);
  } else {
    this.elems.tabContent.appendChild(this.tabs[idx].tabContentElem);
  }
}