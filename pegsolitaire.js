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
        this.findHoleAtPosition = function(x, y, r, includingInvalidHoles){
            if(!r){ r = 0.5;}
            var count = this.getHoleCount();
            for(var id = 0; id < count; ++id){
                if(includingInvalidHoles || this.hasValidHole(id)){
                    var dx = this.getHoleLayoutPositionX(id) - x;
                    var dy = this.getHoleLayoutPositionY(id) - y;
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
        this.eachHole = function(fun, includingInvalidHoles){
            var holeCount = this.getHoleCount();
            for(var id = 0; id < holeCount; ++id){
                if(includingInvalidHoles || this.hasValidHole(id)){
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

        this.setHoleState = function(holeId, stateUndefinedOrFlaseOrTrue){
            if(holeId >= 0 && holeId < holes.length){
                holes[holeId] = typeof(stateUndefinedOrFlaseOrTrue) == "boolean" ? stateUndefinedOrFlaseOrTrue : undefined;
            }
        };
        this.getHoleState = function(holeId){
            return holes[holeId];
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
        this.clear = function(){
           for(var id = 0; id < holes.length; ++id){
                this.setHoleState(id, undefined);
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
        this.getHolesString = function(){
            return GridBoardBase.convertHolesToString(holes);
        };
    }
    GridBoardBase.convertHolesToString = function(holes){
        var str = "";
        for(var id = 0; id < holes.length; ++id){
            var h = holes[id];
            str += h === true ? "P" : h === false ? "O" : "_";
        }
        return str;
    };
    GridBoardBase.convertStringToHoles = function(str){
        var holes = [];
        for(var i = 0; i < str.length; ++i){
            var c = str.charAt(i);
            holes.push(c == "P" ? true : c == "O" ? false : undefined);
        }
        return holes;
    };


    mypkg.RectangularBoard = RectangularBoard;
    function RectangularBoard(w, h, holes)
    {
        // ex) w=6, h=3
        // 0  1  2  3  4  5
        // 6  7  8  9  10 11
        // 12 13 14 15 16 17
        if(!holes) { holes = new Array(w*h);}
        GridBoardBase.call(this, holes);

        // Board Interface

        this.xy = function(x, y){
            if(x >= 0 && x < w && y >= 0 && y < h){
                return x + y * w;
            }
            else{
                return INVALID_HOLE_ID;
            }
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
        this.getHoleLayoutPositionX = function(holeId){
            return toX(holeId);
        };
        this.getHoleLayoutPositionY = function(holeId){
            return toY(holeId);
        };
        this.getLayoutSizeX = function(){
            return w-1;
        };
        this.getLayoutSizeY = function(){
            return h-1;
        };
        this.getWidth = function(){ return w;};
        this.getHeight = function(){ return h;};
        this.getSize = function(){ return Math.max(w, h);};
        this.getType = function(){ return RectangularBoard.TYPEID;};
        this.toString = function(){
            return this.getType() + " " + w + " " + h + " " + this.getHolesString();
        };
        this.copyFrom = function(from, left, top){
            for(var y = 0; y < h; ++y){
                for(var x = 0; x < w; ++x){
                    this.setHoleState(this.xy(x, y), from.getHoleState(from.xy(left+x, top+y)));
                }
            }
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
    RectangularBoard.TYPEID = "R";

    mypkg.HexGridBoard = HexGridBoard;
    function HexGridBoard(w, h, holes)
    {
        // ex)w=4,h=3
        // 0  1  2  3
        //  4  5  6  7
        // 8  9 10 11
        RectangularBoard.call(this, w, h, holes);

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
        this.getHoleLayoutPositionX = function(holeId){
            return toX(holeId) + (toY(holeId) & 1) * 0.5;
        };
        this.getHoleLayoutPositionY = function(holeId){
            return toY(holeId);
        };
        this.getLayoutSizeX = function(){
            return (w-1) + (h > 1 ? 0.5 : 0);
        };
        this.getLayoutSizeY = function(){
            return h-1;
        };
        this.getType = function(){ return HexGridBoard.TYPEID;};
        this.toString = function(){
            return this.getType() + " " + w + " " + h + " " + this.getHolesString();
        };

        //

        function fromXY(x, y){
            return (x >= 0 && y >= 0 && x < w && y < h) ? x+y*w : INVALID_HOLE_ID;
        }
        function toX(holeId){ return holeId % w;}
        function toY(holeId){ return Math.floor(holeId / w);}
    }
    HexGridBoard.TYPEID = "H";

    mypkg.TriangularBoard = TriangularBoard;
    function TriangularBoard(size, holes)
    {
        // ex)size=4
        //    0
        //   1 2
        //  3 4 5
        // 6 7 8 9
        if(!holes) { holes = new Array((size*(size+1))/2);}
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
        this.getHoleLayoutPositionX = function(holeId){
            var pos = idToXY(holeId);
            return (size-1)*0.5 - pos.y*0.5 + pos.x;
        };
        this.getHoleLayoutPositionY = function(holeId){
            return idToY(holeId);
        };
        this.getLayoutSizeX = function(){
            return size-1;
        };
        this.getLayoutSizeY = function(){
            return size-1;
        };
        this.getWidth = function(){ return size;};
        this.getHeight = function(){ return size;};
        this.getSize = function(){ return size;};
        this.getType = function(){ return TriangularBoard.TYPEID;};
        this.toString = function(){
            return this.getType() + " " + size + " " + this.getHolesString();
        };
        this.copyFrom = function(from, left, top){
            for(var y = 0; y < size; ++y){
                for(var x = 0; x < y+1; ++x){
                    this.setHoleState(this.xy(x, y), from.getHoleState(from.xy(left+x, top+y)));
                }
            }
        };

        //

        function yToId(y){
            if(y >= 0 && y < size){
                return y*(y+1)/2;
            }
            else{
                return INVALID_HOLE_ID;
            }
        }
        function xyToId(x, y){
            if(y >= 0 && y < size && x >= 0 && x <= y){
                return yToId(y) + x;
            }
            else{
                return INVALID_HOLE_ID;
            }
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
    TriangularBoard.TYPEID = "T";

    function parseBoard(str)
    {
        function createBoardWidthHeight(ctor, lines){
            var w = parseInt(lines[1], 10);
            var h = parseInt(lines[2], 10);
            var holesStr = lines[3];
            if(!(w >= 0 && w < 100) || !(h >= 0 && h < 100) || holesStr.length != w*h){
                return null;
            }
            var holes = GridBoardBase.convertStringToHoles(holesStr);
            return new ctor(w, h, holes);
        }
        function createBoardSize(ctor, lines){
            var size = parseInt(lines[1], 10);
            var holesStr = lines[2];
            if(!(size >= 0 && size < 10000) || holesStr.length != size){
                return null;
            }
            var holes = GridBoardBase.convertStringToHoles(holesStr);
            return new ctor(size, holes);
        }
        var lines = str.split(/\s+/);
        var ctor;
        var args = [];
        switch(lines[0]){
        case RectangularBoard.TYPEID:
            return createBoardWidthHeight(RectangularBoard, lines);
        case HexGridBoard.TYPEID:
            return createBoardWidthHeight(HexGridBoard, lines);
        case TriangularBoard.TYPEID:
            return createBoardSize(TriangularBoard, lines);
        default:
            return null;
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

    mypkg.create4HolesBoard = create4HolesBoard;
    function create4HolesBoard()
    {
        var board = new RectangularBoard(4,1);
        board.boreHoleAll();
        board.fillPegAll();
        board.pullPeg(board.xy(1,0));
        return board;
    }

    mypkg.create5HolesBoard = create5HolesBoard;
    function create5HolesBoard()
    {
        var board = new RectangularBoard(3,3);
        board.fillRect(0,0,3,1, true);
        board.fillRect(1,1,1,2, true);
        board.pullPeg(board.xy(2,0));
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
        this.clear = function(){
            moves.splice(0, moves.length);
        };
    }



    //
    // View/Control
    //

    function drawBoardToCanvas(canvas, ctx, board, opt, draggingPeg, drawInvalidHoles)
    {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        var left = opt.paddingLeft;
        var top = opt.paddingTop;
        var holeSpanX = opt.holeSpanX;
        var holeSpanY = opt.holeSpanY;
        var holeRadius = opt.holeRadius;
        var pegRadius = opt.pegRadius;

        // Invalid Holes
        if(drawInvalidHoles){
            board.eachHole(function(holeId){
                if(!board.hasValidHole(holeId)){
                    var holeX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
                    var holeY = top  + board.getHoleLayoutPositionY(holeId) * holeSpanY;
                    ctx.beginPath();
                    ctx.moveTo(holeX-pegRadius, holeY);
                    ctx.lineTo(holeX+pegRadius, holeY);
                    ctx.moveTo(holeX, holeY-pegRadius);
                    ctx.lineTo(holeX, holeY+pegRadius);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }, true);
        }

        // Hole
        board.eachHole(function(holeId){
            var holeX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
            var holeY = top  + board.getHoleLayoutPositionY(holeId) * holeSpanY;
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
                var pegX = left + board.getHoleLayoutPositionX(holeId) * holeSpanX;
                var pegY = top  + board.getHoleLayoutPositionY(holeId) * holeSpanY;
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
        canvas.setAttribute("width", opt.paddingLeft + board.getLayoutSizeX() * opt.holeSpanX + opt.paddingRight);
        canvas.setAttribute("height", opt.paddingTop + board.getLayoutSizeY() * opt.holeSpanY + opt.paddingBottom);

        function update()
        {
            drawBoardToCanvas(
                canvas,
                canvas.getContext("2d"),
                board,
                opt,
                draggingPeg,
                getMode() == MODE_EDIT ? true : false);
        }

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

        function mousePosToHoleId(xy, includingInvalidHoles)
        {
            return board.findHoleAtPosition(
                (xy.x - opt.paddingLeft) / opt.holeSpanX,
                (xy.y - opt.paddingTop) / opt.holeSpanY,
                undefined,
                includingInvalidHoles);
        }

        function PlayingMode()
        {
            this.leaveMode = function()
            {
                this.onMouseLeave();
            };
            this.onMouseDown = function(ev)
            {
                var pos = getMouseEventPositionOnElement(canvas, ev);
                var holeId = mousePosToHoleId(pos);
                if(board.hasPeg(holeId)){
                    draggingPeg = new DraggingPeg(holeId, pos);
                    update();
                }
            };
            this.onMouseMove = function(ev)
            {
                if(draggingPeg){
                    var pos = getMouseEventPositionOnElement(canvas, ev);
                    var holeId = mousePosToHoleId(pos);
                    draggingPeg.setMousePosition(pos, holeId);
                    update();
                }
            };
            this.onMouseUp = function(ev)
            {
                if(draggingPeg){
                    var dstHoleId = draggingPeg.getDstHoleId();
                    if(board.hasEmptyHole(dstHoleId)){
                        move(draggingPeg.getHoleId(), dstHoleId);
                    }
                    draggingPeg = null;
                    update();
                }
            };
            this.onMouseLeave = function(ev)
            {
                if(draggingPeg){
                    draggingPeg = null;
                    update();
                }
            };
        }
        function EditingMode()
        {
            var lastHoleState = null;

            this.leaveMode = function()
            {
                this.onMouseLeave();
            };
            this.onMouseDown = function(ev)
            {
                var pos = getMouseEventPositionOnElement(canvas, ev);
                var holeId = mousePosToHoleId(pos, true);
                if(holeId >= 0 && holeId < board.getHoleCount()){
                    var oldHoleState = board.getHoleState(holeId);
                    var newHoleState =
                            oldHoleState === undefined ? true :
                            oldHoleState === true ? false :
                            undefined;
                    board.setHoleState(holeId, newHoleState);
                    update();
                    lastHoleState = newHoleState;
                }
            };
            this.onMouseMove = function(ev)
            {
                if(lastHoleState !== null){
                    var pos = getMouseEventPositionOnElement(canvas, ev);
                    var holeId = mousePosToHoleId(pos, true);
                    if(holeId >= 0 && holeId < board.getHoleCount()){
                        board.setHoleState(holeId, lastHoleState);
                        update();
                    }
                }
            };
            this.onMouseUp = function(ev)
            {
                if(lastHoleState !== null){
                    lastHoleState = null;
                }
            };
            this.onMouseLeave = function(ev)
            {
                if(lastHoleState !== null){
                    lastHoleState = null;
                }
            };
        }
        var MODE_PLAY = "Playing";
        var MODE_EDIT = "Editing";
        var modeObj = new PlayingMode();
        var modeName = MODE_PLAY;
        function setMode(modeStr)
        {
            var modeCtor =
                    modeStr==MODE_PLAY ? PlayingMode :
                    modeStr==MODE_EDIT ? EditingMode :
                    null;
            if(!modeCtor){
                return;
            }
            modeObj.leaveMode();
            modeObj = new modeCtor();
            modeName = modeStr;
            update();
        }
        function getMode()
        {
            return modeName;
        }


        function onMouseDown(ev){ modeObj.onMouseDown(ev);}
        function onMouseMove(ev){ modeObj.onMouseMove(ev);}
        function onMouseUp(ev){ modeObj.onMouseUp(ev);}
        function onMouseLeave(ev){ modeObj.onMouseLeave(ev);}
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
            update: update,
            undo: undo,
            history: history,
            board: board,
            setMode: setMode,
            getMode: getMode,
            MODE_PLAY: MODE_PLAY,
            MODE_EDIT: MODE_EDIT
        };

        update();
        return canvas;
    }

    mypkg.getBoardCatalog = getBoardCatalog;
    function getBoardCatalog(){
        return [
            {id:"English", ctor:createEnglishBoard, title:"English Style(33 holes)"},
            {id:"European", ctor:createEuropeanBoard, title:"European Style(37 holes)"},
            {id:"Triangular5", ctor:createTriangular5Board, title:"Triangular5(15 holes)"},
            {id:"Hexagonal5", ctor:createHexagonal5Board, title:"Hexagonal5(61 holes)"},
            {id:"Propeller", ctor:createPropellerBoard, title:"Propeller(16 holes)"},
            {id:"Minimum", ctor:createMinimumBoard, title:"Minimum(3 holes)"},
            {id:"4Holes", ctor:create4HolesBoard, title:"4Holes(4 holes)"},
            {id:"5Holes", ctor:create5HolesBoard, title:"5Holes(5 holes)"},
            {id:"Easy Pinwheel", str:"R 4 4 __P_OPP__PPP_P__", title:"Easy Pinwheel(8 holes)"},
            {id:"Banzai7", str:"H 3 3 OPOPP__PP", title:"Banzai7(7 holes)"},
            {id:"Megaphone", str:"H 4 4 _P__PPPP__PP__O_", title:"Megaphone(8 holes)"},
            {id:"Owl", str:"H 4 4 _PPPPOOP_PPP_PP_", title:"Owl(12 holes)"},
            {id:"Star", str:"H 4 5 __O_PPPP_PPPPPPP__P_", title:"Star(13 holes)"},
            {id:"Arrow9", str:"H 4 4 __P_OPP__PPP_PP_", title:"Arrow9(9 holes)"}
        ];
    };

    mypkg.createGameBox = createGameBox;
    function createGameBox(opt)
    {
        if(!opt){
            opt = {};
        }

        var gameDiv = newElem("div");

        // control

        var controlDiv = newElem("div", gameDiv);

        var boardCtors = {};
        var selectBoard = null;
        if(!opt.disableCatalog){
            selectBoard = newElem("select", controlDiv);
            var catalog = opt.catalog || getBoardCatalog();
            for(var i = 0; i < catalog.length; ++i){
                var option = newElem("option", selectBoard);
                option.setAttribute("value", catalog[i].id);
                option.appendChild(document.createTextNode(catalog[i].title));
                boardCtors[catalog[i].id] = catalog[i].ctor ||
                    (function(str){
                        return function(){return parseBoard(str);};
                    })(catalog[i].str);
            }
        }

        if(!opt.disableNewGame){
            newButton(controlDiv, "New Game", newGame);
        }
        if(!opt.disableUndo){
            newButton(controlDiv, "Undo", undo);
        }
        if(!opt.disableEdit){
            newButton(controlDiv, "Edit", edit);
        }

        // status

        var statusDiv = newElem("div", gameDiv);
        var spanMoves = newElem("span", statusDiv);
        statusDiv.appendChild(document.createTextNode(" "));
        var spanGameState = newElem("span", statusDiv);

        function updateStatus(){
            if(currentCanvas){
                spanMoves.innerHTML = "Moves:" + currentCanvas.pegsolitaire.history.getMoveCount();
                var board = currentCanvas.pegsolitaire.board;
                spanGameState.innerHTML =
                    currentCanvas.pegsolitaire.getMode() == currentCanvas.pegsolitaire.MODE_EDIT ? "Editing" :
                    board.isSolved() ? "Solved!" :
                    board.isEnd() ? "End Game" :
                    "Playing";
            }
        }

        // canvas

        var currentCanvas = null;

        function newBoard(board){
            if(board){
                var newCanvas = createCanvasView(board);
                if(currentCanvas){
                    currentCanvas.parentNode.insertBefore(newCanvas, currentCanvas);
                    currentCanvas.parentNode.removeChild(currentCanvas);
                }
                else{
                    gameDiv.appendChild(newCanvas);
                }
                currentCanvas = newCanvas;

                currentCanvas.addEventListener("boardmoved", onBoardMoved, false);
                updateStatus();
            }
        }
        function newGame(){
            var creator =
                    selectBoard ? boardCtors[selectBoard.value] :
                    opt.boardText ? function(){parseBoard(opt.boardText);} :
                    opt.boardCtor ? opt.boardCtor :
                    null;
            if(creator){
                newBoard(creator());
            }
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

        // Editor
        var editorDiv = null;
        function edit(){
            currentCanvas.pegsolitaire.setMode(currentCanvas.pegsolitaire.MODE_EDIT);
            updateStatus();

            if(editorDiv){
                return;
            }

            editorDiv = newElem("div", gameDiv);
            newButton(editorDiv, "Play", function(){
                currentCanvas.pegsolitaire.setMode(currentCanvas.pegsolitaire.MODE_PLAY);
                updateStatus();
                editorDiv.parentNode.removeChild(editorDiv);
                editorDiv = null;
            });
            newButton(editorDiv, "Export", function(){
                alert(currentCanvas.pegsolitaire.board.toString());
            });
            newButton(editorDiv, "Import", function(){
                var dlg = newElem("div", editorDiv);
                dlg.appendChild(document.createTextNode("Import:"));
                var text = newElem("input", dlg);
                text.setAttribute("type", "text");
                newButton(dlg, "OK", function(){
                    importBoard(text.value);
                    closeDlg();
                });
                newButton(dlg, "Cancel", closeDlg);
                function importBoard(str){
                    newBoard(parseBoard(str));
                }
                function closeDlg(){
                    dlg.parentNode.removeChild(dlg);
                }
            });
            newButton(editorDiv, "Clear History", function(){
                if(currentCanvas){
                    currentCanvas.pegsolitaire.history.clear();
                    updateStatus();
                }
            });
            newButton(editorDiv, "Clear Board", function(){
                if(currentCanvas){
                    currentCanvas.pegsolitaire.board.clear();
                    currentCanvas.pegsolitaire.update();
                    updateStatus();
                }
            });
            newButton(editorDiv, "Resize", function(){
                var BOARD_TYPES = [
                    {id:RectangularBoard.TYPEID, title:"Rectangular", pget:function(b){return ["w", b.getWidth(), "h", b.getHeight()];}, creator: function(props){return new RectangularBoard(props.w, props.h);}},
                    {id:HexGridBoard.TYPEID, title:"HexGrid", pget: function(b){return ["w", b.getWidth(), "h", b.getHeight()];}, creator: function(props){return new HexGridBoard(props.w, props.h);}},
                    {id:TriangularBoard.TYPEID, title:"Triangular", pget: function(b){return ["size", b.getSize()];}, creator: function(props){return new TriangularBoard(props.size);}}
                ];
                var BOARD_TYPES_DIC = {};

                var dlg = newElem("div", editorDiv);
                dlg.appendChild(document.createTextNode("Resize:"));
                var selectType = newElem("select", dlg);
                for(var oi = 0; oi < BOARD_TYPES.length; ++oi){
                    var bt = BOARD_TYPES[oi];
                    BOARD_TYPES_DIC[bt.id] = bt;
                    var option = newElem("option", selectType);
                    option.setAttribute("value", bt.id);
                    option.appendChild(newTextNode(bt.title));
                }
                selectType.addEventListener("change", function(ev){
                    updatePropElem();
                }, false);
                var propElem = newElem("span", dlg);
                var propInputs = [];
                var currBoardType = null;
                function updatePropElem(){
                    var newBoardType = BOARD_TYPES_DIC[selectType.value];
                    if(!newBoardType){
                        return;
                    }
                    while(propElem.firstChild){propElem.removeChild(propElem.firstChild);}

                    var props = newBoardType.pget(currentCanvas.pegsolitaire.board);
                    props.push("dx");
                    props.push(0);
                    props.push("dy");
                    props.push(0);
                    var inputs = [];

                    for(var pi = 0; pi < props.length; pi += 2){
                        propElem.appendChild(newTextNode(props[pi] + ":"));
                        var input = newElem("input", propElem);
                        input.setAttribute("type", "number");
                        input.style.width = "3em";
                        input.value = props[pi+1];
                        inputs.push({name:props[pi], elem:input});
                    }
                    propInputs = inputs;
                    currBoardType = newBoardType;
                }
                selectType.value = currentCanvas.pegsolitaire.board.getType();
                updatePropElem();

                newButton(dlg, "OK", function(){
                    if(!currBoardType){
                        return;
                    }
                    var props = {};
                    for(var ii = 0; ii < propInputs.length; ++ii){
                        props[propInputs[ii].name] = parseInt(propInputs[ii].elem.value, 10);
                    }
                    var board = currBoardType.creator(props);
                    board.copyFrom(currentCanvas.pegsolitaire.board, -props.dx, -props.dy);

                    newBoard(board);
                    currentCanvas.pegsolitaire.setMode(currentCanvas.pegsolitaire.MODE_EDIT);
                    closeDlg();
                });
                newButton(dlg, "Cancel", closeDlg);

                function closeDlg(){
                    dlg.parentNode.removeChild(dlg);
                }
            });
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
    function newTextNode(text)
    {
        return document.createTextNode(text);
    }


})(this);



