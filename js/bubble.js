function Bubble(x, y, speedX, speedY, radius, rgb, a, speedA, speedRB, speedRS) {
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.radius = radius;
    this.sRadius = radius;
    this.rgb = rgb;
    this.a = a;
    this.sA = a;
    this.clicked = false;
    this.maxR = 80;
    this.vanish = true;
    this.speedA = speedA;
    this.speedRB = speedRB;
    this.speedRS = speedRS;
}

Bubble.prototype.update = function () {
    if (!this.clicked) {
        var speedX = this.speedX,
            speedY = this.speedY;
        if (this.y - this.radius <= 0) {
            speedY = Math.abs(speedY);
        }
        if (this.y + this.radius >= this.height) {
            speedY = -Math.abs(speedY);
        }
        if (this.x - this.radius <= 0) {
            speedX = Math.abs(speedX);
        }
        if (this.x + this.radius >= this.width) {
            speedX = -Math.abs(speedX);
        }
        this.speedY = speedY;
        this.speedX = speedX;
        this.y += speedY;
        this.x += speedX;
    } else {
        var r = this.radius,
            a = this.a;
        if (this.vanish) {
            r += this.speedRB;
            a -= this.speedA;
            if (r >= this.maxR || a <= 0) {
                this.vanish = false;
                r = 0;
                a = 0;
            }
        } else {
            r += this.speedRS;
            a += this.speedA;
            if (r >= this.sRadius || a >= this.sA) {
                r = this.sRadius;
                a = this.sA;
                this.vanish = true;
                this.clicked = false;
            }
        }
        this.radius = r;
        this.a = a;
    }
};

Bubble.prototype.render = function (context) {
    context.beginPath();
    context.fillStyle = "rgba(" + this.rgb + "," + this.a + ")";
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    context.fill();

};
const bubbleConfig = {
    num: 20,
    maxRadius: 30,
    minRadius: 25,
    minYVelocity: .5,
    minXVelocity: 1,
    maxYVelocity: 1.5,
    maxXVelocity: 2.5
};
const canvasNode=document.querySelector("#myCanvas");
function init() {
    var i, bubble, R, G, B, A, sx, sy,
        bubbles = [],
        bubblesNum = bubbleConfig.num,
        maxRadius = bubbleConfig.maxRadius,
        minRadius = bubbleConfig.minRadius,
        minYVelocity = bubbleConfig.minYVelocity,
        minXVelocity = bubbleConfig.minXVelocity,
        maxYVelocity = bubbleConfig.maxYVelocity,
        maxXVelocity = bubbleConfig.maxXVelocity;

    const w =window.innerWidth, h = window.innerHeight;
    setSize();
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (i = 0; i < bubblesNum; i++) {
        bubble = new Bubble();
        R = randomInRange(0, 150);
        G = randomInRange(150, 255);
        B = 255;
        A = randomInRange(.6, .9);
        bubble.radius = randomInRange(minRadius, maxRadius);
        bubble.x = randomInRange(bubble.radius, w - bubble.radius);
        bubble.y = randomInRange(bubble.radius, h - bubble.radius);
        sx = randomInRange(minXVelocity, maxXVelocity);
        sy = randomInRange(minYVelocity, maxYVelocity);
        bubble.speedX = Math.random() > 0.5 ? sx : -sx;
        bubble.speedY = Math.random() > 0.5 ? sy : -sy;
        bubble.rgb = R + ',' + G + ',' + B;
        bubble.a = A;
        bubble.sA = A;
        bubble.sRadius = bubble.radius;
        bubble.speedA = A / 240;
        bubble.speedRB = (100 - bubble.radius) / 240;
        bubble.speedRS = bubble.radius / 240;
        bubbles.push(bubble);
    }
    return bubbles;
}

const bubbles = init(),context = canvasNode.getContext("2d");
function drawBubbles() {
    context.clearRect(0,0,Bubble.prototype.width,Bubble.prototype.height );
    for (var i = 0; i < bubbles.length; i++) {
        bubbles[i].update();
        bubbles[i].render(context);
    }
    requestAnimationFrame(drawBubbles);
}

drawBubbles();

function setSize() {
    const width =window.innerWidth, height = window.innerHeight;
    canvasNode.width = width;
    canvasNode.height = height;
    Bubble.prototype.height = height;
    Bubble.prototype.width = width;
}

window.addEventListener('resize', setSize);