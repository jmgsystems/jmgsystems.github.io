/**
 * UpSolution Theme Core JavaScript Code
 *
 * @requires jQuery
 */
if (window.$us === undefined) window.$us = {};

/**
 * Retrieve/set/erase dom modificator class <mod>_<value> for UpSolution CSS Framework
 * @param {String} mod Modificator namespace
 * @param {String} [value] Value
 * @returns {string|jQuery}
 */
jQuery.fn.usMod = function(mod, value){
	if (this.length == 0) return this;
	// Remove class modificator
	if (value === false){
		this.get(0).className = this.get(0).className.replace(new RegExp('(^| )'+mod+'\_[a-z0-9]+( |$)'), '$2');
		return this;
	}
	var pcre = new RegExp('^.*?'+mod+'\_([a-z0-9]+).*?$'),
		arr;
	// Retrieve modificator
	if (value === undefined){
		return (arr = pcre.exec(this.get(0).className)) ? arr[1] : false;
	}
	// Set modificator
	else {
		this.usMod(mod, false).get(0).className += ' '+mod+'_'+value;
		return this;
	}
};

/**
 * Function.bind: simple function for defining scopes for functions called from events
 */
Function.prototype.usBind = function(scope){
	var self = this;
	return function(){
		return self.apply(scope, arguments);
	};
};

// Fixing hovers for devices with both mouse and touch screen
jQuery.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
jQuery('html').toggleClass('no-touch', ! jQuery.isMobile);

/**
 * $us.canvas
 *
 * All the needed data and functions to work with overall canvas.
 */
!function($){
	"use strict";

	function USCanvas(options){

		// Setting options
		var defaults = {
			disableEffectsWidth: 900,
			disableStickyHeaderWidth: 900,
			headerScrollBreakpoint: 100,
			responsive: true
		};
		this.options = $.extend({}, defaults, options || {});

		// Commonly used dom elements
		this.$window = $(window);
		this.$document = $(document);
		this.$container = $('.l-canvas');
		this.$html = $('html');
		this.$body = $('.l-body');
		this.$htmlBody = $('html, body');
		this.$header = this.$container.find('.l-header');
		this.$main = this.$container.find('.l-main');
		this.$titlebar = this.$container.find('.l-titlebar');
		this.$sections = this.$container.find('.l-section');
		this.$firstSection = this.$sections.first();
		this.$fullscreenSections = this.$sections.filter('.height_full');
		this.$topLink = $('.w-toplink');

		// Canvas modificators
		this.sidebar = this.$container.usMod('sidebar');
		this.type = this.$container.usMod('type');
		// Initial header layout
		this._headerLayout = this.$header.usMod('layout');
		// Current header layout
		this.headerLayout = this._headerLayout;
		// Initial header position
		this._headerPos = this.$header.usMod('pos');
		// Current header position
		this.headerPos = this._headerPos;
		this.headerBg = this.$header.usMod('bg');
		this.rtl = this.$body.hasClass('rtl');

		// Will be used to count fullscreen sections heights and proper scroll positions
		this.scrolledHeaderOccupiedHeight = 0;

		// Storing dom links to quickly move elements on header layout switch
		if (this._headerLayout == 'sided'){
			this.$topSubheader = $('<div class="l-subheader at_top"><div class="l-subheader-h i-cf"></div></div>');
			this.$topSubheaderH = this.$topSubheader.children('.l-subheader-h');
			this.$middleSubheaderH = this.$header.find('.l-subheader.at_middle .l-subheader-h');
			this.$headerContacts = this.$header.find('.w-contacts');
			this.$headerLang = this.$header.find('.w-lang');
			this.$headerSocials = this.$header.find('.w-socials');
			this.$headerCart = this.$header.find('.w-cart');
			this.$headerSearch = this.$header.find('.w-search');
			this.$headerNav = this.$header.find('.w-nav');
		}

		// Boundable events
		this._events = {
			scroll: this.scroll.usBind(this),
			resize: this.resize.usBind(this)
		};

		this.$window.on('scroll', this._events.scroll);

		this.$window.on('resize load', this._events.resize);
		// Complex logics requires two initial renders: before inner elements render and after
		setTimeout(this._events.resize, 25);
		setTimeout(this._events.resize, 75);

		this.$container.on('contentChange', function(){
			if (this.headerLayout == 'sided'){
				this.docHeight = this.$document.height();
			}
		}.usBind(this));
	}

	USCanvas.prototype = {

		/**
		 * Layout switch function
		 *
		 * @param to string sided / extended
		 */
		switchHeaderLayout: function(to){
			if (this.headerLayout == 'sided' && to == 'extended'){
				this.$topSubheader.prependTo(this.$header);
				this.$topSubheaderH.append(this.$headerContacts, this.$headerLang, this.$headerSocials);
				this.$header.resetInlineCSS('position', 'top', 'bottom');
				this.$middleSubheaderH.append(this.$headerCart, this.$headerSearch, this.$headerNav);
				this.$body.removeClass('header_aside');
				if ($us.nav != undefined) $us.nav.switchTo(null, 'hor');
			}
			else if (this.headerLayout == 'extended' && to == 'sided'){
				this.$middleSubheaderH.append(this.$headerNav, this.$headerSearch, this.$headerCart);
				this.$middleSubheaderH.append(this.$headerContacts, this.$headerSocials, this.$headerLang);
				this.$topSubheader.detach();
				this.$body.addClass('header_aside');
				if ($us.nav != undefined) $us.nav.switchTo(null, 'ver');
			}
			this.$header.usMod('layout', to);
			this.headerLayout = to;
		},

		/**
		 * Scroll-driven logics
		 */
		scroll: function(){
			var scrollTop = parseInt(this.$window.scrollTop());

			// Show/hide go to top link
			this.$topLink.toggleClass('active', (scrollTop >= this.winHeight));

			// Fixed header behaviour
			if (this.headerPos == 'fixed'){
				if (this.headerLayout != 'sided'){
					// Sticky header state
					this.$header.toggleClass('sticky', scrollTop >= this.options.headerScrollBreakpoint);
				}
				else if (this.headerLayout == 'sided' && this.headerHeight > this.winHeight){
					var scrollRangeDiff = this.headerHeight - this.winHeight;
					if (this._sidedHeaderScrollRange === undefined){
						this._sidedHeaderScrollRange = [0, scrollRangeDiff];
					}
					if (scrollTop <= this._sidedHeaderScrollRange[0]){
						this._sidedHeaderScrollRange[0] = Math.max(0, scrollTop);
						this._sidedHeaderScrollRange[1] = this._sidedHeaderScrollRange[0] + scrollRangeDiff;
						this.$header.css({position: 'fixed', top: 0, bottom: 'auto'});
					}
					else if(this._sidedHeaderScrollRange[0] < scrollTop && scrollTop < this._sidedHeaderScrollRange[1]){
						this.$header.resetInlineCSS('bottom').css({position: 'absolute', top: this._sidedHeaderScrollRange[0] - this.htmlTopMargin});
					}
					else if (this._sidedHeaderScrollRange[1] <= scrollTop){
						this._sidedHeaderScrollRange[1] = Math.min(this.docHeight - this.winHeight, scrollTop);
						this._sidedHeaderScrollRange[0] = this._sidedHeaderScrollRange[1] - scrollRangeDiff;
						this.$header.css({position: 'fixed', bottom: 0, top: 'auto'});
					}
				}

				if (this.headerBg == 'transparent'){
					var transparent = (scrollTop < this.options.headerScrollBreakpoint);
					// Forcing solid header on some cases
					if ((this.headerLayout == 'advanced' || this.headerLayout == 'centered') && this.winWidth <= 900) transparent = false;
					if (this.headerLayout == 'sided') transparent = true;
					this.$header.toggleClass('transparent', transparent);
				}
			}
		},

		/**
		 * Resize-driven logics
		 */
		resize: function(){
			// Window dimensions
			this.winHeight = parseInt(this.$window.height());
			this.winWidth = parseInt(this.$window.width());

			if (this._headerLayout == 'sided'){
				var nextHeaderLayout = (this.winWidth <= 900) ? 'extended' : 'sided';
				if (nextHeaderLayout != this.headerLayout){
					this.switchHeaderLayout(nextHeaderLayout);
				}
			}

			if (this._headerPos == 'fixed'){
				var newHeaderPos = (this.winWidth > this.options.disableStickyHeaderWidth) ? 'fixed' : 'static';
				if (this.headerLayout == 'sided'){
					// Forcing static state for sided header's certain nav layout
					if ($us.nav != undefined && this.winWidth <= $us.nav.options.mobileWidth){
						newHeaderPos = 'static';
					}
					if (newHeaderPos == 'fixed'){
						this.docHeight = this.$document.height();
						this.htmlTopMargin = parseInt(this.$html.css('margin-top'));
						this.headerHeight = this.$middleSubheaderH.outerHeight();
						if (this.headerHeight <= this.winHeight){
							this.$header.resetInlineCSS('position', 'top', 'bottom');
							delete this._sidedHeaderScrollRange;
						}
					}
				}
				if (newHeaderPos != this.headerPos){
					this.headerPos = newHeaderPos;
					this.$header.usMod('pos', newHeaderPos);
					if (newHeaderPos != 'fixed'){
						this.$header.removeClass('sticky');
					}
				}
			}

			// Measuring new header heights for both initial and scrolled states
			if (this.headerLayout == 'sided'){
				this.scrolledHeaderOccupiedHeight = 0;
			}
			else if (this.headerPos == 'static'){
				this.scrolledHeaderOccupiedHeight = 0;
			}
			else if (this.winWidth <= 900 && (this.headerLayout == 'advanced' || this.headerLayout == 'centered')){
				// Exception
				this.scrolledHeaderOccupiedHeight = 50;
			}
			else /*if (this.headerPos == 'fixed' && this.headerLayout != 'sided')*/{
				var isSticky = this.$header.hasClass('sticky');
				this.$header.addClass('notransition');
				if ( ! isSticky){
					this.$header.addClass('sticky');
				}
				this.scrolledHeaderOccupiedHeight = this.$header.height();
				if ( ! isSticky){
					this.$header.removeClass('sticky');
				}
				setTimeout(function(){
					this.$header.removeClass('notransition');
				}.bind(this), 50);
			}

			if (this.headerPos == 'static' && this.headerBg == 'transparent'){
				this.$header.toggleClass('transparent', this.winWidth > 900);
			}

			// Disabling animation on mobile devices
			this.$body.toggleClass('disable_effects', (this.winWidth <= this.options.disableEffectsWidth));

			// Updating fullscreen sections
			if (this.$fullscreenSections.length > 0){
				this.$fullscreenSections.each(function(index, section){
					var $section = $(section),
						sectionHeight = this.winHeight,
						isFirstSection = (index == 0 && this.$titlebar.length == 0 && $section.is(this.$firstSection));

					// First section
					if (isFirstSection) {
						sectionHeight -= $section.offset().top;
					}
					// 2+ sections
					else {
						sectionHeight -= this.scrolledHeaderOccupiedHeight;
					}
					$section.css('min-height', sectionHeight);
					if ($section.hasClass('valign_center')) {
						var $sectionH = $section.find('.l-section-h'),
							sectionTopPadding = parseInt($section.css('padding-top')),
							contentHeight = $sectionH.outerHeight(),
							topMargin;
						$sectionH.css('margin-top', '');
						// Section was extended by extra top padding that is overlapped by fixed solid header and not visible
						var sectionOverlapped = isFirstSection && this.headerPos == 'fixed' && this.headerBg != 'transparent' && this.headerLayout != 'sided';
						if (this.winWidth <= 900 && this.headerLayout == 'advanced' || this.headerLayout == 'centered'){
							// Manual exception
							sectionOverlapped = false;
						}
						if (sectionOverlapped){
							// Part of first section is overlapped by header
							topMargin = Math.max(0, (sectionHeight - sectionTopPadding - contentHeight) / 2);
						}else{
							topMargin = Math.max(0, (sectionHeight - contentHeight) / 2 - sectionTopPadding);
						}
						$sectionH.css('margin-top', topMargin || '');
					}
					$section.find('.upb_row_bg').css('min-height', $section.height());
				}.usBind(this));
				this.$container.trigger('contentChange');
			}

			// Fix scroll glitches that could occur after the resize
			this.scroll();
		}
	};

	$us.canvas = new USCanvas($us.canvasOptions || {});

}(jQuery);

/**
 * $us.nav
 *
 * Header navigation will all the possible states
 *
 * @requires $us.canvas
 */
!function($){

	function USNav(options){

		var self = this;

		// Setting options
		var defaults = {
			mobileWidth: 1000,
			togglable: false
		};
		this.options = $.extend({}, defaults, options || {});

		// Commonly used dom elements
		this.$nav = $('.l-header .w-nav:first');
		this.$control = this.$nav.find('.w-nav-control');
		this.$items = this.$nav.find('.w-nav-item');
		this.$list = this.$nav.find('.w-nav-list.level_1');
		this.$subItems = this.$list.find('.w-nav-item.menu-item-has-children');
		this.$subAnchors = this.$list.find('.w-nav-item.menu-item-has-children > .w-nav-anchor');
		this.$subLists = this.$list.find('.w-nav-item.menu-item-has-children > .w-nav-list');
		this.$anchors = this.$nav.find('.w-nav-anchor');

		// In case the nav doesn't exist, do nothing
		if (this.$nav.length == 0) return;

		this.type = this.$nav.usMod('type');
		// Initial layout
		this._layout = this.$nav.usMod('layout');
		// Current layout
		this.layout = this._layout;

		this.mobileOpened = false;
		this.animationType = this.$nav.usMod('animation');
		var showFn = 'fadeInCSS',
			hideFn = 'fadeOutCSS';
		if (this.animationType == 'height'){
			showFn = 'slideDownCSS';
			hideFn = 'slideUpCSS';
		}
		else if (this.animationType == 'mdesign'){
			showFn = 'showMD';
			hideFn = 'hideMD';
		}

		// Mobile menu toggler
		this.$control.on('click', function(){
			self.mobileOpened = ! self.mobileOpened;
			if (self.mobileOpened){
				// Closing opened sublists
				self.$items.filter('.opened').removeClass('opened');
				self.$subLists.css('height', 0);

				self.$list.slideDownCSS();
			}
			else{
				self.$list.slideUpCSS();
			}
			if ($us.canvas.headerPos == 'fixed' && self.layout == 'hor') self.setFixedMobileMaxHeight();
		});

		// Boundable events
		this._events = {
			// Mobile submenu togglers
			toggle: function(e){
				if (self.type != 'mobile') return;
				e.stopPropagation();
				e.preventDefault();
				var $item = $(this).closest('.w-nav-item'),
					$sublist = $item.children('.w-nav-list');
				if ($item.hasClass('opened')){
					$item.removeClass('opened');
					$sublist.slideUpCSS();
				}
				else {
					$item.addClass('opened');
					$sublist.slideDownCSS();
				}
			},
			resize: this.resize.usBind(this)
		};

		// Toggle on item clicks
		if (this.options.togglable){
			this.$subAnchors.on('click', this._events.toggle);
		}
		// Toggle on arrows
		else {
			this.$list.find('.w-nav-item.menu-item-has-children > .w-nav-anchor > .w-nav-arrow').on('click', this._events.toggle);
		}
		// Mark all the togglable items
		this.$subItems.each(function(){
			var $this = $(this),
				$parentItem = $this.parent().closest('.w-nav-item');
			if ($parentItem.length == 0 || $parentItem.usMod('columns') === false) $this.addClass('togglable');
		});
		// Touch device handling in default (notouch) layout
		if ( ! $us.canvas.$html.hasClass('no-touch')){
			this.$list.find('.w-nav-item.menu-item-has-children.togglable > .w-nav-anchor').on('click', function(e){
				if (self.type == 'mobile') return;
				e.preventDefault();
				var $this = $(this),
					$item = $this.parent(),
					$list = $item.children('.w-nav-list');

				// Second tap: going to the URL
				if ($item.hasClass('opened')) return location.assign($this.attr('href'));
				$list[showFn]();
				$item.addClass('opened');
				var outsideClickEvent = function(e){
					if (jQuery.contains($item[0], e.target)) return;
					$item.removeClass('opened');
					$list[hideFn]();
					$us.canvas.$body.off('touchstart', outsideClickEvent);
				};

				$us.canvas.$body.on('touchstart', outsideClickEvent);
			});
		}
		// Desktop device hovers
		else {
			self.$subItems
				.filter('.togglable')
				.on('mouseenter', function(){
					if (self.type == 'mobile') return;
					var $list = jQuery(this).children('.w-nav-list');
					$list[showFn]();
				})
				.on('mouseleave', function(){
					if (self.type == 'mobile') return;
					var $list = jQuery(this).children('.w-nav-list');
					$list[hideFn]();
				});
		}
		// Close menu on anchor clicks
		this.$anchors.on('click', function(){
			if (self.type != 'mobile' || self.layout != 'hor') return;
			// Toggled the item
			if (self.options.togglable && jQuery(this).closest('.w-nav-item').hasClass('menu-item-has-children')) return;
			self.$list.slideUpCSS();
			self.mobileOpened = false;
		});

		$us.canvas.$window.on('resize', this._events.resize);
		setTimeout(this._events.resize, 50);
	}

	USNav.prototype = {

		/**
		 * Switch nav type and/or layout
		 * @param type string
		 * @param layout string
		 */
		switchTo: function(type, layout){
			type = type || this.type;
			layout = layout || this.layout;

			// Clearing previous state
			if (this.type == 'desktop'){
			}else if (this.type == 'mobile'){
				// Clearing height-hiders
				this.$list.css('height', 'auto').resetInlineCSS('max-height', 'display', 'opacity');
			}

			// Closing opened sublists
			this.$items.removeClass('opened');

			// Applying new state
			if (type == 'desktop'){
				// Closing opened sublists
				this.$items.filter('.togglable').children('.w-nav-list').css('display', 'none');
				this.$subLists.css('height', 'auto');
			}else if (type == 'mobile'){
				if (layout != 'ver'){
					this.mobileOpened = false;
					this.$list.css('height', 0);
				}
				this.$subLists.css('height', 0);
			}
			if (layout == 'ver'){
				this.$list.css('height', 'auto').resetInlineCSS('min-height', 'max-height');
				this.$list.css('display', 'block');
			}

			if (type != this.type){
				this.$nav.usMod('type', this.type = type);
			}
			if (layout != this.layout){
				this.$nav.usMod('layout', this.layout = layout);
			}
		},

		/**
		 * Count proper dimensions
		 */
		setFixedMobileMaxHeight: function(){
			if ($us.canvas.winWidth > $us.canvas.options.disableStickyHeaderWidth){
				var navListOuterHeight = Math.min(this.$list.outerHeight(), $us.canvas.scrolledHeaderOccupiedHeight),
					menuOffset = $us.canvas.scrolledHeaderOccupiedHeight - navListOuterHeight;
				this.$list.css('max-height', $us.canvas.winHeight-menuOffset+'px');
			}
			else{
				this.$list.css('max-height', 'auto');
			}
		},

		/**
		 * Resize handler
		 */
		resize: function(){
			var nextType = ($us.canvas.winWidth <= this.options.mobileWidth) ? 'mobile' : 'desktop';
			if (nextType != this.type){
				if (nextType == 'mobile') {
					this.switchTo(nextType, 'hor');
				} else {
					this.switchTo(nextType, null);
				}

			}

			// Max-height limitation for fixed header layouts
			if (this.layout == 'hor' && this.type == 'mobile' && $us.canvas.headerPos == 'fixed'){
				this.setFixedMobileMaxHeight();
			}

			this.$list.removeClass('hidden');
		}
	};

	$us.nav = new USNav($us.navOptions || {});

}(jQuery);


/**
 * $us.scroll
 *
 * ScrollSpy, Smooth scroll links and hash-based scrolling all-in-one
 *
 * @requires $us.canvas
 */
!function($){
	"use strict";

	function USScroll(options){

		// Setting options
		var defaults = {
			/**
			 * @param {String|jQuery} Selector or object of hash scroll anchors that should be attached on init
			 */
			attachOnInit: '.w-nav a[href*="#"], a.w-btn[href*="#"], .w-iconbox a[href*="#"], .w-image a[href*="#"], ' +
			'.vc_icon_element a[href*="#"], .vc_custom_heading a[href*="#"], a.w-portfolio-item-anchor[href*="#"], .widget_nav_menu a[href*="#"], .w-toplink, ' +
			'.w-blog-post-meta-comments a[href*="#"], .w-comments-title a[href*="#"], .w-comments-item-date, a.smooth-scroll[href*="#"]',
			/**
			 * @param {String} Classname that will be toggled on relevant buttons
			 */
			buttonActiveClass: 'active',
			/**
			 * @param {String} Classname that will be toggled on relevant menu items
			 */
			menuItemActiveClass: 'current-menu-item',
			/**
			 * @param {String} Classname that will be toggled on relevant menu ancestors
			 */
			menuItemAncestorActiveClass: 'current-menu-ancestor',
			/**
			 * @param {Number} Duration of scroll animation
			 */
			animationDuration: 1200,
			/**
			 * @param {String} Easing for scroll animation
			 */
			animationEasing: 'easeInOutQuint'
		};
		this.options = $.extend({}, defaults, options || {});

		// Commonly used dom elements
		this.$window = $(window);
		this.$htmlBody = $('html, body');

		// Hash blocks with targets and activity indicators
		this.blocks = {};

		// Is scrolling to some specific block at the moment?
		this.isScrolling = false;

		// Waypoints that will be called at certain scroll position
		this.waypoints = [];

		// Boundable events
		this._events = {
			cancel: this.cancel.usBind(this),
			scroll: this.scroll.usBind(this),
			resize: this.resize.usBind(this)
		};

		this._canvasTopOffset = 0;
		this.$window.on('resize load', this._events.resize);
		setTimeout(this._events.resize, 75);

		this.$window.on('scroll', this._events.scroll);
		setTimeout(this._events.scroll, 75);

		if (this.options.attachOnInit){
			this.attach(this.options.attachOnInit);
		}

		// Recount scroll positions on any content changes
		$us.canvas.$container.on('contentChange', this._countAllPositions.usBind(this));

		// Handling initial document hash
		if (document.location.hash && document.location.hash.indexOf('#!') == -1){
			var hash = document.location.hash,
				scrollPlace = (this.blocks[hash] !== undefined) ? hash : undefined;
			if (scrollPlace === undefined) {
				try {
					var $target = $(hash);
					if ($target.length != 0){
						scrollPlace = $target;
					}
				} catch(error) {
					//Do not have to do anything here since scrollPlace is already undefined
				}

			}
			if (scrollPlace !== undefined){
				// While page loads, its content changes, and we'll keep the proper scroll on each sufficient content change
				// until the page finishes loading or user scrolls the page manually
				var keepScrollPositionTimer = setInterval(function(){
					this.scrollTo(scrollPlace);
				}.usBind(this), 100);
				var clearHashEvents = function(){
					// Content size still may change via other script right after page load
					setTimeout(function(){
						clearInterval(keepScrollPositionTimer);
						$us.canvas.resize();
						this._countAllPositions();
						this.scrollTo(scrollPlace);
					}.usBind(this), 100);
					this.$window.off('load touchstart mousewheel DOMMouseScroll touchstart', clearHashEvents);
				}.usBind(this);
				this.$window.on('load touchstart mousewheel DOMMouseScroll touchstart', clearHashEvents);
			}
		}
	}

	USScroll.prototype = {

		/**
		 * Count hash's target position and store it properly
		 *
		 * @param {String} hash
		 * @private
		 */
		_countPosition: function(hash){
			this.blocks[hash].top = Math.ceil(this.blocks[hash].target.offset().top - $us.canvas.scrolledHeaderOccupiedHeight - this._canvasTopOffset);
			this.blocks[hash].bottom = this.blocks[hash].top + this.blocks[hash].target.outerHeight(false);
		},

		/**
		 * Count all targets' positions for proper scrolling
		 *
		 * @private
		 */
		_countAllPositions: function(){
			// Take into account #wpadminbar (and others possible) offset
			this._canvasTopOffset = $us.canvas.$container.offset().top;
			for (var hash in this.blocks){
				if ( ! this.blocks.hasOwnProperty(hash)) continue;
				this._countPosition(hash);
			}
			// Counting waypoints
			for (var i = 0; i < this.waypoints.length; i++){
				this._countWaypoint(this.waypoints[i]);
			}
		},

		/**
		 * Indicate scroll position by hash
		 *
		 * @param {String} activeHash
		 * @private
		 */
		_indicatePosition: function(activeHash){
			var activeMenuAncestors = [];
			for (var hash in this.blocks){
				if ( ! this.blocks.hasOwnProperty(hash)) continue;
				if (this.blocks[hash].buttons !== undefined){
					this.blocks[hash].buttons.toggleClass(this.options.buttonActiveClass, hash === activeHash);
				}
				if (this.blocks[hash].menuItems !== undefined){
					this.blocks[hash].menuItems.toggleClass(this.options.menuItemActiveClass, hash === activeHash);
				}
				if (this.blocks[hash].menuAncestors !== undefined){
					this.blocks[hash].menuAncestors.removeClass(this.options.menuItemAncestorActiveClass);
				}
			}
			if (this.blocks[activeHash] !== undefined && this.blocks[activeHash].menuAncestors !== undefined){
				this.blocks[activeHash].menuAncestors.addClass(this.options.menuItemAncestorActiveClass);
			}
		},

		/**
		 * Attach anchors so their targets will be listened for possible scrolls
		 *
		 * @param {String|jQuery} anchors Selector or list of anchors to attach
		 */
		attach: function(anchors){
			// Location pattern to check absolute URLs for current location
			var locationPattern = new RegExp('^'+location.pathname.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")+'#');

			var $anchors = $(anchors);
			if ($anchors.length == 0) return;
			$anchors.each(function(index, anchor){
				var $anchor = $(anchor),
					href = $anchor.attr('href'),
					hash = $anchor.prop('hash');
				// Ignoring ajax links
				if (hash.indexOf('#!') != -1) return;
				// Checking if the hash is connected with the current page
				if ( ! (
						// Link type: #something
					href.charAt(0) == '#' ||
						// Link type: /#something
					(href.charAt(0) == '/' && locationPattern.test(href)) ||
						// Link type: http://example.com/some/path/#something
					href.indexOf(location.host+location.pathname+'#') > -1
					)) return;
				// Do we have an actual target, for which we'll need to count geometry?
				if (hash != '' && hash != '#'){
					// Attach target
					if (this.blocks[hash] === undefined){
						var $target = $(hash);
						// Don't attach anchors that actually have no target
						if ($target.length == 0) return;
						// If it's the only row in a submain, than use submain instead
						if ($target.hasClass('g-cols') && $target.parent().children().length == 1){
							$target = $target.closest('.l-section');
						}
						this.blocks[hash] = {
							target: $target
						};
						this._countPosition(hash);
					}
					// Attach activity indicator
					if ($anchor.hasClass('w-nav-anchor')){
						var $menuIndicator = $anchor.closest('.w-nav-item');
						this.blocks[hash].menuItems = (this.blocks[hash].menuItems || $()).add($menuIndicator);
						var $menuAncestors = $menuIndicator.parents('.menu-item-has-children');
						if ($menuAncestors.length > 0){
							this.blocks[hash].menuAncestors = (this.blocks[hash].menuAncestors || $()).add($menuAncestors);
						}
					}
					else {
						this.blocks[hash].buttons = (this.blocks[hash].buttons || $()).add($anchor);
					}
				}
				$anchor.on('click', function(event){
					event.preventDefault();
					this.scrollTo(hash, true);
				}.usBind(this));
			}.usBind(this));
		},

		/**
		 * Scroll page to a certain position or hash
		 *
		 * @param {Number|String|jQuery} place
		 * @param {Boolean} animate
		 */
		scrollTo: function(place, animate){
			var placeType,
				newY;
			// Scroll to top
			if (place == '' || place == '#'){
				newY = 0;
				placeType = 'top';
			}
			// Scroll by hash
			else if (this.blocks[place] !== undefined){
				newY = this.blocks[place].top;
				placeType = 'hash';
			}
			else if (place instanceof $){
				newY = Math.floor(place.offset().top - $us.canvas.scrolledHeaderOccupiedHeight - this._canvasTopOffset);
				placeType = 'element';
			}
			else {
				newY = Math.floor(place - $us.canvas.scrolledHeaderOccupiedHeight - this._canvasTopOffset);
			}
			var indicateActive = function(){
				if (placeType == 'hash'){
					this._indicatePosition(place);
				}
				else {
					this.scroll();
				}
			}.usBind(this);
			if (animate){
				this.isScrolling = true;
				this.$htmlBody.stop(true, false).animate({
					scrollTop: newY+'px'
				}, {
					duration: this.options.animationDuration,
					easing: this.options.animationEasing,
					always: function(){
						this.$window.off('keydown mousewheel DOMMouseScroll touchstart', this._events.cancel);
						this.isScrolling = false;
						indicateActive();
					}.usBind(this)
				});
				// Allow user to stop scrolling manually
				this.$window.on('keydown mousewheel DOMMouseScroll touchstart', this._events.cancel);
			}
			else {
				this.$htmlBody.stop(true, false).scrollTop(newY);
				indicateActive();
			}
		},

		/**
		 * Cancel scroll
		 */
		cancel: function(){
			this.$htmlBody.stop(true, false);
		},

		/**
		 * Add new waypoint
		 *
		 * @param {jQuery} $elm object with the element
		 * @param {mixed} offset Offset from bottom of screen in pixels ('100') or percents ('20%')
		 * @param {Function} fn The function that will be called
		 */
		addWaypoint: function($elm, offset, fn){
			$elm = ($elm instanceof $) ? $elm : $($elm);
			if ($elm.length == 0) return;
			if (typeof offset != 'string' || offset.indexOf('%') == -1){
				// Not percent: using pixels
				offset = parseInt(offset);
			}
			var waypoint = {
				$elm: $elm,
				offset: offset,
				fn: fn
			};
			this._countWaypoint(waypoint);
			this.waypoints.push(waypoint);
		},

		/**
		 *
		 * @param {Object} waypoint
		 * @private
		 */
		_countWaypoint: function(waypoint){
			var elmTop = waypoint.$elm.offset().top,
				winHeight = this.$window.height();
			if (typeof waypoint.offset == 'number'){
				// Offset is defined in pixels
				waypoint.scrollPos = elmTop - winHeight + waypoint.offset;
			}else{
				// Offset is defined in percents
				waypoint.scrollPos = elmTop - winHeight + winHeight * parseInt(waypoint.offset) / 100;
			}
		},

		/**
		 * Scroll handler
		 */
		scroll: function(){
			var scrollTop = parseInt(this.$window.scrollTop());
			if ( ! this.isScrolling){
				var activeHash;
				for (var hash in this.blocks) {
					if ( ! this.blocks.hasOwnProperty(hash)) continue;
					if (scrollTop >= this.blocks[hash].top && scrollTop < this.blocks[hash].bottom){
						activeHash = hash;
						break;
					}
				}
				this._indicatePosition(activeHash);
			}
			// Handling waypoints
			for (var i = 0; i < this.waypoints.length; i++){
				if (this.waypoints[i].scrollPos < scrollTop){
					this.waypoints[i].fn(this.waypoints[i].$elm);
					this.waypoints.splice(i, 1);
					i--;
				}
			}
		},

		/**
		 * Resize handler
		 */
		resize: function(){
			// Delaying the resize event to prevent glitches
			setTimeout(function(){
				this._countAllPositions();
				this.scroll();
			}.usBind(this), 150);
			this._countAllPositions();
			this.scroll();
		}
	};

	$(function(){
		$us.scroll = new USScroll($us.scrollOptions || {});
	});

}(jQuery);


jQuery(function($){
	"use strict";

	// TODO Move all of the below to us.widgets
	if ($.fn.magnificPopup){

		$('.product .images').magnificPopup({
			type: 'image',
			delegate: 'a',
			gallery: {
				enabled: true,
				navigateByImgClick: true,
				preload: [0, 1],
				tPrev: $us.langOptions.magnificPopup.tPrev, // Alt text on left arrow
				tNext: $us.langOptions.magnificPopup.tNext, // Alt text on right arrow
				tCounter: $us.langOptions.magnificPopup.tCounter // Markup for "1 of 7" counter
			},
			removalDelay: 300,
			mainClass: 'mfp-fade',
			fixedContentPos: false

		});

		$('a[ref=magnificPopup][class!=direct-link]').magnificPopup({
			type: 'image',
			fixedContentPos: false
		});
	}

	if ($.fn.revolution){
		$('.fullwidthbanner').revolution({
			delay: 9000,
			startwidth: 1140,
			startheight: 500,
			soloArrowLeftHOffset: 20,
			soloArrowLeftVOffset: 0,
			soloArrowRightHOffset: 20,
			soloArrowRightVOffset: 0,
			onHoverStop: "on", // Stop Banner Timet at Hover on Slide on/off
			fullWidth: "on",
			hideThumbs: false,
			shadow: 0 //0 = no Shadow, 1,2,3 = 3 Different Art of Shadows -  (No Shadow in Fullwidth Version !)
		});
		// Redrawing all the Revolution Sliders
		if (window.revapi3 !== undefined && window.revapi3.revredraw !== undefined){
			$us.canvas.$window.on('resize', function(){
				window.revapi3.revredraw();
			});
		}
	}

	$('.animate_fade, .animate_afc, .animate_afl, .animate_afr, .animate_aft, .animate_afb, .animate_wfc, ' +
		'.animate_hfc, .animate_rfc, .animate_rfl, .animate_rfr').each(function(){
		$us.scroll.addWaypoint($(this), '15%', function($elm){
			if ( ! $elm.hasClass('animate_start')){
				setTimeout(function() {
					$elm.addClass('animate_start');
				}, 20);
			}
		});
	});
	$('.wpb_animate_when_almost_visible').each(function(){
		$us.scroll.addWaypoint($(this), '15%', function($elm){
			if ( ! $elm.hasClass('wpb_start_animation')){
				setTimeout(function() {
					$elm.addClass('wpb_start_animation');
				}, 20);
			}
		});
	});

	var $submainVideos = $('.l-section-video');
	var updateVideosSizes = function(){
		$submainVideos.each(function(){
			var $this = $(this),
				$video = $this.find('video'),
				player = $video.data('mediaelementplayer');
			// Hiding videos on small (some mobiles) resolutions
			if ($us.canvas.winWidth <= 1024){
				if (player && player.pause && ! player.media.paused){
					player.pause();
				}
				return $this.hide();
			}
			var mejsContainer = $this.find('.mejs-container'),
				poster = $this.find('.mejs-mediaelement img'),
				videoWidth = $video.attr('width'),
				videoHeight = $video.attr('height'),
				videoProportion = videoWidth / videoHeight,
				parent = $this.parent(),
				parentWidth = parent.outerWidth(),
				parentHeight = parent.outerHeight(),
				proportion,
				centerX, centerY;
			if (mejsContainer.length == 0) return;

			// Proper sizing
//			if (video.length > 0 && video[0].player && video[0].player.media) videoWidth = video[0].player.media.videoWidth;
//			if (video.length > 0 && video[0].player && video[0].player.media) videoHeight = video[0].player.media.videoHeight;
			if (player && player.play && player.media.paused){
				player.play();
			}
			$this.show();
			parent.find('span.mejs-offscreen').hide();

			proportion = (parentWidth/parentHeight > videoWidth/videoHeight)?parentWidth/videoWidth:parentHeight/videoHeight;
			$this.width(proportion*videoWidth);
			$this.height(proportion*videoHeight);

			poster.width(proportion*videoWidth);
			poster.height(proportion*videoHeight);

			centerX = (parentWidth < videoWidth*proportion)?(parentWidth - videoWidth*proportion)/2:0;
			centerY = (parentHeight < videoHeight*proportion)?(parentHeight - videoHeight*proportion)/2:0;

			$this.css({left: centerX, top: centerY});

			mejsContainer.css({width: '100%', height: '100%'});
			$video.css({'object-fit': 'cover', display: 'inline-block'});
		});
	};
	if (window.MediaElementPlayer){
		$('.l-section-video video').mediaelementplayer({
			enableKeyboard: false,
			iPadUseNativeControls: false,
			pauseOtherPlayers: false,
			iPhoneUseNativeControls: false,
			AndroidUseNativeControls: false,
			videoWidth: '100%',
			videoHeight: '100%',
			success: function(mediaElement, domObject){
				$(domObject).css('display', 'block');
				updateVideosSizes();
			}
		});
		setTimeout(updateVideosSizes, 75);
		$us.canvas.$window.on('resize load', updateVideosSizes);
	}

	jQuery('input[type="text"], input[type="email"], textarea').each(function(index, input){
		var $input = $(input),
			$row = $input.closest('.w-form-row');
		if ($input.attr('type') == 'hidden') return;
		$row.toggleClass('not-empty', $input.val() != '');
		$input.on('input', function(){
			$row.toggleClass('not-empty', $input.val() != '');
		});
	});

	jQuery('.l-section-img, .l-titlebar-img').each(function(){
		var $this = $(this),
			img = new Image();

		img.onload = function () {
			if ( ! $this.hasClass('loaded')) {
				$this.addClass('loaded')
			}
		};

		img.src = ($this.css('background-image') || '').replace(/url\(['"]*(.*?)['"]*\)/g, '$1');
	});

	/* Ultimate Addons for Visual Composer integration */
	jQuery('.upb_bg_img, .upb_color, .upb_grad, .upb_content_iframe, .upb_content_video, .upb_no_bg').each(function() {
		var $bg = jQuery(this),
			$prev = $bg.prev();

		if ($prev.length == 0) {
			var $parent = $bg.parent(),
				$parentParent = $parent.parent(),
				$prevParentParent = $parentParent.prev();

			if ($prevParentParent.length) {
				$bg.insertAfter($prevParentParent);

				if ( $parent.children().length == 0 ) {
					$parentParent.remove();
				}
			}
		}
	});
	$('.g-cols > .ult-item-wrap').each(function(index, elm){
		var $elm = jQuery(elm);
		$elm.replaceWith($elm.children());
	});
	jQuery('.overlay-show').click(function(){
		window.setTimeout(function(){
			$us.canvas.$container.trigger('contentChange');
		}, 1000);
	});

});

/**
 * CSS-analog of jQuery slideDown/slideUp/fadeIn/fadeOut functions (for better rendering)
 */
!function(){

	/**
	 * Remove the passed inline CSS attributes.
	 *
	 * Usage: $elm.resetInlineCSS('height', 'width');
	 */
	jQuery.fn.resetInlineCSS = function(){
		for (var index = 0; index < arguments.length; index++){
			var name = arguments[index],
				value = '';
			this.css(name, value);
		}
		return this;
	};

	jQuery.fn.clearPreviousTransitions = function(){
		// Stopping previous events, if there were any
		var prevTimers = (this.data('animation-timers') || '').split(',');
		if (prevTimers.length >= 2){
			this.resetInlineCSS('transition', '-webkit-transition');
			prevTimers.map(clearTimeout);
			this.removeData('animation-timers');
		}
		return this;
	};
	/**
	 *
	 * @param {Object} css key-value pairs of animated css
	 * @param {Number} duration in milliseconds
	 * @param {Function} onFinish
	 * @param {String} easing CSS easing name
	 * @param {Number} delay in milliseconds
	 */
	jQuery.fn.performCSSTransition = function(css, duration, onFinish, easing, delay){
		duration = duration || 250;
		delay = delay || 25;
		easing = easing || 'ease-in-out';
		var $this = this,
			transition = [];

		this.clearPreviousTransitions();

		for (var attr in css){
			if ( ! css.hasOwnProperty(attr)) continue;
			transition.push(attr+' '+(duration/1000)+'s '+easing);
		}
		transition = transition.join(', ');
		$this.css({
			transition: transition,
			'-webkit-transition': transition
		});

		// Starting the transition with a slight delay for the proper application of CSS transition properties
		var timer1 = setTimeout(function(){
			$this.css(css);
		}, delay);

		var timer2 = setTimeout(function(){
			if (typeof onFinish == 'function') onFinish();
			$this.resetInlineCSS('transition', '-webkit-transition');
		}, duration + delay);

		this.data('animation-timers', timer1+','+timer2);
	};
	// Height animations
	jQuery.fn.slideDownCSS = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		var $this = this;
		this.clearPreviousTransitions();
		// Grabbing paddings
		this.resetInlineCSS('padding-top', 'padding-bottom');
		var timer1 = setTimeout(function(){
			var paddingTop = parseInt($this.css('padding-top')),
				paddingBottom = parseInt($this.css('padding-bottom'));
			// Grabbing the "auto" height in px
			$this.css({
				visibility: 'hidden',
				position: 'absolute',
				height: 'auto',
				'padding-top': 0,
				'padding-bottom': 0,
				display: 'block'
			});
			var height = $this.height();
			$this.css({
				overflow: 'hidden',
				height: '0px',
				visibility: '',
				position: '',
				opacity: 0
			});
			$this.performCSSTransition({
				height: height + paddingTop + paddingBottom,
				opacity: 1,
				'padding-top': paddingTop,
				'padding-bottom': paddingBottom
			}, duration, function(){
				$this.resetInlineCSS('overflow').css('height', 'auto');
				if (typeof onFinish == 'function') onFinish();
			}, easing, delay);
		}, 25);
		this.data('animation-timers', timer1+',null');
	};
	jQuery.fn.slideUpCSS = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		this.clearPreviousTransitions();
		this.css({
			height: this.outerHeight(),
			overflow: 'hidden',
			'padding-top': this.css('padding-top'),
			'padding-bottom': this.css('padding-bottom'),
			opacity: 1
		});
		var $this = this;
		this.performCSSTransition({
			height: 0,
			'padding-top': 0,
			'padding-bottom': 0,
			opacity: 0
		}, duration, function(){
			$this.resetInlineCSS('overflow', 'padding-top', 'padding-bottom').css({
				display: 'none'
			});
			if (typeof onFinish == 'function') onFinish();
		}, easing, delay);
	};
	// Opacity animations
	jQuery.fn.fadeInCSS = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		this.clearPreviousTransitions();
		this.css({
			opacity: 0,
			display: 'block'
		});
		this.performCSSTransition({
			opacity: 1
		}, duration, onFinish, easing, delay);
	};
	jQuery.fn.fadeOutCSS = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		var $this = this;
		this.performCSSTransition({
			opacity: 0
		}, duration, function(){
			$this.css('display', 'none');
			if (typeof onFinish == 'function') onFinish();
		}, easing, delay);
	};
	// Material design animations
	jQuery.fn.showMD = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		this.clearPreviousTransitions();
		// Grabbing paddings
		this.resetInlineCSS('padding-top', 'padding-bottom');
		var paddingTop = parseInt(this.css('padding-top')),
			paddingBottom = parseInt(this.css('padding-bottom'));
		// Grabbing the "auto" height in px
		this.css({
			visibility: 'hidden',
			position: 'absolute',
			height: 'auto',
			'padding-top': 0,
			'padding-bottom': 0,
			'margin-top': -20,
			opacity: '',
			display: 'block'
		});
		var height = this.height();
		this.css({
			overflow: 'hidden',
			height: '0px'
		}).resetInlineCSS('visibility', 'position');
		var $this = this;
		this.performCSSTransition({
			height: height + paddingTop + paddingBottom,
			'margin-top': 0,
			'padding-top': paddingTop,
			'padding-bottom': paddingBottom
		}, duration || 350, function(){
			$this.resetInlineCSS('overflow', 'margin-top', 'padding-top', 'padding-bottom').css('height', 'auto');
			if (typeof onFinish == 'function') onFinish();
		}, easing || 'cubic-bezier(.23,1,.32,1)', delay || 150);
	};
	jQuery.fn.hideMD = function(duration, onFinish, easing, delay){
		if (this.length == 0) return;
		this.clearPreviousTransitions();
		var $this = this;
		this.resetInlineCSS('margin-top');
		this.performCSSTransition({
			opacity: 0
		}, duration || 100, function(){
			$this.css({
				display: 'none'
			}).resetInlineCSS('opacity');
			if (typeof onFinish == 'function') onFinish();
		}, easing, delay);
	};
	// Slide element left / right
	var slideIn = function($this, from){
			if ($this.length == 0) return;
			$this.clearPreviousTransitions();
			$this.css({width: 'auto', height: 'auto'});
			var width = $this.width(),
				height = $this.height();
			$this.css({
				width: width,
				height: height,
				position: 'relative',
				left: (from == 'right') ? '100%' : '-100%',
				opacity: 0,
				display: 'block'
			});
			$this.performCSSTransition({
				left: '0%',
				opacity: 1
			}, arguments[0] || 250, function(){
				$this.resetInlineCSS('position', 'left', 'opacity', 'display').css({width: 'auto', height: 'auto'});
			});
		},
		slideOut = function($this, to){
			if ($this.length == 0) return;
			$this.clearPreviousTransitions();
			$this.css({
				position: 'relative',
				left: 0,
				opacity: 1
			});
			$this.performCSSTransition({
				left: (to == 'left') ? '-100%' : '100%',
				opacity: 0
			}, arguments[0] || 250, function(){
				$this.css({
					display: 'none'
				}).resetInlineCSS('position', 'left', 'opacity');
			});
		};
	jQuery.fn.slideOutLeft = function(){ slideOut(this, 'left'); };
	jQuery.fn.slideOutRight = function(){ slideOut(this, 'right'); };
	jQuery.fn.slideInLeft = function(){ slideIn(this, 'left'); };
	jQuery.fn.slideInRight = function(){ slideIn(this, 'right'); };
}();
