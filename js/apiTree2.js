function ApiNode(name) {
    this.x = 0;
    this.y = 0;
    this.fillColor = '#EE82EE';
    this.radius = 30;
    this.name = name;
    this.height = 12;
    this.lineWidth = 2;
    this.refCount = 0;
    this.children = [];
}


const drawUtil = {
    quadraticCurve: function (context, p0, p1, p2) {
        context.beginPath();
        context.strokeStyle = "#333333";
        context.moveTo(p0.x, p0.y);
        context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        context.stroke();
        context.closePath();
    },
    bezierCurve: function (context, p0, p1, p2, p3) {
        context.beginPath();
        context.strokeStyle = "#333333";
        context.moveTo(p0.x, p0.y);
        context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        context.stroke();
        context.closePath();
    },
    triangle: function (context, p, height) {
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(p.x - 0.886 * height, p.y + height);
        context.lineTo(p.x + 0.886 * height, p.y + height);
        context.fillStyle = '#333333';
        context.fill();
        context.closePath();
    },
    text: function (context, p, text, width) {
        context.beginPath();
        context.font = "bold 12px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#333333";
        context.fillText(text, p.x, p.y, width);
        context.closePath();
    },
    circleAndStroke: function (context, p, radius, fillColor, lineWidth) {
        context.beginPath();
        context.strokeStyle = "#8efcff";
        context.lineWidth = lineWidth;
        context.fillStyle = fillColor;
        context.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        context.closePath();
    }

};

Object.assign(ApiNode.prototype, {
    update: function () {

    },
    render: function (context) {
        drawUtil.circleAndStroke(context, {x: this.x, y: this.y}, this.radius, this.fillColor, this.lineWidth);
        drawUtil.text(context, {x: this.x, y: this.y}, this.name, this.radius * 2);
        /*let p = {
            x: this.x,
            y: this.y + this.radius + this.lineWidth / 2
        };
        drawUtil.triangle(context, p, this.height);
        p = {
            x: p.x,
            y: p.y + this.height
        };
        // console.log(p);
        drawUtil.bezierCurve(context, p, {x: p.x, y: p.y + 50}, {x: p.x - 200, y: p.y}, {
            x: p.x - 200,
            y: p.y + 50
        });*/

    }
});

function ApiTree(mapNode, context) {
    this.mapNode = mapNode;
    this.context = context;
    this.top = 80;
    this.curveHeight = 50;
    this.triangleHeight = 12;
    this.freeNodes = [];
    this.canvasWidth = 800;
}


ApiTree.prototype.getLayerHeight = function (node) {
    return node.radius + node.lineWidth + this.triangleHeight + this.curveHeight;
};

/**
 * 获取layer
 * @param node
 * @param currentLayer
 * @returns {*}
 */
ApiTree.prototype.getLayerNum = function (node, currentLayer = 1) {
    node = node.extend;
    if (node) {
        if (currentLayer === 1) {
            //引用计数
            node.refCount = node.refCount + 1;
        }
        return this.getLayerNum(node, currentLayer + 1);
    } else {
        return currentLayer;
    }
};

ApiTree.prototype.getFixedHeight = function (node) {
    return node.radius + node.lineWidth + this.top;
};

ApiTree.prototype.initTree = function () {
    for (let node of this.mapNode.values()) {
        let layerNum = this.getLayerNum(node);
        let index = layerNum - 1;
        if (!this.freeNodes[index]) {
            node.layer = layerNum;
            this.freeNodes[index] = []
        }
        this.freeNodes[index].push(node);
    }
};

ApiTree.prototype.initPosition = function () {
    this.initTree();
    let layerHeight = 0;
    let layerTop = 0;
    if (this.freeNodes[0] && this.freeNodes[0][0]) {
        layerTop = this.getFixedHeight(this.freeNodes[0][0]);
        layerHeight = this.getLayerHeight(this.freeNodes[0][0]);
    }
    let lastLayerLength = 0;
    for (let i = 0; i < this.freeNodes.length; i++) {
        console.log(this.freeNodes);
        let layer = this.freeNodes[i];
        let x = this.canvasWidth / (layer.length + 1);
        let y = layerTop + i * layerHeight;
        // console.log(x, y);
        for (let j = 0; j < layer.length; j++) {
            let node = layer[j];
            node.x = x + x * j;
            node.y = y;
            if (i !== 0) {
                let parentNode = node.extend;
                console.log(j);
                if (layer.length === 1) {
                    node.x = parentNode.x;
                    console.log(node.x);
                } else if (lastLayerLength !== 1) {
                    //    上一层和本层节点数都不是为一,先计算父级所占区域
                    let range = this.canvasWidth / lastLayerLength;
                    let start = parentNode.x - range / 2;


                    node.x = parentNode.x

                } else {
                    console.log(layer.length)
                }
            }

        }
        lastLayerLength = layer.length;
    }
};


ApiTree.prototype.render = function () {
    this.initPosition();
    for (let i = 0; i < this.freeNodes.length; i++) {
        let layer = this.freeNodes[i];
        for (let j = 0; j < layer.length; j++) {
            let node = layer[j];
            node.render(this.context);
        }
    }
};

const context = document.querySelector("#myCanvas").getContext("2d");

let node1 = new ApiNode("Node");
let node2 = new ApiNode("Element");
let node3 = new ApiNode("Document");
let node4 = new ApiNode("HTML");
node2.extend = node1;
node3.extend = node1;
node4.extend = node2;
const mapNode = new Map();
mapNode.set('node1', node1);
mapNode.set('node2', node2);
mapNode.set('node3', node3);
mapNode.set('node4', node4);

const apiTree = new ApiTree(mapNode, context);

apiTree.render();
// node1.render(context);


