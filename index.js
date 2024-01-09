var mydata = [];
d3.json("data.json").then(function(data) {
    	mydata = data;
    	draw();
  	});

function draw(){
	var w = 800,
	    h = w,
	    r = 5;
	var svg = d3.select("#canvas").append("svg")
				.attr("width",w)
				.attr("height",h)
				.style("background-color","black")
	
	
//summer temperature anomaly - high end for each year
//find a way to interpolate between min and max for that decade
//more rainfall
//less sunlight				
	var min = d3.min(mydata, function(d){
		return d.sumTempAnoHigh;
	});
	var max = d3.max(mydata, function(d){
		return d.sumTempAnoHigh;
	});

	var clScale1 = d3.scaleLinear()
					.domain([min, max])
					.range([0,1]);
	var clScale2 = d3.scaleSequential(d3.interpolateRainbow);
	var xScale = d3.scaleLinear()
					.domain([0, mydata.length])
					.range([w/4, w-w/4])
    var gElements = svg.selectAll('g')
      .data(mydata) // bind our data
      .join('g')
	    .attr('transform', function (d, i) {
	    	return 'translate('+xScale(i)+','+h/2+')';
	    });
      // inner selection data binding
      // creates array of repeating datum that is length of num
      gElements.selectAll('rect').data((d) =>
        d3.range(d.sumTempAnoLow, d.sumTempAnoHigh).map(function(d){ 
        	return d })
      ) 
      .join('rect')
	    .attr('x', 0)
	    .attr('y', function(d,i){
	    	return i*15;
	    })
	    .attr('width', r)
	    .attr('height', r)
	    .attr('fill', function(d){
	    	var pullDown = clScale1(d) 
	    	return clScale2(pullDown)
	    })
}











//preparing data for 1 theoretical year btwn 2080-2100
//summer july
//spring april



//When the temperature exceeds 25°C
//It favors a cool climate in a range of 32 to 77 °F (0 to 25 ℃)


// var springTempAvg = [4, 9];
// var springTempAnomaly = [3.9, 7.86];

// var summerTempAvg = [18, 24]; 
// var summerTempAnomaly = [2.5, 7.99];

//0-25
//april 3.1
//december -1
// var seasonLength = 8;

// var springWetAvg = [41, 63]; 
// var springWetAnomaly = [-.35, 21.29]; 

// var summerWetAvg = [70, 107];
// var summerWetAnomaly = [-16.4, 17.7];