(function(global){
    if(!global.misohena){global.misohena = {};}
    if(!global.misohena.js_pegsolitaire){global.misohena.js_pegsolitaire = {};}
    var mypkg = global.misohena.js_pegsolitaire;


    //
    // Model
    //

    var INVALID_HOLE_ID = -1;
    var INVALID_DIR = -1;

    function BoardBase()
    {
        this.pushPeg = function(holeId){
            this.setPegExists(holeId, true);
            return this;
        };
        this.pullPeg = function(holeId){
            this.setPegExists(holeId, false);
            return this;
        };
        this.movePeg = function(fromId, toId){
            if(this.hasPeg(fromId) && this.hasEmptyHole(toId)){
                var dir = this.getDirFromToDist2(fromId, toId);
                if(dir != INVALID_DIR){
                    var nextId = this.getAdjacent(fromId, dir);
                    var nextNextId = this.getAdjacent(nextId, dir);
                    if(this.hasPeg(nextId)){
                        this.pullPeg(fromId);
                        this.pullPeg(nextId);
                        this.pushPeg(nextNextId);
                        return true;
                    }
                }
            }
            return false;
        };
        this.undoMovePeg = function(fromId, toId){
            if(this.hasEmptyHole(fromId) && this.hasPeg(toId)){
                var dir = this.getDirFromToDist2(fromId, toId);
                if(dir != INVALID_DIR){
                    var nextId = this.getAdjacent(fromId, dir);
                    var nextNextId = this.getAdjacent(nextId, dir);
                    if(this.hasEmptyHole(nextId)){
                        this.pushPeg(fromId);
                        this.pushPeg(nextId);
                        this.pullPeg(nextNextId);
                        return true;
                    }
                }
            }
            return false;
        };
        this.canMoveFrom = function(fromId){
            if(this.hasPeg(fromId)){
                for(var dir = 0; dir < this.getDirCount(); ++dir){
                    if(this.canMoveDir(fromId, dir)){
                        return true;
                    }
                }
            }
            return false;
        };
        this.canMoveFromTo = function(fromId, toId){
            if(this.hasPeg(fromId) && this.hasEmptyHole(toId)){
                return this.hasPeg(
                    this.getAdjacent(fromId,
                                     this.getDirFromToDist2(fromId, toId)));
            }
            return false;
        };
        this.canMoveDir = function(fromId, dir){
            var nextId = this.getAdjacent(fromId, dir);
            var nextNextId = this.getAdjacent(nextId, dir);
            return this.hasPeg(fromId) &&
                this.hasPeg(nextId) &&
                this.hasEmptyHole(nextNextId);
        };
        this.getDirFromTo = function(fromId, toId){
            for(var dir = 0; dir < this.getDirCount(); ++dir){
                var id = this.getAdjacent(fromId, dir);
                while(this.hasValidHole(id)){
                    if(id == toId){
                        return dir;
                    }
                    id = this.getAdjacent(id, dir);
                }
            }
            return INVALID_DIR;
        };
        this.getDirFromToDist2 = function(fromId, toId){
            if(this.hasValidHole(fromId) && this.hasValidHole(toId)){
                for(var dir = 0; dir < this.getDirCount(); ++dir){
                    var nextNextId = this.getAdjacent(this.getAdjacent(fromId, dir), dir);
                    if(nextNextId == toId){
                        return dir;
                    }
                }
            }
            return INVALID_DIR;
        };
        this.findHoleAtPosition = function(x, y, r){
            if(!r){ r = 0.5;}
            var count = this.getHoleCount();
            for(var id = 0; id < count; ++id){
                if(this.hasValidHole(id)){
                    var dx = this.getHolePositionX(id) - x;
                    var dy = this.getHolePositionY(id) - y;
                    if(dx*dx+dy*dy < r*r){
                        return id;
                    }
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getPegCount = function(){
            var holeCount = this.getHoleCount();
            var pegCount = 0;
            for(var id = 0; id < holeCount; ++id){
                if(this.hasPeg(id)){
                    ++pegCount;
                }
            }
            return pegCount;
        };
        this.isSolved = function(){
            return this.getPegCount() == 1;
        };
        this.isEnd = function(){
            var holeCount = this.getHoleCount();
            for(var id = 0; id < holeCount; ++id){
                if(this.hasPeg(id)){
                    if(this.canMoveFrom(id)){
                        return false;
                    }
                }
            }
            return true;
        };
        this.eachHole = function(fun){
            var holeCount = this.getHoleCount();
            for(var id = 0; id < holeCount; ++id){
                if(this.hasValidHole(id)){
                    fun(id);
                }
            }
        };
    }

    function GridBoardBase(holes)
    {
        BoardBase.call(this);

        // Board Interface

        this.getHoleCount = function(){
            return holes.length;
        };
        this.hasValidHole = function(holeId){
            return holes[holeId] !== undefined;
        };
        this.hasEmptyHole = function(holeId){
            return holes[holeId] === false;
        };
        this.hasPeg = function(holeId){
            return holes[holeId] === true;
        };

        this.setPegExists = function(holeId, peg){
            if(this.hasValidHole(holeId)){
                holes[holeId] = peg === true;
            }
            return this;
        };
        this.setHoleOpen = function(holeId, open){
            if(holeId >= 0 && holeId < holes.length){
                if(open){
                    holes[holeId] = false;
                }
                else{
                    holes[holeId] = undefined;
                }
            }
            return this;
        };
        this.boreHoleAll = function(){
           for(var id = 0; id < holes.length; ++id){
                this.setHoleOpen(id, true);
            }
            return this;
         };
        this.fillPegAll = function(){
            for(var id = 0; id < holes.length; ++id){
                this.setPegExists(id, true);
            }
            return this;
        };
    }

    mypkg.RectangularBoard = RectangularBoard;
    function RectangularBoard(w, h)
    {
        // ex) w=6, h=3
        // 0  1  2  3  4  5
        // 6  7  8  9  10 11
        // 12 13 14 15 16 17
        var holes = new Array(w*h);
        GridBoardBase.call(this, holes);

        // Board Interface

        this.xy = function(x, y){
            return x + y * w;
        };
        this.getAdjacent = function(holeId, dir){
            if(this.hasValidHole(holeId)){
                switch(dir){
                case 0: return toX(holeId)+1 < w ? holeId+1 : INVALID_HOLE_ID;
                case 1: return toY(holeId)+1 < h ? holeId+w : INVALID_HOLE_ID;
                case 2: return toX(holeId) > 0 ? holeId-1 : INVALID_HOLE_ID;
                case 3: return toY(holeId) > 0 ? holeId-w : INVALID_HOLE_ID;
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getDirCount = function(){
            return 4;
        };
        this.getHolePositionX = function(holeId){
            return toX(holeId);
        };
        this.getHolePositionY = function(holeId){
            return toY(holeId);
        };
        this.getBoardSizeX = function(){
            return w-1;
        };
        this.getBoardSizeY = function(){
            return h-1;
        };

        // Rectangular Only
        this.fillRect = function(rectX, rectY, rectW, rectH, state){
            if(rectW <= 0 || rectH <= 0){
                return this;
            }
            var holeId = rectX + rectY * w;
            for(var yc = rectH; yc > 0; --yc){
                for(var xc = rectW; xc > 0; --xc){
                    holes[holeId] = state;
                    ++holeId;
                }
                holeId += w - rectW;
            }
            return this;
        };

        function toX(holeId){ return holeId % w;}
        function toY(holeId){ return Math.floor(holeId / w);}
    }

    mypkg.HexGridBoard = HexGridBoard;
    function HexGridBoard(w, h)
    {
        // ex)w=4,h=3
        // 0  1  2  3
        //  4  5  6  7
        // 8  9 10 11
        RectangularBoard.call(this, w, h);

        // Board Interface
        this.getAdjacent = function(holeId, dir){
            if(this.hasValidHole(holeId)){
                var x = toX(holeId);
                var y = toY(holeId);
                switch(dir){
                case 0: return fromXY(x+1,y);
                case 1: return (y&1)==0 ? fromXY(x,y+1) : fromXY(x+1,y+1);
                case 2: return (y&1)==0 ? fromXY(x-1,y+1) : fromXY(x,y+1);
                case 3: return fromXY(x-1,y);
                case 4: return (y&1)==0 ? fromXY(x-1,y-1) : fromXY(x,y-1);
                case 5: return (y&1)==0 ? fromXY(x,y-1) : fromXY(x+1,y-1);
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getDirCount = function(){
            return 6;
        };
        this.getHolePositionX = function(holeId){
            return toX(holeId) + (toY(holeId) & 1) * 0.5;
        };
        this.getHolePositionY = function(holeId){
            return toY(holeId);
        };
        this.getBoardSizeX = function(){
            return (w-1) + (h > 1 ? 0.5 : 0);
        };
        this.getBoardSizeY = function(){
            return h-1;
        };

        //

        function fromXY(x, y){
            return (x >= 0 && y >= 0 && x < w && y < h) ? x+y*w : INVALID_HOLE_ID;
        }
        function toX(holeId){ return holeId % w;}
        function toY(holeId){ return Math.floor(holeId / w);}
    }

    mypkg.TriangularBoard = TriangularBoard;
    function TriangularBoard(size)
    {
        // ex)size=4
        //    0
        //   1 2
        //  3 4 5
        // 6 7 8 9
        var holes = new Array((size*(size+1))/2);
        GridBoardBase.call(this, holes);

        // Board Interface

        this.xy = function(x, y){
            return xyToId(x, y);
        };
        this.getAdjacent = function(holeId, dir){
            if(this.hasValidHole(holeId)){
                var pos = idToXY(holeId);
                var w = pos.y + 1;
                switch(dir){
                case 0: return pos.x+1 < w ? holeId+1 : INVALID_HOLE_ID;
                case 1: return pos.y+1 < size ? holeId+w+1 : INVALID_HOLE_ID;
                case 2: return pos.y+1 < size ? holeId+w : INVALID_HOLE_ID;
                case 3: return pos.x > 0 ? holeId-1 : INVALID_HOLE_ID;
                case 4: return pos.x > 0 && pos.y > 0 ? holeId-w : INVALID_HOLE_ID;
                case 5: return pos.x+1 < w && pos.y > 0 ? holeId-w+1 : INVALID_HOLE_ID;
                }
            }
            return INVALID_HOLE_ID;
        };
        this.getDirCount = function(){
            return 6;
        };
        this.getHolePositionX = function(holeId){
            var pos = idToXY(holeId);
            return (size-1)*0.5 - pos.y*0.5 + pos.x;
        };
        this.getHolePositionY = function(holeId){
            return idToY(holeId);
        };
        this.getBoardSizeX = function(){
            return size-1;
        };
        this.getBoardSizeY = function(){
            return size-1;
        };

        //

        function yToId(y){
            return y*(y+1)/2;
        }
        function xyToId(x, y){
            return yToId(y) + x;
        }
        function idToY(holeId){
            return Math.floor((Math.sqrt(1 + 8*holeId) - 1)/2);
        }
        function idToXY(holeId){
            var y = idToY(holeId);
            var x = holeId - yToId(y);
            return {x:x, y:y};
        }
        function idToX(holeId){
            var y = idToY(holeId);
            return holeId - yToId(y);
        }
    }

    mypkg.createEnglishBoard = createEnglishBoard;
    function createEnglishBoard()
    {
        var board = new RectangularBoard(7,7);
        board.fillRect(2,0,3,7, true);
        board.fillRect(0,2,7,3, true);
        board.pullPeg(board.xy(3,3));
        return board;
    }

    mypkg.createEuropeanBoard = createEuropeanBoard;
    function createEuropeanBoard()
    {
        var board = new RectangularBoard(7,7);
        board.fillRect(2,0,3,7, true);
        board.fillRect(0,2,7,3, true);
        board.fillRect(1,1,5,5, true);
        board.pullPeg(board.xy(3,3));
        return board;
    }

    mypkg.createTriangular5Board = createTriangular5Board;
    function createTriangular5Board()
    {
        var board = new TriangularBoard(5);
        board.boreHoleAll();
        board.fillPegAll();
        board.pullPeg(board.xy(0,0));
        return board;
    }

    mypkg.createHexagonal5Board = createHexagonal5Board;
    function createHexagonal5Board()
    {
        var board = new HexGridBoard(9, 9);
        board.fillRect(2,0,5,1, true);
        board.fillRect(1,1,6,1, true);
        board.fillRect(1,2,7,1, true);
        board.fillRect(0,3,8,1, true);
        board.fillRect(0,4,9,1, true);
        board.fillRect(0,5,8,1, true);
        board.fillRect(1,6,7,1, true);
        board.fillRect(1,7,6,1, true);
        board.fillRect(2,8,5,1, true);
        board.pullPeg(board.xy(4,4));
        return board;
    }

    function createPropellerBoard()
    {
        var board = new HexGridBoard(5, 5);
        board.fillRect(1,0,3,1, true);
        board.fillRect(1,1,2,1, true);
        board.fillRect(0,2,5,1, true);
        board.fillRect(0,3,4,1, true);
        board.fillRect(1,4,1,1, true);
        board.fillRect(3,4,1,1, true);
        board.pullPeg(board.xy(2,2));
        return board;
    }

    mypkg.createMinimumBoard = createMinimumBoard;
    function createMinimumBoard()
    {
        var board = new RectangularBoard(3,1);
        board.boreHoleAll();
        board.fillPegAll();
        board.pullPeg(board.xy(0,0));
        return board;
    }


    mypkg.History = History;
    function History()
    {
        var moves = [];
        this.add = function(from, to){
            moves.push({from:from, to:to});
        };
        this.undo = function(board){
            if(moves.length > 0){
                var lastMove = moves.pop();
                board.undoMovePeg(lastMove.from, lastMove.to);
            }
        };
        this.getMoveCount = function(){return moves.length;};
    }

    //
    // View/Control
    //

    function drawBoardToCanvas(canvas, ctx, board, opt, draggingPeg)
    {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        var left = opt.paddingLeft;
        var top = opt.paddingTop;
        var holeSpanX = opt.holeSpanX;
        var holeSpanY = opt.holeSpanY;
        var holeRadius = opt.holeRadius;
        var pegRadius = opt.pegRadius;

        // Hole
        board.eachHole(function(holeId){
            var holeX = left + board.getHolePositionX(holeId) * holeSpanX;
            var holeY = top  + board.getHolePositionY(holeId) * holeSpanY;
            ctx.beginPath();
            ctx.arc(holeX, holeY, holeRadius, 0, Math.PI*2, false);
            if(draggingPeg && holeId == draggingPeg.getDstHoleId() && board.canMoveFromTo(draggingPeg.getHoleId(), holeId)){
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
            }
            else{
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
            }
            ctx.stroke();
        });

        // Peg
        board.eachHole(function(holeId){
            if(board.hasPeg(holeId)){
                var pegX = left + board.getHolePositionX(holeId) * holeSpanX;
                var pegY = top  + board.getHolePositionY(holeId) * holeSpanY;
                if(draggingPeg && holeId == draggingPeg.getHoleId()){
                    pegX += draggingPeg.getDeltaX();
                    pegY += draggingPeg.getDeltaY();
                }
                ctx.beginPath();
                ctx.arc(pegX, pegY, pegRadius, 0, Math.PI*2, false);
                ctx.fillStyle = "black";
                ctx.fill();
            }
        });
    }

    mypkg.createCanvasView = createCanvasView;
    function createCanvasView(board)
    {
        var history = new History();
        var HOLE_SPAN = 48;
        var opt = {
            paddingLeft: HOLE_SPAN*0.5,
            paddingTop: HOLE_SPAN*0.5,
            paddingRight: HOLE_SPAN*0.5,
            paddingBottom: HOLE_SPAN*0.5,
            holeSpanX: HOLE_SPAN,
            holeSpanY: HOLE_SPAN,
            holeRadius: HOLE_SPAN*0.375,
            pegRadius: HOLE_SPAN*0.3125
        };

        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", opt.paddingLeft + board.getBoardSizeX() * opt.holeSpanX + opt.paddingRight);
        canvas.setAttribute("height", opt.paddingTop + board.getBoardSizeY() * opt.holeSpanY + opt.paddingBottom);

        function update()
        {
            drawBoardToCanvas(
                canvas,
                canvas.getContext("2d"),
                board,
                opt,
                draggingPeg);
        }
        update();

        //
        // Board
        //

        function move(fromId, toId)
        {
            if(board.movePeg(fromId, toId)){
                history.add(fromId, toId);
                update();
                fireBoardMovedEvent();
            }
        }
        function undo()
        {
            history.undo(board);
            update();
        }
        function fireBoardMovedEvent()
        {
            var ev = document.createEvent("HTMLEvents");
            ev.initEvent("boardmoved", true, false);
            canvas.dispatchEvent(ev);
        }

        //
        // Input
        //

        var draggingPeg = null;
        function DraggingPeg(holeId, initialMousePos)
        {
            var deltaPos = {x:0, y:0};
            var dstHoleId = INVALID_HOLE_ID;

            this.getHoleId = function() { return holeId;};
            this.setMousePosition = function(pos, dstId) {
                deltaPos.x = pos.x - initialMousePos.x;
                deltaPos.y = pos.y - initialMousePos.y;
                dstHoleId = dstId;
            };
            this.getDeltaX = function(){ return deltaPos.x;};
            this.getDeltaY = function(){ return deltaPos.y;};
            this.getDstHoleId = function(){ return dstHoleId;};
        }

        function mousePosToHoleId(xy)
        {
            return board.findHoleAtPosition(
                (xy.x - opt.paddingLeft) / opt.holeSpanX,
                (xy.y - opt.paddingTop) / opt.holeSpanY);
        }

        function onMouseDown(ev)
        {
            var pos = getMouseEventPositionOnElement(canvas, ev);
            var holeId = mousePosToHoleId(pos);
            if(board.hasPeg(holeId)){
                draggingPeg = new DraggingPeg(holeId, pos);
                update();
            }
        }
        function onMouseMove(ev)
        {
            if(draggingPeg){
                var pos = getMouseEventPositionOnElement(canvas, ev);
                var holeId = mousePosToHoleId(pos);
                draggingPeg.setMousePosition(pos, holeId);
                update();
            }
        }
        function onMouseUp(ev)
        {
            if(draggingPeg){
                var dstHoleId = draggingPeg.getDstHoleId();
                if(board.hasEmptyHole(dstHoleId)){
                    move(draggingPeg.getHoleId(), dstHoleId);
                }
                draggingPeg = null;
                update();
            }
        }
        function onMouseLeave(ev)
        {
            if(draggingPeg){
                draggingPeg = null;
                update();
            }
        }
        function onTouchStart(ev)
        {
            onMouseDown(ev.touches[0]);
            ev.preventDefault();
        }
        function onTouchMove(ev)
        {
            onMouseMove(ev.touches[0]);
            ev.preventDefault();
        }
        function onTouchEnd(ev)
        {
            onMouseUp();
            ev.preventDefault();
        }

        canvas.addEventListener("mousedown", onMouseDown, false);
        canvas.addEventListener("mousemove", onMouseMove, false);
        canvas.addEventListener("mouseup", onMouseUp, false);
        canvas.addEventListener("mouseleave", onMouseLeave, false);
        canvas.addEventListener("touchstart", onTouchStart, false);
        canvas.addEventListener("touchmove", onTouchMove, false);
        canvas.addEventListener("touchend", onTouchEnd, false);

        // Public Interface

        canvas.pegsolitaire = {
            undo: undo,
            history: history,
            board: board
        };

        return canvas;
    }

    mypkg.createGameBox = createGameBox;
    function createGameBox()
    {
        var gameDiv = newElem("div");

        // control
        var BOARD_TYPES = [
            {id:"English", ctor:createEnglishBoard, title:"English Style(33 holes)"},
            {id:"European", ctor:createEuropeanBoard, title:"European Style(37 holes)"},
            {id:"Triangular5", ctor:createTriangular5Board, title:"Triangular5(15 holes)"},
            {id:"Hexagonal5", ctor:createHexagonal5Board, title:"Hexagonal5(61 holes)"},
            {id:"Propeller", ctor:createPropellerBoard, title:"Propeller(16 holes)"},
            {id:"Minimum", ctor:createMinimumBoard, title:"Minimum(3 holes)"}
        ];

        var controlDiv = newElem("div", gameDiv);

        var boardCtors = {};
        var selectType = newElem("select", controlDiv);
        for(var i = 0; i < BOARD_TYPES.length; ++i){
            var option = newElem("option", selectType);
            option.setAttribute("value", BOARD_TYPES[i].id);
            option.appendChild(document.createTextNode(BOARD_TYPES[i].title));
            boardCtors[BOARD_TYPES[i].id] = BOARD_TYPES[i].ctor;
        }

        var buttonNewGame = newButton(controlDiv, "New Game", newGame);
        var buttonUndo = newButton(controlDiv, "Undo", undo);

        // status

        var statusDiv = newElem("div", gameDiv);
        var spanMoves = newElem("span", statusDiv);
        statusDiv.appendChild(document.createTextNode(" "));
        var spanSolved = newElem("span", statusDiv);

        function updateStatus(){
            if(currentCanvas){
                spanMoves.innerHTML = "Moves:" + currentCanvas.pegsolitaire.history.getMoveCount();
                var board = currentCanvas.pegsolitaire.board;
                spanSolved.innerHTML =
                    board.isSolved() ? "Solved!" :
                    board.isEnd() ? "End Game" :
                    "Playing";
            }
        }

        // canvas

        var currentCanvas = null;

        function newGame(){
            var creator = boardCtors[selectType.value];
            if(creator){
                var board = creator();
                if(currentCanvas){
                    currentCanvas.parentNode.removeChild(currentCanvas);
                }
                currentCanvas = createCanvasView(board);
                gameDiv.appendChild(currentCanvas);

                currentCanvas.addEventListener("boardmoved", onBoardMoved, false);
            }
            updateStatus();
        }
        function undo(){
            if(currentCanvas){
                currentCanvas.pegsolitaire.undo();
                updateStatus();
            }
        }
        function onBoardMoved(ev){
            updateStatus();
        }

        newGame();

        return gameDiv;
    }


    //
    // HTML Utility
    //
    mypkg.getLastScriptNode = getLastScriptNode;
    function getLastScriptNode()
    {
        var n = document;
        while(n && n.nodeName.toLowerCase() != "script") { n = n.lastChild;}
        return n;
    }

    function getMouseEventPositionOnElement(elem, ev)
    {
        var rect = elem.getBoundingClientRect();
        return {x:ev.clientX - rect.left, y:ev.clientY - rect.top};
    }

    function newElem(tagName, parentNode)
    {
        var elem = document.createElement(tagName);
        if(parentNode){
            parentNode.appendChild(elem);
        }
        return elem;
    }
    function newButton(parentNode, value, onClick)
    {
        var button = newElem("input", parentNode);
        button.setAttribute("type", "button");
        button.setAttribute("value", value);
        button.addEventListener("click", onClick, false);
        return button;
    }


})(this);



