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
    bezierCurve: function (context, p0, p1) {
        if (!context) {
            return;
        }
        context.beginPath();
        context.strokeStyle = "#333333";
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
        context.beginPath();
        context.font = "12px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#333333";
        context.fillText(text, p.x, p.y, width);
        context.closePath();
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

function ApiNode(name, apiTree, isRoot = false) {
    this.id = ++nodeId;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.fillColor = '#EE82EE';
    this.radius = 30;
    this.name = name;
    this.apiTree = apiTree;
    this.lineWidth = 2;
    this.children = [];
    this.isConnected = isRoot;
    this.parentNode = null;
    this.isDelete = false;
    this.isRoot = isRoot;
    this.initRoot();
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
    isConnectedCheck: function () {
        if (this.isConnected) {
            return true;
        } else {
            console.warn(`The node ${this.name} isn't connected and cannot operate`);
            return false;
        }
    },
    append: function (node) {
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
        this.apiTree.mountNodes.push(node);
        this.apiTree.root.computeTargetXY();
        this.apiTree.drawApiTree();
    },
    remove: function (node) {
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
    getNodeById: function (id) {
        if (this.id === id) {
            return this;
        } else {
            return this.getNodeByIdDetail(id, this.children);
        }
    },
    getNodeByIdDetail: function (id, nodes) {
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
    },
    initRoot: function () {
        if (this.isRoot) {
            this.rangeWidth = this.apiTree.canvasWidth;
            this.startX = 0;
            this.x = this.rangeWidth / 2;
            this.y = this.apiTree.top + this.radius + this.lineWidth;
            this.targetX = this.x;
            this.targetY = this.y;
            this.currentCount = 0;
        }
    },
    computeTargetXY: function () {
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
                child.targetY = this.y + this.radius * 2 + 3 * this.lineWidth / 2 + this.triangleHeight + this.layerHeight;
                child.computeTargetXY();
            }
        }
    },
    render: function (context) {
        if (this.isRoot) {
            this.currentCount++;
        }
        let currentCount = this.apiTree.root.currentCount;
        let totalCount = this.apiTree.totalCount;
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
            drawUtil.triangle(context, p, this.triangleHeight);
            //实现两边带有空格的flex布局 space-around
            let triangleHeightScale = this.triangleHeight / (length + 1);
            for (let i = 0; i < length; i++) {
                const child = children[i];

                const curveStartPoint = {
                    x: p.x - this.triangleHeight / 2 + (i + 1) * triangleHeightScale,
                    y: p.y + this.triangleHeight
                };
                const offsetX = (child.targetX - child.x) / totalCount * currentCount;
                const offsetY = (child.targetY - child.y) / totalCount * currentCount;
                const curveEndPoint = {
                    x: child.x + offsetX,
                    y: child.y + offsetY - child.radius - child.lineWidth
                };
                drawUtil.bezierCurve(context, curveStartPoint, curveEndPoint);
                child.render(context);
            }
        }
    }


});


function ApiTree9(context) {
    this.context = context;
    this.top = 60;
    this.curveHeight = 50;
    this.triangleHeight = 12;
    this.freeNodes = [];
    this.canvasWidth = 800;
    this.canvasHeight = 800;
    this.totalCount = 60;
    this.root = new ApiNode("Root", this, true);
    this.mountNodes = [this.root];
    this.render = this.render.bind(this);
    this.drawApiTree = this.drawApiTree.bind(this);
}


/**
 * 根据用户操作执行root渲染的操作
 */
ApiTree9.prototype.render = function () {
    this.root.render(this.context);
};


ApiTree9.prototype.getNodeById = function (id) {
    return this.root.getNodeById(id);
};


ApiTree9.prototype.createApiNode = function (name) {
    let apiNode = new ApiNode(name, this);
    this.freeNodes.push(apiNode);
    return apiNode;
};

ApiTree9.prototype.drawApiTree = function () {
    if (this.root.currentCount < this.totalCount) {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.render();
        requestAnimationFrame(this.drawApiTree);
    }
};

const context = document.querySelector("#myCanvas").getContext("2d");
const apiTree = new ApiTree9(context);
/*console.log(apiTree.root.id);
console.log(backupApiTree.root.id);*/

let node1 = apiTree.createApiNode("Document");
let node2 = apiTree.createApiNode("Frag");
let node3 = apiTree.createApiNode("Element");
let node4 = apiTree.createApiNode("Div");
let node5 = apiTree.createApiNode("HTML");
let node6 = apiTree.createApiNode("Span");


apiTree.root.name = "Node";
apiTree.root.append(node1);

setTimeout(() => {
    apiTree.root.append(node3);
}, 2000);
setTimeout(() => {
    node1.append(node2);
}, 4000);
setTimeout(() => {
    node3.append(node4);
}, 6000);
setTimeout(() => {
    node3.append(node5);
}, 8000);
setTimeout(() => {
    node3.append(node6);
}, 10000);