let svgId = '#global-warming-graph';

function getCountryCode(countryName, rawData) {
    for (var i=0; i < rawData.length; i++) {
        if (rawData[i].Country == countryName) {
            return rawData[i].A3Code;
        }
    }
}

async function all_country_circles() {
    //First, load the data in
    const rawData = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalAverageDifference.csv');
    const countryCodes = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CountryCodes.csv');
    const diffMean = 1.55;

    var tooltip = d3.select("#tooltip")
    //Next, create a grid for the circles representing the countries (164 in total) 
    const numRows = 8;
    const numCols = 19;
    const tableSize = 1000;
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
    var svg = d3.select(svgId);
    const svgWidth = svg.node().getBoundingClientRect().width;
    const svgHeight = svg.node().getBoundingClientRect().height;

    console.log(svgWidth)
    
    //Create a container and center it
    var container = svg.append("g")
        .attr("width", tableSize)
        .attr("height", tableSize)
        // .attr("transform", "translate(" + (svgWidth-1600)/2 + "," + (svgHeight-955)/2 + ")");
        .attr("transform", "translate(42,50)");
    
    var dataLabelSize = d3.select("g").node().getBoundingClientRect()
    console.log(dataLabelSize)

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
        .on("click", function() {
            d3.select('g').transition()
                .duration(750)
                .attr("transform", "translate(" + -transitionSize*2 + ",0)scale(1)");
            zoomListener.scale(1);
            zoomListener.translate([0, 0]);
            d3.event.stopPropagation();
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