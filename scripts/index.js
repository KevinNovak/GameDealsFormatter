const { ipcRenderer, clipboard } = require('electron');

let gameForm = document.getElementById('game-form');
let gameId = document.getElementById('game-id');
let outputArea = document.getElementById('output-area');
let customAlert = document.getElementById('custom-alert');
let customAlertTimer;

gameForm.addEventListener('submit', event => {
    event.preventDefault();
    ipcRenderer.send('game-submit', gameId.value);
});

ipcRenderer.on('output-generated', (event, output) => {
    outputArea.innerHTML = output;
    clipboard.writeText(output);
    showCustomAlert('Formatted output copied to clipboard.');
});

ipcRenderer.on('game-not-found', event => {
    outputArea.innerHTML = '';
    showCustomAlert('No game found.');
});

function showCustomAlert(msg) {
    customAlert.innerHTML = msg;
    customAlert.classList.remove('d-none');
    if (customAlertTimer) {
        clearTimeout(customAlertTimer);
    }
    customAlertTimer = setTimeout(() => {
        customAlert.classList.add('d-none');
    }, 5000);
}
