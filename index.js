(function($){
	$(document).ready(function(){
		$("div").cSearch({
			limit:5,
			enableCache:true,
			filter:function(value,data){
				return data.name.toLowerCase().indexOf(value.toLowerCase()) == 0; //Countries strictly starting with entered value
			},
			selectedCountry:function(data){
				console.log("selected country",data);
			},selectedValue:function(data){
				console.log("selected value",data);
			},

		});
	});
}(jQuery));
