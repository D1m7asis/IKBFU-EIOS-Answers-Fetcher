chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractScript") {
        const scriptElement = document.querySelector('head script:nth-of-type(4)');
        const scriptContent = scriptElement ? scriptElement.textContent : null;
        sendResponse({ scriptContent });
    }
});

// Функция для загрузки ответов из локального хранилища и их выделения в iframe
function loadAndHighlightAnswersInIframe(iframeDocument) {
    chrome.storage.local.get('answers', function (data) {
        if (data.answers && data.answers.length > 0) {
            console.log("Правильные ответы загружены из хранилища:", data.answers);
            prettierHighlight(data.answers);
        } else {    
            console.log("Правильные ответы не найдены в хранилище.");
        }
    });
}

// Периодически проверяем, загрузился ли iframe и его содержимое
const iframeCheckInterval = setInterval(() => {
    const iframe = document.querySelector('iframe'); // Замените на точный селектор iframe, если он известен

    if (iframe && iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        console.log("Iframe загружен. Начинаем обработку содержимого...");
        loadAndHighlightAnswersInIframe(iframe.contentDocument); // Запускаем выделение внутри iframe
        clearInterval(iframeCheckInterval); // Останавливаем проверку
    } else {
        console.log("Iframe пока не полностью загружен, продолжаем ожидание...");
    }
}, 2000); // Проверяем каждые 2 секунды

console.log("Скрипт content.js загружен и ожидает загрузки iframe.");

