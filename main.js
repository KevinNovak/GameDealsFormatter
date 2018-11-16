const { app, BrowserWindow, ipcMain, shell } = require('electron');
const Crawler = require('crawler');
const fs = require('fs');
const path = require('path');

let crawler = new Crawler({ callback: crawlerCallback });
let reviewsRegex = new RegExp(/(\d{1,2}%)\D+([\d,]+)/);

let titleTemplate = fs
    .readFileSync(path.join(__dirname, './templates/title-template.txt'))
    .toString();
let commentTemplate = fs
    .readFileSync(path.join(__dirname, './templates/comment-template.txt'))
    .toString();

let window;

app.on('ready', () => {
    window = new BrowserWindow({ width: 820, height: 660, resizable: true });
    window.loadFile('index.html');

    window.on('closed', () => {
        window = null;
    });

    // Open links in external browser
    var handleRedirect = (event, url) => {
        if (url != window.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    };

    window.webContents.on('will-navigate', handleRedirect);
    window.webContents.on('new-window', handleRedirect);
});

app.on('window-all-closed', () => {
    app.quit();
});

ipcMain.on('game-form-submit', (event, data) => {
    crawler.queue({
        uri: `https://store.steampowered.com/app/${data.gameId}/`,
        data
    });
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

    let title = formatTitle(response.options.data, gameData);
    let comment = formatComment(gameData);
    window.webContents.send('output-generated', { title, comment });
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

function formatTitle(dealData, gameData) {
    return titleTemplate
        .replace('{DEAL_SITE}', dealData.dealSite)
        .replace('{NAME}', gameData.name)
        .replace('{DEAL_PRICE}', dealData.dealPrice)
        .replace('{PERCENT_OFF}', dealData.percentOff);
}

function formatComment(gameData) {
    return commentTemplate
        .replace('{NAME}', gameData.name)
        .replace('{LINK}', gameData.link)
        .replace('{REVIEWS_PERCENT}', gameData.reviewsPercent)
        .replace('{REVIEWS_COUNT}', gameData.reviewsCount)
        .replace('{RELEASE_DATE}', gameData.releaseDate)
        .replace('{DESCRIPTION}', gameData.description)
        .replace('{TAGS}', gameData.tags);
}
