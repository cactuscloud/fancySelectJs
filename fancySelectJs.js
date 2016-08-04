/**
*
*
*
*
*/

function fancySelectJs() {
	
	//Constants
	this.DELIMITER = ",";
	
	
	//DOM elements
	//The new select box which will be visible
	this.select = null;
	//The text which may reside within the select box
	this.selectText = null;
	//The dropdown box which will popup
	this.dropdown = null;
	//The object from which this element is based
	this.template = null;
	//The scroll parent (for correct drop down positioning)
	this.parent = null;
	
	//Mode
	this.multiple = false;
	this.disabled = false;
	this.length = 0;//Number of options
	
	//Session
	this.options = [];
	this.values = [];
	this.selectedIndices = [];
	
	//State
	this.frameRequested = false;
	this.dropdownTop;
	this.dropdownLeft;
	this.dropdownWidth;
	this.dropdownVisible = false;
	
	//Styling
	this.placeholder = "";
	this.multiplePlaceholder = "Multiple Values";
	this.allPlaceholder = "All";

}

/** 
*	fancySelectJs constructor.  Builds a new fancySelectJs instance from a given SELECT element.  A
*	scroll parent element may be optionally supplied.  A scroll parent should only be supplied when
*	the dropdown is placed on a modal or other "position: fixed" element.  Without this, the dropdown
*	will be positioned relative to the document body and not the floating parent element.
*
*	Useful attributes to set on the parent element:
*	//	-	id						The new select have the same ID (proceeded by "fs_")
*	
*		-	class					This class will be applied to the new select box
*		-	data-placeholder		The placeholder
*		-	multiple				Should this be a multiselect
*		-	data-value				The starting value of the select
*		-	data-scroll-parent		The JS compatible element ID of the scrollparent
*		-	disabled				This will pass through
*		
*/
fancySelectJs.prototype.init = function(el, scrollParent) {
	this.template = el;
	
	//Get placeholder values from the template element
	this.placeholder = el.getAttribute("data-placeholder") || "";
	this.multiple = el.multiple;
	el.size = 1;//Normalize the height of the initial select
	
	//Get value
	var selections = [];
	if(el.hasAttribute("data-value")) {
		if(this.multiple) selections = el.getAttribute("data-value").split(this.DELIMITER);
		else selections.push(el.getAttribute("data-value"));
	} else {
		if(this.multiple) selections = ($(el).val() + "").split(",");
		else selections.push($(el).val());
	}
	
	//Get contents and selections
	var options = el.children, o, v, n;
	for(var i = 0, j = options.length; i < j; i++) {
		o = options[i];
		v = o.getAttribute("value");
		n = {value : v, label : options[i].innerHTML};
		this.options.push(n);
		if(v in selections) {
			this.values.push(n);
			this.selectedIndices.push(i);
		}
	}
	
	//Handle scroll parent
	var doc = document;
	if(el.hasAttribute("data-scroll-parent")) {
        var sp = doc.getElementById(el.getAttribute("data-scroll-parent"));
        if(typeof(sp) !== "undefined" && sp != null) this.parent = sp;
		else this.parent = doc.body;
    } else this.parent = doc.body;
	
	this.buildGui(el);
	
	this.setEventListeners();
	
	this.updateValues();
	
	if(el.disabled) this.disable();
	
	//Hide the old box and replace it with the new one
	el.style.display = "none";
    el.parentElement.insertBefore(this.select, el);
	
	//Add the dropdown to the page
	this.parent.appendChild(this.dropdown);
	
	//Store this instance on the original select
	//el.fancySelectJs = this;
	
}



/* Construction functions */

/**
*	Builds the GUI elements of the fancySelectJs.
*/
fancySelectJs.prototype.buildGui = function(el) {
	var doc = document;
	
	//Create the dropdown bounding box
	var selectBox = doc.createElement("div");
	selectBox.className = "fancySelectJs "+el.className;
    selectBox.display = $(el).css("display");
    selectBox.style.display = $(el).css("display");
    selectBox.style.opacity = $(el).css("opacity");
    selectBox.setAttribute("role","listbox");

	//Create the inner portion of the dropdown
	var inner = doc.createElement("div");
	inner.className = "select";
	inner.tabIndex = 0;
	inner.style.lineHeight = $(el).outerHeight()+"px";
	inner.style.height = $(el).css("height");
	inner.style.width = el.style.width || $(el).css("width");
	selectBox.appendChild(inner);
	
	//Create the dropdown
	var dropdown = doc.createElement("div");
	dropdown.className = "fancySelectJs_dropdown";
	if(this.multiple) dropdown.setAttribute("data-multiple", "true");
	
	//Fill the dropdown
	var options = el.children, dropdownInner = "";
	for(var i = 0, j = options.length; i < j; i++) {
		if(this.multiple) dropdownInner += "<div role=\"option\" class=\"option\" aria-checked=\"false\">" + options[i].innerHTML + "</div>";
		else dropdownInner += "<div role=\"option\" class=\"option\" aria-selected=\"false\">" + options[i].innerHTML + "</div>";
	}
	
	dropdown.innerHTML = dropdownInner;
	
	this.selectText = inner;
	this.select = selectBox;
	this.dropdown = dropdown;
}

/**
*	Assignes the event listeners required for the fancySelectJs to operate.
*/
fancySelectJs.prototype.setEventListeners = function() {
	
	//Window events
	$(window).on("resize orientationchange", this.queuePositionDropdown.bind(this));
	
	//Select events
	$(this.select).on("click", this.selectClick.bind(this));
	
	//Select content events
	$(this.selectText).on("blur",this.blur.bind(this));
	
	//Dropdown events
	$(this.dropdown).on("mousedown", this.dropdownMousedown.bind(this));
    
    
    /*
   
    $(el).closest("form").on("reset", this.reset.bind(this));

	
	if(this.multiSelect) $(input).on("keydown",this.fs_ms_InputKeyPress.bind(this));
    else $(input).on("keydown",this.fsInputKeyPress.bind(this));
	*/
	//Option events
	$(this.dropdown.children).on("click", this.optionClick).bind(this);
	$(this.dropdown.children).on("mousemove", this.optionHover).bind(this);
	
}

/* Destruction functions */
/**
*	Destroys a fancySelectJs instance and its associated HTML elements.  This will free up the data associated
*	with this instance to be ready for garbage collection.  This should be run before deleting a 
*	fancySelectJs instance through code.
*/
fancySelectJs.prototype.destroy = function() {
	this.dropdown.innerHTML = "";
	this.select.innerHTML = "";
	this.dropdown.parentNode.removeChild(this.dropdown);
	this.select.parentNode.removeChild(this.select);
	this.select = null;
	this.selectText = null;
	this.dropdown = null;
	this.template = null;
	this.parent = null;
	this.options = null;
	this.values = null;
	this.selectedIndices = null;
}

/* Display update functions */
/**
*	Updates the element to match the values stored in this.values and this.selectedIndices. This
*	function should be run upon initialization and after every update.
*/
fancySelectJs.prototype.updateValues = function() {
	//Update the dropdown
	var options = this.dropdown.children, o;
	for(var i = 0, j = options.length; i < j; i++) {
		o = options[i];
		if(i in this.selectedIndices) {
			if(this.multiple) {
				o.setAttribute("aria-checked", "true");
				o.setAttribute("data-checked", "true");
			} else {
				o.setAttribute("aria-selected", "true");
				o.setAttribute("data-selected", "true");
			}
		} else {
			if(this.multiple) {
				o.setAttribute("aria-checked", "false");
				o.removeAttribute("data-checked");
			} else {
				o.setAttribute("aria-selected", "false");
				o.removeAttribute("data-selected");
			}
		}
	}
	//Update the select box
	var selectionCount = this.selectedIndices.length;
	if(selectionCount == 0) {
		this.selectText.innerHTML = this.placeholder;
		this.selectText.setAttribute("data-placeholder", "true");
	} else {
		this.selectText.removeAttribute("data-placeholder");
		if(selectionCount == 1) this.selectText.innerHTML = this.values[0].label;
		else if(selectionCount == options.length) this.selectText.innerHTML = this.allPlaceholder;
		else this.selectText.innerHTML = this.multiplePlaceholder;
	}
}




/* Event functions */
fancySelectJs.prototype.optionClick = function(ev) {
	
}

fancySelectJs.prototype.optionHover = function(ev) {
	
}

fancySelectJs.prototype.blur = function(ev) {
	//Another Fix for Microsoft's broken browser
    if(document.activeElement === this.DOM_dropdown) {
        e.target.focus();  
        return;
    }
	this.hideDropdown();
}



fancySelectJs.prototype.dropdownMousedown = function(ev) {
	ev.preventDefault();    
}





fancySelectJs.prototype.selectClick = function(ev) {
	if(!this.disabled && $(ev.target).hasClass("select")) this.toggleDropdown();
	ev.preventDefault();    
}




/* State change functions */
/**
*	Disables a fancySelectJs, rendering it non-selectable and non-changeable by the user.
*/
fancySelectJs.prototype.disable = function() {
	this.disabled = true;
	this.select.setAttribute("data-disabled", "true");
	this.select.tabIndex = -1;
	this.hideDropdown();
}

/**
*	Enables a fancySelectJs, rendering it selectable and changeable by the user.
*/
fancySelectJs.prototype.enable = function() {
	this.disabled = false;
	this.select.removeAttribute("data-disabled");
	this.select.tabIndex = 0;
}

/* Gui control functions */
/**
*	Shows the dropdown box.
*/
fancySelectJs.prototype.showDropdown = function() {
	if(!this.dropdownVisible) {
		this.queuePositionDropdown();
		this.select.setAttribute("data-dropdown", "visible");
		this.dropdown.setAttribute("data-visible", "true");
		this.dropdownVisible = true;
	}
}

/**
*	Hides the dropdown box.
*/
fancySelectJs.prototype.hideDropdown = function() {
	if(this.dropdownVisible) {
		this.select.removeAttribute("data-dropdown");
		this.dropdown.removeAttribute("data-visible");
		this.dropdownVisible = false;
	}
}

/**
*	Toggles the dropdown box.
*/
fancySelectJs.prototype.toggleDropdown = function() {
	if(this.dropdownVisible) this.hideDropdown();
	else this.showDropdown();
}

/**
*	Calculates the correct position for the dropdown box.  Queues the dropdown box to reposition
*	on the next animation frame.
*/
fancySelectJs.prototype.queuePositionDropdown = function() {
	var selectDom = this.select;
	//If the main select is not visible
    if(selectDom.offsetParent === null) this.hideDropdown();
	else {
		//Get some working variables
		var parentDom = this.parent;
        var offset = $(selectDom).offset();
        var scrollParentOffset = $(parentDom).offset();
		//Store the old dropdown position (no point in updating the position if it hasn't changed)
		var oldTop = this.dropdownTop, oldLeft = this.dropdownLeft, oldWidth = this.dropdownWidth;
        if(parentDom == document.body) {
			//Get the correct dropdown position relative to the document body
            this.dropdownTop = offset.top - scrollParentOffset.top + $(selectDom).outerHeight(false);        
            this.dropdownLeft = offset.left - scrollParentOffset.left;
        } else {
			//Get the correct dropdown position relative to the scroll parent
            this.dropdownTop = offset.top - scrollParentOffset.top + $(parentDom).scrollTop() + $(selectDom).outerHeight();        
            this.dropdownLeft = offset.left - scrollParentOffset.left + $(parentDom).scrollLeft();
        }
        this.dropdownWidth = Math.floor($(selectDom).outerWidth(false));
		//If the dropdown's size or position has changed, queue redraw on the next animation frame
		if(oldTop != this.dropdownTop || oldLeft != this.dropdownLeft || oldWidth != this.dropdownWidth) {
			if(!window.requestAnimationFrame) this.positionDropdown();
			else if(!this.frameRequested) {
				window.requestAnimationFrame(this.positionDropdown.bind(this));
				this.frameRequested = true;
			}
		}
    }
}

/**
*	Immediately sets the dropdown's position and width to the stored dropdown top, left, and width
*	variables in the class.
*/
fancySelectJs.prototype.positionDropdown = function() {
    $(this.dropdown).css({top: this.dropdownTop, left: this.dropdownLeft});
    $(this.dropdown).outerWidth(this.currentWidth);
    this.frameRequested = false;
}


