let m = [30, 10, 10, 10],
    w = 960 - m[1] - m[3],
    h = 500 - m[0] - m[2];

let x = d3.scale.ordinal().rangePoints([0, w], 1),
    y = {};


let line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),//.tickFormat(function(d) { return formatValue(d)}),
    background,
    foreground,
    dense = 10;


let selected = {},
    dense_tiles = {};

d3.selectAll("canvas")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .style("padding", m.join("px ") + "px");

foreground = document.getElementById('foreground').getContext('2d');
background = document.getElementById('background').getContext('2d');

//foreground.strokeStyle = "rgba(0,100,160,0.24)";
//background.strokeStyle = "rgba(0,0,0,0.01)";

var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


d3.json("multi_tiles_50a.json", function (data) {
        let bin_num = data.tiles[Object.keys(data.tiles)[0]].mark[0].length - 1;

        // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions = data.dims.filter(function (d) {
            console.log(data)
            dense_tiles[d] = Array.from({length: bin_num}, () => 1);

            return (y[d] = d3.scale.linear()
                .domain(data.range[d])
                .range([h, 0]));
        }));

        let all_dims = data.dims;

        draw_pc(all_dims, foreground, data.tiles);
        draw_pc(all_dims, background, data.tiles, "rgba(0,0,0,");


        var g = svg.selectAll(".dimension")
            .data(all_dims)
            .enter().append("svg:g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            });

        // Add an axis and title.
        g.append("svg:g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);


        // Add and store a brush for each axis.


        g.append("svg:g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);


        // Handles a brush event, toggling the display of foreground lines.

        function brush() {

            var actives = all_dims.filter(function (p) {
                    return !y[p].brush.empty();
                }),
                extents = actives.map(function (p) {
                    return y[p].brush.extent();
                });

            // Render selected lines
            foreground.clearRect(0, 0, w + 1, h + 1);

            //console.log("Paths were drawn here");

            process_selected(actives, extents);

            draw_selected(all_dims, foreground, data.tiles);


        }


        function process_selected(dims, ranges) {

            //if (dims.length!=0) {
                dims.map(function (dim, i) {

                    for (let tile_key in data.tiles) {
                        let tile = data.tiles[tile_key];
                        // Find bins for current dim
                        if ((tile.dim.findIndex(item => item === dim)) > -1) {

                            let cur_mark = tile.mark[tile.dim.findIndex(item => item === dim)];

                            selected[dim] = Array.from({length: bin_num}, (v, j) => {

                                return calc_density(ranges[i], [cur_mark[j], cur_mark[j+1]])
                            });

                            break;

                        }

                    }
                });

                // Delete Unselected Ones
                for (let sdim in selected){

                    if (!dims.includes(sdim)) {
                        delete selected[sdim];
                    }
                }


            //console.log(selected);
            //console.log(data)


            calc_densetile(selected, dense_tiles, data.tiles);
            //console.log("Get Current selected and dense_tiles");


            //draw_selected(selected, dense_tiles, dims, foreground, tiles)
        }




        function draw_selected(dims, ctx, tiles, color) {

            console.log("Redraw Foreground PC")

            let ind = 0;
            for (let dim in dims) {
                if (ind < dims.length - 1) {

                    let dim1 = dims[ind];
                    let dim2 = dims[ind + 1];
                    let tile_keys = Object.keys(tiles);
                    //var t0 = performance.now();

                    if (tile_keys.includes(dim1 + '/' + dim2))
                        draw_area2(ctx, dim1, dim2, tiles[dim1 + '/' + dim2], [dense_tiles[dim1], dense_tiles[dim2]], color)
                    else if (tile_keys.includes(dim2 + '/' + dim1))
                        draw_area2(ctx, dim1, dim2, tiles[dim2 + '/' + dim1], [dense_tiles[dim1], dense_tiles[dim2]], color)

                }
                ind++;
            }


        }

    }
)

/*
d3.csv("data/Test.csv", function (cars) {
    console.log("Input = ",cars);

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(cars[0]).filter(function (d) {
        return d != "name" && (y[d] = d3.scale.linear()
            .domain(d3.extent(cars, function (p) {
                return +p[d];
            }))
            .range([h, 0]));
    }));

    // Render full foreground and background
    cars.map(function (d) {
        //area(d, background);
        //area(d, foreground);
    });
    //console.log("Dims:", dimensions);
    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
            return "translate(" + x(d) + ")";
        });

    // Add an axis and title.
    g.append("svg:g")
        .attr("class", "axis")
        .each(function (d) {
            d3.select(this).call(axis.scale(y[d]));
        })
        .append("svg:text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    let bins = d3.layout.histogram()  // create layout object
        .bins(20)       // to use 20 bins
        .range([0, 1])  // to cover range from 0 to 1
        (cars);
    //console.log(bins(cars));
    //console.log(bins);

    // Add and store a brush for each axis.
    g.append("svg:g")
        .attr("class", "brush")
        .each(function (d) {
            console.log(d);
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        console.log("Brushing")
        var actives = dimensions.filter(function (p) {
                return !y[p].brush.empty();
            }),
            extents = actives.map(function (p) {
                return y[p].brush.extent();
            });

        // Get lines within extents
        var selected = [];
        cars.map(function (d) {
            return actives.every(function (p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? selected.push(d) : null;
        });

        // Render selected lines
        foreground.clearRect(0, 0, w + 1, h + 1);

        console.log("Paths were drawn here");
        selected.map(function (d) {
            area(d, foreground);

        });
    }
});
*/

/*
function path(d, ctx) {
    ctx.beginPath();
    dimensions.map(function (p, i) {
        if (i == 0) {
            ctx.moveTo(x(p), y[p](d[p]));
        } else {
            ctx.lineTo(x(p), y[p](d[p]));
        }
    });
    ctx.stroke();
};

function area(d, ctx) {
    //console.log(d);
    ctx.beginPath();
    dimensions.map(function (p, i) {
        //console.log('x = ', x(p), 'y = ', y);
        //console.log("P=", p);
        //console.log("i=", i);
        if (i == 0) {
            ctx.moveTo(x(p), y[p](d[p]));
        } else {
            ctx.lineTo(x(p), y[p](d[p]));
            ctx.lineTo(x(p), y[p](d[p])+5);
            ctx.moveTo(x(p), y[p](d[p]));

        }
    });
    //ctx.stroke();
    ctx.fill();

};
*/
function draw_pc(dims, ctx, tiles, color) {

    let ind = 0;
    for (let dim in dims) {
        if (ind < dims.length - 1) {

            let dim1 = dims[ind];
            let dim2 = dims[ind + 1];
            let tile_keys = Object.keys(tiles);
            //var t0 = performance.now();

            if (tile_keys.includes(dim1 + '/' + dim2))
                draw_area(ctx, dim1, dim2, tiles[dim1 + '/' + dim2], color)
            else if (tile_keys.includes(dim2 + '/' + dim1))
                draw_area(ctx, dim1, dim2, tiles[dim2 + '/' + dim1], color)

        }
        ind++;
    }
};

function draw_area(ctx, d1, d2, tile, color) {
    //console.log(d1,d2,tile)
    let bin_num = tile.tile.length;
    let color_scale = d3.scale.linear().domain([0, 1500]).range([0, 0.1]);
    if (d1 === tile.dim[0]) {
        // row is d1, col is d2
        //console.log(tile.tile)
        tile.tile.map(function (d, i) {
            //console.log("d = ", d);
            //console.log(i)
            d.map(function (dd, j) {
                ctx.beginPath();

                ctx.moveTo(x(d1), y[d1](tile.mark[0][i]));
                //console.log(x(d1), y[d1](tile.mark[0][i]))
                ctx.lineTo(x(d2), y[d2](tile.mark[1][j]));
                ctx.lineTo(x(d2), y[d2](tile.mark[1][j + 1]));
                ctx.lineTo(x(d1), y[d1](tile.mark[0][i + 1]));

                ctx.lineTo(x(d1), y[d1](tile.mark[0][i]));

                ctx.fillStyle = (color != undefined) ? (color + (dense * dd / 3) + ")") : "rgba(0,100,160," + (dense * dd) + ")";

                ctx.fill();
            })

        })

    }

    else {
        // row is d2, col is d1

        tile.tile.map(function (d, i) {
            //console.log("d = ", d);
            //console.log(i)
            d.map(function (dd, j) {
                ctx.beginPath();

                ctx.moveTo(x(d1), y[d1](tile.mark[1][i]));
                //console.log(x(d1), y[d1](tile.mark[0][i]))
                ctx.lineTo(x(d2), y[d2](tile.mark[0][j]));
                ctx.lineTo(x(d2), y[d2](tile.mark[0][j + 1]));
                ctx.lineTo(x(d1), y[d1](tile.mark[1][i + 1]));

                ctx.lineTo(x(d1), y[d1](tile.mark[1][i]));

                //let alpha = 2*tile.tile[i][j];
                let fill = "rgba(0,100,160," + (dense * dd) + ")";
                //console.log("Fill = ", fill)
                ctx.fillStyle = fill;
                //background.strokeStyle = "rgba(0,0,0,0.02)";
                ctx.fill();
            })

        })


    }


};


function draw_area2(ctx, d1, d2, tile, dt, color) {
    console.log(dt);
    //console.log(d1,d2,tile)
    let bin_num = tile.tile.length;
    let color_scale = d3.scale.linear().domain([0, 1500]).range([0, 0.1]);
    if (d1 === tile.dim[0]) {
        // row is d1, col is d2
        //console.log(tile.tile)
        tile.tile.map(function (d, i) {
            //console.log("d = ", d);
            //console.log(i)
            d.map(function (dd, j) {
                ctx.beginPath();

                ctx.moveTo(x(d1), y[d1](tile.mark[0][i]));
                //console.log(x(d1), y[d1](tile.mark[0][i]))
                ctx.lineTo(x(d2), y[d2](tile.mark[1][j]));
                ctx.lineTo(x(d2), y[d2](tile.mark[1][j + 1]));
                ctx.lineTo(x(d1), y[d1](tile.mark[0][i + 1]));

                ctx.lineTo(x(d1), y[d1](tile.mark[0][i]));

                ctx.fillStyle = (color != undefined) ? (color + (dense * dd / 5) + ")") : "rgba(0,100,160," + (10000*dense * dd * dt[0][i] * dt[1][j]) + ")";

                ctx.fill();
            })

        })

    }

    else {
        // row is d2, col is d1

        tile.tile.map(function (d, i) {
            //console.log("d = ", d);
            //console.log(i)
            d.map(function (dd, j) {
                ctx.beginPath();

                ctx.moveTo(x(d1), y[d1](tile.mark[1][i]));
                //console.log(x(d1), y[d1](tile.mark[0][i]))
                ctx.lineTo(x(d2), y[d2](tile.mark[0][j]));
                ctx.lineTo(x(d2), y[d2](tile.mark[0][j + 1]));
                ctx.lineTo(x(d1), y[d1](tile.mark[1][i + 1]));

                ctx.lineTo(x(d1), y[d1](tile.mark[1][i]));

                //let alpha = 2*tile.tile[i][j];
                let fill = "rgba(0,100,160," + (10000*dense * dd * dt[0][i] * dt[1][j]) + ")";
                //console.log("Fill = ", fill)
                ctx.fillStyle = fill;
                //background.strokeStyle = "rgba(0,0,0,0.02)";
                ctx.fill();
            })

        })


    }


};


function calc_density(select_range, cur_block){
    let [min, max] = cur_block;
    let [smin,smax] = select_range;

    if (min>smax || max<smin)
        return 0
    else if (max>smax)
        return (min>smin)?(smax-min)/(max-min):(smax-smin)/(max-min);
    else if (min<smin)
        return (max<smax)?(max-smin)/(max-min):(smax-smin)/(max-min);
    else
        return 1
}

function calc_densetile(active_sel, dense_t, tiles){
    //console.log("Compute DensTiles");
    let cur_tile;
    let cur_dist;
    //console.log(active_sel, dense_t, tiles);
    for(let dim in active_sel){

        for(let dimm in dense_t){

            let tile_keys = Object.keys(tiles);

            if (dim === dimm){
                //console.log(dense_t[dimm])
                dense_t[dimm] = active_sel[dim];//dense_t[dimm].map((val,ind)=>{
                    //console.log(val)
                    //console.log(active_sel[dim][ind])
                    //return (val*active_sel[dim][ind])
                    //return val*2
                //})

            }
            else if (tile_keys.includes(dim + '/' + dimm))
            {
                cur_tile = tiles[dim + '/' + dimm].tile;
                cur_dist = cur_tile.reduce((a, b) => {

                    //console.log(a,b);

                    return a.map((x, i) => x + active_sel[dim][i]*b[i])

                })
                dense_t[dimm] = cur_dist;


            }

            else if (tile_keys.includes(dimm + '/' + dim))
            {
                cur_tile = tiles[dimm + '/' + dim].tile;
                cur_dist = cur_tile.map(r => r.reduce((a, b, i) => {

                    //console.log(a)
                    //console.log(b)
                    //console.log(i);
                    return (a + active_sel[dim][i]*b)
                }));
                //console.log(cur_dist)
                dense_t[dimm] = cur_dist;

            }
            //console.log("Dist", cur_dist);

        }

    }
    console.log(dense_t)

}

