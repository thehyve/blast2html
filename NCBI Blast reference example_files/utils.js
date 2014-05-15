// $Id: utils.js,v 1.4 2014/02/26 14:47:32 zaretska Exp $
    
utils = {

KeyCode_TAB: 9,
KeyCode_DELETE: 46,
KeyCode_BACKSPACE: 8,
KeyCode_LEFT_ARROW: 37,
KeyCode_RIGHT_ARROW: 39,
KeyCode_HOME: 36,
KeyCode_END: 35,
KeyCode_PAGE_UP: 33,
KeyCode_PAGE_DOWN: 34,
KeyCode_UP_ARROW: 38,
KeyCode_DOWN_ARROW: 40,
KeyCode_ESC: 27,
KeyCode_ENTER: 13,
KeyCode_SPACE: 32,
KeyCode_SHIFT_KEY: 16,
KeyCode_CTRL_KEY: 17,
KeyCode_ALT_KEY: 18,
KeyCode_LEFT_MS_WINDOWS_KEY: 91, 
KeyCode_RIGHT_MS_WINDOWS_KEY: 92,
KeyCode_MS_MENU_KEY: 93,
    
isObject: function(a) { return (a && typeof a == 'object'); },

isArray: function(a) { return this.isObject(a) && a.constructor == Array; },
    
insertInHtml: function(text, obj) {
	if (document.all) {
		obj.innerHTML += text;
	} else {
		var range = document.createRange();
		range.setStartAfter(obj);
		var docFrag = range.createContextualFragment(text);
		obj.appendChild(docFrag);
	}
	
},
    
replaceInHtml: function(text, obj) {
	if (document.all) {
		obj.innerHTML = text;
	} else {
		while (obj.hasChildNodes()) obj.removeChild(obj.firstChild);
		var range = document.createRange();
		range.setStartAfter(obj);
		var docFrag = range.createContextualFragment(text);
		obj.appendChild(docFrag);
	}
},
    
    
getTargetObj: function(eEvent) {
    var oTarget;
    var e = eEvent || window.event;
    if (e == null) return null;
    if (e.srcElement == null)  {
        oTarget = e.target;
    } else {
        oTarget = e.srcElement;
    }
    while ( oTarget && oTarget.nodeType != 1 ) oTarget = oTarget.parentNode;
    return oTarget;
},
    



getParent: function(obj) {
     if (obj) {
         var result = obj.parentNode;
         while (result && result.nodeType != 1) result = result.nextSibling;
         if (result) return result;
     }
     return null;
},
    
getFirstChild: function(obj) {
     if (obj) {
         var result = obj.firstChild;
         while (result && result.nodeType != 1) result = result.nextSibling;
         if (result) return result;
     }
     return null;
},
    
getNextSibling: function(obj, tagName) {
    if (obj) {
        var result = obj.nextSibling;    
        if (tagName) {
            var tn = tagName.toUpperCase();
            while (result && result.tagName != tn) result = result.nextSibling;
        } else {
            while (result && result.nodeType != 1) result = result.nextSibling;
        }
        return result;
    }
    return null;
},

getPreviousSibling: function(obj, tagName) {    
     if (obj) {
         var result = obj.previousSibling;    
         if (tagName) {
             var tn = tagName.toUpperCase();
             while (result && result.tagName != tn) result = result.previousSibling;
         } else {
             while (result && result.nodeType != 1) result = result.previousSibling;
         }
         return result;
     }
     return null;
},
    
removeChildren: function(oObj) {
     if (!oObj || typeof oObj != "object") return;
     while(oObj.hasChildNodes()) oObj.removeChild(oObj.firstChild)
},

insertAfter: function(parent, node, referenceNode) {
	parent.insertBefore(node, referenceNode.nextSibling);
},

nextItem: function(item, nodeName) {
    if (item == null) return;
    var next = item.nextSibling;
    while (next != null) {
        if (next.nodeName == nodeName) return next;
        next = next.nextSibling;
    }
    return null;
},

previousItem: function(item, nodeName) {
    var previous = item.previousSibling;
    while (previous != null) {
        if (previous.nodeName == nodeName) return previous;
        previous = previous.previousSibling;
    }
    return null
},

moveBefore: function(item1, item2) {
    var parent = item1.parentNode;
    parent.removeChild(item1);
    parent.insertBefore(item1, item2);
},

moveAfter: function(item1, item2) {
    var parent = item1.parentNode;
    parent.removeChild(item1);
    parent.insertBefore(item1, item2 ? item2.nextSibling : null);
},




createCookie: function(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = '; expires=' + date.toGMTString();
    } else expires = '';
    document.cookie = name + '=' + value + expires + '; path=/';
},

readCookie: function(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return "";
},

eraseCookie: function(name) {
	document.cookie = name + "=null; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=nih.gov; path=/";
	document.cookie = name + "; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=nih.gov; path=/";
},

addClass: function(element, className) {
    if (!this.hasClass(element, className)) {
        if (element.className) element.className += " " + className;
        else element.className = className;
    }
},

removeClass: function(element, className) {
    var regexp = new RegExp("(^|\\s)" + className + "(\\s|$)");
    element.className = element.className.replace(regexp, "$2");
},

hasClass: function(element, className) {
    var regexp = new RegExp("(^|\\s)" + className + "(\\s|$)");
    return regexp.test(element.className);
},


getXY: function (obj){
     /*
     +------------- w ----
     | (x,y)
     |
     h
     |
     */
     var b={x:0, y:0, w:obj.offsetWidth, h:obj.offsetHeight};
     
     if (obj.offsetParent) {
         while(obj) {
             b.x += obj.offsetLeft;
             b.y += obj.offsetTop;
             obj = obj.offsetParent;
         }
     } else if (obj.x) {
         b.x = obj.x;
         b.y = obj.y;
     }
     return b;
},

/* Based on ppk (untested) */
getEventXY: function(e) {
    var xpos = 0;
    var ypos = 0;
    e = e || window.event;
    xpos = e.pageX || (e.clientX + document.body.scrollLeft + 
                    document.documentElement.scrollLeft);
    ypos = e.pageY || (e.clientY + document.body.scrollTop + 
                    document.documentElement.scrollTop);
    return {x: xpos, y: ypos};
},

drawText: function (sText, sId, add) {
    if (!sId) sId = "debug";
    var obj = document.getElementById(sId);
    if (obj) {
        if (add)
            this.insertInHtml("<br/>" + sText, obj);
        else
            this.replaceInHtml(sText, obj);
    }
},


selectRange: function (oObj /*:object*/, iStart /*:int*/, iLength /*:int*/) {
    if (!(oObj && oObj.value)) return;
    
    if (oObj.createTextRange) {
        //use text ranges for Internet Explorer
        var oRange = oObj.createTextRange(); 
        oRange.moveStart("character", iStart); 
        oRange.moveEnd("character", iLength - oObj.value.length);      
        oRange.select();
    } else if (oObj.setSelectionRange) {
        //use setSelectionRange() for Mozilla
        oObj.setSelectionRange(iStart, iLength);
    }     
    //set focus back to the textbox
    oObj.focus();      
},
 
getSelection: function() {
     var text = "";
     if (window.getSelection) {  
         text += window.getSelection();
     } else if (document.getSelection) {  
         text += document.getSelection();
     } else if (document.selection){        //IE
         text += document.selection.createRange().text;
     }
     return text;
},




// http://ejohn.org/apps/jselect/event.html
addEvent: function(obj, type, fn, b) {
    if (obj.attachEvent) {
        var name = "" + type + fn; 
//        name = name.substring(0, name.indexOf("\n"));   // IE  This doesn't work
        obj["e" + name] = fn;
        obj[name] = function(){ obj["e" + name](window.event);}
        obj.attachEvent("on" + type, obj[name]);
    } else {
        obj.addEventListener(type, fn, b);
        return true;
    }
},


removeEvent: function(obj, type, fn, b) {
    if (obj.detachEvent) {
        var name = "" + type + fn; 
//        name = name.substring(0, name.indexOf("\n"));   //IE This doesn't work
        if ("function" == typeof obj[name]) {
            obj.detachEvent("on" + type, obj[name]);
            obj[name] = null;
            obj["e" + name] = null;
        }
    } else {
      obj.removeEventListener(type, fn, b);
      return true;
    }
},
 
noBubbleEvent: function(e) {
	if (e && e.stopPropagation) e.stopPropagation();
	else window.event.cancelBubble = true;
},

targetEvent: function(e) {
     if (e.srcElement == null) {
         return e.target;
     } else {
         return window.event.srcElement;
     }
},

preventDefault: function(e) {
     if (e.preventDefault) e.preventDefault();
     else window.event.returnValue = false;
},

relatedTarget: function(e) {
    if (!e) var e = window.event;
	if (e.relatedTarget)    return e.relatedTarget;
	else if (e.toElement)   return e.toElement;
    else if (e.fromElement) return e.fromElement;
},

readStyle: function(element, property) {
    if (element.style[property]) {
        return element.style[property];
    } else if (element.currentStyle) {
        return element.currentStyle[property];
    } else if (document.defaultView && document.defaultView.getComputedStyle) {
        var style = document.defaultView.getComputedStyle(element, null);
        if (style) return style.getPropertyValue(property);
    } 
    return "";
},


printObj: function (oObj, iLevel) {
     var s = "";
     var sIdent = "";
     if (!iLevel) iLevel = 0;
     for (var i = 0; i < iLevel; i++) {
         sIdent += "__";
     }
     for (var i in oObj) {
         var ss = [];
         if ("string" == typeof oObj[i]) {
             ss = oObj[i].split("<");
         }
         s += sIdent + " " + i + " : [" + (typeof oObj[i]) + "] : " + ss.join("&lt;") + "<br/>";
 //        if (oObj[i] && "object" == typeof oObj[i] && iLevel < 2) {
 //            s+= "<br/>-----" + typeof oObj[i] + " --- " + iLevel + "</br>";
 //            s += this.printObj(oObj[i], iLevel + 1); 
 //        }
     }
     return s;
},

jsLoader:  {
    sBase: "", /* Base is this directory */
    oLoaded: [],
    load: function (aScripts) {
    
       var oS = document.getElementsByTagName("script");
       var k = 0;
       for (var j = 0; j < oS.length; j++) {
           if (oS[j].src == "") continue;
           this.oLoaded[k++] = oS[j].src;
       }

        var oHead = document.getElementsByTagName("head")[0];

        for (var i = 0; i < aScripts.length; i++) {
            var sNewSrc = this.sBase + aScripts[i];
            var oS = document.getElementsByTagName("script");
            var b = true;
            for (var j = 0; j < this.oLoaded.length; j++) {
                if (sNewSrc == this.oLoaded[j]) {
//                    alert(sNewSrc + " : already loaded");
                    b = false;
                }
            }

            if (b) {
                var oScript = document.createElement("script");
                oScript.src = sNewSrc;
                oScript.setAttribute("type", "text/javascript");
                oHead.appendChild(oScript);
                this.oLoaded[this.oLoaded.length] = sNewSrc;
            }
        }
    }
},

// Create an id that doesn't exist in this document
createNewId: function()
{
   var newid = null

   while (!newid || document.getElementById(newid)) {
       newid = "XID" + Math.round(Math.random() * 65536).toString(16)
   }
   return newid
}

};
	
    
String.prototype.trimSpaces = function(trimMode) {
    // 0 = trim begin and end
    // 1 = trim begin only
    // 2 = trim after only

    var targetString = this;
    var iPos = 0;
    if (!trimMode) trimMode = 0;
    
    if (trimMode==0 || trimMode==1) {
        if (targetString.charAt(iPos)==" ") {
            while(targetString.charAt(iPos)==" ") iPos++;
            targetString = targetString.substr(iPos);
        }
    }

    iPos = targetString.length-1;
    if (trimMode==0 || trimMode==2) {
        if (targetString.charAt(iPos) == " ") {
            while(targetString.charAt(iPos) == " ") iPos--;
            targetString = targetString.substr(0, iPos + 1);
        }
    }
    return targetString;
}




/* Shortcuts */

// Get elements by Id's
function $() {
  var elements = new Array();

  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (typeof element == 'string')
      element = document.getElementById(element);

    if (arguments.length == 1)
      return element;

    elements.push(element);
  }

  return elements;
}

// Get elements by AttributeValue for Attributename
// http://www.dustindiaz.com/top-ten-javascript/ (but has some errors)
function $C(attrValue, attrName, node, tag) {          
    //alert([attrValue, attrName, node, tag])
    if ("*" == attrValue) {
        return $AN(attrName, node, tag);
    }
	var oElements = new Array();
	if (!node) node = document;
	if (!tag) tag = '*';
	if (!attrName) attrName = 'class';
    
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp("(^|\\s)" + attrValue + "(\\s|$)");
    var j = 0;
	for (i = 0; i < elsLen; i++) {
		if (attrName == "class" && pattern.test(els[i].className)) {
            // IE behavior
//            oElements.push(els[i]);
            oElements[j++] = els[i];
		} else if (pattern.test(els[i].getAttribute(attrName))) {
			oElements[j++] = els[i];
//			oElements.push(els[i]);
		}
	}
    return oElements;
}


function $AN(attrName, node, tag) {
	var oElements = new Array();
	if (node == null) node = document;
	if (tag == null)tag = '*';
	var els = node.getElementsByTagName(tag);
	for (i = 0; i < els.length; i++) {
		if (els[i].getAttribute(attrName) != null) {
			oElements.push(els[i]);
		}
	}
	return oElements;
}

function dump(aMessage) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(aMessage);
}


// forEach iterators from Dean Edwards: http://dean.edwards.name/weblog/2006/07/enum/
// generic enumeration
Function.prototype.forEach = function(object, block, context) {
    for (var key in object) {
        if (typeof this.prototype[key] == "undefined") {
            block.call(context, object[key], key, object);
        }
    }
};

// globally resolve forEach enumeration
var forEach = function(object, block, context) {
    if (object) {
        var resolve = Object; // default
        if (object instanceof Function) {
            // functions have a "length" property
            resolve = Function;
        } else if (object.forEach instanceof Function) {
            // the object implements a custom forEach method so use that
            object.forEach(block, context);
            return;
        } else if (typeof object.length == "number") {
            // the object is array-like
            resolve = Array;
        }
        resolve.forEach(object, block, context);
    }
};

//
// Update Array class to JS 1.5 if not yet there.
//

// array-like enumeration
if (!Array.forEach) { // mozilla already supports this
    Array.forEach = function(object, block, context) {
        for (var i = 0; i < object.length; i++) {
            block.call(context, object[i], i, object);
        }
    };
}

if (!Array.prototype.indexOf)
	Array.prototype.indexOf = function(item, startIndex) {
		var len = this.length;
		if (startIndex == null)
			startIndex = 0;
		else if (startIndex < 0) {
			startIndex += len;
			if (startIndex < 0)
				startIndex = 0;
		}
		for (var i = startIndex; i < len; i++) {
			var val = this[i] || this.charAt && this.charAt(i);
			if (val == item)
				return i;
		}
		return -1;
	};

if (!Array.prototype.lastIndexOf)
	Array.prototype.lastIndexOf = function(item, startIndex) {
		var len = this.length;
		if (startIndex == null || startIndex >= len)
			startIndex = len - 1;
		else if (startIndex < 0)
			startIndex += len;
		for (var i = startIndex; i >= 0; i--) {
			var val = this[i] || this.charAt && this.charAt(i);
			if (val == item)
				return i;
		}
		return -1;
	};

if (!Array.prototype.map)
	Array.prototype.map = function(func, thisVal) {
		var len = this.length;
		var ret = new Array(len);
		for (var i = 0; i < len; i++)
			ret[i] = func.call(thisVal, this[i] || this.charAt && this.charAt(i), i, this);
		return ret;
	};

if (!Array.prototype.filter)
	Array.prototype.filter = function(func, thisVal) {
		var len = this.length;
		var ret = new Array();
		for (var i = 0; i < len; i++) {
			var val = this[i] || this.charAt && this.charAt(i);
			if(func.call(thisVal, val, i, this))
				ret[ret.length] = val;
		}
		return ret;
	};

if (!Array.prototype.every)
	Array.prototype.every = function(func, thisVal) {
		var len = this.length;
		for (var i = 0; i < len; i++)
			if (!func.call(thisVal, this[i] || this.charAt && this.charAt(i), i, this))
				return false;
		return true;
	};

if (!Array.prototype.some)
	Array.prototype.some = function(func, thisVal) {
		var len = this.length;
		for (var i = 0; i < len; i++)
			if (func.call(thisVal, this[i] || this.charAt && this.charAt(i), i, this))
				return true;
		return false;
	};

