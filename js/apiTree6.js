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
    APPEND: Symbol("APPEND")
};

let nodeId = 1;

function ApiNode(name, apiTree, isRoot = false) {
    this.id = ++nodeId;
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
    runCount: 100,
    isConnectedCheck: function () {
        if (this.isConnected) {
            return true;
        } else {
            console.warn(`The node ${this.name} isn't connected and cannot operate`);
            return false;
        }
    },
    //没有context，表示是操作节点，需要发消息通知渲染节点
    isSendAction: function () {
        return !this.apiTree.context;
    },
    append: function (node,apiRootTree) {debugger;
        if (!this.isConnectedCheck()) {
            return;
        }
        this.children.push(node);
        if (this.isSendAction()) {
            this.apiTree.actions.push({
                id: this.id,
                type: OperationTypes.APPEND
            });
            this.apiTree.reconcile(apiRootTree);
        }
        if (node.parentNode) {
            node.parentNode.children.remove(node);
        } else {
            node.isConnected = true;
        }
        node.parentNode = this;
    },
    cloneNode: function (deep = true) {
        const node = this.apiTree.createApiNode(this.name, this.apiTree);
        for (let key of Object.keys(node)) {
            switch (key) {
                case 'name':
                case 'apiTree': {
                    break;
                }
                case 'children': {
                    node.children = [];
                    break;
                }
                case 'parentNode': {
                    break;
                }
                default: {
                    node[key] = this[key];
                }
            }
        }
        return node;
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
    update: function () {

    },
    initRoot: function () {
        if (this.isRoot) {
            this.rangeWidth = this.apiTree.canvasWidth;
            this.startX = 0;
            this.x = this.rangeWidth / 2;
            this.y = this.apiTree.top + this.radius + this.lineWidth;
            console.log(this);
        }
    },
    renderNoAnimation: function (context) {
        drawUtil.circleAndStroke(context, {x: this.x, y: this.y}, this.radius, this.fillColor, this.lineWidth);
        drawUtil.text(context, {x: this.x, y: this.y}, this.name, this.radius * 2);
        const children = this.children;
        const length = children.length;
        //是否有子节点需要渲染
        if (length !== 0) {
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
    },
    renderAnimation: function (context) {
        let x = this.x + this.speedX;
        let y = this.y + this.speedY;
        if (   (this.speedX < 0 && x <= this.targetX)
            || (this.speedX > 0 && x >= this.targetX)
            || (this.speedY < 0 && y <= this.targetY)
            || (this.speedY > 0 && y >= this.targetY)) {
            y = this.targetY;
            x = this.targetX;
            this.speedX = 0;
            this.speedY = 0;
            this.isMove = false;
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
    },

    /**
     * 如果context存储就会渲染，否则仅仅执行计算操作
     * @param context 绘画上下文
     */
    render: function (context) {
        this.initRoot();
        if(this.isMove){
            this.renderAnimation(context);
        }else{
            this.renderNoAnimation(context);
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
    this.root = new ApiNode("Root", this, true);
    this.actions = [];
}


/**
 * 根据用户操作执行root渲染的操作
 */
ApiTree.prototype.render = function () {
    this.root.render(this.context);
};


ApiTree.prototype.getNodeById = function (id) {
    return this.root.getNodeById(id);
};


ApiTree.prototype.reconcile = function (apiTree) {
    if (this.actions.length === 0) {
        return;
    }
    const action = this.actions.shift();
    const id = action.id;
    this.render();
    switch (action.type) {
        case OperationTypes.APPEND: {
            const nowNode = this.getNodeById(id);
            const length = nowNode.children.length;
            if (length === 0) {
                break;
            }
            const prevNode = apiTree.getNodeById(id);
            //新加节点与父节点位置重合,然后做动画效果
            const newCloneNode = nowNode.children[length - 1].cloneNode();
            newCloneNode.x = prevNode.x;
            newCloneNode.y = prevNode.y;
            prevNode.append(newCloneNode);
            //根据对应节点，开始结束xy，以及动画规定次数，计算动画速度
            for (let i = 0; i < length; i++) {
                let prevNodeChild = prevNode.children[i];
                let x = nowNode.children[i].x;
                let y = nowNode.children[i].y;
                prevNodeChild.targetX = x;
                prevNodeChild.targetY = y;
                prevNodeChild.speedX = (x - prevNodeChild.x) / prevNode.runCount;
                prevNodeChild.speedY = (y - prevNodeChild.y) / prevNode.runCount;
                prevNodeChild.isMove = true;
            }
            // context.clearRect(0,0,Bubble.prototype.width,Bubble.prototype.height );
            apiTree.rafId = requestAnimationFrame(apiTree.render.bind(apiTree));
            break;
        }
        default: {

        }
    }


};

ApiTree.prototype.createApiNode = function (name) {
    let apiNode = new ApiNode(name, this);
    this.freeNodes.push(apiNode);
    return apiNode;
};

const context = document.querySelector("#myCanvas").getContext("2d");
const apiTree = new ApiTree(context);
const backupApiTree = new ApiTree();
backupApiTree.root.id = apiTree.root.id;
/*console.log(apiTree.root.id);
console.log(backupApiTree.root.id);*/

let node2 = backupApiTree.createApiNode("Element");
let node3 = backupApiTree.createApiNode("Document");
/*let node1 = backupApiTree.createApiNode("Div");
let node4 = backupApiTree.createApiNode("HTML");
let node5 = backupApiTree.createApiNode("Frag");
let node6 = backupApiTree.createApiNode("Span");*/

/*node2.append(node1);
node2.append(node4);
node3.append(node5);
node4.append(node6);*/
apiTree.root.name = "Node";
backupApiTree.root.append(node3,apiTree);

setTimeout(() => {
    backupApiTree.root.append(node2,apiTree);
},10000);
// backupApiTree.root.append(node3);
// apiTree.render();
// node1.render(context);
// console.log(apiTree.root);


