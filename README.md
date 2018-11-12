# cSearch

A jQuery component which is a autocomplete input box

### Example 1
This would create cSearch component with all ***default*** settings.
```
$("div").cSearch();
```
-----------------

If you want to alter the default settings
### Example 2
```
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
  }
});
```
