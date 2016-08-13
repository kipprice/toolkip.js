KIP.Objects.Tutorial = function (options) {
	"use strict";
	this.screens = [];
	this.elems = {};
	this.currentScreen = null;
	this.currentInline = null;

	this.options = options || {};

	// Use our default settings if the user didn't pass in settings
	KIP.Functions.ReconcileOptions(this.options, {
		preferFullScreen: true,
		useStandardStyles: true
	});

	// Create the div that will hold things
	KIP.Objects.Drawable.call(this, "tutorial", "tutorial");

	// Create other elements
	this.CreateElements();
};

KIP.Objects.Tutorial.prototype = Object.create(KIP.Objects.Drawable.prototype);

KIP.Objects.Tutorial.prototype.AddScreen = function (title, content, idx) {
	"use strict";
	var btn, that = this;
	// Find an appropriate index for either conflicts or missing indices
	if (!idx && (idx !== 0)) {
		idx = this.screens.length;
	} else if (this.screens[idx]) {
		this.screens.splice(idx, 0, {});
	}

	// Also add an element to our nav bar
	btn = KIP.Functions.CreateSimpleElement("screen" + idx, "screen btn", "", "", "", this.elems.screens);
	btn.addEventListener("click", function () {
		that.GotoScreen(idx);
	});

	// Add to our array
	this.screens[idx] = {
		title: title,
		content: content,
		idx: idx,
		hilites : [],
		btn : btn
	};


	// If this is the first screen we are adding, we should show it
	if (idx === 0 && !this.shown) {
		this.GotoScreen(0);
	}

	// Return with the index this was drawn at
	return idx;
};

KIP.Objects.Tutorial.prototype.AddHilitedElement = function (elem, content, screenIdx) {
	"use strict";
	var screen;

	// GRAB THE SCREEN THIS APPLIES TO
	screen = this.screens[screenIdx];
	if (!screen) return -1;

	screen.hilites.push({
		elem: elem,
		content: content
	});

	if (this.currentScreen === screenIdx) {
		this.GotoScreen(this.currentScreen);
	}

	return (screen.hilites.length - 1);

};

//#region Showing and hiding
KIP.Objects.Tutorial.prototype.Show = function () {
	"use strict";
	this.AddStandardStyles();
	document.body.appendChild(this.div);
	KIP.Functions.AddCSSClass(this.div, "visible");
	this.shown = true;
};

KIP.Objects.Tutorial.prototype.Hide = function () {
	"use strict";
	var that = this;
	KIP.Functions.RemoveCSSClass(this.div, "visible");
	this.shown = false;
	window.setTimeout(function () {
		document.body.removeChild(that.div);
	}, 200);

};

KIP.Objects.Tutorial.prototype.ShowInlineHelp = function () {
	"use strict";
};

KIP.Objects.Tutorial.prototype.HideInlineHelp = function () {
	"use strict";
};
//#endregion

KIP.Objects.Tutorial.prototype.NextScreen = function () {
	"use strict";
	var idx;
	idx = ((this.currentScreen + 1) % this.screens.length);
	this.GotoScreen(idx);
};

KIP.Objects.Tutorial.prototype.PreviousScreen = function () {
	"use strict";
	var idx;
	idx = (this.currentScreen - 1);
	if (idx < 0) idx = (this.screens.length - 1);
	this.GotoScreen(idx);
};

KIP.Objects.Tutorial.prototype.GotoScreen = function (idx) {
	"use strict";
	var screen, dot, hElem, hIdx, circle, hilite, lbl, box, clone, bg;

	// First grab the screen from the index
	screen = this.screens[idx];

	// Add the title as inner HTML
	this.elems.title.innerHTML = screen.title;

	// The description can be just words or it can be nested HTML elements
	if (typeof screen.content === typeof "abc") {
		this.elems.description.innerHTML = screen.content;
	} else {
		this.elems.description.innerHTML = "";
		this.elems.description.appendChild(screen.content);
	}

	// Unhilite the old dot
	if (this.currentScreen || (this.currentScreen === 0)) {
		dot = this.screens[this.currentScreen].btn;
		if (dot) {
			KIP.Functions.RemoveCSSClass(dot, "selected");
		}
	}

	// Set the current screen and hilite it's dot
	this.currentScreen = idx;
	dot = screen.btn;
	if (dot) {
		KIP.Functions.AddCSSClass(dot, "selected");
	}

	// Also show any hilited elements here
	this.elems.hilites.innerHTML = "";
	for (hIdx = 0; hIdx < screen.hilites.length; hIdx += 1) {
		hilite = screen.hilites[hIdx];
		if (!hilite) continue;

		hElem = KIP.Functions.CreateSimpleElement("hilite" + idx + "|" + hIdx, "hilite", "", "", "", this.elems.hilites);

		// clone the element and stick it on top of the z-index here
		box = hilite.elem.getBoundingClientRect();
		bg = KIP.Functions.CreateSimpleElement("", "clone", "", "", "", hElem);
		bg.style.top = (box.top + "px");
		bg.style.left = (box.left + "px");
		bg.style.width = (box.width + "px");
		bg.style.height = (box.height + "px");
		
		//clone = hilite.elem.cloneNode(true);
		//bg.appendChild(clone);

		lbl = KIP.Functions.CreateSimpleElement("", "lbl", hilite.content, "", "", hElem);
		lbl.style.top = (box.top + box.height + 6) + "px";
		lbl.style.left = (box.left) + "px";
		
		// Check if the content needs a mask
		if (KIP.Functions.DoElementsOverlap(bg, this.elems.description)) {
			//KIP.Functions.AddCSSClass(this.elems.content, "mask");
		} else if (KIP.Functions.DoElementsOverlap(clone, this.elems.title)) {
			//KIP.Functions.AddCSSClass(this.elems.content, "mask");
		} else {
			//KIP.Functions.RemoveCSSClass(this.elems.content, "mask");
		}
	}
};

KIP.Objects.Tutorial.prototype.AddInlineHelp = function (elem, content) {
	"use strict";
};

KIP.Objects.Tutorial.prototype.NextInlineHelp = function () {
	"use strict";
};

KIP.Objects.Tutorial.prototype.PreviousInlineHelp = function () {
	"use strict";
};

KIP.Objects.Tutorial.prototype.CreateElements = function () {
	"use strict";
	var that = this;
	
	// HILIGHTED ELEMENTS
	this.elems.hilites = KIP.Functions.CreateSimpleElement("hilites", "hilites", "", "", "", this.div);

	// CONTENT CONTAINER
	this.elems.content = KIP.Functions.CreateSimpleElement("content", "content", "", "", "", this.div);
	this.elems.wrapper = KIP.Functions.CreateSimpleElement("wrapper", "wrapper", "", "", "", this.elems.content);
	this.elems.title = KIP.Functions.CreateSimpleElement("title", "title", "", "", "", this.elems.wrapper);
	this.elems.description = KIP.Functions.CreateSimpleElement("desc", "description", "", "", "", this.elems.wrapper);

	// NAVIGATIONAL ELEMENTS
	this.elems.nav = KIP.Functions.CreateSimpleElement("nav", "nav", "", "", "", this.div);
	this.elems.previous = KIP.Functions.CreateSimpleElement("previousBtn", "prev btn", "PREVIOUS", "", "", this.elems.nav);
	this.elems.screens = KIP.Functions.CreateSimpleElement("screens", "screens", "", "", "", this.elems.nav);
	this.elems.next = KIP.Functions.CreateSimpleElement("nextBtn", "next btn", "NEXT", "", "", this.elems.nav);

	// NAV LISTENERS
	this.elems.next.addEventListener("click", function ()
	{
		that.NextScreen();
	});

	this.elems.previous.addEventListener("click", function () {
		that.PreviousScreen();
	});

	// CLOSE BUTTON
	this.elems.closeWrapper = KIP.Functions.CreateSimpleElement("closeWrapper", "closeWrapper", "", "", "", this.div);
	this.elems.close = KIP.Functions.CreateSimpleElement("close", "close btn", "CLOSE", "", "", this.elems.closeWrapper);
	this.elems.close.addEventListener("click", function () {
		that.Hide();
	});
};

KIP.Objects.Tutorial.prototype.AddStandardStyles = function () {
	"use strict";
	var cls;
	if (KIP.Globals.StylesAdded.Tutorial) return;
	if (!this.options.useStandardStyles) return;

	KIP.Globals.StylesAdded.Tutorial = true;

	// Actually add the classes that we need

	// ===== TUTORIAL CLASS =====
	cls = {
		top: 0,
		left: 0,
		position: "fixed",
		width: "100%",
		height: "100%",
		"background-color" : "rgba(0,0,0,.8)",
		opacity: 0,
		transition: "opacity .2s ease-in-out",
		"font-family" : '"Segoe UI", "Calibri", sans-serif',

		"user-select" : "none",
		"-moz-user-select" : "none",
		"-webkit-user-select" : "none",
		"khtml-user-select" : "none",
		"o-user-select" : "none"

	};
	KIP.Functions.CreateCSSClass(".tutorial", cls);

	// ==== TUTORIAL VISIBLE CLASS ====
	cls = {
		opacity: 1
	};
	KIP.Functions.CreateCSSClass(".tutorial.visible", cls);

	// ==== TITLE CLASS =====
	cls = {
		color: "#FFF",
		"font-size" : "2em"
	};
	KIP.Functions.CreateCSSClass(".tutorial .content .title", cls);

	// ===== CONTENT CONTAINER CLASS =====
	cls = {
		display: "flex",
		"justify-content" : "center",
		height: "100%"

	};
	KIP.Functions.CreateCSSClass(".tutorial .content", cls);
	
	cls = {
		"background-color" : "rgba(0,0,0,.6)",
		"padding" : "5px"
	};
	KIP.Functions.CreateCSSClass(".tutorial .mask .title, .tutorial .mask .description", cls);

	// ===== CONTENT WRAPPER CLASS =====
	cls = {
		display: "flex",
		"justify-content" : "center",
		"flex-direction" : "column",
		"z-index" : 1

	};
	KIP.Functions.CreateCSSClass(".tutorial .wrapper", cls);

	// ===== CONTENT CLASS =====
	cls = {
		color: "#FFF"
	};
	KIP.Functions.CreateCSSClass(".tutorial .content .description", cls);

	// ===== NAVIGATION CONTAINER CLASS =====
	cls = {
		position: "absolute",
		left: 0,
		width: "100%",
		display: "flex",
		"justify-content" : "center",
		top: "calc(100% - 1.5em)",
		"font-size" : "1em",
		"color" : "#FFF"
	}
	KIP.Functions.CreateCSSClass(".tutorial .nav", cls);

	// ==== BUTTON CLASS ====
	cls = {
		transition : "all ease-in-out .1s",
		margin: "0px 5px",
		cursor: "pointer",
		opacity: ".8",
		"z-index" : 1
	}
	KIP.Functions.CreateCSSClass(".tutorial .btn", cls);

	// ===== SCREEN DOT CONTAINER CLASS ======
	cls = {
		display: "flex",
		"justify-content" : "center",
		"align-items" : "center"
	}
	KIP.Functions.CreateCSSClass(".tutorial .nav .screens", cls);

	// ===== SCREEN SELECTION DOTS =====
	cls = {
		"background-color" : "#FFF",
		"border-radius" : "0.7em",
		height: "0.7em",
		width: "0.7em",
		opacity: ".5"
	}
	KIP.Functions.CreateCSSClass(".tutorial .screen.btn", cls);

	// ==== BUTTON HOVER OR SELECTED CLASS =====
	cls = {
		transform : "scale(1.1)",
		opacity: "1"
	}
	KIP.Functions.CreateCSSClass(".tutorial .btn:hover, .tutorial .btn.selected", cls);

	// ==== CLOSE BUTTON CLASS ====
	cls = {
		position: "absolute",
		top: "0.5em",
		color : "#FFF",
		width: "100%",
		left: 0,
		display: "flex",
		"justify-content" : "flex-end"
	};
	KIP.Functions.CreateCSSClass(".tutorial .closeWrapper", cls);

	// ==== HILITE CIRCLE CLASS =====
	cls = {
		position: "absolute",
		border: "dotted 2px #FFF",
		"background-color" : "rgba(255,255,255,.2)"

	};
	KIP.Functions.CreateCSSClass(".tutorial .circle, .tutorial .clone", cls);

	// ==== HILITE LABEL CLASS  =====
	cls = {
		position: "absolute",
		color: "#FFF",
		"padding-left" : "0.1em"
	}
	KIP.Functions.CreateCSSClass(".tutorial .lbl", cls);

}

