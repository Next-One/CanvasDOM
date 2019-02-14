const drawUtil = {
    quadraticCurve: function (context, p0, p1, p2) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#333333";
        context.moveTo(p0.x, p0.y);
        context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        context.stroke();
        context.closePath();
    },
    bezierCurve: function (context, p0, p1, lineWidth) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#333333";
        context.lineWidth = lineWidth;
        context.moveTo(p0.x, p0.y);
        context.bezierCurveTo(p0.x, p1.y, p1.x, p0.y, p1.x, p1.y);
        context.stroke();
        context.closePath();
    },

    triangle: function (context, p, height) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(p.x - 0.886 * height, p.y + height);
        context.lineTo(p.x + 0.886 * height, p.y + height);
        context.fillStyle = '#333333';
        context.fill();
        context.closePath();
    },
    text: function (context, p, text, width) {
        if (!context) {
            return;
        }
        context.save();
        context.font = "12px Monaco, Courier, font-monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.strokeText(text, p.x, p.y, width);
        context.save();
    },
    circleAndStroke: function (context, p, radius, fillColor, lineWidth) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#ffffff";
        context.lineWidth = lineWidth;
        context.fillStyle = fillColor;
        context.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        context.closePath();
    }
};

const OperationTypes = {
    APPEND: Symbol("APPEND")
};

let nodeId = 1;

Array.prototype.indexOf = function (val) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === val) return i;
    }
    return -1;
};

Array.prototype.remove = function (val) {
    let index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};


class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.speedX = 0;
        this.speedY = 0;
    }

    computeTargetXY(x, y, totalCount) {
        this.targetX = x;
        this.targetY = y;
        this.speedX = (this.targetX - this.x) / totalCount;
        this.speedY = (this.targetY - this.y) / totalCount;
    }


    update() {
        if (this.isArrived()) {
            return;
        }
        let x = this.x + this.speedX;
        let y = this.y + this.speedY;
        if ((this.speedX < 0 && x <= this.targetX)
            || (this.speedX > 0 && x >= this.targetX)) {
            x = this.targetX;
            this.speedX = 0;
        }
        if ((this.speedY < 0 && y <= this.targetY)
            || (this.speedY > 0 && y >= this.targetY)) {
            y = this.targetY;
            this.speedY = 0;
        }
        this.x = x;
        this.y = y;
    }


    isArrived() {
        return this.speedY === 0 && this.speedX === 0
    }
}

class Curve {
    constructor(x1, y1, x2, y2, lineWidth = 2) {
        this.p1 = new Point(x1, y1);
        this.p2 = new Point(x2, y2);
        this.lineWidth = lineWidth;
    }

    computeTargetXY(nextX1, nextY1, nextX2, nextY2, totalCount = 100) {
        this.p1.computeTargetXY(nextX1, nextY1, totalCount);
        this.p2.computeTargetXY(nextX2, nextY2, totalCount);
    }

    update() {
        this.p1.update();
        this.p2.update();
    }

    render(context) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#333333";
        context.lineWidth = this.lineWidth;
        context.moveTo(this.p1.x, this.p1.y);
        context.bezierCurveTo(this.p1.x, this.p2.y, this.p2.x, this.p1.y, this.p2.x, this.p2.y);
        context.stroke();
        context.closePath();
    }
}

class Circle {
    constructor(x, y, radius, name = 'Circle', lineWidth = 2) {
        this.p = new Point(x, y);
        this.name = name;
        this.radius = radius;
        this.lineWidth = lineWidth;
        this.fillColor = '#FF66D2';
    }

    clone(name) {
        return new Circle(this.p.x, this.p.y, this.radius, name, this.lineWidth);
    }

    computeTargetXY(x, y, totalCount = 100) {
        this.p.computeTargetXY(x, y, totalCount);
    }

    update() {
        this.p.update();
    }

    render(context) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#ffffff";
        context.lineWidth = this.lineWidth;
        context.fillStyle = this.fillColor;
        context.arc(this.p.x, this.p.y, this.radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        context.closePath();
        context.save();
        context.font = "12px Monaco, Courier, font-monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.strokeText(this.name, this.p.x, this.p.y, this.radius * 2);
        context.restore();
    }
}

class Triangle {
    constructor(x, y, height = 12) {
        this.p = new Point(x, y);
        this.height = height;
    }

    computeTargetXY(x, y, totalCount = 100) {
        this.p.computeTargetXY(x, y, totalCount);
    }

    update() {
        this.p.update();
    }

    getBottomY() {
        return this.p.y + this.height;
    }

    render(context) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.moveTo(this.p.x, this.p.y);
        context.lineTo(this.p.x - 0.886 * this.height, this.p.y + this.height);
        context.lineTo(this.p.x + 0.886 * this.height, this.p.y + this.height);
        context.fillStyle = '#333333';
        context.fill();
        context.closePath();
    }
}

class DomNode {
    constructor(name, domTree, isRoot = false) {
        this.id = nodeId++;
        //渲染属性
        this.rangeWidth = parseInt(domTree.context.canvas.style.width);
        this.startX = 0;
        if (isRoot) {
            this.circle = new Circle(
                this.rangeWidth / 2,
                domTree.top + 32, 30, name, 2);
        }
        this.triangle = null;
        this.curve = null;
        this.minWidth = 80;
        this.layer = 0;
        //节点属性
        this.name = name;
        this.domTree = domTree;
        this.children = [];
        this.isConnected = isRoot;
        this.parentNode = null;
        this.isDelete = false;
        this.isRoot = isRoot;
    }

    x() {
        return this.circle.p.x;
    }

    y() {
        return this.circle.p.y;
    }

    p() {
        return this.circle.p;
    }

    getCurveTargetY() {
        return this.circle.p.targetY + this.circle.radius + this.circle.lineWidth / 2 + this.triangle.height;
    }


    setCircle(circle) {
        this.circle = circle;
    }

    isConnectedCheck() {
        if (this.isConnected) {
            return true;
        } else {
            console.warn(`The node ${this.name} isn't connected and cannot operate`);
            return false;
        }
    }

    appendChild(node) {
        if (!this.isConnectedCheck()) {
            return;
        }
        this.children.push(node);

        if (node.parentNode) {
            node.parentNode.children.remove(node);
        } else {
            node.isConnected = true;
        }
        node.parentNode = this;
        node.layer = node.parentNode.layer + 1;
        node.setCircle(this.circle.clone(node.name));
        if (!this.triangle) {
            this.triangle = new Triangle(this.x(),
                this.y() + this.circle.radius + this.circle.lineWidth / 2,
                this.domTree.triangleHeight);
        }
        node.curve = new Curve(this.x(), this.getTriangleY(),
            this.x(), this.getTriangleY());
        this.domTree.freeNodes.remove(node);
        this.domTree.mountNodes.push(node);
        this.domTree.computeTargetXY();
    }


    removeChild(node) {
        if (!this.isConnectedCheck()) {
            return;
        }
        if (node.parentNode === this) {
            this.children.remove(node);
            node.isConnected = false;
            node.parentNode = null;
        } else {
            console.warn(`nodeName is ${node.name} , it's parentNode is ${node.parentNode.name} and isn't ${this.name}`);
        }
    }

    removeSelf() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }


    getTriangleY() {
        return this.triangle.getBottomY();
    }


    getNextLayerY() {
        return this.getTriangleY() + this.domTree.layerHeight;
    }


    getNodeById(id) {
        if (this.id === id) {
            return this;
        } else {
            return this.getNodeByIdDetail(id, this.children);
        }
    }

    getNodeByIdDetail(id, nodes) {
        for (let node of nodes) {
            if (node.id === id) {
                return node;
            } else {
                let res = this.getNodeByIdDetail(id, node.children);
                if (res != null) {
                    return res;
                }
            }
        }
        return null;
    }

    initRoot() {
        if (!this.isRoot) {
            return;
        }
        console.log("root");
    }

    computeTargetXY() {
        if (this.isRoot) {
            return;
        }
        const length = this.parentNode.children.length;
        const currentIndex = this.parentNode.children.indexOf(this);
        if (currentIndex === -1) {
            return;
        }
        this.rangeWidth = Math.max(this.parentNode.rangeWidth / length, this.minWidth);
        this.startX = currentIndex * this.rangeWidth + this.parentNode.startX;

        const x = this.rangeWidth / 2 + this.startX;
        const y = this.parentNode.getNextLayerY() + this.circle.radius + this.circle.lineWidth;
        //次数100
        this.circle.computeTargetXY(x, y);

        if (this.children.length) {
            this.triangle.computeTargetXY(x, y + this.circle.radius + this.circle.lineWidth / 2);
        }
        // debugger;
        this.curve.computeTargetXY(
            this.parentNode.circle.p.targetX,
            this.parentNode.getCurveTargetY(),
            x,
            this.parentNode.getNextLayerY()
        );

    }

    update() {
        !this.isRoot && this.curve.update();
        this.circle.update();
        this.children.length && this.triangle.update();
    }

    render(context) {
        !this.isRoot && this.curve.render(context);
        this.circle.render(context);
        this.children.length && this.triangle.render(context);
    }
}

class DomTree {
    constructor(div) {
        this.context = DomTree.createContext(div);
        this.top = 80;
        this.totalCount = 100;
        this.layerHeight = 40;
        this.triangleHeight = 12;
        this.freeNodes = [];
        this.root = new DomNode("Root", this, true);
        this.mountNodes = [this.root];
        this.render = this.render.bind(this);
        this.drawDomTree = this.drawDomTree.bind(this);
    }

    computeTargetXY() {
        this.mountNodes.forEach(node => node.computeTargetXY());
    }

    update() {
        this.mountNodes.forEach(node => {
            if (!node.isRoot) {
                node.update()
            }
        });
    }

    render() {
        this.mountNodes.forEach(node => node.render(this.context));
    }


    getNodeById(id) {
        return this.root.getNodeById(id);
    }


    createDomNode(name) {
        let domNode = new DomNode(name, this);
        this.freeNodes.push(domNode);
        return domNode;
    }

    drawDomTree() {
        // if (this.root.currentCount < this.totalCount) {
        this.context.clearRect(0, 0, parseInt(this.context.canvas.style.width), parseInt(this.context.canvas.style.height));
        this.update();
        this.render();
        requestAnimationFrame(this.drawDomTree);
        // }
    }

    /**
     * 根据传入的div大小，动态设置canvas大小，自适应div大小
     * @param div
     * @returns {CanvasRenderingContext2D}
     */
    static createContext(div) {
        let divRect = div.getBoundingClientRect();
        let w = divRect.width;
        let h = divRect.height;

//要将 canvas 的宽高设置成容器宽高的 2 倍
        let canvas = document.createElement("canvas");
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        div.appendChild(canvas);
        let context = canvas.getContext("2d");
        let devicePixelRatio = window.devicePixelRatio || 1,
            backingStoreRatio = context.webkitBackingStorePixelRatio || 1,
            ratio = devicePixelRatio / backingStoreRatio;
        canvas.width = w * ratio;
        canvas.height = h * ratio;
//然后将画布缩放，将图像放大两倍画到画布上
        context.scale(ratio, ratio);
        return context;
    }
}


//context.save(); //save和restore可以保证样式属性只运用于该段canvas元素


const div = document.querySelector("#canvasDiv");

function testAppendNode(div) {
    const domTree = new DomTree(div);
    domTree.drawDomTree();
    let node1 = domTree.createDomNode("Document");
    let node2 = domTree.createDomNode("Frag");
    let node3 = domTree.createDomNode("Element");
    let node4 = domTree.createDomNode("Div");
    let node5 = domTree.createDomNode("HTML");
    let node6 = domTree.createDomNode("Span");
    let node7 = domTree.createDomNode("Test");


    domTree.root.name = "Node";
    domTree.root.appendChild(node1);

    setTimeout(() => {
        domTree.root.appendChild(node3);
    }, 2000);
    setTimeout(() => {
        node1.appendChild(node2);
    }, 4000);
    setTimeout(() => {
        node3.appendChild(node4);
    }, 6000);
    setTimeout(() => {
        node3.appendChild(node5);
    }, 8000);
    setTimeout(() => {
        node3.appendChild(node6);
    }, 10000);
    setTimeout(() => {
        domTree.root.appendChild(node7);
    }, 12000);
}

testAppendNode(div);
/*let p = {x:100,y:100};
let l = 12;
context.beginPath();
context.strokeStyle = "#ff0000";
context.arc(p.x, p.y, 1.4*l, 0, 2 * Math.PI);
context.lineWidth = 2;
context.moveTo(p.x - l, p.y - l);
context.lineTo(p.x + l, p.y + l);
context.moveTo(p.x + l, p.y - l);
context.lineTo(p.x - l, p.y + l);
context.stroke();
context.closePath();*/

