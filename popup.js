chrome.storage.local.get('answers', function (data) {
    const answersDiv = document.getElementById('answers');

    if (data.answers && data.answers.length > 0) {
        data.answers.forEach(item => {
            // Создаем элемент для вопроса
            const questionElement = document.createElement('div');

            questionElement.className = 'question';
            questionElement.textContent = item.question;
            answersDiv.appendChild(questionElement);

            // Создаем элементы для каждого правильного ответа
            item.correctAnswers.forEach(answerText => {
                const answerElement = document.createElement('div');
                answerElement.className = 'answer';
                answerElement.textContent = `- ${answerText}`;
                answersDiv.appendChild(answerElement);
            });
        });
    } else {
        answersDiv.textContent = "Правильные ответы не найдены.";
    }
});
