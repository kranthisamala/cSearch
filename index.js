(function($){
	$(document).ready(function(){
		$("div").cSearch({
			limit:5,
			enableCache:true,
			filter:function(value,data){
				return data.name.indexOf(value)>-1;
			},
			selectedCountry:function(data){
				console.log("selected country",data);
			},selectedValue:function(data){
				console.log("selected value",data);
			},

		});
	});
}(jQuery));