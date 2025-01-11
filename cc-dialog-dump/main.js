// Removes spaces automatically inserted by browsers between the spans of a langlabel.
// I hate relying on JS for this, but blame browsers for not supporting
// white-space-collapse: discard;
for(let element of document.getElementsByClassName("text-langlabel")) {
    element.innerHTML = element.innerHTML.replaceAll(/(?<=<\/span>)\s+(?=<span)/g, "")
    console.log(element.innerHTML)
}