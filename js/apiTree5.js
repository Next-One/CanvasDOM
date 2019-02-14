const drawUtil = {
    quadraticCurve: function (context, p0, p1, p2) {
        if(!context){
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
        if(!context){
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
        if(!context){
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
        if(!context){
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
        if(!context){
            return;
        }
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

const OperationTypes = {
    APPEND:Symbol("APPEND")
};
function ApiNode(name, apiTree, isRoot = false) {

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
    this.isConnected = isRoot;
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
    runCount: 100,
    append: function (node) {
        this.children.push(node);
        if (node.parentNode) {
            node.parentNode.children.remove(node);
        } else {
            node.isConnected = true;
        }
        node.parentNode = this;
    },
    cloneNode: function (deep = true) {
        const node = this.apiTree.createApiNode(this.name,this.apiTree);
        for(let key of Object.keys(this)){
            switch (key){
                case 'name':
                case 'apiTree':{
                    break;
                }
                case 'children':{
                    break;
                }
                case 'parentNode':{
                    break;
                }
                default:{
                    node[key] = this[key];
                }
            }
        }
        return node;
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

    /**
     * 如果context存储就会渲染，否则仅仅执行计算操作
     * @param context 绘画上下文
     */
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
        const children = this.children;
        const length = children.length;
        if (length) {
            const p = {
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
                child.startX = i * everyChildrenWidth + this.startX;
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
    this.root = new ApiNode("Root", this,  true);
    this.backupRoot = new ApiNode("BackupRoot", this, true);
    this.actions = [];
}


ApiTree.prototype.render = function () {
    this.root.render(this.context);
};


/**
 * 根据用户操作执行备份root渲染的操作
 */
ApiTree.prototype.calculateTree = function () {

    this.backupRoot.render();

};


ApiTree.prototype.reconcile = function () {

};

ApiTree.prototype.createApiNode = function (name) {
    let apiNode = new ApiNode(name, this);
    this.freeNodes.push(apiNode);
    return apiNode;
};

const context = document.querySelector("#myCanvas").getContext("2d");
const apiTree = new ApiTree(context);

let node1 = apiTree.createApiNode("Div");
let node2 = apiTree.createApiNode("Element");
let node3 = apiTree.createApiNode("Document");
let node4 = apiTree.createApiNode("HTML");
let node5 = apiTree.createApiNode("Frag");
let node6 = apiTree.createApiNode("Span");

node2.append(node1);
node2.append(node4);
node3.append(node5);
node4.append(node6);

apiTree.root.name = "Node";
apiTree.root.append(node2);
apiTree.root.append(node3);
apiTree.render();
// node1.render(context);
console.log(apiTree.root);


