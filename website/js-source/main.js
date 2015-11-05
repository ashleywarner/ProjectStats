require([""], function () {
    (function (window, undefined) {

        // Bind to StateChange Event
        History.Adapter.bind(window, 'statechange', function () { // Note: We are using statechange instead of popstate
            var State = History.getState(); // Note: We are using History.getState() instead of event.state
        });

    })(window);

    d3.csv("output.json", function (error, commits) {

        // exclude data from outside the last 365 days
        commits = commits.filter(function (d) {
            var startDate = (new Date() - 1000 * 60 * 60 * 24 * 365);
            var endDate = (new Date());
            var theDate = parseDate(d.date);
            if (theDate > startDate && theDate < endDate) {
                return true;
            }
            return false;
        });

        // Various formatters.
        var formatNumber = d3.format(",d"),
            formatDate = d3.time.format("%B %d, %Y"),
            formatTime = d3.time.format("%I:%M %p");

        // A nest operator, for grouping the commit panel.
        var nestByDate = d3.nest()
            .key(function (d) {
                return d3.time.day(d.date);
            });

        var nestByUser = d3.nest()
            .key(function (d) {
                return d.author;
            });

        // A little coercion, since the CSV is untyped.
        commits.forEach(function (d, i) {
            d.index = i;
            d.date = parseDate(d.date);
        });

        // Create the crossfilter for the relevant dimensions and groups.
        var commit = crossfilter(commits),
            all = commit.groupAll(),
            date = commit.dimension(function (d) {
                return d.date;
            }),
        //.filter([new Date() - 1000 * 60 * 60 * 24 * 365, new Date()]),
            user = commit.dimension(function (d) {
                return d.author;
            }),
            dates = date.group(d3.time.day),
            weeks = date.group(d3.time.week),
            hour = commit.dimension(function (d) {
                return d.date.getHours() + d.date.getMinutes() / 60;
            }),
            hours = hour.group(Math.floor);

        var columnPadding = 1;
        var dateColWidth = ($(".graph.date").width() - 30) / 365;
        var timeColWidth = ($(".graph.time").width() - 30) / 24;
        var charts = [

            barChart(dateColWidth)
                .dimension(date)
                .group(dates)
                .round(d3.time.day.round)
                .x(d3.time.scale()
                    .domain([new Date() - 1000 * 60 * 60 * 24 * 365, new Date()])
                    .rangeRound([0, dateColWidth * 365])),
            //                    .filter([new Date() - 1000 * 60 * 60 * 24 * 365, new Date()]),

            barChart(timeColWidth)
                .dimension(hour)
                .group(hours)
                .x(d3.scale.linear()
                    .domain([0, 24])
                    .rangeRound([0, timeColWidth * 24]))

        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        var chart = d3.selectAll(".chart .placeholder")
            .data(charts)
            .each(function (chart) {
                chart.on("brush", renderAll).on("brushend", renderAll);
            });

        // Render the initial lists.
        var commitsList = d3.selectAll(".panel.commit .list")
            .data([commitList]);

        var usersList = d3.selectAll(".panel.user .list")
            .data([userList]);

        // Render the total.
        d3.selectAll("#total")
            .text(formatNumber(commit.size()));

        renderAll();

        // Renders the specified chart or list.
        function render(method) {
            d3.select(this).call(method);
        }

        // Whenever the brush moves, re-rendering everything.
        function renderAll() {
            chart.each(render);
            commitsList.each(render);
            usersList.each(render);
            d3.select("#active").text(formatNumber(all.value()));
        }

        // Like d3.time.format, but faster.
        function parseDate(d) {
            return new Date(d);
        }

        window.filter = function (filters) {
            filters.forEach(function (d, i) {
                charts[i].filter(d);
            });
            renderAll();
        };

        window.reset = function (i) {
            charts[i].filter(null);

            //            if (i == 0) {
            startTime = undefined;
            endTime = undefined;
            //            } else {
            startDate = undefined;
            endDate = undefined;
            //            }

            History.pushState({}, window.title, getQueryString());

            renderAll();
        };

        window.filterUser = function (username) {
            $(".user-info").removeClass("selected");
            selectedUsername = username;
            if (username) {
                $(".user-info[data-user='" + username + "']").addClass("selected");
                user.filterFunction(function (d) {
                    return d == username;
                })
                $(".panel.user .reset").show();
            } else {
                $(".panel.user .reset").hide();
                user.filterAll();
            }
            History.pushState({user: username}, window.title, getQueryString());
            renderAll();
        }

        var selectedUsername = getQueryVariable("user"),
            startDate = getQueryVariable("startDate"),
            endDate = getQueryVariable("endDate"),
            startTime = getQueryVariable("startTime"),
            endTime = getQueryVariable("endTime");

        if (selectedUsername) {
            filterUser(decodeURI(selectedUsername));
        }

        if (startDate) {
            startDate = new Date(parseInt(startDate, 10));
        }

        if (endDate) {
            endDate = new Date(parseInt(endDate, 10));
        }

        if (startTime) {
            startTime = parseInt(startTime, 10);
        }

        if (endTime) {
            endTime = parseInt(endTime, 10);
        }

        var dateFilters, timeFilters;

        if (startDate != undefined && endDate != undefined) {
            dateFilters = [startDate, endDate];
        }

        if (startTime != undefined && endTime != undefined) {
            timeFilters = [startTime, endTime];
        }

        if (startTime && endTime || startDate && endDate) {
            filter([dateFilters, timeFilters]);
        }

        function getQueryVariable(variable) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
            return (false);
        }

        function getQueryString() {
            var array = [location.pathname.substring(location.pathname.lastIndexOf("/") + 1)];
            if(array[0] === "") {
                array[0] = "index.html";
            }
            if (selectedUsername) {
                array.push("user=" + encodeURI(selectedUsername));
            }
            if (startDate) {
                array.push("startDate=" + Date.parse(startDate));
            }
            if (endDate) {
                array.push("endDate=" + Date.parse(endDate));
            }
            if (startTime) {
                array.push("startTime=" + parseInt(startTime, 10));
            }
            if (endTime) {
                array.push("endTime=" + parseInt(endTime, 10));
            }
            var queryString = array.join("&");
            queryString = queryString.replace(/&/, "?");
            return queryString;
        }

        function commitList(div) {
            var commitsByDate = nestByDate.entries(date.top(1000));

            div.each(function () {
                var date = d3.select(this).selectAll(".date")
                    .data(commitsByDate, function (d) {
                        return d.key;
                    });

                date.enter().append("div")
                    .attr("class", "date")
                    .append("div")
                    .attr("class", "day")
                    .append("span")
                    .text(function (d) {
                        return formatDate(d.values[0].date);
                    });

                date.exit().remove();

                var commit = date.order().selectAll(".commit")
                    .data(function (d) {
                        return d.values;
                    }, function (d) {
                        return d.index;
                    });

                var commitEnter = commit.enter().append("div")
                    .attr("class", "commit");

                commitEnter.append("div")
                    .attr("class", "time")
                    .text(function (d) {
                        return formatTime(d.date);
                    });

                commitEnter.append("div")
                    .attr("class", "author")
                    .text(function (d) {
                        return d.author;
                    });

                commit.exit().remove();

                commit.order();
            });
        }

        function userList(div) {
            var commitsByUser = nestByUser.entries(date.top(100000));

            div.each(function () {

                commitsByUser.sort(function (a, b) {
                    return b.values.length > a.values.length ? 1 : -1;
                });

                var userList = d3.select(this).selectAll(".user-info")
                    .data(commitsByUser, function (d) {
                        return d.key;
                    });

                userList.select(".commit-count").text(function (d) {
                    return d.values.length.toLocaleString() + " commits";
                });

                userList.enter().append("div")
                    .attr("class", "user-info")
                    .attr("data-user", function (d) {
                        return d.values[0].author;
                    })
                    .attr("onclick", function (d) {
                        return "javascript:filterUser('" + d.values[0].author + "')";
                    })
                    .append("div")
                    .attr("class", "user-name")
                    .append("span")
                    .text(function (d) {
                        return d.values[0].author;
                    })
                    .append("span")
                    .attr("class", "commit-count")
                    .text(function (d) {
                        return d.values.length.toLocaleString() + " commits";
                    });


                userList.exit().remove();

                userList.order();
            });
        }

        function barChart(colWidth) {
            if (!barChart.id) barChart.id = 0;

            var margin = {
                    top: 0,
                    right: 20,
                    bottom: 20,
                    left: 10
                },
                x,
                y = d3.scale.linear().range([100, 0]),
                id = barChart.id++,
                axis = d3.svg.axis().orient("bottom"),
                brush = d3.svg.brush(),
                brushDirty,
                dimension,
                group,
                round;

            function chart(div) {
                var width = x.range()[1],
                    height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);

                div.each(function () {
                    var div = d3.select(this.parentNode),
                        g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                            .attr("href", "javascript:reset(" + id + ")")
                            .attr("class", "reset")
                            .text("Remove filter")
                            .style("display", "none");

                        g = div.append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        g.append("clipPath")
                            .attr("id", "clip-" + id)
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        g.selectAll(".bar")
                            .data(["background", "foreground"])
                            .enter().append("path")
                            .attr("class", function (d) {
                                return d + " bar";
                            })
                            .datum(group.all());

                        g.selectAll(".foreground.bar")
                            .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                            .attr("class", "axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(axis);

                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", 0)
                                .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", x(extent[0]))
                                .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").attr("d", barPath);
                });

                function barPath(groups) {
                    var path = [],
                        i = -1,
                        n = groups.length,
                        d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h" + (colWidth - columnPadding) + "V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                        x = e ? 1 : -1,
                        y = height / 3;
                    return "M" + (.5 * x) + "," + y
                        + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                        + "V" + (2 * y - 6)
                        + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                        + "Z"
                        + "M" + (2.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8)
                        + "M" + (4.5 * x) + "," + (y + 8)
                        + "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function () {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function () {
                var g = d3.select(this.parentNode),
                    extent = brush.extent();
                if (round) g.select(".brush")
                    .call(brush.extent(extent = extent.map(round)))
                    .selectAll(".resize")
                    .style("display", null);
                g.select("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));

                if (extent[0] < 24) {
                    startTime = extent[0];
                    endTime = extent[1];
                } else {
                    startDate = extent[0];
                    endDate = extent[1];
                }

                dimension.filterRange(extent);

                History.pushState({}, window.title, getQueryString());
            });

            brush.on("brushend.chart", function () {
                if (brush.empty()) {
                    var div = d3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");

                    startTime = undefined;
                    endTime = undefined;
                    startDate = undefined;
                    endDate = undefined;

                    dimension.filterAll();

                    History.pushState({}, window.title, getQueryString());
                }
            });

            chart.margin = function (_) {
                if (!arguments.length) return margin;
                margin = _;
                return chart;
            };

            chart.x = function (_) {
                if (!arguments.length) return x;
                x = _;
                axis.scale(x);
                brush.x(x);
                return chart;
            };

            chart.y = function (_) {
                if (!arguments.length) return y;
                y = _;
                return chart;
            };

            chart.dimension = function (_) {
                if (!arguments.length) return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function (_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function (_) {
                if (!arguments.length) return group;
                group = _;
                return chart;
            };

            chart.round = function (_) {
                if (!arguments.length) return round;
                round = _;
                return chart;
            };

            return d3.rebind(chart, brush, "on");
        }
    });
});