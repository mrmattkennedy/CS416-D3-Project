//Go through GlobalRollingAverageCountry.csv and GlobalRollingTemperatures.csv and fix country names not in GlobalAverageDifference.
//Add annotations to first page and information
//Add annotations and information to second page
//Do I need a legend for the graph?
//Change page icon
//3rd page.... ?
//Try the filters :(

/*
* Annotations - 1 is hottest point, do 1 for 1900, 1950, 2000 vs global average
*/
const type = d3.annotationLabel
const annotations = [{
    note: {
        label: "Longer text to show text wrapping",
        bgPadding: 20,
        title: "Annotations :)"
    },
    className: "show-bg",
    dy: 137,
    dx: 162
}];

let mainSvgID = '#global-warming-graph';
let countrySvgID = '#country-warming-graph';

//Load larger data in now
var rawData, countryCodes, countryAvgs;
var avgMin, avgMax;
// var globalAvgs;

//Some constants
const tableSize = 1000;
const chartSize = 800;
const transitionSize = 1100;
const circleDomainMin = 1.0;
const circleDomainMax = 1.8;
const diffMean = 1.55;
const numRows = 8;
const numCols = 19;
const startColor = 'ghostwhite';
const endColor = 'darkOrange'

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
    rawData = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalAverageDifference.csv');
    countryCodes = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CountryCodes.csv');
    countryAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingAverageCountry.csv', processData);
    // globalAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingTemperatures.csv', processData);
    //Sort global averages now so it's only done once
    // globalAvgs.sort((a,b) => a.year - b.year);

    //Get min and max
    var allTemps = [];
    for (i = 0; i < countryAvgs.length; i++)
        allTemps.push(countryAvgs[i].value);

    avgMin = d3.min(allTemps);
    avgMax = d3.max(allTemps);

    var tooltip = d3.select("#tooltip")

    //Next, create a grid for the circles representing the countries (151 in total) 
    var tableData = d3.range(numCols*numRows).slice(0, -1); //Remove last 1 items to match data

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
        .domain([circleDomainMin, circleDomainMax])
        .range(["ghostwhite", "darkorange"]);
    // .range(["rgba(248,248,255,0.75)","rgba(255,170,0,1)"]);
    
    //Create linear range for opacity
    var circleOpacity = d3.scaleLinear()
        .domain([circleDomainMin, circleDomainMax])
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
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(rawData[i].Country + '<br>Diff: ' + Math.round(rawData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {tooltip.style("opacity", 0)}) //When mouse leaves the space, remove the tooltip
        .on("click", transitionToCountryGraph); //Transition to that country's graph on click

    //Fill circles with text
    console.log(countryCodes)
    container.selectAll("text")
        .data(tableData)
        .enter().append("text")
        .text(function(d,i) { return getCountryCode(rawData[i].Country, countryCodes); })
        .attr("x", function(d) {return (x(d % numCols)*1.601)-15;})
        .attr("y", function(d) {return (y(Math.floor(d / numCols)))+5;})
        .attr("opacity", function(d, i) {return circleOpacity(d.Diff);})
        .attr("font-family","Franklin Gothic")
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(rawData[i].Country + '<br>Diff: ' + Math.round(rawData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {tooltip.style("opacity", 0)}) //When mouse leaves the space, remove the tooltip
        .on("click", transitionToCountryGraph); //Transition to that country's graph on click
}




//Create a line graph for a specific country, along with the global average over time to compare
/************************************************ 
 * Function to lay out line chart of temperature in celsius
 * for a country from 1860 to 2010. This chart includes
 * a gradient based on the minimum/maximum of that country's
 * temperature, and scatter points for tool tips.
 * 
 * 
 * params: idx - This is the index of the country from the rawData array.
 * returns: None
************************************************/
async function createLineGraphsForCountry(idx) {
    const country = rawData[idx].Country
    const offset = 60;
    const scatterDelta = 5;

    //Get country data and sort by year
    let countryData = countryAvgs.filter(item => item.country == country);
    countryData.sort((a,b) => a.year - b.year);
    
    //Create scatter plot data from country data
    var scatterData = [];
    for (i = 0; i < countryData.length; i=i+scatterDelta) {
        scatterData.push(countryData[i]);
      }

    //Combine global data and country data into one array to get min/max scale for y axis
    var allTemps = [];
    for (i = 0; i < countryData.length; i++)
        allTemps.push(countryData[i].value);

    const min = d3.min(allTemps);
    const max = d3.max(allTemps);
    // for (i = 0; i < globalAvgs.length; i++)
    //     allTemps.push(globalAvgs[i].value);

    //Get svg, clear conents
    var svg = d3.select(countrySvgID);
    svg.selectAll("*").remove();

    //Group for sub elements
    const g = svg.append("g")
        .attr("transform", "translate(" + offset + "," + 0 + ")");

    var x = d3.scaleTime()
        .domain(d3.extent(countryData, function(d) { return d.year; }))
        .range([ 0, chartSize ]);
    var y = d3.scaleLinear()
        .domain([d3.min(allTemps), d3.max(allTemps)])
        .range([ chartSize, 0 ]);
    
    //Add X axis
    svg.append("g")
        .attr("transform", "translate(" + offset + "," + chartSize + ")")
        .style("font", "14px times")
        .attr('width', chartSize)
        .attr('height', chartSize)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("fill", "black")
        .style("font", "14px times")
        .attr("transform", "translate(" + -40 + "," + -(chartSize/2) + ")rotate(270)")
        .text('10 year average temperature (\xB0C)');

    //Add Y axis
    svg.append("g")
        .attr("transform", "translate(" + offset + ",0)")
        .style("font", "14px times")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "black")
        .style("font", "14px times")
        .attr("transform", "translate(" + (chartSize/2) + "," + (chartSize+50) + ")")
        .text("Year");

    //Y axis gridline
    g.append("g")
        .attr("class", "y-axis-grid")
        .attr("stroke-width", 0.1)
        .call(
          d3.axisLeft(y)
            .tickSize(-chartSize)
            .tickFormat("")
            .ticks(5)
    
        );
    
    //Set the gradient for the line
    svg.append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(min))
        .attr("x2", 0)
        .attr("y2", y(max))
        .selectAll("stop")
        .data([
            {offset: "0%", color: 'orange'},
            {offset: "100%", color: 'red'}
        ])
        .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });


    //Add the line for country data
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "url(#line-gradient)" )
        .attr("stroke-width", 2)
        .attr("d", d3.line()
        .x(function(d) { return x(d.year)+offset })
        .y(function(d) { return y(d.value) })
    );

    //Add scatter points for tool tips
    var tooltip = d3.select("#tooltip")
    svg.append("g")
        .selectAll("dot")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.year)+offset } )
        .attr("cy", function(d) { return y(d.value) } )
        .attr("r", 5)
        .attr("fill", "#581845")
        .on("mouseover", function(d,i) {
            diff = Math.round((scatterData[i].value - scatterData[0].value) * 100) / 100;
            if (diff > 0) {
                diff = '+' + diff;
            }
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(country + '<br>Year ' + scatterData[i].year.getFullYear() + '<br>' + Math.round(scatterData[i].value*100)/100 + '\xB0C (' + diff + '\xB0C)');
        })
        .on("mousemove", function() {
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {tooltip.style("opacity", 0)})
        .on("click", transitionToCountryGraph);
    

        const makeAnnotations = d3.annotation()
            .editMode(true)
            //also can set and override in the note.padding property
            //of the annotation object
            .notePadding(15)
            .type(type)
            //accessors & accessorsInverse not needed
            //if using x, y in annotations JSON
            .accessors({
                x: d => x(parseTime(d.year)),
                y: d => y(d.value)
            })
            .accessorsInverse({
                date: d => timeFormat(x.invert(d.x)),
                close: d => y.invert(d.y)
            })
            .annotations(annotations)

        svg.append("g")
            .attr("class", "annotation-group")
            .call(makeAnnotations)
        }


/************************************************ 
 * In order to keep each circle the same size, Alpha-3 country
 * codes are used to represent each country. This function
 * gets those Alpha-3 codes based on a country name.
 * 
 * 
 * params: countryName - This is the name of the country to check for.
 * returns: The A3Code for a country.
************************************************/
function getCountryCode(countryName) {
    for (var i=0; i < countryCodes.length; i++) {
        if (countryCodes[i].Country == countryName) {
            return countryCodes[i].A3Code;
        }
    }
}

/************************************************ 
 * Maps a dataset when loading in to only use the
 * year, country, and temperature. Also casts each
 * variable to the appropriate type.
 * 
 * 
 * params: d - The dataset to process.
 * returns: None
************************************************/
function processData(d) {
    return {country: d.Country, 
            year: d3.timeParse("%Y")(d.Year), 
            value: Number(d.AverageTemperatureRolling),
            uncertainty: Number(d.AverageTemperatureUncertaintyRolling)};
}

/************************************************ 
 * Transitions from the circle view to a line graph
 * of the country's temperature for a more detailed 
 * view.
 * 
 * params: d - The data point, i - The index of that data point.
 * returns: None
************************************************/
function transitionToCountryGraph(d, i) {
    var svg = d3.select(mainSvgID);

    svg.transition()
        .duration(500)
        .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")
        .on("end", function() {
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
                .attr("transform", "translate(0,0)");     
        });

    //Don't propogate to parent elements
    d3.event.stopPropagation();
    
    //Create new graphs
    createLineGraphsForCountry(i)
}


/************************************************ 
 * Transitions from the line graph view back to the
 * overall circle view for a country.
 * 
 * params: None
 * returns: None
************************************************/
function transitionToCircles() {
    var svg = d3.select(countrySvgID);

    svg.transition()
        .duration(500)
        .attr("transform", "translate(" + transitionSize*2 + ",0)scale(1)")
        .on("end", function() {
            //Move graph off screen, then make country graph visible
            var mainSvg = d3.select(mainSvgID)
            .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")

            //Make the div that holds the circles invisible
            d3.select('#countrySvgHolder').style('display', 'none');
            
            //Make the div that holds the country svg visible
            d3.select('#mainSvgHolder').style('display', 'flex');
            d3.select('#mainSvgHolder').style('justify-content', 'center');

            //Transition country graph in
            mainSvg.transition()
                .duration(500)
                .attr("transform", "translate(0,0)");     
        });
}