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


class Curve {
    constructor(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;
        this.targetP0 = p0;
        this.targetP1 = p1;
    }

    computeTargetXY(nextP0, nextP1) {
        this.targetP0 = nextP0;
        this.targetP1 = nextP1;
    }

    render(context) {
        drawUtil.bezierCurve(context, this.p0, this.p1);
    }
}

class DomNode {
    constructor(name, domTree, isRoot = false) {
        this.id = nodeId++;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.fillColor = '#EE82EE';
        this.radius = 30;
        this.name = name;
        this.domTree = domTree;
        this.lineWidth = 2;
        this.children = [];
        this.isConnected = isRoot;
        this.parentNode = null;
        this.isDelete = false;
        this.isRoot = isRoot;
        this.minWidth = 80;
        this.initRoot();
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
        node.x = this.x;
        node.y = this.y;
        this.domTree.mountNodes.push(node);
        this.domTree.root.computeTargetXY();
        this.domTree.drawDomTree();
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
        if (this.isRoot) {
            this.rangeWidth = parseInt(this.domTree.context.canvas.style.width);
            // console.log(this.domTree.context.canvas);
            this.startX = 0;
            this.x = this.rangeWidth / 2;
            this.y = this.domTree.top + this.radius + this.lineWidth;
            this.targetX = this.x;
            this.targetY = this.y;
            this.currentCount = 0;
        }
    }

    computeTargetXY() {
        this.initRoot();
        // this.isFinishAnimation = false;
        const children = this.children;
        const length = children.length;
        //是否有子节点需要渲染
        if (length !== 0) {
            let everyChildrenWidth = Math.max(this.rangeWidth / length, this.minWidth);
            //实现两边带有空格的flex布局 space-around
            for (let i = 0; i < length; i++) {
                let child = children[i];
                //确定子节点的位置
                child.rangeWidth = everyChildrenWidth;
                child.startX = i * everyChildrenWidth + this.startX;
                //确定下次的运动目标
                child.targetX = child.startX + child.rangeWidth / 2;
                child.targetY = this.y + this.radius * 2 + 3 * this.lineWidth / 2 + this.domTree.triangleHeight + this.domTree.layerHeight;
                child.computeTargetXY();
            }
        }
    }

    render(context) {
        if (this.isRoot) {
            this.currentCount++;
        }
        let currentCount = this.domTree.root.currentCount;
        let totalCount = this.domTree.totalCount;
        let offsetX = (this.targetX - this.x) / totalCount * currentCount;
        let offsetY = (this.targetY - this.y) / totalCount * currentCount;
        let x = this.x + offsetX;
        let y = this.y + offsetY;
        if (currentCount >= totalCount) {
            x = this.targetX;
            y = this.targetY;
            this.x = x;
            this.y = y;
        }
        drawUtil.circleAndStroke(context, {x: x, y: y}, this.radius, this.fillColor, this.lineWidth);
        drawUtil.text(context, {x: x, y: y}, this.name, this.radius * 2);
        const children = this.children;
        const length = children.length;
        //是否有子节点需要渲染
        if (length !== 0) {
            const p = {
                x: x,
                y: y + this.radius + this.lineWidth / 2
            };
            drawUtil.triangle(context, p, this.domTree.triangleHeight);
            //实现两边带有空格的flex布局 space-around
            const triangleHeightScale = this.domTree.triangleHeight / (length + 1);
            for (let i = 0; i < length; i++) {
                const child = children[i];

                const curveStartPoint = {
                    x: p.x - this.domTree.triangleHeight / 2 + (i + 1) * triangleHeightScale,
                    y: p.y + this.domTree.triangleHeight
                };
                const offsetX = (child.targetX - child.x) / totalCount * currentCount;
                const offsetY = (child.targetY - child.y) / totalCount * currentCount;
                const curveEndPoint = {
                    x: child.x + offsetX,
                    y: child.y + offsetY - child.radius - child.lineWidth
                };
                drawUtil.bezierCurve(context, curveStartPoint, curveEndPoint, this.lineWidth);
                child.render(context);
            }
        }
    }
}

class DomTree {
    constructor(div) {
        this.context = DomTree.createContext(div);
        this.top = 60;
        this.layerHeight = 50;
        this.triangleHeight = 12;
        this.freeNodes = [];
        this.totalCount = 60;
        this.root = new DomNode("Root", this, true);
        this.mountNodes = [this.root];
        this.render = this.render.bind(this);
        this.drawDomTree = this.drawDomTree.bind(this);
    }


    /**
     * 根据用户操作执行root渲染的操作
     */
    render() {
        this.root.render(this.context);
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
        if (this.root.currentCount < this.totalCount) {
            this.context.clearRect(0, 0, parseInt(this.context.canvas.style.width), parseInt(this.context.canvas.style.height));
            this.render();
            requestAnimationFrame(this.drawDomTree);
        }
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

