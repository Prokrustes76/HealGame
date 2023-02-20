function rect(x, y, w, h, col) {
    ctx.fillStyle = col
    ctx.fillRect(x, y, w, h)
}

function write(text, x, y, size, col, align='center', makeBox) {
    ctx.font = `${size}px Arial`
    ctx.textAlign = align

    if (makeBox){
        let w = ctx.measureText(text).width
        rect(488 - w/2, 700, w + 24, 75, '#111')
    }
    ctx.fillStyle = col
    ctx.fillText(text, x, y)
}

function rand(min = .9, max = 1.1) {
    return Math.random() * (max - min) + min
}