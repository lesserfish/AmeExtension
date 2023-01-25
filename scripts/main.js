var MAX_SEG_SIZE = 8000
var Dictionary = []

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
async function startup() {


    await LoadDictionary()

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
    element.setAttribute("k", kword);
    element.setAttribute("h", hword);

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
async function IsOnStorage(k, h){
    console.log(Dictionary)
    for(var i = 0; i < Dictionary.length; i++){
        var current_word = Dictionary[i]
        if(current_word['k'] == k && current_word['h'] == h)
        {
            return true
        }
    }
    return false

}
async function Register (e){
    var target = e.target;
    var k = target.getAttribute('k');
    var h = target.getAttribute('h');
    var on_storage = target.getAttribute('on_storage');
    
    if(on_storage == 0){
        var word = {
          k: k,
          h: h,
        }
        Dictionary.push(word);
        
        target.setAttribute("on_storage", 1);
        target.innerText = "Remove from Registry";
        
        await SaveDictionary()
    } else {
        var NewDictionary = []
        for(var i = 0; i < Dictionary.length; i++){
            var current_word = Dictionary[i]
            if(current_word.k != k || current_word.h != h)
            {
                NewDictionary.push(current_word);
            }
        }
        Dictionary = NewDictionary;

        target.setAttribute("on_storage", 0);
        target.innerText = "Add to Registry";

        await SaveDictionary();
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
