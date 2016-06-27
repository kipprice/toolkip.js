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

