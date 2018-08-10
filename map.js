/*
 * The script to bind map data and reward data.
 *
 * Jay Wong (2018)
 *
 */

// Set up the size of SVG element
var width = 960,
    height = 600

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)

// Make projection for the china map
var projection = d3.geoMercator()
    .center([116,39])
    .scale(600)
  
var path = d3.geoPath()
    .projection(projection)

// Bind GeoJSON data to D3
d3.json("./data/china.geojson", function(error, provinces){
d3.json("./data/china_coord.json", function(error, coord){
d3.csv("./data/award_table.csv", function(error, reward){
    if (error){
        console.log(error)
    }

    // Plot the base map
    svg.selectAll("path")
        .data(provinces.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "path")

    // Preparing statistics for making more interesting aesthetics
    // Count cities form the reward table
    var cities = {}
    for (var entry of reward){
        city = entry["city"]
        if (city in cities){
            cities[city]["count"] ++
        } else {
            cities[city] = {"count": 1}
        }
    }

    // Get the coordinate of each city in the reward table
    for (var city in cities){
        cities[city]["coord"] = coord[city]["coord"].reverse()
    }

    // Change the city dictionary to array, so we can use data() more easily
    // Also sort by the count, so smaller circle show on top
    var city_array = d3.entries(cities).sort(function(a, b) {
        return b["value"].count - a["value"].count
    })

    // Create a scale for circle area
    var areaScale = d3.scaleSqrt()
        .domain([
            0,
            d3.max(city_array, function(d) { return d["value"].count })
        ])
        .range([0, 30])

    // Add circles
    svg.selectAll("circle")
        .data(city_array)
        .enter()
        .append("circle")
        .attr("r", function(d) { return areaScale(d["value"].count) })
        .attr("cx", function(d) { return projection(d["value"].coord)[0] })
        .attr("cy", function(d) { return projection(d["value"].coord)[1] })
        .style("fill-opacity", "0.2")
        .style("fill", "red")
        .style("stroke", "white")
        .style("stroke-width", ".1px")
        .on("mouseover",function(d) {
            d3.select(this)
            .style("stroke-opacity", "0.5")
            .style("stroke", "#606060")
            .style("stroke-width", "1px")
        })
        .on("mouseout",function(d){
            d3.select(this)
            .style("stroke", "white")
            .style("stroke-width", ".3px")
        })
    
    // Add a legend layer
    var legend = svg.append("g")
        .attr("transform", "translate(" + (width - 250) + "," +
              (height - 100) + ")")
        .selectAll("g")
        .data([5, 20, 50, 100])
        .enter().append("g");

    // Add four circles
    legend.append("circle")
        .attr("cy", function(d) { return -areaScale(d) })
        .attr("r", areaScale)
        .style("fill", "none")
        .style("stroke", "#606060")
        .style("stroke-width", ".3px")

    // Add counts corresponding to the circles
    legend.append("text")
        .attr("y", function(d) { return -2 * areaScale(d) })
        .attr("dy", "1.3em")
        .text(d3.format(".1s"))
        .style("font", "7px sans-serif")
        .style("text-anchor", "middle")
        .style("fill", "#606060")

    // Add a title layer
    svg.append("text")
        .attr("x", width / 2)    
        .attr("y", height - 70)
        .attr("text-anchor", "middle")
        .style("font", "16px serif")
        .style("fill", "#606060")
        .text("Chinese Students on UW-Madison Dean's List (2018 Spring)")

})})})


