//Add a transition for starting scene
//Transition in by moving main out and fading new in? Or move new to position and then quickly translate it back over 750ms
//Go through GlobalRollingAverageCountry.csv and GlobalRollingTemperatures.csv and fix country names not in GlobalAverageDifference.
//Make a way to go back to main circles
//Do I need to clear country SVG after each run?

let mainSvgID = '#global-warming-graph';
let countrySvgID = '#country-warming-graph';

//Load larger data in now
var countryAvgs;
var globalAvgs;

//Some constants
const tableSize = 1000;
const chartSize = 800;

/************************************************ 
 * Function to create the initial circles as part of the martini glass view.
 * Each circle has text overlaying it with the 3 digit country code
 * Circles and text have tooltips associated to display the full name of the country
 * as well as the difference in degrees celsius in temp from 1860 to 2010.
 * Clicking on any country will transition to a line graph showing the average
 * rolling temperature of 10 years from 1860 to 2010, as well as another line
 * showing the global average rolling temp of 10 years from 1860 to 2010.
 * 
 * params: None
 * returns: None
************************************************/
async function all_country_circles() {
    //First, load the data in now so it's only loaded once
    const rawData = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalAverageDifference.csv');
    const countryCodes = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CountryCodes.csv');
    countryAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingAverageCountry.csv', processData);
    globalAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingTemperatures.csv', processData);

    //Sort global averages now so it's only done once
    globalAvgs.sort((a,b) => a.year - b.year);

    const diffMean = 1.55;

    var tooltip = d3.select("#tooltip")
    //Next, create a grid for the circles representing the countries (164 in total) 
    const numRows = 8;
    const numCols = 19;
    const transitionSize = 1100;
    var tableData = d3.range(numCols*numRows).slice(0, -1); //Remove last 7 items to match data

    //Create x and y scale for circles
    var x = d3.scaleBand()
        .range([0, tableSize])
        .domain(d3.range(numCols));

    var y = d3.scaleBand()
        .range([0,tableSize])
        .domain(d3.range(numRows));

    //Get svg and it's width/height on the screen
    var svg = d3.select(mainSvgID);
    
    //Create a container and center it
    var container = svg.append("g")
        .attr("width", tableSize)
        .attr("height", tableSize)
        // .attr("transform", "translate(" + (svgWidth-1600)/2 + "," + (svgHeight-955)/2 + ")");
        .attr("transform", "translate(42,50)");
    

    //Create linear chart for gradient filling in
    var circleColors = d3.scaleLinear()
        .domain([1, 1.8])
        .range(["ghostwhite", "darkorange"]);
    // .range(["rgba(248,248,255,0.75)","rgba(255,170,0,1)"]);
    
    //Create linear range for opacity
    var circleOpacity = d3.scaleLinear()
        .domain([1, 1.8])
        .range([0.5, 1]);

        
    //Fill the container with circles
    container.selectAll("circle")
        .data(tableData)
        .enter().append("circle")
        .attr('cx', function(d) {return x(d % numCols)*1.6;})
        .attr('cy', function(d) {return y(Math.floor(d / numCols));})
        .attr('r', function(d, i) {return 35 + (parseFloat(rawData[i].Diff) - diffMean)*10;})
        .attr('fill', function(d, i) {return circleColors(parseFloat(rawData[i].Diff));})
        .attr('stroke', 'black')
        .on("mouseover", function(d,i) {
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(rawData[i].Country + '<br>Diff: ' + Math.round(rawData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() {
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {tooltip.style("opacity", 0)})
        .on("click", function(d,i) {
            svg.transition()
                .duration(500)
                .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")
                .on("end", function(d) {
                    //Move graph off screen, then make country graph visible
                    var countrySvg = d3.select(countrySvgID)
                    .attr("transform", "translate(" + transitionSize*2 + ",0)scale(1)")

                    //Make the div that holds the circles invisible
                    d3.select('#mainSvgHolder').style('display', 'none');
                    
                    //Make the div that holds the country svg visible
                    d3.select('#countrySvgHolder').style('display', 'flex');
                    d3.select('#countrySvgHolder').style('justify-content', 'center');

                    //Transition country graph in
                    countrySvg.transition()
                        .duration(500)
                        .attr("transform", "translate(350,50)");     
                });

            //Don't propogate to parent elements
            d3.event.stopPropagation();
            
            //Create new graphs
            createLineGraphsForCountry(rawData[i].Country)
          });

    //Fill circles with text
    container.selectAll("text")
        .data(tableData)
        .enter().append("text")
        .text(function(d,i) { return getCountryCode(rawData[i].Country, countryCodes); })
        .attr("x", function(d) {return (x(d % numCols)*1.601)-15;})
        .attr("y", function(d) {return (y(Math.floor(d / numCols)))+5;})
        .attr("opacity", function(d, i) {return circleOpacity(rawData[i].Diff);})
        .attr("font-family","Franklin Gothic")
        .on("mouseover", function(d,i) {
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(rawData[i].Country + '<br>Diff: ' + Math.round(rawData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() {
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {tooltip.style("opacity", 0)});
}




//Create a line graph for a specific country, along with the global average over time to compare
async function createLineGraphsForCountry(country) {
    const offset = 50;

    //Get country data and sort by year
    let countryData = countryAvgs.filter(item => item.country == 'Afghanistan');
    countryData.sort((a,b) => a.year - b.year);

    //Combine global data and country data into one array to get min/max scale for y axis
    var allTemps = [];
    for (i = 0; i < countryData.length; i++)
        allTemps.push(countryData[i].value);
    for (i = 0; i < globalAvgs.length; i++)
        allTemps.push(globalAvgs[i].value);

    //Get svg, add margins and get width of svg
    var svg = d3.select(countrySvgID)
        // .attr("transform", "translate(50%,50%)");

    var x = d3.scaleTime()
        .domain(d3.extent(countryData, function(d) { return d.year; }))
        .range([ 0, chartSize ]);
    var y = d3.scaleLinear()
        .domain([d3.min(allTemps), d3.max(allTemps)])
        .range([ chartSize, 0 ]);
    
    
    //Add X axis
    svg.append("g")
        .attr("transform", "translate(" + offset + "," + chartSize + ")")
        .attr('width', chartSize)
        .attr('height', chartSize)
        .call(d3.axisBottom(x));

    //Add Y axis
    svg.append("g")
        .attr("transform", "translate(" + offset + ",0)")
        .call(d3.axisLeft(y));

    console.log(globalAvgs);
    //Add the line for country data
    svg.append("path")
        .datum(globalAvgs)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x(function(d) { return x(d.year)+offset })
        .y(function(d) { return y(d.value) })
    );

}



function getCountryCode(countryName, rawData) {
    for (var i=0; i < rawData.length; i++) {
        if (rawData[i].Country == countryName) {
            return rawData[i].A3Code;
        }
    }
}

function processData(d) {
    return {country: d.Country, 
            year: d3.timeParse("%Y")(d.Year), 
            value: d.AverageTemperatureRolling,
            uncertainty: d.AverageTemperatureUncertaintyRolling};
}