// set width and height of svg element
var width = 1140;
var height = 500;

// create projection
var projection = d3.geo.albersUsa()
	.translate([width / 2, height / 2])
	.scale([1100]);

// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
var path = d3.geo.path()
	.projection(projection);

// create an svg element to the body of the html
var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height);

// add a tooltip
var tooltip = d3.select("body")
	.append("div")
	.attr("class", "tooltip");

// create a quantize scale (function) to sort data values into buckets of color
var color = d3.scale.quantize()
	.range(colorbrewer.Greens[5])

// make a legend
var legend = d3.select("#legend")
	.append("ul")
	.attr("class", "list-inline");

// function to calculate a color based on the ag productivity from data/us-ag-productivity-2004.csv file
function calculate_color(d) {

	var value = d.properties.composite;

	if (value) {
		return color(value);
	} else {
		return "#ccc"; // grayish
	}
}

// load the agriculture data
d3.csv("data/2018-usgs-water-science-centers-total-funding.csv", function(funding_data) {

	// set the input domain for the color scale
	color.domain([
		// d3.min(funding_data, function(d) {	return parseFloat(d.total); }),
		50 , // 56% is lowest (WI)
		d3.max(funding_data, function(d) { return (d.composite); })
		]);

	// load the data file; note path is relative from index.html
	d3.json("data/us-states.json", function(error, json) {

		if (error) { return console.error(error) };	

		// merge the ag. data and geojson
		for (var i = 0; i < funding_data.length; i++) {

			// get the state name
			var funding_data_state = funding_data[i].state;

			// get the data values and convert from string to float
			var wsc_value = (funding_data[i].wsc);
			var composite_data_value = parseFloat(funding_data[i].composite);
			var cost_center_data_value = parseFloat(funding_data[i].cost_center);
			var facility_data_value = parseFloat(funding_data[i].facility);

			// find the corresponding state inside the geojson
			for (var j = 0; j < json.features.length; j++) {

				// get the json state name
				var json_data_state = json.features[j].properties.name;

				if (funding_data_state === json_data_state) {

					// copy the ag data value into the the json
					json.features[j].properties.wsc = wsc_value;
					json.features[j].properties.composite = composite_data_value;
					json.features[j].properties.cost_center = cost_center_data_value;
					json.features[j].properties.facility = facility_data_value;					

					// stop looking through the geojson
					break;
				}
			}	
		}
		
		// bind the data and create one path for each geojson feature
		svg.selectAll("path")
			.data(json.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("fill", calculate_color);

		svg.selectAll("path")
			.data(json.features)
			.on("mouseover", function(d) {
				d3.select(this)
					.transition().duration(500)
					.attr("fill", "orange")
					.attr("stroke-width", 3)
				d3.select("#state_name").text(d.properties.name)
				d3.select("#wsc").text("WSC: " + (d.properties.wsc))
				d3.select("#State Composite").text("Composite: " + d3.format(".2f,%")(d.properties.composite))
				d3.select("#State Cost Center").text("CostCenter: " + d3.format(".2f,%")(d.properties.cost_center))
				d3.select("#state_facility").text("Facility: " + d3.format(".2f,%")(d.properties.facility));
			})
			.on("mouseout", function(d) {
				d3.select(this)
					.transition().duration(500)
					.attr("fill", calculate_color)
					.attr("stroke-width", 1)
		  		return tooltip.style("visibility", "hidden");
			})
			.on("click", function(d) {	// display a tooltip
		  		return tooltip.style("visibility", "visible")
		  				.style("top", (d3.event.pageY + 10) + "px")
		  				.style("left", (d3.event.pageX + 10) + "px")
		  				.html("<h2>" + d.properties.name + "</h2>" + 
		  					  "<br\>" +
		  					  "<h3>WSC: " + (d.properties.wsc) + "</h3>" + 
		  					  "<hr>" +
		  					  "<h4>Composite: " + d3.format(".2f,%")(d.properties.composite) + "</h4>" + 
		  					  "<h4>Cost Center: " + d3.format(".2f,%")(d.properties.cost_center) + "</h4>" +
		  					  "<h4>Facility: " + d3.format(".2f,%")(d.properties.facility) + "</h4>");

		  	})
		  	.on("mousemove", function() {
		  		return tooltip.style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px");
		  	})
		
		var keys = legend.selectAll("li.key")
			.data(color.range())

		keys.enter().append("li")
			.attr("class", "key")
			.style("border-top-color", String)
			.text(function(d) {
				var r = color.invertExtent(d);
				var format = d3.format(".2f,%");
				return format(+r[0]) + " - " + format(+r[1]);
			});
	});
});
