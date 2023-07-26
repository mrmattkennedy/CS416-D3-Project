let svgId = '#global-warming-graph';

function all_country_circles() {
    data = [32, 57, 112]
    console.log(svgId);

    d3.select(svgId)
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("r", 30)
        .attr("cx", function(d, i) {return d;})
        .attr("cy", function(d, i) {return d;});
}