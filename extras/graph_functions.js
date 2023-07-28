//Add annotations to first page and information
//Add annotations and information to second page
//Do I need a legend for the graph? - Not supported natively
//change home page to be a graph of global trends, then add buttons to view city circles or country circles

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

let mainSvgID = '#country-warming-circles';
let cityCirclesSvgID = '#country-warming-circles';
let countrySvgID = '#country-warming-graph';
let globalSvgID = '#global-warming-graph';

//Load larger data in now
var rawData, countryCodes, countryAvgs, filteredTableData, globalAvgs;
var avgMin, avgMax;

//Some constants
const tableSize = 1000;
const chartSize = 800;
const transitionSize = 1100;
const circleDomainMin = 1.0;
const circleDomainMax = 1.8;
const diffMean = 1.55;
var numRows;
const numCountryCols = 19;
const numCityCols = 10;
const startColor = 'ghostwhite';
const endColor = 'darkOrange'
var lastMinCountry, lastMinCity, lastCountryEnum, lastCityEnum;


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
async function globalTempDifferences() {
    if (rawData === undefined || countryCodes === undefined || countryAvgs === undefined) {
        //First, load the data in now so it's only loaded once
        rawData = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalAverageDifference.csv');
        countryCodes = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CountryCodes.csv');
        countryAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingAverageCountry.csv', processData);
        cityAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CityRollingTemperatures.csv', processData);
        globalAvgs = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalRollingTemperatures.csv', processGlobalData);

        // Sort global averages now so it's only done once
        globalAvgs.sort((a,b) => a.year - b.year);

        //Get min and max
        var allTemps = [];
        for (i = 0; i < countryAvgs.length; i++)
            allTemps.push(countryAvgs[i].value);

        avgMin = d3.min(allTemps);
        avgMax = d3.max(allTemps);

        //Create country cicles
        all_country_circles(0, 0, false, false);
        all_city_circles(0, 0, false, false);
    }

    const offset = 60;
    const scatterDelta = 5;

    //Get country data and sort by year
    let globalData = globalAvgs;
    globalData.sort((a,b) => a.year - b.year);
    
    //Create scatter plot data from country data
    var scatterData = [];
    for (i = 0; i < globalData.length; i=i+scatterDelta) {
        scatterData.push(globalData[i]);
    }

    //Combine global data and country data into one array to get min/max scale for y axis
    var allTemps = [];

    for (i = 0; i < globalAvgs.length; i++)
        allTemps.push(globalAvgs[i].value);

    const min = d3.min(allTemps);
    const max = d3.max(allTemps);

    //Get svg, clear conents
    var svg = d3.select(globalSvgID);
    svg.selectAll("*").remove();

    //Group for sub elements
    const g = svg.append("g")
        .attr("transform", "translate(" + offset + "," + 0 + ")");

    var x = d3.scaleTime()
        .domain(d3.extent(globalData, function(d) { return d.year; }))
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
        .datum(globalData)
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
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        })
        .on("click", transitionToCountryGraph);
        
        //Add color legend - not supported natively :(
        // var colorScale = d3.scaleLinear()
        //     .domain([0,500])
        //     .range(["red", "blue"]);

        // var legend = d3.legendColor()
        //     .scale(colorScale);
        
        // svg.append("g")
        //     .attr("transform", "translate(500,10)")
        //     .call(legend);

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
 * Function to create the initial circles as part of the martini glass view.
 * Each circle has text overlaying it with the 3 digit country code
 * Circles and text have tooltips associated to display the full name of the country
 * as well as the difference in degrees celsius in temp from 1860 to 2010.
 * Clicking on any country will transition to a line graph showing the average
 * rolling temperature of 10 years from 1860 to 2010, as well as another line
 * showing the global average rolling temp of 10 years from 1860 to 2010.
 * 
 * params: minDiff, the minimum difference to filter, sortEnum, 0 is A to Z, 
 *  1 is Z to A, 2 is diff increasing, 3 is diff decreasing
 * returns: None
************************************************/
async function all_country_circles(minDiff, sortEnum, useLastMin, useLastSortEnum) {
    //Get tooltip element
    var tooltip = d3.select("#tooltip")

    //Check if useLastMin
    if (useLastMin)
        if (!lastMinCountry === undefined)
            minDiff = lastMinCountry
    lastMinCountry = minDiff;

    //Check if useLastSortEnum
    if (useLastSortEnum)
        if (!lastCountryEnum === undefined)
            sortEnum = useLastSortEnum;
    lastCountryEnum = minDiff;

    //Filter data first by min diff
    filteredTableData = rawData.filter(item => item.Diff >= minDiff);

    //Check enum to sort
    if (sortEnum == 0) { //A to Z
        filteredTableData.sort((a,b) => a.Country.localeCompare(b.Country));
    } else if (sortEnum == 1) { //Z to A
        filteredTableData.sort((a,b) => a.Country.localeCompare(b.Country));
        filteredTableData.reverse();
    } else if (sortEnum == 2) { //Diff increasing
        filteredTableData.sort((a,b) => a.Diff - b.Diff);
    } else if (sortEnum == 3) { //Diff decreasing
        filteredTableData.sort((a,b) => a.Diff - b.Diff);
        filteredTableData.reverse();
    }

    //Next, create a grid for the circles representing the countries
    numRows = Math.ceil(filteredTableData.length / numCountryCols);
    var tableData = d3.range(numCountryCols*numRows).slice(0, -((numCountryCols*numRows)-filteredTableData.length));

    //Create x and y scale for circles
    var x = d3.scaleBand()
        .range([0, tableSize])
        .domain(d3.range(numCountryCols));

    var y = d3.scaleBand()
        .range([0,tableSize])
        .domain(d3.range(numRows));

    //Get svg and it's width/height on the screen
    var svg = d3.select(mainSvgID);
    svg.selectAll("*").remove();
    
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
        .attr('cx', function(d) {return x(d % numCountryCols)*1.6;})
        .attr('cy', function(d) {return y(Math.floor(d / numCountryCols));})
        .attr('r', function(d, i) {return 35 + (parseFloat(filteredTableData[i].Diff) - diffMean)*10;})
        .attr('fill', function(d, i) {return circleColors(parseFloat(filteredTableData[i].Diff));})
        .attr('stroke', 'black')
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
                .style("top", (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px")
                .html(filteredTableData[i].Country + '<br>Diff: ' + Math.round(filteredTableData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        }) //When mouse leaves the space, remove the tooltip
        .on("click", transitionToCountryGraph); //Transition to that country's graph on click

    //Fill circles with text
    container.selectAll("text")
        .data(tableData)
        .enter().append("text")
        .text(function(d,i) { return getCountryCode(filteredTableData[i].Country, countryCodes); })
        .attr("x", function(d) {return (x(d % numCountryCols)*1.601)-15;})
        .attr("y", function(d) {return (y(Math.floor(d / numCountryCols)))+5;})
        .attr("opacity", function(d, i) {return circleOpacity(d.Diff);})
        .attr("font-family","Franklin Gothic")
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(filteredTableData[i].Country + '<br>Diff: ' + Math.round(filteredTableData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        })
        .on("click", transitionToCountryGraph); //Transition to that country's graph on click
}


/************************************************ 
 * Function to create the initial circles as part of the martini glass view.
 * Each circle has text overlaying it with the code for city
 * Circles and text have tooltips associated to display the full name of the city
 * as well as the difference in degrees celsius in temp from 1860 to 2010.
 * Clicking on any city will transition to a line graph showing the average
 * rolling temperature of 10 years from 1860 to 2010, as well as another line
 * showing the global average rolling temp of 10 years from 1860 to 2010.
 * 
 * params: minDiff, the minimum difference to filter, sortEnum, 0 is A to Z, 
 *  1 is Z to A, 2 is diff increasing, 3 is diff decreasing
 * returns: None
************************************************/
async function all_city_circles(minDiff, sortEnum, useLastMin, useLastSortEnum) {
    //Get tooltip element
    var tooltip = d3.select("#tooltip")

    //Check if useLastMin
    if (useLastMin)
        if (!lastMinCity === undefined)
            minDiff = lastMinCity
            lastMinCity = minDiff;

    //Check if useLastSortEnum
    if (useLastSortEnum)
        if (!lastCityEnum === undefined)
            sortEnum = useLastSortEnum;
            lastCityEnum = minDiff;

    //Filter data first by min diff
    filteredTableData = cityAvgs.filter(item => item.Diff >= minDiff);
    console.log(cityAvgs);
    console.log(filteredTableData);

    //Check enum to sort
    if (sortEnum == 0) { //A to Z
        filteredTableData.sort((a,b) => a.Country.localeCompare(b.Country));
    } else if (sortEnum == 1) { //Z to A
        filteredTableData.sort((a,b) => a.Country.localeCompare(b.Country));
        filteredTableData.reverse();
    } else if (sortEnum == 2) { //Diff increasing
        filteredTableData.sort((a,b) => a.Diff - b.Diff);
    } else if (sortEnum == 3) { //Diff decreasing
        filteredTableData.sort((a,b) => a.Diff - b.Diff);
        filteredTableData.reverse();
    }

    //Next, create a grid for the circles representing the countries
    numRows = Math.ceil(filteredTableData.length / numCityCols);
    var tableData = d3.range(numCityCols*numRows).slice(0, -((numCityCols*numRows)-filteredTableData.length));

    //Create x and y scale for circles
    var x = d3.scaleBand()
        .range([0, tableSize])
        .domain(d3.range(numCityCols));

    var y = d3.scaleBand()
        .range([0,tableSize])
        .domain(d3.range(numRows));

    //Get svg and it's width/height on the screen
    var svg = d3.select(mainSvgID);
    svg.selectAll("*").remove();
    
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
        .attr('cx', function(d) {return x(d % numCityCols)*1.6;})
        .attr('cy', function(d) {return y(Math.floor(d / numCityCols));})
        .attr('r', function(d, i) {return 35 + (parseFloat(filteredTableData[i].Diff) - diffMean)*10;})
        .attr('fill', function(d, i) {return circleColors(parseFloat(filteredTableData[i].Diff));})
        .attr('stroke', 'black')
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
                .style("top", (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px")
                .html(filteredTableData[i].Country + '<br>Diff: ' + Math.round(filteredTableData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        }) //When mouse leaves the space, remove the tooltip
        .on("click", transitionToCountryGraph); //Transition to that country's graph on click

    //Fill circles with text
    container.selectAll("text")
        .data(tableData)
        .enter().append("text")
        .text(function(d,i) { return getCountryCode(filteredTableData[i].Country, countryCodes); })
        .attr("x", function(d) {return (x(d % numCityCols)*1.601)-15;})
        .attr("y", function(d) {return (y(Math.floor(d / numCityCols)))+5;})
        .attr("opacity", function(d, i) {return circleOpacity(d.Diff);})
        .attr("font-family","Franklin Gothic")
        .on("mouseover", function(d,i) { //Mouseover for tooltip
            tooltip.style("opacity", 1)
            .style("top", (d3.event.pageY-10)+"px")
            .style("left",(d3.event.pageX+10)+"px")
            .html(filteredTableData[i].Country + '<br>Diff: ' + Math.round(filteredTableData[i].Diff * 100) / 100 + '\xB0C');
        })
        .on("mousemove", function() { //Move tooltip with mouse
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        })
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
    const country = filteredTableData[idx].Country
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
        .on("mouseout", function() {
            tooltip.style("opacity", 0)
                .style("top", "0px")
                .style("left", "0px")
        })
        .on("click", transitionToCountryGraph);
        
        //Add color legend - not supported natively :(
        // var colorScale = d3.scaleLinear()
        //     .domain([0,500])
        //     .range(["red", "blue"]);

        // var legend = d3.legendColor()
        //     .scale(colorScale);
        
        // svg.append("g")
        //     .attr("transform", "translate(500,10)")
        //     .call(legend);

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
 * Maps a dataset when loading in to only use the
 * year, country, and temperature. Also casts each
 * variable to the appropriate type.
 * 
 * 
 * params: d - The dataset to process.
 * returns: None
************************************************/
function processGlobalData(d) {
    return {country: d.Country, 
            year: d3.timeParse("%Y")(d.Year), 
            value: Number(d.LandAverageTemperatureRolling),
            uncertainty: Number(d.LandAverageTemperatureUncertaintyRolling)};
}

/************************************************ 
 * Transitions from the global line graph view back to the
 * overall circle view for countries.
 * 
 * params: None
 * returns: None
************************************************/
function transitionToCountryCirclesFromGlobal() {
    var svg = d3.select(globalSvgID);

    svg.transition()
        .duration(500)
        .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")
        .on("end", function() {
            //Move graph off screen, then make country graph visible
            var mainSvg = d3.select(mainSvgID)
            .attr("transform", "translate(" + transitionSize*2 + ",0)scale(1)")

            //Make the div that holds the circles invisible
            d3.select('#globalSvgHolder').style('display', 'none');
            
            //Make the div that holds the country svg visible
            d3.select('#mainSvgHolder').style('display', 'flex');
            d3.select('#mainSvgHolder').style('justify-content', 'center');
            
            //Transition country graph in
            mainSvg.transition()
                .duration(500)
                .attr("transform", "translate(0,0)");     
        });
}

/************************************************ 
 * Transitions from the global line graph view back to the
 * overall circle view for cities.
 * 
 * params: None
 * returns: None
************************************************/
function transitionToCityCirclesFromGlobal() {
    var svg = d3.select(globalSvgID);

    svg.transition()
        .duration(500)
        .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")
        .on("end", function() {
            //Move graph off screen, then make country graph visible
            var mainSvg = d3.select(cityCirclesSvgID)
            .attr("transform", "translate(" + transitionSize*2 + ",0)scale(1)")

            //Make the div that holds the circles invisible
            d3.select('#globalSvgHolder').style('display', 'none');
            
            //Make the div that holds the country svg visible
            d3.select('#citySvgHolder').style('display', 'flex');
            d3.select('#citySvgHolder').style('justify-content', 'center');
            
            //Transition country graph in
            mainSvg.transition()
                .duration(500)
                .attr("transform", "translate(0,0)");     
        });
}

/************************************************ 
 * Transitions from the global line graph view back to the
 * overall circle view for countries.
 * 
 * params: None
 * returns: None
************************************************/
function transitionToGlobalFromCountryCircles() {
    var svg = d3.select(mainSvgID);

    svg.transition()
        .duration(500)
        .attr("transform", "translate(" + transitionSize*2 + ",0)scale(1)")
        .on("end", function() {
            //Move graph off screen, then make country graph visible
            var mainSvg = d3.select(globalSvgID)
            .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)")

            //Make the div that holds the circles invisible
            d3.select('#mainSvgHolder').style('display', 'none');
            
            //Make the div that holds the country svg visible
            d3.select('#globalSvgHolder').style('display', 'flex');
            d3.select('#globalSvgHolder').style('justify-content', 'center');
            
            //Transition country graph in
            mainSvg.transition()
                .duration(500)
                .attr("transform", "translate(0,0)");     
        });
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


