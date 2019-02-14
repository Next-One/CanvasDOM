const drawUtil = {
    quadraticCurve: function (context, p0, p1, p2) {
        context.beginPath();
        context.strokeStyle = "#333333";
        context.moveTo(p0.x, p0.y);
        context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        context.stroke();
        context.closePath();
    },
    bezierCurve: function (context, p0, p1) {
        context.beginPath();
        context.strokeStyle = "#333333";
        context.moveTo(p0.x, p0.y);
        context.bezierCurveTo(p0.x, p1.y, p1.x, p0.y, p1.x, p1.y);
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
        context.font = "12px Arial";
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


function ApiNode(name,apiTree, isConnected = false, isRoot = false) {

    this.x = 0;
    this.y = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.fillColor = '#EE82EE';
    this.radius = 30;
    this.name = name;
    this.apiTree = apiTree;
    this.lineWidth = 2;
    this.children = [];
    this.isConnected = isConnected;
    this.parentNode = null;
    this.isDelete = false;
    this.isRoot = isRoot;
    this.isMove = false;
}

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
Object.assign(ApiNode.prototype, {
    minWidth: 80,
    layerHeight: 50,
    triangleHeight: 12,
    runCount:100,
    append: function (node) {
        this.children.push(node);
        if (node.parentNode) {
            node.parentNode.children.remove(node);
        } else {
            node.isConnected = true;
        }
        node.parentNode = this;
    },
    remove: function (node) {
        if (node.parentNode === this) {
            this.children.remove(node);
            node.isConnected = false;
            node.parentNode = null;
        } else {
            console.warn(`nodeName is ${node.name} , it's parentNode is ${node.parentNode.name} and isn't ${this.name}`);
        }
    },
    delete: function (node) {
        if (node.parentNode === this) {
            this.children.remove(node);
            node.isConnected = false;
            node.parentNode = null;
            node.isDelete = true;
        } else {
            console.warn(`nodeName is ${node.name} , it's parentNode is ${node.parentNode.name} and isn't ${this.name}`);
        }
    },
    update: function () {

    },

    render: function (context) {
        if (this.isRoot) {
            this.rangeWidth = 800;
            this.top = 60;
            this.startX = 0;
            this.x = this.rangeWidth / 2;
            this.y = this.top + this.radius + this.lineWidth;
            this.targetX = this.x;
            this.targetY = this.y;
            this.speedX = 0;
            this.speedY = 0;
            this.isMove = false;
            console.log(this);
        }

        drawUtil.circleAndStroke(context, {x: this.x, y: this.y}, this.radius, this.fillColor, this.lineWidth);
        drawUtil.text(context, {x: this.x, y: this.y}, this.name, this.radius * 2);
        let children = this.children;
        let length = children.length;
        if (length) {
            let p = {
                x: this.x,
                y: this.y + this.radius + this.lineWidth / 2
            };
            drawUtil.triangle(context, p, this.triangleHeight);
            let everyChildrenWidth = Math.max(this.rangeWidth / length, this.minWidth);
            //实现两边带有空格的flex布局 space-around
            let triangleHeightScale = this.triangleHeight / (length + 1);
            for (let i = 0; i < length; i++) {
                let child = children[i];
                child.rangeWidth = everyChildrenWidth;
                child.startX = i * everyChildrenWidth;
                let curveStartPoint = {
                    x: p.x - this.triangleHeight / 2 + (i + 1) * triangleHeightScale,
                    y: p.y + this.triangleHeight
                };
                let curveEndPoint = {
                    x: child.startX + child.rangeWidth / 2,
                    y: curveStartPoint.y + this.layerHeight
                };
                child.x = curveEndPoint.x;
                child.y = curveEndPoint.y + this.radius + this.lineWidth;
                drawUtil.bezierCurve(context, curveStartPoint, curveEndPoint);
                child.render(context);
            }
        }
    }
});


function ApiTree(context) {
    this.context = context;
    this.top = 60;
    this.curveHeight = 50;
    this.triangleHeight = 12;
    this.freeNodes = [];
    this.canvasWidth = 800;
}

//定义root节点
Object.defineProperty(
    ApiTree.prototype,
    'root',
    {
        value: new ApiNode("Root", true, true),
        configurable: false,
        enumerable: false,
        writable: false
    });

//定义root备份节点，用于实现dom树对比
Object.defineProperty(
    ApiTree.prototype,
    'backupRoot',
    {
        value: new ApiNode("BackupRoot", true, true),
        configurable: false,
        enumerable: false,
        writable: false
    });

ApiTree.prototype.render = function (context) {
    /*for (let i = 0; i < this.freeNodes.length; i++) {
        let layer = this.freeNodes[i];
        for (let j = 0; j < layer.length; j++) {
            let node = layer[j];
            node.render(this.context);
        }
    }*/

    this.root.render(context);
};

ApiTree.prototype.createApiNode = function (name) {
    let apiNode = new ApiNode(name,this);
    this.freeNodes.push(apiNode);
    return apiNode;
};

const context = document.querySelector("#myCanvas").getContext("2d");
const apiTree = new ApiTree();

let node1 = apiTree.createApiNode("Div");
let node2 = apiTree.createApiNode("Element");
let node3 = apiTree.createApiNode("Document");
let node4 = apiTree.createApiNode("HTML");

node2.append(node1);
node2.append(node4);
apiTree.root.name = "Node";
apiTree.root.apiTree = apiTree;
apiTree.backupRoot.apiTree = apiTree;
apiTree.root.append(node2);
apiTree.root.append(node3);
apiTree.render(context);
// node1.render(context);


