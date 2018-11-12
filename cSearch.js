/**
 * cSearch plugin
 * 
 * Name: cSearch
 * Author: kranthi samala
 * Version: 1.0
*/
var cSearchData = cSearchData||{};
(function($){
	cSearchData = {
		count:1
	}
	$.fn.cSearch = function(option){
		/**
		* Note : Can change default properties using $.fn.cSearch.default 
		*/
		
		// dataUrl	---	URL used for requesting data. 
		var dataUrl =  "https://restcountries.eu/rest/v2/name/{%}";
		var Debug = false;
		var lastRequestedData = [];
		var last_request;
		
		var options = $.extend({
		// styleUrl	---	external style sheet for desinging component
		styleUrl: "cSearch.css",
		// theme 	---	theme selected from styleUrl
		theme: "light-theme",
		// // filter    --- Function/Array to omit values from search result.
		// // if function is used, it should return false to omit it from list
		filter: null,
		// minimum length of input to start searching
		minLen: 1,
		//use cache to avoid unnecessary requests
		enableCache:false,
		//cachedData saves cached results
		cachedData: {},
		//function called when result is selected or enter is clicked
		selectedValue:null,
		//function called only when a valid country is selected
		selectedCountry:null,
		//limit the max number of results to be shown
		limit:undefined
		},
		$.fn.cSearch.default,
		option);

		var DOWN_ARROW = 40, UP_ARROW = 38, ESCAPE = 27, ENTER = 13;
		
		//identifires
		var cSearch_elements = "cSearch_elements", cSearch_wrap_input = "cSearch_wrap_input", cSearch_input = "cSearch_input", cSearch_results = "cSearch_results", cSelected = "selected";
		//selectors
		var INPUT_ELE_SELECTOR = "[cSearch_input]", RESULT_ELE_SELECTOR = "[cSearch_results]", PARENT_ELE_SELECTOR = "[csSearch_wrap]", SUGGESTION_ELE_SELECTOR = "[cSearch_elements]", SELECTED_SUGGESTION_ELE_SELECTOR = "[cSearch_elements].selected", INPUT_PARENT_ELE_SELECTOR = "[cSearch_wrap_input]";
		//stopping log
		var LOGGER = console.log;
		if(!Debug){
			LOGGER = function(){};
		}

		var load_stylesheet = function(){
			LOGGER("loading stylesheet");
			if(!$("link[href='"+options.styleUrl+"']").length){
			    $("<link/>",{
				   rel: "stylesheet",
				   type: "text/css",
				   href: options.styleUrl
				}).appendTo("head");
			}
		}

		var create_element = function(tag,properties,appendTo){
			if(appendTo){
				return $(tag,properties).appendTo(appendTo);
			}else
				return $(tag,properties);
		}
		
		var draw_results = function(ele,data){
			lastRequestedData = data;
			let parent = $(ele).find(RESULT_ELE_SELECTOR);
			parent.empty();
			for(key in data)
			{
				let val = data[key];
				create_element("<li>",{
					"cSearch_elements":"cSearch_elements",
					value:val['name']
				},parent).text(val['name']);
			}
			parent.show();
		}

		var create_basic_template = function(element){
			var outer = create_element("<div>",{
				"cSearch_wrap_input":"cSearch_wrap_input"
			},element);
			var inner = create_element("<div>",{},outer);
			create_element("<input/>",{
				type: 'text',
				"cSearch_input":"cSearch_input",
			},inner);
			create_element("<ul>",{
				"cSearch_results":"cSearch_results"
			},element).hide();
		}

		var filterResults = function(countries,value){
			if($.isFunction(options.filter)){
				var filteredCountries = [];
				for(let index in countries){
					let country = countries[index];
					if(options.filter(value,country)){
						filteredCountries.push(country);
					}
				}
				return filteredCountries;
			}else{
				return countries;
			}

		}

		var close_autoComplete = function(element){
			$(element).find(RESULT_ELE_SELECTOR).hide();
		}

		var open_autoComplete = function(element){
			$(element).find(RESULT_ELE_SELECTOR).show();
		}
		var find_relavant_json = function(val){
			for(let index in lastRequestedData){
				let country = lastRequestedData[index];
				if(country.name == val){
					return {
						status	: 	true,
						data 	: 	country
					};
				}
			}
			return {
				status 	: 	false
				};
		}
		var send_result = function(element,val){
			var temp = find_relavant_json(val);
			// selected value
			if($.isFunction(options.selectedValue))
				options.selectedValue(val);
			
			//selected country
			if(temp.status && $.isFunction(options.selectedCountry))
				options.selectedCountry(temp.data);

			close_autoComplete(element);
		}
		var request_data_and_Draw = function(element){
			$this = $(element).find(INPUT_ELE_SELECTOR);
			
			let val = $this.val().trim().toLowerCase();
			if(val.length < options.minLen){
				close_autoComplete(element);
				return;
			}
			if($this.attr("old_val") == val){
				if($(element).find(RESULT_ELE_SELECTOR).is(":hidden")){
					open_autoComplete(element);
				}
				return;
			}
			$this.attr("old_val",val);
			var url = dataUrl.replace("{%}",encodeURIComponent(val));
			if(options.enableCache && options.cachedData[val]){
				draw_results(element,options.cachedData[val]);
				return;
			}else{
				if(last_request)last_request.abort();
				last_request = $.ajax({
					method	: 	"GET",
					url 	: 	url,
					success : 	function(data){
						LOGGER("gotdata",data);
						if(!$.isArray(data)){
							return;
						}
						data = filterResults(data,val);
						if($.isNumeric(options.limit))
							data = data.slice(0,options.limit);
						if(options.enableCache){
							options.cachedData[val] = data;
						}
						draw_results(element,data);
					},
					error 	: 	function(){
						if(options.enableCache){
							options.cachedData[val] = [];
						}
						draw_results(element,[]);
						LOGGER("Ajax error found");
					}
				});
			}
		}

		var select_next = function(element){
			if($(element).find(RESULT_ELE_SELECTOR).is(":hidden")){
				request_data_and_Draw(element);
				return;
			}else{
				let $ele = $(element).find(SELECTED_SUGGESTION_ELE_SELECTOR);
				if($ele.is(":last-child")){
					let $input = $(element).find(INPUT_ELE_SELECTOR);
					$input.val($input.attr("old_val"));
					$ele.removeClass(cSelected);
					return;
				}
				let $next;
				if($ele.length>0){
					$next = $ele.next();
				}else{
					$next = $(element).find(RESULT_ELE_SELECTOR).find("li:first-child");
					if($next.length<1)return;
				}
				$ele.removeClass(cSelected);
				$next.addClass(cSelected);
				let $input = $(element).find(INPUT_ELE_SELECTOR);
				$input.val($next.attr("value"));
			}
		}

		var select_prev = function(element){
			if($(element).find(RESULT_ELE_SELECTOR).is(":hidden")){
				request_data_and_Draw(element);
				return;
			}else{
				let $ele = $(element).find(SELECTED_SUGGESTION_ELE_SELECTOR);
				if($ele.is(":first-child")){
					let $input = $(element).find(INPUT_ELE_SELECTOR);
					$input.val($input.attr("old_val"));
					$ele.removeClass(cSelected);
					return;
				}
				let $prev;
				if($ele.length>0){
					$prev = $ele.prev();
				}else{
					$prev = $(element).find(RESULT_ELE_SELECTOR).find("li:last-child");
				}
				$ele.removeClass(cSelected);
				$prev.addClass(cSelected);
				$(element).find(INPUT_ELE_SELECTOR).val($prev.attr("value"));
			}
		}

		var select_present_active = function(element){
			var $ele = $(element).find(RESULT_ELE_SELECTOR);
			if(!$ele.is(":hidden")){
				let $this = $ele.find(SELECTED_SUGGESTION_ELE_SELECTOR);
				if($this.length>0){
					let val = $this.attr("value");
					$(element).find(INPUT_ELE_SELECTOR).val(val);
					send_result(element,val);
					return;
				}
			}
			let val = $(element).find(INPUT_ELE_SELECTOR).val().trim();
			if(val.length>0){
				send_result(element,val);
			}
		}
		var remove_event_listerners = function(element){
			$("html").off("click.cSearch"+getID(element));
			$(element).find(INPUT_ELE_SELECTOR).off("keyup.cSearch"+getID(element));
			$(element).find(INPUT_ELE_SELECTOR).off("keydown.cSearch"+getID(element));
			close_autoComplete(element);
		}
		var keyup_handler = function($this,element,event){
			var keycode = (event.keyCode ? event.keyCode : event.which);
			switch(keycode){
				case DOWN_ARROW:
					select_next(element);
					return;
				break;
				case UP_ARROW:
					select_prev(element);
					return;
				break;
				case ESCAPE:
					$this.val($this.attr("old_val"));
					close_autoComplete(element);
					return;
				break;
				case ENTER:
					select_present_active(element);
					return;
				break;
			}
			request_data_and_Draw(element);
		}
		var getID = function(element){
			return element.replace("#cSearch");
		}
		var add_temp_event_listeners = function(element){
			$("html").on("click.cSearch"+getID(element),function(){
				remove_event_listerners(element);
			});
			$(element).find(INPUT_ELE_SELECTOR).on("keydown.cSearch"+getID(element),function(event){
				var listener = $._data($(this)[0],'events').keyup;
				if(!listener){
					LOGGER("keyup added");
					$(this).on("keyup.cSearch"+getID(element),function(event){
						keyup_handler($(this),element,event);
					});
				}else{
					LOGGER(listener);
				}
			});
		}
		var bind_listeners = function(element){
			$(window).blur(function() {
			    remove_event_listerners(element);
			});
			$(element).on('focusin',INPUT_ELE_SELECTOR,function(){
				add_temp_event_listeners(element);
			})
			$(element).on('click',SUGGESTION_ELE_SELECTOR,function(event){
				event.preventDefault();
				event.stopPropagation();
				var val = $(this).attr("value");
				$(element).find(INPUT_ELE_SELECTOR).val(val);
				send_result(element,val);
			})
			$(element).on('mouseover',SUGGESTION_ELE_SELECTOR,function(event){
				LOGGER("bool");
				var $selected = $(element).find(SELECTED_SUGGESTION_ELE_SELECTOR);
				if($selected.length>0)
					$selected.removeClass(cSelected);
				$(this).addClass(cSelected);
			})
			$(element).on('mouseleave',SUGGESTION_ELE_SELECTOR,function(){
				$(this).removeClass(cSelected);
			})
			$(element).on('click',INPUT_PARENT_ELE_SELECTOR,function(event){
				event.preventDefault();
				event.stopPropagation();
				$(this).find(INPUT_ELE_SELECTOR).focus();
			});
		}

		var init = function(element){
			$(element).attr({
				csSearch_wrap:"",
				class:options.theme
			});
			if(options.styleUrl&&options.styleUrl.length>0){
				load_stylesheet();
			}
			create_basic_template(element);
			bind_listeners(element);
		}

		this.filter("div").each(function(){
			$(this).attr("id","cSearch"+cSearchData.count);
			init("#cSearch"+cSearchData.count++);
		});
		return this;
	}
}(jQuery));
