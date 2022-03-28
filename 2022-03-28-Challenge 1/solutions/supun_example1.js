mousedown: function (state) {
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
        stairEdges.push(
          [ptA.index, ptC.index],
          [ptA.index, ptD.index],
          [ptB.index, ptC.index],
          [ptB.index, ptD.index]
        );
  
        stairPts.push(ptA, ptB, ptC, ptD);
      }
    });
    stairPts.sort(function (a, b) {
      return a.index - b.index;
    });
    stairEdges.forEach((e) => {
      e.sort(function (a, b) {
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
    this.rotateStair(state, graph, rooms, points, mouseX, mouseY, gridSpacing);
  
    //Roof Rotation
    this.rotateRoof(state, graph, rooms);
  },
  
  rotateStair: function (state, graph, rooms, points, mouseX, mouseY, gridSpacing) {
    const roomId = this.selectRoom(graph, rooms);
    const filteredRooms = rooms.filter((r) => r.isStair && r.id === roomId);
    if (filteredRooms.length > 0) {
      editor.recordLastState();
      const room = filteredRooms[0];
      let midPts = this.getMidPoints(room, points);
  
      for (let i = 0; i < midPts.length; i++) {
        let dist = p5.dist(midPts[i].x, midPts[i].y, mouseX, mouseY);
        if (dist < 12) {
          if (room.type === 'stair1') {
            room.furniture[0].object.rotation = i === 3 ? 0 : (i + 1) * 90;
            editor.updateGraph(state);
            this.update(state);
            return;
          }
          if (room.type === 'stair2') {
            let currRotation = room.furniture[0].object.rotation;
            const removedRoom = editor.removeRoom(roomId, state);
            let { a, b } = removedRoom;
            removedRoom.prev = {
              a: a.clone(),
              b: b.clone(),
            };
            let newRoom;
            room.furniture[0].offX = 30;
            room.furniture[0].offY = 79;
            if (i === 0) {
              //TOP
              if (room.furniture[0].object.rotation === 180) return;
              room.furniture[0].object.rotation = 180;
            } else if (i === 1) {
              //RIGHT
              if (room.furniture[0].object.rotation === 270) return;
              room.furniture[0].object.rotation = 270;
            } else if (i === 2) {
              //BOTTOM
              if (room.furniture[0].object.rotation === 0) return;
              room.furniture[0].object.rotation = 0;
            } else if (i === 3) {
              //LEFT
              if (room.furniture[0].object.rotation === 90) return;
              room.furniture[0].object.rotation = 90;
            }
  
            this.checkCurrentRotationOfStair(i, currRotation, removedRoom);
  
            this.fixBoxCollisions(newRoom, state);
  
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
        }
      }
    }
  },
  
  checkCurrentRotationOfStair: function (i, currRotation, removedRoom) {
    if (currRotation === i * 90) {
      return editor.rotateRoom(removedRoom, 180);
    }
  
    return editor.rotateRoom(removedRoom, 90);
  },
  
  rotateRoof: function (state, graph, rooms) {
    if (editor.view === 'site') {
      let rooms1 = editor.lvl1.rooms;
      let pts1 = editor.lvl1.points;
      let rooms2 = editor.lvl2.rooms;
      let pts2 = editor.lvl2.points;
  
      let roomSelectedlvl1 = this.selectRoom(editor.lvl1.graph, rooms1);
      let roomSelectedlvl2 = this.selectRoom(editor.lvl2.graph, rooms2);
  
      editor.recordLastState();
  
      if (editor.lvl2.rooms.length > 0) {
        if (roomSelectedlvl2) {
          rooms2.forEach((room) => {
            if (room.id === roomSelectedlvl2) {
              room.rotateRoof += 1;
              if (room.rotateRoof > 4) room.rotateRoof = 1;
            }
          });
        }
      }
  
      if (roomSelectedlvl1) {
        rooms1.forEach((room) => {
          if (room.id === roomSelectedlvl1) {
            room.rotateRoof += 1;
            if (room.rotateRoof > 4) room.rotateRoof = 1;
          }
        });
      }
  
      editor.updateGraph(editor.currState);
      this.update(editor.currState);
      return;
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
  
        this.offsetX = this.roomSelected.a.x - this.worldX(this.mouseX);
        this.offsetY = this.roomSelected.a.y - this.worldY(this.mouseY);
        return;
      }
    }
  },