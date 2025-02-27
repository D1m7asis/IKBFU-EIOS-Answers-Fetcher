function clearText(text)
{
    text = text
        .replace('/&nbsp;/g', ' ') // Заменить неразрывный пробел
        .replace('&nbsp;', ' ') // Заменить неразрывный пробел
        .replace(/\u00a0/g, " ")
        .replace('/&amp;/g', '&')  // Заменить амперсанд
        .replace('/&lt;/g', '<')   // Заменить < на обычный символ
        .replace('/&gt;/g', '>')   // Заменить > на обычный символ
        .replace('/<\/?div>/g', '') // Убираем теги div
        .trim() // Убираем пробелы по краям
        
    return text;
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

        var blocks = subframe.querySelectorAll("div.question-container")
        if(blocks.lenght === 0)
        {
            console.log("Вопросы в iframe не найдены!")
        }
        else
        {
            for (let index = 0; index < blocks.length; index++) 
            {
                let block = blocks[index]
                var q = block.querySelector("div.h5p-question-introduction").textContent
                var as = block.querySelector("div.h5p-question-content").querySelectorAll("li")

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