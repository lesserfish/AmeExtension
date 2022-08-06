function startup() {

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
            InsertHtml(element);
        }
    }
    if(concepts)
    {
        var elements = concepts.getElementsByClassName('concept_light');
        for(let i = 0; i < elements.length; i++)
        {
            var element = elements[i];
            InsertHtml(element);
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
function AddLink(element, content)
{
    var status = element.getElementsByClassName('concept_light-status')[0];
    if(!status){
        return null;
    }
    
    var kword = content.kword;
    var hword = content.hword;

    var element = `<a class="concept_light-status_link helper" kword='${kword}' hword='${hword}')">Add to Memory</a>`

    status.insertAdjacentHTML('beforeend', element);
}
function RegisterEvents(){
    var elements = document.getElementsByClassName('helper');

    for(let i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        element.addEventListener('click', Register);
    }
}
async function Register (e){
    var target = e.target;
    var kword = target.getAttribute('kword');
    var hword = target.getAttribute('hword');
    
    var jisho_content = [];

    var load = await browser.storage.local.get("jisho_content");

    if(load.jisho_content){
        jisho_content = load.jisho_content;
    }

    var word = {
      kword: kword,
      hword: hword,
    }
    jisho_content.push(word);

// store the objects
    await browser.storage.local.set({jisho_content});
//var results = await browser.storage.local.get("jisho_content");
}
function InsertHtml(element)
{
    var wrapper = element.getElementsByClassName("concept_light-wrapper")[0];
    if(!wrapper){
        return;
    }

    var info = GetInfo(wrapper);

    AddLink(wrapper, info);
}
window.onload = startup()
