var MAX_SEG_SIZE = 8000
var Dictionary = []

async function PushSegment(segment, segcount){
    var segname = "seg_" + segcount.toString();
    var map = {}
    map[segname] = segment
    await browser.storage.sync.set(map);
}
function ElementAsString(element)
{
    var output = element['k'] + ":" + element['h'];
    return output;
}

function ElementAsString(element)
{
    var output = element['k'] + ":" + element['h'];
    return output;
}

function ByteSize(str)
{
    return (new TextEncoder().encode(str)).length;
}
function AppendSegment(segment) {
    var elements = segment.split('\n');
    for(var i = 0; i < elements.length; i++)
    {
        element = elements[i];
        if(element.length == 0){
            continue
        }
        var k = "";
        var h = "";
        var components = element.split(':');
        k = components[0];
        if(components.length > 1){
            h = components[1];
        }
        var word = {
            k: k,
            h: h,
        }
        Dictionary.push(word)
    }
}
async function LoadDictionary() {
    Dictionary = []
    var promise = browser.storage.sync.get();
    promise.then( 
        async function(storage) {
            if("segcount" in storage){
                for(var i = 1; i <= storage['segcount']; i++)
                {
                    var segname = "seg_" + i.toString();
                    if(!segname in storage)
                    {
                        console.error("CRITICAL ERROR: Attempted to get non-existent segment");
                    }
                    AppendSegment(storage[segname])

                }
            } else {
                SaveDictionary();
            }
        },
        async function(e) {
            console.error("Error: " + e);
        });
    return await promise
}
async function SaveDictionary() {
    var segcount = 1
    var current_segment = ""
    for(var i = 0; i < Dictionary.length; i++)
    {
        var element = ElementAsString(Dictionary[i])
        if(ByteSize(current_segment) + ByteSize("\n") + ByteSize(element) > MAX_SEG_SIZE)
        {
            PushSegment(current_segment, segcount);
            current_segment = element;
            segcount += 1;
        } else {
            if(current_segment.length == 0){
                current_segment = element;
            } else {
                current_segment = current_segment + "\n" + element;
            }
        }
    }
    PushSegment(current_segment, segcount);
    await browser.storage.sync.set({segcount: segcount})
}

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
    var content = JSON.stringify(Dictionary);
    Download("vocabulary.json", content);
}
async function AddInput(ev) {
    var inputform = document.getElementById('custom_input');
    var text = inputform.value;
    console.log(text);
    AppendSegment(text);
    await SaveDictionary();
    await PopulateForm();
}
function HandleTXT(ev)
{
    var content = "";
    for(var i = 0; i < Dictionary.length; i++)
    {
        var kword = Dictionary[i].k;
        var hword = Dictionary[i].h;

        content = content + kword + ":" + hword + "\n";
    }
    Download("vocabulary.txt", content);
}
function HandleAme(ev)
{
    var template = ["@{kanjiword} @{CSS}","@{kanaword}<br>@{sense}<br>@{audio}<br><br>@{example}@{CSS}"];
    var tag = "AmeExtension";
    var TemplateForm = {"Fields" : template, "Tag" : tag};

    var InputForm = [];

    for(var i = 0; i < Dictionary.length; i++)
    {
        var kword = Dictionary[i].k;
        var hword = Dictionary[i].h;

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
async function DeleteAll()
{
    Dictionary = [];

    SaveDictionary();
    PopulateForm();

}
async function Delete(ev)
{
    var position = ev.target.getAttribute("position");
    Dictionary.splice(position, 1);
    SaveDictionary();
    PopulateForm();
}
async function PopulateForm()
{
    var content = document.getElementById('content');

    content.innerHTML = "";

    await LoadDictionary();

    console.log("Dict: ", Dictionary)
    console.log("Dict Size: ", Dictionary.length)

    if(Dictionary.length == 0)
    {
        var element = document.createElement('div');
        element.innerText = `Empty registry.`;
        content.append(element);
        return;
    }

    for(var i = 0; i < Dictionary.length; i++)
    {
        var k = Dictionary[i].k;
        var h = Dictionary[i].h;

        var element = document.createElement('div');

        var button = document.createElement('button');
        button.classList.add('delete');
        button.setAttribute("position", i);
        button.onclick = Delete;

        element.innerText = `${k} - ${h}   `;
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
    var inputform = document.getElementById('custom_input');
    var btninput = document.getElementById('btn_input');
    
    jsonclick.onclick = HandleJson;
    ameclick.onclick = HandleAme;
    txtclick.onclick = HandleTXT;
    deleteall.onclick = DeleteAll;
    btninput.onclick = AddInput;
    
    inputform.addEventListener("keypress", function(event) {
        if(event.key === "Enter") {
            event.preventDefault();
            btninput.click()
        }
    }); 

    PopulateForm();
}

window.onload = startup()
