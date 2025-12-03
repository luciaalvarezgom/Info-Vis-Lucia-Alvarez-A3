
//https://d3-graph-gallery.com/graph/heatmap_basic.html for inspo on heatmaps
//load dataset and formatting variables
d3.csv("./d3_dataset.csv", d => {
    return {
        region: d.Region,
        year: +d.Year,
        maternal_mort: +d.maternal_mortality,
    }
}).then(data => {
    //we need to make sure that the data is sorted by region and then year
    data = data.sort((a,b) => d3.ascending(a.region, b.region) || d3.ascending(a.year, b.year));
    console.log(data);

    //we want a heat map: rows -> regions, columns -> year, color -> maternal mortality
    createHeatMap(data);
})

const createHeatMap = (data) => {
    //dimensions and margins
    const margins = {top: 20, right: 20, bottom: 80, left: 180};
    const width = 900  - margins.left - margins.right;
    const height = 400 - margins.top - margins.bottom

/*const svg = d3.select('#heatmap')
    .append("svg")
        //.attr("viewBox", [0, 0, width, height])
        .attr("width",  width  + margins.left + margins.right)
        .attr("height", height + margins.top  + margins.bottom + 100) //+100 because if not the legend was cut
    .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top + 20})`);*/

//better practice to do it wiht viewBox
const totalWidth  = width  + margins.left + margins.right;
const totalHeight = height + margins.top  + margins.bottom + 100; //+100 because if not the legend was cut

const svg = d3.select('#heatmap')
  .append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("responsive-svg", true)
  .append("g")
    .attr("transform", `translate(${margins.left}, ${margins.top + 20})`);

//list of years and regions, necessary to create the heatmap
const regions = Array.from(new Set(data.map(d => d.region))).sort(d3.ascending);
const years = Array.from(new Set(data.map(d => d.year))).sort(d3.ascending);

// x scale -> years
const xScale = d3.scaleBand() //scale band because there are categories
    .domain(years)
    .range([0, width])
    .padding(0.1);

// y scale -> regions 
const yScale = d3.scaleBand() //scale band because there are categories
    .domain(regions)
    .range([0, height])
    .padding(0.05)

//axis
const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
        d3.axisBottom(xScale)
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


//color scale for maternal mortality
const mat_mort_extent = d3.extent(data, d => d.maternal_mort);
const colors = d3.scaleSequential()
    .domain(mat_mort_extent)
    .interpolator(d3.interpolateYlOrRd) //scale that goes from yellow to red


// https://observablehq.com/@d3/color-legend inspo for the legend    
//color legend
const legendWidth = 200
const legendHeight = 10

// legend positioned at the bottom-right area of the heatmap
const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - legendWidth}, ${+350})`);


const legendScale = d3.scaleLinear() //scaleLinear because there is a numeric axis under the legend
    .domain(mat_mort_extent)
    .range([0, legendWidth]);


const defs = svg.append("defs"); //gradient
const gradient = defs.append("linearGradient")
    .attr("id", "mat_mort_gradient");

gradient.selectAll("stop") //stop is the points that you see in the legend
    .data(d3.range(0,1.01,0.1)) // 0, 0.1, 0.2, ..., 1
    .join("stop")
        .attr("offset", d => (d*100) + "%") //offset 0% means that the color is the minimum in the dataset
        .attr("stop-color", d=> colors(mat_mort_extent[0] + d*(mat_mort_extent[1] - mat_mort_extent[0]))); // Convert normalized value back to the mortality range, and map it trhough the sequential color scale

//draw legend bar using gradient defined above        
legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#mat_mort_gradient)") 

//add numerical axis below gradient bar
legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(4)); // only 4 marks displayed, for readability

//label of the legend
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
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px 8px")
        .style("font-size", "12px")
        .style("pointer-events", "none");


// Means to use the sort dropdown
const regionMeans = d3.rollup( 
    data,
    v => d3.mean(v, d =>d.maternal_mort),
    d => d.region
);

const regionsOriginal = regions.slice();
const sortSelect = d3.select("#sort");

function updateSort(){ 
    /*Function to sort the heatmap by regions in 3 different ways: 
    - Alphabetical order of regions
    - Ascending values of Maternal Mortality Rate
    - Descending values of Maternal Mortality Rate
    */
    const mode = d3.select("#sort").property("value");
    console.log("updateSort mode:", mode); // ← para ver que se llama
    
    let newRegions; //stores the new ordering of regions

    if (mode === "alphabet"){
        newRegions = regionsOriginal.slice()
    } else {

        newRegions = Array.from(regionMeans.entries())
            .sort((a,b) => {
                if (mode === "riskDesc"){
                    return d3.descending(a[1], b[1]); //highest-risk regions first

                } else {
                        return d3.ascending(a[1], b[1]) //lowest-risk regions first
                }
            })
            .map(d => d[0]) //the name of the region
    }

    //console.log("newRegions:", newRegions);
    yScale.domain(newRegions);

    const t = svg.transition().duration(600)

    yAxisGroup //animate y-axis to the new order
        .transition(t)
        .call(d3.axisLeft(yScale));

    cells //animate the heatmap cells
        .transition(t)
        .attr("y", d => yScale(d.region));
}


function mouseover(event, d) {
    const selectedRegion = d.region;
    // show tooltip with all the info
    tooltip
        .style("opacity", 1)
        .html(`Region: ${d.region} <br> Year: ${d.year} <br> Maternal Mortality Rate: ${d.maternal_mort}/100k`);

    //all cells with low opacity    
    cells
        .attr("opacity", 0.2)

    
    cells //highlights only the cells belonging to the same region
        .filter(e => e.region ===selectedRegion)
        .attr("opacity", 1)
        .attr("fill", e => colors(e.maternal_mort));   

    // add black stroke to the highlighted cell
    d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
}

function mousemove(event, d) { 
    //move the tooltip following the mouse pointer
    tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
}

function mouseout(event, d) { //hide tooltip and remove stroke when mouse leaves the cell
    tooltip.style("opacity", 0);

    d3.select(this) //remove stroke
        .attr("stroke", "none")
        .attr("stroke-width", 1);

    cells //reset all cells back to normal
        .attr("opacity", 1)
        .attr("fill", d => colors(d.maternal_mort));

}

//group wrapper for all rect cells
const cellsGroup = svg.append("g");

//draw cells
let cells = cellsGroup
    .selectAll("rect")
    .data(data)
    .join("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d=> yScale(d.region))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("rx", 4) //for rounded corners
        .attr("fill", d => colors(d.maternal_mort))
        .attr("stroke-width",1) //for borders thickness
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);


//dropdown event
d3.select("#sort").on("change", updateSort);

// initial sorting mode 
updateSort();
   };



        


