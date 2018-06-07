let m = [30, 10, 10, 10],
    w = 960 - m[1] - m[3],
    h = 500 - m[0] - m[2];

let x = d3.scale.ordinal().rangePoints([0, w], 1),
    y = {};


let line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),//.tickFormat(function(d) { return formatValue(d)}),
    background,
    foreground,
    dense = 20,
    opacity = 10
    back_opacty = 0.1;

let selected = {},
    dense_tiles = {};

d3.selectAll("canvas")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .style("padding", m.join("px ") + "px");

foreground = document.getElementById('foreground').getContext('2d');
background = document.getElementById('background').getContext('2d');


var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


d3.json("multi_tiles_20a.json", function (data) {
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

    /*
    d3.select('#opacity').on('change', () =>{
        dense = d3.select('#opacity').node().value;
        //console.log(this);

    })

    d3.select('#select_opacity').on('change', () =>{
        opacity = d3.select('#select_opacity').node().value;
        //console.log(this);

    })

    d3.select('#back_opacity').on('change', () =>{
        back_opacty = d3.select('#back_opacity').node().value;
        //console.log(this);

    })
    */
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

            if (Object.keys(selected).length != 0)
            {foreground.clearRect(0, 0, w + 1, h + 1);
                draw_selected(all_dims, foreground, data.tiles);
            }
            else

            {foreground.clearRect(0, 0, w + 1, h + 1);
                draw_pc(all_dims, foreground, data.tiles);
            }

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

                            return calc_density(ranges[i], [cur_mark[j], cur_mark[j + 1]])
                        });

                        break;

                    }

                }
            });

            // Delete Unselected Ones
            for (let sdim in selected) {

                if (!dims.includes(sdim)) {
                    delete selected[sdim];
                }
            }

            calc_densetile(selected, dense_tiles, data.tiles);
        }


        function draw_selected(dims, ctx, tiles, color) {

            //console.log("Redraw Foreground PC")

            let ind = 0;
            for (let dim in dims) {
                if (ind < dims.length - 1) {

                    let dim1 = dims[ind];
                    let dim2 = dims[ind + 1];
                    let tile_keys = Object.keys(tiles);
                    //var t0 = performance.now();



                    if (tile_keys.includes(dim1 + '/' + dim2))
                        draw_area2(ctx, dim1, dim2, tiles[dim1 + '/' + dim2], [dense_tiles[dim1], dense_tiles[dim2]], selected, color)
                    else if (tile_keys.includes(dim2 + '/' + dim1))
                        draw_area2(ctx, dim1, dim2, tiles[dim2 + '/' + dim1], [dense_tiles[dim1], dense_tiles[dim2]], selected, color)

                }
                ind++;
            }


        }
        //console.log(d3.select('#opacity'));

    }
)

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

                ctx.fillStyle = (color != undefined) ? (color + (dense * dd * back_opacty) + ")") : "rgba(0,100,160," + (dense * dd) + ")";

                ctx.fill();
            })

        })

    }

    else {
        // row is d2, col is d1

        tile.tile.map(function (d, i) {

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


function draw_area2(ctx, d1, d2, tile, dt, act, color) {
    //console.log(dt);


    //console.log(d1,d2,tile)
    let bin_num = tile.tile.length;
    let color_scale = d3.scale.linear().domain([0, 1500]).range([0, 0.1]);
    if (dt[0] != undefined) {

        if (d1 === tile.dim[0]) {
            //console.log("Forward")
            //console.log(dt[0], dt[1])
            // row is d1, col is d2
            //console.log(tile.tile)
            tile.tile.map(function (d, i) {


                d.map(function (dd, j) {
                    //console.log("dd", dd, "i", i, tile.dim[0], dt[0][i], "j", j, tile.dim[1],dt[1][j]);
                    ctx.beginPath();

                    ctx.moveTo(x(d1), y[d1](tile.mark[0][i]));
                    //console.log(x(d1), y[d1](tile.mark[0][i]))
                    ctx.lineTo(x(d2), y[d2](tile.mark[1][j]));
                    ctx.lineTo(x(d2), y[d2](tile.mark[1][j + 1]));
                    ctx.lineTo(x(d1), y[d1](tile.mark[0][i + 1]));

                    ctx.lineTo(x(d1), y[d1](tile.mark[0][i]));

                    //ctx.fillStyle = (color != undefined) ? (color + (dense * dd / 5) + ")") : "rgba(0,100,160," + (opacity * dense * dd * dt[0][i] * dt[1][j]) + ")";

                    ctx.fillStyle = (color != undefined) ? (color + (dense * dd / 5) + ")") : "rgba(0,100,160," + (opacity * dense * dd * calc_opacity(d1, d2, dt, act, i, j)/*dt[0][i] * dt[1][j]*/) + ")";


                    ctx.fill();
                })

            })

        }

        else {
            // row is d2, col is d1
            console.log("Reverse")
            tile.tile.map(function (d, i) {
                //console.log("d = ", d);
                console.log(tile)
                d.map(function (dd, j) {
                    console.log("dd", dd, "i", i, tile.dim[1], "j", j, tile.dim[0]);

                    ctx.beginPath();

                    ctx.moveTo(x(d1), y[d1](tile.mark[1][j]));
                    //console.log(x(d1), y[d1](tile.mark[0][i]))
                    ctx.lineTo(x(d2), y[d2](tile.mark[0][i]));
                    ctx.lineTo(x(d2), y[d2](tile.mark[0][i + 1]));
                    ctx.lineTo(x(d1), y[d1](tile.mark[1][j + 1]));

                    ctx.lineTo(x(d1), y[d1](tile.mark[1][j]));

                    //let alpha = 2*tile.tile[i][j];
                    //let fill = "rgba(0,100,160," + (opacity * dense * dd * dt[0][j] * dt[1][i]) + ")";
                    //ctx.fillStyle = fill;
                    ctx.fillStyle = "rgba(0,100,160," + (opacity * dense * dd * calc_opacity(d1, d2, dt, act, j, i)/*dt[0][j] * dt[1][i]*/) + ")";
                    ctx.fill();
                })

            })


        }
    }


};


function calc_density(select_range, cur_block) {
    let [min, max] = cur_block;
    let [smin, smax] = select_range;

    if (min > smax || max < smin)
        return 0
    else if (max > smax)
        return (min > smin) ? (smax - min) / (max - min) : (smax - smin) / (max - min);
    else if (min < smin)
        return (max < smax) ? (max - smin) / (max - min) : (smax - smin) / (max - min);
    else
        return 1
}

function calc_densetile(active_sel, dense_t, tiles) {


    for (let item in dense_t) {
        dense_t[item] = compute_dist(tiles, active_sel, item);

    }

    console.log("dt ", dense_t)

}

function compute_dist(tiles, active_sel, dim) {
    //let out;
    let cur_tile;
    let cur_dist
    if (active_sel.hasOwnProperty(dim)) {

        cur_dist = active_sel[dim];

        // Multiple Selection, will be modified later
        for (let active_dim in active_sel) {
            if (active_dim != dim) {
                if (tiles.hasOwnProperty(active_dim + '/' + dim)) {


                }
                else if (tiles.hasOwnProperty(dim + '/' + active_dim)) {


                }
            }

        }
    }

    else {
        for (let active_dim in active_sel) {

            if (tiles.hasOwnProperty(active_dim + '/' + dim)) {
                console.log("row")
                cur_tile = tiles[active_dim + '/' + dim].tile;

                cur_dist = cur_tile.map(r => r.reduce((a, b, i) => {
                    //console.log("b", b, "i", i, active_sel[active_dim][i])
                    return (a + active_sel[active_dim][i] * b)
                }),0);

                /*
                cur_dist = cur_tile.reduce((a, b) => {

                    return a.map((x, i) => x + active_sel[active_dim][i] * b[i])

                })
                */

            }
            else if (tiles.hasOwnProperty(dim + '/' + active_dim)) {
                console.log("col")
                cur_tile = tiles[dim + '/' + active_dim].tile;

                cur_dist = cur_tile.map(r => r.reduce((a, b, i) => {

                    return (a + active_sel[active_dim][i] * b)
                }));


            }


        }

    }

    return cur_dist;
}

function calc_opacity(d1, d2, dt, act, d1_ind, d2_ind) {
    if (Object.keys(act).includes(d1) && (!Object.keys(act).includes(d2))) {
        return dt[0][d1_ind] * dt[1][d2_ind];

    }

    else if (Object.keys(act).includes(d2) && (!Object.keys(act).includes(d1))) {

        return dt[0][d1_ind] * dt[1][d2_ind];
    }
    else if ((!Object.keys(act).includes(d2)) && (!Object.keys(act).includes(d1))) {

        return Math.sqrt(dt[0][d1_ind] * dt[1][d2_ind]);
    }
    else {  // Both dims are brushed
        return dt[0][d1_ind] * dt[1][d2_ind];
    }
}