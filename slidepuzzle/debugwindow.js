// -*- c++ -*-
// Copyright (C) 2005 Kouichirou Eto, All rights reserved.
// This is free software with ABSOLUTELY NO WARRANTY.
// You can redistribute it and/or modify it under the terms of the GNU GPL2.

// * debugwindow.js
// Use small debug window to show debug information.

// * Author
// Kouichirou Eto <2005 at eto.com>

// * Usage
// init() : called from onload.
// open() : open debug window.
// close() : close the debug window.
// print(str) : print debug message.
// puts(str) : print debug message with return.
// clear() : clear debug window.
// p(obj) : print the result of inspect the object.
// inspect(obj) : inspect object.

// * History
// ** 2005-03-30 DebugWindow 0.3
// - Add more lines button and close button.
// - Add test case.
//
// ** 2005-03-30 DebugWindow 0.2
// - Now works in IE.
//
// ** 2005-03-29 DebugWindow 0.1
// - The initial release.

// * Special Thanks to
// debug.js - http://homepage1.nifty.com/kuraman/js/debug.html
// wema - http://wema.sourceforge.jp/
// ArekorePopup.js - http://www.remus.dti.ne.jp/~a-satomi/bunsyorou/ArekorePopup.html
// bobchin - http://d.hatena.ne.jp/bobchin/20050304

function DebugWindow() {
	// setting.
	this.showConsole	= true;
	//this.showConsole	= false;
	this.consoleHeight	= "10em";

	// variables.
	this.win			= null;
	this.toggleButton	= null;
	this.console		= null;
	this.buffer			= "";
	this.dragging		= false;
}

DebugWindow.prototype = {
	init : function() {
		this.open();
	},

	open : function() {
	var obj = document.getElementById("debugwindow");
	if (obj) return;

	// create window
	var div = document.createElement("div");
	div.setAttribute("id", "debugwindow");
	with(div.style) {
		position	= "absolute";
		zIndex		= "1";
		left		= "0px";
		top			= "0px";
		width		= "400px";
		margin		= "0";
		padding		= "0";
		border		= "2px outset";
		fontFamily	= "Verdana,Arial,sans-serif";
		fontSize	= "small";
	}
	document.body.appendChild(div);
	this.win = div;

	// titlebar
	var div = document.createElement("div");
	div.setAttribute("id", "debugwindowbar");
	with(div.style) {
		margin		= "0";
		padding		= "0";
		borderBottom= "1px solid #ccc";
		background	= "#999";
		color		= "#fff";
	}
	this.win.appendChild(div);

	// close button
	var span = this.makeButton();
	with(span.style) {
		position= "absolute";
		right	= "0px";
		top		= "0px";
	}
	div.appendChild(span);
	span.innerHTML = "x";
	span.onmousedown = function() {
		var div = g_debug.win;
		div.style.display = "none";
		return true;
	};

	// bigger button
	var span = this.makeButton();
	with(span.style) {
		//cssFloat= "left";
		position= "absolute";
		right	= "18px";
		top		= "0px";
	}
	div.appendChild(span);
	span.innerHTML = "v";
	span.onmousedown = function() {
		var div = g_debug.console;
		var s = div.style;
		var height = s.height;
		var h = parseInt(height.replace("em", ""));
		h += 3;
		s.height = h+"em";
		return true;
	};

	// toggle button
	var span = this.makeButton();
	with(span.style) {
		//cssFloat= "left";
		position= "absolute";
		right	= "32px";
		top		= "0px";
	}
	div.appendChild(span);

	span.onmousedown = function() {
		var div	= g_debug.console;
		var span = g_debug.toggleButton;

		if (div.style.display == "block") {
			div.style.display = "none";
			span.innerHTML = "+";
		} else {
			div.style.display = "block";
			span.innerHTML = "-";
		}

		return true;
	};

	this.toggleButton = span;

	// title
	var span = document.createElement("span");
	with(span.style) {
		margin	= "0 0 0 15px";
		padding	= "0 0 0 5px";
		fontSize= "xx-small";
		display	= "block";
	}
	span.innerHTML = "debug window";
	div.appendChild(span);

	// onmousedown
	span.onmousedown = function(e) {
		if (typeof e == "undefined") e = window.event;

		var win = g_debug.win;
		if (!win) return;
		var pos = g_debug.getMousePos(e);
		var divpos = g_debug.getDivPos(win);

		g_debug.dragging = true;
		var x = pos.mouseX - divpos.x;
		var y = pos.mouseY - divpos.y
		g_debug.offset = {
			x : x,
			y : y
		};
	};

	// onmousemove
	document.onmousemove = function(e) {
		if (typeof e == "undefined") {
			e = window.event;
		}
		var win = g_debug.win;
		if (!win) return;
		if (!g_debug.dragging) return;
		var pos = g_debug.getMousePos(e);
		var offset = g_debug.offset;
		var x = pos.mouseX - offset.x;
		var y = pos.mouseY - offset.y;
		win.style.left	= x+"px";
		win.style.top	= y+"px";
	};

	// onmouseup
	document.onmouseup = function(e) {
		g_debug.dragging = false;
	}

	// console
	var div = document.createElement("div");
	div.setAttribute("id", "debugwindowconsole");
	with(div.style) {
		height		= this.consoleHeight;
		margin		= "0";
		padding		= "0";
		border		= "1px inset";
		background	= "#eee";
		color		= "#000";
		fontSize	= "small";
		overflow	= "scroll";
		fontFamily	= "Verdana,Arial,sans-serif";
	}
	this.win.appendChild(div);
	this.console = div;

	if (this.showConsole) {
		this.toggleButton.innerHTML = "-";
		this.console.style.display = "block";
	} else {
		this.toggleButton.innerHTML = "+";
		this.console.style.display = "none";
	}

	},

	makeButton : function(e) {
	var span = document.createElement("span");
	with(span.style) {
		width		= "12px";
		height		= "10px";
		margin		= "0";
		padding		= "0";
		background	= "#ccc";
		color		= "#000";
		fontSize	= "xx-small";
		fontWeight	= "bold";
		textAlign	= "center";
		display		= "block";
		border		= "1px outset";
	}
	return span;
	},

	// ref. ArekorePopup.js
	getMousePos : function(e) {
	var d = document.documentElement;
	var body = document.body;
	var isSafari = navigator.userAgent.match('AppleWebKit');
	var scrollX = (window.scrollX) ? window.scrollX : (d.scrollLeft) ? d.scrollLeft : body.scrollLeft;
	var scrollY = (window.scrollY) ? window.scrollY : (d.scrollTop)	? d.scrollTop	: body.scrollTop;
	var windowW = (window.innerWidth)	? window.innerWidth	: d.offsetWidth;
	var windowH = (window.innerHeight) ? window.innerHeight : d.offsetHeight;
	var windowX = e.clientX - (( isSafari) ? scrollX : 0);
	var windowY = e.clientY - (( isSafari) ? scrollY : 0);
	var mouseX	= e.clientX + ((!isSafari) ? scrollX : 0);
	var mouseY	= e.clientY + ((!isSafari) ? scrollY : 0);

	var pos = {
		scrollX : scrollX,
		scrollY : scrollY,
		windowW : windowW,
		windowH : windowH,
		windowX : windowX,
		windowY : windowY,
		mouseX : mouseX,
		mouseY : mouseY
	};
	return pos;
	},

	getDivPos : function(o) {
	var s = o.style;
	var x = (s.left) ? s.left : (s.posLeft) ? s.posLeft : 0;
	var y = (s.top)	? s.top	: (s.posTop) ? s.posTop : 0;
	divx = parseInt(x.replace("px", ""));
	divy = parseInt(y.replace("px", ""));
	if (divx == 0) divx = 1; // IE BUGFIX.
	if (divy == 0) divy = 1;
	var pos = {
		x : divx,
		y : divy
	};
	return pos;
	},

	// ref. ArekorePopup.js
	addEventListener : function(obj, type, listener) {
	if (obj.addEventListener) { // Std DOM Events
		obj.addEventListener(type, listener, false);
	} else if (obj.attachEvent) { // IE
		var e = {
	type			: window.event.type,
	target			: window.event.srcElement,
	currentTarget	: obj,
	clientX			: window.event.clientX,
	clientY			: window.event.clientY,
	pageY			: document.body.scrollTop + window.event.clientY,
	shiftKey		: window.event.shiftKey,
	stopPropagation : function() { window.event.cancelBubble = true }
		};
		obj.attachEvent('on' + type,
				function() { listener( e ) } );
	}
	},

	close : function() {
	var div = this.win;
	if (!div) return;
	document.body.removeChild(div);
	this.win = null;
	},

	bufferPrint : function(str) {
	str = this.escapeHTML(str);
	this.buffer += str;
	},

	bufferPrintTag : function(str) {
	this.buffer += str;
	},

	print : function(str) {
	this.bufferPrintTag("<tt>");
	this.bufferPrint(str)
	this.bufferPrintTag("</tt>");
	},

	puts : function(str) {
	this.print(str);
	this.bufferPrintTag("<br\n/>");
	this.flush();
	},

	clear : function() {
	this.buffer = "";
	this.flush();
	},

	p : function(obj) {
	var str = this.inspect(obj)
	this.puts(str);
	},

	flush : function() {
	if (!this.win) this.open();
	if (this.win.style.display == "none") {
		this.win.style.display = "block";
	}
	var div = this.console;
	if (!div) return; // error
	div.innerHTML = this.buffer;
	},

	alertp : function(obj) {
	var str = this.inspect(obj)
	alert(str);
	},

	inspect : function(obj) {
		if (typeof obj == "number") {
			return ""+obj;
		} else if (typeof obj == "string") {
			return "\""+obj+"\"";
		} else if (typeof obj == "function") {
			return ""+obj;
		} else if (typeof obj == "object") {
			var delimiter = ",\n";
			var str = "{";
			var added = false;
			for (key in obj) {
				var value = obj[key];
				if (value) {
					if(added) str += delimiter;
					added = true;
					if (typeof value == "number") {
					str += ""+key+"=>"+value+"";
					} else if (typeof value == "string") {
					str += ""+key+"=>\""+value+"\"";
					} else if (typeof value == "function") {
					str += ""+key+"()";
					} else if (typeof value == "object") {
					str += ""+key+"=>"+value+"";
					} else {
					str += ""+key+"=><"+(typeof value)+":"+value+">";
					}
				}else if(value===null && (arguments.caller[1]==1 || arguments.caller[1]==9)){
					if(added) str += delimiter;
					added = true;
					str += '' + key + "=>null";
				}else{
					if(arguments.caller[1]==2 || arguments.caller[1]==9){
						if(added) str += delimiter;
						added = true;
						str += '' + key + "=>\"" + value.toString() + "\"";
					}
				}
			}
			return str+"}";
		} else {
			return "<"+(typeof obj)+":"+obj+">";
		}
	},

	escapeHTML : function(str) {
	str = str.replace(/&/g, "&amp;");
	str = str.replace(/</g, "&lt;");
	str = str.replace(/>/g, "&gt;");
	str = str.replace(/\"/g, "&quot;"); // "
	//str = str.replace(/\n/g, "<br\n/>");
	return str;
	},

	dummy : function() {
	} // no , here
};

if (typeof g_debug == 'undefined') {
	var g_debug = new DebugWindow();

	//g_debug.addEventListener(window, "load", g_debug.init);

	window.onload = function() {
	//g_debug.init();
	}
}

// end
