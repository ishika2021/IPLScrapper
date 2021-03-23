let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");
let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";
let dirpath = "D:\\My projects\\IPLScrapper\\ipl2020";
request(url, cb);
function cb(err, resp, html) {
    if (err) {
        console.log(err);
    } else {
        extractData(html);
    }
}

function extractData(html) {
    let stool = cheerio.load(html);
    let nextPageLink = "https://www.espncricinfo.com/" + stool(".widget-items.cta-link a").attr("href");
    console.log(nextPageLink);
    goToNextPage(nextPageLink);
}
function goToNextPage(url) {
    request(url, cb);
    function cb(err, resp, html) {
        if (err) {
            console.log(err);
        } else {
            extractNextPageData(html);
        }
    }
}

function extractNextPageData(html) {
    let stool = cheerio.load(html);
    let allMatchBoxes = stool(".match-cta-container");
    for (let i = 0; i < allMatchBoxes.length; i++) {
        let MatchPageLinkArr = stool(allMatchBoxes[i]).find("a");
        let ScoreCardLink = "https://www.espncricinfo.com/" + stool(MatchPageLinkArr[2]).attr("href");
        goToMatchPage(ScoreCardLink);

    }
}

function goToMatchPage(link) {
    request(link, cb);
    function cb(err, resp, html) {
        if (err) {
            console.log(err);
        } else {
            extractMatchPageData(html);
        }
    }
}
function createTeamNameFolder(name) {
    let fullpath = path.join(dirpath, name);
    if (fs.existsSync(fullpath) == false) {
        fs.mkdirSync(fullpath);
    }
}

function createPlayerFile(filePath) {
    if (fs.existsSync(filePath) == false) {
        let createStream = fs.createWriteStream(filePath);
        createStream.end();
        return false;
    }else{
        return true;
    }
    
}
function addCommonDetail(html, teamName) {
    let stool = cheerio.load(html);
    let basicInfo = stool(".match-info.match-info-MATCH");
    let desArr = stool(basicInfo).find(".description").text().split(",");
    let teamArr = stool(basicInfo).find(".teams p");
    let date = desArr[2].trim();
    let venue = desArr[1].trim();
    let result = stool(basicInfo).find(".status-text").text();
    let opponentTeam;
    if (teamName == stool(teamArr[0]).text()) {
        opponentTeam = stool(teamArr[1]).text();
    } else {
        opponentTeam = stool(teamArr[0]).text();
    }
    let arr = []
    arr.push(date, venue, result, opponentTeam);
    return arr;

}
function extractMatchPageData(html) {
    let stool = cheerio.load(html);
    let teamNameArr = stool(".Collapsible h5");
    let nameArr = []
    for (let i = 0; i < teamNameArr.length; i++) {
        let name = stool(teamNameArr[i]).text().split("INNINGS")[0].trim();
        nameArr.push(name);
        createTeamNameFolder(name);

    }
    let tableArr = stool(".Collapsible table.batsman");
    for (let i = 0; i < tableArr.length; i++) {
        let teamName = nameArr[i];
        let playerRow = stool(tableArr[i]).find("tbody tr");
        for (let j = 0; j < playerRow.length-1; j += 2) {
            let arr = [];
            let playerDetails = stool(playerRow[j]).find("td");
            let playerName = stool(playerDetails[0]).text().trim();
            let commondetailArr = addCommonDetail(html, teamName);
            let obj={
                "Runs": stool(playerDetails[2]).text(),
                "Balls": stool(playerDetails[3]).text(),
                "Fours": stool(playerDetails[5]).text(),
                "Sixes": stool(playerDetails[6]).text(),
                "Strike-Rate": stool(playerDetails[7]).text(),
                "Date": commondetailArr[0],
                "Venue": commondetailArr[1],
                "Result": commondetailArr[2],
                "Opponent-Team": commondetailArr[3], 
            }
            arr.push(obj);
            let filePath = path.join(dirpath,teamName,playerName+".json");
            if(createPlayerFile(filePath)){
                let data=fs.readFileSync(filePath);
                    if(data.length==0){
                        fs.writeFileSync(filePath, JSON.stringify(arr));
                    }else{
                        let jsonData=JSON.parse(data);
                        jsonData.push(obj);
                        fs.writeFileSync(filePath,JSON.stringify(jsonData));
                    }
            }else{ 
                fs.writeFileSync(filePath, JSON.stringify(arr));
            }

        }
    }

}
