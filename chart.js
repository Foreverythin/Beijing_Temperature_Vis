// Define the dimensions of the wrapper
const width = d3.min([
    window.innerWidth * 0.75,
    window.innerHeight * 0.75,
])

// Define the dimensions of the chart
const dimensions = {
    width: width,
    height: width,
    margin: {
        top: 90,
        right: 90,
        bottom: 50,
        left: 50,
    },
    histogramMargin: 10,
    histogramHeight: 70,
    legendWidth: 250,
    legendHeight: 26,
}

// Calculate the dimensions of the chart
dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right

dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

// Draw the wrapper
const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

// Draw the bounds
const bounds = wrapper.append("g")
    .style("transform", `translate(${dimensions.margin.left
        }px, ${dimensions.margin.top
        }px)`)

// We want a background for the chart, which is white
const boundsBackground = bounds.append("rect")
    .attr("class", "bounds-background")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", 0)
    .attr("height", dimensions.boundedHeight)


// The function to draw the chart
async function drawChart() {
    // Load the data
    const dataset = await d3.json("beijing_weather.json")

    // Define the accessor functions
    const yAccessor = d => parseInt(d.max_temp)
    const xAccessor = d => parseInt(d.min_temp)
    const dateAccessor = d => d3.timeParse("%Y-%m-%d")(d.date)

    // Define the scales
    const yScale = d3.scaleLinear()
        .domain([d3.min(dataset, xAccessor), d3.max(dataset, yAccessor)])
        .range([dimensions.boundedHeight, 0])
        .nice()
    const xScale = d3.scaleLinear()
        .domain([d3.min(dataset, xAccessor), d3.max(dataset, yAccessor)])
        .range([0, dimensions.boundedWidth])
        .nice()
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(dataset, dateAccessor))
        .interpolator(d => d3.interpolateRainbow(-d))

    // Dots plotting
    const dotsGroup = bounds.append("g")
    const dots = dotsGroup.selectAll("circle")
        .data(dataset)
        .enter().append("circle")
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessor(d)))
        .attr("r", 4)
        .attr("fill", d => colorScale(dateAccessor(d)))
        .attr("opacity", 0.8)

    // x-axis, y-axis and labels
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .ticks(6)
    const xAxis = bounds.append("g")
        .call(xAxisGenerator)
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    const xAxisLabel = xAxis.append("text")
        .attr("class", "x-axis-label")
        .attr("x", dimensions.boundedWidth / 2)
        .attr("y", dimensions.margin.bottom - 10)
        .html("Minimum Temperature (&deg;C)")
    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        .ticks(6)
    const yAxis = bounds.append("g")
        .call(yAxisGenerator)
    const yAxisLabel = yAxis.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 10)
        .html("Maximum Temperature (&deg;C)")

    // Top histogram
    const topHistogramGenerator = d3.histogram()
        .domain(xScale.domain())
        .value(xAccessor)
        .thresholds(20)
    const topHistogramBins = topHistogramGenerator(dataset)
    const topHistogramYScale = d3.scaleLinear()
        .domain(d3.extent(topHistogramBins, d => d.length))
        .range([dimensions.histogramHeight, 0])
    const topHistogram = bounds.append("g")
        .attr("class", "top-histogram")
        .attr("transform", `translate(0, ${-dimensions.histogramHeight - dimensions.histogramMargin})`)
    const topHistogramLineGenerator = d3.area()
        .x(d => xScale((d.x0 + d.x1) / 2))
        .y0(dimensions.histogramHeight)
        .y1(d => topHistogramYScale(d.length))
        .curve(d3.curveBasis)
    const topHistogramElement = topHistogram.append("path")
        .attr("d", topHistogramLineGenerator(topHistogramBins))
        .attr("class", "histogram-area")

    // Right histogram
    const rightHistogramGenerator = d3.histogram()
        .domain(yScale.domain())
        .value(yAccessor)
        .thresholds(20)
    const rightHistogramBins = rightHistogramGenerator(dataset)
    const rightHistogramYScale = d3.scaleLinear()
        .domain([0, d3.max(rightHistogramBins, d => d.length)])
        .range([dimensions.histogramHeight, 0])
    const rightHistogram = bounds.append("g")
        .attr("class", "right-histogram")
        .style("transform", `translate(${
        dimensions.boundedWidth + dimensions.histogramMargin
        }px, -${
        dimensions.histogramHeight
        }px) rotate(90deg)`)
    const rightHistogramLineGenerator = d3.area()
        .x(d => yScale((d.x0 + d.x1) / 2))
        .y0(dimensions.histogramHeight)
        .y1(d => rightHistogramYScale(d.length))
        .curve(d3.curveBasis)
    const rightHistogramElement = rightHistogram.append("path")
        .attr("d", rightHistogramLineGenerator(rightHistogramBins))
        .attr("class", "histogram-area")
    

    // ------------------------- Interaction -------------------------
    const tooltip = d3.select("#tooltip")

    const dot = dotsGroup.selectAll("circle")

    const horizontalLine = bounds.append("rect")
    const verticalLine = bounds.append("rect")

    dot.on("mouseenter", onMouseEnter)
        .on("mouseleave", onMouseLeave)
    
    function onMouseEnter(datum) {
        tooltip.style("opacity", 1)
        // make the circle bigger
        d3.select(this)
            .transition()
            .duration(100)
            .attr("r", 7)
            .attr("stroke-width", 2)
            .attr("stroke", "#6F1E51")
        // show the tooltip
        tooltip.select("#date")
            .text(datum.date)
        tooltip.select("#min-temperature")
            .text(datum.min_temp)
        tooltip.select("#max-temperature")
            .text(datum.max_temp)
        // the position of the tooltip
        const tooltipX = xScale(xAccessor(datum))
            + dimensions.margin.left
        const tooltipY = yScale(yAccessor(datum))
            + dimensions.margin.top - 4
        tooltip.style("transform", `translate(`
            + `calc( -50% + ${tooltipX}px),`
            + `calc(-100% + ${tooltipY}px)`
            + `)`)

        // show the line
        const x = xScale(xAccessor(datum))
        const y = yScale(yAccessor(datum))

        const horizontalLineThickness = 10
        horizontalLine
            .attr("class", "hover-line")
            .attr("x", x)
            .attr("y", y-horizontalLineThickness/2)
            .attr("width", dimensions.boundedWidth + dimensions.histogramMargin + dimensions.histogramHeight - x)
            .attr("height", horizontalLineThickness)
            .style("opacity", 0.5)
        verticalLine
            .attr("class", "hover-line")
            .attr("x", x-horizontalLineThickness/2)
            .attr("y", -dimensions.histogramMargin - dimensions.histogramHeight)
            .attr("width", horizontalLineThickness)
            .attr("height", y + dimensions.histogramMargin + dimensions.histogramHeight)
            .style("opacity", 0.5)
    }

    function onMouseLeave() {
        tooltip.style("opacity", 0)
        // make the circle smaller
        d3.select(this)
            .transition()
            .duration(100)
            .attr("r", 4)
            .attr("stroke-width", 0)
        
        // hide the line
        horizontalLine.style("opacity", 0)
        verticalLine.style("opacity", 0)
    }



    // ------------------------- Legend -------------------------
    const legendGroup = bounds.append("g")
      .attr("transform", `translate(${
        dimensions.boundedWidth - dimensions.legendWidth - 9
      },${
        dimensions.boundedHeight - 37
      })`)

    const defs = wrapper.append("defs")

    const numberOfGradientStops = 10
    const stops = d3.range(numberOfGradientStops).map(i => (
    i / (numberOfGradientStops - 1)
    ))
    const legendGradientId = "legend-gradient"
    const gradient = defs.append("linearGradient")
        .attr("id", legendGradientId)
        .selectAll("stop")
        .data(stops)
        .enter().append("stop")
        .attr("stop-color", d => d3.interpolateRainbow(-d))
        .attr("offset", d => `${d * 100}%`)
    
    const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`)
    const tickValues = [
        d3.timeParse("%m/%d/%Y")(`4/1/2022`),
        d3.timeParse("%m/%d/%Y")(`7/1/2022`),
        d3.timeParse("%m/%d/%Y")(`10/1/2022`),
      ]
    const legendTickScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, dimensions.legendWidth])

    const legendValues = legendGroup.selectAll(".legend-value")
      .data(tickValues)
      .enter().append("text")
        .attr("class", "legend-value")
        .attr("x", legendTickScale)
        .attr("y", -6)
        .text(d3.timeFormat("%b"))
  
    const legendValueTicks = legendGroup.selectAll(".legend-tick")
      .data(tickValues)
      .enter().append("line")
        .attr("class", "legend-tick")
        .attr("x1", legendTickScale)
        .attr("x2", legendTickScale)
        .attr("y1", 6)
    
    const legendHighlightBarWidth = dimensions.legendWidth * 0.05 
    const legendHighlightGroup = legendGroup.append("g")
        .attr("opacity", 0)
    
    const legendHighlightBar = legendHighlightGroup.append("rect") .attr("class", "legend-highlight-bar")
        .attr("width", legendHighlightBarWidth)
        .attr("height", dimensions.legendHeight)

    const legendHighlightText = legendHighlightGroup.append("text") .attr("class", "legend-highlight-text")
        .attr("x", legendHighlightBarWidth / 2)
        .attr("y", -6)

    legendGradient.on("mousemove", onLegendMouseMove)
        .on("mouseleave", onLegendMouseLeave)

    const hoverTopHistogram = topHistogram.append("path").attr("class", "hover-histogram")
    const hoverRightHistogram = rightHistogram.append("path").attr("class", "hover-histogram")
    
    function onLegendMouseMove(e) {
        const [x] = d3.mouse(this)
        const minDateToHighlight = new Date(
            legendTickScale.invert(x - legendHighlightBarWidth)
          )
        const maxDateToHighlight = new Date(
            legendTickScale.invert(x + legendHighlightBarWidth)
          )
        const barX = d3.median([
            0,
            x - legendHighlightBarWidth / 2,
            dimensions.legendWidth - legendHighlightBarWidth,
          ])
        legendHighlightGroup.style("opacity", 1)
          .style("transform", `translateX(${barX}px)`)
        const formatLegendDate = d3.timeFormat("%b %d")
        legendHighlightText.text([
            formatLegendDate(minDateToHighlight),
            formatLegendDate(maxDateToHighlight),
          ].join(" - "))
        legendValues.style("opacity", 0)
        legendValueTicks.style("opacity", 0)
        dots.transition().duration(100)
            .style("opacity", 0.1)
            .attr("r", 2)
        

        const isDayWithinRange = day => {
            const date = d3.timeParse("%Y-%m-%d")(day.date)
            return date >= minDateToHighlight && date <= maxDateToHighlight
        }
        const relevantDots = dots.filter(isDayWithinRange)
        const hoveredDates = dataset.filter(isDayWithinRange)
        const hoveredDate = d3.isoParse(legendTickScale.invert(x))
        relevantDots.transition().duration(100)
            .style("opacity", 1)
            .attr("r", 5)
        
        const topHistogramBins = topHistogramGenerator(hoveredDates)
        const topHistogramLineGenerator = d3.area()
            .x(d => xScale((d.x0 + d.x1) / 2))
            .y0(dimensions.histogramHeight)
            .y1(d => topHistogramYScale(d.length))
            .curve(d3.curveBasis)
        hoverTopHistogram
            .attr("d", topHistogramLineGenerator(topHistogramBins))
            .attr("fill", colorScale(hoveredDate))
            .attr("stroke", colorScale(hoveredDates))
        
        const rightHistogramBins = rightHistogramGenerator(hoveredDates)
        const rightHistogramLineGenerator = d3.area()
            .x(d => yScale((d.x0 + d.x1) / 2))
            .y0(dimensions.histogramHeight)
            .y1(d => rightHistogramYScale(d.length))
            .curve(d3.curveBasis)
        hoverRightHistogram
            .attr("d", rightHistogramLineGenerator(rightHistogramBins))
            .attr("fill", colorScale(hoveredDate))
            .attr("stroke", colorScale(hoveredDates))
    }

    function onLegendMouseLeave() {
        legendHighlightGroup.style("opacity", 0)
        legendValues.style("opacity", 1)
        legendValueTicks.style("opacity", 1)
        dots.transition().duration(100)
            .style("opacity", 0.8)
            .attr("r", 4)
        hoverTopHistogram.transition().duration(100).attr("d", "")
        hoverRightHistogram.transition().duration(100).attr("d", "")
    }
}


// To draw the whole chart
drawChart()