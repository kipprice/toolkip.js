KIP.Objects.Shield = function (id, type) {
  "use strict";
  this.id = id;
  this.entertainmentType = type || "plain";
  this.addEntertainment = true;
  
  // Create the general div
  KIP.Objects.Drawable.call(this, "shield" + id, "shield");
  
  // Create the container that will hold whatever display we opt for
  this.container = KIP.Functions.CreateSimpleElement("shield" + this.id + "|container", "container");
  this.div.appendChild(this.container);
}

// Inherit from Drawable
KIP.Objects.Shield.prototype = Object.create(KIP.Objects.Drawable.prototype);


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
    this.animate = window.setInterval(aFunc, 300);
  }
  this.Draw(document.body);
}

KIP.Objects.Shield.prototype.Hide = function () {
  "use strict";
  this.Erase();
  if (this.animate) {
    window.clearInterval(this.animate);
  }
}

KIP.Objects.Shield.prototype.AddEntertainment = function (type) {
  "use strict";
  var div, frm, aFunc;
  frm = 0;

  switch(type) {

    // Knowledge: fun facts
    case "knowledge":
      break;

    // Game : keyboard DDR
    case "game":
      break;

    // Default: a regular "loading" display
    default:
      div = KIP.Functions.CreateSimpleElement("", "plain", "Loading");
      this.animateFunc = aFunc = function () {

        var s;
        frm += 1;
        s = "";
        switch (frm % 5){
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
            s = "...";
            break;
        }
        div.innerHTML = "Loading" + s;
      }
      this.animate = window.setInterval(aFunc, 300);
      break;
  }

  this.container.appendChild(div);
  
  this.addEntertainment = false;
}

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
