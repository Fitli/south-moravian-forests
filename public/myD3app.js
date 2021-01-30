//Variable containing reference to data
var data;
var firstRun;

//D3.js canvases
var textArea;
var barChartArea;
var heatMapArea;

//D3.js svg elements
var selectedAreaText;
var selectedTreeText;
var areaText;
var averageAgeText;
var averageHeightText;
var averageWidthText;

//Variables for selection
var selectedRegion;
var selectedRegionName;
var lastSelectedRegion;
var selectedTree;

//Variables for data normalization
var topValue;

//array of trees
var treeArray = ["SM", "DB", "BO", "BK", "HB", "MD", "JS", "LP", "BR", "KL", "OL", "JD", "TPS"]
var treeNum = treeArray.length
var treeNames = {
    "SM": "smrk ztepilý",
    "BO": "borovice lesní",
    "BK": "buk lesní",
    "DB": "dub letní, zimní",
    "HB": "habr obecný",
    "MD": "modřín evropský",
    "LP": "lípa srdčitá",
    "JS": "jasan ztepilý, úzkolistý",
    "BR": "bříza bradavičnatá, bělokorá",
    "KL": "javor klen",
    "OL": "olše lepkavá",
    "JD": "jedle bělokorá",
    "TPS": "topoly šlechtěné"
};

//colors
var barChartCol = "green"
var barChartColSelected = "black"
var mapStrokeCol = "black"
var mapminR = 255
var mapminG = 255
var mapminB = 255
var mapmaxR = 0
var mapmaxG = 128
var mapmaxB = 0

d3.csv("./public/trees.csv")
    .row(function(d) { return {
      strom : d["strom"],
      plocha : +d["plocha"],
      obec : d["obec"],
      vek : +d["vek"],
      sirka : +d["sirka"],
      vyska : +d["vyska"]
    }; 
  }).get(function(error, rows) { 
      
      //Saving reference to data
      data = rows;

      //Load map and initialise the views
      init(function(){
        //Data visualization
        visualization();
      });
      

      return('Success');
  });

/*----------------------
INITIALIZE VISUALIZATION
----------------------*/
function init(callback) {

  let width = screen.width;
  let height = screen.height;

  //Retrieve a SVG file via d3.request, 
  //the xhr.responseXML property is a document instance
  function responseCallback (xhr) {
    d3.select("#map_div").append(function () {
            return xhr.responseXML.querySelector('svg');
        }).attr("id", "map")
        .attr("viewbox", "0 0 100 100")
        .attr("width", "100%")
        .attr("height", "auto")
        .attr("x", 0)
        .attr("y", 0);
    };

  //You can select the root <svg> and append it directly
  d3.request("public/JMK.svg")
    .mimeType("image/svg+xml")
    .response(responseCallback)
    .get(function(n){
        let map = d3.select("body").select("#map");
        map.selectAll("path")
                .style("fill", "white")
                .style("stroke", mapStrokeCol)
                .on("click", function(){
                  mapClick(this);});
    });

  //D3 canvases for svg elements
  textArea = d3.select("#text_div").append("svg")
                                    .attr("width",d3.select("#text_div").node().clientWidth)
                                    .attr("height",d3.select("#text_div").node().clientHeight);

  barChartArea = d3.select("#barchart_div").append("svg")
                                    .attr("width",d3.select("#barchart_div").node().clientWidth)
                                    .attr("height",d3.select("#barchart_div").node().clientHeight);
  //Init selections
  selectedRegion = "all"
  selectedRegionName = "vše"
  selectedTree = "-"
  firstRun = false

  callback();
}


/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {

  //Draw text on the top
  drawTextInfo();

  //Draw bar chart in the middle
  drawBarChart();

}

/*----------------------
  TEXT INFORMATION
----------------------*/
function drawTextInfo(){
  //Draw headline
  textArea.append("text")
         .attrs({dx: 20, dy: "1em", class: "headline"})
         .text("Lesy v Jihomoravském kraji");

  //Draw selection information
  selectedAreaText = textArea.append("text")
         .attrs({dx: 20, dy: "3.5em", class: "subline"})
         .text("Obec s rozšířenou působností: " + selectedRegionName);
  selectedTreeText = textArea.append("text")
         .attrs({dx: 20, dy: "4.8em", class: "subline"})
         .text("Vybraný strom: " + selectedTree);
}


/*----------------------
  BAR CHART
----------------------*/
function drawBarChart(){
  updateBarChart(selectedRegion, selectedRegion);
}

function getSums() {
    let sums = {}
    for(var i = 0; i<data.length; i++) {
        if (!(data[i]["strom"] in sums)) {
            sums[data[i]["strom"]] = data[i]["plocha"]
        }
        else {
            sums[data[i]["strom"]] += data[i]["plocha"]
        }
    }
    return sums
}

function getAreas(region) {
    let areas = {}
    for(var i = 0; i<data.length; i++) {
        if (data[i]["obec"] == region) {
            areas[data[i]["strom"]] = data[i]["plocha"]
        }
    }
    return areas
}

function updateBarChart(region, oldRegion){
    barChartArea.remove()
    barChartArea = d3.select("#barchart_div").append("svg")
                                    .attr("width",d3.select("#barchart_div").node().clientWidth)
                                    .attr("height",d3.select("#barchart_div").node().clientHeight);
    
    //Get the dimensions of the canvas
    let thisCanvasWidth = barChartArea.node().clientWidth;
    let thisCanvasHeight = barChartArea.node().clientHeight;
    
    //Get the width of one bar in the bar chart
    let thisRectWidth = thisCanvasWidth/treeNum;

    let thisRegion = region;

    
    
    console.log("updateBarChart")
    console.log(region)
    
    let areaSizes = {}
    let areaSizesOld = {}
    
    
    
    if (region == "all") {
        areaSizes = getSums()
    }
    else {
        areaSizes = getAreas(region)
    }
    
    let max = 0
    let maxOld = 0
    
    for(tree in areaSizes) {
        if(areaSizes[tree] > max) {
            max = areaSizes[tree]
        }
    }
    
    console.log(oldRegion)
    if (firstRun == true) {
        firstRun=false;
        maxOld = max;
        let areaSizesOld = areaSizes;
    }
    
    else {
        if (oldRegion == "all") {
            areaSizesOld = getSums()
        }
        else {
            areaSizesOld = getAreas(oldRegion)
        }
        
        for(tree in areaSizesOld) {
            if(areaSizesOld[tree] > maxOld) {
                maxOld = areaSizesOld[tree]
            }
        }
    }
    
    for(let tree in areaSizes) {
        let plocha = areaSizes[tree]
        let plochaOld = areaSizesOld[tree]
        let pictureHeight = thisRectWidth*65.5/40.5
        let heightOld = (thisCanvasHeight * 0.9 - pictureHeight) * plochaOld/maxOld
        let height = (thisCanvasHeight * 0.9 - pictureHeight) * plocha/max
        let treeIndex = treeArray.indexOf(tree)
        let color = barChartCol
        if (tree == selectedTree) {
            color = barChartColSelected
        }
        let rect = barChartArea.append('rect')
            .attrs({ 
                x: thisRectWidth*treeIndex, 
                y: thisCanvasHeight - heightOld, 
                width: thisRectWidth, 
                height: heightOld, 
                fill: color,
                id: tree+"_box"
            });
        rect.append("title")
                .text(function(d) { return treeNames[tree] + ": " + plocha + " ha"; });
        rect.on("click", function(){
                barChartClick(tree);
            })
            .transition() //Animation function
            .duration(1000) //Duration in ms
            .attrs({ y: thisCanvasHeight - height, //Adjust only necessary attributes
                    height: height});
        
        img = barChartArea.append("svg:image")
            .attr("xlink:href", "tree_pics/"+tree+".svg")
            .attr("width", thisRectWidth)
            .attr("height", "auto")
            .attr("x", thisRectWidth*treeIndex)
            .attr("y",thisCanvasHeight - heightOld - pictureHeight)
            .attr("viewbox", "0 0 100 100");
        img.on("click", function(){
                barChartClick(tree);
            });
        img.append("title")
                .text(function(d) { return treeNames[tree] + ": " + plocha + " ha"; });
        img.on("click", function(){
                barChartClick(tree);
            })
            .transition() //Animation function
            .duration(1000) //Duration in ms
            .attrs({ y: thisCanvasHeight - height - pictureHeight});
    }

  for (let i = 0; i < data.length; i++){
      if (data[i]["strom"] == selectedTree && data[i]["obec"] == selectedRegion) {
            areaText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "1em", class: "subline"})
                    .text("Plocha porostu: " + data[i]["plocha"] + " ha");
            averageAgeText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "2.3em", class: "subline"})
                    .text("Průměrný věk: " + data[i]["vek"] + " let");
            averageHeightText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "3.6em", class: "subline"})
                    .text("Průměrná výška: " + data[i]["vyska"] + " m");
            averageWidthText= barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "4.9em", class: "subline"})
                    .text("Průměrná šířka: " + data[i]["sirka"] + " cm");
      }
  }
}


/*----------------------
  INTERACTION - map
----------------------*/
function mapClick(region){
    oldRegion = selectedRegion
    if(selectedRegion == region.id) {
        selectedRegion = "all"
        selectedRegionName = "vše"
    }
    else {      
        selectedRegion = region.id;
        selectedRegionName = region.childNodes[1].textContent;
    }

    selectedAreaText.remove();
    
    selectedAreaText = textArea.append("text")
         .attrs({dx: 20, dy: "3.5em", class: "subline"})
         .text("Obec s rozšířenou působností: " + selectedRegionName);
    updateBarChart(selectedRegion, oldRegion);

}

/*----------------------
  INTERACTION - barchart
----------------------*/
function barChartClick(tree){
  d3.select("body").select("#"+selectedTree+"_box")
          .transition()
          .duration(500)
          .style("fill", barChartCol);
  selectedTree = tree;
  console.log(tree)
  d3.select("body").select("#"+tree+"_box")
          .transition()
          .duration(500)
          .style("fill", barChartColSelected);
  let max = 0;
  for(var i = 0; i<data.length; i++) {
      if(data[i]["strom"] == tree && data[i]["plocha"] > max) {
          max = data[i]["plocha"];
      }
  }
  for(var i = 0; i<data.length; i++) {
      if(data[i]["strom"] == tree) {
          let coef = data[i]["plocha"]/max 
          let colR = Math.round((1-coef) * mapminR + coef * mapmaxR)
          let colG = Math.round((1-coef) * mapminG + coef * mapmaxG)
          let colB = Math.round((1-coef) * mapminB + coef * mapmaxB)
          let color = d3.color("rgb(" + colR + "," + colG + "," + colB + ")");
          d3.select("body").select("#"+data[i]["obec"])
          .transition()
          .duration(500)
          .style("fill", color);
      }
  }
  
  selectedTreeText.remove();
    
  selectedTreeText = textArea.append("text")
         .attrs({dx: 20, dy: "4.8em", class: "subline"})
         .text("Vybraný strom: " + treeNames[tree]);
  
  if(averageAgeText) {
    areaText.remove();
    averageAgeText.remove();
    averageWidthText.remove();
    averageHeightText.remove();
  }
         
  
  let thisCanvasWidth = barChartArea.node().clientWidth;
  for (let i = 0; i < data.length; i++){
      if (data[i]["strom"] == selectedTree && data[i]["obec"] == selectedRegion) {
          console.log(selectedTree, selectedRegion)
            areaText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "1em", class: "subline"})
                    .text("Plocha porostu: " + data[i]["plocha"] + " ha");
            averageAgeText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "2.3em", class: "subline"})
                    .text("Průměrný věk: " + data[i]["vek"] + " let");
            averageHeightText = barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "3.6em", class: "subline"})
                    .text("Průměrná výška: " + data[i]["vyska"] + " m");
            averageWidthText= barChartArea.append("text")
                    .attrs({dx: thisCanvasWidth*0.6, dy: "4.9em", class: "subline"})
                    .text("Průměrná šířka: " + data[i]["sirka"] + " cm");
      }
  }
}





