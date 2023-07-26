let svgId = '#global-warming-graph';

function getCountryCode(countryName, rawData) {
    for (var i=0; i < rawData.length; i++) {
        if (rawData[i].Country == countryName) {
            return rawData[i];
        }
    }
}

async function all_country_circles() {
    //First, load the data in
    const rawData = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/GlobalAverageDifference.csv');
    const countryCodes = await d3.csv('https://raw.githubusercontent.com/mrmattkennedy/CS416-D3-Project/main/data/usable_data/CountryCodes.csv');
    console.log(countryCodes);

    //Next, create a grid for the circles representing the countries (164 in total) 
    const numRows = 8
    const numCols = 19
    const tableSize = 1000
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

    //Create a container and center it
    var container = svg.append("g")
        .attr("width", "100%")
        .attr("height", "100%")
        // .attr("transform", "translate(" + (svgWidth-tableSize)/2 + "," + (svgHeight-tableSize)/2 + ")");
        .attr("transform", "translate(100,100)");
    

    //Create linear chart for gradient filling in
    var circleColors = d3.scaleLinear()
        .domain([1, 1.8])
        .range(["ghostwhite", "darkorange"]);

    //Fill the container with circles
    container.selectAll("circle")
        .data(tableData)
        .enter().append("circle")
        .attr('cx', function(d) {return x(d % numCols)*1.6;})
        .attr('cy', function(d) {return y(Math.floor(d / numCols));})
        .attr('r', 40)
        .attr('fill', function(d, i) {return circleColors(parseFloat(rawData[i].Diff));});

    //Fill circles with text
    var side = 2 * 2 * Math.cos(Math.PI / 4),
    dx = 2 - side / 2;
    container.selectAll("text")
        .data(tableData)
        .enter().append("text")
        .text(function(d,i) { return rawData[i].Country; })
        .attr("x", function(d) {return (x(d % numCols)*1.5)-15;})
        .attr("y", function(d) {return (y(Math.floor(d / numCols)))+5;})
        .style("font", "12px times");
}