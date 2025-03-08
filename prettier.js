function clearText(text)
{
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

function prettierHighlight(answers)
{
    let iframeDocument = document.querySelector("iframe").contentDocument
    console.log("Начинаем выделение правильных ответов в iframe... (prettier edition)", iframeDocument);
    let subframe = null
    try 
    {
        subframe = iframeDocument.querySelector("section")
        if(subframe)
        {
            subframe = subframe.querySelector("iframe")
        }
        else
        {
            subframe = iframeDocument.querySelector("div.questionset.started")
        }
    } 
    catch (error) 
    {
        console.log("Не удалось выделить iframe...", error)
        subframe = document.body
        return
    }

    if(subframe)
    {
        if(subframe.contentDocument)
            subframe = subframe.contentDocument

        let blocks = subframe.querySelectorAll("div.question-container");
        
        if(blocks.length === 0)
        {
            console.log("Вопросы в iframe не найдены!")
        }
        else
        {
            for (let index = 0; index < blocks.length; index++) 
            {
                let block = blocks[index]
                let q = block.querySelector("div.h5p-question-introduction").textContent;
                let as = block.querySelector("div.h5p-question-content").querySelectorAll("li");

                if(clearText(q) !== clearText(answers[index].question))
                {
                    console.log("Вопросы не совпали... Номер вопроса:", index, clearText(q), clearText(answers[index].question))
                }

                as.forEach(a => 
                {

                    if(answers[index].correctAnswers.indexOf(clearText(a.textContent)) !== -1) 
                    {
                        //console.log("Ответ совпадает... ", a, answer.correctAnswers)
                        // Применяем стиль к элементу <li>
                        a.style.backgroundColor = 'yellow';
                        a.style.fontWeight = 'bold';
                        a.style.color = 'black';

                        // Применяем стиль ко всем дочерним элементам найденного <li>
                        a.querySelectorAll('*').forEach(child => 
                        {
                        child.style.backgroundColor = 'yellow';
                        child.style.fontWeight = 'bold';
                        child.style.color = 'black';
                        })
                    }  
                })
            }
        }
    }
    else
    {
        console.log("Не удалось выделить iframe... ", subframe)
    }
}