var JishoContent = [];

function Download(name, content)
{
    var link = document.createElement('a');
    link.download = name;
    var blob = new Blob([content], {type: 'text/plain'});
    link.href = window.URL.createObjectURL(blob);
    link.click();
}
function HandleJson(ev)
{
    var content = JSON.stringify(JishoContent);
    Download("vocabulary.json", content);
}
function HandleTXT(ev)
{
    var content = "";
    for(var i = 0; i < JishoContent.length; i++)
    {
        var kword = JishoContent[i].kword;
        var hword = JishoContent[i].hword;

        content = content + kword + ";" + hword + "\n";
    }
    Download("vocabulary.txt", content);
}
function HandleAme(ev)
{
    var template = ["@{kanjiword} @{CSS}","@{kanaword}<br>@{sense}<br>@{audio}<br><br>@{example}@{CSS}"];
    var tag = "AmeExtension";
    var TemplateForm = {"Fields" : template, "Tag" : tag};

    var InputForm = [];

    for(var i = 0; i < JishoContent.length; i++)
    {
        var kword = JishoContent[i].kword;
        var hword = JishoContent[i].hword;

        var entry = {
            "kanjiword" : kword,
            "kanaword" : hword,
            "literal" : ""
        };
        InputForm.push(entry);
    }

    var Request = {
        "AmeInput" : {
            "Template" : TemplateForm,
            "Input" : InputForm
        }
    };

    var uri = "https://amekanji.com/api/" + "post";

    var xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open('POST', uri, false);
    xmlHttpRequest.setRequestHeader('Content-Type', 'application/json')
    
    var requestbody = JSON.stringify(Request);
    xmlHttpRequest.send(requestbody);
    
    if(xmlHttpRequest.status != 200){
            console.error(response.Message);
            document.getElementById("Warning").innerText = "An error has occurred :(";
            return;
    }   
    
    var rawresponse = xmlHttpRequest.responseText;
    var response = JSON.parse(rawresponse);

    var uuid = response.UUID;

    var redirectionuri = "https://amekanji.com/" + "get.html?id=" + uuid;
    window.open(redirectionuri);

}
async function UpdateJishoContent()
{
    var results = await browser.storage.sync.get("jisho_content");
    JishoContent = results.jisho_content;
}
async function DeleteAll()
{
    JishoContent = [];

    var jisho_content = JishoContent;
    await browser.storage.sync.set({jisho_content});

    PopulateForm();

}
async function Delete(ev)
{
    var position = ev.target.getAttribute("position");
    JishoContent.splice(position, 1);

    var jisho_content = JishoContent;
    await browser.storage.sync.set({jisho_content});

    PopulateForm();
}
async function PopulateForm()
{
    var content = document.getElementById('content');

    content.innerHTML = "";

    await UpdateJishoContent();


    if(JishoContent.length == 0)
    {
        var element = document.createElement('div');
        element.innerText = `Empty registry.`;
        content.append(element);
        return;
    }

    for(var i = 0; i < JishoContent.length; i++)
    {
        var kword = JishoContent[i].kword;
        var hword = JishoContent[i].hword;

        var element = document.createElement('div');

        var button = document.createElement('button');
        button.classList.add('delete');
        button.setAttribute("position", i);
        button.onclick = Delete;

        element.innerText = `${kword} - ${hword}   `;
        element.append(button);

        content.append(element);
    }

}
function startup() {
    var dropdown = document.querySelector('.dropdown');
    var dropdownmenu = document.querySelector('.dropdown-menu');
    //dropdown.addEventListener('click', function(event) {
    dropdown.addEventListener('click', function(event) {
        event.stopPropagation();
        dropdown.classList.toggle('is-active');
    });
    document.body.addEventListener('click', function(event) {
        if(event.target != dropdown && event.target != dropdownmenu)
        {
            dropdown.classList.remove('is-active');
            event.stopPropagation();
        }
    });

    var jsonclick = document.getElementById('jsonclick');
    var txtclick = document.getElementById('txtclick');
    var ameclick = document.getElementById('ameclick');
    var deleteall = document.getElementById('deleteall');

    jsonclick.onclick = HandleJson;
    ameclick.onclick = HandleAme;
    txtclick.onclick = HandleTXT;
    deleteall.onclick = DeleteAll;

    PopulateForm();
}

window.onload = startup()
