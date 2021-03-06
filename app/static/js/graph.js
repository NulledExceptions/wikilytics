var dateDim
var viewsByArticle
var viewsLineChart
var viewsMultipleLineChart


var it_IT = {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["€", ""],
  "dateTime": "%a %b %e %X %Y",
  "date": "%d/%m/%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
}

var IT = d3.locale(it_IT);
var numberFormat = IT.numberFormat(",.f")
var numberFormatComma = IT.numberFormat(",.2f")


function formatCrossifilter(data, query){

  var dateFormat = d3.time.format('%Y%m%d');

  query = query.replace(/ /g,'')
  query = query.replace(/l&#39;/g,'l_')
  query = query.replace(/L&#39;/g,'L_')
  query = query.replace(/d&#39;/g,'d_')
  query = query.replace(/D'/g,'D_')
  query = query.replace(/u&#39;/g,'"')
  query = query.replace(/&#39;/g,'"')
  query = query.replace(/u&#34;/g,'"')
  query = query.replace(/&#34;/g,'"')
  query = query.replace(/[\])[(]/g, '')
  query = query.split(',')

  data.forEach(function (d) {
    var date = d.timestamp.substr(0,8);
    d.timestamp = dateFormat.parse(date);
    d.project = d.project.replace('.wikipedia', '');
    d.views = +d.views;
    query.forEach(function(k){
      if (!(removeSpecial(k)+"views" in d)){
        d[removeSpecial(k)+"views"] = 0;
      }
    })
  });
  ndx = crossfilter(data);
  return ndx;
}

function createDimension(ndx, dimension){
  ndxDim = ndx.dimension(function(d){
    return d[dimension];
  })
  return ndxDim;
}

function renderDashboardCharts(data, query){

    var ndx = formatCrossifilter(data, query);
    dateDim = createDimension(ndx, "timestamp");
    var viewsDim = createDimension(ndx, "views");
    var langDim = createDimension(ndx, "project")
    var articleDim = createDimension(ndx, "article")
    var minDate = dateDim.bottom(1)[0].timestamp;
    var maxDate = dateDim.top(1)[0].timestamp;

    var viewsByDate = dateDim.group().reduceSum(function(d) {
      return d.views;
    });

    var viewsByLang = langDim.group().reduceSum(function(d){
      return d.views;
    });

    viewsByArticle = articleDim.group().reduceSum(function(d){
      return d.views;
    });

    colorDomain = []
    articles = viewsByArticle.top(Infinity)
    articles_views_key = []
    articles.forEach(function(d){
      colorDomain.push(d.key)
      articles_views_key.push(removeSpecial(d.key)+'views')
    })

    articles_views_key.forEach(function(k){
      this[removeSpecial(k)+'byDate'] = dateDim.group().reduceSum(function(d) {
        if (k in d){
          return d[k];
        }
      })
    });

var colorScale = d3.scale.ordinal()
    .domain(colorDomain)
    .range(['#00D46E','#B105CF','#0C80CC','#FF4100','#FF8E00']);

    //Define values (to be used in charts)
    //Inizializate Charts

    viewsLineChart = dc.lineChart('#views-line-chart');
    viewsMultipleLineChart = dc.compositeChart('#views-multiple-line-chart')
    var viewsBarChart = dc.barChart('#views-bar-chart');

    var langPieChart = dc.pieChart('#langs-pie-chart');
    var articleRowChart = dc.rowChart('#article-row-chart');

    //Add Basic Attribute for line charts
    linechartAttribute(viewsLineChart);
    barchartAttribute(viewsBarChart);

    viewsLineChart
      .x(d3.time.scale().domain([minDate, maxDate]))
      .dimension(dateDim);

    if (articles_views_key.length > 1){
      for(var i =0; i < articles_views_key.length ;i++){
        if (i==0){
          viewsLineChart.group(this[articles_views_key[i] +'byDate'], articles[i].key)
        }
        else{
          viewsLineChart.stack(this[articles_views_key[i] +'byDate'], articles[i].key)
        }
      }
    }
    else{
      viewsLineChart.group(this[articles_views_key[0] +'byDate'], articles[0].key)
    }
    viewsLineChart.rangeChart(viewsBarChart)
    //.legend(dc.legend().x(60).y(265).autoItemWidth(true).gap(10).horizontal(true));
    .legend(dc.legend().x(70).y(30).autoItemWidth(true).gap(10))
    .colors(function(d) {
      return colorScale(d)
    });

    viewsBarChart
      .x(d3.time.scale().domain([minDate, maxDate]))
      .dimension(dateDim)
      .group(viewsByDate, "Views by day")
      .colors(function(d) {
        return colorScale(d)
      });

    langPieChart
      .radius(120)
      .height(280)
      .dimension(langDim)
      .group(viewsByLang)
      .colors(function(d) {
        return colorScale(d)
      });

    articleRowChart
      .width(null)
      .height(280)
      .margins({
        top: 15,
        right: 50,
        bottom: 40,
        left: 60
      })
      .dimension(articleDim)
      .group(viewsByArticle)
      .elasticX(true)
      .colors(function(d) {
        return colorScale(d)
      });


    viewsMultipleLineChart
        .width(null)
        .height(450)
        .margins({
            top: 15,
            right: 50,
            bottom: 40,
            left: 60
        })
        .x(d3.time.scale().domain([minDate, maxDate]))
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .brushOn(false);


        compose = []

        for(var i =0; i < articles_views_key.length ;i++){
            compose.push(dc.lineChart(viewsMultipleLineChart).group(this[articles_views_key[i] +'byDate'], articles[i].key).colors(function(d) {return colorScale(d)}))}

      viewsMultipleLineChart.compose(compose).rangeChart(viewsBarChart)
      .legend(dc.legend().x(70).y(30).autoItemWidth(true).gap(10))
      .colors(function(d) {
        return colorScale(d)
      });


    setChartWidth();
    applyRangeChart(viewsBarChart, [viewsMultipleLineChart, viewsLineChart]);
    dc.renderAll();
    drawtips();
}

function linechartAttribute(linechart){
  linechart
  .width(null)
  .height(280)
  .margins({
      top: 15,
      right: 50,
      bottom: 40,
      left: 60
  })
  .round(d3.time.day.round)
  .xUnits(d3.time.months)
  .brushOn(false)
  .elasticY(true)
  .renderArea(true)
  .mouseZoomable(false)
  .renderHorizontalGridLines(true)
  .transitionDuration(1000)
  .colors(function(d) {
      return colorScale(d)
  })
  .yAxis().tickFormat(d3.format(".2s"));
}

function barchartAttribute(barchart){
  barchart
  .width(null)
  .height(100)
  .margins({
      top: 15,
      right: 50,
      bottom: 40,
      left: 60
  })
  .centerBar(true)
  .elasticY(true)
  .xUnits(d3.time.days)
  .yAxis().ticks(0);

}

// Draw Tips on Graphs
function drawtips() {
    var svg = d3.selectAll(".d3-tip-label-linechart").select("svg");
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return composeLinechartTooltip(d);
        });
    svg.call(tip);
    svg.selectAll(".dot")
        .on('mousemove', tip.show)
        .on('mouseout', tip.hide)

    var svg = d3.selectAll(".d3-tip-label-barchart").select("svg");
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return composeBarchartTooltip(d);
        });
    svg.call(tip);
    svg.selectAll(".bar")
        .on('mousemove', tip.show)
        .on('mouseout', tip.hide)
}








