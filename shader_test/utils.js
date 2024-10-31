
export function loadElement(tag)
{
    var element=document.querySelector("#"+tag);
    if (!element) {
        throw new Error('Unable to find element with id: ' + tag);
    }
    return element;
}