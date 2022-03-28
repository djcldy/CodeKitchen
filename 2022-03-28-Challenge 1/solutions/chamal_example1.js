findFixedRooms: function (rooms, graph, points) {
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
        stairPts.sort((a, b) => a.index - b.index);
        stairEdges.forEach((e) => e.sort((a, b) => a - b));

        return { stairPts, stairEdges };
      },

      rotateStair: function (state, room, midPointIdx) {
        const { gridSpacing } = state;
        const stair1Props = [90, 180, 270, 0];
        const stair2Props = [
          { rotation: 180, offX: 30, offY: 79, rotationToCheck: 0 },
          { rotation: 270, offX: 79, offY: 30, rotationToCheck: 90 },
          { rotation: 0, offX: 30, offY: 79, rotationToCheck: 180 },
          { rotation: 90, offX: 79, offY: 30, rotationToCheck: 270 },
        ];
        if (room.type === 'stair1') {
          room.furniture[0].object.rotation = stair1Props[midPointIdx];
          editor.updateGraph(state);
          this.update(state);
          return true;
        }
        const currRotation = room.furniture[0].object.rotation;

        if (room.furniture[0].object.rotation === stair2Props[midPointIdx].rotation) return;
        const removedRoom = editor.removeRoom(room.id, state);
        const { a, b } = removedRoom;
        removedRoom.prev = {
          a: a.clone(),
          b: b.clone(),
        };
        let newRoom;
        room.furniture[0].offX = stair2Props[midPointIdx].offX;
        room.furniture[0].offY = stair2Props[midPointIdx].offY;
        room.furniture[0].object.rotation = stair2Props[midPointIdx].rotation;

        if (currRotation === stair2Props[midPointIdx].rotationToCheck) {
          newRoom = editor.rotateRoom(removedRoom, 180);
        } else {
          newRoom = editor.rotateRoom(removedRoom, 90);
        }

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
        return true;
      },

      handleStairRotation: function (state) {
        const { graph, rooms } = state;
        const { points } = graph;
        const { mouseX, mouseY } = this.getWorldMouse();

        const roomId = this.selectRoom(graph, rooms);
        const filteredRooms = rooms.filter((r) => r.isStair && r.id === roomId);
        if (filteredRooms.length > 0) {
          const room = filteredRooms[0];
          let midPts = this.getMidPoints(room, points);

          for (let i = 0; i < midPts.length; i++) {
            let dist = p5.dist(midPts[i].x, midPts[i].y, mouseX, mouseY);
            if (dist < 12) {
              editor.recordLastState();
              editor.onHistoryRecorded();
              return this.rotateStair(state, room, i);
            }
          }
        }

        return false;
      },

      rotateRoof: function (roomSelected, rooms) {
        if (roomSelected) {
          editor.recordLastState();
          editor.onHistoryRecorded();
          rooms.forEach((room) => {
            if (room.id === roomSelected) {
              room.rotateRoof += 1;
              if (room.rotateRoof > 4) room.rotateRoof = 1;
            }
          });
          editor.updateGraph(editor.currState);
          this.update(editor.currState);
          return true;
        }
        return false;
      },

      handleRoofRotation: function () {
        if (editor.view === 'site') {
          let rooms1 = editor.lvl1.rooms;
          let rooms2 = editor.lvl2.rooms;

          let roomSelectedlvl1 = this.selectRoom(editor.lvl1.graph, rooms1);
          let roomSelectedlvl2 = this.selectRoom(editor.lvl2.graph, rooms2);

          if (editor.lvl2.rooms.length > 0) {
            if (this.rotateRoof(roomSelectedlvl2, rooms2)) {
              return true;
            }
            return this.rotateRoof(roomSelectedlvl1, rooms1);
          }
          return this.rotateRoof(roomSelectedlvl1, rooms1);
        }
        return false;
      },

      mousedown: function (state) {
        let { graph, rooms, furniture, elements, walls, gridSpacing } = state;
        let { points, edges } = graph;
        let { interior, exterior } = walls;

        this.push(); // do we need this?
        this.applyCamera(); // Apply Cam Transforms

        this.elementSelected = this.getOpenings([...interior, ...exterior], elements, points); // select door or window
        if (this.elementSelected) {
          editor.recordLastState();
          return;
        }

        this.pop(); // do we need this?

        let fixedRoom = this.findFixedRooms(rooms, graph, points);

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
        if (this.handleStairRotation(state)) {
          return;
        }

        //Roof Rotation
        if (this.handleRoofRotation()) {
          return;
        }
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
      },