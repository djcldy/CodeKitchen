
const rotationData1 = {0: 90, 1: 180, 2: 270, 3: 0}
const rotationData2 = {0: 180, 1: 270, 2: 0, 3: 90}


function mousedown: (state) {

    let { graph, rooms, furniture, elements, walls, gridSpacing } = state;
    let { points, edges } = graph;
    let { interior, exterior } = walls;
    let { mouseX, mouseY } = this.getWorldMouse();

    this.push(); // do we need this?
    this.applyCamera(); // Apply Cam Transforms

    this.elementSelected = this.getOpenings([...interior, ...exterior], elements, points); // select door or window
    if (this.elementSelected) {
        editor.recordLastState();
        return;
    }

    this.pop(); // do we need this?

    //need to refactor
    const stairPts = [];
    const stairEdges = [];
    rooms.forEach((r) => {
        if (r.isStair) {
            let ptA = points[r.a];
            let ptB = points[r.b];
            let ptC = new THREE.Vector2(ptB.x, ptA.y);
            let ptD = new THREE.Vector2(ptA.x, ptB.y);

            for (let i = 0; i < graph.points.length; i++) {
                if (graph.points[i].x === ptC.x && graph.points[i].y === ptC.y) {
                    ptC = graph.points[i];
                    continue;
                }
                if (graph.points[i].x === ptD.x && graph.points[i].y === ptD.y) ptD = graph.points[i];
            }
            stairEdges.push([ptA.index, ptC.index]);
            stairEdges.push([ptA.index, ptD.index]);
            stairEdges.push([ptB.index, ptC.index]);
            stairEdges.push([ptB.index, ptD.index]);
            stairPts.push(ptA, ptB, ptC, ptD);
        }
    });
    stairPts.sort(function(a, b) {
        return a.index - b.index;
    });
    stairEdges.forEach((e) => {
        e.sort(function(a, b) {
            return a - b;
        });
    });

    let fixedRoom = { stairPts, stairEdges };

    //select node
    let selected = this.selectNodes(graph, fixedRoom);
    if (selected) {
        editor.recordLastState();
        this.selected = selected;
        this.update(state);
        return;
    }

    if (this.selectableFurnture) {
        this.furnitureSelected = this.selectElement(furniture);

        if (this.furnitureSelected) {
            if (!this.furnitureSelected.isLocked) {
                editor.recordLastState();
                this.update(state);
                return;
            }

            this.furnitureSelected = null; //some furniture items u cant click and drag
        }
    }

    //rotate stair/
    const roomId = this.selectRoom(graph, rooms);
    const filteredRooms = rooms.filter((r) => r.isStair && r.id === roomId);
    if (filteredRooms.length > 0) {
        editor.recordLastState();
        const room = filteredRooms[0];
        let midPts = this.getMidPoints(room, points);

        for (let i = 0; i < midPts.length; i++) {
            let dist = p5.dist(midPts[i].x, midPts[i].y, mouseX, mouseY);
            if (dist > 11) {
                return
            }
            if (room.type === 'stair1') {
                room.furniture[0].object.rotation = rotationData1[i];
                editor.updateGraph(state);
                this.update(state);
                return;
                }
            if (room.type === 'stair2') {
                let currRotation = room.furniture[0].object.rotation;

                    // CHANGED
                    if (room.furniture[0].object.rotation === rotationData2[i]) return;
                    const removedRoom = editor.removeRoom(roomId, state);
                    let { a, b } = removedRoom;
                    removedRoom.prev = {
                        a: a.clone(),
                        b: b.clone(),
                    };
                    let newRoom;
                    room.furniture[0].offX = 30;
                    room.furniture[0].offY = 79;
                    room.furniture[0].object.rotation = 180;
                    
                    //CHANGED
                    if (currRotation === (i*90)) {
                        newRoom = editor.rotateRoom(removedRoom, 180);
                    } else {
                        newRoom = editor.rotateRoom(removedRoom, 90);
                    }
                    this.fixBoxCollisions(room, state);
                    this.snapRoom(newRoom, gridSpacing);
                    editor.addRoom(newRoom, state);
                    let roomCopy = JSON.parse(JSON.stringify(newRoom));
                    roomCopy.isfloor2 = true;
                    editor.removeRoom(roomCopy.id, editor.lvl2);
                    editor.addRoom(roomCopy, editor.lvl2);
                    editor.updateGraph(editor.lvl2);
                    editor.updateGraph(state);
                    this.update(state);
                    return;
                }
            //     if (i === 1) {
            //         //RIGHT
            //         if (room.furniture[0].object.rotation === 270) return;
            //         const removedRoom = editor.removeRoom(roomId, state);
            //         let { a, b } = removedRoom;
            //         removedRoom.prev = {
            //             a: a.clone(),
            //             b: b.clone(),
            //         };
            //         let newRoom;
            //         room.furniture[0].offX = 79;
            //         room.furniture[0].offY = 30;
            //         room.furniture[0].object.rotation = 270;
            //         if (currRotation === 90) {
            //             newRoom = editor.rotateRoom(removedRoom, 180);
            //         } else {
            //             newRoom = editor.rotateRoom(removedRoom, 90);
            //         }
            //         this.fixBoxCollisions(room, state);
            //         this.snapRoom(newRoom, gridSpacing);
            //         editor.addRoom(newRoom, state);
            //         let roomCopy = JSON.parse(JSON.stringify(newRoom));
            //         roomCopy.isfloor2 = true;
            //         editor.removeRoom(roomCopy.id, editor.lvl2);
            //         editor.addRoom(roomCopy, editor.lvl2);
            //         editor.updateGraph(editor.lvl2);
            //         editor.updateGraph(state);
            //         this.update(state);
            //         return;
            //     }
            //     if (i === 2) {
            //         //BOTTOM
            //         if (room.furniture[0].object.rotation === 0) return;
            //         const removedRoom = editor.removeRoom(roomId, state);
            //         let { a, b } = removedRoom;
            //         removedRoom.prev = {
            //             a: a.clone(),
            //             b: b.clone(),
            //         };
            //         let newRoom;
            //         room.furniture[0].offX = 30;
            //         room.furniture[0].offY = 79;
            //         room.furniture[0].object.rotation = 0;
            //         if (currRotation === 180) {
            //             newRoom = editor.rotateRoom(removedRoom, 180);
            //         } else {
            //             newRoom = editor.rotateRoom(removedRoom, 90);
            //         }
            //         this.fixBoxCollisions(room, state);
            //         this.snapRoom(newRoom, gridSpacing);
            //         editor.addRoom(newRoom, state);
            //         let roomCopy = JSON.parse(JSON.stringify(newRoom));
            //         roomCopy.isfloor2 = true;
            //         editor.removeRoom(roomCopy.id, editor.lvl2);
            //         editor.addRoom(roomCopy, editor.lvl2);
            //         editor.updateGraph(editor.lvl2);
            //         editor.updateGraph(state);
            //         this.update(state);
            //         return;
            //     }
            //     if (i === 3) {
            //         //LEFT
            //         if (room.furniture[0].object.rotation === 90) return;
            //         const removedRoom = editor.removeRoom(roomId, state);
            //         let { a, b } = removedRoom;
            //         removedRoom.prev = {
            //             a: a.clone(),
            //             b: b.clone(),
            //         };
            //         let newRoom;
            //         room.furniture[0].offX = 79;
            //         room.furniture[0].offY = 30;
            //         room.furniture[0].object.rotation = 90;
            //         if (currRotation === 270) {
            //             newRoom = editor.rotateRoom(removedRoom, 180);
            //         } else {
            //             newRoom = editor.rotateRoom(removedRoom, 90);
            //         }
            //         this.fixBoxCollisions(room, state);
            //         this.snapRoom(newRoom, gridSpacing);
            //         editor.addRoom(newRoom, state);
            //         let roomCopy = JSON.parse(JSON.stringify(newRoom));
            //         roomCopy.isfloor2 = true;
            //         editor.removeRoom(roomCopy.id, editor.lvl2);
            //         editor.addRoom(roomCopy, editor.lvl2);
            //         editor.updateGraph(editor.lvl2);
            //         editor.updateGraph(state);
            //         this.update(state);
            //         return;
            //     }
            //     }
            }
        }
    }

    //Roof Rotation
    if (editor.view === 'site') {
        let rooms1 = editor.lvl1.rooms;
        // let pts1 = editor.lvl1.points;
        let rooms2 = editor.lvl2.rooms;
        // let pts2 = editor.lvl2.points;

        let roomSelectedlvl1 = this.selectRoom(editor.lvl1.graph, rooms1);
        let roomSelectedlvl2 = this.selectRoom(editor.lvl2.graph, rooms2);

        if (editor.lvl2.rooms.length > 0) {
            if (roomSelectedlvl2) {
                editor.recordLastState();
                rooms2.forEach((room) => {
                    if (room.id === roomSelectedlvl2) {
                        room.rotateRoof += 1;
                        if (room.rotateRoof > 4) room.rotateRoof = 1;
                    }
                });
                editor.updateGraph(editor.currState);
                this.update(editor.currState);
                return;
            }
            if (roomSelectedlvl1) {
                editor.recordLastState();
                rooms1.forEach((room) => {
                    if (room.id === roomSelectedlvl1) {
                        room.rotateRoof += 1;
                        if (room.rotateRoof > 4) room.rotateRoof = 1;
                    }
                });
                editor.updateGraph(editor.currState);
                this.update(editor.currState);
                return;
            }
        } else {
            if (roomSelectedlvl1) {
                editor.recordLastState();
                rooms1.forEach((room) => {
                    if (room.id === roomSelectedlvl1) {
                        room.rotateRoof += 1;
                        if (room.rotateRoof > 4) room.rotateRoof = 1;
                    }
                });
                editor.updateGraph(editor.currState);
                this.update(editor.currState);
                return;
            }
        }
    } else {
        let roomSelected = this.selectRoom(graph, rooms); // get id number of selected room

        if (roomSelected) {
            editor.recordLastState();
            this.roomSelected = editor.removeRoom(roomSelected, state); // remove room
            let { a, b } = this.roomSelected;
            this.roomSelected.prev = {
                a: a.clone(),
                b: b.clone(),
            };
            if (this.roomSelected.isStair && this.roomSelected.isfloor2) {
                this.stairRoom2 = JSON.parse(JSON.stringify(this.roomSelected));
            }
            this.update(state);
            return;
        }
    }
