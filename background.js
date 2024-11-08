importScripts('libs/jszip.min.js');

chrome.webNavigation.onCompleted.addListener(function (details) {
    if (details.url.includes('eios.kantiana.ru')) {
        console.log("Страница на eios.kantiana.ru загружена:", details.url);
        const h5pUrl = extractH5PUrl(details.url);
        if (h5pUrl) {
            console.log("Найден URL на H5P файл:", h5pUrl);
            fetchH5PFile(h5pUrl);
        }
    }
}, {url: [{hostContains: 'eios.kantiana.ru'}]});

function extractH5PUrl(url) {
    const regex = /url=([^&]+)/;
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
}

function fetchH5PFile(h5pUrl) {
    fetch(h5pUrl)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const content = reader.result;
                extractAnswersFromH5P(content);
            };
            reader.readAsArrayBuffer(blob);
        })
        .catch(error => console.error("Ошибка при загрузке H5P файла:", error));
}

function extractAnswersFromH5P(content) {
    const zip = new JSZip();
    zip.loadAsync(content).then(function (zip) {
        const contentJsonFile = zip.file('content/content.json');
        if (contentJsonFile) {
            contentJsonFile.async('string').then(function (jsonText) {
                const data = JSON.parse(jsonText);
                console.log("Извлеченные данные из content.json:", data); // Логирование
                const answers = parseAnswers(data['questions']);
                console.log("Правильные ответы:", answers);

                chrome.storage.local.set({ answers: answers }, function () {
                    if (chrome.runtime.lastError) {
                        console.error("Ошибка сохранения в локальное хранилище:", chrome.runtime.lastError);
                    } else {
                        console.log("Правильные ответы сохранены в хранилище.");
                    }
                });
            });
        } else {
            console.log("content.json не найден в архиве H5P.");
        }
    }).catch(function (error) {
        console.error("Ошибка при разборе H5P файла:", error);
    });
}

function parseAnswers(questions) {
    const answers = questions.map(question => {
        const correctAnswers = question.params.answers
            .filter(answer => answer.correct) // Оставляем только правильные ответы
            .map(answer => answer.text
                .replace(/&nbsp;/g, ' ') // Заменить неразрывный пробел
                .replace(/&amp;/g, '&')  // Заменить амперсанд
                .replace(/&lt;/g, '<')   // Заменить < на обычный символ
                .replace(/&gt;/g, '>')   // Заменить > на обычный символ
                .replace(/<\/?div>/g, '') // Убираем теги div
                .trim()); // Убираем пробелы по краям


        return {
            question: question.params.question.replace(/<\/?p>/g, '').trim(), // Текст вопроса без <p> тегов
            correctAnswers: correctAnswers
        };
    });

    return answers;
}
