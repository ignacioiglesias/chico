/**
* AutoComplete lets you suggest anything from an input element. Use a suggestion service or use a collection with the suggestions.
* @name AutoComplete
* @class AutoComplete
* @augments ch.Controls
* @memberOf ch
* @param {Object} [conf] Object with configuration properties.
* @param {String} conf.url The url pointing to the suggestions's service.
* @param {String} [conf.message] It represent the text when no options are shown.
* @param {Array} [conf.suggestions] The suggestions's collection. If a URL is set at conf.url parametter this will be omitted.
* @returns itself
* @factorized
* @exampleDescription Create a new autoComplete with configuration.
* @example
* var widget = $(".example").autoComplete({
*     "url": "http://site.com/mySuggestions?q=",
*     "message": "Write..."
* });
*/
 
ch.autoComplete = function(conf){

	/**
	* Reference to a internal component instance, saves all the information and configuration properties.
	* @private
	* @name ch.AutoComplete#that
	* @type object
	*/
	var that = this;
		
	conf = ch.clon(conf);
	conf.icon = false;
	conf.type = "autoComplete";
	conf.message = conf.message || "Please write to be suggested";
	conf.suggestions = conf.suggestions;
	conf.jsonpCallback = conf.jsonpCallback || "autoComplete";
	
	that.conf = conf;
		
/**
*	Inheritance
*/
	
	that = ch.controls.call(that);
	that.parent = ch.clon(that);
	
/**
*  Private Members
*/

	/**
	* Select an item.
	* @private
	* @type Function
	* @name ch.AutoComplete#selectItem
	*/
	var selectItem = function (arrow, event) {
		that.prevent(event);

		if (that.selected === (arrow === "bottom" ? that.items.length - 1 : 0)) { return; }
		$(that.items[that.selected]).removeClass("ch-autoComplete-selected");
		
		if (arrow === "bottom") { that.selected += 1; } else { that.selected -= 1; }
		$(that.items[that.selected]).addClass("ch-autoComplete-selected");
	};

/**
*  Protected Members
*/

	/**
	* The number of the selected item.
	* @protected
	* @type Number
	* @name ch.AutoComplete#selected
	*/
	that.selected = -1;

	/**
	* List of the shown suggestions.
	* @protected
	* @type Array
	* @name ch.AutoComplete#suggestions
	*/
	that.suggestions = that.conf.suggestions;

	/**
	* The input where the AutoComplete works.
	* @protected
	* @type jQuery
	* @name ch.AutoComplete#$trigger
	*/
	//that.$trigger = that.$element.addClass("ch-" + that.type + "-trigger");

	/**
	* Inner reference to content container. Here is where the content will be added.
	* @protected
	* @type jQuery
	* @name ch.AutoComplete#$content
	*/
	that.$content = $("<ul class=\"ch-autoComplete-list\"></ul>");

	/**
	* It has the items loaded.
	* @protected
	* @type Boolean
	* @name ch.AutoComplete#behaviorActived
	*/
	that.behaviorActived = false;

	/**
	* It has the items loaded.
	* @protected
	* @type Array
	* @name ch.AutoComplete#items
	*/
	that.items = [];
	
	/**
	* Reference to the Float component instanced.
	* @protected
	* @type Object
	* @name ch.AutoComplete#float
	*/
	that["float"] = that.createFloat({
		"content": that.$content,
		"points": conf.points,
		"points": "lt lb",
		"cache": false,
		"closable": false,
		"aria": {
			"role": "tooltip",
			"identifier": "aria-describedby"
		},
		"width": that.$element.outerWidth() + "px"
	});

	/**
	* It sets On/Off the loading icon.
	* @protected
	* @function
	* @name ch.AutoComplete#loading
	*/
	that.loading = function(show){
		if(show){
			that.$element.addClass("ch-autoComplete-loading");
		} else {
			that.$element.removeClass("ch-autoComplete-loading");
		}
	}

	/**
	* It fills the content inside the element represented by the float.
	* @protected
	* @function
	* @name ch.AutoComplete#populateContent
	*/
	that.populateContent = function (event,result) {
		// No results doesn't anything
		if (result.length===0 || that.element.value==="") {
			that.loading(false);
			that["float"].innerHide();
			return that;
		}
			
		// Only one result and the same as the input hide float and doesn't anything
		if (result.length===1 && result[0]===that.element.value) {
			that.loading(false);
			that["float"].innerHide();
			return that;
		}

		var list = "";
		$.each(result, function (i, e) {
			list+="<li data-index=\""+i+"\">"+e+"</li>";
		})

		that.trigger("contentUnload");
		that.$content.html(list);
		that.selected = -1;
		
		that["float"].content(that.$content);
		
		that.trigger("contentLoaded");
		
		that.items = that.$content.children();
		
		// Adds only once the behavior
		if (!that.behaviorActived) {
			that.suggestionsBehavior(event);
			that.behaviorActived = true;
		}

		that["float"].innerShow();
		that.loading(false);
		return that;
	}

	/**
	* It does the query to the server if configured an URL, or it does the query inside the array given.
	* @protected
	* @function
	* @name ch.AutoComplete#doQuery
	*/
	that.doQuery = function(event){
		var q = that.$element.val().toLowerCase();
		// When URL is configured it will execute an ajax request.
		if (that.element.value !== "" && event.keyCode !== 38 && event.keyCode !== 40  && event.keyCode !== 13  && event.keyCode !== 27) {
			if (that.conf.url !== undefined) {
				that.loading(true);
				var result = $.ajax({
					url: that.conf.url + q + "&callback=" + that.conf.jsonpCallback,
					dataType:"jsonp",
					cache:false,
					global:true,
					context: window,
					jsonp:that.conf.jsonpCallback,
					crossDomain:true
				});
			// When not URL configured and suggestions array were configured it search inside the suggestions array.
			} else if (that.conf.url === undefined) {
				var result = [];
				for(var a=(that.suggestions.length-1);(a+1);a--){
					var word = that.suggestions[a].toLowerCase();
					var exist = word.search(q);
					if(!exist){
						result.push(that.suggestions[a]);
					}
				};
				that.populateContent(event,result);
			}
		}
		return that;
	}

	/**
	* Binds the behavior related to the list.
	* @protected
	* @function
	* @name ch.AutoComplete#suggestionsBehavior
	*/
	that.suggestionsBehavior = function(event){
		// BACKSPACE key bheavior. When backspace go to the start show the message
		ch.utils.document.on(ch.events.KEY.BACKSPACE, function (x, event) {

			// When the user make backspace with empty input autocomplete is shutting off
			if(that.element.value.length===0){
				that.prevent(event);
				that.$element.trigger("blur");
			}

			// When isn't any letter it hides the float
			if(that.element.value.length<=1){
				that["float"].innerHide();
				that.loading(false);
			}

		})
		// ESC key behavior, it closes the suggestions's list 
		.on(ch.events.KEY.ESC, function (x, event) { that.$element.trigger("blur"); })
		// ENTER key behavior, it selects the item who is selected
		.on(ch.events.KEY.ENTER, function (x, event) { that.$element.val($(that.items[that.selected]).text()); that.$element.trigger("blur"); })
		// UP ARROW key behavior, it selects the previous item
		.on(ch.events.KEY.UP_ARROW, function (x, event) { selectItem("up", event); })
		// DOWN ARROW key behavior, it selects the next item
		.on(ch.events.KEY.DOWN_ARROW, function (x, event) { selectItem("bottom", event); });
		// MouseOver & MouseDown Behavior
		that["float"].$content.on("mouseover mousedown",function(evt){
			var event = evt || window.event;
			var target = event.target || event.srcElement;
			var type = event.type;
			if(target.tagName === "LI"){
				// mouse over behavior
				if(type === "mouseover"){
					// removes the class if one is selected
					$(that.items[that.selected]).removeClass("ch-autoComplete-selected");
					// selects the correct item
					that.selected = parseInt(target.getAttribute("data-index"));
					// adds the class to highlight the item
					$(that.items[that.selected]).addClass("ch-autoComplete-selected");	
				} 
				// mouse down behavior
				if(type === "mousedown") {
					that.prevent(event);
					that.$element.val($(that.items[that.selected]).text());
					that.$element.trigger("blur");
				}		
			}
		});
	}

	/**
	* Internal show method. It adds the behavior.
	* @protected
	* @function
	* @name ch.AutoComplete#show
	*/
	that.show = function(event){
		// new callbacks
		that.trigger("show");
		var query = that.element.value;
		that.doQuery(event);
		// Global keyup behavior
		ch.utils.document.on("keyup", function (event) {that.doQuery(event);  });
		//that.$content.html("");

		return that;
	}

	/**
	* Internal hide method. It removes the behavior.
	* @protected
	* @function
	* @name ch.AutoComplete-hide
	*/
	that.hide = function(event){
		that.trigger("hide");
		that.behaviorActived = false;
		that.$content.off("mouseover mousedown");
		ch.utils.document.off("keyup " + ch.events.KEY.ENTER + " " + ch.events.KEY.ESC + " " + ch.events.KEY.UP_ARROW + " " + ch.events.KEY.DOWN_ARROW + " " + ch.events.KEY.BACKSPACE);
		that["float"].innerHide();
		return that;
	}

	/**
	* It gives the main behavior(focus, blur and turn off autocomplete attribute) to the $trigger.
	* @protected
	* @function
	* @name ch.AutoComplete#configBehavior
	*/
	that.configBehavior = function () {
		that.$element
			.bind("focus", function (event) { 				
				that.show(event);
			})
			.bind("blur", function (event) { 
				that.hide(event);
			})
			.attr("autocomplete","off")
			.addClass("ch-" + that.type + "-trigger");
		return that;
	};

/**
*  Public Members
*/
 
	/**
	* @borrows ch.Object#uid as ch.Menu#uid
	*/	
	
	/**
	* @borrows ch.Object#element as ch.Menu#element
	*/

	/**
	* @borrows ch.Object#type as ch.Menu#type
	*/
	
	/**
	* Shows component's content.
	* @public
	* @name ch.AutoComplete-show
	* @function
	* @returns itself
	*/
	that["public"].show = function(){
		that.show();
		return that["public"];
	};

	/**
	* Hides component's content.
	* @public
	* @name ch.AutoComplete#hide
	* @function
	* @returns itself
	*/	
	that["public"].hide = function(){
		that.hide(ch.events.KEY.ESC);
		return that["public"];
	};

	/**
	* Add suggestions to be shown.
	* @public
	* @name ch.AutoComplete#suggest
	* @function
	* @returns itself
	*/	
	that["public"].suggest = function(data){
		that.suggestions = data;
		that.populateContent(window.event,that.suggestions);
		return that["public"];
	};

	
	//Fills the Float with the message.
	//that.populateContent([that.conf.message]);

/**
*  Default event delegation
*/	
	that.configBehavior();
	
	/*that["float"].on("ready", function () {
		that["float"]["public"].width((that.$element.outerWidth()));
	});*/
	
	/**
	* Triggers when the component is ready to use (Since 0.8.0).
	* @name ch.AutoComplete#ready
	* @event
	* @public
	* @exampleDescription Following the first example, using <code>widget</code> as autoComplete's instance controller:
	* @example
	* widget.on("ready",function () {
	*	this.show();
	* });
	*/
	setTimeout(function(){ that.trigger("ready")}, 50);

	return that;
};

ch.factory("autoComplete");