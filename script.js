// Set the time format
const parseTime = d3.timeParse("%Y");

//load dataset and formatting variables
d3.csv("./d3_dataset.csv", d => {
    return {
        region: d.Region,
        year: +d.Year,
        maternal_mort: +d.maternal_mortality,
        date: parseTime(d.year)
    }
}).then(data => {
    //we need to make sure that the data is sorted by region and then year
    data = data.sort((a,b) => d3.ascending(a.region, b.region) || d3.ascending(a.year, b.year));
    console.log(data);

    //we want a heat map: rows -> regions, columns -> year, color -> maternal mortality
    createHeatMap(data);
})

//https://d3-graph-gallery.com/graph/heatmap_basic.html
const createHeatMap = (data) => {
    //dimensions and margins
    const margins = {top: 20, right: 20, bottom: 80, left: 180};
    const width = 900  - margins.left - margins.right;
    const height = 400 - margins.top - margins.bottom

const svg = d3.select('#heatmap')
    .append("svg")
        //.attr("viewBox", [0, 0, width, height])
        .attr("width",  width  + margins.left + margins.right)
        .attr("height", height + margins.top  + margins.bottom + 100) //+100 because if not the legend was cut
    .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top + 20})`);

//list of years and regions, necessary to create the heatmap
const regions = Array.from(new Set(data.map(d => d.region))).sort(d3.ascending);
const years = Array.from(new Set(data.map(d => d.year))).sort(d3.ascending);

// x scale -> years
const xScale = d3.scaleBand()
    .domain(years)
    //.range([margins.left, width - margins.right])
    .range([0, width])
    .padding(0.1);

// y scale -> regions 
const yScale = d3.scaleBand() //scale band because there are categories
    .domain(regions)
    //.range([height - margins.bottom, margins.top])
    .range([0, height])
    .padding(0.05)

//Axis
const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
        d3.axisBottom(xScale)
            //.tickValues(years)
           // .tickFormat(d3.format("d"))
    )
    .selectAll('text')
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
    
const yAxisGroup = svg.append("g")
    .call(d3.axisLeft(yScale));

svg.append("text")
    .attr("x", (width/2))
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Maternal Mortality by Region and Year");

/*//Year range selector
const minYearSelect = d3.select("#minYear");
const maxYearSelect = d3.select("#maxYear");

minYearSelect.selectAll("option")
    .data(years)
    .join("option")
        .attr("value", d=> d)
        .text(d=>d);

maxYearSelect.selectAll("option")
    .data(years)
    .join("option")
        .attr("value", d=> d)
        .text(d=>d);

minYearSelect.property("value", years[0]);
maxYearSelect.property("value", years[years.length - 1]);
*/

//color scale for maternal mortality
const mat_mort_extent = d3.extent(data, d => d.maternal_mort);
const colors = d3.scaleSequential()
    .domain(mat_mort_extent)
    .interpolator(d3.interpolateYlOrRd) //scale that goes from yellow to red


//color legend
const legendWidth = 200
const legendHeight = 10

const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - legendWidth}, ${+350})`);

const legendScale = d3.scaleLinear()
    .domain(mat_mort_extent)
    .range([0, legendWidth]);

const defs = svg.append("defs"); //gradient
const gradient = defs.append("linearGradient")
    .attr("id", "mat_mort_gradient");

gradient.selectAll("stop")
    .data(d3.range(0,1.01,0.1))
    .join("stop")
        .attr("offset", d => (d*100) + "%")
        .attr("stop-color", d=> colors(mat_mort_extent[0] + d*(mat_mort_extent[1] - mat_mort_extent[0])));

legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#mat_mort_gradient)") 


legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(4)); // QUE ES TICKS

legendGroup.append("text")
  .attr("x", legendWidth / 2)
  .attr("y", -5)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .text("Maternal mortality (per 100,000 births)");


//tooltip
const tooltip = d3.select("body")
    .append("div")
        .style("opacity", 0)
        //.attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px 8px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

        //draw cells

//const sortSelect = d3.select("#sort");



const regionMeans = d3.rollup( //maens to ordenate it
    data,
    v => d3.mean(v, d =>d.maternal_mort),
    d => d.region
);

const regionsOriginal = regions.slice();
const sortSelect = d3.select("#sort");

function updateSort(){
    const mode = d3.select("#sort").property("value");
    console.log("updateSort mode:", mode); // ← para ver que se llama
    let newRegions;

    if (mode === "alphabet"){
        newRegions = regionsOriginal.slice()
    } else {

        newRegions = Array.from(regionMeans.entries())
            .sort((a,b) => {
                if (mode === "riskDesc"){
                    return d3.descending(a[1], b[1]);
                } else {
                        return d3.ascending(a[1], b[1])
                }
            })
            .map(d => d[0]) //the name of the region
    }

    console.log("newRegions:", newRegions);
    yScale.domain(newRegions);

    const t = svg.transition().duration(600)

    yAxisGroup 
        .transition(t)
        .call(d3.axisLeft(yScale));

    cells
    //.selectAll()
        .transition(t)
        .attr("y", d => yScale(d.region));
}


//console.log("regions from data:", regions);
//console.log("regions in regionMeans:", Array.from(regionMeans.keys()));
function mouseover(event, d) {
    const selectedRegion = d.region;
  // show tooltip
    tooltip
        .style("opacity", 1)
        .html(`Region: ${d.region} <br> Year: ${d.year} <br> Maternal Mortality Rate: ${d.maternal_mort}/100k`);

    //all cells gray with low opacity    
    cells
        //.transition()
        //.duration(150)
        .attr("opacity", 0.2)
        //.attr("fill", "#ccc");
    
    cells
        .filter(e => e.region ===selectedRegion)
        //.transition()
        //.duration(150)
        .attr("opacity", 1)
        .attr("fill", e => colors(e.maternal_mort));   

  // highlight cell
    d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
}

function mousemove(event, d) {
    tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
}

function mouseout(event, d) {
    tooltip.style("opacity", 0);

    d3.select(this)
        .attr("stroke", "none")
        .attr("stroke-width", 1);

    cells
        //.transition()
        //.duration(100)
        .attr("opacity", 1)
        .attr("fill", d => colors(d.maternal_mort));

}


//const cellSize = yScale.bandwidth();

const cellsGroup = svg.append("g");

//draw cells
let cells = cellsGroup
    .selectAll("rect")
    //.data(data, d=> d.region + "-" + d.year)
    .data(data)
    .join("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d=> yScale(d.region))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("rx", 4)
        .attr("fill", d => colors(d.maternal_mort))
        .attr("stroke-width",1) //ESTO QUE ES
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);


//dropdown event
d3.select("#sort").on("change", updateSort);

// initial call 
updateSort();
   };



        


