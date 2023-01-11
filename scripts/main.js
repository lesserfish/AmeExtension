async function startup() {


    var primary = document.getElementById('primary');
    if(!primary){
        return;
    }

    var exact_block = primary.getElementsByClassName('exact_block')[0];
    var concepts = primary.getElementsByClassName('concepts')[0];

    if(exact_block)
    {
        var elements = exact_block.getElementsByClassName('concept_light');
        for(let i = 0; i < elements.length; i++)
        {
            var element = elements[i];
            await InsertHtml(element);
        }
    }
    if(concepts)
    {
        var elements = concepts.getElementsByClassName('concept_light');
        for(let i = 0; i < elements.length; i++)
        {
            var element = elements[i];
            await InsertHtml(element);
        }
    }

    RegisterEvents();

}
function GetInfo(element)
{
    var readings = element.getElementsByClassName('concept_light-readings')[0];
    if(!readings){
        return null;
    }
    
    var representation = readings.getElementsByClassName('concept_light-representation');
    if(!representation){
        return null;
    }
    
    var furiganaElement = readings.getElementsByClassName('furigana')[0];

    if(!furiganaElement){
        return null;
    }
    
    var furigana = [];
    var f_spans = furiganaElement.getElementsByTagName('span');
    for(let i = 0; i < f_spans.length; i++)
    {
        var content = f_spans[i].innerText;
        furigana.push(content);
    }

    var textElement = readings.getElementsByClassName('text')[0];
    
    if(!textElement){
        return null;
    }
    
    
    var text = []
    var t_spans = textElement.getElementsByTagName('span');
    for(let i = 0; i < t_spans.length; i++)
    {
        var content = t_spans[i].innerText;
        text.push(content);
    }

    var kword = textElement.innerText;
    var hword = "";

    var counter = 0;
    for(let i = 0; i < furigana.length; i++)
    {
        var f = furigana[i];
        if(f == ""){
            if(text[counter]){
                hword = hword + text[counter];
                counter += 1;
            }
        } else {
            hword += f;
        }
    }

    return {"kword" : kword, "hword" : hword};

}
async function AddLink(element, content)
{
    var status = element.getElementsByClassName('concept_light-status')[0];
    if(!status){
        return null;
    }
    
    var kword = content.kword;
    var hword = content.hword;

    // Check if work is already on jisho_content

    var isOnStorage = await IsOnStorage(kword, hword)

    var element = document.createElement('a');
    element.classList.add("concept_light-status_link");
    element.classList.add("helper");
    element.setAttribute("kword", kword);
    element.setAttribute("hword", hword);

    if(isOnStorage){
        element.setAttribute("on_storage", 1);
        element.innerText = "Remove from Registry";
    } 
    else {
        element.setAttribute("on_storage", 0);
        element.innerText = "Add to Registry";
    }

    status.appendChild(element);
}

function RegisterEvents(){
    var elements = document.getElementsByClassName('helper');

    for(let i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        element.addEventListener('click', Register);
    }
}
async function IsOnStorage(kword, hword){
    var jisho_content = [];
    var load = await browser.storage.sync.get("jisho_content");

    if(load.jisho_content){
        jisho_content = load.jisho_content;
    }

    for(var i = 0; i < jisho_content.length; i++){
        var current_word = jisho_content[i]
        if(current_word.kword == kword && current_word.hword == hword)
        {
            return true
        }
    }
    return false

}
async function Register (e){
    var target = e.target;
    var kword = target.getAttribute('kword');
    var hword = target.getAttribute('hword');
    var on_storage = target.getAttribute('on_storage');
    
    var jisho_content = [];

    var load = await browser.storage.sync.get("jisho_content");

    if(load.jisho_content){
        jisho_content = load.jisho_content;
    }

    if(on_storage == 0){
        var word = {
          kword: kword,
          hword: hword,
        }
        jisho_content.push(word);
        
        target.setAttribute("on_storage", 1);
        target.innerText = "Remove from Registry";
        
        await browser.storage.sync.set({jisho_content});
    } else {
        var updated_jisho = []
        for(var i = 0; i < jisho_content.length; i++){
            var current_word = jisho_content[i]
            if(current_word.kword != kword || current_word.hword != hword)
            {
                updated_jisho.push(current_word)
            }
        }
        jisho_content = updated_jisho

        target.setAttribute("on_storage", 0);
        target.innerText = "Add to Registry";

        await browser.storage.sync.set({jisho_content});
    }

// store the objects
//var results = await browser.storage.sync.get("jisho_content");
}
async function InsertHtml(element)
{
    var wrapper = element.getElementsByClassName("concept_light-wrapper")[0];
    if(!wrapper){
        return;
    }

    var info = GetInfo(wrapper);

    await AddLink(wrapper, info);
}
window.onload = startup()
