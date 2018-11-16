const { ipcRenderer, clipboard } = require('electron');

// Element selectors
let gameForm = document.getElementById('game-form');
let gameId = document.getElementById('game-id');
let dealSite = document.getElementById('deal-site');
let dealPrice = document.getElementById('deal-price');
let percentOff = document.getElementById('percent-off');
let titleOutput = document.getElementById('title-output');
let commentOutput = document.getElementById('comment-output');
let customAlert = document.getElementById('custom-alert');

let customAlertTimer;

gameForm.addEventListener('submit', event => {
    event.preventDefault();
    ipcRenderer.send('game-form-submit', {
        gameId: gameId.value,
        dealSite: dealSite.value,
        dealPrice: dealPrice.value,
        percentOff: percentOff.value
    });
});

ipcRenderer.on('output-generated', (event, output) => {
    titleOutput.innerHTML = output.title;
    commentOutput.innerHTML = output.comment;
    clipboard.writeText(output.title);
    showCustomAlert('Title copied to clipboard.');
});

ipcRenderer.on('game-not-found', event => {
    commentOutput.innerHTML = '';
    showCustomAlert('No game found.');
});

function showCustomAlert(msg) {
    customAlert.innerHTML = msg;
    customAlert.classList.remove('invisible');
    if (customAlertTimer) {
        clearTimeout(customAlertTimer);
    }
    customAlertTimer = setTimeout(() => {
        customAlert.classList.add('invisible');
    }, 5000);
}
