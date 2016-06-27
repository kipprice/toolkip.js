/*globals KIP,document*/

// Shield
//------------------------------------------
/**
 * Creates an overlay that prevents the user from taking actions underneath, when data is loading
 * @param {string} id   - The identifier to use for this shield
 * @param {string} type - The type of info the shield will display. Options are "plain", "trivia", "game"
 * @class Shield
 */
KIP.Objects.Shield = function (id, type) {
  "use strict";
  this.id = id;
  this.entertainmentType = type || "plain";
  this.addEntertainment = true;

  this.options = {
    animateSpeed : 300
  }
  
  // Create the general div & use it to block events
  KIP.Objects.Drawable.call(this, "shield" + id, "shield");
  this.div.addEventListener("click", function (e) {
    e.stopPropagation();
    return false;
  });
  
  // Create the container that will hold whatever display we opt for
  this.container = KIP.Functions.CreateSimpleElement("shield" + this.id + "|container", "container");
  this.div.appendChild(this.container);
}

// Inherit from Drawable
KIP.Objects.Shield.prototype = Object.create(KIP.Objects.Drawable.prototype);

// Shield.Show
//------------------------------------------------
/**
 * Draws the shield as the topmost element on the screen
 */
KIP.Objects.Shield.prototype.Show = function () {
  "use strict";
  var aFunc;
  if ((!this.noStyles) && (!this.addedStyles)) {
    this.AddStyles();
    this.addedStyles = true;
  }
  if (this.addEntertainment) {
    this.AddEntertainment(this.entertainmentType);
  } else if (this.animateFunc) {
    aFunc = this.animateFunc;
    this.animate = window.setInterval(aFunc, this.options.animateSpeed);
  }
  this.Draw(document.body);
}

// Shield.Hide
//-------------------------------------------------
/**
 * Removes the shield from the screen
 */
KIP.Objects.Shield.prototype.Hide = function () {
  "use strict";
  this.Erase();
  if (this.animate) {
    window.clearInterval(this.animate);
  }
}

// Shield.AddEntertainment
//------------------------------------------------------------
/**
 * Creates the content of the shield. If a type is not specified on the shield, shows a generic "loading" display.
 */
KIP.Objects.Shield.prototype.AddEntertainment = function () {
  "use strict";
  var div, frm, aFunc;
  frm = 0;

  switch(this.type) {

    // Knowledge: fun facts
    case "trvia":
      break;

    // Game : keyboard DDR
    case "game":
      break;

    // Default: a regular "loading" display
    default:
      div = KIP.Functions.CreateSimpleElement("", "plain", "Loading");

      // Animate the "..."
      this.animateFunc = aFunc = function () {
        var s;
        frm += 1;
        s = "";
        switch (frm % 6){
          case 0: 
            s = "";
            break;
          case 1:
            s = ".";
            break;
          case 2:
            s = "..";
            break;
          case 3:
          case 4:
          case 5:
            s = "...";
            break;
        }
        div.innerHTML = "Loading" + s;
      }

      // Track the animation so we can remove it as appropriate
      this.animate = window.setInterval(aFunc, this.options.animateSpeed);
      break;
  }

  // Actually add the entertainment we have created
  this.container.appendChild(div);
  this.addEntertainment = false;
}

// Shield.AddStyles
//-----------------------------------------------------
/**
 * Add the appropriate CSS to show the shield
 */
KIP.Objects.Shield.prototype.AddStyles = function () {
  "use strict";
  var cls;
  if (KIP.Globals.AddedShieldStyles) return;

  // ====== SHIELD STYLES ====== //
  cls = {
    "background-color" : "rgba(0,0,0,0.7)",
    "position" : "fixed",
    "left" : "0",
    "top" : "0",
    "width": "100%",
    "height" : "100%"
  };
  KIP.Functions.CreateCSSClass(".shield", cls);

  // ====== CONTAINER STYLES ===== //
  cls = {
    "display" : "flex",
    "align-items" : "center",
    "justify-content" : "center",
    "height" : "100%"
  };
  KIP.Functions.CreateCSSClass(".shield .container", cls);

  // ===== PLAIN STYLES ===== //
  cls = {
    "font-family": '"Segoe UI", "Calibri", "Arial"',
    "font-size" : "25px",
    "color" : "#FFF",
    "text-align" : "left",
    "width" : "170px"
  };
  KIP.Functions.CreateCSSClass(".shield .plain", cls);

}
