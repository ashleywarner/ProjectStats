"use strict";

var moment = require("moment"),
    fs = require('fs');

var results = {};
var userCommits = {};

/**
 * @param {Commit} commit
 */
function parseCommit(commit) {

    function formatDate(date) {
        return moment(date).format("YYYY-MM-DD");
    }

    function formatTime(date) {
        return moment(date).format("hh:mm:ss");
    }

    var date = formatDate(new Date(commit.date));
    var time = formatTime(new Date(commit.date));

    if (!results[date]) {
        results[date] = 0;
    }
    results[date]++;

    var rtn;
    if (commit.author && commit.author.user && commit.author.user.display_name) {
        if (!userCommits[commit.author.user.display_name]) {
            userCommits[commit.author.user.display_name] = {};
        }
        if (!userCommits[commit.author.user.display_name][date]) {
            userCommits[commit.author.user.display_name][date] = 0;
        }
        userCommits[commit.author.user.display_name][date]++;

        rtn = "\"" + date + "\",\"" + time + "\",\"" + commit.author.user.display_name + "\"\n";
    }

    return rtn;
}

function initOutput(callback) {
    fs.writeFileSync("./output.txt", "\"date\",\"time\",\"author\"\n");
    callback();
}

function getResults() {
    return results;
}

function getUserResults() {
    return userCommits;
}

module.exports = {
    initOutput: initOutput,
    parseCommit: parseCommit,
    getResults: getResults,
    getUserResults: getUserResults
};