//SHIRLEY WU
petalPath = "M 0,0 C -10,-10 -10,-40 0,-50 C 10,-40 10,-10 0,0"
petalPathVar = [];
petalSize = 20;

var data = [];
var mergeOne = [];
var firstData = [];
var dryData = [];
var wetData = [];
var flowerData = [];
var howMany = []
var w = petalSize * 250;
var h = petalSize * 80;

const dataPath1 = 'data.json';
const dataPath2 = 'dryDays.json';
const dataPath3 = 'wetDays.json';

Promise.all([
    d3.json(dataPath1),
    d3.json(dataPath2),
    d3.json(dataPath3)
]).then(function([data1, data2, data3]){
		data = _.merge(data1, data2, data3)
		draw(data)
}) 


function draw() {
	console.log(data[0])
    const svg = d3.select("#canvas").append("svg")
        .attr("width", w)
        .attr("height", h)

    const tempMinMax = d3.extent(data, d => +d.meanTemp);
    const dryMinMax = d3.extent(data, d => +d.dryDays);
    const wetMinMax = d3.extent(data, d => +d.wetDays);
    const anoMinMax = d3.extent(data, d => +d.sumTempAnoHigh);
    const yearMinMax = d3.extent(data, d => +d.year);
    const airMinMax = d3.extent(data, d => +d.airQuality);

    const solMax = d3.extent(data, d => +d.solarRadMax);
    const solMedMinMax = d3.extent(data, d => +d.solarRadMedian);
    console.log(solMax)
    console.log(solMedMinMax)
    const solarMinMax = [solMedMinMax[0],solMax[1]]
    console.log(solarMinMax)

    const comboMinMax = [(tempMinMax[0]*(dryMinMax[0]-wetMinMax[0])),(tempMinMax[1]*(dryMinMax[1]-wetMinMax[1]))]
//I NEED A WEIGHTED FACTOR AND THE WEIGHTED FACTOR ON TEMPERATURE IS DRY DAYS - WET DAYS
    
    const hueScale = d3.scaleLinear().range([1,360]);
    const satScale = d3.scaleLinear().range([.9,.1]);
    const ltScale = d3.scaleLinear().range([.9,.5]);

    const sizeScale = d3.scaleLinear().domain(comboMinMax).range([0.25, 1]);
    const solScale = d3.scaleLinear().domain(solarMinMax).range([0.25, 1]);


    const numPetalScale = d3.scaleQuantize().domain(tempMinMax).range([3, 6, 9, 12, 15, 18]);
    const multPetals = d3.scaleLinear().domain([0, 18]).range([0, 360]);

    const mapYear = d3.scaleLinear().domain(yearMinMax);

		function randomInteger(min, max) {
		  return Math.floor(Math.random() * (max - min + 1)) + min;
		}

    const numFlowers = d3.scaleLinear().domain(wetMinMax).range([1,10])
    const flowersData = _.map(data, d => {
        const combo = d.meanTemp*(d.dryDays-d.wetDays);
        const numPetals = numPetalScale(d.meanTemp);
        const petSize = sizeScale(combo);

        const year = d.year;
        const temp = d.meanTemp;
        const dry = d.dryDays;
        const ano = d.sumTempAnoHigh;
        const wet = d.wetDays;
        const airQ = d.airQuality;

        const solar = Math.floor(randomInteger(d.solarRadMedian, d.solarRadMax))
        const solSize = solScale(solar)

        return {
            numFlows: _.times(numFlowers(d.wetDays), i => { return { numPetals: numPetals, dry: dry, airQ: airQ, solSize: solSize, solar:solar } }),            
            petSize,
            numPetals,
            dry,
            year,
            temp,
            ano,
            wet,
            combo,
            solar
        }
    });
    console.log(flowersData)
    const flowers = svg
        .selectAll('g.flower')
        .data(flowersData)
        .enter()
        .append('g')
        .attr('class',function(d,i){
        	return d.year;
        })
        .attr('transform', (d, i) => `translate(${(petalSize*2+i * petalSize*3)},${petalSize*3})scale(${d.petSize})`)
        .attr('fill', function(d,i){
        	q3 = 10+Math.floor(randomInteger(d.temp-d.ano, d.temp+d.ano));
        	p2 = 30+Math.floor(randomInteger(d.temp-d.ano, d.temp+d.ano));
        	p3 = 40+Math.floor(randomInteger(d.temp-d.ano, d.temp+d.ano));
					pPath = ("M 0,0 C -10,"+-p2+" "+-q3+","+-p3+" 0,"+(-p3-10)+" C "+q3+","+-p3+" 10,"+-p2+" 0,0");
					// console.log(pPath)
					petalPathVar.push(pPath)
        	hueScale.domain(tempMinMax);
        	satScale.domain(dryMinMax);
        	ltScale.domain(anoMinMax);
        	return d3.hsl(hueScale(d.temp),satScale(d.dry),ltScale(d.ano),.6);
        })
    flowers.append('line')
    	.attr('x1',0)
    	.attr('x2',0)
    	.attr('y1',0)
    	.attr('y2',flowersData.length*petalSize*4)
    	.attr('stroke','black')
    	.attr('stroke-width',.1);

    //NUMBER OF FLOWERS PER YEAR ACCORDING TO DRY DAYS PER YEAR
    const flows = flowers.selectAll('g.flows')
        .data(d => d.numFlows).enter().append('g')
        .attr('class', 'flows')
        .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*4})`)
        .attr('stroke', function(d,i){
        	hueScale.domain(airMinMax);
        	return d3.hsl(hueScale(d.airQ),.5,.5,.5);
        })
        .attr('stroke-width',.5)

    //NUMBER OF PETALS PER YEAR ACCORDING TO TEMPERATURE
    flows
        .selectAll('path.flows')
        .data(d =>
            d3.range(d.numPetals).map(function(d) {
                return d;
            })
        )
        .enter()
        .append('path')
        .attr('class','flows')
        .attr('d', function(d,i){
        	//find the petal path of your year
			  	var thisYear = d3.select(this.parentNode.parentNode).attr("class");
			  	var whichIndex = thisYear-2023;
			  	// console.log(whichIndex)
					return petalPathVar[whichIndex];
				})
        .attr('transform', function(d, i) {
            return `rotate(${multPetals(d)})`
        })



		//BULLS EYE
    const bulls = flowers.selectAll('g.bulls')
        .data(d => d.numFlows).enter().append('g')
        .attr('class', 'bulls')
        .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*4})scale(${d.solSize/1.5})`)
        .attr('fill', function(d,i){
        	hueScale.domain(solarMinMax).range([50, 60]);
        	ltScale.domain(solarMinMax).range([.5,.83])
        	return d3.hsl(hueScale(d.solar),1,ltScale(d.solar),.3);
        })
    bulls
        .selectAll('path.bulls')
        .data(d =>
            d3.range(d.numPetals).map(function(d) {
                return d;
            })
        )
        .enter()
        .append('path')
        .attr('class','bulls')
        .attr('d', function(d,i){
			  	var thisYear = d3.select(this.parentNode.parentNode).attr("class");
			  	var whichIndex = thisYear-2023;
					return petalPathVar[whichIndex];
				})
        .attr('transform', function(d, i) {
            return `rotate(${multPetals(d)})`
        })
        .attr('stroke','white')
        .attr('stroke-width',.5)

}




// Partial sun Ideal About 3-6 hours sunlight  
// extreme light conditions lead to lesser growth vigor.
// For incident solar radiation, the projected change falls between –17 and +2 %. 


//   	var thisYear = d3.select(this.parentNode.parentNode).attr("class");

// this will need to do to generate variable options within each data year
// .data((d) =>
//     d3.range((d.meanTemp - d.sumTempAnoLow), (d.meanTemp + d.sumTempAnoHigh)).map(function(d) {
//         return d
//     })
// )

// Air pollutants such as nitrogen oxides and sulfur dioxide when deposited on soil surfaces can result in acidification processes, altering the soil's pH and nutrient balance.

// how many flowers would occur
// more rainfall
// less sunlight	
// air quality
// their color
// preparing data for 1 theoretical year btwn 2080-2100
// summer = july
// spring april

// This stress can include a drought or a flood or even a lack of nutrition in the soil, 
// all of which can dampen the coloration of flowers.
// Anthocyanins and carotenoids
// Anthocyanin pigments, stored in the vacuoles of petal cells change color with pH (acidity)
// The hotter and sunnier the weather gets, the more carotenoids a plant produces, the brighter the oranges and reds will get. When weather cools off, carotenoid production decreases, and colors become softer oranges and yellows.




// When the temperature exceeds 25°C
// It favors a cool climate in a range of 32 to 77 °F (0 to 25 ℃)

// Partial sun Ideal About 3-6 hours sunlight  extreme light conditions lead to lesser growth vigor.
// For incident solar radiation, the projected change falls between –17 and +2 %. 

// Moist or wet woods and mossy bogs;

// Flowers: Inflorescence a raceme, terminal, elongate, showy, 
// with numerous flowers; 
// floral tube absent; 
// sepals 7-16 mm long, pinkish purplish, puberulent; 
// petals unequal, slightly asymmetric, 1-2 cm long, pink-purple, seldom white; 
// style 1-2 cm long, surpassing the stamens, stigma deeply 4-cleft;


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


// var clScale = d3.scaleDiverging(d3.interpolateRdYlBu).domain([min, max])
// var clScale = d3.scaleLinear()
// .domain([min, max])
// .range(['white', 'pink', 'purple'])
// .interpolate(d3.interpolateCubehelix)
// return d3.interpolateCubehelixDefault(pullDown)
// return 'none';
















//JUST ONE FLOWER PER YEAR
    // flowers
    // .selectAll('path')
    // 	.data((d) =>
    //       d.petals
    //   )
    // 	.enter()
    // 	.append('path')
    //   .attr('d',petalPath)
    //   .attr('fill','none')
    //   // .attr('stroke-width',.1)
    //   .attr('stroke','black')
    //   .attr('transform',function(d,i){
    //   	// return `rotate(${d.angle})`
    //   })  


// //MAKE BULLS EYE PATTERN
//     const bullsEye = svg
//         .selectAll('g.bullsEye')
//         .data(flowersData)
//         .enter()
//         .append('g')
//         .attr('class','bullsEye')
//         //scale could relate to data
//         .attr('transform', (d, i) => `translate(${(petalSize*2+i * petalSize*3)},${h/10})scale(${d.petSize/2})`)
//         .attr('fill', function(d,i){
//         	hueScale.domain(yearMinMax);
//         	satScale.domain(dryMinMax);
//         	ltScale.domain(anoMinMax);
//         	return d3.hsl(hueScale(d.year),satScale(d.dry),ltScale(d.ano),.9);
//         })
//         .attr('stroke','white')

//     //NUMBER OF FLOWERS PER YEAR ACCORDING TO DRY DAYS PER YEAR
//     const bullsEyeQuant = bullsEye.selectAll('g.quant')
//         .data(d => d.numFlows).enter().append('g')
//         .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*8})`)

//     //BULL'S EYE ACCORDING TO TEMPERATURE
//     bullsEyeQuant
//         .selectAll('path.uv')
//         .data(d =>
//             d3.range(d.tempPetals).map(function(d) {
//                 return d;
//             })
//         )
//         .enter()
//         .append('path')
//         .attr('class','uv')
//         .attr('d', petalPath)
//         .attr('transform', function(d, i) {
//             return `rotate(${multPetals(d)})`
//         })