// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

var m = [30, 10, 10, 10],
    w = 960 - m[1] - m[3],
    h = 340 - m[0] - m[2];

var x = d3.scale.ordinal().rangePoints([0, w], 1),
    y = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground,
    dimensions,
    brush_count = 0;

d3.selectAll("canvas")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .style("padding", m.join("px ") + "px");

foreground = document.getElementById('foreground').getContext('2d');
background = document.getElementById('background').getContext('2d');
staging = document.getElementById('staging').getContext('2d');
staging_el = document.getElementById('staging');

var foreground_cache = {};

staging.strokeStyle = "rgba(0,100,160,0.24)";
foreground.strokeStyle = "rgba(0,100,160,0.24)";
background.strokeStyle = "rgba(0,0,0,0.02)";

var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

d3.csv("nutrients-small.csv", function(data) {

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
        return d != "name" && d != "group" &&(y[d] = d3.scale.linear()
            .domain(d3.extent(data, function(p) { return +p[d]; }))
            .range([h, 0]));
    }));

    // Render full foreground and background
    data.map(function(d) {
        staging.clearRect(0,0,w + m[1] + m[3], h + m[0] + m[2]);
        path(d, staging);
        foreground_cache[d.name] = staging.getImageData(0,0,w + m[1] + m[3], h + m[0] + m[2]);
    });
    data.map(function(d) {
        //path(d, background);
        cached_path(d.name);
    });

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add an axis and title.
    g.append("svg:g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("svg:text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    g.append("svg:g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        brush_count++;
        var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
            extents = actives.map(function(p) { return y[p].brush.extent(); });

        // Get lines within extents
        var selected = [];
        data.map(function(d) {
            return actives.every(function(p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? selected.push(d) : null;
        });

        // Render selected lines
        foreground.clearRect(0,0,w+1,h+1);
        paths(selected, foreground, brush_count);
    }

    function paths(data, ctx, count) {
        var n = data.length,
            i = 0,
            reset = false;
        function render() {
            var max = d3.min([i+50, n]);
            data.slice(i,max).forEach(function(d) {
                cached_path(d.name);
            });
            i = max;
        };
        (function animloop(){
            if (i >= n || count < brush_count) return;
            requestAnimFrame(animloop);
            render();
        })();
    };

    function cached_path(name) {
        staging.clearRect(0,0,w + m[1] + m[3], h + m[0] + m[2]);
        staging.putImageData(foreground_cache[name],0,0);
        foreground.drawImage(staging_el,0,0);
    };

});


function path(d, ctx) {
    ctx.beginPath();
    dimensions.map(function(p,i) {
        if (i == 0) {
            ctx.moveTo(x(p),y[p](d[p]));
        } else {
            ctx.lineTo(x(p),y[p](d[p]));
        }
    });
    ctx.stroke();
    return ctx;
};
