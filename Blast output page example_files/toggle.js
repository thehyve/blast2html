
Toggle = function(node) {
   this.init(node);
}

/**
* @class Creates a  new Toggle class with "node" as src
* @return Reutrns a new toggle instance
*/
Toggle.prototype = {
   
   init: function(node) {

      // Subclass instance?
      if (typeof(arguments[0]) == 'undefined') return;

      var oThis = this;
      this.node = node;

      // Initialize "showing" variable based on presence of "showing" or
      // "hiding" class. If neither, then showing. Be sure class is
      // set to reflect variable value
      node.showing =
         utils.hasClass(node, "showing") || !utils.hasClass(node, "hiding");
      utils.addClass(node, node.showing ? "showing" : "hiding");
   
      // Set notifier for node
      utils.addEvent(node, "click", function(e) {
         e = e || window.event;
         utils.preventDefault(e);

         var theNode = utils.getTargetObj(e);

         // Send message to global notifier, if one exists
         if (typeof(Notifier) != 'undefined') {
            var notifier = Notifier.getInstance();            
            // Notify before change
            notifier.Notify(oThis, "change:" + theNode.id, !this.showing);
         }

         // Hide or show based on current state
         if (this.showing) {
             oThis.hide();
         } else {
             oThis.show();
         }

      }, false);
      
      utils.addEvent(node, "selectstart", function(e) { utils.preventDefault(e); }, true);
      utils.addEvent(node, "drag", function(e) { utils.preventDefault(e); }, true);

      // Cache "this" for ID lookup
      if (!node.id) {
          node.id = utils.createNewId();
      }
      var m = Toggle.getSrcs();
      m[node.id] = this;
   },

   // Hide targets, and set self to hiding.
   hide: function() {
       var oThis = this;

       oThis.setHiding();
       if (oThis.listeners) {
           forEach(oThis.listeners, function(l) {
               oThis.hideTarget(l);
           });
       }
   },

   // Show targets, and set self to showing.
   show: function() {
       var oThis = this;

       oThis.setShowing();
       if (oThis.listeners) {
           forEach(oThis.listeners, function(l) {
               oThis.showTarget(l);
           });
       }
   },

   // Set own presentation to "showing"
   setShowing: function() {
       utils.addClass(this.node, "showing");
       utils.removeClass(this.node, "hiding");
       this.node.showing = true;
   },

   // Set own presentation to "hiding"
   setHiding: function() {
       utils.addClass(this.node, "hiding");
       utils.removeClass(this.node, "showing");
       this.node.showing = false;
   },

   // Show a target
   showTarget: function(l) {
       utils.addClass(l, "shown");
       utils.removeClass(l, "hidden");
   },

   // Hide a target
   hideTarget: function(l) {
      utils.addClass(l, "hidden");
      utils.removeClass(l, "shown");
   },

   // Add a target to this toggle.
   add: function(target) {
      if (!this.listeners) {
          this.listeners = new Array();
      }
      this.listeners[this.listeners.length] = target;

      if (utils.hasClass(target, "hidden")) {
        this.setHiding();
        this.node.showing = false;
      } else {
        this.setShowing();
        this.node.showing = true;
      }
   }
}

// Show/hide a "target" (a node controlled by the node with the given ID)
Toggle.addTarget = function(srcid, target) {
   var tn = Toggle.findOrMake(srcid);
   tn.add(target);
}

// Assoc array of srcs indexed by their ids
Toggle.getSrcs = function() {
   if (!Toggle.srcs) {
      Toggle.srcs = new Object();
   }
   return Toggle.srcs;
}

// Find or make toggle for given id
Toggle.findOrMake = function(srcid) {
   var ts = Toggle.getSrcs();
   var tn = ts[srcid];
   if (!tn) {
      tn = new Toggle($(srcid));
   }
   return tn;
}

// This dispatches the call to Toggle.onload, which may be
// overridden by instances (subclasses)
Toggle._onload = function() {
   Toggle.onload();
}

// A toggle source node controls other nodes that reference it by id using
// their toggle= attribute. A node may be both a toggle source and destination.
Toggle.onload = function() {
//alert("toggle start");
   if(utils.hasClass(document.body,"noToggleCheck")) return;
      
   shnodes = jQuery("[toggle]");
   // Now hook up dst nodes
   forEach(shnodes, function(node) {
      // Link toggle node to its source
      var srcid = node.getAttribute("toggle");
      Toggle.addTarget(srcid, node);
   });
    //alert("toggle 2 end");
}

utils.addEvent(window, 'load', Toggle._onload, false);
