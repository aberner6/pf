petalPathVar = [];
petalSize = 20;

veinPathVar = [];


var data = [];
var mergeOne = [];
var firstData = [];
var dryData = [];
var wetData = [];
var flowerData = [];
var howMany = []
var w = petalSize * 400;
var h = 3000;

const dataPath1 = 'data.json';
const dataPath2 = 'dryDays.json';
const dataPath3 = 'wetDays.json';

//the colors should interpolate between each, transitioning smoothly
var colorRange = ["antiquewhite","pink","purple","red","orange"]
const fillScale = d3.scaleSequential()
    .interpolator(d3.interpolateRgbBasis(colorRange))
var veinRange = ["pink","red","orange"]
const veinScale = d3.scaleSequential()
    .interpolator(d3.interpolateRgbBasis(veinRange))

//loading the data and merging them
Promise.all([
    d3.json(dataPath1),
    d3.json(dataPath2),
    d3.json(dataPath3)
]).then(function([data1, data2, data3]) {
    data = _.merge(data1, data2, data3)
    draw(data)
})


function draw() {
    console.log(data[0])
    const svg = d3.select("#canvas").append("svg")
        .attr("width", w)
        .attr("height", h)

//setting up a bunch of mins and maxes so I can use scales to map the data to visual parameters
    const tempMinMax = d3.extent(data, d => +d.meanTemp);
    console.log(tempMinMax)
    const dryMinMax = d3.extent(data, d => +d.dryDays);
    const wetMinMax = d3.extent(data, d => +d.wetDays);
    console.log(wetMinMax+"wet")
    const anoMinMax = d3.extent(data, d => +d.sumTempAnoHigh);
    const yearMinMax = d3.extent(data, d => +d.year);
    const airMinMax = d3.extent(data, d => +d.airQuality);

    const solMax = d3.extent(data, d => +d.solarRadMax);
    const solMedMinMax = d3.extent(data, d => +d.solarRadMedian);
    console.log(solMax)
    console.log(solMedMinMax)
    const solarMinMax = [solMedMinMax[0], solMax[1]]
    console.log(solarMinMax)

    const coMinMax = d3.extent(data, d => +d.co);
    const scaleCO = d3.scaleLinear().domain(coMinMax).range([.1,1])
    const comboMinMax = [(tempMinMax[0] * (dryMinMax[0] - wetMinMax[0])+scaleCO(coMinMax[0])), (tempMinMax[1] * (dryMinMax[1] - wetMinMax[1])+scaleCO(coMinMax[1]))]
    //WEIGHTED FACTOR ON TEMPERATURE IS DRY DAYS - WET DAYS
    console.log(comboMinMax)

    const altComboMinMax = [(20.07 * (dryMinMax[0] - wetMinMax[0])+scaleCO(coMinMax[0])), (28.86 * (dryMinMax[1] - wetMinMax[1])+scaleCO(coMinMax[1]))]
//setting up scales for color, size and petals
    const hueScale = d3.scaleLinear().range([1, 360]);
    const satScale = d3.scaleLinear().range([1, .7]);
    const ltScale = d3.scaleLinear().range([.9, .6]);

    const sizeScale = d3.scaleLinear().domain(comboMinMax).range([0.25, 1]);
    const solScale = d3.scaleLinear().domain(solarMinMax).range([0.25, 1]);


    const altPetalScale = d3.scaleLinear().domain(altComboMinMax).range([0.25, 1]);

    const numPetalScale = d3.scaleQuantize().domain(tempMinMax).range([2,3,4,6,8,9,12,16,20]);
    const multPetals = d3.scaleLinear().domain([0, 18]).range([0, 360]);

    const mapYear = d3.scaleLinear().domain(yearMinMax);

    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

//preparing the data that each flower / petal will need 
    const flowersData = _.map(data, d => {
        const combo = d.meanTemp * (d.dryDays - d.wetDays)+scaleCO(d.co);
        const numPetals = numPetalScale(d.meanTemp);
        const petSize = sizeScale(combo);

        if(d.year>=2023 && d.year<2040){
            d.sumTemp = d3.randomUniform(20.07,22.70)();
        }
        if(d.year>=2040 && d.year<2060){
            d.sumTemp = d3.randomUniform(21.22,24.35)();
        }
        if(d.year>=2060 && d.year<2080){
            d.sumTemp = d3.randomUniform(21.76,26.39)();
        }
        if(d.year>=2080 && d.year<=2100){
            d.sumTemp = d3.randomUniform(22.48,28.86)();
        }
        const sumTemp = d.sumTemp;
        const altCombo = d.sumTemp * (d.dryDays - d.wetDays)+scaleCO(d.co);

        const year = d.year;
        const unc = d.unc;
        const temp = d.meanTemp; //annual mean temperature
        const dry = d.dryDays; //number of consecutive dry days
        const ano = d.sumTempAnoHigh; //anomaly of temperature for summer months
        const wet = d.wetDays; //number of consecutive wet days
        const airQ = d.airQuality; //projected future air quality
        const co = d.co;
        //projected future solar radiation - i asked the code to give me random numbers between the median and max 
        const solar = Math.floor(randomInteger(d.solarRadMedian, d.solarRadMax)) 
        const solSize = solScale(solar)
        return {
            numFlows: _.times(d.wetDays, i => { return { numPetals: numPetals, dry: dry, wet:wet, airQ: airQ, solSize: solSize, solar: solar } }),
            petSize,
            numPetals,
            dry,
            year,
            temp,
            ano,
            wet,
            combo,
            solar,
            co,
            unc,
            sumTemp,
            altCombo
        }
    });
    console.log(flowersData)


    //thing to download the compiled data
    var download = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flowersData));
    var a = document.createElement('a');
    a.href = 'data:' + download;
    a.download = 'data.json';
    a.innerHTML = 'download JSON';
    var container = document.getElementById('container');
    container.appendChild(a);


    //create one flower space per year
    //use the data accessible at that level of the json nest to drive the color and petal shapes
    const flowers = svg
        .selectAll('g.flower')
        .data(flowersData)
        .enter()
        .append('g')
        .attr('class', function(d, i) {
            return d.year;
        })
        .attr('transform', (d, i) => `translate(${(petalSize*8+i * petalSize*5)},${petalSize*4})scale(${d.petSize})`)
        .attr('fill', function(d, i) {
            //preparing the petal shape array here
            //the control points for the petal are driven by a random choice between the mean temperature and the projected anomaly
            p1 = 10 + Math.floor(randomInteger(d.temp - d.ano, d.temp + d.ano));
            p2 = 30 + Math.floor(randomInteger(d.temp - d.ano, d.temp + d.ano));
            p3 = 40 + Math.floor(randomInteger(d.temp - d.ano, d.temp + d.ano));


            // original: petalPath = "M 0,0 C -10,-10 -10,-40 0,-50 C 10,-40 10,-10 0,0"  
            //version of petal path with notch
            // pPath = ("M 0,0 C -10," + -p1 + " " + -p1 + "," + -p3 + " -5," + (-p3-10) + " C -5," + (-p3-10) + " 0," + (-p3-2) + " 5," + (-p3-10) + " C " + p1 + "," + -p3 + " " + p1 + "," + -p1 + " 0,0");

            //for the petal path without notch
            pPath = ("M 0,0 C -10," + -p2 + " " + -p1 + "," + -p3 + " 0," + (-p3 - 10) + " C " + p1 + "," + -p3 + " 10," + -p2 + " 0,0");
            petalPathVar.push(pPath);

            //for the vein paths
            //original: veinPath = "M 0,0 C -10,-10 5,-20 0,-40 C -5,-20 10,-10 0,0";
            vPath = ("M 0,0 C -1," + -p1/2 + " " + -p1/3 + "," + -p3 + " 0," + (-p3 - 10) + " C " + p1/3 + "," + -p3 + " 1," + -p1/2 + " 0,0");
            veinPathVar.push(vPath);


            //the petals are filled based on the combo data and saturated based on dry days
            fillScale.domain(comboMinMax)
            satScale.domain(dryMinMax);

            var thisCol = d3.hsl(fillScale(d.combo)) //this isn't working

            thisCol.s = satScale(d.dry);
            thisCol.opacity = .5;

            return thisCol;
        })

    flowers.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', flowersData.length * petalSize * 4)
        .attr('stroke', 'black')
        .attr('stroke-width', .1);

    //NUMBER OF FLOWERS PER YEAR ACCORDING TO WET DAYS PER YEAR, spread out by dry days
    const flows = flowers.selectAll('g.flows')
        .data(d => d.numFlows).enter().append('g')
        .attr('class', function(d) {
            return d.numPetals;
        })
        .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*4})`) //spread out by how dry it was

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
        .attr('class', 'flows')
        .attr('d', function(d, i) {
            //find the petal path of your year
            var thisYear = d3.select(this.parentNode.parentNode).attr("class");

            var whichIndex = thisYear - 2023;
            return petalPathVar[whichIndex];
        })
        .attr('transform', function(d, i) {
            var numPetals = d3.select(this.parentNode).attr("class");
            return `rotate(${360 * i / numPetals})`
        })


    //prepare space for each vein path
    const veins = flowers.selectAll('g.veins')
        .data(d => d.numFlows).enter().append('g')
        .attr('class', function(d) {
            return d.numPetals;
        })
        .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*4})`) //spread out by how dry it was
        .attr('stroke', function(d, i) {
            //veins are colored according to the air quality
            veinScale.domain(airMinMax)
            var thisCol = d3.hsl(veinScale(d.airQ))
            return thisCol;
        })
        .attr('stroke-width',.1)
    veins
        .selectAll('path.veins')
        .data(d =>
            d3.range(d.numPetals).map(function(d) {
                return d;
            })
        )
        .enter()
        .append('path')
        .attr('class', 'veins')
        .attr('d', function(d, i) {
            //find the vein path of your year
            var thisYear = d3.select(this.parentNode.parentNode).attr("class");

            var whichIndex = thisYear - 2023;
            return veinPathVar[whichIndex];
        })
        .attr('transform', function(d, i) {
            var numPetals = d3.select(this.parentNode).attr("class");
            return `rotate(${360 * i / numPetals})`
        })




    //SPACE FOR THE BULLS EYE PATTERN
    //bulls eye pattern currently envisioned as simply: 
        //same as petal but sometimes bigger sometimes smaller according to solar radiation of that year
    const bulls = flowers.selectAll('g.bulls')
        .data(d => d.numFlows).enter().append('g')
        .attr('class', function(d) {
            return d.numPetals;
        })
        .attr('transform', (d, i) => `translate(${(0)},${i * d.dry*4})scale(${d.solSize/1.5})`)
        .attr('fill', function(d, i) {
            hueScale.domain(solarMinMax).range([50, 60]);
            ltScale.domain(solarMinMax).range([.5, .83])
            return d3.hsl(hueScale(d.solar), 1, ltScale(d.solar), .3);
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
        .attr('class', 'bulls')
        .attr('d', function(d, i) {
            var thisYear = d3.select(this.parentNode.parentNode).attr("class");
            var whichIndex = thisYear - 2023;
            return petalPathVar[whichIndex];
        })
        .attr('transform', function(d, i) {
            var numPetals = d3.select(this.parentNode).attr("class");
            return `rotate(${360 * i / numPetals})`
        })
        .attr('stroke', 'white')
        .attr('stroke-width', .5)

}