importScripts('libs/jszip.min.js');

let PREPARSED_JSON = null

function clearText(text) {
    return text
        .replace(/\u00a0/g, ' ')
        .replace(/&nbsp;/g, ' ') // Заменить неразрывный пробел
        .replace('&nbsp;', ' ')
        .replace('/&amp;/g', '&')  // Заменить амперсанд
        .replace(/&amp;/g, '&')
        .replace('/&lt;/g', '<')   // Заменить < на обычный символ
        .replace(/&lt;/g, '<')
        .replace('/&gt;/g', '>')   // Заменить > на обычный символ
        .replace(/&gt;/g, '>')
        .replace('/<\/?div>/g', '') // Убираем теги div
        .replace(/<\/?div>/g, '')
        .trim() // Убираем пробелы по краям
}

function init() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab && tab.url) {
            console.log(`Tab ${tabId} has completed loading: ${tab.url}`);

            chrome.scripting.executeScript({
                target: {tabId: tabId}, func: extractScriptContent
            }, (injectionResults) => {
                try {
                    if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                        const scriptContent = injectionResults[0].result;

                        if (!scriptContent.includes('H5PIntegration')) {
                            console.error("Variable 'H5PIntegration' not found in script content.");
                            return;
                        }

                        let jsonData = extractJsonFromScript(scriptContent)["contents"]
                        let firstKey = Object.keys(jsonData)[0]
                        jsonData = JSON.parse(jsonData[firstKey]["jsonContent"])

                        if (jsonData) {
                            console.log("Parsed JSON");
                            console.log(jsonData);
                            parseJSONAnswersToLocalStorage(jsonData);
                        } else {
                            console.error("Failed to extract valid JSON from script content. jsonData is:", jsonData);
                        }
                    } else {
                        console.warn("No script content extracted from the page.");
                    }
                } catch (error) {
                    console.error("Error processing script content:", error.message);
                }
            });
        }
    });

    chrome.webNavigation.onCompleted.addListener(function (details) {
        if (details.url.includes('lms.kantiana.ru')) {
            console.log("Страница на lms.kantiana.ru загружена:", details.url);

            if (PREPARSED_JSON) {
                console.log("Извлеченные данные из <script>:", PREPARSED_JSON);
            }
        } else if (details.url.includes('eios.kantiana.ru')) {
            console.log("Страница на eios.kantiana.ru загружена:", details.url);
            const h5pUrl = extractH5PUrl(details.url);
            if (h5pUrl) {
                console.log("Найден URL на H5P файл:", h5pUrl);
                fetchH5PFile(h5pUrl);
            }
        }
    }, {url: [{hostContains: 'kantiana.ru'}]});
}


init()


function extractScriptContent() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        if (script.textContent.includes('H5PIntegration')) {
            return script.textContent; // Возвращаем содержимое скрипта
        }
    }
    return null;
}


function extractJsonFromScript(scriptContent) {
    try {
        // Ищем JSON после объявления переменной H5PIntegration
        const match = scriptContent.match(/var\s+H5PIntegration\s*=\s*(\{[\s\S]*?\});/);

        if (match && match[1]) {
            // Парсим JSON
            return JSON.parse(match[1]);
        }
    } catch (error) {
        console.error("Error parsing JSON from script content:", error.message);
    }

    return null; // Возвращаем null, если JSON не найден или невалиден
}


function extractH5PUrl(url) {
    const match1 = url.match(/url=([^&]+)/);
    const match2 = url.match(/(([A-Za-z]+)+)\.php\?id=([0-9]+)/);

    if (match1) {
        return decodeURIComponent(match1[1]);
    }

    if (match2) {
        return url;
    }

    return null;
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

function parseJSONAnswersToLocalStorage(data) {
    const answers = parseAnswers(data['questions']);
    console.log("Правильные ответы:", answers);

    chrome.storage.local.set({answers: answers}, function () {
        if (chrome.runtime.lastError) {
            console.error("Ошибка сохранения в локальное хранилище:", chrome.runtime.lastError);
        } else {
            console.log("Правильные ответы сохранены в хранилище.");
        }
    });
}

function extractAnswersFromH5P(content) {
    const zip = new JSZip();
    zip.loadAsync(content).then(function (zip) {
        const contentJsonFile = zip.file('content/content.json');
        if (contentJsonFile) {
            contentJsonFile.async('string').then(function (jsonText) {
                const data = JSON.parse(jsonText);
                console.log("Извлеченные данные из content.json:", data); // Логирование
                parseJSONAnswersToLocalStorage(data);
            });
        } else {
            console.log("content.json не найден в архиве H5P.");
        }
    }).catch(function (error) {
        console.error("Ошибка при разборе H5P файла:", error);
    });
}

function parseAnswers(questions) {
    return questions.map(question => {
        let questionText;

        if (question.params.question) {
            questionText = question.params.question.replace(/<\/?p>/g, '').trim();
        } else if (question.params.questions) {
                questionText = question.params.questions[0].replace(/<\/?p>/g, '').trim();
        } else if (question.params.textField) {
                questionText = question.params.textField.replace(/<\/?p>/g, '').trim();
        } else {  //textField
            console.log('not found any at', question.params)
            questionText = '<вопрос не найден>';
        }// Заглушка, если поле question отсутствует

        // Проверяем, есть ли поле answers и не пустое ли оно
        const hasAnswers = question.params.answers && question.params.answers.length > 0;

        // Обрабатываем правильные ответы, если они есть
        let correctAnswers = [];
        if (hasAnswers) {
            correctAnswers = question.params.answers
                .filter(answer => answer.correct).map(answer => clearText(answer.text))  // Оставляем только правильные ответы
        }

        // Если правильных ответов нет, добавляем заглушку
        if (correctAnswers.length === 0 && questionText.length > 0) {
            correctAnswers.push('<ответ содержится в полученном вопросе>');
        } else if (correctAnswers.length === 0) {
            correctAnswers.push('<ответ не найден>');
        }

        return {
            question: questionText, // Текст вопроса (с заглушкой, если поле отсутствует)
            correctAnswers: correctAnswers
        };
    });
}
