export const Ship = (length, name) => {
  let _timesHit = 0;
  let location = Array(length).fill(null);
  let _hits = [];

  const hit = (coord) => {
    // return if already sunk
    if (isSunk()) return;

    // return if ship has already been hit there
    let alreadyHitThere = _hits.find(
      (hit) => hit.x == coord.x && hit.y == coord.y,
    );
    if (alreadyHitThere) return;

    _timesHit++;
    _hits.push(coord);
  };

  const isSunk = () => {
    return _timesHit == length;
  };

  return {
    length,
    name,
    get timesHit() {
      return _timesHit;
    },
    location,
    get hits() {
      return _hits;
    },
    hit,
    isSunk,
  };
};
