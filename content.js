chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractScript") {
        const scriptElement = document.querySelector('head script:nth-of-type(4)');
        const scriptContent = scriptElement ? scriptElement.textContent : null;
        sendResponse({ scriptContent });
    }
});

function highlightCorrectAnswersInIframe(iframeDocument, answers) {
    console.log("Начинаем выделение правильных ответов в iframe...");

    let subframe = null
    try {
        // Получаем доступ к вложенному iframe внутри секции основного iframe
        try {
            subframe = iframeDocument.body
                .querySelector('section')
                .querySelector('iframe');
        } catch (e) {
            subframe = iframeDocument.body
        }

        // Проверяем, что вложенный iframe доступен
        if (subframe && subframe.contentDocument) {
            const subframeDocument = subframe.contentDocument;

            // Ищем все элементы <li> внутри body вложенного iframe
            const listItems = subframeDocument.querySelectorAll('li');

            if (listItems.length === 0) {
                console.log("Элементы <li> не найдены.");
            } else {
                // Обрабатываем ответы
                answers.forEach(item => {
                    console.log("Обработка вопроса:", item.question);

                    item.correctAnswers.forEach(correctAnswer => {
                        console.log("Ищем ответ:", correctAnswer);

                        // Проходимся по всем <li> элементам и их дочерним элементам для выделения
                        listItems.forEach(el => {
                            if (el.innerText && el.innerText.trim() === correctAnswer.trim()) {
                                console.log("Найден правильный ответ в элементе:", el);

                                // Применяем стиль к элементу <li>
                                el.style.backgroundColor = 'yellow';
                                el.style.fontWeight = 'bold';
                                el.style.color = 'black';

                                // Применяем стиль ко всем дочерним элементам найденного <li>
                                el.querySelectorAll('*').forEach(child => {
                                    child.style.backgroundColor = 'yellow';
                                    child.style.fontWeight = 'bold';
                                    child.style.color = 'black';
                                });
                            }
                        });
                    });
                });
            }
        } else {
            if (subframe) {
                const listItems = subframe.querySelectorAll('li');

                if (listItems.length === 0) {
                    console.log("Элементы <li> не найдены.");
                } else {
                    // Обрабатываем ответы
                    answers.forEach(item => {
                        console.log("Обработка вопроса:", item.question);

                        item.correctAnswers.forEach(correctAnswer => {
                            console.log("Ищем ответ:", correctAnswer);

                            // Проходимся по всем <li> элементам и их дочерним элементам для выделения
                            listItems.forEach(el => {
                                if (el.innerText && el.innerText.trim() === correctAnswer.trim()) {
                                    console.log("Найден правильный ответ в элементе:", el);

                                    // Применяем стиль к элементу <li>
                                    el.style.backgroundColor = 'yellow';
                                    el.style.fontWeight = 'bold';
                                    el.style.color = 'black';

                                    // Применяем стиль ко всем дочерним элементам найденного <li>
                                    el.querySelectorAll('*').forEach(child => {
                                        child.style.backgroundColor = 'yellow';
                                        child.style.fontWeight = 'bold';
                                        child.style.color = 'black';
                                    });
                                }
                            });
                        });
                    });
                }
            } else {
                console.error("Вложенный iframe не найден или недоступен.");
            }
        }
    } catch (e) {
        console.error("Ошибка доступа к вложенному iframe:", e);
    }
}


// Функция для загрузки ответов из локального хранилища и их выделения в iframe
function loadAndHighlightAnswersInIframe(iframeDocument) {
    chrome.storage.local.get('answers', function (data) {
        if (data.answers && data.answers.length > 0) {
            console.log("Правильные ответы загружены из хранилища:", data.answers);
            highlightCorrectAnswersInIframe(iframeDocument, data.answers);
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

