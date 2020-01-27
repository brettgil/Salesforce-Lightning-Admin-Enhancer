
(function() {
// Runs on load	
var globalQuickFocus;
var globalMoveQuickFind;
var globalMinify;
var globalResizeProcessBuilder;
var globalNavFavs;
var globalNavFavsLinks;

//var globalAddEdit;

	$(function() {
		// Loading the settings set from the Options page
	    //console.log( "dom ready!" );
	     chrome.storage.sync.get({
	     	quickFocus: true,
	     	moveQuickFind: true,
		    minify: true,
		    resizePB: true,
		    navFavs: true,
		    navFavsLinks: true
		    //addEdit: true
		  }, function(items) {
		  	 globalQuickFocus = items.quickFocus;
		  	 globalMoveQuickFind = items.moveQuickFind;
		     globalMinify = items.minify;
		     globalResizeProcessBuilder = items.resizePB;
		     globalNavFavs = items.navFavs;
		     globalNavFavsLinks = items.navFavsLinks;
		     //globalAddEdit = items.addEdit;
		  });
	});

//*** Set focus to Quick Find filter inputs ***//
// Waits for initial item to load then sets focus after timeout
// Multiple Quick Find fields

// Set quick find input field as focus Setup > Home
	$(document).arrive(".filter-box.input", function() {
    	//console.log('filter-box input');
    	if(globalQuickFocus == true){
	    	var $newElem = $(this);  	
	  		setTimeout(
			  function() 
			  { 
			  	$newElem.focus();  //set focus to quick find to start typing immediately
			  }, 1500);
	  	}
  	});

// Set quick find input field as focus Setup > Object Manager
	$(document).arrive("#globalQuickfind", function() {
    	//console.log('globalQuickfind');
    	if(globalQuickFocus == true){
	    	var $newElem = $(this);
			setTimeout(
			  function() 
			  { 
			  	$newElem.focus();  //set focus to quick find to start typing immediately
			  }, 1500);
		}
  	});

//run when clicked
	$(document).click(function(e) {
	  //console.log(e.target.nodeName);
	  //$('.slds-is-active.active').css("border","solid 10px red");
	  //Let's the page update
	  if(globalQuickFocus == true){
		  setTimeout(
			  function() 
			  { //checks if the tab has focus and then applies focus to the filter depending on the tab
			  	if($('.main-content.split').length == 0 && $('li.tabItem').hasClass('slds-has-focus')){
				  	$('#globalQuickfind').focus();  //set focus to quick find to start typing immediately
				}
				else if($('.main-content.split').length == 1 && $('li.tabItem').hasClass('slds-has-focus')){
					$('.filter-box.input').focus();
				}
			  }, 1000);
		}
	});
//^^^ Set focus to Quick Find filter inputs ^^^//



//*** Custom formatting ***//
  // Move Quick find filter to the left where all the other quick find filters are
	$(document).arrive("#globalQuickfind", function() {
    	if(globalMoveQuickFind == true){
	    	var $newElem = $(this);
	    	// Move quick find input to the left
	    	 // Object Manager Home
	    	$newElem.closest('.bRight').siblings('.bLeft').css("float","left");
	    	$newElem.closest('.bRight').css("float","left");
	    	$newElem.closest('.bRight').css("margin-top","33px");
	    	 // Object Manager > Any object detail page
	    	$('.objectManagerVirtualRelatedListCard .slds-page-header .slds-grid').css("display", "inline-flex");
			$('.objectManagerVirtualRelatedListCard .slds-page-header .slds-grid header').css("margin-right", "8px");
	    }
  	});
	
  // Reduce the extra padding in the main gutters
	$(document).arrive(".slds-template_default", function() {
	  	if(globalMinify == true){
	  		$('.slds-template_default').css("padding","0.4rem");
		}
	});
  // Slim the sandbox label header size
	$(document).arrive('.oneSystemMessage > .system-message', function() {
    	if(globalMinify == true){
	    	var $newElem2 = $(this);
			$newElem2.css('padding','0');
		}
	});

//^^^ Custom formatting ^^^//    

//*** Resize process builder - drag ***//
$(document).arrive('.panelContainer', function(){
//	$(document).click(function(e) { //<-- used to find the item clicked
  	//console.log(e.target.nodeName);
  	//$('.slds-is-active.active').css("border","solid 10px red");
    if(globalResizeProcessBuilder == true){
		var isResizing = false,
		    lastDownX = 0;

		    if($('#handle').length){
		    	//console.log("handle exists");
		    }
		    else{
		    	$('.panelContainer').css({"position":"absolute","right":"0","height":"calc(100% - 100px)"});
		    	$('.panelContainer').prepend('<div id="handle" style="position:absolute; border-left:solid 1px #cfcfcf; border-right:solid 1px #cfcfcf; height:100%; width: 8px; cursor: col-resize; z-index:100;"><div style="position:absolute;top: 46%;border: solid 1px #cfcfcf;width: 4px;height:35px;left: 1px;background: #cfcfcf;"</div></div>');
		    	$('.processuicommonPanel .panelBody').css("width","100%");
		    }

		    var container = $('.wrapper'),
		        left = $('.ruleContainer'),
		        right = $('.panelContainer'),
		        handle = $('#handle');

		    handle.on('mousedown', function (e) {
		        isResizing = true;
		        lastDownX = e.clientX;
		    });

		    $(document).on('mousemove', function (e) {
		        // we don't want to do anything if we aren't resizing.
		        if (!isResizing) 
		            return;

		        var offsetRight = container.width() - (e.clientX - container.offset().left);

		        left.css('right', offsetRight);
		        right.css('width', offsetRight);
		    }).on('mouseup', function (e) {
		        // stop resizing
	        	isResizing = false;
	   		});
	}
});

//^^^ Resize process builder - drag ^^^//

//*** View full API name in process builder modal popup ***//
	$(document).arrive('.summaryRenderer.processuicommonSummaryRenderer.processuicommonTraverserModalBody', function(){
		if(globalResizeProcessBuilder == true){
			$(this).css({"width":"auto"});
			$('.processuicommonSummaryRenderer .selectedText span').css({"white-space": "normal","overflow-wrap": "break-word"});
		}
	})
//^^^ View full API name in process builder modal popup ^^^//

//*** Copy or view formula code of Active Process builder ***//
    function RefreshEventListener() {
    	//console.log('firedRefresh');
	    // Remove handler from existing elements
	    $(".panelContainer .copyTextButton").off(); 

	    // Re-add event handler for all matching elements
	    $(".panelContainer .copyTextButton").on("click", function() {
	        // Handle event.
	        //console.log("Clicked");
	        var $tempElement = $("<input>");
	        var tempText;
	        $("body").append($tempElement);
	        if($(this).siblings("label").hasClass("processuicommonInputText")){
	        	tempText = $(this).siblings("label").find("input").val();
	        }
	        else if($(this).siblings("label").hasClass("processuicommonInputSelect")){
	        	tempText = "Cannot copy this text";
	        }
	        else{
	        	tempText = $(this).siblings("label").find("span.tooltip-body").text();
	        }
	        console.log(tempText);
	        $tempElement.val(tempText).select();
	        document.execCommand("Copy");
	        $tempElement.remove();
	    })
	}
	$(document).arrive('.panelContainer .processuicommonActionPanel .panelBodyContent td:nth-child(3) label', function(){
		if(globalResizeProcessBuilder == true){
			if($(this).siblings(".copyTextButton").length){
		    	//console.log("Copy Text Button exists");
		    	$(this).siblings(".copyTextButton").remove();
		    }
			$(this).after('<div class="copyTextButton" style="display:block; font-size:xx-small; cursor:pointer; color:grey;">Copy Text</div>');
			RefreshEventListener();
		}
	})
	$(document).arrive('.panelContainer .processuicommonOutcomePanel .panelBodyContent td:nth-child(5) label', function(){
		if(globalResizeProcessBuilder == true){
			if($(this).siblings(".copyTextButton").length){
		    	//console.log("Copy Text Button exists");
		    	$(this).siblings(".copyTextButton").remove();
		    }
			$(this).after('<div class="copyTextButton" style="display:block; font-size:xx-small; cursor:pointer; color:grey;">Copy Text</div>');
			RefreshEventListener();
		}
	})
//^^^ Copy or view formula code of Active Process builder ^^^//

//*** Setup Nav Rail Favorites ***//
	$(document).arrive('.tree-filter.onesetupNavTreeFilter', function(){
		if(globalNavFavs == true){
			//console.log("setup loaded");
			//console.log(globalNavFavsLinks);
			$(this).after('<style tyle=text/css>.favList{margin-bottom:.5rem; } .favList a:hover{background: var(--lwc-colorBackgroundRowHover,rgb(243, 242, 242));}</style><div class="favList" style="display:block;"><h4 class="slds-text-title_caps section-header" style="padding: 0 0 0 .75rem;">Favorites Quick Menu</h4><ul></ul></div>');

			var JSONLinks = JSON.parse(globalNavFavsLinks);	
			console.log(JSONLinks);
			for (var key of Object.keys(JSONLinks)) {
			    //console.log(key + " -> " + JSONLinks[key])
			    $(".favList ul").append('<li><a href="'+ JSONLinks[key] +'" style="display:block;padding:.25rem 0 .25rem .75rem;text-decoration: none;color: var(--lwc-colorTextDefault,rgb(8, 7, 7));">'+key+'</a></li>');
			}
		}
	})

//^^^ Setup Nav Rail Favorites ^^^//

// Store ApexPostScript values in plugin and auto populate.

//*** Add quick links to the Object Search section. (ex: Account, Opportunity, Contact,Task) Auto fill in search text. ***//
	//  Salesforce is STUPID and doesn't recognize the input update except by real typing. =/
	/*$(document).arrive("#globalQuickfind", function() {
    	//console.log('globalQuickfind');
    	//if(globalQuickFocus == true){
	    	var $newElem = $(this);
	    	$newElem.closest('.bRight').prepend('<div><a href="#" class="prepop">Opportunity</a></div>');

			$( ".prepop" ).click(function(event) {
				event.preventDefault();
				//$("#globalQuickfind").val($(this).text());
				//$("#globalQuickfind").trigger(jQuery.Event('keypress', { keycode: 13 }));
			});

		//}
  	});*/

//^^^ Add quick links to the Object Search section. ^^^//

// Process builder email alert - link out to email alert
// Process builder email alert - add copy text link

// Add user admin page link next to all user profile links - ?noredirect=1&isUserEntityOverride=1

// Feature to toggle remove excess padding / margin (Comfy,Compact,Compressed)
// Feature to compress Object Header

// Display 18 Char ID in header - Grab from URL

// Float Field Search to the left

// Add search filter for Validation Rules

// Warn about process builder version limit prior to creating clone (count children - color code or add count text with warning on limit)

// Sort Crictical updates by status, date, etc. Add filters

// Convert 15 Char ID to 18 - Is this still needed?

// Add default search value when google searching  Ex: salesforce, google sheet script  Possibly turn into separate extension.
// https://developer.chrome.com/extensions/omnibox

// Toggle field API names (probably requires API query)

// Add edit link instead of menu dropdown
//*** Add quick Edit ***// 
// CURRENTLY DOES NOT WORK 
/*
    $(document).arrive('section.related-list-card', function(){
    	if(globalAddEdit == true){
	    	var $newListTable = $(this);
	    	//$newListTable.css('border','solid 10px red');
	    	setTimeout(
					  function() 
					  {
					  	//$('table tbody tr td:last-child a').click();
					  	//console.log($('table tbody tr td:last-child a').length);
					  	var z = $('table tbody tr td:last-child a.rowActionsPlaceHolder');
					  	//console.log(z.length);
					  	$.each(z, function(i,val){
					  		$(val).mouseup();
					  	//console.log(i);
					  		$(val).css('border','solid '+i+'px green');
					  	})

		    			//$newListTable.find('table tbody tr td:last-child').css('border','solid 10px green').prepend('<a href="#" style="position:absolute; top:15px; left:0px;">Edit</a>')
	    				//$tbody.css('border','solid 10px red');
	    			}, 2000);
	    }
    });
*/
//^^^ Add quick Edit ^^^//

// option to block classic setup search enter key

// Bulk delete obsolete / inactive process builder versions - http://www.sfdccloudninja.com/flow/deleting-lots-of-old-flows-process-builders/

//*** bulk download of export files ***//
//https://developer.chrome.com/extensions/downloads
//^^^ bulk download of export files ^^^//


})();