function genRandom(start, end) {
    return start + Math.round(Math.random() * (end - start));
}

function dataProvider(func, data) {
    return eventData => func(data, eventData);
}

function calcDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function calcNewRadius(r1, r2) {
    const area1 = Math.pow(r1, 2) * Math.PI;
    const area2 = Math.pow(r2, 2) * Math.PI;
    const newArea = area1 + area2;
    return +Math.sqrt(newArea / Math.PI).toFixed(2);
}

module.exports = { genRandom, dataProvider, calcDistance, calcNewRadius };
