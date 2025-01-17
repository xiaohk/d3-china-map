/*
 * The script to bind map data and reward data.
 *
 * Jay Wong (2018)
 *
 */

 /* global d3 */

// Set up the size of SVG element
let width = 960,
    height = 600;

let sliderWidth = 600;

// Global values for semesters
let semesters = [2017.5, 2018, 2018.5];
let formatSemester = d => Math.floor(d) === d ? `${d} Spring` : `${Math.floor(d)} Fall`;

let svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Make projection for the china map
let projection = d3.geoMercator()
    .center([116,39])
    .scale(620);
  
let path = d3.geoPath()
    .projection(projection);

// Bind GeoJSON data to D3
d3.json("./data/china.geojson", function(error, provinces){
d3.json("./data/china_coord.json", function(error, coord){
d3.csv("./data/award_table_2018s.csv", function(error, reward){
    if (error){
        console.log(error);
    }

    // Plot the base map
    svg.selectAll("path")
        .data(provinces.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "path");

    // Preparing statistics for making more interesting aesthetics
    // Count cities form the reward table
    let cities = {};
    for (let entry of reward){
        let city = entry.city;
        if (city in cities){
            cities[city].count ++;
        } else {
            cities[city] = {"count": 1};
        }
    }

    // Get the coordinate and chinese name of each city in the reward table
    for (let city in cities){
        cities[city].hanzi = coord[city].hanzi;
        cities[city].coord = coord[city].coord.reverse();
    }

    // Change the city dictionary to array, so we can use data() more easily
    // Also sort by the count, so smaller circle show on top
    let city_array = d3.entries(cities).sort(function(a, b) {
        return b.value.count - a.value.count;
    });

    // Create a scale for circle area
    let areaScale = d3.scaleSqrt()
        .domain([
            0,
            d3.max(city_array, function(d) { return d.value.count; })
        ])
        .range([0, 30]);

    // Add circles
    svg.selectAll("circle")
        .data(city_array)
        .enter()
        .append("circle")
        .attr("r", function(d) { return areaScale(d.value.count); })
        .attr("cx", function(d) { return projection(d.value.coord)[0]; })
        .attr("cy", function(d) { return projection(d.value.coord)[1]; })
        .style("fill-opacity", "0.2")
        .style("fill", "red")
        .style("stroke", "white")
        .style("stroke-width", ".1px")
        .on("mouseover",function(d) {
            d3.select(this)
                .style("stroke-opacity", "0.5")
                .style("stroke", "#606060")
                .style("stroke-width", "1px");
            showInfoText(d);
        })
        .on("mouseout",function(){
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", ".3px");
            hideInfoText();
        });
    
    // Add a legend layer
    let legend = svg.append("g")
        .attr("transform", "translate(" + (width - 250) + "," +
              (height - 100) + ")")
        .selectAll("g")
        .data([5, 20, 50, 100])
        .enter().append("g");

    // Add four circles
    legend.append("circle")
        .attr("cy", function(d) { return -areaScale(d); })
        .attr("r", areaScale)
        .style("fill", "none")
        .style("stroke", "#606060")
        .style("stroke-width", ".3px");

    // Add counts corresponding to the circles
    legend.append("text")
        .attr("y", function(d) { return -2 * areaScale(d); })
        .attr("dy", "1.3em")
        .text(d3.format("i"))
        .style("font", "7px sans-serif")
        .style("text-anchor", "middle")
        .style("fill", "#606060");

    // Add a title layer
    let title = svg.append("text")
        .attr("x", width / 2)    
        .attr("y", height - 70)
        .attr("text-anchor", "middle")
        .style("font", "16px serif")
        .style("fill", "#606060")
        .text(`Chinese Students on UW-Madison Dean's List (${formatSemester(d3.max(semesters))})`);

    // Add info text box
    let text_pos = [width - 300, height - 300];
    let info_texts = [];

    for (let i = 0; i < 3; i ++){
        info_texts.push(
            svg.append("text")
                .attr("x", text_pos[0])
                .attr("y", text_pos[1])
                .attr("dy", i * 20)
                .attr("class", "info_text_hidden")
                .text("City: kunming")
        );
    }

    // Add a slider to alter semesters
    let makeSlider = d3.sliderHorizontal()
        .min(d3.min(semesters))
        .max(d3.max(semesters))
        .step(0.5)
        .width(sliderWidth)
        .tickFormat(formatSemester)
        .ticks(3)
        .default(d3.max(semesters))
        .displayValue(false)
        .on('onchange', val => {
            title.text(`Chinese Students on UW-Madison Dean's List (${formatSemester(val)})`);
        });

    svg.append("g")
        .attr('transform', 'translate(100, 550)')
        .call(makeSlider);

    function showInfoText(d){
        /*
         * When mouse over any circles, display details in the info text
         * 
         * Args:
         *      d: one key value pair object from data()
         */
        
        // Load specific text for each line
        info_texts[0].text("City: " + d.key[0].toUpperCase() + 
            d.key.substring(1) + " (" + d.value.hanzi + ")");

        info_texts[1].text("Coord: " + d.value.coord[1] + "° N, " +
            d.value.coord[0] + "° E");

        info_texts[2].text("Student Counts: " + d.value.count);

        for (let i = 0; i < 3; i ++){
            info_texts[i].attr("class", "info_text_show");
        }
    }

    function hideInfoText(){
        /*
         * When mouse out any circles, hide details in the info text
         *
         * Args:
         *      d: one key value pair object from data()
         */
        for (let i = 0; i < 3; i ++){
            info_texts[i].attr("class", "info_text_hidden");
        }
    }

});});});