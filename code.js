let pageblur = 0;

function blurpage() {
    pageblur += 0.5;

    document.body.style.filter = `blur(${pageblur}px)`;
    document.body.style.backdropFilter = `blur(${pageblur}px)`;
}