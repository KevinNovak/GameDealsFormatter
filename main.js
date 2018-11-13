const { app, BrowserWindow, ipcMain } = require('electron');
const Crawler = require('crawler');
const fs = require('fs');
const path = require('path');

let crawler = new Crawler({ callback: crawlerCallback });
let reviewsRegex = new RegExp(/(\d{1,2}%)\D+([\d,]+)/);
let template = fs
    .readFileSync(path.join(__dirname, './template.txt'))
    .toString();

let window;

app.on('ready', () => {
    window = new BrowserWindow({ width: 500, height: 600, resizable: false });
    window.loadFile('index.html');

    window.on('closed', () => {
        window = null;
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

ipcMain.on('game-submit', (event, gameId) => {
    crawler.queue(`https://store.steampowered.com/app/${gameId}/`);
});

function crawlerCallback(error, response, done) {
    if (error) {
        console.log(error);
        done();
        return;
    }

    let gameData = getGameData(response.options.uri, response.$);
    if (!gameData) {
        window.webContents.send('game-not-found');
        done();
        return;
    }

    let formattedOutput = formatOutput(gameData);
    window.webContents.send('output-generated', formattedOutput);
    done();
}

function getGameData(link, $) {
    try {
        let name = $('.apphub_AppName')
            .eq(0)
            .text()
            .trim();

        let releaseDate = $('.release_date > .date')
            .eq(0)
            .text()
            .trim();

        let description = $('.game_description_snippet')
            .eq(0)
            .text()
            .trim();

        let tags = $('.popular_tags > a.app_tag')
            .map(function(i, el) {
                return $(this)
                    .text()
                    .trim();
            })
            .get()
            .slice(0, 5)
            .join(', ');

        let reviews = $('.user_reviews_summary_row > .all')
            .eq(0)
            .parent()
            .attr('data-tooltip-text')
            .trim();

        let match = reviewsRegex.exec(reviews);
        let reviewsPercent = match[1];
        let reviewsCount = match[2];

        return {
            name,
            link,
            releaseDate,
            description,
            tags,
            reviewsPercent,
            reviewsCount
        };
    } catch (error) {
        console.log(error);
    }
}

function formatOutput(gameData) {
    return template
        .replace('{NAME}', gameData.name)
        .replace('{LINK}', gameData.link)
        .replace('{REVIEWS_PERCENT}', gameData.reviewsPercent)
        .replace('{REVIEWS_COUNT}', gameData.reviewsCount)
        .replace('{RELEASE_DATE}', gameData.releaseDate)
        .replace('{DESCRIPTION}', gameData.description)
        .replace('{TAGS}', gameData.tags);
}
