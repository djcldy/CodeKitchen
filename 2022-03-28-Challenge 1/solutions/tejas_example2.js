/* 
Definition: This function snaps rooms to each other    
Psuedocode:
1. Measure rooms
2. Find relation between room
3. Move selected room based on relation
*/

function snapRoomsToEach({
  roomSelected,
  roomCollided,
  edgeDetection,
  canOverlap,
  points,
}) {
  /* if (!roomSelected.a.x) {
    let { a, b } = roomSelected;
    roomSelected.a = points[a];
    roomSelected.b = points[b];
  }

  let widthSelected = roomSelected.b.x - roomSelected.a.x;
  let heightSelected = roomSelected.b.y - roomSelected.a.y;
  let centerXSelected = roomSelected.a.x + widthSelected / 2;
  let centerYSelected = roomSelected.a.y + heightSelected / 2;

  if (!roomCollided.a.x) {
    let { a, b } = roomCollided;
    roomCollided.a = points[a];
    roomCollided.b = points[b];
  }

  let widthCollided = roomCollided.b.x - roomCollided.a.x;
  let heightCollided = roomCollided.b.y - roomCollided.a.y;
  let centerXCollided = roomCollided.a.x + widthCollided / 2;
  let centerYCollided = roomCollided.a.y + heightCollided / 2; */

  //measure center and dimensions of rooms and save them as their properties; decouple measuring function from this function
  const selected = measure(roomSelected);
  const collided = measure(roomCollided);

  /* //if selected room is above the colliding box
  if (Math.abs(roomSelected.b.y - roomCollided.a.y) < edgeDetection) {
    roomSelected.b.y = roomCollided.a.y;
    roomSelected.a.y = roomSelected.b.y - heightSelected;
  }

  //if selected room is below the colliding box
  else if (Math.abs(roomSelected.a.y - roomCollided.b.y) < edgeDetection) {
    roomSelected.a.y = roomCollided.b.y;
    roomSelected.b.y = roomSelected.a.y + heightSelected;
  }

  //if selected room is on the left to colliding box
  else if (Math.abs(roomSelected.b.x - roomCollided.a.x) < edgeDetection) {
    roomSelected.b.x = roomCollided.a.x;
    roomSelected.a.x = roomSelected.b.x - widthSelected;
  }

  //if selected room is on the right to colliding box
  else if (Math.abs(roomSelected.a.x - roomCollided.b.x) < edgeDetection) {
    roomSelected.a.x = roomCollided.b.x;
    roomSelected.b.x = roomSelected.a.x + widthSelected;
  }

  //if rooms can't overlap
  else if (!canOverlap) {
    //X axis
    //if selected room is inside the right part of the colliding box, move selected room right
    if (centerXSelected > centerXCollided) {
      //if vertical part of the selected room is "more inside" than horizontal:
      //if selected room is "more" inside into the lower part of the colliding box, move selected room down
      if (
        Math.abs(centerXSelected - centerXCollided) <
        Math.abs(centerYSelected - centerYCollided)
      ) {
        if (centerYSelected > centerYCollided) {
          roomSelected.a.y = roomCollided.b.y;
          roomSelected.b.y = roomSelected.a.y + heightSelected;

          //else move selected room up
        } else {
          roomSelected.b.y = roomCollided.a.y;
          roomSelected.a.y = roomSelected.b.y - heightSelected;
        }

        //else move room right
      } else {
        roomSelected.a.x = roomCollided.b.x;
        roomSelected.b.x = roomSelected.a.x + widthSelected;
      }
    }

    //if selected room is inside the left part of the colliding box, move selected room left
    else if (centerXSelected < centerXCollided) {
      //if vertical part of the selected room is "more inside" than horizontal:
      //if selected room is "more" inside into the lower part of the colliding box, move selected room down
      if (
        Math.abs(centerXSelected - centerXCollided) <
        Math.abs(centerYSelected - centerYCollided)
      ) {
        if (centerYSelected > centerYCollided) {
          roomSelected.a.y = roomCollided.b.y;
          roomSelected.b.y = roomSelected.a.y + heightSelected;

          //else move selected room up
        } else {
          roomSelected.b.y = roomCollided.a.y;
          roomSelected.a.y = roomSelected.b.y - heightSelected;
        }

        //else move room left
      } else {
        roomSelected.b.x = roomCollided.a.x;
        roomSelected.a.x = roomSelected.b.x - widthSelected;
      }
    }
  } */

  const { relationship, overlap } = getRoomRelationship(selected, collided);

  switch (relationship) {
    case "left":
      shiftRoom(selected, dir * overlap, dist);
      break;
    case "right":
      shiftRoom(selected, dir * overlap, dist);
      break;
    case "top":
      shiftRoom(selected, dir * overlap, dist);
      break;
    case "bottom":
      shiftRoom(selected, dir * overlap, dist);
      break;
    default:
      break;
  }
}

//function to measure props of rooms like width, length, center etc
function measure(room) {}

//find relation between 2 rooms like relative position, dist between and overlap
function getRoomRelationship(a, b) {}

//shift room by specific direction and distance
function shiftRoom(room, dir, dist) {}
