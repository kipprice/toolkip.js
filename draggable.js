KIP.Functions.AllowDragging = function () {
  "use strict";
  var childclick, childmove, childdrop, parentover, parentout, parents, children, idx, v, draggingChild, cls, dropchild;
  
  
  
  // Add the icons to the appropriate elements
  
  
  childclick = function (elem, idx) {
    elem.addEventListener("mousedown", function (e) {
      if (draggingChild) {
        KIP.Functions.RemoveCSSClass(draggingChild.elem, "dragging");
      }
      KIP.Functions.AddCSSClass(elem, "dragging");
      draggingChild = {
        elem: elem,
        parent: null,
        sibling: null
      };
      
      elem.style.left = e.x + "px";
      elem.style.top = e.y + "px";
    });
 
  };
  
  window.addEventListener("mousemove", function (e) {
    if (draggingChild) {
      draggingChild.elem.style.left = e.x + "px";
      draggingChild.elem.style.top = e.y + "px";
    }
  });
  
  childdrop = function (elem, idx) {
    elem.addEventListener("mouseup", function () {
      
      KIP.Functions.RemoveCSSClass(elem, "dragging");
      if (draggingChild.parent) {
        
        
        if (draggingChild.sibling) {
          elem.parentNode.removeChild(elem);
          draggingChild.parent.insertBefore(elem,draggingChild.sibling);
           KIP.Functions.RemoveCSSClass(draggingChild.sibling, "magnetDown");
        } else if (draggingChild.parent !== elem.parentNode) {
          elem.parentNode.removeChild(elem);
          draggingChild.parent.appendChild(elem);
        }
      }
      
      draggingChild = null;
    });
   
  };
  
  parentover = function (parent, idx) {
    parent.addEventListener("mouseover", function (e) {
      if (draggingChild) {
        draggingChild.parent = parent;
        if (KIP.Functions.FindCommonParent(e.target, parent) !== document.body) {
          if (e.target !== draggingChild.elem) {
            draggingChild.sibling = e.target;
            KIP.Functions.AddCSSClass(draggingChild.sibling, "magnetDown");
          }
        }
      }
    });
  };
  
  parentout = function (parent, idx) {
    parent.addEventListener("mouseout", function (e) {
      if (draggingChild) {
        if (KIP.Functions.FindCommonParent(e.target, parent) !== document.body) {
          if (e.target !== draggingChild.elem) {
            draggingChild.sibling = e.target;
            KIP.Functions.AddCSSClass(draggingChild.sibling, "magnetDown");
          }
        } else if (draggingChild.parent === parent) {
          draggingChild.parent = null;
          if (draggingChild.sibling) {
            KIP.Functions.RemoveCSSClass(draggingChild.sibling, "magnetDown");
            draggingChild.sibling = null;
          }
          
        }

      }
     
    });
  };
  
  // First, find all elements that allow dragging
  children = KIP.Functions.GetElementsByAttribute("kip.draggable", "*");
  for (idx = (children.length - 1); idx >= 0; idx -= 1) {
    v = children[idx].getAttribute("kip.draggable");
    if (v === "false") {
      children.splice(idx, 1);
    } else {
      
      childclick(children[idx], idx);
      childdrop(children[idx], idx);
      
      children[idx].style.cursor = "-webkit-grab";
      
    }
  }
  
  // Second, find all parents that allow dragging
  parents =  KIP.Functions.GetElementsByAttribute("kip.droptarget", "*");
   for (idx = (parents.length - 1); idx >= 0; idx -= 1) {
    v = parents[idx].getAttribute("kip.droptarget");
    if (v === "false") {
      parents.splice(idx, 1);
    } else {
      parentover(parents[idx], idx);
      parentout(parents[idx], idx);
    }
  }
  
  cls = {
    "position" : "absolute",
    "box-shadow" : "2px 2px 15px 4px rgba(0,0,0,.3)"
  };
  KIP.Functions.CreateCSSClass(".dragging", cls);
  
   cls = {
    "margin-top" : "15px"
  };
  KIP.Functions.CreateCSSClass(".magnetDown", cls);
 
    
};

KIP.Functions.GetElementsByAttribute = function (attr, value) {
  "use strict";
  var elems, e, el, nl;
  nl = [];
  elems = document.getElementsByTagName("*");
  
  for (e = 0; e < elems.length; e += 1) {
    el = elems[e];
    if (el.hasAttribute && el.hasAttribute(attr)) {
      
      if (value === "*" || (el.getAttribute(attr) === value)) {
        nl.push(el);
      }
    }
  }
  
  return nl;
  
};